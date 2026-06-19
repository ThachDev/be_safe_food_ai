import { injectable, inject } from 'tsyringe';
import { INewsProviderService } from '../../interfaces/news/i_news_provider.service';

@injectable()
export class GetNewsWarningsUseCase {
  constructor(@inject('INewsProviderService') private newsProvider: INewsProviderService) {}

  async execute() {
    return await this.newsProvider.getNewsWarnings();
  }
}
