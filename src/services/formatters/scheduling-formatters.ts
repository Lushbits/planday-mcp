// src/services/formatters/scheduling-formatters.ts
// Comprehensive Scheduling Formatters for 8 Domains
// Optimized for LLM consumption with clear structure and detailed information

import type { 
  Shift, ShiftType, Position, Section, ScheduleDay, Skill, 
  ShiftHistoryRecord, TimeAndCostData, ShiftCost 
} from '../api/scheduling-api.ts';

// ================================
// CORE SHIFT FORMATTERS
// ================================

/**
 * Format shift data with comprehensive details and name resolution
 * Optimized for schedule planning and management tasks
 */
export function formatShifts(
  shifts: Shift[],
  startDate: string,
  endDate: string,
  employeeNames: Map<number, string> = new Map(),
  departmentNames: Map<number, string> = new Map(),
  positionNames: Map<number, string> = new Map(),
  shiftTypeNames: Map<number, string> = new Map()
): string {
  if (!shifts.length) {
    return `📅 **Shift Schedule: ${startDate} to ${endDate}**\n\nNo shifts found for this period.`;
  }

  // Group shifts by date for better organization
  const shiftsByDate = new Map<string, Shift[]>();
  shifts.forEach(shift => {
    const date = shift.date;
    if (!shiftsByDate.has(date)) {
      shiftsByDate.set(date, []);
    }
    shiftsByDate.get(date)!.push(shift);
  });

  // Sort dates chronologically
  const sortedDates = Array.from(shiftsByDate.keys()).sort();

  let result = `📅 **Shift Schedule: ${startDate} to ${endDate}**\n`;
  result += `📊 **Summary:** ${shifts.length} shifts across ${sortedDates.length} days\n\n`;

  // Format shifts by date
  sortedDates.forEach(date => {
    const dayShifts = shiftsByDate.get(date)!;
    result += `## 📅 ${formatDate(date)} (${dayShifts.length} shifts)\n\n`;

    // Sort shifts by start time
    const sortedShifts = dayShifts.sort((a, b) => {
      const timeA = a.startDateTime || '00:00';
      const timeB = b.startDateTime || '00:00';
      return timeA.localeCompare(timeB);
    });

    sortedShifts.forEach(shift => {
      result += formatShiftDetails(shift, employeeNames, departmentNames, positionNames, shiftTypeNames);
      result += '\n';
    });

    result += '\n';
  });

  // Add summary statistics
  const statusCounts = getShiftStatusSummary(shifts);
  result += `📈 **Status Summary:**\n`;
  Object.entries(statusCounts).forEach(([status, count]) => {
    result += `• ${status}: ${count} shifts\n`;
  });

  return result;
}

/**
 * Format individual shift with all relevant details
 */
function formatShiftDetails(
  shift: Shift,
  employeeNames: Map<number, string>,
  departmentNames: Map<number, string>,
  positionNames: Map<number, string>,
  shiftTypeNames: Map<number, string>
): string {
  const employee = shift.employeeId ? 
    employeeNames.get(shift.employeeId) || `Employee ${shift.employeeId}` : 
    '🔓 **Open Shift**';

  const department = shift.departmentId ? 
    departmentNames.get(shift.departmentId) || `Department ${shift.departmentId}` : 
    'Unknown Department';

  const position = shift.positionId ? 
    positionNames.get(shift.positionId) || `Position ${shift.positionId}` : 
    'No Position';

  const shiftType = shift.shiftTypeId ? 
    shiftTypeNames.get(shift.shiftTypeId) || `Type ${shift.shiftTypeId}` : 
    'Standard';

  const timeRange = formatTimeRange(shift.startDateTime, shift.endDateTime);
  const status = getStatusEmoji(shift.status) + ' ' + (shift.status || 'Unknown');

  let result = `### 🎯 Shift ${shift.id}\n`;
  result += `**${employee}** | ${status}\n`;
  result += `⏰ **Time:** ${timeRange}\n`;
  result += `🏢 **Department:** ${department}\n`;
  result += `👔 **Position:** ${position}\n`;
  result += `📋 **Type:** ${shiftType}\n`;

  if (shift.comment) {
    result += `💬 **Comment:** ${shift.comment}\n`;
  }

  if (shift.skillIds && shift.skillIds.length > 0) {
    result += `🎯 **Required Skills:** ${shift.skillIds.join(', ')}\n`;
  }

  return result;
}

/**
 * Format shift types with detailed breakdown
 */
export function formatShiftTypes(shiftTypes: ShiftType[]): string {
  if (!shiftTypes.length) {
    return '📋 **Shift Types**\n\nNo shift types found.';
  }

  let result = `📋 **Shift Types** (${shiftTypes.length} types)\n\n`;

  // Group by active status
  const activeTypes = shiftTypes.filter(st => st.isActive);
  const inactiveTypes = shiftTypes.filter(st => !st.isActive);

  if (activeTypes.length > 0) {
    result += `## ✅ Active Shift Types (${activeTypes.length})\n\n`;
    activeTypes.forEach(shiftType => {
      result += formatShiftTypeDetails(shiftType);
      result += '\n';
    });
  }

  if (inactiveTypes.length > 0) {
    result += `## ❌ Inactive Shift Types (${inactiveTypes.length})\n\n`;
    inactiveTypes.forEach(shiftType => {
      result += formatShiftTypeDetails(shiftType);
      result += '\n';
    });
  }

  return result;
}

/**
 * Format individual shift type details
 */
function formatShiftTypeDetails(shiftType: ShiftType): string {
  let result = `### 📋 ${shiftType.name} (ID: ${shiftType.id})\n`;
  
  if (shiftType.color) {
    result += `🎨 **Color:** ${shiftType.color}\n`;
  }
  
  if (shiftType.salaryCode) {
    result += `💰 **Salary Code:** ${shiftType.salaryCode}\n`;
  }

  result += `💸 **Payment:** ${formatPaymentType(shiftType)}\n`;
  result += `☕ **Breaks:** ${shiftType.allowsBreaks ? 'Allowed' : 'Not Allowed'}\n`;
  result += `📖 **Employee Booking:** ${shiftType.allowBooking ? 'Allowed' : 'Restricted'}\n`;
  result += `🖨️ **Include in Printed Schedule:** ${shiftType.includeInSchedulePrint ? 'Yes' : 'No'}\n`;

  return result;
}

// ================================
// POSITION FORMATTERS
// ================================

/**
 * Format positions with full details
 */
export function formatPositions(positions: Position[]): string {
  if (!positions.length) {
    return '👔 **Positions**\n\nNo positions found.';
  }

  let result = `👔 **Positions** (${positions.length} positions)\n\n`;

  // Group by active status
  const activePositions = positions.filter(p => p.isActive);
  const inactivePositions = positions.filter(p => !p.isActive);

  if (activePositions.length > 0) {
    result += `## ✅ Active Positions (${activePositions.length})\n\n`;
    activePositions.forEach(position => {
      result += formatPositionDetails(position);
      result += '\n';
    });
  }

  if (inactivePositions.length > 0) {
    result += `## ❌ Inactive Positions (${inactivePositions.length})\n\n`;
    inactivePositions.forEach(position => {
      result += formatPositionDetails(position);
      result += '\n';
    });
  }

  return result;
}

/**
 * Format individual position details
 */
function formatPositionDetails(position: Position): string {
  let result = `### 👔 ${position.name} (ID: ${position.id})\n`;
  result += `🏢 **Department:** ${position.departmentId}\n`;
  result += `👥 **Employee Group:** ${position.employeeGroupId}\n`;
  result += `💰 **Affects Revenue:** ${position.affectRevenue ? 'Yes' : 'No'}\n`;

  if (position.sectionId) {
    result += `📂 **Section:** ${position.sectionId}\n`;
  }

  if (position.color) {
    result += `🎨 **Color:** ${position.color}\n`;
  }

  if (position.skillIds && position.skillIds.length > 0) {
    result += `🎯 **Required Skills:** ${position.skillIds.join(', ')}\n`;
  }

  if (position.startDate && position.endDate) {
    result += `📅 **Valid Period:** ${position.startDate} to ${position.endDate}\n`;
  }

  return result;
}

// ================================
// SECTIONS FORMATTERS
// ================================

/**
 * Format sections grouped by department
 */
export function formatSections(sections: Section[]): string {
  if (!sections.length) {
    return '📂 **Sections**\n\nNo sections found.';
  }

  let result = `📂 **Sections** (${sections.length} sections)\n\n`;

  // Group by department
  const sectionsByDept = new Map<number, Section[]>();
  sections.forEach(section => {
    if (!sectionsByDept.has(section.departmentId)) {
      sectionsByDept.set(section.departmentId, []);
    }
    sectionsByDept.get(section.departmentId)!.push(section);
  });

  // Sort departments
  const sortedDepts = Array.from(sectionsByDept.keys()).sort((a, b) => a - b);

  sortedDepts.forEach(deptId => {
    const deptSections = sectionsByDept.get(deptId)!;
    result += `## 🏢 Department ${deptId} (${deptSections.length} sections)\n\n`;

    deptSections.forEach(section => {
      result += `• **${section.name}** (ID: ${section.id})\n`;
    });

    result += '\n';
  });

  return result;
}

// ================================
// SCHEDULE DAY FORMATTERS
// ================================

/**
 * Format schedule days with full context
 */
export function formatScheduleDays(scheduleDays: ScheduleDay[]): string {
  if (!scheduleDays.length) {
    return '📅 **Schedule Days**\n\nNo schedule days found.';
  }

  let result = `📅 **Schedule Days** (${scheduleDays.length} days)\n\n`;

  // Sort by date
  const sortedDays = scheduleDays.sort((a, b) => a.date.localeCompare(b.date));

  sortedDays.forEach(day => {
    result += formatScheduleDayDetails(day);
    result += '\n';
  });

  return result;
}

/**
 * Format individual schedule day
 */
function formatScheduleDayDetails(day: ScheduleDay): string {
  let result = `### 📅 ${formatDate(day.date)}\n`;
  
  if (day.title) {
    result += `📝 **Title:** ${day.title}\n`;
  }

  if (day.description) {
    result += `📄 **Description:** ${day.description}\n`;
  }

  result += `👁️ **Visible to Employees:** ${day.isVisible ? 'Yes' : 'No (Manager Only)'}\n`;
  result += `🔒 **Lock Status:** ${getLockStatusEmoji(day.lockState)} ${day.lockState}\n`;

  if (day.holiday && day.holiday.length > 0) {
    result += `🎉 **Holidays:**\n`;
    day.holiday.forEach(holiday => {
      result += `  • ${holiday.title} (${holiday.calendarName})\n`;
    });
  }

  return result;
}

// ================================
// SKILLS FORMATTERS
// ================================

/**
 * Format skills with grouping and detailed information
 */
export function formatSkills(skills: Skill[]): string {
  if (!skills.length) {
    return '🎯 **Skills**\n\nNo skills found.';
  }

  let result = `🎯 **Skills** (${skills.length} skills)\n\n`;

  // Group by status
  const activeSkills = skills.filter(s => !s.isRemoved && !s.isDeleted);
  const removedSkills = skills.filter(s => s.isRemoved && !s.isDeleted);

  if (activeSkills.length > 0) {
    result += `## ✅ Active Skills (${activeSkills.length})\n\n`;
    activeSkills.forEach(skill => {
      result += formatSkillDetails(skill);
      result += '\n';
    });
  }

  if (removedSkills.length > 0) {
    result += `## ❌ Removed Skills (${removedSkills.length})\n\n`;
    removedSkills.forEach(skill => {
      result += formatSkillDetails(skill);
      result += '\n';
    });
  }

  return result;
}

/**
 * Format individual skill details
 */
function formatSkillDetails(skill: Skill): string {
  let result = `### 🎯 ${skill.name} (ID: ${skill.id})\n`;
  
  if (skill.description) {
    result += `📄 **Description:** ${skill.description}\n`;
  }

  result += `👥 **Scope:** ${skill.allEmployeeGroups ? 'All Employee Groups' : 'Specific Groups'}\n`;

  if (!skill.allEmployeeGroups && skill.employeeGroupIds.length > 0) {
    result += `📋 **Employee Groups:** ${skill.employeeGroupIds.join(', ')}\n`;
  }

  return result;
}

// ================================
// SHIFT HISTORY FORMATTERS
// ================================

/**
 * Format shift history as a chronological timeline
 */
export function formatShiftHistory(history: ShiftHistoryRecord[], shiftId: number): string {
  if (!history.length) {
    return `📜 **Shift ${shiftId} History**\n\nNo history records found.`;
  }

  let result = `📜 **Shift ${shiftId} History** (${history.length} records)\n\n`;

  // History is typically in reverse chronological order
  history.forEach((record, index) => {
    result += `## 📅 ${formatDateTime(record.modifiedAt)}\n`;
    result += `👤 **Modified by:** ${record.modifiedBy.name} (ID: ${record.modifiedBy.id})\n\n`;
    
    result += `**Changes:**\n`;
    record.changes.forEach(change => {
      result += `• ${change}\n`;
    });

    if (index < history.length - 1) {
      result += '\n---\n\n';
    }
  });

  return result;
}

// ================================
// TIME & COST FORMATTERS
// ================================

/**
 * Format time and cost data with comprehensive analysis
 */
export function formatTimeAndCost(data: TimeAndCostData, startDate: string, endDate: string): string {
  if (!data.costs.length) {
    return `💰 **Time & Cost Analysis: ${startDate} to ${endDate}**\n\nNo cost data found.`;
  }

  let result = `💰 **Time & Cost Analysis: ${startDate} to ${endDate}**\n`;
  result += `💱 **Currency:** ${data.currencySymbol}\n`;
  result += `📊 **Records:** ${data.costs.length} shifts\n\n`;

  // Calculate totals
  const totalCost = data.costs.reduce((sum, cost) => sum + cost.cost, 0);
  const totalHours = calculateTotalHours(data.costs);
  const averageCostPerShift = totalCost / data.costs.length;
  const averageHourlyRate = totalCost / totalHours;

  result += `## 📈 Summary\n`;
  result += `💰 **Total Cost:** ${data.currencySymbol}${totalCost.toFixed(2)}\n`;
  result += `⏰ **Total Hours:** ${totalHours.toFixed(2)} hours\n`;
  result += `📊 **Average Cost/Shift:** ${data.currencySymbol}${averageCostPerShift.toFixed(2)}\n`;
  result += `⏱️ **Average Hourly Rate:** ${data.currencySymbol}${averageHourlyRate.toFixed(2)}/hour\n\n`;

  // Group by date
  const costsByDate = new Map<string, ShiftCost[]>();
  data.costs.forEach(cost => {
    if (!costsByDate.has(cost.date)) {
      costsByDate.set(cost.date, []);
    }
    costsByDate.get(cost.date)!.push(cost);
  });

  const sortedDates = Array.from(costsByDate.keys()).sort();

  result += `## 📅 Daily Breakdown\n\n`;
  sortedDates.forEach(date => {
    const dayCosts = costsByDate.get(date)!;
    const dayTotal = dayCosts.reduce((sum, cost) => sum + cost.cost, 0);
    const dayHours = calculateTotalHours(dayCosts);

    result += `### ${formatDate(date)}\n`;
    result += `💰 **Day Total:** ${data.currencySymbol}${dayTotal.toFixed(2)} (${dayHours.toFixed(2)} hours)\n`;
    result += `📊 **Shifts:** ${dayCosts.length}\n\n`;

    dayCosts.forEach(cost => {
      const hours = parseDuration(cost.duration);
      const hourlyRate = cost.cost / hours;
      
      result += `• **Shift ${cost.shiftId}:** Employee ${cost.employeeId}\n`;
      result += `  ${cost.duration} → ${data.currencySymbol}${cost.cost.toFixed(2)} (${data.currencySymbol}${hourlyRate.toFixed(2)}/hr)\n`;
    });

    result += '\n';
  });

  return result;
}

// ================================
// OPERATION RESULT FORMATTERS
// ================================

/**
 * Format successful shift operation results
 */
export function formatShiftOperationResult(operation: string, shiftId: number, data: any): string {
  return `✅ **Shift ${operation} successfully**\n\n` +
         `🎯 **Shift ID:** ${shiftId}\n` +
         `📅 **Date:** ${data.date || 'Not specified'}\n` +
         `⏰ **Time:** ${formatTimeRange(data.startTime, data.endTime)}\n` +
         (data.employeeId ? `👤 **Employee:** ${data.employeeId}\n` : '') +
         (data.comment ? `💬 **Comment:** ${data.comment}\n` : '');
}

/**
 * Format success messages
 */
export function formatSuccess(message: string): string {
  return `✅ **Success:** ${message}`;
}

/**
 * Format error messages with context
 */
export function formatError(operation: string, error: any): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return `❌ **Error ${operation}:**\n\n${errorMessage}\n\nPlease check your parameters and try again.`;
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
}

/**
 * Format datetime for display
 */
function formatDateTime(dateTimeString: string): string {
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateTimeString;
  }
}

/**
 * Format time range from datetime strings
 */
function formatTimeRange(startDateTime?: string, endDateTime?: string): string {
  if (!startDateTime || !endDateTime) {
    return 'Time not specified';
  }

  try {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    const startTime = start.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    const endTime = end.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    return `${startTime} - ${endTime}`;
  } catch {
    return 'Invalid time range';
  }
}

/**
 * Get emoji for shift status
 */
function getStatusEmoji(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'open': return '🔓';
    case 'assigned': return '👤';
    case 'approved': return '✅';
    case 'forsale': return '💱';
    case 'draft': return '📝';
    case 'onduty': return '🕐';
    case 'pendingswapacceptance': return '🔄';
    case 'pendingapproval': return '⏳';
    default: return '❓';
  }
}

/**
 * Get emoji for lock status
 */
function getLockStatusEmoji(lockState: string): string {
  switch (lockState.toLowerCase()) {
    case 'unlocked': return '🔓';
    case 'locked': return '🔒';
    case 'published': return '📋';
    default: return '❓';
  }
}

/**
 * Format payment type information
 */
function formatPaymentType(shiftType: ShiftType): string {
  if (shiftType.paymentType === 'Percentage' && shiftType.payPercentage) {
    return `${(shiftType.payPercentage * 100).toFixed(0)}% of base rate`;
  } else if (shiftType.paymentType === 'Monetary' && shiftType.payMonetary) {
    return `Fixed amount: ${shiftType.payMonetary}`;
  }
  return 'Standard rate';
}

/**
 * Get shift status summary
 */
function getShiftStatusSummary(shifts: Shift[]): Record<string, number> {
  const summary: Record<string, number> = {};
  shifts.forEach(shift => {
    const status = shift.status || 'Unknown';
    summary[status] = (summary[status] || 0) + 1;
  });
  return summary;
}

/**
 * Calculate total hours from duration strings
 */
function calculateTotalHours(costs: ShiftCost[]): number {
  return costs.reduce((total, cost) => total + parseDuration(cost.duration), 0);
}

/**
 * Parse duration string (HH:MM:SS) to hours
 */
function parseDuration(duration: string): number {
  try {
    const [hours, minutes, seconds] = duration.split(':').map(Number);
    return hours + minutes / 60 + (seconds || 0) / 3600;
  } catch {
    return 0;
  }
} 