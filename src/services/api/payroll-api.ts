// src/services/api/payroll-api.ts
import { makeAuthenticatedRequest } from "../auth.ts";
import { getDepartments } from "./hr-api.ts";

// Payroll API Types (based on actual API spec)
export interface PayrollShift {
  id: number;
  employeeId: number;
  shiftTypeId: number;
  employeeGroupId: number;
  positionId: number;
  departmentId: number;
  date: string;
  salaryCode: string;
  salary: number;
  start: string;
  end: string;
  shiftDuration: string;
  wage: {
    rate: number;
    type: string;
  };
  supplements?: PayrollSupplement[];
  breaks?: PayrollBreak[];
}

export interface PayrollSupplement {
  id: number;
  name: string;
  duration: number;
  salaryCode: string;
  modification: number;
  start: string;
  end: string;
}

export interface PayrollBreak {
  id: number;
  start: string;
  end: string;
  duration: number;
  title: string;
  amount: number;
  modification: number;
  isPaid: boolean;
}

export interface SupplementPayroll {
  salaryCode: string;
  name: string;
  wage: number;
  salary: number;
  end: string;
  units: number;
  start: string;
  date: string;
  employeeId: number;
}

export interface SalariedPayroll {
  salaryCode: string;
  wage: number;
  salary: number;
  end: string;
  units: number;
  start: string;
  date: string;
  employeeId: number;
}

export interface PayrollData {
  shiftsPayroll: PayrollShift[];
  supplementsPayroll: SupplementPayroll[];
  salariedPayroll: SalariedPayroll[];
  currencySymbol: string;
  currencyFormatString: string;
}

/**
 * Get detailed payroll data for a date range
 * IMPORTANT: departmentIds is REQUIRED by the API
 */
export async function getPayrollData(
  startDate: string, 
  endDate: string,
  options: { 
    departmentIds?: number[]; 
    shiftStatus?: 'Approved' | 'Nonapproved';
    returnFullSalaryForMonthlyPaid?: boolean;
  } = {}
): Promise<PayrollData> {
  
  // If no specific departments provided, fetch ALL departments and use their IDs
  let departmentIds = options.departmentIds;
  if (!departmentIds || departmentIds.length === 0) {
    try {
      const allDepartments = await getDepartments();
      departmentIds = allDepartments.map(dept => dept.id);
      
      if (departmentIds.length === 0) {
        throw new Error('No departments found in the portal');
      }
    } catch (error) {
      throw new Error(`Failed to fetch departments for payroll query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Build query parameters according to API spec
  const params = new URLSearchParams({
    from: startDate,  // Correct parameter name
    to: endDate,      // Correct parameter name
    departmentIds: departmentIds.join(','), // Required: comma-separated list
  });

  if (options.shiftStatus) {
    params.append('shiftStatus', options.shiftStatus);
  }

  if (options.returnFullSalaryForMonthlyPaid !== undefined) {
    params.append('returnFullSalaryForMonthlyPaid', options.returnFullSalaryForMonthlyPaid.toString());
  }

  const response = await makeAuthenticatedRequest(
    `https://openapi.planday.com/payroll/v1.0/payroll?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch payroll data: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  
  // API returns data directly (not wrapped in 'data' property based on spec)
  return result;
}

/**
 * Get payroll data for specific departments only
 */
export async function getPayrollDataByDepartments(
  startDate: string,
  endDate: string,
  departmentIds: number[],
  options: {
    shiftStatus?: 'Approved' | 'Nonapproved';
    returnFullSalaryForMonthlyPaid?: boolean;
  } = {}
): Promise<PayrollData> {
  return getPayrollData(startDate, endDate, {
    ...options,
    departmentIds
  });
}

/**
 * Calculate total cost from payroll data
 */
export function calculatePayrollTotals(payrollData: PayrollData) {
  const shiftCosts = payrollData.shiftsPayroll?.reduce((sum, shift) => sum + (shift.salary || 0), 0) || 0;
  const supplementCosts = payrollData.supplementsPayroll?.reduce((sum, supp) => sum + (supp.salary || 0), 0) || 0;
  const salariedCosts = payrollData.salariedPayroll?.reduce((sum, sal) => sum + (sal.salary || 0), 0) || 0;
  
  return {
    shiftCosts,
    supplementCosts, 
    salariedCosts,
    totalCost: shiftCosts + supplementCosts + salariedCosts,
    currency: payrollData.currencySymbol || '$'
  };
}

/**
 * Group payroll data by employee
 */
export function groupPayrollByEmployee(payrollData: PayrollData) {
  const employeeMap = new Map();

  // Process shifts
  payrollData.shiftsPayroll?.forEach(shift => {
    if (!employeeMap.has(shift.employeeId)) {
      employeeMap.set(shift.employeeId, {
        employeeId: shift.employeeId,
        shifts: [],
        supplements: [],
        salaries: [],
        totalCost: 0
      });
    }
    const employee = employeeMap.get(shift.employeeId);
    employee.shifts.push(shift);
    employee.totalCost += shift.salary || 0;
  });

  // Process supplements
  payrollData.supplementsPayroll?.forEach(supplement => {
    if (!employeeMap.has(supplement.employeeId)) {
      employeeMap.set(supplement.employeeId, {
        employeeId: supplement.employeeId,
        shifts: [],
        supplements: [],
        salaries: [],
        totalCost: 0
      });
    }
    const employee = employeeMap.get(supplement.employeeId);
    employee.supplements.push(supplement);
    employee.totalCost += supplement.salary || 0;
  });

  // Process salaries
  payrollData.salariedPayroll?.forEach(salary => {
    if (!employeeMap.has(salary.employeeId)) {
      employeeMap.set(salary.employeeId, {
        employeeId: salary.employeeId,
        shifts: [],
        supplements: [],
        salaries: [],
        totalCost: 0
      });
    }
    const employee = employeeMap.get(salary.employeeId);
    employee.salaries.push(salary);
    employee.totalCost += salary.salary || 0;
  });

  return Array.from(employeeMap.values());
}

/**
 * Group payroll data by department with proper department details
 */
export function groupPayrollByDepartment(payrollData: PayrollData) {
  const departmentMap = new Map();

  payrollData.shiftsPayroll?.forEach(shift => {
    const deptId = shift.departmentId;
    if (!departmentMap.has(deptId)) {
      departmentMap.set(deptId, {
        departmentId: deptId,
        shifts: [],
        totalCost: 0,
        employeeCount: new Set()
      });
    }
    const dept = departmentMap.get(deptId);
    dept.shifts.push(shift);
    dept.totalCost += shift.salary || 0;
    dept.employeeCount.add(shift.employeeId);
  });

  // Convert employee sets to counts
  return Array.from(departmentMap.values()).map(dept => ({
    ...dept,
    employeeCount: dept.employeeCount.size
  }));
}

/**
 * Get payroll data with enhanced department cost breakdown
 */
export async function getPayrollWithDepartmentBreakdown(
  startDate: string,
  endDate: string,
  options: {
    shiftStatus?: 'Approved' | 'Nonapproved';
    returnFullSalaryForMonthlyPaid?: boolean;
  } = {}
) {
  // Get payroll data for all departments
  const payrollData = await getPayrollData(startDate, endDate, options);
  
  // Get department details for name resolution
  const departments = await getDepartments();
  const departmentMap = new Map(departments.map(dept => [dept.id, dept.name]));
  
  // Group by department
  const departmentBreakdown = groupPayrollByDepartment(payrollData);
  
  // Add department names to the breakdown
  const enrichedBreakdown = departmentBreakdown.map(dept => ({
    ...dept,
    departmentName: departmentMap.get(dept.departmentId) || `Department ${dept.departmentId}`
  }));
  
  return {
    payrollData,
    departmentBreakdown: enrichedBreakdown,
    totals: calculatePayrollTotals(payrollData)
  };
}
