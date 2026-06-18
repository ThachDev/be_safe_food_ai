import { injectable, inject } from 'tsyringe';
import { INewsProviderService } from '../../interfaces/news/i_news_provider.service';

@injectable()
export class GetNewsWarningsUseCase {
  constructor(@inject('INewsProviderService') private newsProvider: INewsProviderService) {}
  
  async execute() {
    return await this.newsProvider.getNewsWarnings();
  }
}

@injectable()
export class ExtractArticleUseCase {
  constructor(@inject('INewsProviderService') private newsProvider: INewsProviderService) {}
  
  async execute(url: string) {
    if (!url) throw new Error('Missing URL parameter');
    return await this.newsProvider.getNewsArticle(url);
  }
}
