import 'reflect-metadata';
import { container } from 'tsyringe';

import { SequelizeUserRepository } from '../infrastructure/repositories/sequelize_user.repository';
import { FirebaseIdentityProviderService } from '../infrastructure/services/firebase_identity_provider.service';
import { AuthMailService } from '../infrastructure/services/auth_mail.service';
import { SequelizeChatRepository } from '../infrastructure/repositories/sequelize_chat.repository';
import { SequelizeScanRepository } from '../infrastructure/repositories/sequelize_scan.repository';
import { GroqGenerativeAiService } from '../infrastructure/services/groq_generative_ai.service';
import { CloudinaryWrapperService } from '../infrastructure/services/cloudinary_wrapper.service';
import { GoogleNewsProviderService } from '../infrastructure/services/google_news_provider.service';

// Register implementations for interfaces
container.register('IUserRepository', { useClass: SequelizeUserRepository });
container.register('IIdentityProviderService', { useClass: FirebaseIdentityProviderService });
container.register('IMailService', { useClass: AuthMailService });

container.register('IChatRepository', { useClass: SequelizeChatRepository });
container.register('IScanRepository', { useClass: SequelizeScanRepository });
container.register('IGenerativeAiService', { useClass: GroqGenerativeAiService });
container.register('ICloudinaryService', { useClass: CloudinaryWrapperService });
container.register('INewsProviderService', { useClass: GoogleNewsProviderService });

export { container };
