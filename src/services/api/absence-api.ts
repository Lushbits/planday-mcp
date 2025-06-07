// src/services/api/absence-api.ts
import { makeAuthenticatedRequest } from "../auth";

// Absence API Types (based on actual API spec)
export interface AbsenceRecord {
  id: number;
  employeeId: number;
  status: 'Declined' | 'Approved'; // API only supports these two statuses
  note?: string;
  absencePeriod: {
    start: string;
    end: string;
  };
  registrations?: Array<{
    date: string;
    time: {
      start: string;
      end: string;
    };
    account: {
      id: number;
      costs: Array<{
        value: number;
        unit: {
          type: string;
        };
      }>;
    };
  }>;
}

export interface AbsenceRecordParams {
  employeeId?: number;
  startDate?: string;
  endDate?: string;
  statuses?: ('Declined' | 'Approved')[]; // Updated to match API spec
}

/**
 * Get absence records with optional filtering
 * Uses the correct absence API endpoint
 */
export async function getAbsenceRecords(params: AbsenceRecordParams = {}): Promise<AbsenceRecord[]> {
  const queryParams = new URLSearchParams();
  
  if (params.employeeId) queryParams.append('employeeId', params.employeeId.toString());
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.statuses && params.statuses.length > 0) {
    // API expects multiple statuses parameters
    params.statuses.forEach(status => queryParams.append('statuses', status));
  }

  // Use correct API URL with v1.0
  const url = `https://openapi.planday.com/absence/v1.0/absencerecords?${queryParams.toString()}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch absence records: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as any;
  return data.data || [];
}

/**
 * Get specific absence record by ID
 */
export async function getAbsenceRecord(recordId: number): Promise<AbsenceRecord | null> {
  try {
    // Use correct API URL with v1.0
    const url = `https://openapi.planday.com/absence/v1.0/absencerecords/${recordId}`;
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
 * Get approved absence requests (convenience method)
 */
export async function getApprovedAbsenceRequests(params: { startDate?: string; endDate?: string } = {}): Promise<AbsenceRecord[]> {
  return getAbsenceRecords({ 
    ...params,
    statuses: ['Approved'] 
  });
}

/**
 * Get declined absence requests (convenience method)
 */
export async function getDeclinedAbsenceRequests(params: { startDate?: string; endDate?: string } = {}): Promise<AbsenceRecord[]> {
  return getAbsenceRecords({ 
    ...params,
    statuses: ['Declined'] 
  });
}
