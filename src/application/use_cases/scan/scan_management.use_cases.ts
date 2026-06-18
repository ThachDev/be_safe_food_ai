import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/i_user.repository';
import { IScanRepository } from '../../../domain/repositories/i_scan.repository';
import { ScanHistory } from '../../../domain/entities/scan/scan_history.entity';
import { UserNotFoundError } from '../../../domain/errors/auth.error';

@injectable()
export class CreateScanUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IScanRepository') private scanRepository: IScanRepository
  ) {}

  async execute(firebaseUid: string, data: any) {
    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    if (!user) throw new UserNotFoundError();

    const { scanType, title, category, imageUrl, rating, scoreText, safeLevel, aiResult, personalWarnings, healthyAlternatives } = data;

    if (!scanType || !title || !category || !rating || !scoreText || !safeLevel || !aiResult) {
      throw new Error('Missing required fields for scan history');
    }

    return await this.scanRepository.create({
      userId: user.id,
      scanType,
      title,
      category,
      imageUrl: imageUrl || null,
      rating,
      scoreText,
      safeLevel,
      aiResult,
      personalWarnings: personalWarnings || [],
      healthyAlternatives: healthyAlternatives || []
    });
  }
}

@injectable()
export class GetScansUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IScanRepository') private scanRepository: IScanRepository
  ) {}

  async execute(firebaseUid: string) {
    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    if (!user) throw new UserNotFoundError();

    return await this.scanRepository.findAllByUserId(user.id);
  }
}

@injectable()
export class DeleteScanUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IScanRepository') private scanRepository: IScanRepository
  ) {}

  async execute(firebaseUid: string, id: number) {
    if (!id) throw new Error('Scan ID is required');

    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    if (!user) throw new UserNotFoundError();

    const success = await this.scanRepository.delete(id, user.id);
    if (!success) {
      throw new Error('SCAN_NOT_FOUND');
    }
  }
}
