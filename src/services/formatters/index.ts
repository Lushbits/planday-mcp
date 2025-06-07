// src/services/formatters/index.ts
// Centralized exports for all domain formatters
// Maintains backward compatibility while enabling modular imports

import { 
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
} from './hr-formatters';

import { 
  formatShifts, 
  formatShiftTypes, 
  formatPositions, 
  formatSections,
  formatScheduleDays, 
  formatSkills as formatSchedulingSkills, 
  formatShiftHistory, 
  formatTimeAndCost,
  formatShiftOperationResult
} from './scheduling-formatters';

import { formatAbsenceRecords } from './absence-formatters';
import { formatPayrollSummary, formatShiftPayrollDetails } from './payroll-formatters';
import { 
  formatDebugInfo, 
  formatAPIResponse, 
  formatError, 
  formatSuccess, 
  formatAuthenticationResult 
} from './shared-formatters';

// Re-export all functions
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

// Legacy DataFormatters object for backward compatibility
export const DataFormatters = {
  formatShifts,
  formatEmployees,
  formatDepartments,
  formatAbsenceRecords,
  formatShiftTypes,
  formatDebugInfo,
  formatAPIResponse,
  formatError,
  formatSuccess,
  formatAuthenticationResult
}; 