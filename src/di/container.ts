import 'reflect-metadata';
import { container } from 'tsyringe';

import { SequelizeUserRepository } from '../infrastructure/repositories/sequelize_user.repository';
import { FirebaseIdentityProviderService } from '../infrastructure/services/firebase_identity_provider.service';
import { AuthMailService } from '../infrastructure/services/auth_mail.service';

// Register implementations for interfaces
container.register('IUserRepository', { useClass: SequelizeUserRepository });
container.register('IIdentityProviderService', { useClass: FirebaseIdentityProviderService });
container.register('IMailService', { useClass: AuthMailService });

export { container };
