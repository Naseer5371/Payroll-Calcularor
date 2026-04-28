/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- TYPES ---
interface Employee {
    id: string;
    name: string;
    fatherName: string;
    cellNo: string;
    cnic: string;
    appointmentDate: string;
    designation: string;
    basicSalary: number;
    rentAllowance: number;
    travelAllowance: number;
    medicalAllowance: number;
    adhocAllowance: number;
    lateArrivalsDeduction: number;
    securityDeduction: number;
    leavesDeduction: number;
}

// --- STATE ---
let employees: Employee[] = [];
let editingEmployeeId: string | null = null;
let currentSlipEmployeeId: string | null = null;

// --- DOM ELEMENTS ---
const form = document.getElementById('employee-form') as HTMLFormElement;
const formTitle = document.getElementById('form-title') as HTMLHeadingElement;
const employeeIdInput = document.getElementById('employee-id') as HTMLInputElement;
const nameInput = document.getElementById('name') as HTMLInputElement;
const fatherNameInput = document.getElementById('father-name') as HTMLInputElement;
const cellNoInput = document.getElementById('cell-no') as HTMLInputElement;
const cnicInput = document.getElementById('cnic') as HTMLInputElement;
const appointmentDateInput = document.getElementById('appointment-date') as HTMLInputElement;
const designationInput = document.getElementById('designation') as HTMLInputElement;
const basicSalaryInput = document.getElementById('basic-salary') as HTMLInputElement;
const rentAllowanceInput = document.getElementById('rent-allowance') as HTMLInputElement;
const travelAllowanceInput = document.getElementById('travel-allowance') as HTMLInputElement;
const medicalAllowanceInput = document.getElementById('medical-allowance') as HTMLInputElement;
const adhocAllowanceInput = document.getElementById('adhoc-allowance') as HTMLInputElement;
const previousMonthDefault = document.getElementById('previous-monthdefault') as HTMLInputElement;
const lateArrivalsInput = document.getElementById('late-arrivals') as HTMLInputElement;
const securityInput = document.getElementById('security') as HTMLInputElement;
const leavesInput = document.getElementById('leaves') as HTMLInputElement;
const submitButton = document.getElementById('form-submit-btn') as HTMLButtonElement;
const cancelButton = document.getElementById('form-cancel-btn') as HTMLButtonElement;

const employeeList = document.getElementById('employee-list') as HTMLUListElement;
const downloadAllButton = document.getElementById('download-all-btn') as HTMLButtonElement;

const payslipModal = document.getElementById('payslip-modal') as HTMLDivElement;
const modalCloseButton = document.getElementById('modal-close-btn') as HTMLButtonElement;
const downloadSlipButton = document.getElementById('download-slip-btn') as HTMLButtonElement;
const payslipPreview = document.getElementById('payslip-preview') as HTMLDivElement;

// --- LOCAL STORAGE ---
const STORAGE_KEY = 'payroll_employees';

function saveEmployees() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

function loadEmployees() {
    const storedEmployees = localStorage.getItem(STORAGE_KEY);
    if (storedEmployees) {
        employees = JSON.parse(storedEmployees);
    }
}

// --- FORM HANDLING ---
function resetForm() {
    form.reset();
    employeeIdInput.value = '';
    editingEmployeeId = null;
    formTitle.textContent = 'Add New Employee';
    submitButton.textContent = 'Add Employee';
    cancelButton.classList.add('hidden');
}

function populateForm(employee: Employee) {
    editingEmployeeId = employee.id;
    employeeIdInput.value = employee.id;
    nameInput.value = employee.name;
    fatherNameInput.value = employee.fatherName;
    cellNoInput.value = employee.cellNo;
    cnicInput.value = employee.cnic;
    appointmentDateInput.value = employee.appointmentDate;
    designationInput.value = employee.designation;
    basicSalaryInput.value = employee.basicSalary.toString();
    rentAllowanceInput.value = employee.rentAllowance.toString();
    travelAllowanceInput.value = employee.travelAllowance.toString();
    medicalAllowanceInput.value = employee.medicalAllowance.toString();
    adhocAllowanceInput.value = employee.adhocAllowance.toString();
    previousMonthDefaultInput.value = employee.previousMonthDefault.toString();
    lateArrivalsInput.value = employee.lateArrivalsDeduction.toString();
    securityInput.value = employee.securityDeduction.toString();
    leavesInput.value = employee.leavesDeduction.toString();

    formTitle.textContent = 'Edit Employee';
    submitButton.textContent = 'Save Changes';
    cancelButton.classList.remove('hidden');
}

function handleFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    const employeeData: Employee = {
        id: editingEmployeeId || Date.now().toString(),
        name: nameInput.value,
        fatherName: fatherNameInput.value,
        cellNo: cellNoInput.value,
        cnic: cnicInput.value,
        appointmentDate: appointmentDateInput.value,
        designation: designationInput.value,
        basicSalary: parseFloat(basicSalaryInput.value) || 0,
        rentAllowance: parseFloat(rentAllowanceInput.value) || 0,
        travelAllowance: parseFloat(travelAllowanceInput.value) || 0,
        medicalAllowance: parseFloat(medicalAllowanceInput.value) || 0,
        adhocAllowance: parseFloat(adhocAllowanceInput.value) || 0,
        previousMonthDefault: parseFloat(previousMonthDefault.value) || 0,
        lateArrivalsDeduction: parseFloat(lateArrivalsInput.value) || 0,
        securityDeduction: parseFloat(securityInput.value) || 0,
        leavesDeduction: parseFloat(leavesInput.value) || 0,
    };

    if (editingEmployeeId) {
        const index = employees.findIndex(emp => emp.id === editingEmployeeId);
        if (index !== -1) {
            employees[index] = employeeData;
        }
    } else {
        employees.push(employeeData);
    }

    saveEmployees();
    renderEmployeeList();
    resetForm();
}

// --- UI RENDERING ---
function renderEmployeeList() {
    employeeList.innerHTML = '';
    if (employees.length === 0) {
        employeeList.innerHTML = '<li class="empty-list">No employees added yet.</li>';
        downloadAllButton.disabled = true;
        return;
    }
    downloadAllButton.disabled = false;
    employees.forEach(employee => {
        const li = document.createElement('li');
        li.className = 'employee-item';
        li.dataset.id = employee.id;
        li.innerHTML = `
            <div class="employee-info">
                <span class="employee-name">${employee.name}</span>
                <span class="employee-designation">${employee.designation}</span>
            </div>
            <div class="employee-actions">
                <button class="edit-btn" aria-label="Edit ${employee.name}">Edit</button>
                <button class="slip-btn" aria-label="Generate slip for ${employee.name}">Generate Slip</button>
                <button class="delete-btn" aria-label="Delete ${employee.name}">Delete</button>
            </div>
        `;
        employeeList.appendChild(li);
    });
}

function handleListClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const li = target.closest('.employee-item');
    if (!li) return;

    // Fix: Cast the 'Element' returned by 'closest' to 'HTMLElement' to access its 'dataset' property.
    const id = (li as HTMLElement).dataset.id;
    if (!id) return;

    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;

    if (target.classList.contains('edit-btn')) {
        populateForm(employee);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target.classList.contains('slip-btn')) {
        generatePayslip(employee);
    } else if (target.classList.contains('delete-btn')) {
        if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
            employees = employees.filter(emp => emp.id !== id);
            saveEmployees();
            renderEmployeeList();
        }
    }
}

// --- PAYSLIP & PDF ---
function generatePayslipContent(employee: Employee): string {
    const totalEarnings = employee.basicSalary + employee.rentAllowance + employee.travelAllowance + employee.medicalAllowance + employee.adhocAllowance+ employee.previousMonthDefault;
    const totalDeductions = employee.lateArrivalsDeduction + employee.securityDeduction + employee.leavesDeduction;
    const netSalary = totalEarnings - totalDeductions;
    const currentMonthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    return `
        <div class="payslip-header">
            <h2>The Right-Way Education System, Quetta.</h2>
            <p>Payslip for the month of ${currentMonthYear}</p>
        </div>
        <div class="payslip-body">
            <div class="payslip-section">
                <h4>Employee Details</h4>
                <p><strong>Name:</strong> ${employee.name}</p>
                <p><strong>Father's Name:</strong> ${employee.fatherName}</p>
                <p><strong>Designation:</strong> ${employee.designation}</p>
                <p><strong>Date of Appointment:</strong> ${new Date(employee.appointmentDate).toLocaleDateString()}</p>
            </div>
            <div class="payslip-tables">
                <table>
                    <thead><tr><th>Earnings</th><th>Amount</th></tr></thead>
                    <tbody>
                        <tr><td>Basic Salary</td><td>${employee.basicSalary.toFixed(2)}</td></tr>
                        <tr><td>Rent Allowance</td><td>${employee.rentAllowance.toFixed(2)}</td></tr>
                        <tr><td>Travel Allowance</td><td>${employee.travelAllowance.toFixed(2)}</td></tr>
                        <tr><td>Medical Allowance</td><td>${employee.medicalAllowance.toFixed(2)}</td></tr>
                        <tr><td>Adhoc Allowance</td><td>${employee.adhocAllowance.toFixed(2)}</td></tr>
                        <tr class="total"><td><strong>Total Earnings</strong></td><td><strong>${totalEarnings.toFixed(2)}</strong></td></tr>
                    </tbody>
                </table>
                <table>
                    <thead><tr><th>Deductions</th><th>Amount</th></tr></thead>
                    <tbody>
                        <tr><td>Late Arrivals</td><td>${employee.lateArrivalsDeduction.toFixed(2)}</td></tr>
                        <tr><td>Security</td><td>${employee.securityDeduction.toFixed(2)}</td></tr>
                        <tr><td>Leaves</td><td>${employee.leavesDeduction.toFixed(2)}</td></tr>
                        <tr class="total"><td><strong>Total Deductions</strong></td><td><strong>${totalDeductions.toFixed(2)}</strong></td></tr>
                    </tbody>
                </table>
            </div>
            <div class="payslip-footer">
                <p><strong>Net Salary: ${netSalary.toFixed(2)}</strong></p>
            </div>
        </div>
    `;
}


function generatePayslip(employee: Employee) {
    currentSlipEmployeeId = employee.id;
    payslipPreview.innerHTML = generatePayslipContent(employee);
    payslipModal.classList.remove('hidden');
}

function closeModal() {
    payslipModal.classList.add('hidden');
    payslipPreview.innerHTML = '';
    currentSlipEmployeeId = null;
}

async function downloadPdf(element: HTMLElement, filename: string) {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
}

async function handleDownloadSlip() {
    if (!currentSlipEmployeeId) return;
    const employee = employees.find(emp => emp.id === currentSlipEmployeeId);
    if (!employee) return;

    downloadSlipButton.disabled = true;
    downloadSlipButton.textContent = 'Downloading...';

    await downloadPdf(payslipPreview, `Payslip-${employee.name.replace(' ', '_')}.pdf`);
    
    downloadSlipButton.disabled = false;
    downloadSlipButton.textContent = 'Download PDF';
    closeModal();
}

async function handleDownloadAll() {
    if (employees.length === 0) return;
    
    downloadAllButton.disabled = true;
    downloadAllButton.textContent = 'Generating...';

    const pdf = new jsPDF('p', 'mm', 'a4');
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        if (i > 0) {
            pdf.addPage();
        }
        
        const slipContent = document.createElement('div');
        slipContent.className = 'payslip-preview-for-pdf';
        slipContent.innerHTML = generatePayslipContent(employee);
        tempContainer.appendChild(slipContent);

        const canvas = await html2canvas(slipContent, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        tempContainer.removeChild(slipContent);
    }
    
    document.body.removeChild(tempContainer);
    pdf.save('All_Payslips.pdf');
    
    downloadAllButton.disabled = false;
    downloadAllButton.textContent = 'Download All Slips';
}


// --- INITIALIZATION ---
function init() {
    form.addEventListener('submit', handleFormSubmit);
    cancelButton.addEventListener('click', resetForm);
    employeeList.addEventListener('click', handleListClick);
    modalCloseButton.addEventListener('click', closeModal);
    downloadSlipButton.addEventListener('click', handleDownloadSlip);
    downloadAllButton.addEventListener('click', handleDownloadAll);

    // Close modal on outside click
    payslipModal.addEventListener('click', (event) => {
        if (event.target === payslipModal) {
            closeModal();
        }
    });

    loadEmployees();
    renderEmployeeList();
}

// Start the app
init();
