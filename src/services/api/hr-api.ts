// src/services/api/hr-api.ts
import { makeAuthenticatedRequest } from "../auth.ts";

// HR API Types (from working planday-api.ts)
export interface Employee {
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

export interface Department {
  id: number;
  name: string;
}

/**
 * Get all employees with optional department filtering (using working endpoint)
 */
export async function getEmployees(department?: string): Promise<Employee[]> {
  let url = 'https://openapi.planday.com/hr/v1.0/Employees';
  if (department) {
    url += `?department=${encodeURIComponent(department)}`;
  }
  
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch employees: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id: number): Promise<Employee | null> {
  try {
    const allEmployees = await getEmployees();
    return allEmployees.find(emp => emp.id === id) || null;
  } catch (error) {
    console.error(`Error fetching employee ${id}:`, error);
    return null;
  }
}

/**
 * Get all departments (using working endpoint)
 */
export async function getDepartments(): Promise<Department[]> {
  const url = 'https://openapi.planday.com/hr/v1.0/Departments';
  const response = await makeAuthenticatedRequest(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch departments: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get department by ID
 */
export async function getDepartmentById(id: number): Promise<Department | null> {
  try {
    const allDepartments = await getDepartments();
    return allDepartments.find(dept => dept.id === id) || null;
  } catch (error) {
    console.error(`Error fetching department ${id}:`, error);
    return null;
  }
}

/**
 * Batch fetch employees by IDs (using working logic)
 */
export async function getEmployeesByIds(ids: number[]): Promise<Map<number, Employee>> {
  const employeeMap = new Map<number, Employee>();
  
  if (ids.length === 0) return employeeMap;

  try {
    const allEmployees = await getEmployees();
    allEmployees.forEach((employee) => {
      if (ids.includes(employee.id)) {
        employeeMap.set(employee.id, employee);
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
  }

  return employeeMap;
}

/**
 * Batch fetch departments by IDs (using working logic)
 */
export async function getDepartmentsByIds(ids: number[]): Promise<Map<number, Department>> {
  const departmentMap = new Map<number, Department>();
  
  if (ids.length === 0) return departmentMap;

  try {
    const allDepartments = await getDepartments();
    allDepartments.forEach((department) => {
      if (ids.includes(department.id)) {
        departmentMap.set(department.id, department);
      }
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
  }

  return departmentMap;
}
