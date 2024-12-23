import express from 'express';
import { register, login, forgotPasswordHandler, resetPasswordHandler } from '../controllers/authController';
import { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } from '../middlewares/validation';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPasswordHandler);
router.post('/reset-password', validateResetPassword, resetPasswordHandler);

export default router;

