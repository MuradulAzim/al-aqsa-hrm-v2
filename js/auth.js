// Authentication & Session Management
// Simple session-based auth using localStorage
// NO business logic - only auth state management

// ============================================
// SESSION STORAGE KEY
// ============================================
const SESSION_KEY = 'alaqsa_hrm_session';

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get current logged-in user
 * @returns {object|null} User object or null if not logged in
 */
function getCurrentUser() {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) return null;
        
        const user = JSON.parse(session);
        
        // Validate session structure
        if (!user || !user.id || !user.username || !user.role) {
            return null;
        }
        
        return user;
    } catch (error) {
        console.error('Error reading session:', error);
        return null;
    }
}

/**
 * Set current user session
 * @param {object} user - User object to store
 */
function setCurrentUser(user) {
    if (!user) {
        localStorage.removeItem(SESSION_KEY);
        return;
    }
    
    // Store all necessary fields including token
    const sessionData = {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        token: user.token || null
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

/**
 * Clear current session (logout)
 */
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Login user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<object>} Login result
 */
async function login(username, password) {
    if (!username || !password) {
        return {
            success: false,
            message: 'Username and password are required'
        };
    }
    
    try {
        const response = await request('login', {
            username: username,
            password: password
        });
        
        if (response.success && response.data) {
            // Check if user is disabled
            if (response.data.status === 'Disabled') {
                return {
                    success: false,
                    message: 'Your account has been disabled. Please contact an administrator.'
                };
            }
            
            setCurrentUser(response.data);
            return {
                success: true,
                message: 'Login successful',
                data: response.data
            };
        }
        
        // Use improved error message handling
        return {
            success: false,
            message: getErrorMessage(response)
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: 'An error occurred during login. Please try again.'
        };
    }
}

/**
 * Logout current user
 * CORRECTED: Now calls backend logout endpoint before clearing localStorage
 */
async function logout() {
    try {
        // Get token from session
        const session = getSessionUser();
        if (session && session.token) {
            // Call backend logout to invalidate token
            await request('logout', { token: session.token });
        }
    } catch (error) {
        console.error('Backend logout error (continuing anyway):', error);
    } finally {
        // Always clear local session
        clearSession();
        window.location.href = 'login.html';
    }
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
    const user = getCurrentUser();
    return user !== null && user.status !== 'Disabled';
}

/**
 * Require authentication - redirect to login if not authenticated
 * @returns {boolean} True if authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ============================================
// USER INFO DISPLAY
// ============================================

/**
 * Render user info in header
 * @param {string} containerId - Container element ID
 */
function renderUserInfo(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const user = getCurrentUser();
    
    if (!user) {
        container.innerHTML = `
            <a href="login.html" class="text-sm text-blue-600 hover:underline">Login</a>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="text-right">
                <div class="text-sm font-medium text-gray-700">${escapeHtmlAuth(user.username)}</div>
                <div class="text-xs text-gray-500">${user.role}</div>
            </div>
            <button onclick="logout()" 
                class="text-sm text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                title="Logout">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
            </button>
        </div>
    `;
}

/**
 * Escape HTML for auth display
 */
function escapeHtmlAuth(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================
// ROLE DISPLAY HELPERS
// ============================================

/**
 * Get role badge HTML
 * @param {string} role - Role name
 * @returns {string} HTML for role badge
 */
function getRoleBadge(role) {
    switch (role) {
        case 'Admin':
            return '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Admin</span>';
        case 'Supervisor':
            return '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Supervisor</span>';
        case 'Viewer':
            return '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Viewer</span>';
        default:
            return '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Unknown</span>';
    }
}

/**
 * Get status badge HTML
 * @param {string} status - Status (Active, Disabled)
 * @returns {string} HTML for status badge
 */
function getStatusBadgeAuth(status) {
    switch (status) {
        case 'Active':
            return '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>';
        case 'Disabled':
            return '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Disabled</span>';
        default:
            return '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Unknown</span>';
    }
}
