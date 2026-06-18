import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { SyncUserUseCase } from '../../../application/use_cases/auth/sync_user.use_case';
import { RegisterPendingUseCase } from '../../../application/use_cases/auth/register_pending.use_case';
import { VerifyOtpAndRegisterUseCase } from '../../../application/use_cases/auth/verify_otp_and_register.use_case';
import { ForgotPasswordPendingUseCase } from '../../../application/use_cases/auth/forgot_password_pending.use_case';
import { VerifyOtpForgotUseCase } from '../../../application/use_cases/auth/verify_otp_forgot.use_case';
import { ResetPasswordUseCase } from '../../../application/use_cases/auth/reset_password.use_case';

import { HttpStatus, ErrorCodes } from '../../../shared/constants';

@injectable()
export class AuthController {
  constructor(
    @inject(SyncUserUseCase) private syncUserUseCase: SyncUserUseCase,
    @inject(RegisterPendingUseCase) private registerPendingUseCase: RegisterPendingUseCase,
    @inject(VerifyOtpAndRegisterUseCase) private verifyOtpAndRegisterUseCase: VerifyOtpAndRegisterUseCase,
    @inject(ForgotPasswordPendingUseCase) private forgotPasswordPendingUseCase: ForgotPasswordPendingUseCase,
    @inject(VerifyOtpForgotUseCase) private verifyOtpForgotUseCase: VerifyOtpForgotUseCase,
    @inject(ResetPasswordUseCase) private resetPasswordUseCase: ResetPasswordUseCase
  ) {}

  sync = async (req: Request, res: Response) => {
    try {
      const firebaseUser = (req as any).user;

      if (!firebaseUser) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          code: ErrorCodes.UNAUTHORIZED,
          message: 'User authentication details are missing from request.'
        });
      }

      const { user, isNew } = await this.syncUserUseCase.execute(
        firebaseUser.uid,
        firebaseUser.email,
        firebaseUser.name,
        firebaseUser.picture
      );

      return res.status(isNew ? HttpStatus.CREATED : HttpStatus.OK).json({
        success: true,
        message: isNew ? 'User registered and synchronized successfully.' : 'User details synchronized successfully.',
        data: user
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: ErrorCodes.DATABASE_ERROR,
        message: 'An error occurred while synchronizing user data with the database.',
        error: error.message
      });
    }
  };

  registerRequest = async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      const result = await this.registerPendingUseCase.execute(name, email, password);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: error.message
      });
    }
  };

  verifyOtp = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      const { user, customToken } = await this.verifyOtpAndRegisterUseCase.execute(email, otp);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Xác thực OTP thành công. Tài khoản đã được khởi tạo.',
        data: {
          token: customToken,
          user: user
        }
      });
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: error.message
      });
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const result = await this.forgotPasswordPendingUseCase.execute(email);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: error.message
      });
    }
  };

  verifyOtpForgot = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      const result = await this.verifyOtpForgotUseCase.execute(email, otp);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: error.message
      });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { email, otp, password } = req.body;
      const result = await this.resetPasswordUseCase.execute(email, otp, password);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: error.message
      });
    }
  };
}
