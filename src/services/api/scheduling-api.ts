// src/services/api/scheduling-api.ts
import { makeAuthenticatedRequest } from "../auth.ts";

// Scheduling API Types (from working planday-api.ts)
export interface Shift {
  id: number;
  employeeId?: number;
  departmentId?: number;
  positionId?: number;
  shiftTypeId?: number;
  startDateTime?: string;
  endDateTime?: string;
  status?: string;
  date: string;
}

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

export interface Position {
  id: number;
  name: string;
}

/**
 * Get shifts for a date range (using working endpoint)
 */
export async function getShifts(startDate: string, endDate: string): Promise<Shift[]> {
  const url = `https://openapi.planday.com/scheduling/v1.0/shifts?from=${startDate}&to=${endDate}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch shifts: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get all shift types (using working endpoint)
 */
export async function getShiftTypes(): Promise<ShiftType[]> {
  const url = 'https://openapi.planday.com/scheduling/v1.0/shifttypes';
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch shift types: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get position by ID (using working endpoint)
 */
export async function getPositionById(id: number): Promise<Position | null> {
  try {
    const url = `https://openapi.planday.com/scheduling/v1.0/positions/${id}`;
    const response = await makeAuthenticatedRequest(url);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch position ${id}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error(`Error fetching position ${id}:`, error);
    return null;
  }
}

/**
 * Get shift type by ID
 */
export async function getShiftTypeById(id: number): Promise<ShiftType | null> {
  try {
    const allShiftTypes = await getShiftTypes();
    return allShiftTypes.find(st => st.id === id) || null;
  } catch (error) {
    console.error(`Error fetching shift type ${id}:`, error);
    return null;
  }
}

/**
 * Batch fetch shift types by IDs (using working logic)
 */
export async function getShiftTypesByIds(ids: number[]): Promise<Map<number, ShiftType>> {
  const shiftTypeMap = new Map<number, ShiftType>();
  
  if (ids.length === 0) return shiftTypeMap;

  try {
    const allShiftTypes = await getShiftTypes();
    allShiftTypes.forEach((shiftType) => {
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
 * Batch fetch positions by IDs (using working logic)
 */
export async function getPositionsByIds(ids: number[]): Promise<Map<number, Position>> {
  const positionMap = new Map<number, Position>();
  
  if (ids.length === 0) return positionMap;

  // Fetch positions in parallel
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
