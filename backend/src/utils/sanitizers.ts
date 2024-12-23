import validator from 'validator';
import { SanitizationError } from './errors';

export interface SanitizedUserData {
  email: string;
  name: string;
}

export function sanitizeEmail(email: string): string {
  if (!email) throw new SanitizationError('Email is required');
  
  const sanitized = validator.normalizeEmail(email.toLowerCase().trim());
  if (!sanitized) throw new SanitizationError('Invalid email format');
  
  return sanitized;
}

export function sanitizeName(name: string): string {
  if (!name) throw new SanitizationError('Name is required');
  
  // Remove any HTML/script tags
  let sanitized = validator.escape(name);
  
  // Remove extra spaces and normalize whitespace
  sanitized = validator.trim(sanitized.replace(/\s+/g, ' '));
  
  // Check length after sanitization
  if (sanitized.length < 2 || sanitized.length > 50) {
    throw new SanitizationError('Name must be between 2 and 50 characters');
  }
  
  return sanitized;
}

export function sanitizeUserData(data: Partial<SanitizedUserData>): SanitizedUserData {
  return {
    email: data.email ? sanitizeEmail(data.email) : '',
    name: data.name ? sanitizeName(data.name) : ''
  };
}

export function sanitizeDeviceId(deviceId: string): string {
  if (!deviceId) return '';
  return validator.trim(validator.escape(deviceId));
}

export function sanitizePassword(password: string): string {
  if (!password) throw new SanitizationError('Password is required');
  
  // Remove leading/trailing whitespace
  const sanitized = validator.trim(password);
  
  // Check if the password meets the minimum requirements
  if (
    sanitized.length < 8 ||
    sanitized.length > 100 ||
    !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(sanitized)
  ) {
    throw new SanitizationError('Password does not meet security requirements');
  }
  
  return sanitized;
}

export function sanitizeToken(token: string): string {
  if (!token) throw new SanitizationError('Token is required');
  
  // Remove any non-alphanumeric characters
  const sanitized = token.replace(/[^a-zA-Z0-9]/g, '');
  
  if (sanitized.length !== token.length) {
    throw new SanitizationError('Invalid token format');
  }
  
  return sanitized;
}

