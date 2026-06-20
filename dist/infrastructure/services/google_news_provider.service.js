"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleNewsProviderService = void 0;
const tsyringe_1 = require("tsyringe");
const rss_parser_1 = __importDefault(require("rss-parser"));
const google_news_url_decoder_1 = require("google-news-url-decoder");
let GoogleNewsProviderService = class GoogleNewsProviderService {
    parser = new rss_parser_1.default();
    decoder = new google_news_url_decoder_1.GoogleDecoder();
    decodedUrlCache = new Map();
    feedCache = null;
    async getNewsWarnings() {
        const cacheDuration = 10 * 60 * 1000; // 10 minutes
        if (this.feedCache && (Date.now() - this.feedCache.timestamp < cacheDuration)) {
            return this.feedCache.items;
        }
        const rssUrl = encodeURI('https://news.google.com/rss/search?q=thực+phẩm+giả+OR+hoá+chất+độc+hại+OR+ngộ+độc+thực+phẩm+when:7d&hl=vi&gl=VN&ceid=VN:vi');
        const feed = await this.parser.parseURL(rssUrl);
        const sortedItems = feed.items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        const targetItems = sortedItems.slice(0, 15);
        const mappedItems = await Promise.all(targetItems.map(async (item) => {
            const originalLink = item.link || '';
            let finalLink = originalLink;
            if (originalLink.includes('news.google.com')) {
                const cached = this.decodedUrlCache.get(originalLink);
                if (cached) {
                    finalLink = cached;
                }
                else {
                    try {
                        const decoded = await this.decoder.decode(originalLink);
                        if (decoded && decoded.status && decoded.decoded_url) {
                            finalLink = decoded.decoded_url;
                            this.decodedUrlCache.set(originalLink, finalLink);
                        }
                    }
                    catch (error) {
                        console.error(`[GoogleNewsProviderService] Failed to decode URL ${originalLink}:`, error);
                    }
                }
            }
            return {
                title: item.title,
                link: finalLink,
                pubDate: item.pubDate,
                source: item.source || 'Google News',
                contentSnippet: item.contentSnippet || '',
            };
        }));
        this.feedCache = {
            items: mappedItems,
            timestamp: Date.now(),
        };
        return mappedItems;
    }
};
exports.GoogleNewsProviderService = GoogleNewsProviderService;
exports.GoogleNewsProviderService = GoogleNewsProviderService = __decorate([
    (0, tsyringe_1.injectable)()
], GoogleNewsProviderService);
