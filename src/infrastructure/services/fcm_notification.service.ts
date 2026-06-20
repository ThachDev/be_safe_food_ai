import { injectable, inject } from 'tsyringe';
import admin from '../external/firebase';
import { IUserRepository } from '../../domain/repositories/i_user.repository';

@injectable()
export class FcmNotificationService {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  async sendPushNotification(
    userId: number,
    fcmToken: string,
    title: string,
    body: string,
    dataPayload?: Record<string, string>
  ): Promise<boolean> {
    if (!admin || !admin.apps.length) {
      console.warn('[FcmNotificationService] Firebase Admin is not initialized.');
      return false;
    }

    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: dataPayload || {},
        token: fcmToken,
      };

      const response = await admin.messaging().send(message);
      console.log(`[FcmNotificationService] Push sent to user ${userId} successfully:`, response);
      return true;
    } catch (error: any) {
      console.error(`[FcmNotificationService] Failed to send push to user ${userId}:`, error);

      if (
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-argument' ||
        (error.message && error.message.includes('not-registered'))
      ) {
        console.log(`[FcmNotificationService] Cleaning up inactive token for user ${userId}`);
        try {
          await this.userRepository.update(userId, { fcmToken: null });
        } catch (dbError) {
          console.error('[FcmNotificationService] Failed to clear invalid token from DB:', dbError);
        }
      }
      return false;
    }
  }
}
