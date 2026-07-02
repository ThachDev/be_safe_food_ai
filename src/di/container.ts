import { D1UserRepository } from '../infrastructure/repositories/d1_user.repository';
import { D1ScanRepository } from '../infrastructure/repositories/d1_scan.repository';
import { D1ChatRepository } from '../infrastructure/repositories/d1_chat.repository';

import { FirebaseIdentityProviderService } from '../infrastructure/services/firebase_identity_provider.service';
import { AuthMailService } from '../infrastructure/services/auth_mail.service';
import { CloudflareGenerativeAiService } from '../infrastructure/services/cloudflare_generative_ai.service';
import { R2StorageService } from '../infrastructure/services/r2_storage.service';
import { GoogleNewsProviderService } from '../infrastructure/services/google_news_provider.service';
import { FcmNotificationService } from '../infrastructure/services/fcm_notification.service';

// Use Cases
import { SyncUserUseCase } from '../application/use_cases/auth/sync_user.use_case';
import { RegisterPendingUseCase } from '../application/use_cases/auth/register_pending.use_case';
import { VerifyOtpAndRegisterUseCase } from '../application/use_cases/auth/verify_otp_and_register.use_case';
import { ForgotPasswordPendingUseCase } from '../application/use_cases/auth/forgot_password_pending.use_case';
import { VerifyOtpForgotUseCase } from '../application/use_cases/auth/verify_otp_forgot.use_case';
import { ResetPasswordUseCase } from '../application/use_cases/auth/reset_password.use_case';
import { GetUsersUseCase, GetUserByIdUseCase, CreateUserUseCase, UpdateUserUseCase } from '../application/use_cases/user/user_management.use_cases';
import { AnalyzeScanUseCase } from '../application/use_cases/scan/analyze_scan.use_case';
import { CreateScanUseCase, GetScansUseCase, DeleteScanUseCase } from '../application/use_cases/scan/scan_management.use_cases';
import { AnalyzeFoodUseCase } from '../application/use_cases/chat/analyze_food.use_case';
import { AnalyzeGeneralUseCase } from '../application/use_cases/chat/analyze_general.use_case';
import { GetChatHistoryUseCase, GetChatSessionsUseCase, DeleteChatSessionUseCase } from '../application/use_cases/chat/chat_management.use_cases';
import { CronSyncNewsUseCase } from '../application/use_cases/news/news_cron_sync.use_case';
import { GetNewsWarningsUseCase } from '../application/use_cases/news/news_management.use_cases';
import { GetProfileOptionsUseCase } from '../application/use_cases/profile/get_profile_options.use_case';

export function getContainer(env: any, requestHost?: string) {
  // Repositories
  const userRepository = new D1UserRepository(env.DB, env.KV);
  const scanRepository = new D1ScanRepository(env.DB);
  const chatRepository = new D1ChatRepository(env.DB);

  // Services
  const identityProvider = new FirebaseIdentityProviderService(env);
  const mailService = new AuthMailService(env);
  const aiService = new CloudflareGenerativeAiService(env);
  const cloudinaryService = new R2StorageService(env.BUCKET, requestHost);
  const newsProvider = new GoogleNewsProviderService();
  const fcmService = new FcmNotificationService(userRepository, env);

  // Use cases
  return {
    syncUserUseCase: new SyncUserUseCase(userRepository),
    registerPendingUseCase: new RegisterPendingUseCase(userRepository, mailService),
    verifyOtpAndRegisterUseCase: new VerifyOtpAndRegisterUseCase(userRepository, identityProvider),
    forgotPasswordPendingUseCase: new ForgotPasswordPendingUseCase(userRepository, mailService),
    verifyOtpForgotUseCase: new VerifyOtpForgotUseCase(userRepository),
    resetPasswordUseCase: new ResetPasswordUseCase(userRepository, identityProvider),

    getUsersUseCase: new GetUsersUseCase(userRepository),
    getUserByIdUseCase: new GetUserByIdUseCase(userRepository),
    createUserUseCase: new CreateUserUseCase(userRepository),
    updateUserUseCase: new UpdateUserUseCase(userRepository),

    analyzeScanUseCase: new AnalyzeScanUseCase(userRepository, aiService, cloudinaryService),
    createScanUseCase: new CreateScanUseCase(userRepository, scanRepository),
    getScansUseCase: new GetScansUseCase(userRepository, scanRepository),
    deleteScanUseCase: new DeleteScanUseCase(userRepository, scanRepository),

    analyzeFoodUseCase: new AnalyzeFoodUseCase(userRepository, chatRepository, scanRepository, aiService),
    analyzeGeneralUseCase: new AnalyzeGeneralUseCase(aiService),
    getChatHistoryUseCase: new GetChatHistoryUseCase(userRepository, chatRepository),
    getChatSessionsUseCase: new GetChatSessionsUseCase(userRepository, chatRepository),
    deleteChatSessionUseCase: new DeleteChatSessionUseCase(userRepository, chatRepository),

    cronSyncNewsUseCase: new CronSyncNewsUseCase(newsProvider, aiService, fcmService, userRepository, scanRepository),
    getNewsWarningsUseCase: new GetNewsWarningsUseCase(newsProvider),
    getProfileOptionsUseCase: new GetProfileOptionsUseCase(),
    
    // Repositories & Services
    userRepository,
    scanRepository,
    chatRepository,
    fcmService
  };
}
