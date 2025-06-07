// src/services/api/index.ts
// Centralized exports for all domain APIs

// HR Domain
export * from './hr-api.ts';

// Scheduling Domain  
export * from './scheduling-api.ts';

// Absence Domain
export * from './absence-api.ts';

// Payroll Domain
export * from './payroll-api.ts';

// Re-export common auth functionality
export { makeAuthenticatedRequest } from '../auth.ts';
