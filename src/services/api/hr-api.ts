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
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Batch fetch employees by IDs
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
 * Batch fetch departments by IDs
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
