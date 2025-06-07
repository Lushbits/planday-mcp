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
    {
      limit: z.number().min(1).max(50).optional().describe("Maximum number of records (1-50)"),
      offset: z.number().min(0).optional().describe("Records to skip for pagination"),
      searchQuery: z.string().optional().describe("Search by name, email, or phone"),
      includeSecurityGroups: z.boolean().optional().describe("Include security group information"),
      special: z.array(z.enum(['BankAccount', 'BirthDate', 'Ssn'])).optional().describe("Include sensitive fields")
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
    {
      employeeId: z.number().positive().describe("Employee ID to retrieve"),
      special: z.array(z.enum(['BankAccount', 'BirthDate', 'Ssn'])).optional().describe("Include sensitive fields")
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
    {
      limit: z.number().min(1).max(50).optional().describe("Maximum number of records (1-50)"),
      offset: z.number().min(0).optional().describe("Records to skip for pagination"),
      searchQuery: z.string().optional().describe("Search by name, email, or phone"),
      deactivatedFrom: z.string().optional().describe("Show employees deactivated after this date (YYYY-MM-DD)")
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
    {
      firstName: z.string().min(1).describe("Employee's first name"),
      lastName: z.string().min(1).describe("Employee's last name"),
      userName: z.string().email().describe("Employee's username (must be email)"),
      departments: z.array(z.number().positive()).min(1).describe("Department IDs to assign"),
      email: z.string().email().optional().describe("Primary email address"),
      cellPhone: z.string().optional().describe("Cell phone number"),
      jobTitle: z.string().optional().describe("Job title"),
      primaryDepartmentId: z.number().positive().optional().describe("Primary department ID")
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
    {
      employeeId: z.number().positive().describe("Employee ID to update"),
      firstName: z.string().optional().describe("First name"),
      lastName: z.string().optional().describe("Last name"),
      email: z.string().email().optional().describe("Email address"),
      cellPhone: z.string().optional().describe("Cell phone number"),
      jobTitle: z.string().optional().describe("Job title"),
      departments: z.array(z.number().positive()).optional().describe("Department IDs"),
      useValidation: z.boolean().optional().describe("Validate required fields (default: true)")
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
    {
      employeeId: z.number().positive().describe("Employee ID to deactivate"),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Last active date (YYYY-MM-DD), leave empty for immediate"),
      reason: z.string().optional().describe("Reason for deactivation"),
      keepShifts: z.boolean().optional().describe("Keep assigned shifts (default: false)")
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
    {
      employeeId: z.number().positive().describe("Employee ID to reactivate"),
      comment: z.string().optional().describe("Comment explaining reactivation"),
      departments: z.array(z.number().positive()).optional().describe("Department IDs to assign upon reactivation")
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
    {
      limit: z.number().min(1).max(50).optional().describe("Maximum number of records (1-50)"),
      offset: z.number().min(0).optional().describe("Records to skip for pagination")
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
    {
      employeeId: z.number().positive().describe("Employee ID to get history for"),
      startDateTime: z.string().optional().describe("Show changes after this date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)"),
      endDateTime: z.string().optional().describe("Show changes before this date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)"),
      limit: z.number().min(1).max(50).optional().describe("Maximum number of records (1-50)")
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
    {
      type: z.enum(['Post', 'Put']).optional().describe("Schema type: 'Post' for creation, 'Put' for updates (default: Post)")
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
    {
      limit: z.number().min(1).max(50).optional().describe("Maximum number of records (1-50)"),
      offset: z.number().min(0).optional().describe("Records to skip for pagination")
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
    {
      departmentId: z.number().positive().describe("Department ID to retrieve")
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
    {
      name: z.string().min(1).describe("Department name"),
      number: z.string().optional().describe("Department number/code")
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
    {
      departmentId: z.number().positive().describe("Department ID to update"),
      name: z.string().min(1).describe("Department name"),
      number: z.string().optional().describe("Department number/code")
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
    {
      departmentId: z.number().positive().describe("Department ID to delete")
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
    {
      limit: z.number().min(1).max(50).optional().describe("Maximum number of records (1-50)"),
      offset: z.number().min(0).optional().describe("Records to skip for pagination")
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
    {
      groupId: z.number().positive().describe("Employee group ID to retrieve")
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
    {
      name: z.string().min(1).describe("Employee group name")
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
    {
      groupId: z.number().positive().describe("Employee group ID to update"),
      name: z.string().min(1).describe("Employee group name")
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
    {
      groupId: z.number().positive().describe("Employee group ID to delete")
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
    {
      name: z.string().min(1).describe("Skill name"),
      description: z.string().optional().describe("Skill description"),
      isTimeLimited: z.boolean().describe("Whether skill expires and requires renewal")
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
    {
      skillId: z.number().positive().describe("Skill ID to update"),
      name: z.string().min(1).describe("Skill name"),
      description: z.string().optional().describe("Skill description"),
      isTimeLimited: z.boolean().describe("Whether skill expires and requires renewal")
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
    {
      skillId: z.number().positive().describe("Skill ID to delete")
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
    {
      employeeId: z.number().positive().describe("Employee ID"),
      customPropertyName: z.string().describe("Custom property name (format: 'custom_123456')")
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
    {
      employeeId: z.number().positive().describe("Employee ID"),
      customPropertyName: z.string().describe("Custom property name (format: 'custom_123456')"),
      operation: z.enum(['create', 'update', 'delete']).describe("Operation to perform"),
      attachmentData: z.string().optional().describe("Base64-encoded data URI for create/update operations")
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