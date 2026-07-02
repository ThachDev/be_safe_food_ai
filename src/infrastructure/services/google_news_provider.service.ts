import { INewsProviderService } from '../../application/interfaces/news/i_news_provider.service';

// Vietnamese news RSS sources - reliable, no bot blocking
const NEWS_SOURCES = [
  {
    name: 'VnExpress',
    url: 'https://vnexpress.net/rss/suc-khoe.rss',
  },
  {
    name: 'Tuổi Trẻ',
    url: 'https://tuoitre.vn/rss/suc-khoe.rss',
  },
];

// Keywords for food safety filtering
const FOOD_KEYWORDS = [
  'thực phẩm', 'thuc pham', 'ngộ độc', 'ngo doc',
  'ô nhiễm', 'độc hại', 'hóa chất', 'hoa chat',
  'giả mạo', 'gia mao', 'không đạt', 'thu hồi',
  'ăn uống', 'an uong', 'thức ăn', 'thức uống',
  'vệ sinh an toàn', 'kém chất lượng', 'chất bảo quản',
  'phụ gia', 'rau củ', 'hải sản', 'thịt',
];

export class GoogleNewsProviderService implements INewsProviderService {
  private feedCache: { items: any[]; timestamp: number } | null = null;

  private parseRssXml(xml: string, sourceName: string): any[] {
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const get = (tag: string): string => {
        const cdataMatch = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
        if (cdataMatch) return cdataMatch[1].trim();
        const plainMatch = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return plainMatch ? plainMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/<[^>]+>/g, '').trim() : '';
      };
      const title = get('title');
      const link = get('link') || get('guid');
      if (!title) continue;
      items.push({
        title,
        link,
        pubDate: get('pubDate'),
        source: sourceName,
        contentSnippet: get('description').replace(/<[^>]+>/g, '').slice(0, 200),
      });
    }
    return items;
  }

  private isFoodRelated(item: any): boolean {
    const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
    return FOOD_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  }

  private async fetchFeed(url: string, sourceName: string): Promise<any[]> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SafeFoodAI/1.0; +https://safefood.ai)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        // 8s timeout
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        console.warn(`[News] ${sourceName} returned ${res.status}`);
        return [];
      }
      const xml = await res.text();
      return this.parseRssXml(xml, sourceName);
    } catch (err: any) {
      console.warn(`[News] Failed to fetch ${sourceName}:`, err?.message);
      return [];
    }
  }

  async getNewsWarnings(): Promise<any[]> {
    const cacheDuration = 10 * 60 * 1000; // 10 minutes
    if (this.feedCache && (Date.now() - this.feedCache.timestamp < cacheDuration)) {
      return this.feedCache.items;
    }

    // Fetch all sources in parallel
    const results = await Promise.all(
      NEWS_SOURCES.map(s => this.fetchFeed(s.url, s.name))
    );

    const allItems = results.flat();

    // Filter food-related articles
    const foodItems = allItems.filter(i => this.isFoodRelated(i));

    // If no food-related items found, return all health news
    const finalItems = foodItems.length > 0 ? foodItems : allItems;

    const sorted = finalItems
      .filter(i => i.pubDate && i.title)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 15);

    this.feedCache = { items: sorted, timestamp: Date.now() };
    return sorted;
  }
}
