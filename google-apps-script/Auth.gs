/**
 * Al-Aqsa HRM Backend - Authentication
 * Token-based authentication and user session management
 */

// Simple token store (in-memory for Apps Script)
// Note: In production, consider using CacheService for better persistence
const TOKEN_EXPIRY_HOURS = 24;
const MAX_TOKENS = 100; // Safety cap to prevent token accumulation

/**
 * Generate session token
 */
function generateToken(userId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 16);
  const token = Utilities.base64Encode(userId + ':' + timestamp + ':' + random);
  
  // Store token in PropertiesService
  const tokenStore = PropertiesService.getScriptProperties();
  
  // Safety cap: Prune oldest tokens if we're at the limit
  const tokenCount = countTokens();
  if (tokenCount >= MAX_TOKENS) {
    Logger.log('Token limit reached (' + MAX_TOKENS + '), pruning oldest tokens');
    pruneOldestTokens(10); // Remove 10 oldest tokens
  }
  
  const tokenData = {
    userId: userId,
    createdAt: timestamp,
    expiresAt: timestamp + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
  };
  tokenStore.setProperty('token_' + token, JSON.stringify(tokenData));
  
  return token;
}

/**
 * Count active tokens
 */
function countTokens() {
  const tokenStore = PropertiesService.getScriptProperties();
  const allProperties = tokenStore.getProperties();
  let count = 0;
  
  Object.keys(allProperties).forEach(key => {
    if (key.startsWith('token_')) {
      count++;
    }
  });
  
  return count;
}

/**
 * Prune oldest tokens to prevent accumulation
 */
function pruneOldestTokens(count) {
  const tokenStore = PropertiesService.getScriptProperties();
  const allProperties = tokenStore.getProperties();
  const tokens = [];
  
  // Collect all tokens with their creation time
  Object.keys(allProperties).forEach(key => {
    if (key.startsWith('token_')) {
      try {
        const tokenData = JSON.parse(allProperties[key]);
        tokens.push({ key: key, createdAt: tokenData.createdAt });
      } catch (e) {
        // Invalid token, remove it
        tokenStore.deleteProperty(key);
      }
    }
  });
  
  // Sort by creation time (oldest first)
  tokens.sort((a, b) => a.createdAt - b.createdAt);
  
  // Remove the oldest 'count' tokens
  const toRemove = tokens.slice(0, count);
  toRemove.forEach(t => {
    tokenStore.deleteProperty(t.key);
    Logger.log('Pruned token: ' + t.key);
  });
  
  return toRemove.length;
}

/**
 * Validate token and return user
 */
function validateToken(token) {
  if (!token) {
    return null;
  }
  
  try {
    const tokenStore = PropertiesService.getScriptProperties();
    const tokenDataStr = tokenStore.getProperty('token_' + token);
    
    if (!tokenDataStr) {
      return null;
    }
    
    const tokenData = JSON.parse(tokenDataStr);
    
    // Check expiry
    if (Date.now() > tokenData.expiresAt) {
      // Clean up expired token
      tokenStore.deleteProperty('token_' + token);
      return null;
    }
    
    // Fetch user from database using indexed lookup by id
    const indexedUsers = getIndexedSheet(SHEETS.USERS, 'id');
    const user = getFromIndex(indexedUsers, tokenData.userId);
    if (!user || user.status !== 'Active') {
      return null;
    }
    
    // Return user without password
    const { passwordHash, ...safeUser } = user;
    return safeUser;
    
  } catch (error) {
    Logger.log('Token validation error: ' + error.toString());
    return null;
  }
}

/**
 * Invalidate token (logout)
 */
function invalidateToken(token) {
  if (!token) {
    return false;
  }
  
  try {
    const tokenStore = PropertiesService.getScriptProperties();
    tokenStore.deleteProperty('token_' + token);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Handle login
 */
function handleLogin(payload) {
  const { username, password } = payload;
  
  if (!username || !password) {
    return {
      success: false,
      action: 'login',
      data: null,
      message: 'Username and password required'
    };
  }
  
  // Use indexed lookup by username for fast authentication
  const indexedUsers = getIndexedSheet(SHEETS.USERS, 'username');
  const user = getFromIndex(indexedUsers, username);
  
  if (!user) {
    return {
      success: false,
      action: 'login',
      data: null,
      message: 'Invalid username or password'
    };
  }
  
  // Verify password (in production, use proper hashing)
  if (user.passwordHash !== password) {
    return {
      success: false,
      action: 'login',
      data: null,
      message: 'Invalid username or password'
    };
  }
  
  // Check if account is active
  if (user.status !== 'Active') {
    return {
      success: false,
      action: 'login',
      data: null,
      message: 'Account is disabled'
    };
  }
  
  // Generate token
  const token = generateToken(user.id);
  
  // Return user info without password
  const { passwordHash, ...safeUser } = user;
  
  return {
    success: true,
    action: 'login',
    data: {
      ...safeUser,
      token: token
    },
    message: 'Login successful'
  };
}

/**
 * Handle logout
 */
function handleLogout(payload) {
  const { token } = payload;
  invalidateToken(token);
  
  return {
    success: true,
    action: 'logout',
    data: null,
    message: 'Logged out successfully'
  };
}

/**
 * Clean up expired tokens (run periodically via trigger)
 */
function cleanupExpiredTokens() {
  try {
    const tokenStore = PropertiesService.getScriptProperties();
    const allProperties = tokenStore.getProperties();
    const now = Date.now();
    let cleanedCount = 0;
    
    Object.keys(allProperties).forEach(key => {
      if (key.startsWith('token_')) {
        try {
          const tokenData = JSON.parse(allProperties[key]);
          if (now > tokenData.expiresAt) {
            tokenStore.deleteProperty(key);
            cleanedCount++;
          }
        } catch (e) {
          // Invalid token data, remove it
          tokenStore.deleteProperty(key);
          cleanedCount++;
        }
      }
    });
    
    Logger.log('Cleaned up ' + cleanedCount + ' expired tokens');
    return cleanedCount;
    
  } catch (error) {
    Logger.log('Token cleanup error: ' + error.toString());
    return 0;
  }
}

/**
 * Install token cleanup trigger (run once to set up)
 * This creates a daily trigger to clean up expired tokens
 */
function installTokenCleanupTrigger() {
  // Delete any existing triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'cleanupExpiredTokens') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new daily trigger
  ScriptApp.newTrigger('cleanupExpiredTokens')
    .timeBased()
    .everyDays(1)
    .create();
  
  Logger.log('Token cleanup trigger installed - will run daily');
  return 'Token cleanup trigger installed';
}
