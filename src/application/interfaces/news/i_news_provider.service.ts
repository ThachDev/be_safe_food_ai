export interface INewsProviderService {
  getNewsWarnings(): Promise<any[]>;
  getNewsArticle(url: string): Promise<any>;
}
