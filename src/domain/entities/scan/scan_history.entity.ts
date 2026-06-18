export class ScanHistory {
  constructor(
    public id: number,
    public userId: number,
    public title: string,
    public category: string,
    public rating: string,
    public scoreText: string,
    public safeLevel: string,
    public personalWarnings: string[],
    public healthyAlternatives: string[],
    public aiResult: string,
    public scanType?: string,
    public imageUrl?: string,
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}
}
