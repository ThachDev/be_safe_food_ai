import { injectable } from 'tsyringe';
import { INewsProviderService } from '../../application/interfaces/news/i_news_provider.service';
import Parser from 'rss-parser';
import { GoogleDecoder } from 'google-news-url-decoder';

@injectable()
export class GoogleNewsProviderService implements INewsProviderService {
  private parser = new Parser();
  private decoder = new GoogleDecoder();
  
  private decodedUrlCache = new Map<string, string>();
  
  private feedCache: { items: any[]; timestamp: number } | null = null;

  async getNewsWarnings(): Promise<any[]> {
    const cacheDuration = 10 * 60 * 1000; // 10 minutes
    if (this.feedCache && (Date.now() - this.feedCache.timestamp < cacheDuration)) {
      return this.feedCache.items;
    }

    const rssUrl = encodeURI('https://news.google.com/rss/search?q=thực+phẩm+giả+OR+hoá+chất+độc+hại+OR+ngộ+độc+thực+phẩm+when:7d&hl=vi&gl=VN&ceid=VN:vi');
    const feed = await this.parser.parseURL(rssUrl);

    const sortedItems = feed.items.sort((a, b) => new Date(b.pubDate as string).getTime() - new Date(a.pubDate as string).getTime());
    const targetItems = sortedItems.slice(0, 15);

    const mappedItems = await Promise.all(
      targetItems.map(async (item) => {
        const originalLink = item.link || '';
        let finalLink = originalLink;

        if (originalLink.includes('news.google.com')) {
          const cached = this.decodedUrlCache.get(originalLink);
          if (cached) {
            finalLink = cached;
          } else {
            try {
              const decoded = await this.decoder.decode(originalLink);
              if (decoded && decoded.status && decoded.decoded_url) {
                finalLink = decoded.decoded_url;
                this.decodedUrlCache.set(originalLink, finalLink);
              }
            } catch (error) {
              console.error(`[GoogleNewsProviderService] Failed to decode URL ${originalLink}:`, error);
            }
          }
        }

        return {
          title: item.title,
          link: finalLink,
          pubDate: item.pubDate,
          source: (item as any).source || 'Google News',
          contentSnippet: item.contentSnippet || '',
        };
      })
    );

    this.feedCache = {
      items: mappedItems,
      timestamp: Date.now(),
    };

    return mappedItems;
  }
}
