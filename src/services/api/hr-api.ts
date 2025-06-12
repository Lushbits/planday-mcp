// src/services/api/hr-api.ts
import { makeAuthenticatedRequest } from "../auth";

// =============================================================================
// COMPREHENSIVE HR API TYPE DEFINITIONS
// =============================================================================

// Employee Management Types
export interface Employee {
  id: number;
  hiredDate?: string;
  dateTimeCreated?: string;
  dateTimeModified?: string;
  dateTimeDeleted?: string;
  employeeTypeId?: number;
  salaryIdentifier?: string;
  firstName: string;
  lastName: string;
  userName?: string;
  cellPhone?: string;
  street1?: string;
  street2?: string;
  zip?: string;
  city?: string;
  phone?: string;
  email?: string;
  departments?: number[];
  employeeGroups?: number[];
  bankAccount?: BankAccount;
  birthDate?: string;
  ssn?: string;
  cellPhoneCountryPrefix?: string;
  cellPhoneCountryCode?: string;
  phoneCountryPrefix?: string;
  phoneCountryCode?: string;
  gender?: 'Male' | 'Female';
  jobTitle?: string;
  primaryDepartmentId?: number;
  deactivationDate?: string;
  supervisorEmployeeId?: number;
  securityGroups?: number[];
  skillIds?: number[];
  isSupervisor?: boolean;
  supervisorId?: number;
  hiredFrom?: string;
  cellPhoneCountryId?: number;
  phoneCountryId?: number;
  [key: string]: any; // For custom fields
}

export interface BankAccount {
  registrationNumber?: string;
  accountNumber?: string;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  userName: string;
  departments: number[];
  cellPhone?: string;
  birthDate?: string;
  ssn?: string;
  cellPhoneCountryCode?: string;
  cellPhoneCountryId?: number;
  street1?: string;
  street2?: string;
  zip?: string;
  phone?: string;
  phoneCountryCode?: string;
  phoneCountryId?: number;
  city?: string;
  email?: string;
  employeeGroups?: number[];
  hiredFrom?: string;
  gender?: 'Male' | 'Female';
  primaryDepartmentId?: number;
  jobTitle?: string;
  employeeTypeId?: number;
  bankAccount?: BankAccount;
  salaryIdentifier?: string;
  isSupervisor?: boolean;
  supervisorId?: number;
  skillIds?: number[];
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  userName?: string;
  departments?: number[];
  cellPhone?: string;
  birthDate?: string;
  ssn?: string;
  cellPhoneCountryCode?: string;
  cellPhoneCountryId?: number;
  street1?: string;
  street2?: string;
  zip?: string;
  phone?: string;
  phoneCountryCode?: string;
  phoneCountryId?: number;
  city?: string;
  email?: string;
  employeeGroups?: number[];
  hiredFrom?: string;
  gender?: 'Male' | 'Female';
  primaryDepartmentId?: number;
  jobTitle?: string;
  employeeTypeId?: number;
  bankAccount?: BankAccount;
  salaryIdentifier?: string;
  isSupervisor?: boolean;
  supervisorId?: number;
  skillIds?: number[];
}

export interface DeactivateEmployeeRequest {
  date?: string; // YYYY-MM-DD format, null for immediate deactivation
  reason?: string;
  keepShifts?: boolean;
}

export interface ReactivateEmployeeRequest {
  comment?: string;
  departments?: number[];
}

export interface Supervisor {
  id: number;
  employeeId: number;
  name: string;
}

export interface EmployeeFieldDefinitions {
  $schema: string;
  type: string;
  required: string[];
  properties: Record<string, any>;
  definitions: Record<string, any>;
  portalId: number;
  readOnly: string[];
  unique: string[];
}

// Department Management Types
export interface Department {
  id: number;
  name: string;
  number?: string;
}

export interface CreateDepartmentRequest {
  name: string;
  number?: string;
}

export interface UpdateDepartmentRequest {
  name: string;
  number?: string;
}

// Employee Groups Types
export interface EmployeeGroup {
  id: number;
  name: string;
}

export interface CreateEmployeeGroupRequest {
  name: string;
}

export interface UpdateEmployeeGroupRequest {
  name: string;
}

// Skills Management Types
export interface Skill {
  skillId: number;
  name: string;
  description?: string;
  isTimeLimited: boolean;
}

export interface CreateSkillRequest {
  name: string;
  description?: string;
  isTimeLimited: boolean;
}

export interface UpdateSkillRequest {
  name: string;
  description?: string;
  isTimeLimited: boolean;
}

// Employee Types
export interface EmployeeType {
  id: number;
  name: string;
  description?: string;
}

// Employee History Types
export interface EmployeeHistoryEntry {
  op: string; // Operation type (add, replace, remove)
  path: string; // Property path that changed
  value: string; // New value
  modificationDateTime: string;
  modifiedBy: number;
  modifiedByUserGuid: string;
}

// Custom Field Attachment Types
export interface CustomFieldAttachment {
  employeeId: number;
  customPropertyName: string;
  attachmentData: string; // Base64 encoded data URI
}

// Bulk Operations Types
export interface BulkEmployeeResult {
  successful: Array<{
    index: number;
    employee: string;
    id: number;
    userName: string;
  }>;
  failed: Array<{
    index: number;
    employee: string;
    userName: string;
    error: string;
  }>;
  total: number;
}

// API Response Types
export interface PaginatedResponse<T> {
  paging: {
    offset: number;
    limit: number;
    total: number;
  };
  data: T[];
}

export interface ApiResponse<T> {
  data: T;
}

// Query Parameter Types
export interface EmployeeQueryParams {
  limit?: number;
  offset?: number;
  createdFrom?: string;
  createdTo?: string;
  modifiedFrom?: string;
  modifiedTo?: string;
  deactivatedFrom?: string;
  deactivatedTo?: string;
  special?: ('BankAccount' | 'BirthDate' | 'Ssn')[];
  includeSecurityGroups?: boolean;
  searchQuery?: string;
  includeDeleted?: boolean;
  managedEmployeesOnly?: boolean;
}

export interface HistoryQueryParams {
  startDateTime?: string;
  endDateTime?: string;
  offset?: number;
  limit?: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// =============================================================================
// EMPLOYEE MANAGEMENT API FUNCTIONS
// =============================================================================

/**
 * Get a paginated list of active employees
 */
export async function getEmployees(params: EmployeeQueryParams = {}): Promise<PaginatedResponse<Employee>> {
  const queryParams = new URLSearchParams();
  
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  if (params.createdFrom) queryParams.append('createdFrom', params.createdFrom);
  if (params.createdTo) queryParams.append('createdTo', params.createdTo);
  if (params.modifiedFrom) queryParams.append('modifiedFrom', params.modifiedFrom);
  if (params.modifiedTo) queryParams.append('modifiedTo', params.modifiedTo);
  if (params.special) params.special.forEach(s => queryParams.append('special', s));
  if (params.includeSecurityGroups) queryParams.append('includeSecurityGroups', params.includeSecurityGroups.toString());
  if (params.searchQuery) queryParams.append('searchQuery', params.searchQuery);

  const url = `https://openapi.planday.com/hr/v1.0/employees${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch employees: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get a paginated list of deactivated employees
 */
export async function getDeactivatedEmployees(params: EmployeeQueryParams = {}): Promise<PaginatedResponse<Employee>> {
  const queryParams = new URLSearchParams();
  
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  if (params.createdFrom) queryParams.append('createdFrom', params.createdFrom);
  if (params.createdTo) queryParams.append('createdTo', params.createdTo);
  if (params.modifiedFrom) queryParams.append('modifiedFrom', params.modifiedFrom);
  if (params.modifiedTo) queryParams.append('modifiedTo', params.modifiedTo);
  if (params.deactivatedFrom) queryParams.append('deactivatedFrom', params.deactivatedFrom);
  if (params.deactivatedTo) queryParams.append('deactivatedTo', params.deactivatedTo);
  if (params.special) params.special.forEach(s => queryParams.append('special', s));
  if (params.searchQuery) queryParams.append('searchQuery', params.searchQuery);

  const url = `https://openapi.planday.com/hr/v1.0/employees/deactivated${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch deactivated employees: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get employee by ID with optional sensitive data
 */
export async function getEmployeeById(id: number, params: Pick<EmployeeQueryParams, 'special'> = {}): Promise<ApiResponse<Employee>> {
  const queryParams = new URLSearchParams();
  if (params.special) params.special.forEach(s => queryParams.append('special', s));

  const url = `https://openapi.planday.com/hr/v1.0/employees/${id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch employee ${id}: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Create a new employee
 */
export async function createEmployee(employee: CreateEmployeeRequest): Promise<ApiResponse<Employee>> {
  const url = 'https://openapi.planday.com/hr/v1.0/employees';
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employee),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create employee: ${response.status} ${response.statusText} - ${errorData}`);
  }

  return await response.json();
}

/**
 * Create multiple employees in bulk with comprehensive error handling
 */
export async function createEmployeesBulk(
  employees: CreateEmployeeRequest[], 
  options: {
    continueOnError?: boolean;
    validateDepartments?: boolean;
    batchSize?: number;
  } = {}
): Promise<BulkEmployeeResult> {
  const { continueOnError = true, batchSize = 10 } = options;
  
  const results: BulkEmployeeResult = {
    successful: [],
    failed: [],
    total: employees.length
  };

  // Process employees in batches to avoid overwhelming the API
  for (let i = 0; i < employees.length; i += batchSize) {
    const batch = employees.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (employee, batchIndex) => {
      const globalIndex = i + batchIndex;
      
      try {
        const response = await createEmployee(employee);
        
        results.successful.push({
          index: globalIndex + 1,
          employee: `${employee.firstName} ${employee.lastName}`,
          id: response.data.id,
          userName: employee.userName
        });
        
      } catch (error) {
        const failureInfo = {
          index: globalIndex + 1,
          employee: `${employee.firstName} ${employee.lastName}`,
          userName: employee.userName,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        results.failed.push(failureInfo);
        
        if (!continueOnError) {
          throw error;
        }
      }
    });

    // Wait for batch to complete before proceeding
    if (continueOnError) {
      await Promise.allSettled(batchPromises);
    } else {
      await Promise.all(batchPromises);
    }
  }

  return results;
}

/**
 * Update an existing employee
 */
export async function updateEmployee(id: number, employee: UpdateEmployeeRequest, useValidation: boolean = true): Promise<void> {
  const queryParams = new URLSearchParams();
  queryParams.append('useValidation', useValidation.toString());

  const url = `https://openapi.planday.com/hr/v1.0/employees/${id}?${queryParams.toString()}`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employee),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to update employee ${id}: ${response.status} ${response.statusText} - ${errorData}`);
  }
}

/**
 * Update multiple employees in bulk
 */
export async function updateEmployeesBulk(
  updates: Array<{ id: number; data: UpdateEmployeeRequest }>,
  options: {
    continueOnError?: boolean;
    useValidation?: boolean;
    batchSize?: number;
  } = {}
): Promise<{
  successful: Array<{ id: number; employeeName?: string }>;
  failed: Array<{ id: number; employeeName?: string; error: string }>;
  total: number;
}> {
  const { continueOnError = true, useValidation = true, batchSize = 10 } = options;
  
  const results = {
    successful: [] as Array<{ id: number; employeeName?: string }>,
    failed: [] as Array<{ id: number; employeeName?: string; error: string }>,
    total: updates.length
  };

  // Process updates in batches
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async ({ id, data }) => {
      try {
        await updateEmployee(id, data, useValidation);
        
        const employeeName = data.firstName && data.lastName ? 
          `${data.firstName} ${data.lastName}` : undefined;
        
        results.successful.push({ id, employeeName });
        
      } catch (error) {
        const employeeName = data.firstName && data.lastName ? 
          `${data.firstName} ${data.lastName}` : undefined;
        
        results.failed.push({
          id,
          employeeName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        if (!continueOnError) {
          throw error;
        }
      }
    });

    if (continueOnError) {
      await Promise.allSettled(batchPromises);
    } else {
      await Promise.all(batchPromises);
    }
  }

  return results;
}

/**
 * Deactivate an employee
 */
export async function deactivateEmployee(id: number, deactivationData: DeactivateEmployeeRequest): Promise<void> {
  const url = `https://openapi.planday.com/hr/v1.0/employees/deactivate/${id}`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deactivationData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to deactivate employee ${id}: ${response.status} ${response.statusText} - ${errorData}`);
  }
}

/**
 * Reactivate a deactivated employee
 */
export async function reactivateEmployee(id: number, reactivationData: ReactivateEmployeeRequest): Promise<void> {
  const url = `https://openapi.planday.com/hr/v1.0/employees/reactivate/${id}`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reactivationData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to reactivate employee ${id}: ${response.status} ${response.statusText} - ${errorData}`);
  }
}

/**
 * Get list of supervisors
 */
export async function getSupervisors(params: PaginationParams = {}): Promise<PaginatedResponse<Supervisor>> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  const url = `https://openapi.planday.com/hr/v1.0/employees/supervisors${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch supervisors: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get employee field definitions schema
 */
export async function getEmployeeFieldDefinitions(type: 'Post' | 'Put' = 'Post'): Promise<ApiResponse<EmployeeFieldDefinitions>> {
  const queryParams = new URLSearchParams();
  queryParams.append('type', type);

  const url = `https://openapi.planday.com/hr/v1.0/employees/fielddefinitions?${queryParams.toString()}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch employee field definitions: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get employee change history
 */
export async function getEmployeeHistory(employeeId: number, params: HistoryQueryParams = {}): Promise<PaginatedResponse<EmployeeHistoryEntry>> {
  const queryParams = new URLSearchParams();
  if (params.startDateTime) queryParams.append('startDateTime', params.startDateTime);
  if (params.endDateTime) queryParams.append('endDateTime', params.endDateTime);
  if (params.offset) queryParams.append('offset', params.offset.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const url = `https://openapi.planday.com/hr/v1.0/employees/${employeeId}/history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch employee history for ${employeeId}: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// =============================================================================
// DEPARTMENT MANAGEMENT API FUNCTIONS
// =============================================================================

/**
 * Get all departments with pagination
 */
export async function getDepartments(params: PaginationParams = {}): Promise<PaginatedResponse<Department>> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  const url = `https://openapi.planday.com/hr/v1.0/departments${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch departments: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get department by ID
 */
export async function getDepartmentById(id: number, params: Pick<EmployeeQueryParams, 'includeDeleted' | 'managedEmployeesOnly'> = {}): Promise<ApiResponse<Department>> {
  const queryParams = new URLSearchParams();
  if (params.includeDeleted) queryParams.append('includeDeleted', params.includeDeleted.toString());
  if (params.managedEmployeesOnly) queryParams.append('managedEmployeesOnly', params.managedEmployeesOnly.toString());

  const url = `https://openapi.planday.com/hr/v1.0/departments/${id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch department ${id}: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Create a new department
 */
export async function createDepartment(department: CreateDepartmentRequest): Promise<ApiResponse<Department>> {
  const url = 'https://openapi.planday.com/hr/v1.0/departments';
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(department),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create department: ${response.status} ${response.statusText} - ${errorData}`);
  }

  return await response.json();
}

/**
 * Update an existing department
 */
export async function updateDepartment(id: number, department: UpdateDepartmentRequest): Promise<void> {
  const url = `https://openapi.planday.com/hr/v1.0/departments/${id}`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(department),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to update department ${id}: ${response.status} ${response.statusText} - ${errorData}`);
  }
}

/**
 * Delete a department
 */
export async function deleteDepartment(id: number): Promise<void> {
  const url = `https://openapi.planday.com/hr/v1.0/departments/${id}`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to delete department ${id}: ${response.status} ${response.statusText} - ${errorData}`);
  }
}

// =============================================================================
// EMPLOYEE GROUPS API FUNCTIONS
// =============================================================================

/**
 * Get all employee groups with pagination
 */
export async function getEmployeeGroups(params: PaginationParams = {}): Promise<PaginatedResponse<EmployeeGroup>> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  const url = `https://openapi.planday.com/hr/v1.0/employeegroups${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch employee groups: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get employee group by ID
 */
export async function getEmployeeGroupById(id: number): Promise<ApiResponse<EmployeeGroup>> {
  const url = `https://openapi.planday.com/hr/v1.0/employeegroups/${id}`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch employee group ${id}: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Create a new employee group
 */
export async function createEmployeeGroup(group: CreateEmployeeGroupRequest): Promise<ApiResponse<EmployeeGroup>> {
  const url = 'https://openapi.planday.com/hr/v1.0/employeegroups';
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(group),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create employee group: ${response.status} ${response.statusText} - ${errorData}`);
  }

  return await response.json();
}

/**
 * Update an existing employee group
 */
export async function updateEmployeeGroup(id: number, group: UpdateEmployeeGroupRequest): Promise<void> {
  const url = `https://openapi.planday.com/hr/v1.0/employeegroups/${id}`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(group),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to update employee group ${id}: ${response.status} ${response.statusText} - ${errorData}`);
  }
}

/**
 * Delete an employee group
 */
export async function deleteEmployeeGroup(id: number): Promise<void> {
  const url = `https://openapi.planday.com/hr/v1.0/employeegroups/${id}`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to delete employee group ${id}: ${response.status} ${response.statusText} - ${errorData}`);
  }
}

// =============================================================================
// SKILLS MANAGEMENT API FUNCTIONS
// =============================================================================

/**
 * Get all skills available in the portal
 */
export async function getSkills(): Promise<Skill[]> {
  const url = 'https://openapi.planday.com/hr/v1.0/skills';
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch skills: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Create a new skill
 */
export async function createSkill(skill: CreateSkillRequest): Promise<void> {
  const url = 'https://openapi.planday.com/hr/v1.0/skills';
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skill),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create skill: ${response.status} ${response.statusText} - ${errorData}`);
  }
}

/**
 * Update an existing skill
 */
export async function updateSkill(skillId: number, skill: UpdateSkillRequest): Promise<void> {
  const queryParams = new URLSearchParams();
  queryParams.append('skillId', skillId.toString());

  const url = `https://openapi.planday.com/hr/v1.0/skills?${queryParams.toString()}`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skill),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to update skill ${skillId}: ${response.status} ${response.statusText} - ${errorData}`);
  }
}

/**
 * Delete a skill
 */
export async function deleteSkill(skillId: number): Promise<void> {
  const queryParams = new URLSearchParams();
  queryParams.append('skillId', skillId.toString());

  const url = `https://openapi.planday.com/hr/v1.0/skills?${queryParams.toString()}`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to delete skill ${skillId}: ${response.status} ${response.statusText} - ${errorData}`);
  }
}

// =============================================================================
// EMPLOYEE TYPES API FUNCTIONS
// =============================================================================

/**
 * Get all employee types
 */
export async function getEmployeeTypes(): Promise<PaginatedResponse<EmployeeType>> {
  const url = 'https://openapi.planday.com/hr/v1.0/employeetypes';
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch employee types: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// =============================================================================
// CUSTOM FIELD ATTACHMENT API FUNCTIONS
// =============================================================================

/**
 * Get custom field attachment value
 */
export async function getCustomFieldAttachment(employeeId: number, customPropertyName: string): Promise<string> {
  const url = `https://openapi.planday.com/hr/v1.0/employees/${employeeId}/customfields/${customPropertyName}/value`;
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch custom field attachment for employee ${employeeId}: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Create custom field attachment value
 */
export async function createCustomFieldAttachment(employeeId: number, customPropertyName: string, attachmentData: string): Promise<string> {
  const url = `https://openapi.planday.com/hr/v1.0/employees/${employeeId}/customfields/${customPropertyName}/value`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(attachmentData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create custom field attachment for employee ${employeeId}: ${response.status} ${response.statusText} - ${errorData}`);
  }

  return await response.json();
}

/**
 * Update custom field attachment value
 */
export async function updateCustomFieldAttachment(employeeId: number, customPropertyName: string, attachmentData: string): Promise<string> {
  const url = `https://openapi.planday.com/hr/v1.0/employees/${employeeId}/customfields/${customPropertyName}/value`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(attachmentData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to update custom field attachment for employee ${employeeId}: ${response.status} ${response.statusText} - ${errorData}`);
  }

  return await response.json();
}

/**
 * Delete custom field attachment value
 */
export async function deleteCustomFieldAttachment(employeeId: number, customPropertyName: string): Promise<boolean> {
  const url = `https://openapi.planday.com/hr/v1.0/employees/${employeeId}/customfields/${customPropertyName}/value`;
  const response = await makeAuthenticatedRequest(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to delete custom field attachment for employee ${employeeId}: ${response.status} ${response.statusText} - ${errorData}`);
  }

  return await response.json();
}

// =============================================================================
// ADVANCED SEARCH AND FILTERING FUNCTIONS
// =============================================================================

/**
 * Search employees with advanced filtering options
 */
export async function searchEmployees(searchCriteria: {
  query?: string;
  departmentIds?: number[];
  employeeGroupIds?: number[];
  skillIds?: number[];
  jobTitles?: string[];
  employeeTypeIds?: number[];
  supervisorIds?: number[];
  hiredAfter?: string;
  hiredBefore?: string;
  isActive?: boolean;
  hasSkills?: boolean;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<Employee>> {
  // For advanced search, we'll use the basic getEmployees function
  // and then filter the results as needed
  const baseParams: EmployeeQueryParams = {
    limit: searchCriteria.limit || 50,
    offset: searchCriteria.offset || 0,
    searchQuery: searchCriteria.query
  };

  if (searchCriteria.hiredAfter) {
    baseParams.createdFrom = searchCriteria.hiredAfter;
  }
  if (searchCriteria.hiredBefore) {
    baseParams.createdTo = searchCriteria.hiredBefore;
  }

  let employees;
  if (searchCriteria.isActive === false) {
    employees = await getDeactivatedEmployees(baseParams);
  } else {
    employees = await getEmployees(baseParams);
  }

  // Client-side filtering for advanced criteria
  let filteredData = employees.data;

  if (searchCriteria.departmentIds && searchCriteria.departmentIds.length > 0) {
    filteredData = filteredData.filter(emp => 
      emp.departments && emp.departments.some(deptId => searchCriteria.departmentIds!.includes(deptId))
    );
  }

  if (searchCriteria.employeeGroupIds && searchCriteria.employeeGroupIds.length > 0) {
    filteredData = filteredData.filter(emp => 
      emp.employeeGroups && emp.employeeGroups.some(groupId => searchCriteria.employeeGroupIds!.includes(groupId))
    );
  }

  if (searchCriteria.skillIds && searchCriteria.skillIds.length > 0) {
    filteredData = filteredData.filter(emp => 
      emp.skillIds && emp.skillIds.some(skillId => searchCriteria.skillIds!.includes(skillId))
    );
  }

  if (searchCriteria.jobTitles && searchCriteria.jobTitles.length > 0) {
    filteredData = filteredData.filter(emp => 
      emp.jobTitle && searchCriteria.jobTitles!.some(title => 
        emp.jobTitle!.toLowerCase().includes(title.toLowerCase())
      )
    );
  }

  if (searchCriteria.employeeTypeIds && searchCriteria.employeeTypeIds.length > 0) {
    filteredData = filteredData.filter(emp => 
      emp.employeeTypeId && searchCriteria.employeeTypeIds!.includes(emp.employeeTypeId)
    );
  }

  if (searchCriteria.supervisorIds && searchCriteria.supervisorIds.length > 0) {
    filteredData = filteredData.filter(emp => 
      emp.supervisorEmployeeId && searchCriteria.supervisorIds!.includes(emp.supervisorEmployeeId)
    );
  }

  if (searchCriteria.hasSkills !== undefined) {
    filteredData = filteredData.filter(emp => 
      searchCriteria.hasSkills ? (emp.skillIds && emp.skillIds.length > 0) : (!emp.skillIds || emp.skillIds.length === 0)
    );
  }

  return {
    paging: {
      ...employees.paging,
      total: filteredData.length
    },
    data: filteredData
  };
}

/**
 * Get employees by department with detailed information
 */
export async function getEmployeesByDepartment(departmentId: number, params: EmployeeQueryParams = {}): Promise<PaginatedResponse<Employee>> {
  const employees = await getEmployees(params);
  
  const filteredData = employees.data.filter(emp => 
    emp.departments && emp.departments.includes(departmentId)
  );

  return {
    paging: {
      ...employees.paging,
      total: filteredData.length
    },
    data: filteredData
  };
}

/**
 * Get employees by job title
 */
export async function getEmployeesByJobTitle(jobTitle: string, params: EmployeeQueryParams = {}): Promise<PaginatedResponse<Employee>> {
  const employees = await getEmployees(params);
  
  const filteredData = employees.data.filter(emp => 
    emp.jobTitle && emp.jobTitle.toLowerCase().includes(jobTitle.toLowerCase())
  );

  return {
    paging: {
      ...employees.paging,
      total: filteredData.length
    },
    data: filteredData
  };
}

/**
 * Get employees by skill
 */
export async function getEmployeesBySkill(skillId: number, params: EmployeeQueryParams = {}): Promise<PaginatedResponse<Employee>> {
  const employees = await getEmployees(params);
  
  const filteredData = employees.data.filter(emp => 
    emp.skillIds && emp.skillIds.includes(skillId)
  );

  return {
    paging: {
      ...employees.paging,
      total: filteredData.length
    },
    data: filteredData
  };
}

// =============================================================================
// BATCH AND UTILITY FUNCTIONS
// =============================================================================

/**
 * Batch fetch employees by IDs with enhanced error handling
 */
export async function getEmployeesByIds(ids: number[]): Promise<Map<number, Employee>> {
  const employeeMap = new Map<number, Employee>();
  
  if (ids.length === 0) return employeeMap;

  try {
    // Get employees in batches to handle large ID lists
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < ids.length; i += batchSize) {
      batches.push(ids.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const response = await getEmployees({ limit: 50 });
      response.data.forEach((employee) => {
        if (batch.includes(employee.id)) {
          employeeMap.set(employee.id, employee);
        }
      });
    }
  } catch (error) {
    console.error('Error fetching employees by IDs:', error);
  }

  return employeeMap;
}

/**
 * Batch fetch departments by IDs with enhanced error handling
 */
export async function getDepartmentsByIds(ids: number[]): Promise<Map<number, Department>> {
  const departmentMap = new Map<number, Department>();
  
  if (ids.length === 0) return departmentMap;

  try {
    const response = await getDepartments({ limit: 50 });
    response.data.forEach((department) => {
      if (ids.includes(department.id)) {
        departmentMap.set(department.id, department);
      }
    });
  } catch (error) {
    console.error('Error fetching departments by IDs:', error);
  }

  return departmentMap;
}

/**
 * Batch fetch employee groups by IDs
 */
export async function getEmployeeGroupsByIds(ids: number[]): Promise<Map<number, EmployeeGroup>> {
  const groupMap = new Map<number, EmployeeGroup>();
  
  if (ids.length === 0) return groupMap;

  try {
    const response = await getEmployeeGroups({ limit: 50 });
    response.data.forEach((group) => {
      if (ids.includes(group.id)) {
        groupMap.set(group.id, group);
      }
    });
  } catch (error) {
    console.error('Error fetching employee groups by IDs:', error);
  }

  return groupMap;
}

/**
 * Batch fetch skills by IDs
 */
export async function getSkillsByIds(ids: number[]): Promise<Map<number, Skill>> {
  const skillMap = new Map<number, Skill>();
  
  if (ids.length === 0) return skillMap;

  try {
    const skills = await getSkills();
    skills.forEach((skill) => {
      if (ids.includes(skill.skillId)) {
        skillMap.set(skill.skillId, skill);
      }
    });
  } catch (error) {
    console.error('Error fetching skills by IDs:', error);
  }

  return skillMap;
}

/**
 * Resolve employee names from IDs
 */
export async function resolveEmployeeNames(employeeIds: number[]): Promise<Map<number, string>> {
  const nameMap = new Map<number, string>();
  
  if (employeeIds.length === 0) return nameMap;

  try {
    const employeeMap = await getEmployeesByIds(employeeIds);
    employeeMap.forEach((employee, id) => {
      const fullName = `${employee.firstName} ${employee.lastName}`.trim();
      nameMap.set(id, fullName);
    });
  } catch (error) {
    console.error('Error resolving employee names:', error);
  }

  return nameMap;
}

/**
 * Resolve department names from IDs
 */
export async function resolveDepartmentNames(departmentIds: number[]): Promise<Map<number, string>> {
  const nameMap = new Map<number, string>();
  
  if (departmentIds.length === 0) return nameMap;

  try {
    const departmentMap = await getDepartmentsByIds(departmentIds);
    departmentMap.forEach((department, id) => {
      nameMap.set(id, department.name);
    });
  } catch (error) {
    console.error('Error resolving department names:', error);
  }

  return nameMap;
}

/**
 * Resolve employee group names from IDs
 */
export async function resolveEmployeeGroupNames(groupIds: number[]): Promise<Map<number, string>> {
  const nameMap = new Map<number, string>();
  
  if (groupIds.length === 0) return nameMap;

  try {
    const groupMap = await getEmployeeGroupsByIds(groupIds);
    groupMap.forEach((group, id) => {
      nameMap.set(id, group.name);
    });
  } catch (error) {
    console.error('Error resolving employee group names:', error);
  }

  return nameMap;
}

/**
 * Resolve skill names from IDs
 */
export async function resolveSkillNames(skillIds: number[]): Promise<Map<number, string>> {
  const nameMap = new Map<number, string>();
  
  if (skillIds.length === 0) return nameMap;

  try {
    const skillMap = await getSkillsByIds(skillIds);
    skillMap.forEach((skill, id) => {
      nameMap.set(id, skill.name);
    });
  } catch (error) {
    console.error('Error resolving skill names:', error);
  }

  return nameMap;
}

// =============================================================================
// DATA VALIDATION AND HELPER FUNCTIONS
// =============================================================================

/**
 * Validate employee data before creation/update
 */
export function validateEmployeeData(employee: Partial<CreateEmployeeRequest | UpdateEmployeeRequest>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields for creation
  if ('firstName' in employee && 'lastName' in employee && 'userName' in employee) {
    if (!employee.firstName || employee.firstName.trim().length === 0) {
      errors.push('First name is required');
    }
    if (!employee.lastName || employee.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }
    if (!employee.userName || employee.userName.trim().length === 0) {
      errors.push('Username is required');
    }
    if (employee.userName && !isValidEmail(employee.userName)) {
      errors.push('Username must be a valid email address');
    }
  }

  // Validate email format
  if (employee.email && !isValidEmail(employee.email)) {
    errors.push('Email must be a valid email address');
  }

  // Validate date formats
  if (employee.birthDate && !isValidDate(employee.birthDate)) {
    errors.push('Birth date must be in YYYY-MM-DD format');
  }
  if (employee.hiredFrom && !isValidDate(employee.hiredFrom)) {
    errors.push('Hire date must be in YYYY-MM-DD format');
  }

  // Validate gender
  if (employee.gender && !['Male', 'Female'].includes(employee.gender)) {
    errors.push('Gender must be either "Male" or "Female"');
  }

  // Validate phone numbers (basic validation)
  if (employee.cellPhone && employee.cellPhone.length > 0 && !/^[\d\s\-\+\(\)]+$/.test(employee.cellPhone)) {
    errors.push('Cell phone must contain only numbers, spaces, hyphens, plus signs, and parentheses');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate department data
 */
export function validateDepartmentData(department: CreateDepartmentRequest | UpdateDepartmentRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!department.name || department.name.trim().length === 0) {
    errors.push('Department name is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate skill data
 */
export function validateSkillData(skill: CreateSkillRequest | UpdateSkillRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!skill.name || skill.name.trim().length === 0) {
    errors.push('Skill name is required');
  }

  if (typeof skill.isTimeLimited !== 'boolean') {
    errors.push('isTimeLimited must be a boolean value');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper function to validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Helper function to sanitize employee data
 */
export function sanitizeEmployeeData(employee: Partial<CreateEmployeeRequest | UpdateEmployeeRequest>): Partial<CreateEmployeeRequest | UpdateEmployeeRequest> {
  const sanitized = { ...employee };

  // Trim string fields
  if (sanitized.firstName) sanitized.firstName = sanitized.firstName.trim();
  if (sanitized.lastName) sanitized.lastName = sanitized.lastName.trim();
  if (sanitized.userName) sanitized.userName = sanitized.userName.trim().toLowerCase();
  if (sanitized.email) sanitized.email = sanitized.email.trim().toLowerCase();
  if (sanitized.jobTitle) sanitized.jobTitle = sanitized.jobTitle.trim();
  if (sanitized.street1) sanitized.street1 = sanitized.street1.trim();
  if (sanitized.street2) sanitized.street2 = sanitized.street2.trim();
  if (sanitized.city) sanitized.city = sanitized.city.trim();
  if (sanitized.zip) sanitized.zip = sanitized.zip.trim();

  // Remove empty arrays
  if (sanitized.departments && sanitized.departments.length === 0) delete sanitized.departments;
  if (sanitized.employeeGroups && sanitized.employeeGroups.length === 0) delete sanitized.employeeGroups;
  if (sanitized.skillIds && sanitized.skillIds.length === 0) delete sanitized.skillIds;

  return sanitized;
}

// =============================================================================
// EXPORT ALL FUNCTIONS
// =============================================================================

/* export {
  // Core employee management
  getEmployees,
  getDeactivatedEmployees,
  getEmployeeById,
  createEmployee,
  createEmployeesBulk,
  updateEmployee,
  updateEmployeesBulk,
  deactivateEmployee,
  reactivateEmployee,
  
  // Employee support functions
  getSupervisors,
  getEmployeeFieldDefinitions,
  getEmployeeHistory,
  
  // Department management
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  
  // Employee groups
  getEmployeeGroups,
  getEmployeeGroupById,
  createEmployeeGroup,
  updateEmployeeGroup,
  deleteEmployeeGroup,
  
  // Skills management
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  
  // Employee types
  getEmployeeTypes,
  
  // Custom field attachments
  getCustomFieldAttachment,
  createCustomFieldAttachment,
  updateCustomFieldAttachment,
  deleteCustomFieldAttachment,
  
  // Advanced search and filtering
  searchEmployees,
  getEmployeesByDepartment,
  getEmployeesByJobTitle,
  getEmployeesBySkill,
  
  // Batch operations
  getEmployeesByIds,
  getDepartmentsByIds,
  getEmployeeGroupsByIds,
  getSkillsByIds,
  
  // Name resolution
  resolveEmployeeNames,
  resolveDepartmentNames,
  resolveEmployeeGroupNames,
  resolveSkillNames,
  
  // Validation and sanitization
  validateEmployeeData,
  validateDepartmentData,
  validateSkillData,
  sanitizeEmployeeData
};
*/
