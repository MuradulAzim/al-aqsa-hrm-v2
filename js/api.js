// Generic API layer
// No module-specific functions

// ============================================
// BACKEND CONFIGURATION
// ============================================
const BASE_URL = 'https://script.google.com/macros/s/AKfycbzRtOhNfBA7EAn-_prsrHRYeSpbfcdVG8F-w9HOsyLd667f8Ka4KP6M-y9u08Q8Jp3nNg/exec';
const USE_BACKEND = true;  // Set to false to use mock data for testing

// ============================================
// MOCK DATA STORE (for testing without backend)
// ============================================
const mockDataStore = {
    employees: [],
    guardDuty: [],
    clients: [],
    dayLabor: [],
    escortDuty: [],
    loanAdvance: [],
    salaryLedger: [],
    processedEvents: [],  // Track which events have been processed
    invoices: [],
    invoiceCounter: 1000,  // Starting invoice number
    fileUploads: [],  // File upload metadata storage
    jobPosts: [],  // Job circulars
    jobApplications: [],  // Job applications from candidates
    users: [
        // Default admin user (password: admin123)
        {
            id: 'user-admin-001',
            username: 'admin',
            passwordHash: 'admin123',  // In real app, this would be hashed
            role: 'Admin',
            status: 'Active',
            createdAt: '2026-01-01'
        }
    ]
};

// ============================================
// PERMISSION CONFIGURATION (for backend enforcement)
// ============================================
const BACKEND_PERMISSIONS = {
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

/**
 * Check permission for a role/module/action
 * @param {string} role - User role
 * @param {string} module - Module name
 * @param {string} action - Action (canAdd, canEdit, canDelete, canFinalize)
 * @returns {boolean}
 */
function checkPermission(role, module, action) {
    const perms = BACKEND_PERMISSIONS[role];
    if (!perms) return false;
    const modulePerms = perms[module];
    if (!modulePerms) return false;
    return modulePerms[action] === true;
}

/**
 * Get current user from session (mock - reads from localStorage in browser)
 * In real backend, this would verify JWT/session token
 */
function getSessionUser() {
    try {
        const session = localStorage.getItem('alaqsa_hrm_session');
        if (!session) return null;
        return JSON.parse(session);
    } catch (e) {
        return null;
    }
}

/**
 * Create unauthorized response
 */
function unauthorizedResponse(action) {
    return {
        success: false,
        action: action,
        data: null,
        message: "Unauthorized"
    };
}

/**
 * Generic API request function
 * @param {string} action - The action name to execute
 * @param {object} payload - The data payload for the request
 * @returns {Promise<object>} Response from backend or mock
 */
async function request(action, payload = {}) {
    // Use real backend if enabled
    if (USE_BACKEND) {
        try {
            // Get auth token from session
            const session = getSessionUser();
            const token = session?.token || null;
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',  // Required for CORS with GAS
                },
                body: JSON.stringify({
                    action: action,
                    payload: payload,
                    token: token
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Backend request failed:', error);
            return {
                success: false,
                action: action,
                data: null,
                message: 'Network error: ' + error.message
            };
        }
    }
    
    // Fall through to mock data for testing
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Handle mock actions for testing
    switch (action) {
        case "getEmployees":
            return {
                success: true,
                action: action,
                data: [...mockDataStore.employees],
                message: "Employees retrieved"
            };

        case "addOrUpdateEmployee":
            const existingIndex = mockDataStore.employees.findIndex(e => e.id === payload.id);
            if (existingIndex >= 0) {
                mockDataStore.employees[existingIndex] = { ...payload };
            } else {
                mockDataStore.employees.push({ ...payload });
            }
            return {
                success: true,
                action: action,
                data: payload,
                message: existingIndex >= 0 ? "Employee updated" : "Employee added"
            };

        case "deleteEmployee":
            const deleteIndex = mockDataStore.employees.findIndex(e => e.id === payload.id);
            if (deleteIndex >= 0) {
                mockDataStore.employees.splice(deleteIndex, 1);
                return {
                    success: true,
                    action: action,
                    data: null,
                    message: "Employee deleted"
                };
            }
            return {
                success: false,
                action: action,
                data: null,
                message: "Employee not found"
            };

        case "getGuardDuty":
            // Filter by date
            const filteredDuty = mockDataStore.guardDuty.filter(r => r.date === payload.date);
            return {
                success: true,
                action: action,
                data: [...filteredDuty],
                message: "Guard duty records retrieved"
            };

        case "addGuardDuty":
            mockDataStore.guardDuty.push({ ...payload });
            return {
                success: true,
                action: action,
                data: payload,
                message: "Guard duty record added"
            };

        case "deleteGuardDuty":
            const dutyDeleteIndex = mockDataStore.guardDuty.findIndex(r => r.id === payload.id);
            if (dutyDeleteIndex >= 0) {
                mockDataStore.guardDuty.splice(dutyDeleteIndex, 1);
                return {
                    success: true,
                    action: action,
                    data: null,
                    message: "Guard duty record deleted"
                };
            }
            return {
                success: false,
                action: action,
                data: null,
                message: "Guard duty record not found"
            };

        case "getDashboardStats":
            // Calculate today's date for guard duty stats
            const today = getTodayISO();
            const todayDuty = mockDataStore.guardDuty.filter(r => r.date === today);
            
            // Calculate employee stats
            const totalEmployees = mockDataStore.employees.length;
            const activeEmployees = mockDataStore.employees.filter(e => e.status === 'Active').length;
            const inactiveEmployees = totalEmployees - activeEmployees;
            
            // Calculate guard duty stats for today
            const todayTotal = todayDuty.length;
            const todayDayShift = todayDuty.filter(r => r.shift === 'Day').length;
            const todayNightShift = todayDuty.filter(r => r.shift === 'Night').length;
            const todayPresent = todayDuty.filter(r => r.status === 'Present').length;
            const todayAbsent = todayDuty.filter(r => r.status === 'Absent').length;
            const todayLate = todayDuty.filter(r => r.status === 'Late').length;
            
            return {
                success: true,
                action: action,
                data: {
                    employees: {
                        total: totalEmployees,
                        active: activeEmployees,
                        inactive: inactiveEmployees
                    },
                    guardDuty: {
                        todayTotal: todayTotal,
                        todayDayShift: todayDayShift,
                        todayNightShift: todayNightShift,
                        present: todayPresent,
                        absent: todayAbsent,
                        late: todayLate
                    }
                },
                message: "Dashboard stats retrieved"
            };

        case "getClients":
            return {
                success: true,
                action: action,
                data: [...mockDataStore.clients],
                message: "Clients retrieved"
            };

        case "addOrUpdateClient":
            const existingClientIndex = mockDataStore.clients.findIndex(c => c.id === payload.id);
            if (existingClientIndex >= 0) {
                mockDataStore.clients[existingClientIndex] = { ...payload };
            } else {
                mockDataStore.clients.push({ ...payload });
            }
            return {
                success: true,
                action: action,
                data: payload,
                message: existingClientIndex >= 0 ? "Client updated" : "Client added"
            };

        case "deleteClient":
            const clientDeleteIndex = mockDataStore.clients.findIndex(c => c.id === payload.id);
            if (clientDeleteIndex >= 0) {
                mockDataStore.clients.splice(clientDeleteIndex, 1);
                return {
                    success: true,
                    action: action,
                    data: null,
                    message: "Client deleted"
                };
            }
            return {
                success: false,
                action: action,
                data: null,
                message: "Client not found"
            };

        case "getDayLabor":
            // Filter by date
            const filteredLabor = mockDataStore.dayLabor.filter(r => r.date === payload.date);
            return {
                success: true,
                action: action,
                data: [...filteredLabor],
                message: "Day labor records retrieved"
            };

        case "addDayLabor":
            mockDataStore.dayLabor.push({ ...payload });
            return {
                success: true,
                action: action,
                data: payload,
                message: "Day labor record added"
            };

        case "deleteDayLabor":
            const laborDeleteIndex = mockDataStore.dayLabor.findIndex(r => r.id === payload.id);
            if (laborDeleteIndex >= 0) {
                mockDataStore.dayLabor.splice(laborDeleteIndex, 1);
                return {
                    success: true,
                    action: action,
                    data: null,
                    message: "Day labor record deleted"
                };
            }
            return {
                success: false,
                action: action,
                data: null,
                message: "Day labor record not found"
            };

        case "getEscortDuty":
            // Filter by date range - records that overlap with the requested range
            const filteredEscort = mockDataStore.escortDuty.filter(r => {
                return r.startDate <= payload.endDate && r.endDate >= payload.startDate;
            });
            return {
                success: true,
                action: action,
                data: [...filteredEscort],
                message: "Escort duty records retrieved"
            };

        case "addEscortDuty":
            mockDataStore.escortDuty.push({ ...payload });
            return {
                success: true,
                action: action,
                data: payload,
                message: "Escort duty record added"
            };

        case "deleteEscortDuty":
            const escortDeleteIndex = mockDataStore.escortDuty.findIndex(r => r.id === payload.id);
            if (escortDeleteIndex >= 0) {
                mockDataStore.escortDuty.splice(escortDeleteIndex, 1);
                return {
                    success: true,
                    action: action,
                    data: null,
                    message: "Escort duty record deleted"
                };
            }
            return {
                success: false,
                action: action,
                data: null,
                message: "Escort duty record not found"
            };

        case "getLoanAdvance":
            return {
                success: true,
                action: action,
                data: [...mockDataStore.loanAdvance],
                message: "Loan/advance records retrieved"
            };

        case "addLoanAdvance":
            mockDataStore.loanAdvance.push({ ...payload });
            return {
                success: true,
                action: action,
                data: payload,
                message: "Loan/advance record added"
            };

        case "deleteLoanAdvance":
            const loanDeleteIndex = mockDataStore.loanAdvance.findIndex(r => r.id === payload.id);
            if (loanDeleteIndex >= 0) {
                mockDataStore.loanAdvance.splice(loanDeleteIndex, 1);
                return {
                    success: true,
                    action: action,
                    data: null,
                    message: "Loan/advance record deleted"
                };
            }
            return {
                success: false,
                action: action,
                data: null,
                message: "Loan/advance record not found"
            };

        case "getSalaryLedger":
            // Filter by employeeId and/or month
            let filteredLedger = [...mockDataStore.salaryLedger];
            
            if (payload.employeeId) {
                filteredLedger = filteredLedger.filter(e => 
                    e.employeeName.toLowerCase().includes(payload.employeeId.toLowerCase()) ||
                    e.employeeId === payload.employeeId
                );
            }
            
            if (payload.month) {
                filteredLedger = filteredLedger.filter(e => e.month === payload.month);
            }
            
            return {
                success: true,
                action: action,
                data: filteredLedger,
                message: "Salary ledger retrieved"
            };

        case "generateSalary":
            // Process unprocessed events and generate salary ledger entries
            const newEntries = [];
            const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
            
            // Get current running balance for each employee
            const employeeBalances = {};
            mockDataStore.salaryLedger.forEach(entry => {
                employeeBalances[entry.employeeId] = entry.runningBalance;
            });
            
            // Process Guard Duty (if Present)
            mockDataStore.guardDuty.forEach(duty => {
                const eventKey = `guard-${duty.id}`;
                if (!mockDataStore.processedEvents.includes(eventKey) && duty.status === 'Present') {
                    const dailyRate = 500; // Default rate for demo
                    const earned = dailyRate;
                    const prevBalance = employeeBalances[duty.employeeId] || 0;
                    const newBalance = prevBalance + earned;
                    
                    newEntries.push({
                        id: 'SAL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        employeeId: duty.employeeId || 'EMP-' + duty.employeeName,
                        employeeName: duty.employeeName,
                        sourceModule: 'Guard',
                        sourceId: duty.id,
                        date: duty.date,
                        shiftOrHours: duty.shift,
                        earnedAmount: earned,
                        deductedAmount: 0,
                        netChange: earned,
                        runningBalance: newBalance,
                        month: duty.date.substring(0, 7),
                        createdAt: now
                    });
                    
                    employeeBalances[duty.employeeId] = newBalance;
                    mockDataStore.processedEvents.push(eventKey);
                }
            });
            
            // Process Day Labor
            mockDataStore.dayLabor.forEach(labor => {
                const eventKey = `labor-${labor.id}`;
                if (!mockDataStore.processedEvents.includes(eventKey)) {
                    const hours = Number(labor.hoursWorked) || 0;
                    const dailyRate = 500; // Default rate for demo
                    const earned = (hours / 9) * dailyRate;
                    const prevBalance = employeeBalances[labor.employeeId] || 0;
                    const newBalance = prevBalance + earned;
                    
                    newEntries.push({
                        id: 'SAL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        employeeId: labor.employeeId || 'EMP-' + labor.employeeName,
                        employeeName: labor.employeeName,
                        sourceModule: 'DayLabor',
                        sourceId: labor.id,
                        date: labor.date,
                        shiftOrHours: hours + ' hrs',
                        earnedAmount: parseFloat(earned.toFixed(2)),
                        deductedAmount: 0,
                        netChange: parseFloat(earned.toFixed(2)),
                        runningBalance: parseFloat(newBalance.toFixed(2)),
                        month: labor.date.substring(0, 7),
                        createdAt: now
                    });
                    
                    employeeBalances[labor.employeeId] = newBalance;
                    mockDataStore.processedEvents.push(eventKey);
                }
            });
            
            // Process Escort Duty (Active only)
            mockDataStore.escortDuty.forEach(escort => {
                const eventKey = `escort-${escort.id}`;
                if (!mockDataStore.processedEvents.includes(eventKey) && escort.status === 'Active') {
                    const dailyRate = 500; // Default rate for demo
                    const earned = (dailyRate * escort.totalDays) + (Number(escort.conveyance) || 0);
                    const prevBalance = employeeBalances[escort.employeeId] || 0;
                    const newBalance = prevBalance + earned;
                    
                    newEntries.push({
                        id: 'SAL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        employeeId: escort.employeeId || 'EMP-' + escort.employeeName,
                        employeeName: escort.employeeName,
                        sourceModule: 'Escort',
                        sourceId: escort.id,
                        date: escort.startDate,
                        shiftOrHours: escort.totalDays + ' days',
                        earnedAmount: parseFloat(earned.toFixed(2)),
                        deductedAmount: 0,
                        netChange: parseFloat(earned.toFixed(2)),
                        runningBalance: parseFloat(newBalance.toFixed(2)),
                        month: escort.startDate.substring(0, 7),
                        createdAt: now
                    });
                    
                    employeeBalances[escort.employeeId] = newBalance;
                    mockDataStore.processedEvents.push(eventKey);
                }
            });
            
            // Process Loan/Advance (Active only - as deductions)
            mockDataStore.loanAdvance.forEach(loan => {
                const eventKey = `loan-${loan.id}`;
                if (!mockDataStore.processedEvents.includes(eventKey) && loan.status === 'Active') {
                    const deducted = Number(loan.amount) || 0;
                    const prevBalance = employeeBalances[loan.employeeId] || 0;
                    const newBalance = prevBalance - deducted;
                    
                    newEntries.push({
                        id: 'SAL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        employeeId: loan.employeeId || 'EMP-' + loan.employeeName,
                        employeeName: loan.employeeName,
                        sourceModule: 'LoanAdvance',
                        sourceId: loan.id,
                        date: loan.issueDate,
                        shiftOrHours: loan.type,
                        earnedAmount: 0,
                        deductedAmount: deducted,
                        netChange: -deducted,
                        runningBalance: parseFloat(newBalance.toFixed(2)),
                        month: loan.issueDate.substring(0, 7),
                        createdAt: now
                    });
                    
                    employeeBalances[loan.employeeId] = newBalance;
                    mockDataStore.processedEvents.push(eventKey);
                }
            });
            
            // Append new entries to ledger
            mockDataStore.salaryLedger.push(...newEntries);
            
            return {
                success: true,
                action: action,
                data: { entriesGenerated: newEntries.length },
                message: `Generated ${newEntries.length} salary entries`
            };

        case "getInvoices":
            // Filter invoices by client and/or date range
            let filteredInvoices = [...mockDataStore.invoices];
            
            if (payload.clientId) {
                filteredInvoices = filteredInvoices.filter(i => 
                    i.clientName.toLowerCase().includes(payload.clientId.toLowerCase()) ||
                    i.clientId === payload.clientId
                );
            }
            
            if (payload.startDate) {
                filteredInvoices = filteredInvoices.filter(i => i.periodEnd >= payload.startDate);
            }
            
            if (payload.endDate) {
                filteredInvoices = filteredInvoices.filter(i => i.periodStart <= payload.endDate);
            }
            
            return {
                success: true,
                action: action,
                data: filteredInvoices,
                message: "Invoices retrieved"
            };

        case "generateInvoice":
            // Generate invoice from duty data
            const periodStart = payload.periodStart;
            const periodEnd = payload.periodEnd;
            const clientName = payload.clientName;
            const contactRate = Number(payload.contactRate) || 0;
            const vatPercent = Number(payload.vatPercent) || 0;
            
            // Calculate Escort Duty totals for this client/period
            const escortRecords = mockDataStore.escortDuty.filter(e => 
                e.clientName === clientName &&
                e.startDate <= periodEnd &&
                e.endDate >= periodStart &&
                e.status === 'Active'
            );
            const totalEscortDays = escortRecords.reduce((sum, e) => sum + (Number(e.totalDays) || 0), 0);
            const escortAmount = totalEscortDays * contactRate;
            
            // Calculate Guard Duty totals (Present only)
            const guardRecords = mockDataStore.guardDuty.filter(g => 
                g.clientName === clientName &&
                g.date >= periodStart &&
                g.date <= periodEnd &&
                g.status === 'Present'
            );
            const totalGuardDays = guardRecords.length;
            const guardAmount = totalGuardDays * contactRate;
            
            // Calculate Day Labor totals
            const laborRecords = mockDataStore.dayLabor.filter(l => 
                l.clientName === clientName &&
                l.date >= periodStart &&
                l.date <= periodEnd
            );
            const totalLaborHours = laborRecords.reduce((sum, l) => sum + (Number(l.hoursWorked) || 0), 0);
            const laborAmount = (totalLaborHours / 9) * contactRate; // 9 hours = 1 day
            
            // Calculate totals
            const subtotal = escortAmount + guardAmount + laborAmount;
            const vatAmount = subtotal * (vatPercent / 100);
            const totalAmount = subtotal + vatAmount;
            
            // Generate invoice number
            mockDataStore.invoiceCounter++;
            const invoiceNumber = 'INV-' + mockDataStore.invoiceCounter;
            
            const newInvoice = {
                id: 'INV-' + Date.now(),
                invoiceNumber: invoiceNumber,
                clientId: payload.clientId || '',
                clientName: clientName,
                periodStart: periodStart,
                periodEnd: periodEnd,
                totalEscortDays: totalEscortDays,
                escortAmount: parseFloat(escortAmount.toFixed(2)),
                totalGuardDays: totalGuardDays,
                guardAmount: parseFloat(guardAmount.toFixed(2)),
                totalLaborHours: totalLaborHours,
                laborAmount: parseFloat(laborAmount.toFixed(2)),
                subtotal: parseFloat(subtotal.toFixed(2)),
                vatPercent: vatPercent,
                vatAmount: parseFloat(vatAmount.toFixed(2)),
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                status: 'Draft',
                createdAt: getTodayISO()
            };
            
            mockDataStore.invoices.push(newInvoice);
            
            return {
                success: true,
                action: action,
                data: newInvoice,
                message: "Invoice generated"
            };

        case "finalizeInvoice":
            const invoiceToFinalize = mockDataStore.invoices.find(i => i.id === payload.id);
            if (!invoiceToFinalize) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Invoice not found"
                };
            }
            if (invoiceToFinalize.status !== 'Draft') {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Only draft invoices can be finalized"
                };
            }
            invoiceToFinalize.status = 'Finalized';
            return {
                success: true,
                action: action,
                data: invoiceToFinalize,
                message: "Invoice finalized"
            };

        case "markInvoicePaid":
            const invoiceToPay = mockDataStore.invoices.find(i => i.id === payload.id);
            if (!invoiceToPay) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Invoice not found"
                };
            }
            if (invoiceToPay.status !== 'Finalized') {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Only finalized invoices can be marked as paid"
                };
            }
            invoiceToPay.status = 'Paid';
            return {
                success: true,
                action: action,
                data: invoiceToPay,
                message: "Invoice marked as paid"
            };

        case "deleteInvoice":
            const invoiceIndex = mockDataStore.invoices.findIndex(i => i.id === payload.id);
            if (invoiceIndex < 0) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Invoice not found"
                };
            }
            if (mockDataStore.invoices[invoiceIndex].status !== 'Draft') {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Only draft invoices can be deleted"
                };
            }
            mockDataStore.invoices.splice(invoiceIndex, 1);
            return {
                success: true,
                action: action,
                data: null,
                message: "Invoice deleted"
            };

        // ============================================
        // FILE UPLOAD HANDLERS
        // ============================================
        case "uploadFile":
            const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const uploadNow = new Date();
            const uploadedAt = uploadNow.getFullYear() + '-' + 
                String(uploadNow.getMonth() + 1).padStart(2, '0') + '-' + 
                String(uploadNow.getDate()).padStart(2, '0') + ' ' + 
                String(uploadNow.getHours()).padStart(2, '0') + ':' + 
                String(uploadNow.getMinutes()).padStart(2, '0');
            
            const fileUpload = {
                id: fileId,
                module: payload.module,
                recordId: payload.recordId,
                fileName: payload.fileName,
                fileType: payload.fileType,
                fileSize: payload.fileSize,
                driveFileId: 'drive-' + fileId,  // Mock Drive ID
                driveUrl: 'https://drive.google.com/file/d/' + fileId + '/view',  // Mock URL
                uploadedAt: uploadedAt,
                uploadedBy: 'Current User'  // Would come from auth in real impl
            };
            mockDataStore.fileUploads.push(fileUpload);
            return {
                success: true,
                action: action,
                data: fileUpload,
                message: "File uploaded successfully"
            };

        case "getFiles":
            let filteredFiles = [...mockDataStore.fileUploads];
            
            // Filter by module if provided
            if (payload.module) {
                filteredFiles = filteredFiles.filter(f => f.module === payload.module);
            }
            
            // Filter by recordId if provided
            if (payload.recordId) {
                filteredFiles = filteredFiles.filter(f => f.recordId === payload.recordId);
            }
            
            return {
                success: true,
                action: action,
                data: filteredFiles,
                message: "Files retrieved"
            };

        case "deleteFile":
            const fileIndex = mockDataStore.fileUploads.findIndex(f => f.id === payload.id);
            if (fileIndex < 0) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "File not found"
                };
            }
            mockDataStore.fileUploads.splice(fileIndex, 1);
            return {
                success: true,
                action: action,
                data: null,
                message: "File deleted"
            };

        // ============================================
        // JOB POSTS HANDLERS
        // ============================================
        case "getJobPosts":
            let filteredJobPosts = [...mockDataStore.jobPosts];
            
            // Filter by status if provided
            if (payload.status) {
                filteredJobPosts = filteredJobPosts.filter(j => j.status === payload.status);
            }
            
            return {
                success: true,
                action: action,
                data: filteredJobPosts,
                message: "Job posts retrieved"
            };

        case "addJobPost":
            mockDataStore.jobPosts.push({ ...payload });
            return {
                success: true,
                action: action,
                data: payload,
                message: "Job post created"
            };

        case "updateJobPost":
            const jobPostIndex = mockDataStore.jobPosts.findIndex(j => j.id === payload.id);
            if (jobPostIndex < 0) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Job post not found"
                };
            }
            mockDataStore.jobPosts[jobPostIndex] = { ...payload };
            return {
                success: true,
                action: action,
                data: payload,
                message: "Job post updated"
            };

        case "deleteJobPost":
            const jobDeleteIndex = mockDataStore.jobPosts.findIndex(j => j.id === payload.id);
            if (jobDeleteIndex < 0) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Job post not found"
                };
            }
            // Check if any applications exist for this job
            const hasApplications = mockDataStore.jobApplications.some(a => a.jobId === payload.id);
            if (hasApplications) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Cannot delete job post with existing applications"
                };
            }
            mockDataStore.jobPosts.splice(jobDeleteIndex, 1);
            return {
                success: true,
                action: action,
                data: null,
                message: "Job post deleted"
            };

        // ============================================
        // JOB APPLICATIONS HANDLERS
        // ============================================
        case "getJobApplications":
            let filteredApplications = [...mockDataStore.jobApplications];
            
            // Filter by jobId if provided
            if (payload.jobId) {
                filteredApplications = filteredApplications.filter(a => a.jobId === payload.jobId);
            }
            
            // Filter by status if provided
            if (payload.status) {
                filteredApplications = filteredApplications.filter(a => a.status === payload.status);
            }
            
            return {
                success: true,
                action: action,
                data: filteredApplications,
                message: "Job applications retrieved"
            };

        case "addJobApplication":
            // Verify job exists and is open
            const targetJob = mockDataStore.jobPosts.find(j => j.id === payload.jobId);
            if (!targetJob) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Job post not found"
                };
            }
            if (targetJob.status !== 'Open') {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "This job is no longer accepting applications"
                };
            }
            mockDataStore.jobApplications.push({ ...payload });
            return {
                success: true,
                action: action,
                data: payload,
                message: "Application submitted successfully"
            };

        case "updateApplicationStatus":
            const appIndex = mockDataStore.jobApplications.findIndex(a => a.id === payload.id);
            if (appIndex < 0) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Application not found"
                };
            }
            mockDataStore.jobApplications[appIndex].status = payload.status;
            if (payload.notes !== undefined) {
                mockDataStore.jobApplications[appIndex].notes = payload.notes;
            }
            return {
                success: true,
                action: action,
                data: mockDataStore.jobApplications[appIndex],
                message: "Application status updated"
            };

        case "getJobApplication":
            const singleApp = mockDataStore.jobApplications.find(a => a.id === payload.id);
            if (!singleApp) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Application not found"
                };
            }
            return {
                success: true,
                action: action,
                data: singleApp,
                message: "Application retrieved"
            };

        // ========================================
        // USER MANAGEMENT & AUTHENTICATION
        // ========================================
        case "login":
            const loginUser = mockDataStore.users.find(
                u => u.username === payload.username && u.passwordHash === payload.password
            );
            if (!loginUser) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Invalid username or password"
                };
            }
            if (loginUser.status !== 'Active') {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Account is disabled"
                };
            }
            // Return user info (without password)
            const { passwordHash: _, ...safeUser } = loginUser;
            return {
                success: true,
                action: action,
                data: safeUser,
                message: "Login successful"
            };

        case "getUsers":
            // Permission check: Only Admin can view users
            const viewerUser = getSessionUser();
            if (!viewerUser || !checkPermission(viewerUser.role, 'UserManagement', 'canView')) {
                return unauthorizedResponse(action);
            }
            // Return users without passwords
            const safeUsers = mockDataStore.users.map(u => {
                const { passwordHash: _, ...safe } = u;
                return safe;
            });
            return {
                success: true,
                action: action,
                data: safeUsers,
                message: "Users retrieved"
            };

        case "addUser":
            // Permission check
            const adderUser = getSessionUser();
            if (!adderUser || !checkPermission(adderUser.role, 'UserManagement', 'canAdd')) {
                return unauthorizedResponse(action);
            }
            // Check username uniqueness
            const existingUser = mockDataStore.users.find(u => u.username === payload.username);
            if (existingUser) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Username already exists"
                };
            }
            const newUser = {
                id: payload.id,
                username: payload.username,
                passwordHash: payload.password,  // In real app, hash this
                role: payload.role,
                status: 'Active',
                createdAt: payload.createdAt || new Date().toISOString().split('T')[0]
            };
            mockDataStore.users.push(newUser);
            const { passwordHash: __, ...safeNewUser } = newUser;
            return {
                success: true,
                action: action,
                data: safeNewUser,
                message: "User created successfully"
            };

        case "updateUser":
            // Permission check
            const editorUser = getSessionUser();
            if (!editorUser || !checkPermission(editorUser.role, 'UserManagement', 'canEdit')) {
                return unauthorizedResponse(action);
            }
            const userIdx = mockDataStore.users.findIndex(u => u.id === payload.id);
            if (userIdx < 0) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "User not found"
                };
            }
            // Update allowed fields
            if (payload.role !== undefined) {
                mockDataStore.users[userIdx].role = payload.role;
            }
            if (payload.status !== undefined) {
                mockDataStore.users[userIdx].status = payload.status;
            }
            const { passwordHash: ___, ...safeUpdatedUser } = mockDataStore.users[userIdx];
            return {
                success: true,
                action: action,
                data: safeUpdatedUser,
                message: "User updated successfully"
            };

        case "resetPassword":
            // Permission check
            const resetterUser = getSessionUser();
            if (!resetterUser || !checkPermission(resetterUser.role, 'UserManagement', 'canEdit')) {
                return unauthorizedResponse(action);
            }
            const resetIdx = mockDataStore.users.findIndex(u => u.id === payload.id);
            if (resetIdx < 0) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "User not found"
                };
            }
            mockDataStore.users[resetIdx].passwordHash = payload.newPassword;
            return {
                success: true,
                action: action,
                data: null,
                message: "Password reset successfully"
            };

        case "deleteUser":
            // Permission check
            const deleterUser = getSessionUser();
            if (!deleterUser || !checkPermission(deleterUser.role, 'UserManagement', 'canDelete')) {
                return unauthorizedResponse(action);
            }
            const delIdx = mockDataStore.users.findIndex(u => u.id === payload.id);
            if (delIdx < 0) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "User not found"
                };
            }
            // Prevent deleting self
            if (deleterUser.id === payload.id) {
                return {
                    success: false,
                    action: action,
                    data: null,
                    message: "Cannot delete your own account"
                };
            }
            mockDataStore.users.splice(delIdx, 1);
            return {
                success: true,
                action: action,
                data: null,
                message: "User deleted"
            };

        default:
            // Default mocked response
            return {
                success: true,
                action: action,
                data: null,
                message: "Mocked response - backend not connected"
            };
    }
}
