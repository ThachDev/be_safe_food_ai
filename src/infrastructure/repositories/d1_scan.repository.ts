import { IScanRepository } from '../../domain/repositories/i_scan.repository';
import { ScanHistory } from '../../domain/entities/scan/scan_history.entity';

export class D1ScanRepository implements IScanRepository {
  constructor(private db: any) {}

  private mapToEntity(row: any): ScanHistory {
    return new ScanHistory(
      row.id,
      row.user_id,
      row.title,
      row.category,
      row.rating,
      row.score_text,
      row.safe_level,
      row.personal_warnings ? JSON.parse(row.personal_warnings) : [],
      row.healthy_alternatives ? JSON.parse(row.healthy_alternatives) : [],
      row.ai_result,
      row.scan_type,
      row.image_url,
      row.created_at ? new Date(row.created_at) : undefined,
      row.updated_at ? new Date(row.updated_at) : undefined
    );
  }

  async findByIdAndUserId(id: number, userId: number): Promise<ScanHistory | null> {
    const row = await this.db
      .prepare('SELECT * FROM scan_histories WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first();
    if (!row) return null;
    return this.mapToEntity(row);
  }

  async create(scan: Omit<ScanHistory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScanHistory> {
    const result = await this.db
      .prepare(
        `INSERT INTO scan_histories (
          user_id, scan_type, title, category, image_url, rating, 
          score_text, safe_level, ai_result, personal_warnings, 
          healthy_alternatives
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        scan.userId,
        scan.scanType,
        scan.title,
        scan.category,
        scan.imageUrl || null,
        scan.rating,
        scan.scoreText,
        scan.safeLevel,
        scan.aiResult,
        JSON.stringify(scan.personalWarnings || []),
        JSON.stringify(scan.healthyAlternatives || [])
      )
      .run();

    const lastId = result.meta.last_row_id || 1;
    return new ScanHistory(
      lastId,
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
      new Date(),
      new Date()
    );
  }

  async findAllByUserId(userId: number): Promise<ScanHistory[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM scan_histories WHERE user_id = ? ORDER BY created_at DESC')
      .bind(userId)
      .all();
    return (results || []).map((row: any) => this.mapToEntity(row));
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM scan_histories WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run();
    return (result.meta.changes || 0) > 0;
  }

  async findByTitleTokens(tokens: string[]): Promise<ScanHistory[]> {
    if (tokens.length === 0) return [];
    const clauses = tokens.map(() => 'title LIKE ?').join(' OR ');
    const query = `SELECT * FROM scan_histories WHERE ${clauses}`;
    const bindings = tokens.map(t => `%${t}%`);
    const { results } = await this.db.prepare(query).bind(...bindings).all();
    return (results || []).map((row: any) => this.mapToEntity(row));
  }
}
