/**
 * Al-Aqsa HRM Backend - Authentication
 * Token-based authentication and user session management
 */

// Simple token store (in-memory for Apps Script)
// Note: In production, consider using CacheService for better persistence
const TOKEN_EXPIRY_HOURS = 24;

/**
 * Generate session token
 */
function generateToken(userId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 16);
  const token = Utilities.base64Encode(userId + ':' + timestamp + ':' + random);
  
  // Store token in PropertiesService
  const tokenStore = PropertiesService.getScriptProperties();
  const tokenData = {
    userId: userId,
    createdAt: timestamp,
    expiresAt: timestamp + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
  };
  tokenStore.setProperty('token_' + token, JSON.stringify(tokenData));
  
  return token;
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
