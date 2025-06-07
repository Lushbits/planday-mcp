// src/tools/scheduling-tools.ts
// Comprehensive Planday Scheduling Tools - 18 MCP Tools Across 8 Domains
// Covers: Shifts, Positions, Shift Types, Sections, Schedule Days, Skills, History, Time & Cost

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ensureAuthenticated } from '../services/auth';
import { 
  // Shifts
  getShifts, createShift, updateShift, deleteShift, getShiftById, 
  approveShift, assignShiftToEmployee, getDeletedShifts,
  // Positions
  getPositions, createPosition, updatePosition, deletePosition, getPositionById,
  // Shift Types
  getShiftTypes, createShiftType, updateShiftType,
  // Other domains
  getSections, getScheduleDays, updateScheduleDay, getSkills, 
  getShiftHistory, getTimeAndCost,
  // Utility functions
  getPositionsByIds, getShiftTypesByIds
} from '../services/api/scheduling-api';
import { getEmployeesByIds, getDepartmentsByIds } from '../services/api/hr-api';
import { 
  formatShifts, formatShiftTypes, formatPositions, formatSections, 
  formatScheduleDays, formatSkills, formatShiftHistory, formatTimeAndCost,
  formatShiftOperationResult
} from '../services/formatters/scheduling-formatters';
import { formatError, formatSuccess } from '../services/formatters/shared-formatters';

export function registerSchedulingTools(server: McpServer) {

  // ================================
  // SHIFTS MANAGEMENT (8 tools)
  // ================================

  // Get shifts with comprehensive filtering
  server.tool(
    "get-shifts",
    {
      startDate: z.string().describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().describe("End date in YYYY-MM-DD format"),
      departmentIds: z.array(z.number()).optional().describe("Filter by department IDs"),
      employeeIds: z.array(z.number()).optional().describe("Filter by employee IDs"),
      shiftStatus: z.string().optional().describe("Filter by status: Open, Assigned, Approved, etc."),
      positionIds: z.array(z.number()).optional().describe("Filter by position IDs"),
      shiftTypeIds: z.array(z.number()).optional().describe("Filter by shift type IDs"),
      limit: z.number().optional().describe("Maximum number of results (default 50)")
    },
    async ({ startDate, endDate, departmentIds, employeeIds, shiftStatus, positionIds, shiftTypeIds, limit }) => {
      try {
        await ensureAuthenticated();

        const filters = {
          departmentIds, employeeIds, shiftStatus, positionIds, shiftTypeIds,
          limit: limit || 50
        };

        const response = await getShifts(startDate, endDate, filters);
        
        if (!response.data || response.data.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No shifts found for the period ${startDate} to ${endDate}`
            }]
          };
        }

        // Enhanced name resolution
        const employeeIdSet = [...new Set(response.data.filter(s => s.employeeId).map(s => s.employeeId!))];
        const departmentIdSet = [...new Set(response.data.map(s => s.departmentId).filter(Boolean) as number[])];
        const positionIdSet = [...new Set(response.data.map(s => s.positionId).filter(Boolean) as number[])];
        const shiftTypeIdSet = [...new Set(response.data.map(s => s.shiftTypeId).filter(Boolean) as number[])];

        const [employeesMap, departmentsMap, positionsMap, shiftTypesMap] = await Promise.all([
          getEmployeesByIds(employeeIdSet),
          getDepartmentsByIds(departmentIdSet),
          getPositionsByIds(positionIdSet),
          getShiftTypesByIds(shiftTypeIdSet)
        ]);

        // Convert to name maps
        const employeeNames = new Map<number, string>();
        employeesMap.forEach((emp, id) => {
          employeeNames.set(id, `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || `Employee ${id}`);
        });

        const departmentNames = new Map<number, string>();
        departmentsMap.forEach((dept, id) => {
          departmentNames.set(id, dept.name || `Department ${id}`);
        });

        const positionNames = new Map<number, string>();
        positionsMap.forEach((pos, id) => {
          positionNames.set(id, pos.name || `Position ${id}`);
        });

        const shiftTypeNames = new Map<number, string>();
        shiftTypesMap.forEach((st, id) => {
          shiftTypeNames.set(id, st.name || `Shift Type ${id}`);
        });

        const formatted = formatShifts(
          response.data, startDate, endDate, 
          employeeNames, departmentNames, positionNames, shiftTypeNames
        );

        return { content: [{ type: "text", text: formatted }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("fetching shifts", error) }] };
      }
    }
  );

  // Create shift
  server.tool(
    "create-shift",
    {
      departmentId: z.number().describe("Department ID for the shift"),
      date: z.string().describe("Date of the shift (YYYY-MM-DD format)"),
      startTime: z.string().optional().describe("Start time (HH:MM format)"),
      endTime: z.string().optional().describe("End time (HH:MM format)"),
      employeeId: z.number().optional().describe("Employee to assign (optional)"),
      employeeGroupId: z.number().describe("Employee group ID"),
      positionId: z.number().optional().describe("Position ID"),
      shiftTypeId: z.number().optional().describe("Shift type ID"),
      allowConflicts: z.boolean().optional().describe("Allow scheduling conflicts (default: false)"),
      useBreaks: z.boolean().optional().describe("Apply default break settings (default: true)"),
      comment: z.string().optional().describe("Manager comment"),
      skillIds: z.array(z.number()).optional().describe("Required skill IDs")
    },
    async (params) => {
      try {
        await ensureAuthenticated();

        const shiftData = {
          departmentId: params.departmentId,
          allowConflicts: params.allowConflicts ?? false,
          useBreaks: params.useBreaks ?? true,
          date: params.date,
          startTime: params.startTime,
          endTime: params.endTime,
          employeeId: params.employeeId,
          employeeGroupId: params.employeeGroupId,
          positionId: params.positionId,
          shiftTypeId: params.shiftTypeId,
          comment: params.comment,
          skillIds: params.skillIds
        };

        const result = await createShift(shiftData);
        
        return {
          content: [{
            type: "text",
            text: formatShiftOperationResult("created", result.id, result)
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("creating shift", error) }] };
      }
    }
  );

  // Update shift
  server.tool(
    "update-shift",
    {
      shiftId: z.number().describe("ID of the shift to update"),
      date: z.string().optional().describe("New date (YYYY-MM-DD format)"),
      startTime: z.string().optional().describe("New start time (HH:MM format)"),
      endTime: z.string().optional().describe("New end time (HH:MM format)"),
      employeeId: z.number().optional().describe("New employee assignment"),
      positionId: z.number().optional().describe("New position ID"),
      shiftTypeId: z.number().optional().describe("New shift type ID"),
      comment: z.string().optional().describe("Updated comment"),
      allowConflicts: z.boolean().optional().describe("Allow scheduling conflicts")
    },
    async (params) => {
      try {
        await ensureAuthenticated();

        const { shiftId, ...updateData } = params;
        await updateShift(shiftId, updateData);
        
        return {
          content: [{
            type: "text",
            text: formatSuccess(`Shift ${shiftId} updated successfully`)
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("updating shift", error) }] };
      }
    }
  );

  // Delete shift
  server.tool(
    "delete-shift",
    {
      shiftId: z.number().describe("ID of the shift to delete")
    },
    async ({ shiftId }) => {
      try {
        await ensureAuthenticated();
        await deleteShift(shiftId);
        
        return {
          content: [{
            type: "text",
            text: formatSuccess(`Shift ${shiftId} deleted successfully`)
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("deleting shift", error) }] };
      }
    }
  );

  // Get shift by ID
  server.tool(
    "get-shift-by-id",
    {
      shiftId: z.number().describe("ID of the shift to retrieve")
    },
    async ({ shiftId }) => {
      try {
        await ensureAuthenticated();
        const shift = await getShiftById(shiftId);
        
        // Get names for display
        const employeeName = shift.employeeId ? 
          (await getEmployeesByIds([shift.employeeId])).get(shift.employeeId)?.firstName + ' ' +
          (await getEmployeesByIds([shift.employeeId])).get(shift.employeeId)?.lastName : 'Unassigned';
        
        return {
          content: [{
            type: "text",
            text: formatShifts([shift], shift.date, shift.date, 
              new Map([[shift.employeeId!, employeeName]]), new Map(), new Map())
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("fetching shift", error) }] };
      }
    }
  );

  // Approve shift
  server.tool(
    "approve-shift",
    {
      shiftId: z.number().describe("ID of the shift to approve for payroll")
    },
    async ({ shiftId }) => {
      try {
        await ensureAuthenticated();
        await approveShift(shiftId);
        
        return {
          content: [{
            type: "text",
            text: formatSuccess(`Shift ${shiftId} approved for payroll`)
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("approving shift", error) }] };
      }
    }
  );

  // Assign shift
  server.tool(
    "assign-shift",
    {
      shiftId: z.number().describe("ID of the shift to assign"),
      employeeId: z.number().nullable().describe("Employee ID to assign (null to make shift open)")
    },
    async ({ shiftId, employeeId }) => {
      try {
        await ensureAuthenticated();
        await assignShiftToEmployee(shiftId, employeeId);
        
        const message = employeeId ? 
          `Shift ${shiftId} assigned to employee ${employeeId}` :
          `Shift ${shiftId} set to open (unassigned)`;
        
        return {
          content: [{
            type: "text",
            text: formatSuccess(message)
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("assigning shift", error) }] };
      }
    }
  );

  // Get shift types
  server.tool(
    "get-shift-types",
    {
      isActive: z.boolean().optional().describe("Filter by active status"),
      limit: z.number().optional().describe("Maximum number of results")
    },
    async ({ isActive, limit }) => {
      try {
        await ensureAuthenticated();
        const response = await getShiftTypes({ isActive, limit });
        const formatted = formatShiftTypes(response.data);
        
        return { content: [{ type: "text", text: formatted }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("fetching shift types", error) }] };
      }
    }
  );

  // ================================
  // POSITIONS MANAGEMENT (5 tools)
  // ================================

  // Get positions
  server.tool(
    "get-positions",
    {
      isActive: z.boolean().optional().describe("Filter by active status"),
      limit: z.number().optional().describe("Maximum number of results")
    },
    async ({ isActive, limit }) => {
      try {
        await ensureAuthenticated();
        const response = await getPositions({ isActive, limit });
        const formatted = formatPositions(response.data);
        
        return { content: [{ type: "text", text: formatted }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("fetching positions", error) }] };
      }
    }
  );

  // Create position
  server.tool(
    "create-position",
    {
      departmentId: z.number().describe("Department ID"),
      employeeGroupId: z.number().describe("Employee group ID"),
      name: z.string().describe("Position name"),
      affectRevenue: z.boolean().describe("Whether position affects revenue"),
      sectionId: z.number().optional().describe("Section ID"),
      color: z.string().optional().describe("Position color (e.g., '#21E56E')"),
      skillIds: z.array(z.number()).optional().describe("Required skill IDs"),
      revenueUnitId: z.number().optional().describe("Revenue unit ID")
    },
    async (params) => {
      try {
        await ensureAuthenticated();
        const result = await createPosition(params);
        
        return {
          content: [{
            type: "text",
            text: formatSuccess(`Position '${result.name}' created with ID ${result.id}`)
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("creating position", error) }] };
      }
    }
  );

  // Update position
  server.tool(
    "update-position",
    {
      positionId: z.number().describe("ID of the position to update"),
      name: z.string().describe("Position name"),
      affectRevenue: z.boolean().describe("Whether position affects revenue"),
      sectionId: z.number().optional().describe("Section ID"),
      color: z.string().optional().describe("Position color"),
      skillIds: z.array(z.number()).optional().describe("Required skill IDs"),
      revenueUnitId: z.number().optional().describe("Revenue unit ID")
    },
    async (params) => {
      try {
        await ensureAuthenticated();
        const { positionId, ...updateData } = params;
        const result = await updatePosition(positionId, updateData);
        
        return {
          content: [{
            type: "text",
            text: formatSuccess(`Position ${positionId} updated successfully`)
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("updating position", error) }] };
      }
    }
  );

  // Delete position
  server.tool(
    "delete-position",
    {
      positionId: z.number().describe("ID of the position to delete"),
      deleteOption: z.enum(["KeepPosition", "RemovePosition", "ReplacePosition", "DeleteShifts"])
        .optional().describe("How to handle existing shifts"),
      replacementPositionId: z.number().optional().describe("Replacement position ID (if ReplacePosition)")
    },
    async ({ positionId, deleteOption, replacementPositionId }) => {
      try {
        await ensureAuthenticated();
        await deletePosition(positionId, { deleteOption, replacementPositionId });
        
        return {
          content: [{
            type: "text",
            text: formatSuccess(`Position ${positionId} deleted successfully`)
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("deleting position", error) }] };
      }
    }
  );

  // ================================
  // SHIFT TYPES MANAGEMENT (2 tools)
  // ================================

  // Create shift type
  server.tool(
    "create-shift-type",
    {
      name: z.string().describe("Shift type name"),
      color: z.string().describe("Color code (e.g., '#FF5733')"),
      salaryCode: z.string().describe("Salary code for payroll"),
      allowsBreaks: z.boolean().optional().describe("Whether breaks are allowed"),
      includeSupplementSalary: z.boolean().optional().describe("Include supplement salary")
    },
    async (params) => {
      try {
        await ensureAuthenticated();
        const result = await createShiftType(params);
        
        return {
          content: [{
            type: "text",
            text: formatSuccess(`Shift type '${params.name}' created with ID ${result.id}`)
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("creating shift type", error) }] };
      }
    }
  );

  // Update shift type
  server.tool(
    "update-shift-type",
    {
      shiftTypeId: z.number().describe("ID of the shift type to update"),
      name: z.string().describe("Shift type name"),
      color: z.string().describe("Color code"),
      salaryCode: z.string().describe("Salary code for payroll"),
      allowsBreaks: z.boolean().optional().describe("Whether breaks are allowed"),
      includeSupplementSalary: z.boolean().optional().describe("Include supplement salary")
    },
    async (params) => {
      try {
        await ensureAuthenticated();
        const { shiftTypeId, ...updateData } = params;
        await updateShiftType(shiftTypeId, updateData);
        
        return {
          content: [{
            type: "text",
            text: formatSuccess(`Shift type ${shiftTypeId} updated successfully`)
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("updating shift type", error) }] };
      }
    }
  );

  // ================================
  // READ-ONLY INFORMATION TOOLS (3 tools)
  // ================================

  // Get sections
  server.tool(
    "get-sections",
    {
      departmentId: z.number().optional().describe("Filter by department ID"),
      limit: z.number().optional().describe("Maximum number of results")
    },
    async ({ departmentId, limit }) => {
      try {
        await ensureAuthenticated();
        const response = await getSections({ departmentId, limit });
        const formatted = formatSections(response.data);
        
        return { content: [{ type: "text", text: formatted }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("fetching sections", error) }] };
      }
    }
  );

  // Get skills
  server.tool(
    "get-skills",
    {
      departmentId: z.number().describe("Department ID to filter skills"),
      employeeGroupId: z.number().optional().describe("Employee group ID filter"),
      limit: z.number().optional().describe("Maximum number of results")
    },
    async ({ departmentId, employeeGroupId, limit }) => {
      try {
        await ensureAuthenticated();
        const response = await getSkills(departmentId, { employeeGroupId, limit });
        const formatted = formatSkills(response.data);
        
        return { content: [{ type: "text", text: formatted }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("fetching skills", error) }] };
      }
    }
  );

  // Get shift history
  server.tool(
    "get-shift-history",
    {
      shiftId: z.number().describe("ID of the shift to get history for"),
      limit: z.number().optional().describe("Maximum number of history records")
    },
    async ({ shiftId, limit }) => {
      try {
        await ensureAuthenticated();
        const response = await getShiftHistory(shiftId, { limit });
        const formatted = formatShiftHistory(response.data, shiftId);
        
        return { content: [{ type: "text", text: formatted }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("fetching shift history", error) }] };
      }
    }
  );

  // ================================
  // SCHEDULE PLANNING TOOLS (2 tools)
  // ================================

  // Get schedule days
  server.tool(
    "get-schedule-days",
    {
      departmentId: z.number().describe("Department ID"),
      startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      limit: z.number().optional().describe("Maximum number of results")
    },
    async ({ departmentId, startDate, endDate, limit }) => {
      try {
        await ensureAuthenticated();
        const response = await getScheduleDays(departmentId, startDate, endDate, { limit });
        const formatted = formatScheduleDays(response.data);
        
        return { content: [{ type: "text", text: formatted }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("fetching schedule days", error) }] };
      }
    }
  );

  // Update schedule day
  server.tool(
    "update-schedule-day",
    {
      departmentId: z.number().describe("Department ID"),
      date: z.string().describe("Date to update (YYYY-MM-DD)"),
      title: z.string().optional().describe("Day title"),
      description: z.string().optional().describe("Day description (manager-only)"),
      isVisible: z.boolean().optional().describe("Whether visible to employees")
    },
    async (params) => {
      try {
        await ensureAuthenticated();
        await updateScheduleDay(params);
        
        return {
          content: [{
            type: "text",
            text: formatSuccess(`Schedule day ${params.date} updated successfully`)
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("updating schedule day", error) }] };
      }
    }
  );

  // ================================
  // COST ANALYSIS TOOL (1 tool)
  // ================================

  // Get time and cost analysis
  server.tool(
    "get-time-and-cost",
    {
      departmentId: z.number().describe("Department ID"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    },
    async ({ departmentId, startDate, endDate }) => {
      try {
        await ensureAuthenticated();
        const data = await getTimeAndCost(departmentId, startDate, endDate);
        const formatted = formatTimeAndCost(data, startDate, endDate);
        
        return { content: [{ type: "text", text: formatted }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError("fetching time and cost data", error) }] };
      }
    }
  );
}
