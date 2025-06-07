// src/services/formatters/hr-formatters.ts
// HR Domain Formatters - Employee & Department data formatting

import type { 
  Employee,
  Department,
  EmployeeGroup,
  Skill,
  EmployeeType,
  Supervisor,
  EmployeeHistoryEntry,
  EmployeeFieldDefinitions,
  PaginatedResponse,
  EmployeeQueryParams,
} from '../api/hr-api';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format date for display
 */
function formatDate(dateString?: string): string {
  if (!dateString) return 'Not specified';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Format datetime for display
 */
function formatDateTime(dateTimeString?: string): string {
  if (!dateTimeString) return 'Not specified';
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
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
 * Get employee status emoji and text
 */
function getEmployeeStatus(employee: Employee): { emoji: string; status: string; color: string } {
  if (employee.dateTimeDeleted) {
    return { emoji: '🚫', status: 'Deactivated', color: 'red' };
  }
  
  if (employee.hiredDate || employee.hiredFrom) {
    const hireDate = new Date(employee.hiredDate || employee.hiredFrom || '');
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return { emoji: '🌟', status: 'New Hire', color: 'green' };
    } else if (diffDays < 90) {
      return { emoji: '📈', status: 'Recent Hire', color: 'blue' };
    }
  }
  
  if (employee.isSupervisor) {
    return { emoji: '👑', status: 'Supervisor', color: 'purple' };
  }
  
  return { emoji: '👤', status: 'Active', color: 'green' };
}

/**
 * Get employee type emoji
 */
function getEmployeeTypeEmoji(typeId?: number): string {
  switch (typeId) {
    case 71285: return '🎓'; // Intern
    case 71286: return '⏰'; // Part-time
    case 71287: return '💼'; // Full-time
    default: return '👤';
  }
}

/**
 * Get skill status emoji
 */
function getSkillEmoji(isTimeLimited: boolean): string {
  return isTimeLimited ? '⏳' : '🎯';
}

/**
 * Get operation emoji
 */
function getOperationEmoji(operation: string): string {
  switch (operation.toLowerCase()) {
    case 'create': return '✨';
    case 'update': return '✏️';
    case 'delete': return '🗑️';
    case 'deactivate': return '🚫';
    case 'reactivate': return '🔄';
    case 'assign': return '📋';
    case 'approve': return '✅';
    default: return '🔧';
  }
}

/**
 * Format pagination info
 */
function formatPaginationInfo(paging?: { offset: number; limit: number; total: number }): string {
  if (!paging) return '';
  
  const start = paging.offset + 1;
  const end = Math.min(paging.offset + paging.limit, paging.total);
  
  return `📊 **Showing ${start}-${end} of ${paging.total} total records**`;
}

/**
 * Format array safely
 */
function formatArray(items?: any[], formatter?: (item: any) => string): string {
  if (!items || items.length === 0) return 'None';
  if (formatter) {
    return items.map(formatter).join(', ');
  }
  return items.join(', ');
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// =============================================================================
// EMPLOYEE MANAGEMENT FORMATTERS
// =============================================================================

/**
 * Format employees list with comprehensive details
 */
export function formatEmployees(
  employees: Employee[], 
  paging?: { offset: number; limit: number; total: number },
  queryParams?: any
): string {
  if (!employees || employees.length === 0) {
    return `👥 **No Active Employees Found**\n\n` +
           `🔍 **Search Criteria:** ${queryParams?.searchQuery || 'All employees'}\n` +
           `📅 **Date Range:** ${queryParams?.createdFrom || 'Any'} to ${queryParams?.createdTo || 'Any'}\n\n` +
           `💡 **Tip:** Try adjusting your search criteria or check if employees exist in the system.`;
  }

  const header = `👥 **Active Employees** ${paging ? `(${employees.length} shown)` : ''}\n\n`;
  const paginationInfo = paging ? formatPaginationInfo(paging) + '\n\n' : '';
  
  // Group employees by department for better organization
  const employeesByDept: { [key: string]: Employee[] } = {};
  employees.forEach(emp => {
    const primaryDept = emp.primaryDepartmentId?.toString() || 'No Department';
    if (!employeesByDept[primaryDept]) {
      employeesByDept[primaryDept] = [];
    }
    employeesByDept[primaryDept].push(emp);
  });

  let content = '';
  Object.keys(employeesByDept).forEach(deptId => {
    const deptEmployees = employeesByDept[deptId];
    content += `🏢 **Department ${deptId}** (${deptEmployees.length} employees)\n`;
    
    deptEmployees.forEach(employee => {
      const status = getEmployeeStatus(employee);
      const typeEmoji = getEmployeeTypeEmoji(employee.employeeTypeId);
      
      content += `  ${status.emoji} **${employee.firstName} ${employee.lastName}**\n`;
      content += `     📧 ${employee.email || 'No email'} | 📱 ${employee.cellPhone || 'No phone'}\n`;
      content += `     ${typeEmoji} ${employee.jobTitle || 'No title'} | 🆔 ${employee.id}\n`;
      
      if (employee.skillIds && employee.skillIds.length > 0) {
        content += `     🎯 Skills: ${employee.skillIds.length} assigned\n`;
      }
      
      if (employee.supervisorEmployeeId) {
        content += `     👤 Reports to: Employee ${employee.supervisorEmployeeId}\n`;
      }
      
      content += `     📅 Hired: ${formatDate(employee.hiredDate || employee.hiredFrom)}\n\n`;
    });
  });

  // Summary statistics
  const stats = {
    total: employees.length,
    supervisors: employees.filter(e => e.isSupervisor).length,
    newHires: employees.filter(e => {
      const hireDate = new Date(e.hiredDate || e.hiredFrom || '');
      const diffDays = (new Date().getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays < 30;
    }).length,
    withSkills: employees.filter(e => e.skillIds && e.skillIds.length > 0).length
  };

  const summary = `📈 **Summary Statistics**\n` +
                 `👥 Total Employees: ${stats.total}\n` +
                 `👑 Supervisors: ${stats.supervisors}\n` +
                 `🌟 New Hires (30 days): ${stats.newHires}\n` +
                 `🎯 With Skills: ${stats.withSkills}\n\n`;

  return header + paginationInfo + content + summary +
         `💡 **Next Steps:** Use \`get-employee-by-id\` for detailed employee information or \`update-employee\` to modify records.`;
}

/**
 * Format deactivated employees with termination details
 */
export function formatDeactivatedEmployees(
  employees: Employee[], 
  paging?: { offset: number; limit: number; total: number },
  queryParams?: any
): string {
  if (!employees || employees.length === 0) {
    return `🚫 **No Deactivated Employees Found**\n\n` +
           `🔍 **Search Criteria:** ${queryParams?.searchQuery || 'All deactivated employees'}\n` +
           `📅 **Deactivation Period:** ${queryParams?.deactivatedFrom || 'Any'} to ${queryParams?.deactivatedTo || 'Any'}\n\n` +
           `💡 **Note:** Deactivated employees may have been purged or no employees match the criteria.`;
  }

  const header = `🚫 **Deactivated Employees** ${paging ? `(${employees.length} shown)` : ''}\n\n`;
  const paginationInfo = paging ? formatPaginationInfo(paging) + '\n\n' : '';

  let content = '';
  employees.forEach(employee => {
    content += `🚫 **${employee.firstName} ${employee.lastName}**\n`;
    content += `   📧 ${employee.email || 'No email'} | 🆔 ${employee.id}\n`;
    content += `   💼 ${employee.jobTitle || 'No title'}\n`;
    content += `   📅 Hired: ${formatDate(employee.hiredDate || employee.hiredFrom)}\n`;
    content += `   🔚 Deactivated: ${formatDateTime(employee.dateTimeDeleted)}\n`;
    
    if (employee.departments && employee.departments.length > 0) {
      content += `   🏢 Departments: ${employee.departments.join(', ')}\n`;
    }
    
    content += `\n`;
  });

  // Deactivation analysis
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthDeactivations = employees.filter(e => {
    if (!e.dateTimeDeleted) return false;
    const deactivationDate = new Date(e.dateTimeDeleted);
    return deactivationDate.getMonth() === currentMonth && deactivationDate.getFullYear() === currentYear;
  }).length;

  const analysis = `📊 **Deactivation Analysis**\n` +
                  `📋 Total Deactivated: ${employees.length}\n` +
                  `📅 This Month: ${thisMonthDeactivations}\n` +
                  `📈 Average Tenure: ${calculateAverageTenure(employees)} days\n\n`;

  return header + paginationInfo + content + analysis +
         `💡 **Management:** Use \`reactivate-employee\` to restore access or review for rehiring opportunities.`;
}

/**
 * Format detailed employee profile
 */
export function formatEmployeeDetail(employee: Employee): string {
  const status = getEmployeeStatus(employee);
  const typeEmoji = getEmployeeTypeEmoji(employee.employeeTypeId);

  let content = `${status.emoji} **Employee Profile: ${employee.firstName} ${employee.lastName}**\n\n`;
  
  // Basic Information
  content += `👤 **Basic Information**\n`;
  content += `   🆔 Employee ID: ${employee.id}\n`;
  content += `   📧 Email: ${employee.email || 'Not specified'}\n`;
  content += `   📱 Cell Phone: ${employee.cellPhone || 'Not specified'}\n`;
  content += `   📞 Phone: ${employee.phone || 'Not specified'}\n`;
  content += `   🏠 Address: ${formatAddress(employee)}\n`;
  content += `   🌍 Country Codes: ${formatCountryCodes(employee)}\n\n`;

  // Employment Information
  content += `💼 **Employment Details**\n`;
  content += `   ${typeEmoji} Job Title: ${employee.jobTitle || 'Not specified'}\n`;
  content += `   📊 Employee Type: ${formatEmployeeType(employee.employeeTypeId)}\n`;
  content += `   📅 Hire Date: ${formatDate(employee.hiredDate || employee.hiredFrom)}\n`;
  content += `   🏢 Primary Department: ${employee.primaryDepartmentId || 'Not assigned'}\n`;
  content += `   🏢 All Departments: ${formatArray(employee.departments)}\n`;
  content += `   👥 Employee Groups: ${formatArray(employee.employeeGroups)}\n`;
  content += `   💰 Salary ID: ${employee.salaryIdentifier || 'Not specified'}\n\n`;

  // Hierarchy and Skills
  content += `👑 **Hierarchy & Skills**\n`;
  content += `   ${employee.isSupervisor ? '👑' : '👤'} Role: ${employee.isSupervisor ? 'Supervisor' : 'Employee'}\n`;
  content += `   👤 Reports To: ${employee.supervisorEmployeeId ? `Employee ${employee.supervisorEmployeeId}` : 'None'}\n`;
  content += `   🎯 Skills: ${formatArray(employee.skillIds)}\n`;
  content += `   🔐 Security Groups: ${formatArray(employee.securityGroups)}\n\n`;

  // Sensitive Information (if included)
  if (employee.birthDate || employee.ssn || employee.bankAccount) {
    content += `🔒 **Sensitive Information**\n`;
    if (employee.birthDate) {
      content += `   🎂 Birth Date: ${formatDate(employee.birthDate)}\n`;
    }
    if (employee.ssn) {
      content += `   🆔 SSN: ${employee.ssn}\n`;
    }
    if (employee.bankAccount) {
      content += `   🏦 Bank Account: ${employee.bankAccount.registrationNumber || 'N/A'} - ${employee.bankAccount.accountNumber || 'N/A'}\n`;
    }
    content += '\n';
  }

  // System Information
  content += `⚙️ **System Information**\n`;
  content += `   📅 Created: ${formatDateTime(employee.dateTimeCreated)}\n`;
  content += `   ✏️ Modified: ${formatDateTime(employee.dateTimeModified)}\n`;
  content += `   🚫 Deactivated: ${employee.dateTimeDeleted ? formatDateTime(employee.dateTimeDeleted) : 'Active'}\n`;
  content += `   👤 Username: ${employee.userName || 'Not set'}\n\n`;

  // Custom Fields
  const customFields = getCustomFields(employee);
  if (customFields.length > 0) {
    content += `🏷️ **Custom Fields**\n`;
    customFields.forEach(field => {
      content += `   ${field.name}: ${field.value}\n`;
    });
    content += '\n';
  }

  return content + `💡 **Actions:** Use \`update-employee\`, \`deactivate-employee\`, or \`get-employee-history\` for more operations.`;
}

/**
 * Format employee operation results
 */
export function formatEmployeeOperationResult(operation: string, data: any): string {
  const emoji = getOperationEmoji(operation);
  const operationName = operation.charAt(0).toUpperCase() + operation.slice(1);
  
  let content = `${emoji} **Employee ${operationName} Successful**\n\n`;
  
  switch (operation) {
    case 'create':
      content += `👤 **New Employee Created**\n`;
      content += `   🆔 Employee ID: ${data.id}\n`;
      content += `   📛 Name: ${data.firstName} ${data.lastName}\n`;
      content += `   📧 Email: ${data.email || data.userName}\n`;
      content += `   🏢 Department(s): ${formatArray(data.departments)}\n`;
      content += `   💼 Job Title: ${data.jobTitle || 'Not specified'}\n`;
      break;
      
    case 'update':
      content += `✏️ **Employee Updated**\n`;
      content += `   🆔 Employee ID: ${data.id}\n`;
      const updatedFields = Object.keys(data).filter(key => key !== 'id' && data[key] !== undefined);
      content += `   📝 Updated Fields: ${updatedFields.length}\n`;
      content += `   🔄 Changes: ${updatedFields.join(', ')}\n`;
      break;
      
    case 'deactivate':
      content += `🚫 **Employee Deactivated**\n`;
      content += `   🆔 Employee ID: ${data.id}\n`;
      content += `   📅 Effective Date: ${data.date || 'Immediate'}\n`;
      content += `   📝 Reason: ${data.reason || 'Not specified'}\n`;
      content += `   📋 Keep Shifts: ${data.keepShifts ? 'Yes' : 'No'}\n`;
      break;
      
    case 'reactivate':
      content += `🔄 **Employee Reactivated**\n`;
      content += `   🆔 Employee ID: ${data.id}\n`;
      content += `   💬 Comment: ${data.comment || 'No comment provided'}\n`;
      content += `   🏢 Departments: ${formatArray(data.departments) || 'No changes'}\n`;
      break;
  }
  
  content += `\n📅 **Completed:** ${new Date().toLocaleString()}\n\n`;
  content += `💡 **Next Steps:** Employee record is now updated. Consider updating related systems if needed.`;
  
  return content;
}

// =============================================================================
// DEPARTMENT MANAGEMENT FORMATTERS
// =============================================================================

/**
 * Format departments list
 */
export function formatDepartments(
  departments: Department[], 
  paging?: { offset: number; limit: number; total: number }
): string {
  if (!departments || departments.length === 0) {
    return `🏢 **No Departments Found**\n\n` +
           `💡 **Tip:** Create departments to organize your workforce structure. Use \`create-department\` to get started.`;
  }

  const header = `🏢 **Departments** ${paging ? `(${departments.length} shown)` : ''}\n\n`;
  const paginationInfo = paging ? formatPaginationInfo(paging) + '\n\n' : '';

  let content = '';
  departments.forEach(dept => {
    content += `🏢 **${dept.name}**\n`;
    content += `   🆔 ID: ${dept.id}\n`;
    content += `   🔢 Number: ${dept.number || 'Not assigned'}\n\n`;
  });

  const summary = `📊 **Department Summary**\n` +
                 `🏢 Total Departments: ${departments.length}\n` +
                 `🔢 With Numbers: ${departments.filter(d => d.number).length}\n\n`;

  return header + paginationInfo + content + summary +
         `💡 **Management:** Use \`get-department-by-id\` for details or \`create-department\` to add new departments.`;
}

/**
 * Format department operation results
 */
export function formatDepartmentOperationResult(operation: string, data: any): string {
  const emoji = getOperationEmoji(operation);
  const operationName = operation.charAt(0).toUpperCase() + operation.slice(1);
  
  let content = `${emoji} **Department ${operationName} Successful**\n\n`;
  
  switch (operation) {
    case 'create':
      content += `🏢 **New Department Created**\n`;
      content += `   🆔 Department ID: ${data.id}\n`;
      content += `   📛 Name: ${data.name}\n`;
      content += `   🔢 Number: ${data.number || 'Not assigned'}\n`;
      break;
      
    case 'update':
      content += `✏️ **Department Updated**\n`;
      content += `   🆔 Department ID: ${data.id}\n`;
      content += `   📛 Name: ${data.name || 'No change'}\n`;
      content += `   🔢 Number: ${data.number || 'No change'}\n`;
      break;
      
    case 'delete':
      content += `🗑️ **Department Deleted**\n`;
      content += `   🆔 Department ID: ${data.id}\n`;
      content += `   ⚠️ Warning: All employee assignments to this department have been removed\n`;
      break;
  }
  
  content += `\n📅 **Completed:** ${new Date().toLocaleString()}\n\n`;
  content += `💡 **Note:** Update employee assignments if needed using the employee management tools.`;
  
  return content;
}

// =============================================================================
// EMPLOYEE GROUPS FORMATTERS
// =============================================================================

/**
 * Format employee groups list
 */
export function formatEmployeeGroups(
  groups: EmployeeGroup[], 
  paging?: { offset: number; limit: number; total: number }
): string {
  if (!groups || groups.length === 0) {
    return `👥 **No Employee Groups Found**\n\n` +
           `💡 **Tip:** Create employee groups to categorize your workforce. Use \`create-employee-group\` to start organizing.`;
  }

  const header = `👥 **Employee Groups** ${paging ? `(${groups.length} shown)` : ''}\n\n`;
  const paginationInfo = paging ? formatPaginationInfo(paging) + '\n\n' : '';

  let content = '';
  groups.forEach(group => {
    content += `👥 **${group.name}**\n`;
    content += `   🆔 ID: ${group.id}\n\n`;
  });

  const summary = `📊 **Groups Summary**\n` +
                 `👥 Total Groups: ${groups.length}\n\n`;

  return header + paginationInfo + content + summary +
         `💡 **Management:** Use \`get-employee-group-by-id\` for details or assign employees to groups during employee creation/updates.`;
}

/**
 * Format employee group operation results
 */
export function formatGroupOperationResult(operation: string, data: any): string {
  const emoji = getOperationEmoji(operation);
  const operationName = operation.charAt(0).toUpperCase() + operation.slice(1);
  
  let content = `${emoji} **Employee Group ${operationName} Successful**\n\n`;
  
  switch (operation) {
    case 'create':
      content += `👥 **New Employee Group Created**\n`;
      content += `   🆔 Group ID: ${data.id}\n`;
      content += `   📛 Name: ${data.name}\n`;
      break;
      
    case 'update':
      content += `✏️ **Employee Group Updated**\n`;
      content += `   🆔 Group ID: ${data.id}\n`;
      content += `   📛 Name: ${data.name}\n`;
      break;
      
    case 'delete':
      content += `🗑️ **Employee Group Deleted**\n`;
      content += `   🆔 Group ID: ${data.id}\n`;
      content += `   ⚠️ Note: Employees previously assigned to this group remain unchanged\n`;
      break;
  }
  
  content += `\n📅 **Completed:** ${new Date().toLocaleString()}\n\n`;
  content += `💡 **Next Steps:** Assign employees to this group using the employee management tools.`;
  
  return content;
}

// =============================================================================
// SKILLS MANAGEMENT FORMATTERS
// =============================================================================

/**
 * Format skills list with certification tracking
 */
export function formatSkills(skills: Skill[]): string {
  if (!skills || skills.length === 0) {
    return `🎯 **No Skills Found**\n\n` +
           `💡 **Tip:** Define skills to track employee competencies and certifications. Use \`create-skill\` to start building your skills library.`;
  }

  const header = `🎯 **Skills Library** (${skills.length} skills)\n\n`;

  // Group skills by type
  const timeLimitedSkills = skills.filter(s => s.isTimeLimited);
  const permanentSkills = skills.filter(s => !s.isTimeLimited);

  let content = '';
  
  if (timeLimitedSkills.length > 0) {
    content += `⏳ **Time-Limited Skills & Certifications** (${timeLimitedSkills.length})\n`;
    timeLimitedSkills.forEach(skill => {
      content += `   ⏳ **${skill.name}** (ID: ${skill.skillId})\n`;
      content += `      📝 ${truncateText(skill.description || 'No description provided')}\n`;
      content += `      🔄 Requires periodic renewal\n\n`;
    });
  }

  if (permanentSkills.length > 0) {
    content += `🎯 **Permanent Skills** (${permanentSkills.length})\n`;
    permanentSkills.forEach(skill => {
      content += `   🎯 **${skill.name}** (ID: ${skill.skillId})\n`;
      content += `      📝 ${truncateText(skill.description || 'No description provided')}\n`;
      content += `      ✅ No expiration\n\n`;
    });
  }

  const summary = `📊 **Skills Summary**\n` +
                 `🎯 Total Skills: ${skills.length}\n` +
                 `⏳ Time-Limited: ${timeLimitedSkills.length}\n` +
                 `🎯 Permanent: ${permanentSkills.length}\n\n`;

  return header + content + summary +
         `💡 **Management:** Use \`update-skill\` to modify or \`delete-skill\` to remove. Assign skills to employees during creation/updates.`;
}

/**
 * Format skill operation results
 */
export function formatSkillOperationResult(operation: string, data: any): string {
  const emoji = getOperationEmoji(operation);
  const operationName = operation.charAt(0).toUpperCase() + operation.slice(1);
  
  let content = `${emoji} **Skill ${operationName} Successful**\n\n`;
  
  switch (operation) {
    case 'create':
      const createEmoji = getSkillEmoji(data.isTimeLimited);
      content += `${createEmoji} **New Skill Created**\n`;
      content += `   📛 Name: ${data.name}\n`;
      content += `   📝 Description: ${data.description || 'No description provided'}\n`;
      content += `   ⏳ Time Limited: ${data.isTimeLimited ? 'Yes - Requires renewal' : 'No - Permanent skill'}\n`;
      break;
      
    case 'update':
      const updateEmoji = getSkillEmoji(data.isTimeLimited);
      content += `${updateEmoji} **Skill Updated**\n`;
      content += `   🆔 Skill ID: ${data.skillId}\n`;
      content += `   📛 Name: ${data.name || 'No change'}\n`;
      content += `   📝 Description: ${data.description || 'No change'}\n`;
      content += `   ⏳ Time Limited: ${data.isTimeLimited !== undefined ? (data.isTimeLimited ? 'Yes' : 'No') : 'No change'}\n`;
      break;
      
    case 'delete':
      content += `🗑️ **Skill Deleted**\n`;
      content += `   🆔 Skill ID: ${data.skillId}\n`;
      content += `   ⚠️ Note: This skill has been removed from all employee profiles\n`;
      break;
  }
  
  content += `\n📅 **Completed:** ${new Date().toLocaleString()}\n\n`;
  content += `💡 **Impact:** This change affects all employees with this skill assignment.`;
  
  return content;
}

// =============================================================================
// REFERENCE DATA FORMATTERS
// =============================================================================

/**
 * Format employee types list
 */
export function formatEmployeeTypes(
  types: EmployeeType[], 
  paging?: { offset: number; limit: number; total: number }
): string {
  if (!types || types.length === 0) {
    return `📊 **No Employee Types Found**\n\n` +
           `💡 **Note:** Employee types define employment classifications in your organization.`;
  }

  const header = `📊 **Employee Types** ${paging ? `(${types.length} shown)` : ''}\n\n`;
  const paginationInfo = paging ? formatPaginationInfo(paging) + '\n\n' : '';

  let content = '';
  types.forEach(type => {
    const emoji = getEmployeeTypeEmoji(type.id);
    content += `${emoji} **${type.name}** (ID: ${type.id})\n`;
    content += `   📝 ${type.description || 'No description available'}\n\n`;
  });

  return header + paginationInfo + content +
         `💡 **Usage:** Employee types are assigned during employee creation and can be updated later.`;
}

/**
 * Format supervisors list
 */
export function formatSupervisors(
  supervisors: Supervisor[], 
  paging?: { offset: number; limit: number; total: number }
): string {
  if (!supervisors || supervisors.length === 0) {
    return `👑 **No Supervisors Found**\n\n` +
           `💡 **Note:** Supervisors are employees with management permissions. Set \`isSupervisor: true\` when creating/updating employees.`;
  }

  const header = `👑 **Supervisors** ${paging ? `(${supervisors.length} shown)` : ''}\n\n`;
  const paginationInfo = paging ? formatPaginationInfo(paging) + '\n\n' : '';

  let content = '';
  supervisors.forEach(supervisor => {
    content += `👑 **${supervisor.name}**\n`;
    content += `   🆔 Supervisor ID: ${supervisor.id}\n`;
    content += `   👤 Employee ID: ${supervisor.employeeId}\n\n`;
  });

  const summary = `📊 **Supervisor Summary**\n` +
                 `👑 Total Supervisors: ${supervisors.length}\n\n`;

  return header + paginationInfo + content + summary +
         `💡 **Management:** Assign employees to supervisors using the \`supervisorId\` field in employee records.`;
}

// =============================================================================
// HISTORY AND AUDIT FORMATTERS
// =============================================================================

/**
 * Format employee change history
 */
export function formatEmployeeHistory(
  history: EmployeeHistoryEntry[], 
  paging?: { offset: number; limit: number; total: number },
  employeeId?: number
): string {
  if (!history || history.length === 0) {
    return `📜 **No Change History Found**\n\n` +
           `👤 **Employee ID:** ${employeeId || 'Unknown'}\n` +
           `💡 **Note:** No changes have been recorded for this employee or the date range specified.`;
  }

  const header = `📜 **Employee Change History** ${employeeId ? `(Employee ${employeeId})` : ''}\n\n`;
  const paginationInfo = paging ? formatPaginationInfo(paging) + '\n\n' : '';

  let content = '';
  
  // Group changes by date for better readability
  const changesByDate: { [key: string]: EmployeeHistoryEntry[] } = {};
  history.forEach(entry => {
    const dateKey = entry.modificationDateTime.split('T')[0];
    if (!changesByDate[dateKey]) {
      changesByDate[dateKey] = [];
    }
    changesByDate[dateKey].push(entry);
  });

  Object.keys(changesByDate).sort().reverse().forEach(date => {
    const changes = changesByDate[date];
    content += `📅 **${formatDate(date)}** (${changes.length} changes)\n`;
    
    changes.forEach(entry => {
      const operationEmoji = entry.op === 'replace' ? '✏️' : entry.op === 'add' ? '➕' : '➖';
      content += `   ${operationEmoji} **${entry.path}** → ${truncateText(entry.value, 50)}\n`;
      content += `      🕐 ${formatDateTime(entry.modificationDateTime)}\n`;
      content += `      👤 Modified by: User ${entry.modifiedBy} (${entry.modifiedByUserGuid})\n\n`;
    });
  });

  // Change analysis
  const fieldChanges: { [key: string]: number } = {};
  const userChanges: { [key: string]: number } = {};
  
  history.forEach(entry => {
    fieldChanges[entry.path] = (fieldChanges[entry.path] || 0) + 1;
    userChanges[entry.modifiedBy] = (userChanges[entry.modifiedBy] || 0) + 1;
  });

  const mostChangedField = Object.keys(fieldChanges).reduce((a, b) => fieldChanges[a] > fieldChanges[b] ? a : b);
  const mostActiveUser = Object.keys(userChanges).reduce((a, b) => userChanges[a] > userChanges[b] ? a : b);

  const analysis = `📊 **Change Analysis**\n` +
                  `📝 Total Changes: ${history.length}\n` +
                  `🔄 Most Changed Field: ${mostChangedField} (${fieldChanges[mostChangedField]} times)\n` +
                  `👤 Most Active User: ${mostActiveUser} (${userChanges[mostActiveUser]} changes)\n` +
                  `📅 Date Range: ${formatDate(history[history.length - 1]?.modificationDateTime)} to ${formatDate(history[0]?.modificationDateTime)}\n\n`;

  return header + paginationInfo + content + analysis +
         `💡 **Audit Trail:** Complete change history for compliance and review purposes.`;
}

/**
 * Format employee field definitions schema
 */
export function formatFieldDefinitions(schema: EmployeeFieldDefinitions, type: string): string {
  const header = `📋 **Employee Field Definitions** (${type} Schema)\n\n`;
  
  let content = `🏢 **Portal Information**\n`;
  content += `   🆔 Portal ID: ${schema.portalId}\n`;
  content += `   📊 Schema Type: ${type}\n`;
  content += `   🔗 Schema Version: ${schema.$schema}\n\n`;

  // Required fields
  content += `✅ **Required Fields** (${schema.required.length})\n`;
  schema.required.forEach(field => {
    content += `   ✅ ${field}\n`;
  });
  content += '\n';

  // Read-only fields
  if (schema.readOnly && schema.readOnly.length > 0) {
    content += `🔒 **Read-Only Fields** (${schema.readOnly.length})\n`;
    schema.readOnly.forEach(field => {
      content += `   🔒 ${field}\n`;
    });
    content += '\n';
  }

  // Unique fields
  if (schema.unique && schema.unique.length > 0) {
    content += `🔑 **Unique Fields** (${schema.unique.length})\n`;
    schema.unique.forEach(field => {
      content += `   🔑 ${field}\n`;
    });
    content += '\n';
  }

  // Field properties
  const propertyCount = Object.keys(schema.properties).length;
  content += `📝 **Available Fields** (${propertyCount} total)\n`;
  
  // Group fields by type
  const fieldsByType: { [key: string]: string[] } = {
    'Basic Info': ['firstName', 'lastName', 'userName', 'email'],
    'Contact': ['cellPhone', 'phone', 'street1', 'street2', 'city', 'zip'],
    'Employment': ['jobTitle', 'employeeTypeId', 'salaryIdentifier', 'hiredFrom'],
    'Organization': ['departments', 'employeeGroups', 'primaryDepartmentId', 'supervisorId'],
    'Personal': ['birthDate', 'gender', 'ssn'],
    'Financial': ['bankAccount'],
    'Skills': ['skillIds']
  };

  Object.keys(fieldsByType).forEach(category => {
    const fields = fieldsByType[category].filter(field => schema.properties[field]);
    if (fields.length > 0) {
      content += `   📂 **${category}:** ${fields.join(', ')}\n`;
    }
  });

  // Custom fields
  const customFields = Object.keys(schema.properties).filter(key => key.startsWith('custom_'));
  if (customFields.length > 0) {
    content += `   🏷️ **Custom Fields:** ${customFields.length} defined\n`;
  }

  content += '\n';

  return header + content +
         `💡 **Usage:** Use this schema to understand field requirements when creating or updating employees.`;
}

// =============================================================================
// ERROR FORMATTING
// =============================================================================

/**
 * Format API errors consistently
 */
export function formatError(operation: string, error: any): string {
  const errorMessage = error.message || String(error);
  
  return `❌ **Error ${operation}**\n\n` +
         `🚨 **Error Details:**\n` +
         `${errorMessage}\n\n` +
         `🛠️ **Troubleshooting Tips:**\n` +
         `• Check your authentication credentials\n` +
         `• Verify the API parameters are correct\n` +
         `• Ensure you have the required permissions\n` +
         `• Check if the resource exists and is accessible\n\n` +
         `💡 **Need Help?** Review the API documentation or contact support if the issue persists.`;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatAddress(employee: Employee): string {
  const parts = [];
  if (employee.street1) parts.push(employee.street1);
  if (employee.street2) parts.push(employee.street2);
  if (employee.city) parts.push(employee.city);
  if (employee.zip) parts.push(employee.zip);
  return parts.length > 0 ? parts.join(', ') : 'Not specified';
}

function formatCountryCodes(employee: Employee): string {
  const codes = [];
  if (employee.cellPhoneCountryCode) codes.push(`📱 ${employee.cellPhoneCountryCode}`);
  if (employee.phoneCountryCode) codes.push(`📞 ${employee.phoneCountryCode}`);
  return codes.length > 0 ? codes.join(', ') : 'Not specified';
}

function formatEmployeeType(typeId?: number): string {
  switch (typeId) {
    case 71285: return 'Intern';
    case 71286: return 'Part-time';
    case 71287: return 'Full-time';
    default: return typeId ? `Type ${typeId}` : 'Not specified';
  }
}

function getCustomFields(employee: Employee): Array<{ name: string; value: any }> {
  const customFields: Array<{ name: string; value: any }> = [];
  
  Object.keys(employee).forEach(key => {
    if (key.startsWith('custom_')) {
      const fieldData = employee[key];
      if (fieldData && typeof fieldData === 'object' && fieldData.name) {
        customFields.push({
          name: fieldData.name,
          value: fieldData.value
        });
      }
    }
  });
  
  return customFields;
}

function calculateAverageTenure(employees: Employee[]): number {
  if (employees.length === 0) return 0;
  
  const totalDays = employees.reduce((sum, emp) => {
    const hireDate = new Date(emp.hiredDate || emp.hiredFrom || emp.dateTimeCreated || '');
    const endDate = new Date(emp.dateTimeDeleted || new Date());
    const diffTime = endDate.getTime() - hireDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return sum + (diffDays > 0 ? diffDays : 0);
  }, 0);
  
  return Math.round(totalDays / employees.length);
} 