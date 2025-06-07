// src/services/formatters/index.ts
// Centralized exports for all domain formatters
// Maintains backward compatibility while enabling modular imports

// HR Domain Formatters (Comprehensive)
export { 
  formatEmployees,
  formatDeactivatedEmployees,
  formatEmployeeDetail,
  formatDepartments,
  formatEmployeeGroups,
  formatSkills as formatHRSkills,
  formatEmployeeTypes,
  formatSupervisors,
  formatEmployeeHistory,
  formatFieldDefinitions,
  formatEmployeeOperationResult,
  formatDepartmentOperationResult,
  formatGroupOperationResult,
  formatSkillOperationResult
} from './hr-formatters.ts';

// Scheduling Domain Formatters (Comprehensive)
export { 
  formatShifts, 
  formatShiftTypes, 
  formatPositions, 
  formatSections,
  formatScheduleDays, 
  formatSkills as formatSchedulingSkills, 
  formatShiftHistory, 
  formatTimeAndCost,
  formatShiftOperationResult
} from './scheduling-formatters.ts';

// Absence Domain Formatters
export { formatAbsenceRecords } from './absence-formatters.ts';

// Payroll Domain Formatters
export { formatPayrollSummary, formatShiftPayrollDetails } from './payroll-formatters.ts';

// Shared Utility Formatters
export { 
  formatDebugInfo, 
  formatAPIResponse, 
  formatError, 
  formatSuccess, 
  formatAuthenticationResult 
} from './shared-formatters.ts';

// Legacy DataFormatters class for backward compatibility
// This maintains the existing API while using the new modular functions
export class DataFormatters {
  static formatShifts = formatShifts;
  static formatEmployees = formatEmployees;
  static formatDepartments = formatDepartments;
  static formatAbsenceRecords = formatAbsenceRecords;
  static formatShiftTypes = formatShiftTypes;
  static formatDebugInfo = formatDebugInfo;
  static formatAPIResponse = formatAPIResponse;
  static formatError = formatError;
  static formatSuccess = formatSuccess;
  static formatAuthenticationResult = formatAuthenticationResult;
}

// Re-export the individual functions for direct import
export {
  // HR Domain Functions
  formatEmployees,
  formatDeactivatedEmployees,
  formatEmployeeDetail,
  formatDepartments,
  formatEmployeeGroups,
  formatHRSkills,
  formatEmployeeTypes,
  formatSupervisors,
  formatEmployeeHistory,
  formatFieldDefinitions,
  formatEmployeeOperationResult,
  formatDepartmentOperationResult,
  formatGroupOperationResult,
  formatSkillOperationResult,
  
  // Scheduling Domain Functions
  formatShifts,
  formatShiftTypes,
  formatPositions,
  formatSections,
  formatScheduleDays,
  formatSchedulingSkills,
  formatShiftHistory,
  formatTimeAndCost,
  formatShiftOperationResult,
  
  // Other Domain Functions
  formatAbsenceRecords,
  formatPayrollSummary,
  formatShiftPayrollDetails,
  
  // Shared Utility Functions
  formatDebugInfo,
  formatAPIResponse,
  formatError,
  formatSuccess,
  formatAuthenticationResult
}; 