/**
 * Al-Aqsa HRM Backend - Google Apps Script
 * Main entry point - doPost and doGet handlers with action routing
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Create a new Google Apps Script project at script.google.com
 * 2. Copy all .gs files from this folder into the project
 * 3. Run setupDatabase() once from the Editor to create the spreadsheet
 * 4. Deploy as Web App with "Anyone" access
 * 5. Update BASE_URL in frontend js/api.js with the deployed URL
 */

// ============================================
// CONFIGURATION
// ============================================

// These will be set after running setupDatabase()
const CONFIG = {
  SPREADSHEET_ID: '1vI2YMvuXHbF4tKbw6Bi-Z7X_nYCnUaZaj5bWglTdAlU',
  DRIVE_FOLDER_ID: '1pqa5gEMF2bppYpxDMLHSbeALNAvQkNNo',
  DEFAULT_DAILY_RATE: 500  // Default rate for salary calculations
};

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
const PUBLIC_ACTIONS = ['getJobPosts', 'addJobApplication', 'getJobApplication'];

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
 */
function handleRequest(e, method) {
  try {
    // Parse request body
    let body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      body = e.parameter;
    }
    
    const action = body.action || '';
    const payload = body.payload || {};
    const token = body.token || '';
    
    // Check if action requires authentication
    let sessionUser = null;
    if (!PUBLIC_ACTIONS.includes(action)) {
      sessionUser = validateToken(token);
      if (!sessionUser && action !== 'login') {
        return jsonResponse({
          success: false,
          action: action,
          data: null,
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
