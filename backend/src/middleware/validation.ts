import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';

const passwordSchema = Joi.string()
  .min(8)
  .max(100)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 100 characters'
  });

const validateRequest = (schema: Joi.ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validateAsync(req.body, { abortEarly: false });
      next();
    } catch (error) {
      const details = error.details.map((err: any) => ({
        field: err.path[0],
        message: err.message
      }));
      throw new ValidationError('Validation failed', details);
    }
  };
};

export const validateRegister = validateRequest(Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: passwordSchema,
  name: Joi.string().min(2).max(50).trim().required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' })
}));

export const validateLogin = validateRequest(Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
  deviceId: Joi.string().optional()
}));

export const validateForgotPassword = validateRequest(Joi.object({
  email: Joi.string().email().lowercase().trim().required()
}));

export const validateResetPassword = validateRequest(Joi.object({
  token: Joi.string().required(),
  newPassword: passwordSchema,
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'Passwords do not match' })
}));

// Add rate limiting middleware
export const rateLimiter = (requests: number, timeWindow: number) => {
  const requestMap = new Map();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (requestMap.has(ip)) {
      const windowStart = requestMap.get(ip).windowStart;
      const requestCount = requestMap.get(ip).requestCount;
      
      if (now - windowStart > timeWindow) {
        requestMap.set(ip, { windowStart: now, requestCount: 1 });
        next();
      } else if (requestCount >= requests) {
        res.status(429).json({ message: 'Too many requests, please try again later' });
      } else {
        requestMap.set(ip, { 
          windowStart, 
          requestCount: requestCount + 1 
        });
        next();
      }
    } else {
      requestMap.set(ip, { windowStart: now, requestCount: 1 });
      next();
    }
  };
};

