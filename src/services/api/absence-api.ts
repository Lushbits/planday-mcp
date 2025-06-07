// src/services/api/absence-api.ts
import { makeAuthenticatedRequest } from "../auth";

// Absence API Types (moved from planday-api.ts)
export interface AbsenceRecord {
  id: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Declined' | 'Cancelled';
  note?: string;
  cost?: number;
  absenceType?: {
    id: number;
    name: string;
  };
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface AbsenceRecordParams {
  employeeId?: number;
  startDate?: string;
  endDate?: string;
  status?: 'Pending' | 'Approved' | 'Declined' | 'Cancelled';
}

/**
 * Get absence records with optional filtering
 */
export async function getAbsenceRecords(params: AbsenceRecordParams = {}): Promise<AbsenceRecord[]> {
  const queryParams = new URLSearchParams();
  
  if (params.employeeId) queryParams.append('employeeId', params.employeeId.toString());
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.status) queryParams.append('status', params.status);

  const url = `https://openapi.planday.com/absence/v1/absencerecords?${queryParams.toString()}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch absence records: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get specific absence record by ID
 */
export async function getAbsenceRecord(recordId: number): Promise<AbsenceRecord | null> {
  try {
    const url = `https://openapi.planday.com/absence/v1/absencerecords/${recordId}`;
    const response = await makeAuthenticatedRequest(url);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch absence record ${recordId}: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching absence record ${recordId}:`, error);
    return null;
  }
}

/**
 * Get pending absence requests (convenience method)
 */
export async function getPendingAbsenceRequests(): Promise<AbsenceRecord[]> {
  return getAbsenceRecords({ status: 'Pending' });
}
