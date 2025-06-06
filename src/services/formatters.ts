// src/services/formatters.ts

import type { PlandayShift, PlandayEmployee, PlandayDepartment, PlandayAbsenceRecord } from './planday-api.js';

export class DataFormatters {
  
  static formatShifts(
    shifts: PlandayShift[],
    startDate: string,
    endDate: string,
    employeeMap: Map<number, string>,
    departmentMap: Map<number, string>,
    positionMap: Map<number, string>
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
      
      result += `${index + 1}. ${employeeName}\n`;
      result += `   🏢 ${departmentName}\n`;
      result += `   ⏰ ${startTime} - ${endTime}\n`;
      result += `   📊 Status: ${shift.status || 'Unknown'}\n`;
      result += `   📅 Date: ${shift.date}\n`;
      if (positionName) {
        result += `   💼 Position: ${positionName}\n`;
      }
      result += '\n';
    });

    return result;
  }

  static formatEmployees(employees: PlandayEmployee[], department?: string): string {
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

  static formatDepartments(departments: PlandayDepartment[]): string {
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
    absenceRecords: PlandayAbsenceRecord[],
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
