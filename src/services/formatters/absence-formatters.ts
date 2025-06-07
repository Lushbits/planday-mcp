// src/services/formatters/absence-formatters.ts
// Absence Domain Formatters - Leave & Absence record data formatting

import type { AbsenceRecord } from '../api/absence-api.ts';

/**
 * Format absence records with detailed breakdown and status indicators
 * Includes employee name resolution and cost analysis where available
 */
export function formatAbsenceRecords(
  absenceRecords: AbsenceRecord[],
  employeeMap: Map<number, string>,
  filters?: string
): string {
  if (!absenceRecords || absenceRecords.length === 0) {
    return filters 
      ? `No absence records found with filters: ${filters}`
      : 'No absence records found';
  }

  let result = filters 
    ? `🏖️ Absence Records with filters (${absenceRecords.length} found):\n${filters}\n\n`
    : `🏖️ All Absence Records (${absenceRecords.length} found):\n\n`;
  
  absenceRecords.forEach((record, index) => {
    // Resolve employee ID to human-readable name
    const employeeName = employeeMap.get(record.employeeId) || `Employee ID: ${record.employeeId}`;
    
    // Format date ranges for clarity
    const startDate = new Date(record.absencePeriod.start).toLocaleDateString();
    const endDate = new Date(record.absencePeriod.end).toLocaleDateString();
    
    // Status emoji mapping for visual clarity
    const statusEmoji = {
      'Pending': '⏳',
      'Approved': '✅', 
      'Declined': '❌',
      'Cancelled': '🚫'
    }[record.status] || '❓';

    // Build structured output with employee and absence details
    result += `${index + 1}. ${employeeName}\n`;
    result += `   🆔 Record ID: ${record.id}\n`;
    result += `   ${statusEmoji} Status: ${record.status}\n`;
    result += `   📅 Period: ${startDate} - ${endDate}\n`;
    
    if (record.note) {
      result += `   📝 Note: ${record.note}\n`;
    }
    
    // Show detailed registration breakdown if available
    if (record.registrations && record.registrations.length > 0) {
      result += `   📋 Registrations (${record.registrations.length}):\n`;
      record.registrations.forEach((reg, regIndex) => {
        const regDate = new Date(reg.date).toLocaleDateString();
        result += `      ${regIndex + 1}. ${regDate} (${reg.time.start} - ${reg.time.end})\n`;
        
        // Include cost information if available
        if (reg.account.costs && reg.account.costs.length > 0) {
          const cost = reg.account.costs[0];
          result += `         💰 Cost: ${cost.value} ${cost.unit.type}\n`;
        }
      });
    }
    
    result += '\n';
  });

  return result;
} 