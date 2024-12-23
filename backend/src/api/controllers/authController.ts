import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, forgotPassword, resetPassword } from '../../services/authService';
import { ValidationError, AuthenticationError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';
import rateLimit from 'express-rate-limit';

// Rate limiting
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;
    const user = await registerUser(email, password, name);
    logger.info(`User registered successfully: ${user._id}`);
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    if (error.code === 11000) { // MongoDB duplicate key error
      next(new ValidationError('Email already in use'));
    } else {
      next(error);
    }
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser(email, password);
    logger.info(`User logged in: ${user._id}`);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(new AuthenticationError('Invalid email or password'));
  }
};

export const forgotPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await forgotPassword(email);
    logger.info(`Password reset requested for: ${email}`);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    if (error instanceof NotFoundError) {
      // Don't reveal whether the email exists or not
      res.json({ message: 'If the email exists, a password reset link will be sent' });
    } else {
      next(error);
    }
  }
};

export const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    await resetPassword(token, newPassword);
    logger.info(`Password reset successful for token: ${token}`);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    next(new ValidationError('Invalid or expired reset token'));
  }
};

