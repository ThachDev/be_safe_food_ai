import { ScanHistory } from '../entities/scan/scan_history.entity';

export interface IScanRepository {
  findByIdAndUserId(id: number, userId: number): Promise<ScanHistory | null>;
  create(scan: Omit<ScanHistory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScanHistory>;
  findAllByUserId(userId: number): Promise<ScanHistory[]>;
  delete(id: number, userId: number): Promise<boolean>;
  findByTitleTokens(tokens: string[]): Promise<ScanHistory[]>;
}
