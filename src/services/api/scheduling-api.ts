// src/services/api/scheduling-api.ts
// Comprehensive Planday Scheduling API Implementation
// Covers: Shifts, Positions, Shift Types, Sections, Schedule Days, Skills, History, Time & Cost

import { makeAuthenticatedRequest } from "../auth";
import { authService } from '../auth';
import { getEmployeeById } from './hr-api';

// Quick helper to handle TypeScript strict mode for API responses
const parseJsonResponse = async (response: Response): Promise<any> => {
  return await response.json() as any;
};

// ================================
// TYPE DEFINITIONS
// ================================

// Shifts
export interface Shift {
  id: number;
  punchClockShiftId?: number;
  startDateTime?: string;
  endDateTime?: string;
  status?: string;
  dateTimeCreated?: string;
  dateTimeModified?: string;
  skillIds?: number[];
  departmentId?: number;
  employeeId?: number;
  employeeGroupId?: number;
  positionId?: number;
  shiftTypeId?: number;
  date: string;
  comment?: string;
}

export interface CreateShiftRequest {
  departmentId: number;
  allowConflicts: boolean;
  useBreaks: boolean;
  date: string;
  startTime?: string;
  endTime?: string;
  employeeId?: number;
  employeeGroupId: number;
  positionId?: number;
  shiftTypeId?: number;
  defaultWage?: {
    amount: number;
    type: string;
  };
  comment?: string;
  skillIds?: number[];
}

export interface UpdateShiftRequest {
  allowConflicts?: boolean;
  useBreaks?: boolean;
  date?: string;
  startTime?: string;
  endTime?: string;
  employeeId?: number;
  employeeGroupId?: number;
  positionId?: number;
  shiftTypeId?: number;
  comment?: string;
}

// Positions
export interface Position {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  departmentId: number;
  sectionId?: number;
  employeeGroupId: number;
  affectRevenue: boolean;
  revenueUnitId?: number;
  skillIds?: number[];
  color?: string;
}

export interface CreatePositionRequest {
  departmentId: number;
  employeeGroupId: number;
  name: string;
  affectRevenue: boolean;
  sectionId?: number;
  color?: string;
  validFrom?: string;
  validTo?: string;
  skillIds?: number[];
  revenueUnitId?: number;
}

export interface UpdatePositionRequest {
  name: string;
  affectRevenue: boolean;
  sectionId?: number;
  color?: string;
  validFrom?: string;
  validTo?: string;
  skillIds?: number[];
  revenueUnitId?: number;
}

// Shift Types
export interface ShiftType {
  id: number;
  name: string;
  color?: string;
  salaryCode?: string;
  isActive: boolean;
  payPercentage?: number;
  payMonetary?: number;
  allowsBreaks: boolean;
  allowBooking: boolean;
  paymentType: "Percentage" | "Monetary";
  includeInSchedulePrint: boolean;
}

export interface CreateShiftTypeRequest {
  name: string;
  color: string;
  salaryCode: string;
  allowsBreaks?: boolean;
  includeSupplementSalary?: boolean;
}

export interface UpdateShiftTypeRequest {
  name: string;
  color: string;
  salaryCode: string;
  allowsBreaks?: boolean;
  includeSupplementSalary?: boolean;
}

// Sections  
export interface Section {
  id: number;
  name: string;
  departmentId: number;
}

// Schedule Day
export interface ScheduleDay {
  id: number;
  date: string;
  title?: string;
  description?: string;
  isVisible: boolean;
  holiday: Holiday[];
  lockState: string;
  departmentId: number;
}

export interface Holiday {
  title: string;
  calendarName: string;
}

export interface UpdateScheduleDayRequest {
  departmentId: number;
  date: string;
  title?: string;
  description?: string;
  isVisible?: boolean;
}

// Skills
export interface Skill {
  id: number;
  name: string;
  isRemoved: boolean;
  isDeleted: boolean;
  description?: string;
  employeeGroupIds: number[];
  allEmployeeGroups: boolean;
}

// Shift History (Fixed implementation)
export interface ShiftHistoryRecord {
  modifiedAt: string;
  modifiedBy: {
    id: number;
    name: string;
  };
  changes: string[];
}

export interface ShiftHistoryResponse {
  paging: {
    offset: number;
    limit: number;
    total: number;
  };
  data: ShiftHistoryRecord[];
}

// Time & Cost
export interface TimeAndCostData {
  costs: ShiftCost[];
  currencySymbol: string;
  currencyFormatString: string;
}

export interface ShiftCost {
  shiftId: number;
  duration: string;
  cost: number;
  employeeId: number;
  date: string;
  shiftTypeId: number;
  positionId: number;
}

// Validation Types
export interface ShiftAssignmentValidation {
  isValid: boolean;
  reason?: string;
  employeeGroupValid?: boolean;
  departmentValid?: boolean;
}

// ================================
// SHIFTS API
// ================================

/**
 * Get shifts for a date range with comprehensive filtering
 */
export async function getShifts(
  startDate: string, 
  endDate: string, 
  filters?: {
    departmentIds?: number[];
    employeeGroupIds?: number[];
    shiftTypeIds?: number[];
    positionIds?: number[];
    employeeIds?: number[];
    shiftStatus?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: Shift[]; paging: any }> {
  let url = `https://openapi.planday.com/scheduling/v1.0/shifts?From=${startDate}&To=${endDate}`;
  
  if (filters) {
    if (filters.departmentIds?.length) url += `&DepartmentId=${filters.departmentIds.join(',')}`;
    if (filters.employeeGroupIds?.length) url += `&EmployeeGroupId=${filters.employeeGroupIds.join(',')}`;
    if (filters.shiftTypeIds?.length) url += `&ShiftTypeId=${filters.shiftTypeIds.join(',')}`;
    if (filters.positionIds?.length) url += `&PositionId=${filters.positionIds.join(',')}`;
    if (filters.employeeIds?.length) url += `&EmployeeId=${filters.employeeIds.join(',')}`;
    if (filters.shiftStatus) url += `&ShiftStatus=${filters.shiftStatus}`;
    if (filters.limit) url += `&Limit=${filters.limit}`;
    if (filters.offset) url += `&Offset=${filters.offset}`;
  }

  const response = await makeAuthenticatedRequest(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch shifts: ${response.status} ${response.statusText}`);
  }

  const data = await parseJsonResponse(response);
  return { data: data.data || [], paging: data.paging || {} };
}

/**
 * Create a new shift
 */
export async function createShift(shiftData: CreateShiftRequest): Promise<Shift> {
  const url = 'https://openapi.planday.com/scheduling/v1.0/shifts';
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shiftData)
  });

  if (!response.ok) {
    throw new Error(`Failed to create shift: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get shift by ID
 */
export async function getShiftById(shiftId: number): Promise<Shift> {
  const url = `https://openapi.planday.com/scheduling/v1.0/shifts/${shiftId}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch shift ${shiftId}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update a shift
 */
export async function updateShift(shiftId: number, shiftData: UpdateShiftRequest): Promise<void> {
  const url = `https://openapi.planday.com/scheduling/v1.0/shifts/${shiftId}`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shiftData)
  });

  if (!response.ok) {
    throw new Error(`Failed to update shift ${shiftId}: ${response.status} ${response.statusText}`);
  }
}

/**
 * Delete a shift
 */
export async function deleteShift(shiftId: number): Promise<void> {
  const url = `https://openapi.planday.com/scheduling/v1.0/shifts/${shiftId}`;
  const response = await makeAuthenticatedRequest(url, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error(`Failed to delete shift ${shiftId}: ${response.status} ${response.statusText}`);
  }
}

/**
 * Approve a shift for payroll
 */
export async function approveShift(shiftId: number): Promise<void> {
  const url = `https://openapi.planday.com/scheduling/v1.0/shifts/${shiftId}/approve`;
  const response = await makeAuthenticatedRequest(url, { method: 'POST' });

  if (!response.ok) {
    throw new Error(`Failed to approve shift ${shiftId}: ${response.status} ${response.statusText}`);
  }
}

/**
 * Assign shift to employee
 */
export async function assignShiftToEmployee(shiftId: number, employeeId: number | null): Promise<void> {
  const url = `https://openapi.planday.com/scheduling/v1.0/shifts/${shiftId}/employee`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId })
  });

  if (!response.ok) {
    throw new Error(`Failed to assign shift ${shiftId}: ${response.status} ${response.statusText}`);
  }
}

/**
 * Get deleted shifts
 */
export async function getDeletedShifts(
  startDate: string,
  endDate: string,
  filters?: { limit?: number; offset?: number }
): Promise<{ data: Shift[]; paging: any }> {
  let url = `https://openapi.planday.com/scheduling/v1.0/shifts/deleted?DeletedFrom=${startDate}&DeletedTo=${endDate}`;
  
  if (filters?.limit) url += `&Limit=${filters.limit}`;
  if (filters?.offset) url += `&Offset=${filters.offset}`;

  const response = await makeAuthenticatedRequest(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch deleted shifts: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { data: data.data || [], paging: data.paging || {} };
}

// ================================
// POSITIONS API
// ================================

/**
 * Get all positions with optional filtering
 */
export async function getPositions(filters?: {
  isActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ data: Position[]; paging: any }> {
  let url = 'https://openapi.planday.com/scheduling/v1.0/positions';
  const params = [];
  
  if (filters?.isActive !== undefined) params.push(`isActive=${filters.isActive}`);
  if (filters?.limit) params.push(`limit=${filters.limit}`);
  if (filters?.offset) params.push(`offset=${filters.offset}`);
  
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await makeAuthenticatedRequest(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch positions: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { data: data.data || [], paging: data.paging || {} };
}

/**
 * Create a new position
 */
export async function createPosition(positionData: CreatePositionRequest): Promise<Position> {
  const url = 'https://openapi.planday.com/scheduling/v1.0/positions';
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(positionData)
  });

  if (!response.ok) {
    throw new Error(`Failed to create position: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get position by ID
 */
export async function getPositionById(positionId: number): Promise<Position | null> {
  try {
    const url = `https://openapi.planday.com/scheduling/v1.0/positions/${positionId}`;
    const response = await makeAuthenticatedRequest(url);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch position ${positionId}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error(`Error fetching position ${positionId}:`, error);
    return null;
  }
}

/**
 * Update a position
 */
export async function updatePosition(positionId: number, positionData: UpdatePositionRequest): Promise<Position> {
  const url = `https://openapi.planday.com/scheduling/v1.0/positions/${positionId}`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(positionData)
  });

  if (!response.ok) {
    throw new Error(`Failed to update position ${positionId}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Delete a position
 */
export async function deletePosition(
  positionId: number, 
  options?: {
    deleteOption?: "Undecided" | "KeepPosition" | "RemovePosition" | "ReplacePosition" | "DeleteShifts";
    replacementPositionId?: number;
  }
): Promise<void> {
  let url = `https://openapi.planday.com/scheduling/v1.0/positions/${positionId}`;
  const params = [];
  
  if (options?.deleteOption) params.push(`deleteOption=${options.deleteOption}`);
  if (options?.replacementPositionId) params.push(`replacementPositionId=${options.replacementPositionId}`);
  
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await makeAuthenticatedRequest(url, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error(`Failed to delete position ${positionId}: ${response.status} ${response.statusText}`);
  }
}

// ================================
// SHIFT TYPES API
// ================================

/**
 * Get all shift types
 */
export async function getShiftTypes(filters?: {
  isActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ data: ShiftType[]; paging: any }> {
  let url = 'https://openapi.planday.com/scheduling/v1.0/shifttypes';
  const params = [];
  
  if (filters?.isActive !== undefined) params.push(`isActive=${filters.isActive}`);
  if (filters?.limit) params.push(`limit=${filters.limit}`);
  if (filters?.offset) params.push(`offset=${filters.offset}`);
  
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await makeAuthenticatedRequest(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch shift types: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { data: data.data || [], paging: data.paging || {} };
}

/**
 * Create a new shift type
 */
export async function createShiftType(shiftTypeData: CreateShiftTypeRequest): Promise<{ id: number }> {
  const url = 'https://openapi.planday.com/scheduling/v1.0/shifttypes';
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shiftTypeData)
  });

  if (!response.ok) {
    throw new Error(`Failed to create shift type: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Update a shift type
 */
export async function updateShiftType(shiftTypeId: number, shiftTypeData: UpdateShiftTypeRequest): Promise<void> {
  const url = `https://openapi.planday.com/scheduling/v1.0/shifttypes/${shiftTypeId}`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shiftTypeData)
  });

  if (!response.ok) {
    throw new Error(`Failed to update shift type ${shiftTypeId}: ${response.status} ${response.statusText}`);
  }
}

// ================================
// SECTIONS API (Read-only)
// ================================

/**
 * Get sections by department
 */
export async function getSections(filters?: {
  departmentId?: number;
  limit?: number;
  offset?: number;
}): Promise<{ data: Section[]; paging: any }> {
  let url = 'https://openapi.planday.com/scheduling/v1.0/sections';
  const params = [];
  
  if (filters?.departmentId) params.push(`departmentId=${filters.departmentId}`);
  if (filters?.limit) params.push(`limit=${filters.limit}`);
  if (filters?.offset) params.push(`offset=${filters.offset}`);
  
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await makeAuthenticatedRequest(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sections: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { data: data.data || [], paging: data.paging || {} };
}

// ================================
// SCHEDULE DAY API
// ================================

/**
 * Get schedule days for a department and date range
 */
export async function getScheduleDays(
  departmentId: number,
  startDate?: string,
  endDate?: string,
  filters?: { limit?: number; offset?: number }
): Promise<{ data: ScheduleDay[]; paging: any }> {
  let url = `https://openapi.planday.com/scheduling/v1.0/scheduleDay?DepartmentId=${departmentId}`;
  
  if (startDate) url += `&From=${startDate}`;
  if (endDate) url += `&To=${endDate}`;
  if (filters?.limit) url += `&Limit=${filters.limit}`;
  if (filters?.offset) url += `&Offset=${filters.offset}`;

  const response = await makeAuthenticatedRequest(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch schedule days: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { data: data.data || [], paging: data.paging || {} };
}

/**
 * Update schedule day information
 */
export async function updateScheduleDay(scheduleDayData: UpdateScheduleDayRequest): Promise<void> {
  const url = 'https://openapi.planday.com/scheduling/v1.0/scheduleDay';
  const response = await makeAuthenticatedRequest(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scheduleDayData)
  });

  if (!response.ok) {
    throw new Error(`Failed to update schedule day: ${response.status} ${response.statusText}`);
  }
}

// ================================
// SKILLS API (Read-only)
// ================================

/**
 * Get skills for a department
 */
export async function getSkills(
  departmentId: number,
  filters?: {
    employeeGroupId?: number;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: Skill[]; paging: any }> {
  let url = `https://openapi.planday.com/scheduling/v1.0/skills?DepartmentId=${departmentId}`;
  
  if (filters?.employeeGroupId) url += `&EmployeeGroupId=${filters.employeeGroupId}`;
  if (filters?.limit) url += `&Limit=${filters.limit}`;
  if (filters?.offset) url += `&Offset=${filters.offset}`;

  const response = await makeAuthenticatedRequest(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch skills: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { data: data.data || [], paging: data.paging || {} };
}

// ================================
// SHIFT HISTORY API (FIXED)
// ================================

/**
 * Get history for a specific shift with proper error handling
 * Official API: GET /scheduling/v1.0/shifts/{shiftId}/history
 */
export async function getShiftHistory(
  shiftId: number,
  filters?: { 
    limit?: number; 
    offset?: number;
  }
): Promise<ShiftHistoryResponse> {
  // Validate shift ID
  if (!shiftId || shiftId <= 0) {
    throw new Error(`Invalid shift ID: ${shiftId}`);
  }

  // Build URL with proper parameter formatting
  let url = `https://openapi.planday.com/scheduling/v1.0/shifts/${shiftId}/history`;
  const params: string[] = [];
  
  // Add query parameters if provided - keeping exact case from API docs
  if (filters?.offset !== undefined && filters.offset >= 0) {
    params.push(`offset=${filters.offset}`);
  }
  
  if (filters?.limit !== undefined && filters.limit > 0 && filters.limit <= 50) {
    params.push(`limit=${filters.limit}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }

  console.log(`Fetching shift history from: ${url}`);

  try {
    const response = await makeAuthenticatedRequest(url);
    
    if (!response.ok) {
      // Enhanced error handling for different status codes
      switch (response.status) {
        case 401:
          throw new Error(`Unauthorized: Check your authentication credentials`);
        case 403:
          throw new Error(`Forbidden: Missing required scope 'shift:read' or insufficient permissions`);
        case 404:
          throw new Error(`Shift ${shiftId} not found or has no history records`);
        case 429:
          throw new Error(`Rate limit exceeded: Too many requests`);
        case 500:
          throw new Error(`Server error: Shift ${shiftId} may not exist or API is experiencing issues`);
        default:
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Failed to fetch shift history (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from shift history API');
    }

    return {
      paging: data.paging || { offset: 0, limit: 0, total: 0 },
      data: data.data || []
    };

  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Shift history fetch failed for shift ${shiftId}: ${error.message}`);
    }
    throw new Error(`Unknown error fetching shift history for shift ${shiftId}`);
  }
}

/**
 * Get complete shift history with automatic pagination
 */
export async function getAllShiftHistory(shiftId: number): Promise<ShiftHistoryRecord[]> {
  let allHistory: ShiftHistoryRecord[] = [];
  let offset = 0;
  const limit = 50; // Maximum allowed per request
  
  try {
    do {
      const response = await getShiftHistory(shiftId, { limit, offset });
      
      if (response.data.length === 0) {
        break; // No more data
      }
      
      allHistory.push(...response.data);
      offset += limit;
      
      console.log(`Loaded ${allHistory.length} of ${response.paging.total} history records`);
      
      // Safety check to prevent infinite loops
      if (offset >= response.paging.total) {
        break;
      }
      
    } while (true);
    
    return allHistory;
    
  } catch (error) {
    console.error(`Failed to fetch complete shift history for shift ${shiftId}:`, error);
    throw error;
  }
}

/**
 * Check if a shift exists before fetching its history
 */
export async function getShiftHistoryWithValidation(
  shiftId: number,
  filters?: { limit?: number; offset?: number }
): Promise<ShiftHistoryResponse> {
  try {
    // First try to get the shift to validate it exists
    const shiftResponse = await makeAuthenticatedRequest(
      `https://openapi.planday.com/scheduling/v1.0/shifts/${shiftId}`
    );
    
    if (!shiftResponse.ok) {
      if (shiftResponse.status === 404) {
        throw new Error(`Shift ${shiftId} does not exist`);
      }
      throw new Error(`Cannot validate shift ${shiftId}: ${shiftResponse.status}`);
    }
    
    // If shift exists, fetch its history
    return await getShiftHistory(shiftId, filters);
    
  } catch (error) {
    console.error(`Shift history validation failed for shift ${shiftId}:`, error);
    throw error;
  }
}

/**
 * Utility function to format shift history for display
 */
export function formatShiftHistory(history: ShiftHistoryRecord[]): string {
  if (history.length === 0) {
    return 'No history records found for this shift.';
  }

  return history.map((record, index) => {
    const changes = record.changes.map(change => `  • ${change}`).join('\n');
    return `${index + 1}. ${record.modifiedAt} - ${record.modifiedBy.name}:\n${changes}`;
  }).join('\n\n');
}

// ================================
// TIME & COST API (Read-only)
// ================================

/**
 * Get time and cost data for a department
 */
export async function getTimeAndCost(
  departmentId: number,
  startDate: string,
  endDate: string
): Promise<TimeAndCostData> {
  const url = `https://openapi.planday.com/scheduling/v1.0/timeandcost/${departmentId}?from=${startDate}&to=${endDate}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch time and cost data: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Batch fetch shift types by IDs
 */
export async function getShiftTypesByIds(ids: number[]): Promise<Map<number, ShiftType>> {
  const shiftTypeMap = new Map<number, ShiftType>();
  
  if (ids.length === 0) return shiftTypeMap;

  try {
    const response = await getShiftTypes({ limit: 50 });
    response.data.forEach((shiftType) => {
      if (ids.includes(shiftType.id)) {
        shiftTypeMap.set(shiftType.id, shiftType);
      }
    });
  } catch (error) {
    console.error('Error fetching shift types:', error);
  }

  return shiftTypeMap;
}

/**
 * Batch fetch positions by IDs
 */
export async function getPositionsByIds(ids: number[]): Promise<Map<number, Position>> {
  const positionMap = new Map<number, Position>();
  
  if (ids.length === 0) return positionMap;

  const positionPromises = ids.map(async (positionId) => {
    try {
      const position = await getPositionById(positionId);
      return { id: positionId, position };
    } catch (error) {
      console.error(`Error fetching position ${positionId}:`, error);
      return { id: positionId, position: null };
    }
  });

  const results = await Promise.all(positionPromises);
  results.forEach(({ id, position }) => {
    if (position) {
      positionMap.set(id, position);
    }
  });

  return positionMap;
}

// ================================
// VALIDATION FUNCTIONS
// ================================

/**
 * Validate that an employee can be assigned to a specific shift
 * Checks employee group membership and department access
 */
export async function validateEmployeeForShift(
  employeeId: number, 
  shiftId: number
): Promise<ShiftAssignmentValidation> {
  try {
    // Get shift details to see required employee group and department
    const shift = await getShiftById(shiftId);
    if (!shift) {
      return {
        isValid: false,
        reason: `Shift ${shiftId} not found`
      };
    }

    // Get employee details to check their groups and departments
    const employeeResponse = await getEmployeeById(employeeId);
    if (!employeeResponse?.data) {
      return {
        isValid: false,
        reason: `Employee ${employeeId} not found`
      };
    }

    const employee = employeeResponse.data;
    const employeeGroups = employee.employeeGroups || [];
    const employeeDepartments = employee.departments || [];

    // Check employee group membership
    const employeeGroupValid = shift.employeeGroupId ? 
      employeeGroups.includes(shift.employeeGroupId) : true;

    // Check department access
    const departmentValid = shift.departmentId ? 
      employeeDepartments.includes(shift.departmentId) : true;

    // Build detailed error message
    if (!employeeGroupValid && !departmentValid) {
      return {
        isValid: false,
        reason: `Employee ${employee.firstName} ${employee.lastName} cannot be assigned: not a member of required employee group (${shift.employeeGroupId}) and not assigned to required department (${shift.departmentId})`,
        employeeGroupValid: false,
        departmentValid: false
      };
    } else if (!employeeGroupValid) {
      return {
        isValid: false,
        reason: `Employee ${employee.firstName} ${employee.lastName} cannot be assigned: not a member of required employee group (${shift.employeeGroupId})`,
        employeeGroupValid: false,
        departmentValid: true
      };
    } else if (!departmentValid) {
      return {
        isValid: false,
        reason: `Employee ${employee.firstName} ${employee.lastName} cannot be assigned: not assigned to required department (${shift.departmentId})`,
        employeeGroupValid: true,
        departmentValid: false
      };
    }

    // All validations passed
    return {
      isValid: true,
      employeeGroupValid: true,
      departmentValid: true
    };

  } catch (error) {
    return {
      isValid: false,
      reason: `Validation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// ================================
// ENHANCED SHIFT UTILITIES
// ================================

/**
 * Get shift status options
 */
export async function getShiftStatuses(): Promise<{ data: { id: number; name: string }[] }> {
  const url = 'https://openapi.planday.com/scheduling/v1.0/shifts/shiftstatus/all';
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch shift statuses: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get shifts with enhanced data (employee names, position names, etc.)
 */
export async function getShiftsWithDetails(
  startDate: string,
  endDate: string,
  filters?: {
    departmentIds?: number[];
    employeeGroupIds?: number[];
    shiftTypeIds?: number[];
    positionIds?: number[];
    employeeIds?: number[];
    shiftStatus?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{
  data: Array<Shift & {
    employeeName?: string;
    positionName?: string;
    shiftTypeName?: string;
  }>;
  paging: any;
}> {
  // Get base shift data
  const shiftsResponse = await getShifts(startDate, endDate, filters);
  
  if (shiftsResponse.data.length === 0) {
    return shiftsResponse;
  }

  // Collect unique IDs for batch fetching
  const employeeIds = [...new Set(shiftsResponse.data.map(s => s.employeeId).filter(Boolean))];
  const positionIds = [...new Set(shiftsResponse.data.map(s => s.positionId).filter(Boolean))];
  const shiftTypeIds = [...new Set(shiftsResponse.data.map(s => s.shiftTypeId).filter(Boolean))];

  // Batch fetch related data
  const [employeeMap, positionMap, shiftTypeMap] = await Promise.all([
    getEmployeesByIds(employeeIds as number[]),
    getPositionsByIds(positionIds as number[]),
    getShiftTypesByIds(shiftTypeIds as number[])
  ]);

  // Enhance shift data with resolved names
  const enhancedShifts = shiftsResponse.data.map(shift => ({
    ...shift,
    employeeName: shift.employeeId ? employeeMap.get(shift.employeeId) : undefined,
    positionName: shift.positionId ? positionMap.get(shift.positionId)?.name : undefined,
    shiftTypeName: shift.shiftTypeId ? shiftTypeMap.get(shift.shiftTypeId)?.name : undefined
  }));

  return {
    data: enhancedShifts,
    paging: shiftsResponse.paging
  };
}

/**
 * Helper function to get employee names by IDs
 */
async function getEmployeesByIds(ids: number[]): Promise<Map<number, string>> {
  const employeeMap = new Map<number, string>();
  
  if (ids.length === 0) return employeeMap;

  try {
    // This would need to be imported from hr-api.ts
    const { getEmployees } = await import('./hr-api');
    const employeesResponse = await getEmployees({ limit: 50 });
    
    employeesResponse.data.forEach((employee: any) => {
      if (ids.includes(employee.id)) {
        employeeMap.set(employee.id, `${employee.firstName} ${employee.lastName}`);
      }
    });
  } catch (error) {
    console.error('Error fetching employee names:', error);
  }

  return employeeMap;
}

/**
 * Create a comprehensive shift with validation
 */
export async function createShiftWithValidation(
  shiftData: CreateShiftRequest,
  validateEmployee = true
): Promise<{ shift: Shift; warnings: string[] }> {
  const warnings: string[] = [];

  // Validate employee assignment if provided
  if (validateEmployee && shiftData.employeeId) {
    try {
      // Create temporary shift for validation
      const tempShift = await createShift({ ...shiftData, employeeId: undefined });
      
      // Validate employee can be assigned
      const validation = await validateEmployeeForShift(shiftData.employeeId, tempShift.id);
      
      if (!validation.isValid) {
        warnings.push(`Employee validation warning: ${validation.reason}`);
        // Remove employee assignment but continue with shift creation
        shiftData = { ...shiftData, employeeId: undefined };
      } else {
        // Assign employee to the shift
        await assignShiftToEmployee(tempShift.id, shiftData.employeeId);
      }
      
      return { shift: tempShift, warnings };
    } catch (error) {
      warnings.push(`Employee validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Create shift without employee validation
  const shift = await createShift(shiftData);
  return { shift, warnings };
}

/**
 * Get shift conflicts for an employee
 */
export async function getShiftConflicts(
  employeeId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeShiftId?: number
): Promise<Shift[]> {
  try {
    // Get all shifts for the employee on the specified date
    const shiftsResponse = await getShifts(date, date, {
      employeeIds: [employeeId],
      limit: 50
    });

    // Filter for time conflicts
    const conflicts = shiftsResponse.data.filter(shift => {
      // Skip the shift we're excluding (for updates)
      if (excludeShiftId && shift.id === excludeShiftId) return false;

      // Check for time overlap
      if (shift.startDateTime && shift.endDateTime) {
        const shiftStart = new Date(`${shift.date}T${shift.startDateTime}`);
        const shiftEnd = new Date(`${shift.date}T${shift.endDateTime}`);
        const newStart = new Date(`${date}T${startTime}`);
        const newEnd = new Date(`${date}T${endTime}`);

        // Check for overlap
        return (newStart < shiftEnd && newEnd > shiftStart);
      }

      return false;
    });

    return conflicts;
  } catch (error) {
    console.error(`Error checking shift conflicts for employee ${employeeId}:`, error);
    return [];
  }
}

/**
 * Get available employees for a shift based on requirements
 */
export async function getAvailableEmployeesForShift(
  departmentId: number,
  employeeGroupId: number,
  date: string,
  startTime?: string,
  endTime?: string
): Promise<Array<{ id: number; name: string; isAvailable: boolean; conflictReason?: string }>> {
  try {
    // This would need to be imported from hr-api.ts
    const { getEmployees } = await import('./hr-api');
    
    // Get employees in the required department and group
    const employeesResponse = await getEmployees({ limit: 50 });
    const eligibleEmployees = employeesResponse.data.filter((emp: any) => 
      emp.departments?.includes(departmentId) && 
      emp.employeeGroups?.includes(employeeGroupId)
    );

    // Check availability for each employee
    const availabilityPromises = eligibleEmployees.map(async (emp: any) => {
      let isAvailable = true;
      let conflictReason: string | undefined;

      // Check for time conflicts if times are provided
      if (startTime && endTime) {
        const conflicts = await getShiftConflicts(emp.id, date, startTime, endTime);
        if (conflicts.length > 0) {
          isAvailable = false;
          conflictReason = `Has ${conflicts.length} conflicting shift(s)`;
        }
      }

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        isAvailable,
        conflictReason
      };
    });

    return await Promise.all(availabilityPromises);
  } catch (error) {
    console.error('Error getting available employees:', error);
    return [];
  }
}

// All functions and types are already exported individually above
// No need for a redundant export block at the end
