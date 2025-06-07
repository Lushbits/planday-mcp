// src/tools/hr-tools.ts

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ensureAuthenticated } from '../services/auth';
import {
  // Employee Management
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
  
  // Departments
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentById,
  
  // Employee Groups
  getEmployeeGroups,
  createEmployeeGroup,
  updateEmployeeGroup,
  deleteEmployeeGroup,
  getEmployeeGroupById,
  
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
  deleteCustomFieldAttachment,
} from '../services/api/hr-api';

import { 
  formatEmployees,
  formatDeactivatedEmployees,
  formatEmployeeDetail,
  formatDepartments,
  formatEmployeeGroups,
  formatSkills,
  formatEmployeeTypes,
  formatSupervisors,
  formatEmployeeHistory,
  formatFieldDefinitions,
  formatEmployeeOperationResult,
  formatDepartmentOperationResult,
  formatGroupOperationResult,
  formatSkillOperationResult,
  formatError
} from '../services/formatters/hr-formatters';

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

// Employee Management Schemas
const employeeQuerySchema = z.object({
  limit: z.number().min(1).max(50).optional().describe("Maximum number of records to return (1-50)"),
  offset: z.number().min(0).optional().describe("Number of records to skip for pagination"),
  createdFrom: z.string().optional().describe("Return employees created after this date (YYYY-MM-DDTHH:MM:SSZ)"),
  createdTo: z.string().optional().describe("Return employees created before this date (YYYY-MM-DDTHH:MM:SSZ)"),
  modifiedFrom: z.string().optional().describe("Return employees modified after this date (YYYY-MM-DDTHH:MM:SSZ)"),
  modifiedTo: z.string().optional().describe("Return employees modified before this date (YYYY-MM-DDTHH:MM:SSZ)"),
  special: z.array(z.enum(['BankAccount', 'BirthDate', 'Ssn'])).optional().describe("Include sensitive fields"),
  includeSecurityGroups: z.boolean().optional().describe("Include security groups for employees"),
  searchQuery: z.string().optional().describe("Search by name, email, phone, salary identifier, or SSN"),
});

const deactivatedEmployeeQuerySchema = employeeQuerySchema.extend({
  deactivatedFrom: z.string().optional().describe("Return employees deactivated after this date (YYYY-MM-DDTHH:MM:SSZ)"),
  deactivatedTo: z.string().optional().describe("Return employees deactivated before this date (YYYY-MM-DDTHH:MM:SSZ)"),
});

const createEmployeeSchema = z.object({
  firstName: z.string().min(1).describe("Employee's first name"),
  lastName: z.string().min(1).describe("Employee's last name"),
  userName: z.string().email().describe("Employee's username (must be an email)"),
  departments: z.array(z.number().positive()).min(1).describe("Array of department IDs to assign employee to"),
  cellPhone: z.string().optional().describe("Employee's cell phone number"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Birth date (YYYY-MM-DD)"),
  ssn: z.string().optional().describe("Social security number"),
  cellPhoneCountryCode: z.string().optional().describe("Country code for cell phone (ISO 3155 alpha-2)"),
  street1: z.string().optional().describe("Address line 1"),
  street2: z.string().optional().describe("Address line 2"),
  zip: z.string().optional().describe("Zip/postal code"),
  phone: z.string().optional().describe("Landline phone number"),
  phoneCountryCode: z.string().optional().describe("Country code for phone (ISO 3155 alpha-2)"),
  city: z.string().optional().describe("City"),
  email: z.string().email().optional().describe("Primary email address"),
  employeeGroups: z.array(z.number().positive()).optional().describe("Array of employee group IDs"),
  hiredFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Hire date (YYYY-MM-DD)"),
  gender: z.enum(['Male', 'Female']).optional().describe("Gender"),
  primaryDepartmentId: z.number().positive().optional().describe("Primary department ID"),
  jobTitle: z.string().optional().describe("Job title"),
  employeeTypeId: z.number().positive().optional().describe("Employee type ID"),
  salaryIdentifier: z.string().optional().describe("Salary code identifier"),
  isSupervisor: z.boolean().optional().describe("Whether employee is a supervisor"),
  supervisorId: z.number().positive().optional().describe("Supervisor's employee ID"),
  skillIds: z.array(z.number().positive()).optional().describe("Array of skill IDs"),
});

const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  useValidation: z.boolean().optional().describe("Whether to validate required fields (default: true)"),
});

const deactivateEmployeeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Last active date (YYYY-MM-DD), null for immediate"),
  reason: z.string().optional().describe("Reason for deactivation"),
  keepShifts: z.boolean().optional().describe("Whether to keep assigned shifts (default: false)"),
});

const reactivateEmployeeSchema = z.object({
  comment: z.string().optional().describe("Comment explaining reactivation"),
  departments: z.array(z.number().positive()).optional().describe("Department IDs to assign upon reactivation"),
});

const historyQuerySchema = z.object({
  startDateTime: z.string().optional().describe("Return changes after this date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)"),
  endDateTime: z.string().optional().describe("Return changes before this date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)"),
  offset: z.number().min(0).optional().describe("Number of records to skip for pagination"),
  limit: z.number().min(1).max(50).optional().describe("Maximum number of records to return (1-50)"),
});

// Department Management Schemas
const paginationSchema = z.object({
  limit: z.number().min(1).max(50).optional().describe("Maximum number of records to return (1-50)"),
  offset: z.number().min(0).optional().describe("Number of records to skip for pagination"),
});

const createDepartmentSchema = z.object({
  name: z.string().min(1).describe("Department name"),
  number: z.string().optional().describe("Department number/code for identification"),
});

const updateDepartmentSchema = createDepartmentSchema;

// Employee Groups Schemas
const createEmployeeGroupSchema = z.object({
  name: z.string().min(1).describe("Employee group name"),
});

const updateEmployeeGroupSchema = createEmployeeGroupSchema;

// Skills Management Schemas
const createSkillSchema = z.object({
  name: z.string().min(1).describe("Skill name"),
  description: z.string().optional().describe("Skill description"),
  isTimeLimited: z.boolean().describe("Whether skill expires and requires renewal"),
});

const updateSkillSchema = createSkillSchema;

// Custom Field Attachments Schemas
const customFieldAttachmentSchema = z.object({
  customPropertyName: z.string().min(1).describe("Custom property name (format: 'custom_123456')"),
  attachmentData: z.string().optional().describe("Base64-encoded data URI for attachment"),
});

// =============================================================================
// EMPLOYEE MANAGEMENT TOOLS
// =============================================================================

export function registerHRTools(server: McpServer) {
  
  // Get active employees with advanced filtering
  server.tool(
    "get-employees",
    employeeQuerySchema,
    async (args) => {
      try {
        await ensureAuthenticated();

        const response = await getEmployees(args);
        const formatted = formatEmployees(response.data, response.paging, args);
        
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

  // Get deactivated employees
  server.tool(
    "get-deactivated-employees",
    deactivatedEmployeeQuerySchema,
    async (args) => {
      try {
        await ensureAuthenticated();

        const response = await getDeactivatedEmployees(args);
        const formatted = formatDeactivatedEmployees(response.data, response.paging, args);
        
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

  // Get employee by ID
  server.tool(
    "get-employee-by-id",
    z.object({
      employeeId: z.number().positive().describe("Employee ID to retrieve"),
      special: z.array(z.enum(['BankAccount', 'BirthDate', 'Ssn'])).optional().describe("Include sensitive fields"),
    }),
    async ({ employeeId, special }) => {
      try {
        await ensureAuthenticated();

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

  // Create new employee
  server.tool(
    "create-employee",
    createEmployeeSchema,
    async (args) => {
      try {
        await ensureAuthenticated();

        const response = await createEmployee(args);
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

  // Update existing employee
  server.tool(
    "update-employee",
    z.object({
      employeeId: z.number().positive().describe("Employee ID to update"),
    }).merge(updateEmployeeSchema),
    async ({ employeeId, useValidation = true, ...updateData }) => {
      try {
        await ensureAuthenticated();

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
    z.object({
      employeeId: z.number().positive().describe("Employee ID to deactivate"),
    }).merge(deactivateEmployeeSchema),
    async ({ employeeId, ...deactivationData }) => {
      try {
        await ensureAuthenticated();

        await deactivateEmployee(employeeId, deactivationData);
        const formatted = formatEmployeeOperationResult('deactivate', { id: employeeId, ...deactivationData });
        
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
    z.object({
      employeeId: z.number().positive().describe("Employee ID to reactivate"),
    }).merge(reactivateEmployeeSchema),
    async ({ employeeId, ...reactivationData }) => {
      try {
        await ensureAuthenticated();

        await reactivateEmployee(employeeId, reactivationData);
        const formatted = formatEmployeeOperationResult('reactivate', { id: employeeId, ...reactivationData });
        
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
    paginationSchema,
    async (args) => {
      try {
        await ensureAuthenticated();

        const response = await getSupervisors(args);
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

  // Get employee field definitions
  server.tool(
    "get-employee-field-definitions",
    z.object({
      type: z.enum(['Post', 'Put']).optional().describe("Schema type: 'Post' for creation, 'Put' for updates"),
    }),
    async ({ type = 'Post' }) => {
      try {
        await ensureAuthenticated();

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

  // Get employee change history
  server.tool(
    "get-employee-history",
    z.object({
      employeeId: z.number().positive().describe("Employee ID to get history for"),
    }).merge(historyQuerySchema),
    async ({ employeeId, ...queryParams }) => {
      try {
        await ensureAuthenticated();

        const response = await getEmployeeHistory(employeeId, queryParams);
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

  // Get custom field attachment
  server.tool(
    "get-custom-field-attachment",
    z.object({
      employeeId: z.number().positive().describe("Employee ID"),
      customPropertyName: z.string().min(1).describe("Custom property name (format: 'custom_123456')"),
    }),
    async ({ employeeId, customPropertyName }) => {
      try {
        await ensureAuthenticated();

        const attachmentData = await getCustomFieldAttachment(employeeId, customPropertyName);
        
        return {
          content: [{
            type: "text",
            text: `📎 **Custom Field Attachment Retrieved**\n\n` +
                  `👤 **Employee ID:** ${employeeId}\n` +
                  `🏷️ **Field:** ${customPropertyName}\n` +
                  `📄 **Data:** ${attachmentData ? 'Attachment data retrieved' : 'No attachment found'}\n\n` +
                  `💡 **Note:** Attachment data is Base64-encoded and ready for use`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: formatError(`retrieving custom field attachment for employee ${employeeId}`, error)
          }]
        };
      }
    }
  );

  // Manage custom field attachment (create, update, or delete)
  server.tool(
    "manage-custom-field-attachment",
    z.object({
      employeeId: z.number().positive().describe("Employee ID"),
      customPropertyName: z.string().min(1).describe("Custom property name (format: 'custom_123456')"),
      operation: z.enum(['create', 'update', 'delete']).describe("Operation to perform"),
      attachmentData: z.string().optional().describe("Base64-encoded data URI (required for create/update)"),
    }),
    async ({ employeeId, customPropertyName, operation, attachmentData }) => {
      try {
        await ensureAuthenticated();

        let result;
        let operationName;
        
        switch (operation) {
          case 'create':
            if (!attachmentData) {
              throw new Error('Attachment data is required for create operation');
            }
            result = await createCustomFieldAttachment(employeeId, customPropertyName, attachmentData);
            operationName = 'Created';
            break;
            
          case 'update':
            if (!attachmentData) {
              throw new Error('Attachment data is required for update operation');
            }
            result = await updateCustomFieldAttachment(employeeId, customPropertyName, attachmentData);
            operationName = 'Updated';
            break;
            
          case 'delete':
            result = await deleteCustomFieldAttachment(employeeId, customPropertyName);
            operationName = 'Deleted';
            break;
        }
        
        return {
          content: [{
            type: "text",
            text: `✅ **Custom Field Attachment ${operationName}**\n\n` +
                  `👤 **Employee ID:** ${employeeId}\n` +
                  `🏷️ **Field:** ${customPropertyName}\n` +
                  `🔄 **Operation:** ${operation}\n` +
                  `📋 **Result:** ${result !== undefined ? 'Success' : 'Completed'}\n\n` +
                  `💡 **Note:** Custom field attachment has been ${operation}d successfully`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: formatError(`${operation}ing custom field attachment for employee ${employeeId}`, error)
          }]
        };
      }
    }
  );

  // =============================================================================
  // DEPARTMENT MANAGEMENT TOOLS
  // =============================================================================

  // Get all departments
  server.tool(
    "get-departments",
    paginationSchema,
    async (args) => {
      try {
        await ensureAuthenticated();

        const response = await getDepartments(args);
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
    z.object({
      departmentId: z.number().positive().describe("Department ID to retrieve"),
      includeDeleted: z.boolean().optional().describe("Include deleted employees"),
      managedEmployeesOnly: z.boolean().optional().describe("Include only managed employees"),
    }),
    async ({ departmentId, includeDeleted, managedEmployeesOnly }) => {
      try {
        await ensureAuthenticated();

        const response = await getDepartmentById(departmentId, { includeDeleted, managedEmployeesOnly });
        const formatted = formatDepartments([response.data]);
        
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

  // Create new department
  server.tool(
    "create-department",
    createDepartmentSchema,
    async (args) => {
      try {
        await ensureAuthenticated();

        const response = await createDepartment(args);
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

  // Update existing department
  server.tool(
    "update-department",
    z.object({
      departmentId: z.number().positive().describe("Department ID to update"),
    }).merge(updateDepartmentSchema),
    async ({ departmentId, ...updateData }) => {
      try {
        await ensureAuthenticated();

        await updateDepartment(departmentId, updateData);
        const formatted = formatDepartmentOperationResult('update', { id: departmentId, ...updateData });
        
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
    z.object({
      departmentId: z.number().positive().describe("Department ID to delete"),
    }),
    async ({ departmentId }) => {
      try {
        await ensureAuthenticated();

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
  // EMPLOYEE GROUPS MANAGEMENT TOOLS
  // =============================================================================

  // Get all employee groups
  server.tool(
    "get-employee-groups",
    paginationSchema,
    async (args) => {
      try {
        await ensureAuthenticated();

        const response = await getEmployeeGroups(args);
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
    z.object({
      groupId: z.number().positive().describe("Employee group ID to retrieve"),
    }),
    async ({ groupId }) => {
      try {
        await ensureAuthenticated();

        const response = await getEmployeeGroupById(groupId);
        const formatted = formatEmployeeGroups([response.data]);
        
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

  // Create new employee group
  server.tool(
    "create-employee-group",
    createEmployeeGroupSchema,
    async (args) => {
      try {
        await ensureAuthenticated();

        const response = await createEmployeeGroup(args);
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

  // Update existing employee group
  server.tool(
    "update-employee-group",
    z.object({
      groupId: z.number().positive().describe("Employee group ID to update"),
    }).merge(updateEmployeeGroupSchema),
    async ({ groupId, ...updateData }) => {
      try {
        await ensureAuthenticated();

        await updateEmployeeGroup(groupId, updateData);
        const formatted = formatGroupOperationResult('update', { id: groupId, ...updateData });
        
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
    z.object({
      groupId: z.number().positive().describe("Employee group ID to delete"),
    }),
    async ({ groupId }) => {
      try {
        await ensureAuthenticated();

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
  // SKILLS MANAGEMENT TOOLS
  // =============================================================================

  // Get all skills
  server.tool(
    "get-skills",
    z.object({}),
    async () => {
      try {
        await ensureAuthenticated();

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

  // Create new skill
  server.tool(
    "create-skill",
    createSkillSchema,
    async (args) => {
      try {
        await ensureAuthenticated();

        await createSkill(args);
        const formatted = formatSkillOperationResult('create', args);
        
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

  // Update existing skill
  server.tool(
    "update-skill",
    z.object({
      skillId: z.number().positive().describe("Skill ID to update"),
    }).merge(updateSkillSchema),
    async ({ skillId, ...updateData }) => {
      try {
        await ensureAuthenticated();

        await updateSkill(skillId, updateData);
        const formatted = formatSkillOperationResult('update', { skillId, ...updateData });
        
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
    z.object({
      skillId: z.number().positive().describe("Skill ID to delete"),
    }),
    async ({ skillId }) => {
      try {
        await ensureAuthenticated();

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
  // REFERENCE DATA TOOLS
  // =============================================================================

  // Get all employee types
  server.tool(
    "get-employee-types",
    z.object({}),
    async () => {
      try {
        await ensureAuthenticated();

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
}
