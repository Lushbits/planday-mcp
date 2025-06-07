// src/services/api/index.ts
// Centralized exports for all domain APIs

// HR Domain
export * from './hr-api';

// Scheduling Domain  
export * from './scheduling-api';

// Absence Domain
export * from './absence-api';

// Payroll Domain
export * from './payroll-api';

// Re-export common auth functionality
export { makeAuthenticatedRequest } from '../auth';
