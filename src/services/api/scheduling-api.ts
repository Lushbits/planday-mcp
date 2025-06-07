// src/services/api/scheduling-api.ts
// Comprehensive Planday Scheduling API Implementation
// Covers: Shifts, Positions, Shift Types, Sections, Schedule Days, Skills, History, Time & Cost

import { makeAuthenticatedRequest } from "../auth;

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

// Shift History
export interface ShiftHistoryRecord {
  modifiedAt: string;
  modifiedBy: {
    id: number;
    name: string;
  };
  changes: string[];
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

  const data = await response.json();
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
// SHIFT HISTORY API (Read-only)
// ================================

/**
 * Get history for a specific shift
 */
export async function getShiftHistory(
  shiftId: number,
  filters?: { limit?: number; offset?: number }
): Promise<{ data: ShiftHistoryRecord[]; paging: any }> {
  let url = `https://openapi.planday.com/scheduling/v1.0/shifts/${shiftId}/history`;
  const params = [];
  
  if (filters?.limit) params.push(`limit=${filters.limit}`);
  if (filters?.offset) params.push(`offset=${filters.offset}`);
  
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await makeAuthenticatedRequest(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch shift history: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { data: data.data || [], paging: data.paging || {} };
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
