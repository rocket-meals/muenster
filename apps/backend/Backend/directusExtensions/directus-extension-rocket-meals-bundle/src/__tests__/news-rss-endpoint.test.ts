import { describe, it, expect } from '@jest/globals';
import { buildRss } from '../news-rss-endpoint/index';

describe('news rss endpoint', () => {
  it('builds rss xml from items', () => {
    const news = [
      {
        date: '2024-01-01',
        url: 'https://example.com/news',
        translations: [
          {
            title: 'Test News',
            content: 'Content',
          },
        ],
      },
    ];
    const xml = buildRss(news, 'https://example.com');
    expect(xml).toContain('<rss');
    expect(xml).toContain('<title>Rocket Meals News</title>');
    expect(xml).toContain('<title><![CDATA[Test News]]></title>');
  });
});
