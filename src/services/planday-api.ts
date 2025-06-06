// src/services/planday-api.ts

export interface PlandayShift {
  id: number;
  employeeId?: number;
  departmentId?: number;
  positionId?: number;
  shiftTypeId?: number;  // Added shift type reference
  startDateTime?: string;
  endDateTime?: string;
  status?: string;
  date: string;
}

export interface PlandayEmployee {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  cellPhone?: string;
  userName?: string;
  primaryDepartmentId?: number;
  hiredDate?: string;
  deactivationDate?: string;
}

export interface PlandayDepartment {
  id: number;
  name: string;
}

export interface PlandayPosition {
  id: number;
  name: string;
}

export interface PlandayAbsenceRecord {
  id: number;
  employeeId: number;
  status: "Pending" | "Approved" | "Declined" | "Cancelled";
  note?: string;
  absencePeriod: {
    start: string;
    end: string;
  };
  registrations: Array<{
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

export interface PlandayShiftType {
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

export interface PlandayAPIResponse<T> {
  data: T[];
  success: boolean;
  message?: string;
}

export class PlandayAPIService {
  private static readonly BASE_URL = 'https://openapi.planday.com';
  private static readonly AUTH_URL = 'https://id.planday.com';
  private static readonly CLIENT_ID = '4b79b7b4-932a-4a3b-9400-dcc24ece299e';

  // Authentication methods
  async exchangeRefreshToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const response = await fetch(`${PlandayAPIService.AUTH_URL}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: PlandayAPIService.CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Core API methods
  async getShifts(accessToken: string, startDate: string, endDate: string): Promise<PlandayAPIResponse<PlandayShift>> {
    const response = await fetch(
      `${PlandayAPIService.BASE_URL}/scheduling/v1.0/shifts?from=${startDate}&to=${endDate}`,
      {
        headers: this.getHeaders(accessToken)
      }
    );
    return this.handleResponse(response);
  }

  async getEmployees(accessToken: string, department?: string): Promise<PlandayAPIResponse<PlandayEmployee>> {
    let url = `${PlandayAPIService.BASE_URL}/hr/v1.0/Employees`;
    if (department) {
      url += `?department=${encodeURIComponent(department)}`;
    }
    
    const response = await fetch(url, {
      headers: this.getHeaders(accessToken)
    });
    return this.handleResponse(response);
  }

  async getDepartments(accessToken: string): Promise<PlandayAPIResponse<PlandayDepartment>> {
    const response = await fetch(
      `${PlandayAPIService.BASE_URL}/hr/v1.0/Departments`,
      {
        headers: this.getHeaders(accessToken)
      }
    );
    return this.handleResponse(response);
  }

  async getPosition(accessToken: string, positionId: number): Promise<{ data: PlandayPosition }> {
    const response = await fetch(
      `${PlandayAPIService.BASE_URL}/scheduling/v1.0/positions/${positionId}`,
      {
        headers: this.getHeaders(accessToken)
      }
    );
    return this.handleResponse(response);
  }

  // Batch operations for efficiency
  async getPositions(accessToken: string, positionIds: number[]): Promise<Map<number, string>> {
    const positionMap = new Map<number, string>();
    
    if (positionIds.length === 0) return positionMap;

    // Fetch positions in parallel
    const positionPromises = positionIds.map(async (positionId) => {
      try {
        const result = await this.getPosition(accessToken, positionId);
        return { id: positionId, name: result.data?.name || `Position ${positionId}` };
      } catch (error) {
        console.error(`Error fetching position ${positionId}:`, error);
        return { id: positionId, name: `Position ${positionId}` };
      }
    });

    const positions = await Promise.all(positionPromises);
    positions.forEach(({ id, name }) => {
      positionMap.set(id, name);
    });

    return positionMap;
  }

  async getEmployeeMap(accessToken: string, employeeIds: number[]): Promise<Map<number, string>> {
    const employeeMap = new Map<number, string>();
    
    if (employeeIds.length === 0) return employeeMap;

    try {
      const result = await this.getEmployees(accessToken);
      if (result.data) {
        result.data.forEach((employee) => {
          if (employeeIds.includes(employee.id)) {
            const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || `Employee ${employee.id}`;
            employeeMap.set(employee.id, fullName);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching employee names:', error);
    }

    return employeeMap;
  }

  async getDepartmentMap(accessToken: string, departmentIds: number[]): Promise<Map<number, string>> {
    const departmentMap = new Map<number, string>();
    
    if (departmentIds.length === 0) return departmentMap;

    try {
      const result = await this.getDepartments(accessToken);
      if (result.data) {
        result.data.forEach((department) => {
          if (departmentIds.includes(department.id)) {
            departmentMap.set(department.id, department.name || `Department ${department.id}`);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching department names:', error);
    }

    return departmentMap;
  }

  // Absence Management API methods
  async getAbsenceRecords(accessToken: string, params?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<PlandayAPIResponse<PlandayAbsenceRecord>> {
    let url = `${PlandayAPIService.BASE_URL}/absence/v1.0/absencerecords`;
    
    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const response = await fetch(url, {
      headers: this.getHeaders(accessToken)
    });
    return this.handleResponse(response);
  }

  async getAbsenceRecord(accessToken: string, recordId: number): Promise<{ data: PlandayAbsenceRecord }> {
    const response = await fetch(
      `${PlandayAPIService.BASE_URL}/absence/v1.0/absencerecords/${recordId}`,
      {
        headers: this.getHeaders(accessToken)
      }
    );
    return this.handleResponse(response);
  }

  // Shift Types API methods
  async getShiftTypes(accessToken: string): Promise<PlandayAPIResponse<PlandayShiftType>> {
    const response = await fetch(
      `${PlandayAPIService.BASE_URL}/scheduling/v1.0/shifttypes`,
      {
        headers: this.getHeaders(accessToken)
      }
    );
    return this.handleResponse(response);
  }

  async getShiftTypeMap(accessToken: string, shiftTypeIds: number[]): Promise<Map<number, string>> {
    const shiftTypeMap = new Map<number, string>();
    
    if (shiftTypeIds.length === 0) return shiftTypeMap;

    try {
      const result = await this.getShiftTypes(accessToken);
      if (result.data) {
        result.data.forEach((shiftType) => {
          if (shiftTypeIds.includes(shiftType.id)) {
            shiftTypeMap.set(shiftType.id, shiftType.name || `Shift Type ${shiftType.id}`);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching shift type names:', error);
    }

    return shiftTypeMap;
  }

  // Raw API call for debugging
  async debugAPICall(accessToken: string, endpoint: string): Promise<any> {
    const response = await fetch(endpoint, {
      headers: this.getHeaders(accessToken)
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Private helper methods
  private getHeaders(accessToken: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'X-ClientId': PlandayAPIService.CLIENT_ID,
      'Content-Type': 'application/json'
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
}

// Export a singleton instance for convenience
export const plandayAPI = new PlandayAPIService();
