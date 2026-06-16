const Parser = require('rss-parser');
const { HttpStatus } = require('../constants');

const parser = new Parser();

const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

// Fetch news from Google News RSS
exports.getNewsWarnings = async (req, res, next) => {
  try {
    const rssUrl = encodeURI('https://news.google.com/rss/search?q=thực+phẩm+giả+OR+hoá+chất+độc+hại+OR+ngộ+độc+thực+phẩm+when:7d&hl=vi&gl=VN&ceid=VN:vi');
    const feed = await parser.parseURL(rssUrl);

    const sortedItems = feed.items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const articles = sortedItems.slice(0, 15).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source || 'Google News',
      contentSnippet: item.contentSnippet || '',
    }));

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'News fetched successfully',
      data: articles
    });
  } catch (error) {
    console.error('[newsController.getNewsWarnings] Error parsing RSS:', error);
    next(error);
  }
};

// Extract full article content from URL using Mozilla Readability
exports.getNewsArticle = async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Missing URL parameter'
      });
    }

    const axiosConfig = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 15000,
      maxRedirects: 10,
    };

    // Google News wraps real URLs in a redirect. We need to follow it to get the actual article URL.
    let finalUrl = url;
    if (url.includes('news.google.com')) {
      try {
        const { GoogleDecoder } = require('google-news-url-decoder');
        const decoder = new GoogleDecoder();
        const decoded = await decoder.decode(url);
        if (decoded && decoded.status && decoded.decoded_url) {
          finalUrl = decoded.decoded_url;
        }
        console.log(`[newsController] Parsed redirect. Original: ${url}, Final: ${finalUrl}`);
      } catch (redirectError) {
        console.warn('[newsController] Could not resolve redirect, using original URL:', redirectError.message);
      }
    }

    // Fetch the raw HTML content of the actual article page
    let response = await axios.get(finalUrl, axiosConfig);
    let htmlContent = response.data;

    // Basic anti-bot bypass for simple cookie+reload challenges (e.g. laodong.vn)
    if (htmlContent && htmlContent.length < 500 && htmlContent.includes('document.cookie') && htmlContent.includes('window.location.reload')) {
        const cookieMatch = htmlContent.match(/document\.cookie="([^"]+)"/);
        if (cookieMatch && cookieMatch[1]) {
            axiosConfig.headers['Cookie'] = cookieMatch[1];
            response = await axios.get(finalUrl, axiosConfig);
            htmlContent = response.data;
        }
    }

    // Use JSDOM to parse the HTML string into a DOM
    const doc = new JSDOM(htmlContent, { url: finalUrl });

    // Pass the DOM document to Readability to parse
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Could not extract article content'
      });
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Article extracted successfully',
      data: {
        title: article.title,
        byline: article.byline,
        content: article.content, // HTML string of the extracted article
        textContent: article.textContent, // Plain text of the extracted article
        length: article.length,
        excerpt: article.excerpt,
        siteName: article.siteName,
      }
    });
  } catch (error) {
    console.error('[newsController.getNewsArticle] Error extracting article:', error.message);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to extract article content'
    });
  }
};
