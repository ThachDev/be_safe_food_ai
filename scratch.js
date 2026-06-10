const Parser = require('rss-parser');
const parser = new Parser();
async function test() {
  const rssUrl = encodeURI('https://news.google.com/rss/search?q=thực+phẩm+giả+OR+hoá+chất+độc+hại+OR+ngộ+độc+thực+phẩm&hl=vi&gl=VN&ceid=VN:vi');
  const feed = await parser.parseURL(rssUrl);
  console.log("KEYS:", Object.keys(feed.items[0]));
  console.log(feed.items[0]);
}
test();
