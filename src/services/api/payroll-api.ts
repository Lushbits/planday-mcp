// src/services/api/payroll-api.ts
import { makeAuthenticatedRequest } from "../auth.js";

// Payroll API Types
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

export interface PayrollParams {
  startDate: string;
  endDate: string;
  departmentId?: number;
  employeeId?: number;
}

/**
 * Get detailed payroll data for a date range
 */
export async function getPayrollData(
  startDate: string, 
  endDate: string,
  options: { departmentId?: number; employeeId?: number } = {}
): Promise<PayrollData> {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  if (options.departmentId) {
    params.append('departmentId', options.departmentId.toString());
  }

  if (options.employeeId) {
    params.append('employeeId', options.employeeId.toString());
  }

  const response = await makeAuthenticatedRequest(
    `https://openapi.planday.com/payroll/v1.0/payroll?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch payroll data: ${response.status} ${response.statusText}`);
  }

  return await response.json();
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
 * Group payroll data by department
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
