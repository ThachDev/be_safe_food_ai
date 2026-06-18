import { injectable } from 'tsyringe';
import { IScanRepository } from '../../domain/repositories/i_scan.repository';
import { ScanHistory } from '../../domain/entities/scan_history.entity';

const SequelizeScanHistory = require('../../models/scan_history.model');

@injectable()
export class SequelizeScanRepository implements IScanRepository {
  async findByIdAndUserId(id: number, userId: number): Promise<ScanHistory | null> {
    const scan = await SequelizeScanHistory.findOne({ where: { id, userId } });
    if (!scan) return null;
    return this.mapToEntity(scan);
  }

  async create(scan: Omit<ScanHistory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScanHistory> {
    const created = await SequelizeScanHistory.create({
      userId: scan.userId,
      scanType: scan.scanType,
      title: scan.title,
      category: scan.category,
      imageUrl: scan.imageUrl,
      rating: scan.rating,
      scoreText: scan.scoreText,
      safeLevel: scan.safeLevel,
      aiResult: scan.aiResult,
      personalWarnings: scan.personalWarnings,
      healthyAlternatives: scan.healthyAlternatives
    });
    return this.mapToEntity(created);
  }

  async findAllByUserId(userId: number): Promise<ScanHistory[]> {
    const scans = await SequelizeScanHistory.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    return scans.map((s: any) => this.mapToEntity(s));
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const deletedCount = await SequelizeScanHistory.destroy({
      where: { id, userId }
    });
    return deletedCount > 0;
  }

  private mapToEntity(scan: any): ScanHistory {
    return new ScanHistory(
      scan.id,
      scan.userId,
      scan.title,
      scan.category,
      scan.rating,
      scan.scoreText,
      scan.safeLevel,
      scan.personalWarnings || [],
      scan.healthyAlternatives || [],
      scan.aiResult,
      scan.scanType,
      scan.imageUrl,
      scan.createdAt,
      scan.updatedAt
    );
  }
}
