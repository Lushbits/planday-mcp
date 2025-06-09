// src/services/api/index.ts
// Centralized exports for all domain APIs

// HR Domain
export * from './hr-api';

// Scheduling Domain - resolve naming conflicts with explicit re-exports
export type {
  // Shift interfaces
  Shift,
  CreateShiftRequest,
  UpdateShiftRequest,
  Position,
  CreatePositionRequest,
  UpdatePositionRequest,
  ShiftType,
  CreateShiftTypeRequest,
  UpdateShiftTypeRequest,
  Section,
  ScheduleDay,
  Holiday,
  UpdateScheduleDayRequest,
  Skill as SchedulingSkill,
  ShiftHistoryRecord,
  TimeAndCostData,
  ShiftCost
} from './scheduling-api';

export {
  // Shift functions
  getShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  approveShift,
  assignShiftToEmployee,
  getDeletedShifts,
  // Position functions
  getPositions,
  createPosition,
  getPositionById,
  updatePosition,
  deletePosition,
  // Shift Type functions
  getShiftTypes,
  createShiftType,
  updateShiftType,
  // Other functions
  getSections,
  getScheduleDays,
  updateScheduleDay,
  // Skills for scheduling (renamed to avoid conflict with HR skills)
  getSkills as getSchedulingSkills,
  getShiftHistory,
  getTimeAndCost,
  getShiftTypesByIds,
  getPositionsByIds
} from './scheduling-api';

// Absence Domain
export * from './absence-api';

// Payroll Domain
export * from './payroll-api';

// Re-export common auth functionality
export { makeAuthenticatedRequest } from '../auth';
