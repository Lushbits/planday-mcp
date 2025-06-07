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
    const date = shift.start_time.split('T')[0];
    if (!shiftsByDate.has(date)) {
      shiftsByDate.set(date, []);
    }
    shiftsByDate.get(date)!.push(shift);
  });

  // Calculate summary statistics
  const statusSummary = getShiftStatusSummary(shifts);
  const totalHours = shifts.reduce((sum, shift) => sum + (shift.duration || 0), 0) / 60; // Convert minutes to hours

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
  const startTime = new Date(shift.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(shift.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const duration = shift.duration ? `${(shift.duration / 60).toFixed(1)}h` : 'N/A';
  
  const employeeName = employeeNames.get(shift.employee_id) || `Employee ${shift.employee_id}`;
  const departmentName = departmentNames.get(shift.department_id) || `Dept ${shift.department_id}`;
  const positionName = positionNames.get(shift.position_id) || `Position ${shift.position_id}`;
  const shiftTypeName = shiftTypeNames.get(shift.shift_type_id) || `Type ${shift.shift_type_id}`;

  let result = `**🔸 ${employeeName}** (${startTime} - ${endTime}, ${duration})\n`;
  result += `   📍 ${departmentName} | 👤 ${positionName} | 📋 ${shiftTypeName}\n`;
  
  if (shift.status && shift.status !== 'published') {
    result += `   ⚠️ Status: ${shift.status}\n`;
  }
  
  if (shift.notes) {
    result += `   📝 Notes: ${shift.notes}\n`;
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
    if (data.start_time) result += `• Start Time: ${new Date(data.start_time).toLocaleString()}\n`;
    if (data.end_time) result += `• End Time: ${new Date(data.end_time).toLocaleString()}\n`;
    if (data.employee_id) result += `• Employee ID: ${data.employee_id}\n`;
    if (data.position_id) result += `• Position ID: ${data.position_id}\n`;
  }
  
  if (!success && error) {
    result += `**Error:** ${error}\n`;
  }
  
  return result;
} 
// ================================
// ADDITIONAL EXPORTS (Add at the very end)
// ================================

// Re-export all functions to ensure they're available
export {
  formatShifts,
  formatShiftTypes,
  formatPositions,
  formatSections,
  formatScheduleDays,
  formatSkills,
  formatShiftOperationResult,
};