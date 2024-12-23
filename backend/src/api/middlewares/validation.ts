import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };
};

export const validateRegister = validateRequest(Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required(),
}));

export const validateLogin = validateRequest(Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
}));

export const validateForgotPassword = validateRequest(Joi.object({
  email: Joi.string().email().required(),
}));

export const validateResetPassword = validateRequest(Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
}));

