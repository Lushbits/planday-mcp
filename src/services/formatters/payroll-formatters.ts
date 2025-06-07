// src/services/formatters/payroll-formatters.ts
// Payroll Domain Formatters - Payroll & Cost Analysis data formatting

import { PayrollData, calculatePayrollTotals, groupPayrollByEmployee, groupPayrollByDepartment } from "../api/payroll-api";

/**
 * Format comprehensive payroll summary with department breakdown
 * Provides executive-level overview of labor costs and distribution
 */
export function formatPayrollSummary(
  payrollData: PayrollData,
  employeeNames: Map<number, string>,
  departmentNames: Map<number, string>,
  startDate: string,
  endDate: string
): string {
  // Calculate totals using the payroll API utility
  const totals = calculatePayrollTotals(payrollData);
  const currency = payrollData.currencySymbol || '$';
  
  // Calculate unique employee count across all payroll types
  const uniqueEmployees = new Set([
    ...(payrollData.shiftsPayroll?.map(s => s.employeeId) || []),
    ...(payrollData.supplementsPayroll?.map(s => s.employeeId) || []),
    ...(payrollData.salariedPayroll?.map(s => s.employeeId) || [])
  ]).size;

  // Calculate period metrics
  const dayCount = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));

  let result = `💰 Payroll Summary (${startDate} to ${endDate})\n\n`;
  result += `📊 **Total Labor Cost**: ${currency}${totals.totalCost.toFixed(2)}\n`;
  result += `👥 **Employees Paid**: ${uniqueEmployees}\n`;
  result += `📅 **Period**: ${dayCount} days\n`;
  result += `⏰ **Daily Average**: ${currency}${(totals.totalCost / dayCount).toFixed(2)}\n\n`;

  // Detailed breakdown by payroll type
  result += `💼 **Cost Breakdown**:\n`;
  result += `• **Shift Wages**: ${currency}${totals.shiftsCost.toFixed(2)} (${payrollData.shiftsPayroll?.length || 0} shifts)\n`;
  result += `• **Supplements**: ${currency}${totals.supplementsCost.toFixed(2)} (${payrollData.supplementsPayroll?.length || 0} items)\n`;
  result += `• **Salaries**: ${currency}${totals.salariedCost.toFixed(2)} (${payrollData.salariedPayroll?.length || 0} items)\n\n`;

  // Employee-level breakdown (top contributors)
  const employeeGroups = groupPayrollByEmployee(payrollData);
  if (employeeGroups.length > 0) {
    result += `👤 **Top Cost Contributors**:\n`;
    employeeGroups
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5) // Show top 5
      .forEach((emp, index) => {
        const employeeName = employeeNames.get(emp.employeeId) || `Employee ${emp.employeeId}`;
        const percentage = totals.totalCost > 0 ? ((emp.totalCost / totals.totalCost) * 100).toFixed(1) : '0.0';
        result += `${index + 1}. **${employeeName}**: ${currency}${emp.totalCost.toFixed(2)} (${percentage}%)\n`;
      });
  }

  return result;
}

/**
 * Format detailed payroll breakdown with individual shift and employee analysis
 * Provides granular view for payroll processing and verification
 */
export function formatShiftPayrollDetails(
  payrollData: PayrollData,
  employeeNames: Map<number, string>,
  departmentNames: Map<number, string>,
  startDate: string,
  endDate: string
): string {
  const totals = calculatePayrollTotals(payrollData);
  const currency = payrollData.currencySymbol || '$';

  let result = `💰 Detailed Payroll Breakdown (${startDate} to ${endDate})\n\n`;
  result += `📊 **Total Cost**: ${currency}${totals.totalCost.toFixed(2)}\n\n`;

  // Format shifts payroll with detailed breakdown
  if (payrollData.shiftsPayroll && payrollData.shiftsPayroll.length > 0) {
    result += `⏰ **Shift Wages** (${payrollData.shiftsPayroll.length} shifts):\n`;
    
    payrollData.shiftsPayroll.forEach((shift, index) => {
      const employeeName = employeeNames.get(shift.employeeId) || `Employee ${shift.employeeId}`;
      const departmentName = shift.departmentId ? 
        departmentNames.get(shift.departmentId) || `Dept ${shift.departmentId}` : 
        'Unknown Dept';
      
      result += `${index + 1}. **${employeeName}** (${departmentName})\n`;
      result += `   📅 Date: ${shift.date}\n`;
      result += `   ⏰ ${shift.startTime} - ${shift.endTime}\n`;
      result += `   💰 Pay: ${currency}${(shift.salary || 0).toFixed(2)}\n`;
      if (shift.shiftTypeId) {
        result += `   🏷️ Shift Type ID: ${shift.shiftTypeId}\n`;
      }
      result += '\n';
    });
  }

  // Format supplements payroll
  if (payrollData.supplementsPayroll && payrollData.supplementsPayroll.length > 0) {
    result += `➕ **Supplements** (${payrollData.supplementsPayroll.length} items):\n`;
    
    payrollData.supplementsPayroll.forEach((supplement, index) => {
      const employeeName = employeeNames.get(supplement.employeeId) || `Employee ${supplement.employeeId}`;
      
      result += `${index + 1}. **${employeeName}**\n`;
      result += `   📅 Date: ${supplement.date}\n`;
      result += `   💰 Amount: ${currency}${(supplement.salary || 0).toFixed(2)}\n`;
      if (supplement.note) {
        result += `   📝 Note: ${supplement.note}\n`;
      }
      result += '\n';
    });
  }

  // Format salaried payroll
  if (payrollData.salariedPayroll && payrollData.salariedPayroll.length > 0) {
    result += `💼 **Salaries** (${payrollData.salariedPayroll.length} items):\n`;
    
    payrollData.salariedPayroll.forEach((salary, index) => {
      const employeeName = employeeNames.get(salary.employeeId) || `Employee ${salary.employeeId}`;
      
      result += `${index + 1}. **${employeeName}**\n`;
      result += `   📅 Period: ${salary.startDate} - ${salary.endDate}\n`;
      result += `   💰 Amount: ${currency}${(salary.salary || 0).toFixed(2)}\n`;
      result += '\n';
    });
  }

  // Department cost summary at the end
  const departmentGroups = groupPayrollByDepartment(payrollData);
  if (departmentGroups.length > 0) {
    result += `🏢 **Department Cost Summary**:\n`;
    departmentGroups
      .sort((a, b) => b.totalCost - a.totalCost)
      .forEach((dept, index) => {
        const deptName = departmentNames.get(dept.departmentId) || `Department ${dept.departmentId}`;
        const percentage = totals.totalCost > 0 ? ((dept.totalCost / totals.totalCost) * 100).toFixed(1) : '0.0';
        result += `${index + 1}. **${deptName}**: ${currency}${dept.totalCost.toFixed(2)} (${percentage}%)\n`;
      });
  }

  return result;
} 