// src/tools/hr-tools.ts - Comprehensive HR tools with simplified syntax

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authService, makeAuthenticatedRequest } from '../services/auth';
import { DataFormatters } from '../services/formatters';

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
  // EMPLOYEE MANAGEMENT TOOLS (Phase 1)
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

  // Get deactivated employees
  server.tool(
    "get-deactivated-employees",
    "Get employees who are no longer active, including termination dates and reasons. Shows former staff members with deactivation history and search capabilities. Perfect for questions like: 'Who left recently?', 'Show former employees', 'Find people who quit last month'",
    {
      limit: z.number().min(1).max(50).optional().describe("Maximum number of records to return (1-50)"),
      offset: z.number().min(0).optional().describe("Number of records to skip for pagination"),
      searchQuery: z.string().optional().describe("Search former employees by name, email, or phone (e.g., 'John Doe')"),
      deactivatedFrom: z.string().optional().describe("Show employees deactivated after this date in YYYY-MM-DD format (e.g., '2024-01-01')")
    },
    async ({ limit, offset, searchQuery, deactivatedFrom }) => {
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

        const response = await getDeactivatedEmployees({
          limit,
          offset,
          searchQuery,
          deactivatedFrom
        });

        const formatted = formatDeactivatedEmployees(response.data, response.paging, {
          searchQuery,
          deactivatedFrom
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
            text: formatError("fetching deactivated employees", error)
          }]
        };
      }
    }
  );

  // Create new employee
  server.tool(
    "create-employee",
    "Create new employee profiles with required information and department assignments. Allows adding new staff members to the system with complete details. Use when asked to: 'Add new employee', 'Hire someone for kitchen', 'Create profile for new staff member'",
    {
      firstName: z.string().min(1).describe("Employee's first name (e.g., 'Sarah')"),
      lastName: z.string().min(1).describe("Employee's last name (e.g., 'Johnson')"),
      userName: z.string().email().describe("Employee's username which must be an email address (e.g., 'sarah.johnson@company.com')"),
      departments: z.array(z.number().positive()).min(1).describe("Array of department IDs to assign the employee to (use get-departments to find department IDs)"),
      email: z.string().email().optional().describe("Primary email address for communication (can be same as userName)"),
      cellPhone: z.string().optional().describe("Cell phone number for contact (e.g., '+1-555-123-4567')"),
      jobTitle: z.string().optional().describe("Job title or position (e.g., 'Kitchen Manager', 'Server', 'Cashier')"),
      primaryDepartmentId: z.number().positive().optional().describe("Primary department ID where employee mainly works")
    },
    async ({ firstName, lastName, userName, departments, email, cellPhone, jobTitle, primaryDepartmentId }) => {
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

        const response = await createEmployee({
          firstName,
          lastName,
          userName,
          departments,
          email,
          cellPhone,
          jobTitle,
          primaryDepartmentId
        });

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

  // Update employee
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

  // Deactivate employee
  server.tool(
    "deactivate-employee",
    "Deactivate employees for terminations, resignations, or temporary leave. Handles last working day, termination reason, and shift management. Use when asked to: 'Terminate John Doe', 'Employee resigned last Friday', 'Deactivate temporary worker'",
    {
      employeeId: z.number().positive().describe("Employee ID to deactivate (use get-employees to find the ID)"),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Last active date in YYYY-MM-DD format (e.g., '2024-06-15'). Leave empty for immediate deactivation"),
      reason: z.string().optional().describe("Reason for deactivation (e.g., 'Resignation', 'Termination', 'End of contract')"),
      keepShifts: z.boolean().optional().describe("Keep assigned future shifts (default: false removes future shifts)")
    },
    async ({ employeeId, date, reason, keepShifts }) => {
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

        await deactivateEmployee(employeeId, { date, reason, keepShifts });
        const formatted = formatEmployeeOperationResult('deactivate', { 
          id: employeeId, 
          date, 
          reason, 
          keepShifts 
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
            text: formatError(`deactivating employee ${employeeId}`, error)
          }]
        };
      }
    }
  );

  // Reactivate employee
  server.tool(
    "reactivate-employee",
    "Reactivate former employees for rehiring or return from leave. Allows bringing back deactivated staff with updated department assignments. Use when asked to: 'Rehire former employee', 'John is coming back from leave', 'Reactivate seasonal worker'",
    {
      employeeId: z.number().positive().describe("Employee ID to reactivate (use get-deactivated-employees to find former employees)"),
      comment: z.string().optional().describe("Comment explaining reactivation (e.g., 'Return from medical leave', 'Seasonal rehire')"),
      departments: z.array(z.number().positive()).optional().describe("Department IDs to assign upon reactivation (if different from previous assignment)")
    },
    async ({ employeeId, comment, departments }) => {
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

        await reactivateEmployee(employeeId, { comment, departments });
        const formatted = formatEmployeeOperationResult('reactivate', { 
          id: employeeId, 
          comment, 
          departments 
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
            text: formatError(`reactivating employee ${employeeId}`, error)
          }]
        };
      }
    }
  );

  // Get supervisors
  server.tool(
    "get-supervisors",
    "Get management hierarchy showing all supervisors and their roles. Shows who manages whom in the organization structure. Perfect for questions like: 'Who are the managers?', 'Show me the supervisors', 'List management team'",
    {
      limit: z.number().min(1).max(50).optional().describe("Maximum number of supervisor records to return (1-50)"),
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

        const response = await getSupervisors({ limit, offset });
        const formatted = formatSupervisors(response.data, response.paging);
        
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
            text: formatError("fetching supervisors", error)
          }]
        };
      }
    }
  );

  // Get employee history
  server.tool(
    "get-employee-history",
    "Get detailed audit trail of all changes made to an employee's profile over time. Shows who changed what and when for compliance and tracking. Perfect for questions like: 'What changed for employee 123?', 'Show John's profile history', 'Track recent employee updates'",
    {
      employeeId: z.number().positive().describe("Employee ID to get change history for (use get-employees to find the ID)"),
      startDateTime: z.string().optional().describe("Show changes after this date/time (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ format)"),
      endDateTime: z.string().optional().describe("Show changes before this date/time (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ format)"),
      limit: z.number().min(1).max(50).optional().describe("Maximum number of history records to return (1-50)")
    },
    async ({ employeeId, startDateTime, endDateTime, limit }) => {
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

        const response = await getEmployeeHistory(employeeId, {
          startDateTime,
          endDateTime,
          limit
        });

        const formatted = formatEmployeeHistory(response.data, response.paging, employeeId);
        
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
            text: formatError(`fetching employee history for ${employeeId}`, error)
          }]
        };
      }
    }
  );

  // Get employee field definitions
  server.tool(
    "get-employee-field-definitions",
    "Get schema information and field requirements for creating or updating employee profiles. Shows what fields are required, optional, and their data types. Perfect for questions like: 'What fields are required for new employees?', 'Show employee data schema', 'What can I update for employees?'",
    {
      type: z.enum(['Post', 'Put']).optional().describe("Schema type: 'Post' for creating new employees, 'Put' for updating existing employees (default: Post)")
    },
    async ({ type = 'Post' }) => {
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

        const response = await getEmployeeFieldDefinitions(type);
        const formatted = formatFieldDefinitions(response.data, type);
        
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
            text: formatError("fetching employee field definitions", error)
          }]
        };
      }
    }
  );

  // =============================================================================
  // DEPARTMENT MANAGEMENT TOOLS (Phase 2)
  // =============================================================================

  // Get departments
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

  // Get department by ID
  server.tool(
    "get-department-by-id",
    "Get detailed information for one specific department including name, number, and organizational details. Shows complete department record. Perfect for questions like: 'Tell me about department 5', 'Show kitchen department details', 'What's in the management department?'",
    {
      departmentId: z.number().positive().describe("Specific department ID to retrieve (use get-departments first to find the right ID)")
    },
    async ({ departmentId }) => {
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

        const response = await getDepartmentById(departmentId);
        const formatted = `🏢 **Department Details**\n\n` +
          `📋 **ID**: ${response.data.id}\n` +
          `🏷️ **Name**: ${response.data.name}\n` +
          `🔢 **Number**: ${response.data.number || 'Not set'}`;
        
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
            text: formatError(`fetching department ${departmentId}`, error)
          }]
        };
      }
    }
  );

  // Create department
  server.tool(
    "create-department",
    "Create new departments or work areas in the organizational structure. Allows adding new divisions, teams, or operational areas. Use when asked to: 'Create new department', 'Add kitchen department', 'Set up new work area'",
    {
      name: z.string().min(1).describe("Department name (e.g., 'Kitchen', 'Front of House', 'Management')"),
      number: z.string().optional().describe("Department number or code for identification (e.g., 'DEPT001', 'KIT')")
    },
    async ({ name, number }) => {
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

        const response = await createDepartment({ name, number });
        const formatted = formatDepartmentOperationResult('create', response.data);
        
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
            text: formatError("creating department", error)
          }]
        };
      }
    }
  );

  // Update department
  server.tool(
    "update-department",
    "Update existing department information including name and department number. Allows modifying organizational structure and department details. Use when asked to: 'Rename kitchen department', 'Update department number', 'Change department details'",
    {
      departmentId: z.number().positive().describe("Department ID to update (use get-departments to find the right ID)"),
      name: z.string().min(1).describe("Updated department name"),
      number: z.string().optional().describe("Updated department number or code")
    },
    async ({ departmentId, name, number }) => {
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

        await updateDepartment(departmentId, { name, number });
        const formatted = formatDepartmentOperationResult('update', { id: departmentId, name, number });
        
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
            text: formatError(`updating department ${departmentId}`, error)
          }]
        };
      }
    }
  );

  // Delete department
  server.tool(
    "delete-department",
    "Remove departments from the organizational structure when no longer needed. Permanently deletes department and removes it from the system. Use when asked to: 'Delete old department', 'Remove unused department', 'Close down kitchen department'",
    {
      departmentId: z.number().positive().describe("Department ID to delete (use get-departments to find the right ID - ensure no employees are assigned first)")
    },
    async ({ departmentId }) => {
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

        await deleteDepartment(departmentId);
        const formatted = formatDepartmentOperationResult('delete', { id: departmentId });
        
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
            text: formatError(`deleting department ${departmentId}`, error)
          }]
        };
      }
    }
  );

  // =============================================================================
  // EMPLOYEE GROUPS MANAGEMENT TOOLS (Phase 3a)
  // =============================================================================

  // Get employee groups
  server.tool(
    "get-employee-groups",
    "Get all employee groups and team classifications used for organizing staff. Shows group names and organizational categories. Perfect for questions like: 'What employee groups exist?', 'Show team classifications', 'List staff categories'",
    {
      limit: z.number().min(1).max(50).optional().describe("Maximum number of group records to return (1-50)"),
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

        const response = await getEmployeeGroups({ limit, offset });
        const formatted = formatEmployeeGroups(response.data, response.paging);
        
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
            text: formatError("fetching employee groups", error)
          }]
        };
      }
    }
  );

  // Get employee group by ID
  server.tool(
    "get-employee-group-by-id",
    "Get detailed information for one specific employee group including name and classification details. Shows complete group record. Perfect for questions like: 'Tell me about group 3', 'Show managers group details', 'What's in the part-time group?'",
    {
      groupId: z.number().positive().describe("Employee group ID to retrieve (use get-employee-groups first to find the right ID)")
    },
    async ({ groupId }) => {
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

        const response = await getEmployeeGroupById(groupId);
        const formatted = `👥 **Employee Group Details**\n\n` +
          `📋 **ID**: ${response.data.id}\n` +
          `🏷️ **Name**: ${response.data.name}`;
        
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
            text: formatError(`fetching employee group ${groupId}`, error)
          }]
        };
      }
    }
  );

  // Create employee group
  server.tool(
    "create-employee-group",
    "Create new employee groups for organizing staff into teams or classifications. Allows adding new categories for staff organization. Use when asked to: 'Create managers group', 'Add part-time staff group', 'Set up new team category'",
    {
      name: z.string().min(1).describe("Employee group name (e.g., 'Managers', 'Part-time Staff', 'Seasonal Workers')")
    },
    async ({ name }) => {
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

        const response = await createEmployeeGroup({ name });
        const formatted = formatGroupOperationResult('create', response.data);
        
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
            text: formatError("creating employee group", error)
          }]
        };
      }
    }
  );

  // Update employee group
  server.tool(
    "update-employee-group",
    "Update existing employee group names and classifications. Allows modifying group information for better organization. Use when asked to: 'Rename managers group', 'Update team name', 'Change group classification'",
    {
      groupId: z.number().positive().describe("Employee group ID to update (use get-employee-groups to find the right ID)"),
      name: z.string().min(1).describe("Updated employee group name")
    },
    async ({ groupId, name }) => {
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

        await updateEmployeeGroup(groupId, { name });
        const formatted = formatGroupOperationResult('update', { id: groupId, name });
        
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
            text: formatError(`updating employee group ${groupId}`, error)
          }]
        };
      }
    }
  );

  // Delete employee group
  server.tool(
    "delete-employee-group",
    "Remove employee groups when no longer needed for organization. Permanently deletes group classification from the system. Use when asked to: 'Delete old group', 'Remove unused team category', 'Close seasonal workers group'",
    {
      groupId: z.number().positive().describe("Employee group ID to delete (use get-employee-groups to find the right ID - ensure no employees are assigned first)")
    },
    async ({ groupId }) => {
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

        await deleteEmployeeGroup(groupId);
        const formatted = formatGroupOperationResult('delete', { id: groupId });
        
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
            text: formatError(`deleting employee group ${groupId}`, error)
          }]
        };
      }
    }
  );

  // =============================================================================
  // SKILLS MANAGEMENT TOOLS (Phase 3b)
  // =============================================================================

  // Get skills
  server.tool(
    "get-skills",
    "Get all employee skills and competencies tracked in the system. Shows skill names, descriptions, and whether they require renewal. Perfect for questions like: 'What skills are tracked?', 'Show available competencies', 'List employee qualifications'",
    {},
    async () => {
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

        const skills = await getSkills();
        const formatted = formatSkills(skills);
        
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
            text: formatError("fetching skills", error)
          }]
        };
      }
    }
  );

  // Create skill
  server.tool(
    "create-skill",
    "Create new skills and competencies for tracking employee qualifications. Allows adding certifications, training, or abilities. Use when asked to: 'Add food safety certification', 'Create bartending skill', 'Set up new training requirement'",
    {
      name: z.string().min(1).describe("Skill name (e.g., 'Food Safety Certification', 'Bartending', 'Cash Handling')"),
      description: z.string().optional().describe("Detailed description of the skill or qualification"),
      isTimeLimited: z.boolean().describe("Whether this skill expires and requires renewal (true for certifications, false for permanent skills)")
    },
    async ({ name, description, isTimeLimited }) => {
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

        await createSkill({ name, description, isTimeLimited });
        const formatted = formatSkillOperationResult('create', { name, description, isTimeLimited });
        
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
            text: formatError("creating skill", error)
          }]
        };
      }
    }
  );

  // Update skill
  server.tool(
    "update-skill",
    "Update existing skill information including name, description, and renewal requirements. Allows modifying skill definitions and certification rules. Use when asked to: 'Update bartending skill description', 'Change certification to renewable', 'Modify training requirement'",
    {
      skillId: z.number().positive().describe("Skill ID to update (use get-skills to find the right ID)"),
      name: z.string().min(1).describe("Updated skill name"),
      description: z.string().optional().describe("Updated skill description"),
      isTimeLimited: z.boolean().describe("Whether this skill expires and requires renewal")
    },
    async ({ skillId, name, description, isTimeLimited }) => {
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

        await updateSkill(skillId, { name, description, isTimeLimited });
        const formatted = formatSkillOperationResult('update', { skillId, name, description, isTimeLimited });
        
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
            text: formatError(`updating skill ${skillId}`, error)
          }]
        };
      }
    }
  );

  // Delete skill
  server.tool(
    "delete-skill",
    "Remove skills from the system when no longer needed for tracking. Permanently deletes skill and removes it from employee records. Use when asked to: 'Delete old certification', 'Remove unused skill', 'Close outdated training requirement'",
    {
      skillId: z.number().positive().describe("Skill ID to delete (use get-skills to find the right ID - will remove from all employee records)")
    },
    async ({ skillId }) => {
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

        await deleteSkill(skillId);
        const formatted = formatSkillOperationResult('delete', { skillId });
        
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
            text: formatError(`deleting skill ${skillId}`, error)
          }]
        };
      }
    }
  );

  // =============================================================================
  // ADVANCED FEATURES (Phase 4)
  // =============================================================================

  // Get employee types
  server.tool(
    "get-employee-types",
    "Get all available employee type classifications used in the system. Shows different employment categories and their definitions. Perfect for questions like: 'What employee types exist?', 'Show employment categories', 'List worker classifications'",
    {},
    async () => {
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

        const response = await getEmployeeTypes();
        const formatted = formatEmployeeTypes(response.data, response.paging);
        
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
            text: formatError("fetching employee types", error)
          }]
        };
      }
    }
  );

  // Get custom field attachment
  server.tool(
    "get-custom-field-attachment",
    "Get file attachments stored in custom employee fields such as documents, photos, or certificates. Shows attached files for specific employee custom properties. Perfect for questions like: 'Show John's ID document', 'Get employee photo', 'Find attached certification'",
    {
      employeeId: z.number().positive().describe("Employee ID who has the attachment (use get-employees to find the ID)"),
      customPropertyName: z.string().describe("Custom property name in format 'custom_123456' (use get-employee-field-definitions to see available custom fields)")
    },
    async ({ employeeId, customPropertyName }) => {
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

        const attachment = await getCustomFieldAttachment(employeeId, customPropertyName);
        
        return {
          content: [{
            type: "text",
            text: `📎 **Custom Field Attachment**\n\n` +
                  `👤 **Employee ID**: ${employeeId}\n` +
                  `🏷️ **Field**: ${customPropertyName}\n` +
                  `📄 **Data**: ${attachment ? 'Attachment found' : 'No attachment'}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: formatError(`fetching custom field attachment for employee ${employeeId}`, error)
          }]
        };
      }
    }
  );

  // Create/Update custom field attachment
  server.tool(
    "manage-custom-field-attachment",
    "Create, update, or delete file attachments in employee custom fields. Allows managing documents, photos, certificates, or other files attached to employee records. Use when asked to: 'Upload employee photo', 'Attach ID document', 'Update certification file'",
    {
      employeeId: z.number().positive().describe("Employee ID to manage attachment for (use get-employees to find the ID)"),
      customPropertyName: z.string().describe("Custom property name in format 'custom_123456'"),
      operation: z.enum(['create', 'update', 'delete']).describe("Operation: 'create' for new attachment, 'update' to replace existing, 'delete' to remove"),
      attachmentData: z.string().optional().describe("Base64-encoded data URI for create/update operations (e.g., 'data:image/jpeg;base64,/9j/4AAQ...')")
    },
    async ({ employeeId, customPropertyName, operation, attachmentData }) => {
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

        let result: string;
        
        switch (operation) {
          case 'create':
            if (!attachmentData) {
              throw new Error("attachmentData is required for create operation");
            }
            result = await createCustomFieldAttachment(employeeId, customPropertyName, attachmentData);
            break;
          case 'update':
            if (!attachmentData) {
              throw new Error("attachmentData is required for update operation");
            }
            result = await updateCustomFieldAttachment(employeeId, customPropertyName, attachmentData);
            break;
          case 'delete':
            const deleted = await deleteCustomFieldAttachment(employeeId, customPropertyName);
            result = deleted ? 'Attachment deleted successfully' : 'Attachment not found or could not be deleted';
            break;
        }

        return {
          content: [{
            type: "text",
            text: `📎 **Custom Field Attachment ${operation.charAt(0).toUpperCase() + operation.slice(1)}**\n\n` +
                  `👤 **Employee ID**: ${employeeId}\n` +
                  `🏷️ **Field**: ${customPropertyName}\n` +
                  `✅ **Result**: ${result}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: formatError(`${operation} custom field attachment for employee ${employeeId}`, error)
          }]
        };
      }
    }
  );
} 