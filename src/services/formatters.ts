// src/services/formatters.ts

import type { Shift, ShiftType, Position } from './api/scheduling-api.ts';
import type { Employee, Department } from './api/hr-api.ts';
import type { AbsenceRecord } from './api/absence-api.ts';
import { PayrollData, calculatePayrollTotals, groupPayrollByEmployee, groupPayrollByDepartment } from "./api/payroll-api.ts";

export class DataFormatters {
  
  static formatShifts(
    shifts: Shift[],
    startDate: string,
    endDate: string,
    employeeMap: Map<number, string>,
    departmentMap: Map<number, string>,
    positionMap: Map<number, string>,
    shiftTypeMap?: Map<number, string>
  ): string {
    if (!shifts || shifts.length === 0) {
      return `No shifts found for the period ${startDate} to ${endDate}`;
    }

    let result = `📅 Shifts from ${startDate} to ${endDate} (${shifts.length} shifts found):\n\n`;
    
    shifts.forEach((shift, index) => {
      // Format dates nicely
      const startTime = shift.startDateTime ? new Date(shift.startDateTime).toLocaleString() : 'No start time';
      const endTime = shift.endDateTime ? new Date(shift.endDateTime).toLocaleString() : 'No end time';
      
      // Get names from maps
      const employeeName = shift.employeeId ? 
        employeeMap.get(shift.employeeId) || `Employee ID: ${shift.employeeId}` : 
        'Unassigned';
      const departmentName = shift.departmentId ? 
        departmentMap.get(shift.departmentId) || `Department ID: ${shift.departmentId}` : 
        'No department';
      const positionName = shift.positionId ? 
        positionMap.get(shift.positionId) || `Position ID: ${shift.positionId}` : 
        null;
      const shiftTypeName = shift.shiftTypeId && shiftTypeMap ? 
        shiftTypeMap.get(shift.shiftTypeId) || `Shift Type ID: ${shift.shiftTypeId}` : 
        null;
      
      result += `${index + 1}. ${employeeName}\n`;
      result += `   🏢 ${departmentName}\n`;
      result += `   ⏰ ${startTime} - ${endTime}\n`;
      result += `   📊 Status: ${shift.status || 'Unknown'}\n`;
      result += `   📅 Date: ${shift.date}\n`;
      if (positionName) {
        result += `   💼 Position: ${positionName}\n`;
      }
      if (shiftTypeName) {
        result += `   🏷️ Type: ${shiftTypeName}\n`;
      }
      result += '\n';
    });

    return result;
  }

  static formatEmployees(employees: Employee[], department?: string): string {
    if (!employees || employees.length === 0) {
      return department 
        ? `No employees found in department: ${department}`
        : 'No employees found';
    }

    let result = department 
      ? `👥 Employees in ${department} (${employees.length} found):\n\n`
      : `👥 All Employees (${employees.length} found):\n\n`;
    
    employees.forEach((employee, index) => {
      result += `${index + 1}. ${employee.firstName} ${employee.lastName}\n`;
      result += `   👤 ID: ${employee.id}\n`;
      result += `   📧 Email: ${employee.email || 'No email'}\n`;
      result += `   📱 Phone: ${employee.cellPhone || 'No phone'}\n`;
      result += `   🏢 Primary Dept ID: ${employee.primaryDepartmentId || 'None'}\n`;
      result += `   👤 Username: ${employee.userName || 'No username'}\n`;
      result += `   📅 Hired: ${employee.hiredDate || 'Unknown'}\n`;
      if (employee.deactivationDate) {
        result += `   ❌ Deactivated: ${employee.deactivationDate}\n`;
      }
      result += '\n';
    });

    return result;
  }

  static formatDepartments(departments: Department[]): string {
    if (!departments || departments.length === 0) {
      return 'No departments found';
    }

    let result = `🏢 Departments (${departments.length} found):\n\n`;
    
    departments.forEach((department, index) => {
      result += `${index + 1}. ${department.name}\n`;
      result += `   🆔 ID: ${department.id}\n\n`;
    });

    return result;
  }

  static formatAbsenceRecords(
    absenceRecords: AbsenceRecord[],
    employeeMap: Map<number, string>,
    filters?: string
  ): string {
    if (!absenceRecords || absenceRecords.length === 0) {
      return filters 
        ? `No absence records found with filters: ${filters}`
        : 'No absence records found';
    }

    let result = filters 
      ? `🏖️ Absence Records with filters (${absenceRecords.length} found):\n${filters}\n\n`
      : `🏖️ All Absence Records (${absenceRecords.length} found):\n\n`;
    
    absenceRecords.forEach((record, index) => {
      const employeeName = employeeMap.get(record.employeeId) || `Employee ID: ${record.employeeId}`;
      const startDate = new Date(record.absencePeriod.start).toLocaleDateString();
      const endDate = new Date(record.absencePeriod.end).toLocaleDateString();
      
      // Status emoji mapping
      const statusEmoji = {
        'Pending': '⏳',
        'Approved': '✅', 
        'Declined': '❌',
        'Cancelled': '🚫'
      }[record.status] || '❓';

      result += `${index + 1}. ${employeeName}\n`;
      result += `   🆔 Record ID: ${record.id}\n`;
      result += `   ${statusEmoji} Status: ${record.status}\n`;
      result += `   📅 Period: ${startDate} - ${endDate}\n`;
      
      if (record.note) {
        result += `   📝 Note: ${record.note}\n`;
      }
      
      // Show registration details
      if (record.registrations && record.registrations.length > 0) {
        result += `   📋 Registrations (${record.registrations.length}):\n`;
        record.registrations.forEach((reg, regIndex) => {
          const regDate = new Date(reg.date).toLocaleDateString();
          result += `      ${regIndex + 1}. ${regDate} (${reg.time.start} - ${reg.time.end})\n`;
          if (reg.account.costs && reg.account.costs.length > 0) {
            const cost = reg.account.costs[0];
            result += `         💰 Cost: ${cost.value} ${cost.unit.type}\n`;
          }
        });
      }
      
      result += '\n';
    });

    return result;
  }

  static formatShiftTypes(shiftTypes: ShiftType[]): string {
    if (!shiftTypes || shiftTypes.length === 0) {
      return 'No shift types found';
    }

    let result = `🏷️ Shift Types (${shiftTypes.length} found):\n\n`;
    
    shiftTypes.forEach((shiftType, index) => {
      result += `${index + 1}. ${shiftType.name}\n`;
      result += `   🆔 ID: ${shiftType.id}\n`;
      result += `   ${shiftType.isActive ? '✅' : '❌'} Active: ${shiftType.isActive}\n`;
      
      if (shiftType.color) {
        result += `   🎨 Color: ${shiftType.color}\n`;
      }
      
      if (shiftType.salaryCode) {
        result += `   💼 Salary Code: ${shiftType.salaryCode}\n`;
      }
      
      // Payment info
      if (shiftType.paymentType === 'Percentage' && shiftType.payPercentage) {
        result += `   💰 Pay: ${shiftType.payPercentage}% (Percentage)\n`;
      } else if (shiftType.paymentType === 'Monetary' && shiftType.payMonetary) {
        result += `   💰 Pay: ${shiftType.payMonetary} (Monetary)\n`;
      }
      
      result += `   ☕ Allows Breaks: ${shiftType.allowsBreaks ? 'Yes' : 'No'}\n`;
      result += `   📅 Allow Booking: ${shiftType.allowBooking ? 'Yes' : 'No'}\n`;
      result += `   🖨️ Include in Print: ${shiftType.includeInSchedulePrint ? 'Yes' : 'No'}\n`;
      result += '\n';
    });

    return result;
  }

  static formatDebugInfo(sessionExists: boolean, sessionData: any): string {
    return `Debug info:
- Session exists: ${sessionExists}
- Session data: ${sessionData ? JSON.stringify(sessionData, null, 2) : 'null'}
- Hardcoded APP_ID: 4b79b7b4-932a-4a3b-9400-dcc24ece299e`;
  }

  static formatAPIResponse(endpoint: string, data: any): string {
    return `🔍 Raw API Response for ${endpoint}:\n\n${JSON.stringify(data, null, 2)}`;
  }

  static formatError(operation: string, error: unknown): string {
    return `❌ Error ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  static formatSuccess(message: string): string {
    return `✅ ${message}`;
  }

  static formatAuthenticationResult(success: boolean, portalName?: string, error?: string): string {
    return success 
      ? `✅ Successfully connected to Planday portal: ${portalName}`
      : `❌ Authentication failed: ${error}`;
  }
}

// NEW PAYROLL FORMATTING FUNCTIONS

/**
 * Format payroll summary with totals and basic breakdown
 */
export function formatPayrollSummary(
  payrollData: PayrollData,
  employeeNames: Map<number, string>,
  departmentNames: Map<number, string>,
  startDate: string,
  endDate: string
): string {
  const totals = calculatePayrollTotals(payrollData);
  const employeeGroups = groupPayrollByEmployee(payrollData);
  const departmentGroups = groupPayrollByDepartment(payrollData);

  const dayCount = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));

  let output = `💰 Payroll Summary (${startDate} to ${endDate})\n\n`;
  
  output += `📊 **Total Labor Cost**: ${totals.currency}${totals.totalCost.toFixed(2)}\n`;
  output += `👥 **Employees Paid**: ${employeeGroups.length}\n`;
  output += `📅 **Period**: ${dayCount} days\n`;
  output += `⏰ **Daily Average**: ${totals.currency}${(totals.totalCost / dayCount).toFixed(2)}\n\n`;

  // Cost breakdown
  output += `💼 **Cost Breakdown**:\n`;
  output += `• Shift Wages: ${totals.currency}${totals.shiftCosts.toFixed(2)} (${payrollData.shiftsPayroll?.length || 0} shifts)\n`;
  output += `• Supplements: ${totals.currency}${totals.supplementCosts.toFixed(2)} (${payrollData.supplementsPayroll?.length || 0} items)\n`;
  output += `• Salaries: ${totals.currency}${totals.salariedCosts.toFixed(2)} (${payrollData.salariedPayroll?.length || 0} items)\n\n`;

  // Top employees by cost
  if (employeeGroups.length > 0) {
    const topEmployees = employeeGroups
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);

    output += `🏆 **Top Employees by Cost**:\n`;
    topEmployees.forEach((emp, index) => {
      const name = employeeNames.get(emp.employeeId) || `Employee ${emp.employeeId}`;
      output += `${index + 1}. ${name}: ${totals.currency}${emp.totalCost.toFixed(2)}\n`;
    });
    output += '\n';
  }

  // Department breakdown
  if (departmentGroups.length > 0) {
    output += `🏢 **Department Costs**:\n`;
    departmentGroups
      .sort((a, b) => b.totalCost - a.totalCost)
      .forEach(dept => {
        const name = departmentNames.get(dept.departmentId) || `Department ${dept.departmentId}`;
        output += `• ${name}: ${totals.currency}${dept.totalCost.toFixed(2)} (${dept.employeeCount} employees)\n`;
      });
  }

  return output;
}

/**
 * Format detailed payroll breakdown with shift-by-shift details
 */
export function formatShiftPayrollDetails(
  payrollData: PayrollData,
  employeeNames: Map<number, string>,
  departmentNames: Map<number, string>,
  startDate: string,
  endDate: string
): string {
  const totals = calculatePayrollTotals(payrollData);

  let output = `💰 Detailed Payroll Report (${startDate} to ${endDate})\n\n`;
  
  output += `📊 **Summary**: ${totals.currency}${totals.totalCost.toFixed(2)} total cost\n\n`;

  // Shift details
  if (payrollData.shiftsPayroll && payrollData.shiftsPayroll.length > 0) {
    output += `📅 **Shift Details** (${payrollData.shiftsPayroll.length} shifts):\n\n`;

    const shiftsByDate = payrollData.shiftsPayroll
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    shiftsByDate.forEach((shift, index) => {
      const employeeName = employeeNames.get(shift.employeeId) || `Employee ${shift.employeeId}`;
      const departmentName = departmentNames.get(shift.departmentId) || `Department ${shift.departmentId}`;
      
      const startTime = new Date(shift.start).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      const endTime = new Date(shift.end).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      output += `${index + 1}. **${employeeName}**\n`;
      output += `   🏢 ${departmentName}\n`;
      output += `   📅 ${shift.date}\n`;
      output += `   ⏰ ${startTime} - ${endTime} (${shift.shiftDuration})\n`;
      output += `   💵 Wage Rate: ${totals.currency}${shift.wage.rate}/${shift.wage.type.toLowerCase()}\n`;
      output += `   💰 Total Cost: ${totals.currency}${shift.salary.toFixed(2)}\n`;
      
      // Show supplements if any
      if (shift.supplements && shift.supplements.length > 0) {
        output += `   🏷️ Supplements: ${shift.supplements.map(s => s.name).join(', ')}\n`;
      }
      
      // Show breaks if any
      if (shift.breaks && shift.breaks.length > 0) {
        const paidBreaks = shift.breaks.filter(b => b.isPaid);
        const unpaidBreaks = shift.breaks.filter(b => !b.isPaid);
        if (paidBreaks.length > 0) {
          output += `   ☕ Paid Breaks: ${paidBreaks.length}\n`;
        }
        if (unpaidBreaks.length > 0) {
          output += `   ⏸️ Unpaid Breaks: ${unpaidBreaks.length}\n`;
        }
      }
      
      output += '\n';
    });
  }

  // Supplements details
  if (payrollData.supplementsPayroll && payrollData.supplementsPayroll.length > 0) {
    output += `🏷️ **Supplements** (${payrollData.supplementsPayroll.length} items):\n\n`;
    
    payrollData.supplementsPayroll.forEach((supplement, index) => {
      const employeeName = employeeNames.get(supplement.employeeId) || `Employee ${supplement.employeeId}`;
      
      output += `${index + 1}. **${supplement.name}** - ${employeeName}\n`;
      output += `   📅 ${supplement.date}\n`;
      output += `   💵 Rate: ${totals.currency}${supplement.wage.toFixed(2)}\n`;
      output += `   📊 Units: ${supplement.units}\n`;
      output += `   💰 Total: ${totals.currency}${supplement.salary.toFixed(2)}\n\n`;
    });
  }

  // Salaried payroll details
  if (payrollData.salariedPayroll && payrollData.salariedPayroll.length > 0) {
    output += `💼 **Salaried Payroll** (${payrollData.salariedPayroll.length} items):\n\n`;
    
    payrollData.salariedPayroll.forEach((salary, index) => {
      const employeeName = employeeNames.get(salary.employeeId) || `Employee ${salary.employeeId}`;
      
      output += `${index + 1}. **${employeeName}**\n`;
      output += `   📅 Period: ${salary.start} to ${salary.end}\n`;
      output += `   💵 Rate: ${totals.currency}${salary.wage.toFixed(2)}\n`;
      output += `   📊 Units: ${salary.units}\n`;
      output += `   💰 Total: ${totals.currency}${salary.salary.toFixed(2)}\n\n`;
    });
  }

  return output;
}
