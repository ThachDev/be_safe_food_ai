import { injectable } from 'tsyringe';
import { INewsProviderService } from '../../application/interfaces/news/i_news_provider.service';
import Parser from 'rss-parser';
import axios from 'axios';
// @ts-ignore
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
// @ts-ignore
import { GoogleDecoder } from 'google-news-url-decoder';

@injectable()
export class GoogleNewsProviderService implements INewsProviderService {
  private parser = new Parser();

  async getNewsWarnings(): Promise<any[]> {
    const rssUrl = encodeURI('https://news.google.com/rss/search?q=thực+phẩm+giả+OR+hoá+chất+độc+hại+OR+ngộ+độc+thực+phẩm+when:7d&hl=vi&gl=VN&ceid=VN:vi');
    const feed = await this.parser.parseURL(rssUrl);

    const sortedItems = feed.items.sort((a, b) => new Date(b.pubDate as string).getTime() - new Date(a.pubDate as string).getTime());

    return sortedItems.slice(0, 15).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: (item as any).source || 'Google News',
      contentSnippet: item.contentSnippet || '',
    }));
  }

  async getNewsArticle(url: string): Promise<any> {
    const axiosConfig: any = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 15000,
      maxRedirects: 10,
    };

    let finalUrl = url;
    if (url.includes('news.google.com')) {
      try {
        const decoder = new GoogleDecoder();
        const decoded = await decoder.decode(url);
        if (decoded && decoded.status && decoded.decoded_url) {
          finalUrl = decoded.decoded_url;
        }
      } catch (redirectError: any) {
        console.warn('[GoogleNewsProvider] Could not resolve redirect:', redirectError.message);
      }
    }

    let response = await axios.get(finalUrl, axiosConfig);
    let htmlContent = response.data;

    if (htmlContent && htmlContent.length < 500 && htmlContent.includes('document.cookie') && htmlContent.includes('window.location.reload')) {
      const cookieMatch = htmlContent.match(/document\.cookie="([^"]+)"/);
      if (cookieMatch && cookieMatch[1]) {
        axiosConfig.headers['Cookie'] = cookieMatch[1];
        response = await axios.get(finalUrl, axiosConfig);
        htmlContent = response.data;
      }
    }

    const doc = new JSDOM(htmlContent, { url: finalUrl });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Could not extract article content');
    }

    return {
      title: article.title,
      byline: article.byline,
      content: article.content,
      textContent: article.textContent,
      length: article.length,
      excerpt: article.excerpt,
      siteName: article.siteName,
    };
  }
}
