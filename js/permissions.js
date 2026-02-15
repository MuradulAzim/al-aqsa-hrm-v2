// Role & Permission System
// SINGLE SOURCE OF TRUTH for all permissions
// NO business logic here - only permission DATA

// ============================================
// PERMISSION CONFIGURATION (LOCKED)
// ============================================

const PERMISSIONS = {
    Admin: {
        Employees:       { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: true },
        Clients:         { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: true },
        GuardDuty:       { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: true },
        EscortDuty:      { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: true },
        DayLabor:        { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: true },
        LoanAdvance:     { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: true },
        Salary:          { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: true },
        Invoice:         { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: true },
        JobPosts:        { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: true },
        JobApplications: { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: true },
        UserManagement:  { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: true }
    },
    Supervisor: {
        Employees:       { canView: true, canAdd: true, canEdit: true, canDelete: false, canFinalize: false },
        Clients:         { canView: true, canAdd: true, canEdit: true, canDelete: false, canFinalize: false },
        GuardDuty:       { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: false },
        EscortDuty:      { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: false },
        DayLabor:        { canView: true, canAdd: true, canEdit: true, canDelete: true, canFinalize: false },
        LoanAdvance:     { canView: true, canAdd: true, canEdit: true, canDelete: false, canFinalize: false },
        Salary:          { canView: true, canAdd: true, canEdit: false, canDelete: false, canFinalize: false },
        Invoice:         { canView: true, canAdd: true, canEdit: true, canDelete: false, canFinalize: false },
        JobPosts:        { canView: true, canAdd: true, canEdit: true, canDelete: false, canFinalize: false },
        JobApplications: { canView: true, canAdd: false, canEdit: true, canDelete: false, canFinalize: false },
        UserManagement:  { canView: false, canAdd: false, canEdit: false, canDelete: false, canFinalize: false }
    },
    Viewer: {
        Employees:       { canView: true, canAdd: false, canEdit: false, canDelete: false, canFinalize: false },
        Clients:         { canView: true, canAdd: false, canEdit: false, canDelete: false, canFinalize: false },
        GuardDuty:       { canView: true, canAdd: false, canEdit: false, canDelete: false, canFinalize: false },
        EscortDuty:      { canView: true, canAdd: false, canEdit: false, canDelete: false, canFinalize: false },
        DayLabor:        { canView: true, canAdd: false, canEdit: false, canDelete: false, canFinalize: false },
        LoanAdvance:     { canView: true, canAdd: false, canEdit: false, canDelete: false, canFinalize: false },
        Salary:          { canView: true, canAdd: false, canEdit: false, canDelete: false, canFinalize: false },
        Invoice:         { canView: true, canAdd: false, canEdit: false, canDelete: false, canFinalize: false },
        JobPosts:        { canView: true, canAdd: false, canEdit: false, canDelete: false, canFinalize: false },
        JobApplications: { canView: true, canAdd: false, canEdit: false, canDelete: false, canFinalize: false },
        UserManagement:  { canView: false, canAdd: false, canEdit: false, canDelete: false, canFinalize: false }
    }
};

// Module to page mapping for navigation
const MODULE_PAGES = {
    Employees:       { page: 'employees.html', label: 'Employees', description: 'Manage employee records' },
    Clients:         { page: 'clients.html', label: 'Clients', description: 'Manage client accounts' },
    GuardDuty:       { page: 'guard-duty.html', label: 'Guard Duty', description: 'Daily attendance tracking' },
    EscortDuty:      { page: 'escort-duty.html', label: 'Escort Duty', description: 'Track escort assignments' },
    DayLabor:        { page: 'day-labor.html', label: 'Day Labor', description: 'Track daily labor & wages' },
    LoanAdvance:     { page: 'loan-advance.html', label: 'Loan & Advance', description: 'Manage loans & advances' },
    Salary:          { page: 'salary.html', label: 'Salary Management', description: 'Attendance-based salary ledger' },
    Invoice:         { page: 'invoices.html', label: 'Invoice Management', description: 'Client billing & invoices' },
    JobPosts:        { page: 'job-posts.html', label: 'Job Posts', description: 'Manage job circulars' },
    JobApplications: { page: 'job-applications.html', label: 'Job Applications', description: 'Review candidate applications' },
    UserManagement:  { page: 'user-management.html', label: 'User Management', description: 'Manage system users' }
};

// ============================================
// PERMISSION LOADER
// ============================================

/**
 * Load permissions for a role
 * @param {string} role - Role name (Admin, Supervisor, Viewer)
 * @returns {object} Permission set for the role
 */
function loadPermissions(role) {
    return PERMISSIONS[role] || PERMISSIONS.Viewer;  // Default to most restrictive
}

/**
 * Get current user's permissions
 * @returns {object} Permission set for current user
 */
function getCurrentPermissions() {
    const user = getCurrentUser();
    if (!user || !user.role) {
        return PERMISSIONS.Viewer;  // Default to most restrictive
    }
    return loadPermissions(user.role);
}

// ============================================
// PERMISSION GUARD FUNCTIONS
// ============================================

/**
 * Check if current user can view a module
 * @param {string} module - Module name
 * @returns {boolean}
 */
function canView(module) {
    const perms = getCurrentPermissions();
    return perms[module]?.canView === true;
}

/**
 * Check if current user can add to a module
 * @param {string} module - Module name
 * @returns {boolean}
 */
function canAdd(module) {
    const perms = getCurrentPermissions();
    return perms[module]?.canAdd === true;
}

/**
 * Check if current user can edit in a module
 * @param {string} module - Module name
 * @returns {boolean}
 */
function canEdit(module) {
    const perms = getCurrentPermissions();
    return perms[module]?.canEdit === true;
}

/**
 * Check if current user can delete in a module
 * @param {string} module - Module name
 * @returns {boolean}
 */
function canDelete(module) {
    const perms = getCurrentPermissions();
    return perms[module]?.canDelete === true;
}

/**
 * Check if current user can finalize in a module
 * @param {string} module - Module name
 * @returns {boolean}
 */
function canFinalize(module) {
    const perms = getCurrentPermissions();
    return perms[module]?.canFinalize === true;
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

/**
 * Get visible menu items for current user
 * @returns {Array} Array of menu items user can see
 */
function getVisibleMenuItems() {
    const items = [];
    for (const [module, pageInfo] of Object.entries(MODULE_PAGES)) {
        if (canView(module)) {
            items.push({
                module: module,
                ...pageInfo
            });
        }
    }
    return items;
}

/**
 * Apply permission to a button element
 * @param {HTMLElement} button - Button element
 * @param {string} module - Module name
 * @param {string} action - Action type (add, edit, delete, finalize)
 */
function applyPermissionToButton(button, module, action) {
    if (!button) return;
    
    let hasPermission = false;
    
    switch (action) {
        case 'add':
            hasPermission = canAdd(module);
            break;
        case 'edit':
            hasPermission = canEdit(module);
            break;
        case 'delete':
            hasPermission = canDelete(module);
            break;
        case 'finalize':
            hasPermission = canFinalize(module);
            break;
        default:
            hasPermission = canView(module);
    }
    
    if (!hasPermission) {
        button.disabled = true;
        button.classList.add('opacity-50', 'cursor-not-allowed');
        button.title = 'Permission denied';
        
        // Remove onclick handler
        button.onclick = (e) => {
            e.preventDefault();
            showPermissionDenied();
        };
    }
}

/**
 * Hide element if user lacks permission
 * @param {HTMLElement} element - Element to hide
 * @param {string} module - Module name
 * @param {string} action - Action type
 */
function hideIfNoPermission(element, module, action) {
    if (!element) return;
    
    let hasPermission = false;
    
    switch (action) {
        case 'view':
            hasPermission = canView(module);
            break;
        case 'add':
            hasPermission = canAdd(module);
            break;
        case 'edit':
            hasPermission = canEdit(module);
            break;
        case 'delete':
            hasPermission = canDelete(module);
            break;
        case 'finalize':
            hasPermission = canFinalize(module);
            break;
        default:
            hasPermission = false;
    }
    
    if (!hasPermission) {
        element.style.display = 'none';
    }
}

/**
 * Show permission denied message
 */
function showPermissionDenied() {
    alert('Permission denied. You do not have access to perform this action.');
}

/**
 * Check if user is authenticated and authorized to access a page
 * @param {string} module - Module name for the page
 * @returns {boolean}
 */
function checkPageAccess(module) {
    const user = getCurrentUser();
    
    // Check if user is logged in
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Check if user is disabled
    if (user.status === 'Disabled') {
        alert('Your account has been disabled. Please contact an administrator.');
        logout();
        return false;
    }
    
    // Check if user can view this module
    if (!canView(module)) {
        alert('You do not have permission to access this page.');
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return true;
}

/**
 * Initialize permission-based UI for a module
 * @param {string} module - Module name
 */
function initPermissionUI(module) {
    // Apply permissions to buttons with data-permission attribute
    document.querySelectorAll('[data-permission]').forEach(el => {
        const action = el.dataset.permission;
        applyPermissionToButton(el, module, action);
    });
    
    // Hide elements with data-hide-no-permission attribute
    document.querySelectorAll('[data-hide-no-permission]').forEach(el => {
        const action = el.dataset.hideNoPermission;
        hideIfNoPermission(el, module, action);
    });
}
