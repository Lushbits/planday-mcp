// src/tools/hr-tools.ts - Comprehensive HR tools with enhanced employee creation

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authService } from '../services/auth';

// Import comprehensive HR API functions
import {
  getEmployees,
  getDeactivatedEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  getSupervisors,
  getEmployeeFieldDefinitions,
  getEmployeeHistory,
  // Department Management
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  // Employee Groups
  getEmployeeGroups,
  getEmployeeGroupById,
  createEmployeeGroup,
  updateEmployeeGroup,
  deleteEmployeeGroup,
  // Skills
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  // Employee Types
  getEmployeeTypes,
  // Custom Field Attachments
  getCustomFieldAttachment,
  createCustomFieldAttachment,
  updateCustomFieldAttachment,
  deleteCustomFieldAttachment
} from '../services/api/hr-api';

// Import comprehensive HR formatters
import {
  formatEmployees,
  formatDeactivatedEmployees,
  formatEmployeeDetail,
  formatSupervisors,
  formatEmployeeHistory,
  formatFieldDefinitions,
  formatEmployeeOperationResult,
  formatDepartments,
  formatDepartmentOperationResult,
  formatEmployeeGroups,
  formatGroupOperationResult,
  formatSkills,
  formatSkillOperationResult,
  formatEmployeeTypes,
  formatError
} from '../services/formatters/hr-formatters';

export function registerHRTools(server: McpServer) {
  
  // =============================================================================
  // ENHANCED EMPLOYEE CREATION AND MANAGEMENT TOOLS
  // =============================================================================
  
  // Enhanced comprehensive employee creation
  server.tool(
    "create-employee",
    "Create new employee profiles with comprehensive information and department assignments. Supports all employee fields including personal details, contact info, employment data, and organizational assignments. Use when asked to: 'Add new employee', 'Hire someone for kitchen', 'Create profile for new staff member'",
    {
      // Required fields
      firstName: z.string().min(1).describe("Employee's first name (required, e.g., 'Sarah')"),
      lastName: z.string().min(1).describe("Employee's last name (required, e.g., 'Johnson')"),
      userName: z.string().email().describe("Employee's username which must be an email address (required, e.g., 'sarah.johnson@company.com')"),
      departments: z.array(z.number().positive()).min(1).describe("Array of department IDs to assign the employee to (required, use get-departments to find department IDs)"),
      
      // Contact Information
      email: z.string().email().optional().describe("Primary email address for communication (can be same as userName)"),
      cellPhone: z.string().optional().describe("Cell phone number for contact (e.g., '+1-555-123-4567' or '5551234567')"),
      cellPhoneCountryCode: z.string().optional().describe("Country code for cell phone (ISO 3155 alpha-2, e.g., 'US', 'DK', 'UK')"),
      cellPhoneCountryId: z.number().optional().describe("Country code ID for cell phone number"),
      phone: z.string().optional().describe("Landline phone number (not frequently used)"),
      phoneCountryCode: z.string().optional().describe("Country code for phone (ISO 3155 alpha-2, e.g., 'US', 'DK', 'UK')"),
      phoneCountryId: z.number().optional().describe("Country code ID for phone number"),
      
      // Address Information
      street1: z.string().optional().describe("Primary address line (e.g., '123 Main Street')"),
      street2: z.string().optional().describe("Secondary address line (e.g., 'Apt 4B', 'Suite 200')"),
      city: z.string().optional().describe("City name (e.g., 'New York', 'Copenhagen')"),
      zip: z.string().optional().describe("Postal/ZIP code (e.g., '10001', '2100')"),
      
      // Personal Information
      birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Birth date in YYYY-MM-DD format (e.g., '1990-05-15')"),
      gender: z.enum(['Male', 'Female']).optional().describe("Employee gender"),
      ssn: z.string().optional().describe("Social security number (use with caution for privacy)"),
      
      // Employment Details
      hiredFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Hire date in YYYY-MM-DD format (e.g., '2025-06-07')"),
      jobTitle: z.string().optional().describe("Job title or position (e.g., 'Kitchen Manager', 'Server', 'Cashier')"),
      employeeTypeId: z.number().optional().describe("Employee type ID (use get-employee-types to find options)"),
      salaryIdentifier: z.string().optional().describe("Salary code identifier for payroll (e.g., 'EMP001')"),
      
      // Organizational Assignments
      primaryDepartmentId: z.number().positive().optional().describe("Primary department ID where employee mainly works"),
      employeeGroups: z.array(z.number().positive()).optional().describe("Array of employee group IDs (use get-employee-groups to find options)"),
      skillIds: z.array(z.number().positive()).optional().describe("Array of skill IDs that the employee possesses (use get-skills to find options)"),
      
      // Supervision and Management
      isSupervisor: z.boolean().optional().describe("Set to true to make this employee a supervisor (visible in GET supervisors)"),
      supervisorId: z.number().positive().optional().describe("ID of the supervisor this employee reports to (use get-supervisors to find options)"),
      
      // Financial Information
      bankAccount: z.object({
        registrationNumber: z.string().optional().describe("Bank registration number"),
        accountNumber: z.string().optional().describe("Bank account number")
      }).optional().describe("Bank account information for payroll")
    },
    async (params) => {
      try {
        const accessToken = await authService.getValidAccessToken();
        if (!accessToken) {
          return {
            content: [{
              type: "text",
              text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
            }]
          };
        }

        const response = await createEmployee(params);
        const formatted = formatEmployeeOperationResult('create', response.data);
        
        return {
          content: [{
            type: "text",
            text: formatted
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: formatError("creating employee", error)
          }]
        };
      }
    }
  );

  // Bulk employee creation tool
  server.tool(
    "create-employees-bulk",
    "Create multiple employees at once from a structured list. Efficiently processes multiple employee records with comprehensive error handling and reporting. Use when asked to: 'Bulk create employees', 'Import employee list', 'Add multiple staff members', 'Process employee spreadsheet data'",
    {
      employees: z.array(z.object({
        // Required fields for each employee
        firstName: z.string().min(1).describe("Employee's first name"),
        lastName: z.string().min(1).describe("Employee's last name"),
        userName: z.string().email().describe("Employee's username (must be email)"),
        departments: z.array(z.number().positive()).min(1).describe("Department IDs array"),
        
        // Optional fields (same as single creation)
        email: z.string().email().optional(),
        cellPhone: z.string().optional(),
        cellPhoneCountryCode: z.string().optional(),
        cellPhoneCountryId: z.number().optional(),
        phone: z.string().optional(),
        phoneCountryCode: z.string().optional(),
        phoneCountryId: z.number().optional(),
        street1: z.string().optional(),
        street2: z.string().optional(),
        city: z.string().optional(),
        zip: z.string().optional(),
        birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        gender: z.enum(['Male', 'Female']).optional(),
        ssn: z.string().optional(),
        hiredFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        jobTitle: z.string().optional(),
        employeeTypeId: z.number().optional(),
        salaryIdentifier: z.string().optional(),
        primaryDepartmentId: z.number().positive().optional(),
        employeeGroups: z.array(z.number().positive()).optional(),
        skillIds: z.array(z.number().positive()).optional(),
        isSupervisor: z.boolean().optional(),
        supervisorId: z.number().positive().optional(),
        bankAccount: z.object({
          registrationNumber: z.string().optional(),
          accountNumber: z.string().optional()
        }).optional()
      })).min(1).max(50).describe("Array of employee objects to create (maximum 50 employees per batch)"),
      
      continueOnError: z.boolean().optional().default(true).describe("Continue processing if individual employee creation fails (default: true)"),
      validateDepartments: z.boolean().optional().default(true).describe("Validate that department IDs exist before creating employees (default: true)")
    },
    async ({ employees, continueOnError = true, validateDepartments = true }) => {
      try {
        const accessToken = await authService.getValidAccessToken();
        if (!accessToken) {
          return {
            content: [{
              type: "text",
              text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
            }]
          };
        }

        // Optional department validation
        if (validateDepartments) {
          try {
            const departmentsResponse = await getDepartments({ limit: 50 });
            const validDepartmentIds = new Set(departmentsResponse.data.map(d => d.id));
            
            for (const emp of employees) {
              const invalidDepts = emp.departments.filter(id => !validDepartmentIds.has(id));
              if (invalidDepts.length > 0) {
                return {
                  content: [{
                    type: "text",
                    text: `❌ **Validation Error**\n\nEmployee "${emp.firstName} ${emp.lastName}" has invalid department IDs: ${invalidDepts.join(', ')}\n\nPlease use get-departments to find valid department IDs.`
                  }]
                };
              }
              
              if (emp.primaryDepartmentId && !validDepartmentIds.has(emp.primaryDepartmentId)) {
                return {
                  content: [{
                    type: "text",
                    text: `❌ **Validation Error**\n\nEmployee "${emp.firstName} ${emp.lastName}" has invalid primary department ID: ${emp.primaryDepartmentId}\n\nPlease use get-departments to find valid department IDs.`
                  }]
                };
              }
            }
          } catch (error) {
            // Continue without validation if API call fails
            console.warn('Department validation failed:', error);
          }
        }

        const results = {
          successful: [] as any[],
          failed: [] as any[],
          total: employees.length
        };

        // Process each employee
        for (let i = 0; i < employees.length; i++) {
          const employee = employees[i];
          
          try {
            const response = await createEmployee(employee);
            results.successful.push({
              index: i + 1,
              employee: `${employee.firstName} ${employee.lastName}`,
              id: response.data.id,
              userName: employee.userName
            });
          } catch (error) {
            const failureInfo = {
              index: i + 1,
              employee: `${employee.firstName} ${employee.lastName}`,
              userName: employee.userName,
              error: error.message || 'Unknown error'
            };
            
            results.failed.push(failureInfo);
            
            if (!continueOnError) {
              return {
                content: [{
                  type: "text",
                  text: `❌ **Bulk Creation Stopped**\n\n` +
                        `Failed to create employee ${i + 1}: ${employee.firstName} ${employee.lastName}\n` +
                        `Error: ${error.message}\n\n` +
                        `Successfully created: ${results.successful.length}\n` +
                        `Failed: ${results.failed.length}\n\n` +
                        `Set continueOnError to true to process remaining employees despite failures.`
                }]
              };
            }
          }
        }

        // Format comprehensive results
        const formatted = formatBulkEmployeeCreationResult(results);
        
        return {
          content: [{
            type: "text",
            text: formatted
          }]
        };
        
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: formatError("bulk creating employees", error)
          }]
        };
      }
    }
  );

  // Employee data template generator for bulk imports
  server.tool(
    "get-employee-creation-template",
    "Generate a template structure for bulk employee creation showing all available fields and their requirements. Helps understand what data is needed for employee import. Use when asked to: 'Show employee template', 'What fields can I use for employees?', 'Help me format employee data'",
    {
      includeExamples: z.boolean().optional().default(true).describe("Include example data in the template (default: true)"),
      includeOptionalFields: z.boolean().optional().default(true).describe("Include optional fields in template (default: true)")
    },
    async ({ includeExamples = true, includeOptionalFields = true }) => {
      try {
        const accessToken = await authService.getValidAccessToken();
        if (!accessToken) {
          return {
            content: [{
              type: "text",
              text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
            }]
          };
        }

        // Get current field definitions from API
        let fieldDefinitions = null;
        try {
          const response = await getEmployeeFieldDefinitions('Post');
          fieldDefinitions = response.data;
        } catch (error) {
          // Continue without field definitions if API call fails
        }

        const template = formatEmployeeCreationTemplate({
          includeExamples,
          includeOptionalFields,
          fieldDefinitions
        });

        return {
          content: [{
            type: "text",
            text: template
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: formatError("generating employee creation template", error)
          }]
        };
      }
    }
  );

  // =============================================================================
  // EXISTING EMPLOYEE MANAGEMENT TOOLS (Enhanced)
  // =============================================================================
  
  // Enhanced get-employees with more parameters
  server.tool(
    "get-employees",
    "Get complete employee directory with names, contact details, departments, and job titles. Shows who works where, their roles, hire dates, and supervisor relationships. Perfect for questions like: 'Who works in the kitchen?', 'Show me all employees', 'Find employees by name or email'",
    {
      limit: z.number().min(1).max(50).optional().describe("Maximum number of records to return (1-50, useful for large organizations)"),
      offset: z.number().min(0).optional().describe("Number of records to skip for pagination (e.g., 50 to get the next page)"),
      searchQuery: z.string().optional().describe("Search employees by name, email, or phone number (e.g., 'Sarah' or 'sarah@company.com')"),
      includeSecurityGroups: z.boolean().optional().describe("Include security group information for access control management"),
      special: z.array(z.enum(['BankAccount', 'BirthDate', 'Ssn'])).optional().describe("Include sensitive fields like bank details, birth date, or SSN (use with caution)")
    },
    async ({ limit, offset, searchQuery, includeSecurityGroups, special }) => {
      try {
        const accessToken = await authService.getValidAccessToken();
        if (!accessToken) {
          return {
            content: [{
              type: "text",
              text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
            }]
          };
        }

        const response = await getEmployees({
          limit,
          offset,
          searchQuery,
          includeSecurityGroups,
          special
        });

        const formatted = formatEmployees(response.data, response.paging, {
          searchQuery,
          limit,
          offset
        });
        
        return {
          content: [{
            type: "text",
            text: formatted
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: formatError("fetching employees", error)
          }]
        };
      }
    }
  );

  // Enhanced get-employee-by-id with sensitive data options
  server.tool(
    "get-employee-by-id",
    "Get detailed information for one specific employee including all profile data, contact info, and work assignments. Shows complete employee record with sensitive data options. Perfect for questions like: 'Tell me about employee 123', 'Show John Smith's details', 'Get Sarah's contact information'",
    {
      employeeId: z.number().positive().describe("Specific employee ID number (use get-employees first to find the right ID, e.g., 12345)"),
      special: z.array(z.enum(['BankAccount', 'BirthDate', 'Ssn'])).optional().describe("Include sensitive fields like bank account details, birth date, or SSN (use with caution)")
    },
    async ({ employeeId, special }) => {
      try {
        const accessToken = await authService.getValidAccessToken();
        if (!accessToken) {
          return {
            content: [{
              type: "text",
              text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
            }]
          };
        }

        const response = await getEmployeeById(employeeId, { special });
        const formatted = formatEmployeeDetail(response.data);
        
        return {
          content: [{
            type: "text",
            text: formatted
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: formatError(`fetching employee ${employeeId}`, error)
          }]
        };
      }
    }
  );

  // Additional tools continue here... (get-deactivated-employees, update-employee, etc.)
  // For brevity, I'll include a few more key tools

  // Update employee tool
  server.tool(
    "update-employee",
    "Update existing employee information including contact details, job title, and department assignments. Allows modifying employee profiles with validation options. Use when asked to: 'Update John's phone number', 'Change Sarah's department', 'Promote employee to manager'",
    {
      employeeId: z.number().positive().describe("Employee ID to update (use get-employees to find the right ID)"),
      firstName: z.string().optional().describe("Updated first name"),
      lastName: z.string().optional().describe("Updated last name"),
      email: z.string().email().optional().describe("Updated email address"),
      cellPhone: z.string().optional().describe("Updated cell phone number"),
      jobTitle: z.string().optional().describe("Updated job title or position"),
      departments: z.array(z.number().positive()).optional().describe("Updated department IDs (replaces current assignments)"),
      useValidation: z.boolean().optional().describe("Validate required fields during update (default: true, set false to skip validation)")
    },
    async ({ employeeId, useValidation = true, ...updateData }) => {
      try {
        const accessToken = await authService.getValidAccessToken();
        if (!accessToken) {
          return {
            content: [{
              type: "text",
              text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
            }]
          };
        }

        await updateEmployee(employeeId, updateData, useValidation);
        const formatted = formatEmployeeOperationResult('update', { id: employeeId, ...updateData });
        
        return {
          content: [{
            type: "text",
            text: formatted
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: formatError(`updating employee ${employeeId}`, error)
          }]
        };
      }
    }
  );

  // Get departments tool
  server.tool(
    "get-departments",
    "Get complete organizational structure showing all departments, divisions, and work areas. Shows department names, numbers, and organizational hierarchy. Perfect for questions like: 'What departments exist?', 'Show company structure', 'List all work areas'",
    {
      limit: z.number().min(1).max(50).optional().describe("Maximum number of department records to return (1-50)"),
      offset: z.number().min(0).optional().describe("Number of records to skip for pagination")
    },
    async ({ limit, offset }) => {
      try {
        const accessToken = await authService.getValidAccessToken();
        if (!accessToken) {
          return {
            content: [{
              type: "text",
              text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
            }]
          };
        }

        const response = await getDepartments({ limit, offset });
        const formatted = formatDepartments(response.data, response.paging);
        
        return {
          content: [{
            type: "text",
            text: formatted
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: formatError("fetching departments", error)
          }]
        };
      }
    }
  );

  // Add remaining tools for employee groups, skills, etc.
  // ... (continuing with the pattern)
}
