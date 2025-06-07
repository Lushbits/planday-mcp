// src/tools/shift-tools.ts

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ensureAuthenticated } from '../services/auth.ts';
import { getShifts, getShiftTypes, getPositionsByIds, getShiftTypesByIds } from '../services/api/scheduling-api.ts';
import { getEmployeesByIds, getDepartmentsByIds } from '../services/api/hr-api.ts';
import { DataFormatters } from '../services/formatters.ts';

export function registerShiftTools(server: McpServer) {
  // Get shifts tool
  server.tool(
    "get-shifts",
    {
      startDate: z.string().describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().describe("End date in YYYY-MM-DD format")
    },
    async ({ startDate, endDate }) => {
      try {
        await ensureAuthenticated();

        // Fetch shifts data
        const shifts = await getShifts(startDate, endDate);
        
        if (!shifts || shifts.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No shifts found for the period ${startDate} to ${endDate}`
            }]
          };
        }

        // Get unique IDs for batch lookups
        const employeeIds = [...new Set(shifts.filter(shift => shift.employeeId).map(shift => shift.employeeId!))];
        const departmentIds = [...new Set(shifts.map(shift => shift.departmentId).filter(Boolean) as number[])];
        const positionIds = [...new Set(shifts.map(shift => shift.positionId).filter(Boolean) as number[])];
        const shiftTypeIds = [...new Set(shifts.map(shift => shift.shiftTypeId).filter(Boolean) as number[])];

        // Fetch lookup data in parallel
        const [employeesMap, departmentsMap, positionsMap, shiftTypesMap] = await Promise.all([
          getEmployeesByIds(employeeIds),
          getDepartmentsByIds(departmentIds),
          getPositionsByIds(positionIds),
          getShiftTypesByIds(shiftTypeIds)
        ]);

        // Convert to name maps for formatter
        const employeeNameMap = new Map<number, string>();
        employeesMap.forEach((employee, id) => {
          const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || `Employee ${id}`;
          employeeNameMap.set(id, fullName);
        });

        const departmentNameMap = new Map<number, string>();
        departmentsMap.forEach((department, id) => {
          departmentNameMap.set(id, department.name || `Department ${id}`);
        });

        const positionNameMap = new Map<number, string>();
        positionsMap.forEach((position, id) => {
          positionNameMap.set(id, position.name || `Position ${id}`);
        });

        const shiftTypeNameMap = new Map<number, string>();
        shiftTypesMap.forEach((shiftType, id) => {
          shiftTypeNameMap.set(id, shiftType.name || `Shift Type ${id}`);
        });

        // Format using the formatter
        const formatted = DataFormatters.formatShifts(
          shifts, 
          startDate, 
          endDate, 
          employeeNameMap, 
          departmentNameMap, 
          positionNameMap,
          shiftTypeNameMap
        );

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

  // Get shift types tool
  server.tool(
    "get-shift-types",
    {},
    async () => {
      try {
        await ensureAuthenticated();

        const shiftTypes = await getShiftTypes();
        const formatted = DataFormatters.formatShiftTypes(shiftTypes);
        
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
}
