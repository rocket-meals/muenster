import { defineEndpoint } from '@directus/extensions-sdk';
import axios from 'axios';

export default defineEndpoint({
  id: 'rss-feed',
  handler: (router) => {
    router.get('/', async (req, res) => {
      const url = req.query.url as string | undefined;
      if (!url) {
        res.status(400).json({ error: 'Missing url parameter' });
        return;
      }
      try {
        const response = await axios.get(url, { responseType: 'text' });
        res.setHeader('Content-Type', 'application/xml');
        res.send(response.data);
      } catch (err) {
        console.error('Failed to fetch RSS feed', err);
        res.status(500).json({ error: 'Failed to fetch RSS feed' });
      }
    });
  },
});
