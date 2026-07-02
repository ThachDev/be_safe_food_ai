
import { INewsProviderService } from '../../interfaces/news/i_news_provider.service';


export class GetNewsWarningsUseCase {
  constructor(private newsProvider: INewsProviderService) {}

  async execute() {
    return await this.newsProvider.getNewsWarnings();
  }
}
