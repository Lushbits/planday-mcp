// src/tools/scheduling-tools.ts
// Comprehensive Planday Scheduling Tools - 18 MCP Tools Across 8 Domains
// Covers: Shifts, Positions, Shift Types, Sections, Schedule Days, Skills, History, Time & Cost

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authService, makeAuthenticatedRequest } from '../services/auth';
import { DataFormatters } from '../services/formatters';

// Import comprehensive scheduling API functions
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  approveShift,
  assignShiftToEmployee,
  getShiftById,
  getDeletedShifts,
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
  getPositionById,
  getShiftTypes,
  createShiftType,
  updateShiftType,
  getSections,
  getScheduleDays,
  updateScheduleDay,
  getSkills,
  getShiftHistory,
  getTimeAndCost,
  validateEmployeeForShift
} from '../services/api/scheduling-api.ts';

// Import comprehensive scheduling formatters
import {
  formatShifts,
  formatShiftTypes,
  formatPositions,
  formatSections,
  formatScheduleDays,
  formatSkills,
  formatShiftOperationResult,
  formatShiftHistory,
  formatTimeAndCost
} from '../services/formatters/scheduling-formatters.ts';

export function registerSchedulingTools(server: McpServer) {
  
  // =============================================================================
  // PHASE 1: CORE SHIFT MANAGEMENT TOOLS
  // =============================================================================
  
  // Get shifts for a date range (Enhanced)
  server.tool(
    "get-shifts",
    "Get scheduled shifts for specific date ranges showing employee assignments, times, positions, and shift types. Essential for schedule management, coverage planning, and workload analysis. Perfect for questions like: 'Show this week's schedule', 'Who's working tomorrow?', 'Get all shifts for January'",
    {
      startDate: z.string().describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().describe("End date in YYYY-MM-DD format"),
      departmentIds: z.array(z.number()).optional().describe("Filter by specific department IDs"),
      employeeIds: z.array(z.number()).optional().describe("Filter by specific employee IDs"),
      positionIds: z.array(z.number()).optional().describe("Filter by specific position IDs"),
      shiftTypeIds: z.array(z.number()).optional().describe("Filter by specific shift type IDs"),
      shiftStatus: z.string().optional().describe("Filter by shift status (e.g., 'Published', 'Draft')"),
      limit: z.number().min(1).max(100).optional().describe("Maximum number of shifts to return (1-100)"),
      offset: z.number().min(0).optional().describe("Number of shifts to skip for pagination")
    },
    async ({ startDate, endDate, departmentIds, employeeIds, positionIds, shiftTypeIds, shiftStatus, limit, offset }) => {
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

        const filters = {
          departmentIds,
          employeeIds,
          positionIds,
          shiftTypeIds,
          shiftStatus,
          limit,
          offset
        };

        const response = await getShifts(startDate, endDate, filters);
        const formatted = formatShifts(response.data, startDate, endDate);
        
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
            text: DataFormatters.formatError("fetching shifts", error)
          }]
        };
      }
    }
  );
  
  // Create a new shift
  server.tool(
    "create-shift",
    "Create new scheduled shifts with employee assignments, times, positions, and departments. Essential for building schedules and assigning work. Perfect for questions like: 'Schedule John for Tuesday 9-5', 'Create a morning shift in the kitchen', 'Add weekend coverage shift'",
    {
      departmentId: z.number().positive().describe("Department ID where the shift will be created"),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Shift date in YYYY-MM-DD format"),
      startTime: z.string().optional().describe("Start time in HH:MM format (e.g., '09:00')"),
      endTime: z.string().optional().describe("End time in HH:MM format (e.g., '17:00')"),
      employeeId: z.number().positive().optional().describe("Employee ID to assign to this shift"),
      employeeGroupId: z.number().positive().describe("Employee group ID for the shift"),
      positionId: z.number().positive().optional().describe("Position ID for the shift"),
      shiftTypeId: z.number().positive().optional().describe("Shift type ID for the shift"),
      comment: z.string().optional().describe("Additional notes or comments for the shift"),
      allowConflicts: z.boolean().optional().describe("Allow scheduling conflicts (default: false)"),
      useBreaks: z.boolean().optional().describe("Include breaks in the shift (default: true)")
    },
    async ({ departmentId, date, startTime, endTime, employeeId, employeeGroupId, positionId, shiftTypeId, comment, allowConflicts = false, useBreaks = true }) => {
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

        const shiftData = {
          departmentId,
          allowConflicts,
          useBreaks,
          date,
          startTime,
          endTime,
          employeeId,
          employeeGroupId,
          positionId,
          shiftTypeId,
          comment
        };

        const result = await createShift(shiftData);
        const formatted = formatShiftOperationResult('create', true, result);
        
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
            text: formatShiftOperationResult('create', false, undefined, error instanceof Error ? error.message : String(error))
          }]
        };
      }
    }
  );
  
  // Update an existing shift
  server.tool(
    "update-shift",
    "Update existing shifts by changing times, employee assignments, positions, or other details. Essential for schedule adjustments and corrections. Perfect for questions like: 'Change John's shift to start at 10 AM', 'Move the evening shift to Sarah', 'Update Tuesday's kitchen shift'",
    {
      shiftId: z.number().positive().describe("ID of the shift to update"),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("New shift date in YYYY-MM-DD format"),
      startTime: z.string().optional().describe("New start time in HH:MM format"),
      endTime: z.string().optional().describe("New end time in HH:MM format"),
      employeeId: z.number().positive().optional().describe("New employee ID to assign"),
      employeeGroupId: z.number().positive().optional().describe("New employee group ID"),
      positionId: z.number().positive().optional().describe("New position ID"),
      shiftTypeId: z.number().positive().optional().describe("New shift type ID"),
      comment: z.string().optional().describe("Updated notes or comments"),
      allowConflicts: z.boolean().optional().describe("Allow scheduling conflicts"),
      useBreaks: z.boolean().optional().describe("Include breaks in the shift")
    },
    async ({ shiftId, date, startTime, endTime, employeeId, employeeGroupId, positionId, shiftTypeId, comment, allowConflicts, useBreaks }) => {
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

        const updateData = {
          allowConflicts,
          useBreaks,
          date,
          startTime,
          endTime,
          employeeId,
          employeeGroupId,
          positionId,
          shiftTypeId,
          comment
        };

        await updateShift(shiftId, updateData);
        const formatted = formatShiftOperationResult('update', true, { id: shiftId, ...updateData });
        
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
            text: formatShiftOperationResult('update', false, undefined, error instanceof Error ? error.message : String(error))
          }]
        };
      }
    }
  );
  
  // Delete a shift
  server.tool(
    "delete-shift",
    "Delete scheduled shifts from the system. Use with caution as this permanently removes shifts. Perfect for questions like: 'Remove John's Friday shift', 'Delete the cancelled evening shift', 'Remove shift ID 123'",
    {
      shiftId: z.number().positive().describe("ID of the shift to delete")
    },
    async ({ shiftId }) => {
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

        await deleteShift(shiftId);
        const formatted = formatShiftOperationResult('delete', true, { id: shiftId });
        
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
            text: formatShiftOperationResult('delete', false, undefined, error instanceof Error ? error.message : String(error))
          }]
        };
      }
    }
  );
  
  // Approve shift for payroll
  server.tool(
    "approve-shift",
    "Approve shifts for payroll processing, marking them as finalized and ready for wage calculation. Essential for payroll workflow. Perfect for questions like: 'Approve John's shifts for payroll', 'Mark shift as payroll ready', 'Finalize shift ID 123'",
    {
      shiftId: z.number().positive().describe("ID of the shift to approve for payroll")
    },
    async ({ shiftId }) => {
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

        await approveShift(shiftId);
        const formatted = formatShiftOperationResult('approve', true, { id: shiftId });
        
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
            text: formatShiftOperationResult('approve', false, undefined, error instanceof Error ? error.message : String(error))
          }]
        };
      }
    }
  );
  
  // Assign shift to employee
  server.tool(
    "assign-shift-to-employee",
    "Assign or reassign shifts to specific employees, or unassign shifts by setting employee to null. Essential for schedule management and coverage adjustments. Perfect for questions like: 'Assign the morning shift to Sarah', 'Move John's shift to Mike', 'Unassign the evening shift'",
    {
      shiftId: z.union([z.number(), z.string()]).transform((val) => {
        return typeof val === 'string' ? parseInt(val, 10) : val;
      }).pipe(z.number().positive()).describe("ID of the shift to assign"),
      employeeId: z.union([z.number(), z.string(), z.null()]).transform((val) => {
        if (val === null) return null;
        return typeof val === 'string' ? parseInt(val, 10) : val;
      }).pipe(z.union([z.number().positive(), z.null()])).describe("Employee ID to assign (use null to unassign)")
    },
    async ({ shiftId, employeeId }) => {
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

        // If employeeId is null, we're unassigning the shift (no validation needed)
        if (employeeId !== null) {
          // Validate employee can be assigned to this shift
          const validation = await validateEmployeeForShift(employeeId, shiftId);
          
          if (!validation.isValid) {
            return {
              content: [{
                type: "text",
                text: `❌ **Assignment Validation Failed**\n\n${validation.reason}\n\n**What this means:**\n• Employee group validation: ${validation.employeeGroupValid ? '✅ Passed' : '❌ Failed'}\n• Department access validation: ${validation.departmentValid ? '✅ Passed' : '❌ Failed'}\n\n**To fix this:**\n• Ensure the employee is a member of the required employee group\n• Verify the employee is assigned to the correct department\n• Use the get-employees tool to check employee group and department assignments`
              }]
            };
          }
        }

        // Validation passed or no validation needed (unassigning), proceed with assignment
        await assignShiftToEmployee(shiftId, employeeId);
        const action = employeeId ? 'assign' : 'unassign';
        const formatted = formatShiftOperationResult(action, true, { id: shiftId, employeeId });
        
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
            text: formatShiftOperationResult('assign', false, undefined, error instanceof Error ? error.message : String(error))
          }]
        };
      }
    }
  );

  // =============================================================================
  // PHASE 2: POSITION MANAGEMENT TOOLS
  // =============================================================================

  // Get positions (Enhanced)
  server.tool(
    "get-positions",
    "Get all job positions and roles available for scheduling including names, departments, and skill requirements. Used for shift planning and understanding available work roles. Perfect for questions like: 'What positions can I schedule?', 'Show all job roles', 'What positions exist in the kitchen?'",
    {
      isActive: z.boolean().optional().describe("Filter by active status (true for active, false for inactive)"),
      limit: z.number().min(1).max(100).optional().describe("Maximum number of positions to return (1-100)"),
      offset: z.number().min(0).optional().describe("Number of positions to skip for pagination")
    },
    async ({ isActive, limit, offset }) => {
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

        const filters = { isActive, limit, offset };
        const response = await getPositions(filters);
        const formatted = formatPositions(response.data);
        
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
            text: DataFormatters.formatError("fetching positions", error)
          }]
        };
      }
    }
  );
  
  // Create a new position
  server.tool(
    "create-position",
    "Create new job positions and roles for scheduling with department assignments and skill requirements. Essential for expanding work roles and organization structure. Perfect for questions like: 'Create a new server position', 'Add bartender role to restaurant', 'Set up cashier position'",
    {
      departmentId: z.number().positive().describe("Department ID where the position belongs"),
      employeeGroupId: z.number().positive().describe("Employee group ID for the position"),
      name: z.string().min(1).describe("Position name (e.g., 'Server', 'Chef', 'Cashier')"),
      affectRevenue: z.boolean().describe("Whether this position affects revenue calculations"),
      sectionId: z.number().positive().optional().describe("Section ID within the department"),
      color: z.string().optional().describe("Color code for schedule visualization (e.g., '#FF5733')"),
      validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Position start date in YYYY-MM-DD format"),
      validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Position end date in YYYY-MM-DD format"),
      skillIds: z.array(z.number().positive()).optional().describe("Array of skill IDs required for this position"),
      revenueUnitId: z.number().positive().optional().describe("Revenue unit ID if position affects revenue")
    },
    async ({ departmentId, employeeGroupId, name, affectRevenue, sectionId, color, validFrom, validTo, skillIds, revenueUnitId }) => {
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

        const positionData = {
          departmentId,
          employeeGroupId,
          name,
          affectRevenue,
          sectionId,
          color,
          validFrom,
          validTo,
          skillIds,
          revenueUnitId
        };

        const result = await createPosition(positionData);
        
        return {
          content: [{
            type: "text",
            text: `✅ **Position Created Successfully**\n\n**Position Details:**\n• Name: ${name}\n• ID: ${result.id}\n• Department ID: ${departmentId}\n• Employee Group ID: ${employeeGroupId}\n• Affects Revenue: ${affectRevenue ? 'Yes' : 'No'}${color ? `\n• Color: ${color}` : ''}${skillIds?.length ? `\n• Required Skills: ${skillIds.length} skill(s)` : ''}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ **Position Creation Failed**\n\nError: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
  
  // Get position by ID
  server.tool(
    "get-position-by-id",
    "Get detailed information for a specific position including all requirements, skills, and configuration. Perfect for questions like: 'Show details of position 123', 'What are the requirements for the server position?', 'Get specific position info'",
    {
      positionId: z.number().positive().describe("ID of the position to retrieve")
    },
    async ({ positionId }) => {
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

        const position = await getPositionById(positionId);
        
        if (!position) {
          return {
            content: [{
              type: "text",
              text: `❌ Position with ID ${positionId} not found.`
            }]
          };
        }
        
        const formatted = formatPositions([position]);
        
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
            text: DataFormatters.formatError(`fetching position ${positionId}`, error)
          }]
        };
      }
    }
  );
  
  // Update position
  server.tool(
    "update-position",
    "Update existing positions by changing names, requirements, skills, or other settings. Essential for maintaining current job roles and requirements. Perfect for questions like: 'Update server position requirements', 'Change position color', 'Modify position skills'",
    {
      positionId: z.number().positive().describe("ID of the position to update"),
      name: z.string().min(1).describe("Updated position name"),
      affectRevenue: z.boolean().describe("Whether this position affects revenue calculations"),
      sectionId: z.number().positive().optional().describe("Updated section ID within the department"),
      color: z.string().optional().describe("Updated color code for schedule visualization"),
      validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Updated position start date in YYYY-MM-DD format"),
      validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Updated position end date in YYYY-MM-DD format"),
      skillIds: z.array(z.number().positive()).optional().describe("Updated array of skill IDs required for this position"),
      revenueUnitId: z.number().positive().optional().describe("Updated revenue unit ID if position affects revenue")
    },
    async ({ positionId, name, affectRevenue, sectionId, color, validFrom, validTo, skillIds, revenueUnitId }) => {
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

        const updateData = {
          name,
          affectRevenue,
          sectionId,
          color,
          validFrom,
          validTo,
          skillIds,
          revenueUnitId
        };

        const result = await updatePosition(positionId, updateData);
        
        return {
          content: [{
            type: "text",
            text: `✅ **Position Updated Successfully**\n\n**Updated Position:**\n• ID: ${positionId}\n• Name: ${name}\n• Affects Revenue: ${affectRevenue ? 'Yes' : 'No'}${color ? `\n• Color: ${color}` : ''}${skillIds?.length ? `\n• Required Skills: ${skillIds.length} skill(s)` : ''}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ **Position Update Failed**\n\nError: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
  
  // Delete position
  server.tool(
    "delete-position",
    "Delete positions from the system with options for handling existing shifts. Use with caution as this affects scheduling. Perfect for questions like: 'Remove outdated position', 'Delete the temp position', 'Remove position and reassign shifts'",
    {
      positionId: z.number().positive().describe("ID of the position to delete"),
      deleteOption: z.enum(["Undecided", "KeepPosition", "RemovePosition", "ReplacePosition", "DeleteShifts"]).optional().describe("How to handle existing shifts with this position"),
      replacementPositionId: z.number().positive().optional().describe("Replacement position ID if using ReplacePosition option")
    },
    async ({ positionId, deleteOption, replacementPositionId }) => {
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

        const options = { deleteOption, replacementPositionId };
        await deletePosition(positionId, options);
        
        return {
          content: [{
            type: "text",
            text: `✅ **Position Deleted Successfully**\n\n**Deleted Position ID:** ${positionId}${deleteOption ? `\n**Delete Option:** ${deleteOption}` : ''}${replacementPositionId ? `\n**Replacement Position ID:** ${replacementPositionId}` : ''}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ **Position Deletion Failed**\n\nError: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // =============================================================================
  // PHASE 3: SHIFT TYPE MANAGEMENT TOOLS
  // =============================================================================

  // Get shift types (Enhanced)
  server.tool(
    "get-shift-types",
    "Get all shift types and categories including names, pay rates, break policies, and scheduling rules. Essential for understanding available shift options and their characteristics. Perfect for questions like: 'What shift types are available?', 'Show all shift categories', 'What are the different work periods I can schedule?'",
    {
      isActive: z.boolean().optional().describe("Filter by active status (true for active, false for inactive)"),
      limit: z.number().min(1).max(100).optional().describe("Maximum number of shift types to return (1-100)"),
      offset: z.number().min(0).optional().describe("Number of shift types to skip for pagination")
    },
    async ({ isActive, limit, offset }) => {
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

        const filters = { isActive, limit, offset };
        const response = await getShiftTypes(filters);
        const formatted = formatShiftTypes(response.data);
        
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
            text: DataFormatters.formatError("fetching shift types", error)
          }]
        };
      }
    }
  );
  
  // Create shift type
  server.tool(
    "create-shift-type",
    "Create new shift types and categories for different work periods with custom pay rates and break policies. Essential for expanding scheduling options. Perfect for questions like: 'Create night shift type', 'Add overtime shift category', 'Set up holiday shift type'",
    {
      name: z.string().min(1).describe("Shift type name (e.g., 'Night Shift', 'Overtime', 'Holiday')"),
      color: z.string().describe("Color code for visual identification (e.g., '#FF5733')"),
      salaryCode: z.string().describe("Salary code for payroll integration"),
      allowsBreaks: z.boolean().optional().describe("Whether this shift type allows breaks (default: true)"),
      includeSupplementSalary: z.boolean().optional().describe("Whether to include supplemental salary calculations")
    },
    async ({ name, color, salaryCode, allowsBreaks = true, includeSupplementSalary = false }) => {
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

        const shiftTypeData = {
          name,
          color,
          salaryCode,
          allowsBreaks,
          includeSupplementSalary
        };

        const result = await createShiftType(shiftTypeData);
        
        return {
          content: [{
            type: "text",
            text: `✅ **Shift Type Created Successfully**\n\n**Shift Type Details:**\n• Name: ${name}\n• ID: ${result.id}\n• Color: ${color}\n• Salary Code: ${salaryCode}\n• Allows Breaks: ${allowsBreaks ? 'Yes' : 'No'}\n• Include Supplement Salary: ${includeSupplementSalary ? 'Yes' : 'No'}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ **Shift Type Creation Failed**\n\nError: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
  
  // Update shift type
  server.tool(
    "update-shift-type",
    "Update existing shift types by changing names, colors, pay rates, or break policies. Essential for maintaining current shift categories. Perfect for questions like: 'Update night shift color', 'Change overtime pay rate', 'Modify shift type settings'",
    {
      shiftTypeId: z.number().positive().describe("ID of the shift type to update"),
      name: z.string().min(1).describe("Updated shift type name"),
      color: z.string().describe("Updated color code for visual identification"),
      salaryCode: z.string().describe("Updated salary code for payroll integration"),
      allowsBreaks: z.boolean().optional().describe("Whether this shift type allows breaks"),
      includeSupplementSalary: z.boolean().optional().describe("Whether to include supplemental salary calculations")
    },
    async ({ shiftTypeId, name, color, salaryCode, allowsBreaks, includeSupplementSalary }) => {
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

        const updateData = {
          name,
          color,
          salaryCode,
          allowsBreaks,
          includeSupplementSalary
        };

        await updateShiftType(shiftTypeId, updateData);
        
        return {
          content: [{
            type: "text",
            text: `✅ **Shift Type Updated Successfully**\n\n**Updated Shift Type:**\n• ID: ${shiftTypeId}\n• Name: ${name}\n• Color: ${color}\n• Salary Code: ${salaryCode}${allowsBreaks !== undefined ? `\n• Allows Breaks: ${allowsBreaks ? 'Yes' : 'No'}` : ''}${includeSupplementSalary !== undefined ? `\n• Include Supplement Salary: ${includeSupplementSalary ? 'Yes' : 'No'}` : ''}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ **Shift Type Update Failed**\n\nError: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // =============================================================================
  // PHASE 4: SCHEDULE ORGANIZATION TOOLS
  // =============================================================================

  // Get sections
  server.tool(
    "get-sections",
    "Get department sections and organizational divisions for detailed scheduling structure. Shows how departments are subdivided for better organization. Perfect for questions like: 'What sections exist in the kitchen?', 'Show department divisions', 'List all work sections'",
    {
      departmentId: z.number().positive().optional().describe("Filter by specific department ID"),
      limit: z.number().min(1).max(100).optional().describe("Maximum number of sections to return (1-100)"),
      offset: z.number().min(0).optional().describe("Number of sections to skip for pagination")
    },
    async ({ departmentId, limit, offset }) => {
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

        const filters = { departmentId, limit, offset };
        const response = await getSections(filters);
        const formatted = formatSections(response.data);
        
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
            text: DataFormatters.formatError("fetching sections", error)
          }]
        };
      }
    }
  );
  
  // Get schedule days
  server.tool(
    "get-schedule-days",
    "Get schedule day information including holidays, special events, and day-specific notes for better schedule planning. Perfect for questions like: 'What holidays are coming up?', 'Show special schedule days', 'Get schedule day details for this week'",
    {
      departmentId: z.number().positive().describe("Department ID to get schedule days for"),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("End date in YYYY-MM-DD format"),
      limit: z.number().min(1).max(100).optional().describe("Maximum number of schedule days to return (1-100)"),
      offset: z.number().min(0).optional().describe("Number of schedule days to skip for pagination")
    },
    async ({ departmentId, startDate, endDate, limit, offset }) => {
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

        const filters = { limit, offset };
        const response = await getScheduleDays(departmentId, startDate, endDate, filters);
        const formatted = formatScheduleDays(response.data);
        
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
            text: DataFormatters.formatError("fetching schedule days", error)
          }]
        };
      }
    }
  );
  
  // Update schedule day
  server.tool(
    "update-schedule-day",
    "Update schedule day information by adding notes, changing visibility, or updating titles for better organization. Perfect for questions like: 'Add holiday note to schedule', 'Update schedule day title', 'Mark special event day'",
    {
      departmentId: z.number().positive().describe("Department ID for the schedule day"),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date to update in YYYY-MM-DD format"),
      title: z.string().optional().describe("Updated title for the schedule day"),
      description: z.string().optional().describe("Updated description or notes for the day"),
      isVisible: z.boolean().optional().describe("Whether the schedule day should be visible")
    },
    async ({ departmentId, date, title, description, isVisible }) => {
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

        const updateData = {
          departmentId,
          date,
          title,
          description,
          isVisible
        };

        await updateScheduleDay(updateData);
        
        return {
          content: [{
            type: "text",
            text: `✅ **Schedule Day Updated Successfully**\n\n**Updated Day:**\n• Date: ${date}\n• Department ID: ${departmentId}${title ? `\n• Title: ${title}` : ''}${description ? `\n• Description: ${description}` : ''}${isVisible !== undefined ? `\n• Visible: ${isVisible ? 'Yes' : 'No'}` : ''}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ **Schedule Day Update Failed**\n\nError: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
  
  // Get scheduling skills
  server.tool(
    "get-scheduling-skills",
    "Get skills and qualifications available for position requirements and employee assignments in scheduling context. Shows what competencies are tracked for scheduling by department. Perfect for questions like: 'What skills are required for scheduling?', 'Show department scheduling skills', 'List qualifications needed for positions'",
    {
      departmentId: z.number().positive().describe("Department ID to get skills for"),
      employeeGroupId: z.number().positive().optional().describe("Filter by specific employee group ID"),
      limit: z.number().min(1).max(100).optional().describe("Maximum number of skills to return (1-100)"),
      offset: z.number().min(0).optional().describe("Number of skills to skip for pagination")
    },
    async ({ departmentId, employeeGroupId, limit, offset }) => {
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

        const filters = { employeeGroupId, limit, offset };
        const response = await getSkills(departmentId, filters);
        const formatted = formatSkills(response.data);
        
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
            text: DataFormatters.formatError("fetching skills", error)
          }]
        };
      }
    }
  );

  // =============================================================================
  // PHASE 5: ADVANCED ANALYTICS TOOLS
  // =============================================================================

  // Get shift history
  server.tool(
    "get-shift-history",
    "Get complete change history for specific shifts showing who made changes, when, and what was modified. Essential for audit trails and understanding schedule changes. Perfect for questions like: 'Who changed this shift?', 'Show shift modification history', 'Track changes to shift 123'",
    {
      shiftId: z.number().positive().describe("ID of the shift to get history for"),
      limit: z.number().min(1).max(100).optional().describe("Maximum number of history records to return (1-100)"),
      offset: z.number().min(0).optional().describe("Number of history records to skip for pagination")
    },
    async ({ shiftId, limit, offset }) => {
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

        const filters = { limit, offset };
        const response = await getShiftHistory(shiftId, filters);
        const formatted = formatShiftHistory(response.data, shiftId);
        
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
            text: DataFormatters.formatError("fetching shift history", error)
          }]
        };
      }
    }
  );
  
  // Get time and cost analysis
  server.tool(
    "get-time-and-cost",
    "Get comprehensive time and cost analysis for departments showing labor hours, costs, and efficiency metrics. Essential for budget planning and cost control. Perfect for questions like: 'What are our labor costs?', 'Show time analysis for the kitchen', 'Calculate department expenses'",
    {
      departmentId: z.number().positive().describe("Department ID to analyze"),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Analysis start date in YYYY-MM-DD format"),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Analysis end date in YYYY-MM-DD format")
    },
    async ({ departmentId, startDate, endDate }) => {
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

        const response = await getTimeAndCost(departmentId, startDate, endDate);
        const formatted = formatTimeAndCost(response, startDate, endDate);
        
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
            text: DataFormatters.formatError("fetching time and cost data", error)
          }]
        };
      }
    }
  );
  
  // Get deleted shifts
  server.tool(
    "get-deleted-shifts",
    "Get information about deleted shifts for audit purposes and recovery needs. Shows what shifts were removed and when. Perfect for questions like: 'What shifts were deleted?', 'Show removed schedule entries', 'Track deleted shifts this week'",
    {
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Start date for deleted shifts search in YYYY-MM-DD format"),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("End date for deleted shifts search in YYYY-MM-DD format"),
      limit: z.number().min(1).max(100).optional().describe("Maximum number of deleted shifts to return (1-100)"),
      offset: z.number().min(0).optional().describe("Number of deleted shifts to skip for pagination")
    },
    async ({ startDate, endDate, limit, offset }) => {
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

        const filters = { limit, offset };
        const response = await getDeletedShifts(startDate, endDate, filters);
        const formatted = formatShifts(response.data, startDate, endDate);
        
        return {
          content: [{
            type: "text",
            text: `🗑️ **Deleted Shifts (${startDate} to ${endDate})**\n\n${formatted}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError("fetching deleted shifts", error)
          }]
        };
      }
    }
  );
}
