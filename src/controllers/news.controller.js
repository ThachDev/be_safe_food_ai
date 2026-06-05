const Parser = require('rss-parser');
const { HttpStatus } = require('../constants');

const parser = new Parser();

// Fetch news from Google News RSS
exports.getNewsWarnings = async (req, res, next) => {
  try {
    const rssUrl = encodeURI('https://news.google.com/rss/search?q=thực+phẩm+giả+OR+hoá+chất+độc+hại+OR+ngộ+độc+thực+phẩm&hl=vi&gl=VN&ceid=VN:vi');
    const feed = await parser.parseURL(rssUrl);

    // Map and format the result
    const articles = feed.items.slice(0, 15).map(item => ({
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
