/**
 * Al-Aqsa HRM Backend - Google Apps Script
 * Main entry point - doPost and doGet handlers with action routing
 * 
 * VERSION: 1.1.0
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Create a new Google Apps Script project at script.google.com
 * 2. Copy all .gs files from this folder into the project
 * 3. Run setupDatabase() once from the Editor to create the spreadsheet
 * 4. Deploy as Web App with "Anyone" access
 * 5. Update BASE_URL in frontend js/api.js with the deployed URL
 */

// ============================================
// CONFIGURATION - SINGLE SOURCE OF TRUTH
// Configuration is now stored in PropertiesService to prevent
// stale deployment issues. Run setupDatabase() once to initialize.
// ============================================

// Fallback config (only used if PropertiesService is empty)
const CONFIG_FALLBACK = {
  SPREADSHEET_ID: '1vI2YMvuXHbF4tKbw6Bi-Z7X_nYCnUaZaj5bWglTdAlU',
  DRIVE_FOLDER_ID: '1pqa5gEMF2bppYpxDMLHSbeALNAvQkNNo',
  DEFAULT_DAILY_RATE: 500
};

// App version for deployment tracking
const APP_VERSION = '1.1.0';
const APP_DEPLOYMENT_DATE = '2026-02-16';

// Cached config to reduce PropertiesService calls
let _configCache = null;

/**
 * Get configuration from PropertiesService (single source of truth)
 * Falls back to hardcoded values only if PropertiesService is empty
 */
function getConfig() {
  if (_configCache) {
    return _configCache;
  }
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const storedConfig = scriptProps.getProperty('APP_CONFIG');
    
    if (storedConfig) {
      _configCache = JSON.parse(storedConfig);
    } else {
      // Use fallback and store it for future use
      _configCache = CONFIG_FALLBACK;
      scriptProps.setProperty('APP_CONFIG', JSON.stringify(CONFIG_FALLBACK));
    }
    
    return _configCache;
  } catch (error) {
    Logger.log('Error loading config: ' + error.toString());
    return CONFIG_FALLBACK;
  }
}

/**
 * Get a specific config value
 */
function getConfigValue(key) {
  const config = getConfig();
  return config[key];
}

// Shorthand accessors
const CONFIG = {
  get SPREADSHEET_ID() { return getConfigValue('SPREADSHEET_ID'); },
  get DRIVE_FOLDER_ID() { return getConfigValue('DRIVE_FOLDER_ID'); },
  get DEFAULT_DAILY_RATE() { return getConfigValue('DEFAULT_DAILY_RATE'); }
};

/**
 * Initialize configuration (called by setupDatabase)
 */
function initConfig(spreadsheetId, driveFolderId, defaultDailyRate) {
  const scriptProps = PropertiesService.getScriptProperties();
  const newConfig = {
    SPREADSHEET_ID: spreadsheetId,
    DRIVE_FOLDER_ID: driveFolderId,
    DEFAULT_DAILY_RATE: defaultDailyRate || 500
  };
  
  scriptProps.setProperty('APP_CONFIG', JSON.stringify(newConfig));
  _configCache = newConfig; // Update cache immediately
  
  return newConfig;
}

// Sheet names mapping
const SHEETS = {
  USERS: 'users',
  EMPLOYEES: 'employees',
  CLIENTS: 'clients',
  GUARD_DUTY: 'guardDuty',
  ESCORT_DUTY: 'escortDuty',
  DAY_LABOR: 'dayLabor',
  LOAN_ADVANCE: 'loanAdvance',
  SALARY_LEDGER: 'salaryLedger',
  PROCESSED_EVENTS: 'processedEvents',
  INVOICES: 'invoices',
  FILE_UPLOADS: 'fileUploads',
  JOB_POSTS: 'jobPosts',
  JOB_APPLICATIONS: 'jobApplications',
  PERMISSIONS: 'permissions'
};

// Permission matrix (same as frontend)
const BACKEND_PERMISSIONS = {
  Admin: {
    Employees: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    Clients: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    GuardDuty: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    EscortDuty: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    DayLabor: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    LoanAdvance: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    Salary: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    Invoices: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    JobPosts: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    JobApplications: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    UserManagement: { canView: true, canAdd: true, canEdit: true, canDelete: true }
  },
  Supervisor: {
    Employees: { canView: true, canAdd: true, canEdit: true, canDelete: false },
    Clients: { canView: true, canAdd: true, canEdit: true, canDelete: false },
    GuardDuty: { canView: true, canAdd: true, canEdit: true, canDelete: false },
    EscortDuty: { canView: true, canAdd: true, canEdit: true, canDelete: false },
    DayLabor: { canView: true, canAdd: true, canEdit: true, canDelete: false },
    LoanAdvance: { canView: true, canAdd: true, canEdit: true, canDelete: false },
    Salary: { canView: true, canAdd: true, canEdit: false, canDelete: false },
    Invoices: { canView: true, canAdd: true, canEdit: false, canDelete: false },
    JobPosts: { canView: true, canAdd: true, canEdit: true, canDelete: false },
    JobApplications: { canView: true, canAdd: false, canEdit: true, canDelete: false },
    UserManagement: { canView: false, canAdd: false, canEdit: false, canDelete: false }
  },
  Viewer: {
    Employees: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    Clients: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    GuardDuty: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    EscortDuty: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    DayLabor: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    LoanAdvance: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    Salary: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    Invoices: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    JobPosts: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    JobApplications: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    UserManagement: { canView: false, canAdd: false, canEdit: false, canDelete: false }
  }
};

// Public actions (no authentication required)
const PUBLIC_ACTIONS = ['getJobPosts', 'addJobApplication', 'getJobApplication', 'health', 'meta'];

// ============================================
// STARTUP VALIDATION
// ============================================

/**
 * Validate that required spreadsheet and sheets exist
 * Returns { valid: boolean, errors: string[] }
 */
function validateDatabase() {
  const errors = [];
  const config = getConfig();
  
  if (!config.SPREADSHEET_ID) {
    errors.push('SPREADSHEET_ID not configured. Run setupDatabase() first.');
    return { valid: false, errors: errors };
  }
  
  try {
    const ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
    if (!ss) {
      errors.push('Spreadsheet not accessible: ' + config.SPREADSHEET_ID);
      return { valid: false, errors: errors };
    }
    
    // Check required sheets
    const requiredSheets = [
      SHEETS.USERS,
      SHEETS.EMPLOYEES,
      SHEETS.CLIENTS,
      SHEETS.GUARD_DUTY,
      SHEETS.SALARY_LEDGER
    ];
    
    for (const sheetName of requiredSheets) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        errors.push('Required sheet missing: ' + sheetName);
      }
    }
    
    // Check Drive folder
    if (!config.DRIVE_FOLDER_ID) {
      errors.push('DRIVE_FOLDER_ID not configured');
    } else {
      try {
        const folder = DriveApp.getFolderById(config.DRIVE_FOLDER_ID);
        if (!folder) {
          errors.push('Drive folder not accessible: ' + config.DRIVE_FOLDER_ID);
        }
      } catch (e) {
        errors.push('Drive folder not accessible: ' + config.DRIVE_FOLDER_ID);
      }
    }
    
  } catch (error) {
    errors.push('Database validation error: ' + error.toString());
  }
  
  return { valid: errors.length === 0, errors: errors };
}

/**
 * Get startup validation status
 */
function getStartupStatus() {
  const validation = validateDatabase();
  const config = getConfig();
  
  return {
    appVersion: APP_VERSION,
    deploymentDate: APP_DEPLOYMENT_DATE,
    spreadsheetId: config.SPREADSHEET_ID || 'NOT_CONFIGURED',
    spreadsheetIdMasked: config.SPREADSHEET_ID ? 
      config.SPREADSHEET_ID.substring(0, 8) + '...' : 'NOT_CONFIGURED',
    driveFolderId: config.DRIVE_FOLDER_ID || 'NOT_CONFIGURED',
    databaseValid: validation.valid,
    errors: validation.errors,
    timestamp: new Date().toISOString()
  };
}

// Run startup validation on first request
let _startupValidated = false;
function ensureDatabaseValid() {
  if (_startupValidated) return;
  
  const validation = validateDatabase();
  if (!validation.valid) {
    Logger.log('Startup validation failed: ' + JSON.stringify(validation.errors));
  }
  _startupValidated = true;
}

// ============================================
// MAIN HANDLERS
// ============================================

/**
 * Handle GET requests
 */
function doGet(e) {
  return handleRequest(e, 'GET');
}

/**
 * Handle POST requests
 */
function doPost(e) {
  return handleRequest(e, 'POST');
}

/**
 * Main request handler - routes to appropriate handler
 * Now resilient to missing postData and detects GET downgrade
 */
function handleRequest(e, method) {
  try {
    // Run startup validation
    ensureDatabaseValid();
    
    // Parse request body
    let body = {};
    
    // CRITICAL: Handle missing postData properly
    // GAS redirects POST to GET can cause postData to be undefined
    if (!e.postData || !e.postData.contents) {
      // Check if this looks like a POST that lost its body (GAS 302 redirect issue)
      if (method === 'POST') {
        // Try to parse from parameter as fallback (less common)
        if (e.parameter && e.parameter.contents) {
          try {
            body = JSON.parse(e.parameter.contents);
          } catch (parseError) {
            // Return clear error for POST without body
            return jsonResponse({
              success: false,
              action: '',
              data: null,
              error: 'POST_REQUEST_ERROR',
              message: 'POST body missing. This may be due to a redirect. Please ensure your request is properly configured.'
            });
          }
        } else {
          // POST but no postData - return clear error
          return jsonResponse({
            success: false,
            action: '',
            data: null,
            error: 'POST_REQUEST_ERROR',
            message: 'POST body is required but was not received. Check your request configuration.'
          });
        }
      }
      // For GET, use parameters as query string
      if (method === 'GET') {
        body = e.parameter || {};
      }
    } else {
      // Normal case: postData exists
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseError) {
        return jsonResponse({
          success: false,
          action: '',
          data: null,
          error: 'JSON_PARSE_ERROR',
          message: 'Failed to parse request body: ' + parseError.toString()
        });
      }
    }
    
    const action = body.action || '';
    const payload = body.payload || {};
    const token = body.token || '';
    
    // Handle health and meta actions (public, no auth required)
    if (action === 'health') {
      const status = getStartupStatus();
      return jsonResponse({
        success: status.databaseValid,
        action: 'health',
        data: status,
        message: status.databaseValid ? 'System healthy' : 'System has configuration errors'
      });
    }
    
    if (action === 'meta') {
      const status = getStartupStatus();
      return jsonResponse({
        success: true,
        action: 'meta',
        data: {
          appVersion: status.appVersion,
          deploymentDate: status.deploymentDate,
          spreadsheetIdMasked: status.spreadsheetIdMasked,
          configSource: 'PropertiesService'
        },
        message: 'App metadata retrieved'
      });
    }
    
    // Refuse to process empty actions silently
    if (!action) {
      return jsonResponse({
        success: false,
        action: '',
        data: null,
        error: 'MISSING_ACTION',
        message: 'No action specified. Please provide an action in the request body.'
      });
    }
    
    // Check if action requires authentication
    let sessionUser = null;
    if (!PUBLIC_ACTIONS.includes(action)) {
      sessionUser = validateToken(token);
      if (!sessionUser && action !== 'login') {
        return jsonResponse({
          success: false,
          action: action,
          data: null,
          error: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
      }
    }
    
    // Route to appropriate handler
    const result = routeAction(action, payload, sessionUser);
    return jsonResponse(result);
    
  } catch (error) {
    Logger.log('Error in handleRequest: ' + error.toString());
    return jsonResponse({
      success: false,
      action: '',
      data: null,
      error: 'SERVER_ERROR',
      message: 'Server error: ' + error.toString()
    });
  }
}

/**
 * Route action to handler
 */
function routeAction(action, payload, sessionUser) {
  switch (action) {
    // Employees
    case 'getEmployees':
      return handleGetEmployees(payload, sessionUser);
    case 'addOrUpdateEmployee':
      return handleAddOrUpdateEmployee(payload, sessionUser);
    case 'deleteEmployee':
      return handleDeleteEmployee(payload, sessionUser);
      
    // Clients
    case 'getClients':
      return handleGetClients(payload, sessionUser);
    case 'addOrUpdateClient':
      return handleAddOrUpdateClient(payload, sessionUser);
    case 'deleteClient':
      return handleDeleteClient(payload, sessionUser);
      
    // Guard Duty
    case 'getGuardDuty':
      return handleGetGuardDuty(payload, sessionUser);
    case 'addGuardDuty':
      return handleAddGuardDuty(payload, sessionUser);
    case 'deleteGuardDuty':
      return handleDeleteGuardDuty(payload, sessionUser);
      
    // Day Labor
    case 'getDayLabor':
      return handleGetDayLabor(payload, sessionUser);
    case 'addDayLabor':
      return handleAddDayLabor(payload, sessionUser);
    case 'deleteDayLabor':
      return handleDeleteDayLabor(payload, sessionUser);
      
    // Escort Duty
    case 'getEscortDuty':
      return handleGetEscortDuty(payload, sessionUser);
    case 'addEscortDuty':
      return handleAddEscortDuty(payload, sessionUser);
    case 'deleteEscortDuty':
      return handleDeleteEscortDuty(payload, sessionUser);
      
    // Loan/Advance
    case 'getLoanAdvance':
      return handleGetLoanAdvance(payload, sessionUser);
    case 'addLoanAdvance':
      return handleAddLoanAdvance(payload, sessionUser);
    case 'deleteLoanAdvance':
      return handleDeleteLoanAdvance(payload, sessionUser);
      
    // Salary Ledger
    case 'getSalaryLedger':
      return handleGetSalaryLedger(payload, sessionUser);
    case 'generateSalary':
      return handleGenerateSalary(payload, sessionUser);
      
    // Invoices
    case 'getInvoices':
      return handleGetInvoices(payload, sessionUser);
    case 'generateInvoice':
      return handleGenerateInvoice(payload, sessionUser);
    case 'finalizeInvoice':
      return handleFinalizeInvoice(payload, sessionUser);
    case 'markInvoicePaid':
      return handleMarkInvoicePaid(payload, sessionUser);
    case 'deleteInvoice':
      return handleDeleteInvoice(payload, sessionUser);
      
    // File Uploads
    case 'uploadFile':
      return handleUploadFile(payload, sessionUser);
    case 'getFiles':
      return handleGetFiles(payload, sessionUser);
    case 'deleteFile':
      return handleDeleteFile(payload, sessionUser);
      
    // Job Posts (PUBLIC for getJobPosts with Open status)
    case 'getJobPosts':
      return handleGetJobPosts(payload, sessionUser);
    case 'addJobPost':
      return handleAddJobPost(payload, sessionUser);
    case 'updateJobPost':
      return handleUpdateJobPost(payload, sessionUser);
    case 'deleteJobPost':
      return handleDeleteJobPost(payload, sessionUser);
      
    // Job Applications (PUBLIC for addJobApplication)
    case 'getJobApplications':
      return handleGetJobApplications(payload, sessionUser);
    case 'addJobApplication':
      return handleAddJobApplication(payload, sessionUser);
    case 'updateApplicationStatus':
      return handleUpdateApplicationStatus(payload, sessionUser);
    case 'getJobApplication':
      return handleGetJobApplication(payload, sessionUser);
      
    // Dashboard
    case 'getDashboardStats':
      return handleGetDashboardStats(payload, sessionUser);
      
    // User Management & Auth
    case 'login':
      return handleLogin(payload);
    case 'logout':
      return handleLogout(payload);
    case 'getUsers':
      return handleGetUsers(payload, sessionUser);
    case 'addUser':
      return handleAddUser(payload, sessionUser);
    case 'updateUser':
      return handleUpdateUser(payload, sessionUser);
    case 'resetPassword':
      return handleResetPassword(payload, sessionUser);
    case 'deleteUser':
      return handleDeleteUser(payload, sessionUser);
      
    default:
      return {
        success: false,
        action: action,
        data: null,
        message: 'Unknown action: ' + action
      };
  }
}

/**
 * Create JSON response
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
