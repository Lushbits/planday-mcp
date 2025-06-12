// src/services/formatters/scheduling-formatters.ts
// Comprehensive scheduling data formatters for the Planday MCP Server
// Optimized for LLM consumption with clear structure and detailed information

// ✅ CLOUDFLARE WORKERS FIX: Comment out type import to avoid module loading issues
// import type { 
//   Shift, ShiftType, Position, Section, ScheduleDay, Skill, 
//   ShiftHistoryRecord, TimeAndCostData, ShiftCost 
// } from '../api/scheduling-api';

// ================================
// SHIFTS FORMATTING
// ================================

/**
 * Calculate shift duration in hours from startDateTime and endDateTime
 * Handles edge cases like missing times or invalid dates
 */
function calculateShiftDuration(shift: any): number {
  if (!shift.startDateTime || !shift.endDateTime) {
    return 0;
  }
  
  try {
    const startTime = new Date(shift.startDateTime);
    const endTime = new Date(shift.endDateTime);
    
    // Check for valid dates
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return 0;
    }
    
    // Calculate duration in milliseconds, then convert to hours
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    // Handle edge case: negative duration (end before start)
    return Math.max(0, durationHours);
  } catch (error) {
    return 0;
  }
}

/**
 * Format shifts data with comprehensive details and cross-references
 * Provides a complete view of shift scheduling with contextual information
 */
export function formatShifts(
  shifts: any[], // Changed from Shift[] for Cloudflare Workers compatibility
  startDate: string,
  endDate: string,
  employeeNames: Map<number, string> = new Map(),
  departmentNames: Map<number, string> = new Map(),
  positionNames: Map<number, string> = new Map(),
  shiftTypeNames: Map<number, string> = new Map()
): string {
  if (!shifts.length) {
    return `📅 **Shifts (${startDate} to ${endDate})**\n\nNo shifts found in the specified date range.`;
  }

  // Group shifts by date for better organization
  const shiftsByDate = new Map<string, any[]>();
  shifts.forEach(shift => {
    // Use correct field name from Planday API (startDateTime instead of start_time)
    const date = shift.startDateTime ? shift.startDateTime.split('T')[0] : shift.date;
    if (!shiftsByDate.has(date)) {
      shiftsByDate.set(date, []);
    }
    shiftsByDate.get(date)!.push(shift);
  });

  // Calculate summary statistics
  const statusSummary = getShiftStatusSummary(shifts);
  // Calculate total hours from actual start/end times instead of non-existent duration field
  const totalHours = shifts.reduce((sum, shift) => {
    const duration = calculateShiftDuration(shift);
    return sum + (duration || 0);
  }, 0);

  let result = `📅 **Shifts Overview (${startDate} to ${endDate})**\n\n`;
  result += `**Summary:**\n`;
  result += `• Total Shifts: ${shifts.length}\n`;
  result += `• Total Hours: ${totalHours.toFixed(1)}h\n`;
  result += `• Dates Covered: ${shiftsByDate.size}\n`;
  
  if (Object.keys(statusSummary).length > 0) {
    result += `• Status Breakdown: ${Object.entries(statusSummary)
      .map(([status, count]) => `${status} (${count})`)
      .join(', ')}\n`;
  }
  result += '\n---\n\n';

  // Format shifts grouped by date
  const sortedDates = Array.from(shiftsByDate.keys()).sort();
  sortedDates.forEach(date => {
    const dayShifts = shiftsByDate.get(date)!;
    result += `### 📅 ${new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}\n\n`;
    
    dayShifts.forEach(shift => {
      result += formatShiftDetails(shift, employeeNames, departmentNames, positionNames, shiftTypeNames);
      result += '\n';
    });
    result += '\n';
  });

  return result.trim();
}

/**
 * Format individual shift details with all relevant information
 */
function formatShiftDetails(
  shift: any, // Changed from Shift for Cloudflare Workers compatibility
  employeeNames: Map<number, string>,
  departmentNames: Map<number, string>,
  positionNames: Map<number, string>,
  shiftTypeNames: Map<number, string>
): string {
  // Use correct field names from Planday API (camelCase instead of snake_case)
  const startTime = shift.startDateTime ? 
    new Date(shift.startDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 
    'No start time';
  const endTime = shift.endDateTime ? 
    new Date(shift.endDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 
    'No end time';
  // Calculate actual duration from start/end times
  const calculatedDuration = calculateShiftDuration(shift);
  const duration = calculatedDuration > 0 ? `${calculatedDuration.toFixed(1)}h` : 'N/A';
  
  const employeeName = shift.employeeId ? 
    employeeNames.get(shift.employeeId) || `Employee ${shift.employeeId}` : 
    'Unassigned';
  const departmentName = shift.departmentId ? 
    departmentNames.get(shift.departmentId) || `Dept ${shift.departmentId}` : 
    'No department';
  const positionName = shift.positionId ? 
    positionNames.get(shift.positionId) || `Position ${shift.positionId}` : 
    'No position';
  const shiftTypeName = shift.shiftTypeId ? 
    shiftTypeNames.get(shift.shiftTypeId) || `Type ${shift.shiftTypeId}` : 
    'No shift type';

  let result = `**🔸 ${employeeName}** (${startTime} - ${endTime}, ${duration})\n`;
  result += `   📍 ${departmentName} | 👤 ${positionName} | 📋 ${shiftTypeName}\n`;
  
  if (shift.status && shift.status !== 'published') {
    result += `   ⚠️ Status: ${shift.status}\n`;
  }
  
  // Use correct field name: comment instead of notes
  if (shift.comment) {
    result += `   📝 Notes: ${shift.comment}\n`;
  }

  return result;
}

/**
 * Get shift status summary
 */
function getShiftStatusSummary(shifts: any[]): Record<string, number> {
  const summary: Record<string, number> = {};
  shifts.forEach(shift => {
    const status = shift.status || 'published';
    summary[status] = (summary[status] || 0) + 1;
  });
  return summary;
}

// ================================
// SHIFT TYPES FORMATTING
// ================================

/**
 * Format shift types with detailed breakdown
 */
export function formatShiftTypes(shiftTypes: any[]): string {
  if (!shiftTypes.length) {
    return '📋 **Shift Types**\n\nNo shift types found.';
  }

  let result = `📋 **Shift Types (${shiftTypes.length} total)**\n\n`;
  
  // Group by active/inactive status
  const activeTypes = shiftTypes.filter(type => type.active !== false);
  const inactiveTypes = shiftTypes.filter(type => type.active === false);

  if (activeTypes.length > 0) {
    result += '### ✅ Active Shift Types\n\n';
    activeTypes.forEach(shiftType => {
      result += formatShiftTypeDetails(shiftType);
      result += '\n';
    });
  }

  if (inactiveTypes.length > 0) {
    result += '### ❌ Inactive Shift Types\n\n';
    inactiveTypes.forEach(shiftType => {
      result += formatShiftTypeDetails(shiftType);
      result += '\n';
    });
  }

  return result.trim();
}

/**
 * Format individual shift type details
 */
function formatShiftTypeDetails(shiftType: any): string {
  let result = `### 📋 ${shiftType.name} (ID: ${shiftType.id})\n`;
  
  if (shiftType.color) {
    result += `🎨 Color: ${shiftType.color}\n`;
  }
  
  if (shiftType.abbreviation) {
    result += `🔤 Abbreviation: ${shiftType.abbreviation}\n`;
  }
  
  if (shiftType.duration_minutes) {
    result += `⏱️ Duration: ${(shiftType.duration_minutes / 60).toFixed(1)} hours\n`;
  }
  
  result += `📊 Status: ${shiftType.active !== false ? 'Active' : 'Inactive'}\n`;
  
  return result + '\n';
}

// ================================
// POSITIONS FORMATTING
// ================================

/**
 * Format positions with department context
 */
export function formatPositions(
  positions: any[], // Changed from Position[] for Cloudflare Workers compatibility
  departmentNames: Map<number, string> = new Map()
): string {
  if (!positions.length) {
    return '👤 **Positions**\n\nNo positions found.';
  }

  // Group positions by department
  const positionsByDept = new Map<number, any[]>();
  positions.forEach(position => {
    const deptId = position.department_id;
    if (!positionsByDept.has(deptId)) {
      positionsByDept.set(deptId, []);
    }
    positionsByDept.get(deptId)!.push(position);
  });

  let result = `👤 **Positions (${positions.length} total)**\n\n`;

  // Format by department
  positionsByDept.forEach((deptPositions, deptId) => {
    const deptName = departmentNames.get(deptId) || `Department ${deptId}`;
    result += `### 🏢 ${deptName}\n\n`;
    
    deptPositions.forEach(position => {
      result += formatPositionDetails(position);
      result += '\n';
    });
    result += '\n';
  });

  return result.trim();
}

/**
 * Format individual position details
 */
function formatPositionDetails(position: any): string {
  let result = `**${position.name}** (ID: ${position.id})\n`;
  
  if (position.hourly_rate) {
    result += `💰 Hourly Rate: $${position.hourly_rate}\n`;
  }
  
  if (position.color) {
    result += `🎨 Color: ${position.color}\n`;
  }
  
  return result;
}

// ================================
// SECTIONS FORMATTING
// ================================

/**
 * Format sections data
 */
export function formatSections(sections: any[]): string {
  if (!sections.length) {
    return '📋 **Sections**\n\nNo sections found.';
  }

  let result = `📋 **Sections (${sections.length} total)**\n\n`;
  
  sections.forEach(section => {
    result += formatSectionDetails(section);
    result += '\n';
  });

  return result.trim();
}

function formatSectionDetails(section: any): string {
  let result = `### 📋 ${section.name} (ID: ${section.id})\n`;
  
  if (section.color) {
    result += `🎨 Color: ${section.color}\n`;
  }
  
  if (section.description) {
    result += `📝 Description: ${section.description}\n`;
  }
  
  return result + '\n';
}

// ================================
// SCHEDULE DAYS FORMATTING
// ================================

/**
 * Format schedule days data
 */
export function formatScheduleDays(scheduleDays: any[]): string {
  if (!scheduleDays.length) {
    return '📅 **Schedule Days**\n\nNo schedule days found.';
  }

  // Group by date
  const daysByDate = new Map<string, any[]>();
  scheduleDays.forEach(day => {
    const date = day.date;
    if (!daysByDate.has(date)) {
      daysByDate.set(date, []);
    }
    daysByDate.get(date)!.push(day);
  });

  let result = `📅 **Schedule Days (${scheduleDays.length} total)**\n\n`;
  
  const sortedDates = Array.from(daysByDate.keys()).sort();
  sortedDates.forEach(date => {
    const dayData = daysByDate.get(date)!;
    result += formatScheduleDayDetails(date, dayData);
    result += '\n';
  });

  return result.trim();
}

function formatScheduleDayDetails(date: string, dayData: any[]): string {
  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let result = `### 📅 ${formattedDate}\n`;
  
  dayData.forEach(day => {
    if (day.is_holiday) {
      result += `🎉 Holiday: ${day.holiday_name || 'Unnamed Holiday'}\n`;
    }
    if (day.notes) {
      result += `📝 Notes: ${day.notes}\n`;
    }
  });
  
  return result + '\n';
}

// ================================
// SKILLS FORMATTING
// ================================

/**
 * Format skills data
 */
export function formatSkills(skills: any[]): string {
  if (!skills.length) {
    return '🎯 **Skills**\n\nNo skills found.';
  }

  // Group by active status
  const activeSkills = skills.filter(skill => skill.active !== false);
  const inactiveSkills = skills.filter(skill => skill.active === false);

  let result = `🎯 **Skills (${skills.length} total)**\n\n`;

  if (activeSkills.length > 0) {
    result += '### ✅ Active Skills\n\n';
    activeSkills.forEach(skill => {
      result += formatSkillDetails(skill);
      result += '\n';
    });
  }

  if (inactiveSkills.length > 0) {
    result += '### ❌ Inactive Skills\n\n';
    inactiveSkills.forEach(skill => {
      result += formatSkillDetails(skill);
      result += '\n';
    });
  }

  return result.trim();
}

function formatSkillDetails(skill: any): string {
  let result = `**${skill.name}** (ID: ${skill.id})\n`;
  
  if (skill.description) {
    result += `📝 Description: ${skill.description}\n`;
  }
  
  if (skill.color) {
    result += `🎨 Color: ${skill.color}\n`;
  }
  
  return result;
}

// ================================
// OPERATION RESULT FORMATTERS
// ================================

/**
 * Format shift operation results (create, update, delete)
 */
export function formatShiftOperationResult(
  operation: string,
  success: boolean,
  data?: any,
  error?: string
): string {
  const emoji = success ? '✅' : '❌';
  const status = success ? 'Success' : 'Failed';
  
  let result = `${emoji} **Shift ${operation} ${status}**\n\n`;
  
  if (success && data) {
    result += '**Result:**\n';
    if (data.id) result += `• Shift ID: ${data.id}\n`;
    // Use correct field names from Planday API
    if (data.startDateTime) result += `• Start Time: ${new Date(data.startDateTime).toLocaleString()}\n`;
    if (data.endDateTime) result += `• End Time: ${new Date(data.endDateTime).toLocaleString()}\n`;
    if (data.employeeId) result += `• Employee ID: ${data.employeeId}\n`;
    if (data.positionId) result += `• Position ID: ${data.positionId}\n`;
  }
  
  if (!success && error) {
    result += `**Error:** ${error}\n`;
  }
  
  return result;
}
// ================================
// SHIFT HISTORY FORMATTING (FIXED FOR PLANDAY API)
// ================================

/**
 * Format shift history data from Planday API
 * Planday returns: { modifiedAt, modifiedBy: { id, name }, changes: string[] }
 */
export function formatShiftHistory(
  historyData: any[],
  shiftId: string | number
): string {
  if (!historyData || historyData.length === 0) {
    return `📜 **Shift History (ID: ${shiftId})**\n\nNo history records found for this shift.`;
  }

  let result = `📜 **Shift History (ID: ${shiftId})**\n\n`;
  result += `**Total Records:** ${historyData.length}\n\n`;

  // Sort by modifiedAt timestamp (most recent first)
  const sortedHistory = historyData.sort((a, b) => {
    const timeA = new Date(a.modifiedAt || 0).getTime();
    const timeB = new Date(b.modifiedAt || 0).getTime();
    return timeB - timeA;
  });

  sortedHistory.forEach((record, index) => {
    result += formatShiftHistoryRecord(record, index === 0);
    if (index < sortedHistory.length - 1) {
      result += '\n---\n\n';
    }
  });

  return result.trim();
}

/**
 * Format individual shift history record for Planday API format
 */
function formatShiftHistoryRecord(record: any, isLatest: boolean = false): string {
  // Extract data from Planday API format
  const modifiedAt = record.modifiedAt;
  const modifiedBy = record.modifiedBy || {};
  const changes = record.changes || [];
  
  // Format the timestamp
  const date = modifiedAt 
    ? new Date(modifiedAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : 'Unknown time';

  // Get user info
  const userName = modifiedBy.name || `User ${modifiedBy.id}` || 'System';
  const userId = modifiedBy.id;

  // Build the formatted output
  let result = `### ${isLatest ? '🔥 Latest Change' : '📋 Change'}\n`;
  result += `📅 **When:** ${date}\n`;
  result += `👤 **Who:** ${userName}${userId ? ` (ID: ${userId})` : ''}\n`;
  
  // Format the changes
  if (changes.length > 0) {
    result += `🔄 **Changes Made:**\n`;
    changes.forEach((change: string, index: number) => {
      result += `   ${index + 1}. ${change}\n`;
    });
  } else {
    result += `📝 **Change:** No specific details available\n`;
  }

  return result;
}

/**
 * Format shift history for timeline view (alternative formatting)
 */
export function formatShiftHistoryTimeline(
  historyData: any[],
  shiftId: string | number
): string {
  if (!historyData || historyData.length === 0) {
    return `📜 **Shift ${shiftId} Timeline**\n\nNo history available.`;
  }

  let result = `📜 **Shift ${shiftId} Timeline** (${historyData.length} events)\n\n`;

  // Sort chronologically (oldest first for timeline)
  const sortedHistory = historyData.sort((a, b) => {
    const timeA = new Date(a.modifiedAt || 0).getTime();
    const timeB = new Date(b.modifiedAt || 0).getTime();
    return timeA - timeB;
  });

  sortedHistory.forEach((record, index) => {
    const date = record.modifiedAt 
      ? new Date(record.modifiedAt).toLocaleString()
      : 'Unknown time';
    const user = record.modifiedBy?.name || 'System';
    const changes = record.changes || [];

    result += `**${index + 1}.** ${date} - ${user}\n`;
    changes.forEach((change: string) => {
      result += `    • ${change}\n`;
    });
    result += '\n';
  });

  return result.trim();
}

// ================================
// TIME AND COST FORMATTING
// ================================

/**
 * Format time and cost data with comprehensive breakdown
 * Based on the actual Planday API response structure
 */
export function formatTimeAndCost(
  data: any,
  startDate: string,
  endDate: string
): string {
  if (!data || !data.costs || data.costs.length === 0) {
    return `💰 **Time and Cost Analysis (${startDate} to ${endDate})**\n\nNo cost data available for the specified period.`;
  }

  const costs = data.costs;
  // Use the currency symbol from the API response as intended
  const currencySymbol = data.currencySymbol || '$';
  
  // Calculate summary statistics
  const totalCost = costs.reduce((sum: number, cost: any) => sum + cost.cost, 0);
  const totalShifts = costs.length;
  
  // Enhanced duration parsing with better error handling and debugging
  const totalHours = costs.reduce((sum: number, cost: any) => {
    try {
      // Handle different possible duration formats
      const duration = cost.duration || '0:00:00';
      
      // Check if duration is in colon-separated format
      if (typeof duration === 'string' && duration.includes(':')) {
        const parts = duration.split(':');
        
        if (parts.length === 3) {
          // Based on the API response, this seems to be D:HH:MM format (days:hours:minutes)
          // not HH:MM:SS as documented
          const [days, hours, minutes] = parts.map(Number);
          const totalHours = days * 24 + hours + minutes/60;
          return sum + totalHours;
        } else if (parts.length === 2) {
          // HH:MM format
          const [hours, minutes] = parts.map(Number);
          const totalHours = hours + minutes/60;
          return sum + totalHours;
        }
      }
      
      // If duration is a number, assume it's in hours
      if (typeof duration === 'number') {
        return sum + duration;
      }
      
      // Fallback: try to parse as a decimal number
      const numericDuration = parseFloat(duration);
      if (!isNaN(numericDuration)) {
        return sum + numericDuration;
      }
      
      console.warn(`Unable to parse duration: ${duration} for shift ${cost.shiftId}`);
      return sum;
      
    } catch (error) {
      console.warn(`Error parsing duration for shift ${cost.shiftId}:`, error);
      return sum;
    }
  }, 0);
  
  const avgCostPerShift = totalCost / totalShifts;
  const avgHourlyRate = totalHours > 0 ? totalCost / totalHours : 0;

  let result = `💰 **Time and Cost Analysis (${startDate} to ${endDate})**\n\n`;

  // Add debugging info to help diagnose the time calculation issue
  result += '### 🔍 Debug Info (Remove after fixing)\n';
  result += `Raw API Currency Symbol: ${data.currencySymbol || 'undefined'}\n`;
  result += `Sample Duration Values: ${costs.slice(0, 3).map((c: any) => `${c.shiftId}:${c.duration}`).join(', ')}\n`;
  result += `Parsed Total Hours: ${totalHours}\n\n`;

  // Summary section
  result += '### 📊 Summary\n';
  result += `⏰ **Total Hours:** ${totalHours.toFixed(1)}h\n`;
  result += `💵 **Total Cost:** ${currencySymbol}${totalCost.toFixed(2)}\n`;
  result += `📈 **Average Rate:** ${currencySymbol}${avgHourlyRate.toFixed(2)}/hour\n`;
  result += `📅 **Total Shifts:** ${totalShifts}\n`;
  result += `💰 **Average Cost/Shift:** ${currencySymbol}${avgCostPerShift.toFixed(2)}\n\n`;

  // Group by date for daily breakdown
  const costsByDate = new Map<string, any[]>();
  costs.forEach((cost: any) => {
    if (!costsByDate.has(cost.date)) {
      costsByDate.set(cost.date, []);
    }
    costsByDate.get(cost.date)!.push(cost);
  });

  result += '### 📅 Daily Breakdown\n\n';
  const sortedDates = Array.from(costsByDate.keys()).sort();
  
  sortedDates.forEach(date => {
    const dayCosts = costsByDate.get(date)!;
    const dayTotal = dayCosts.reduce((sum: number, cost: any) => sum + cost.cost, 0);
    const dayHours = dayCosts.reduce((sum: number, cost: any) => {
      const duration = cost.duration || '0:00:00';
      try {
        if (typeof duration === 'string' && duration.includes(':')) {
          const parts = duration.split(':');
          if (parts.length === 3) {
            // D:HH:MM format (days:hours:minutes)
            const [days, hours, minutes] = parts.map(Number);
            return sum + days * 24 + hours + minutes/60;
          } else if (parts.length === 2) {
            const [hours, minutes] = parts.map(Number);
            return sum + hours + minutes/60;
          }
        }
        return sum + (parseFloat(duration) || 0);
      } catch {
        return sum;
      }
    }, 0);
    
    result += `**📆 ${date}**\n`;
    result += `• Shifts: ${dayCosts.length} | Hours: ${dayHours.toFixed(1)}h | Cost: ${currencySymbol}${dayTotal.toFixed(2)}\n\n`;
  });

  // Group by employee for detailed breakdown
  const costsByEmployee = new Map<number, any[]>();
  costs.forEach((cost: any) => {
    if (!costsByEmployee.has(cost.employeeId)) {
      costsByEmployee.set(cost.employeeId, []);
    }
    costsByEmployee.get(cost.employeeId)!.push(cost);
  });

  if (costsByEmployee.size > 0) {
    result += '### 👥 Employee Breakdown\n\n';
    
    Array.from(costsByEmployee.entries()).forEach(([employeeId, empCosts]) => {
      const empTotal = empCosts.reduce((sum: number, cost: any) => sum + cost.cost, 0);
      const empHours = empCosts.reduce((sum: number, cost: any) => {
        const duration = cost.duration || '0:00:00';
        try {
          if (typeof duration === 'string' && duration.includes(':')) {
            const parts = duration.split(':');
            if (parts.length === 3) {
              // D:HH:MM format (days:hours:minutes)
              const [days, hours, minutes] = parts.map(Number);
              return sum + days * 24 + hours + minutes/60;
            } else if (parts.length === 2) {
              const [hours, minutes] = parts.map(Number);
              return sum + hours + minutes/60;
            }
          }
          return sum + (parseFloat(duration) || 0);
        } catch {
          return sum;
        }
      }, 0);
      const empRate = empHours > 0 ? empTotal / empHours : 0;
      
      result += `**👤 Employee ${employeeId}**\n`;
      result += `• Hours: ${empHours.toFixed(1)}h | Cost: ${currencySymbol}${empTotal.toFixed(2)} | Rate: ${currencySymbol}${empRate.toFixed(2)}/hr\n`;
      result += `• Shifts: ${empCosts.length}\n\n`;
    });
  }

  // Group by position for position analysis
  const costsByPosition = new Map<number, any[]>();
  costs.forEach((cost: any) => {
    if (!costsByPosition.has(cost.positionId)) {
      costsByPosition.set(cost.positionId, []);
    }
    costsByPosition.get(cost.positionId)!.push(cost);
  });

  if (costsByPosition.size > 0) {
    result += '### 📋 Position Analysis\n\n';
    
    Array.from(costsByPosition.entries()).forEach(([positionId, posCosts]) => {
      const posTotal = posCosts.reduce((sum: number, cost: any) => sum + cost.cost, 0);
      const posHours = posCosts.reduce((sum: number, cost: any) => {
        const duration = cost.duration || '0:00:00';
        try {
          if (typeof duration === 'string' && duration.includes(':')) {
            const parts = duration.split(':');
            if (parts.length === 3) {
              // D:HH:MM format (days:hours:minutes)
              const [days, hours, minutes] = parts.map(Number);
              return sum + days * 24 + hours + minutes/60;
            } else if (parts.length === 2) {
              const [hours, minutes] = parts.map(Number);
              return sum + hours + minutes/60;
            }
          }
          return sum + (parseFloat(duration) || 0);
        } catch {
          return sum;
        }
      }, 0);
      const posRate = posHours > 0 ? posTotal / posHours : 0;
      
      result += `**📍 Position ${positionId}**\n`;
      result += `• Hours: ${posHours.toFixed(1)}h | Cost: ${currencySymbol}${posTotal.toFixed(2)} | Rate: ${currencySymbol}${posRate.toFixed(2)}/hr\n`;
      result += `• Shifts: ${posCosts.length}\n\n`;
    });
  }

  // Group by shift type for shift type analysis
  const costsByShiftType = new Map<number, any[]>();
  costs.forEach((cost: any) => {
    if (!costsByShiftType.has(cost.shiftTypeId)) {
      costsByShiftType.set(cost.shiftTypeId, []);
    }
    costsByShiftType.get(cost.shiftTypeId)!.push(cost);
  });

  if (costsByShiftType.size > 0) {
    result += '### 🏷️ Shift Type Analysis\n\n';
    
    Array.from(costsByShiftType.entries()).forEach(([shiftTypeId, typeCosts]) => {
      const typeTotal = typeCosts.reduce((sum: number, cost: any) => sum + cost.cost, 0);
      const typeHours = typeCosts.reduce((sum: number, cost: any) => {
        const duration = cost.duration || '0:00:00';
        try {
          if (typeof duration === 'string' && duration.includes(':')) {
            const parts = duration.split(':');
            if (parts.length === 3) {
              // D:HH:MM format (days:hours:minutes)
              const [days, hours, minutes] = parts.map(Number);
              return sum + days * 24 + hours + minutes/60;
            } else if (parts.length === 2) {
              const [hours, minutes] = parts.map(Number);
              return sum + hours + minutes/60;
            }
          }
          return sum + (parseFloat(duration) || 0);
        } catch {
          return sum;
        }
      }, 0);
      const typeRate = typeHours > 0 ? typeTotal / typeHours : 0;
      
      result += `**🏷️ Shift Type ${shiftTypeId}**\n`;
      result += `• Hours: ${typeHours.toFixed(1)}h | Cost: ${currencySymbol}${typeTotal.toFixed(2)} | Rate: ${currencySymbol}${typeRate.toFixed(2)}/hr\n`;
      result += `• Shifts: ${typeCosts.length}\n\n`;
    });
  }

  return result.trim();
}

// Note: The old formatEmployeeTimeAndCost and formatDepartmentTimeAndCost helper functions 
// have been removed and replaced with inline logic above to match the actual API response structure
// from the Planday Time and Cost API documentation 
