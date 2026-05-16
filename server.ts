import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import Parser from 'rss-parser';

const rssParser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
});

const ALL_SEO_FEEDS = [
  'https://ahrefs.com/blog/feed/',
  'https://moz.com/posts/rss/blog',
  'https://www.semrush.com/blog/feed/',
  'https://yoast.com/feed/',
  'https://www.growth-memo.com/feed',
  'https://lilyraynyc.substack.com/feed',
  'https://gofishdigital.com/blog/feed/',
  'https://ipullrank.com/blog/feed',
  'https://mangools.com/blog/feed/',
  'https://cognitiveseo.com/blog/feed/',
  'https://serpstat.com/feed/',
  'https://rankmath.com/feed/',
  'https://seranking.com/blog/feed/',
  'https://aioseo.com/feed/',
  'https://searchengineland.com/feed',
  'https://rss.searchenginejournal.com/',
  'https://www.searchenginewatch.com/feed/',
  'http://www.seroundtable.com/index.rdf',
  'https://digitalmarketingdepot.com/feed',
  'https://growthhackers.com/tags/seo/feed/',
  'https://www.seo.com/blog/feed/',
  'https://theweeklyseo.com/issues.rss',
  'https://www.aleydasolis.com/en/feed',
  'http://feeds.feedburner.com/seobythesea/Tesr',
  'https://www.gsqi.com/marketing-blog/feed/',
  'https://www.mariehaynes.com/feed/',
  'https://diggitymarketing.com/feed/',
  'https://seosly.com/feed/',
  'https://backlinko.com/blog/feed/',
  'http://neilpatel.com/blog/feed',
  'https://technicalseo.com/insights/feed/',
  'https://www.onely.com/feed/',
  'https://www.brightedge.com/blog/feed/',
  'https://www.seoclarity.net/blog/rss.xml',
  'https://www.lumar.io/feed/',
  'https://pi-datametrics.com/feed/',
  'https://www.schemaapp.com/feed/',
  'https://blogs.perficientdigital.com/category/seo/feed',
  'https://blog.linkody.com/feed',
  'https://www.thehoth.com/feed/',
  'https://www.serped.com/feed',
  'https://seobounty.com/feed/',
  'https://www.serphouse.com/feed',
  'https://activebusinessgrowth.ca/feed/',
  'https://www.digitalsquad.co.nz/blog/feed/',
  'http://seocopywriting.com/feed/',
  'https://seosherpa.com/blog/feed/',
  'https://terakeet.com/feed/',
  'https://seopressor.com/feed/',
  'https://www.seerinteractive.com/insights/rss.xml',
  'https://seo-hacker.com/feed/',
  'https://dejanmarketing.com/feed/',
  'https://raventools.com/blog/feed/',
  'https://www.evolvingseo.com/feed/',
  'https://www.seoplus.ca/blog/feed/',
  'https://www.seocycle.com.au/feed/',
  'https://stewartmedia.com.au/feed/',
  'https://sharkdigital.com.au/feed/',
  'https://anicca.co.uk/blog/category/search-engine-optimisation-seo/feed/',
  'https://pacelab.co/feed/',
  'https://witneyseoguy.co.uk/blog/feed/',
  'https://www.techwyse.com/blog/category/search-engine-optimization/feed',
  'https://seoconsultant.agency/feed/',
  'https://hallanalysis.com/feed/',
  'https://www.improvemysearchranking.com/category/blog/seo-1/feed/',
  'https://level343.com/feed/',
  'https://www.seobility.net/en/feed/',
  'https://www.similarweb.com/blog/marketing/seo/feed/',
  'https://spyserp.com/rss',
  'https://www.vizion.com/blog/category/search-engine-optimization/feed/',
  'https://blog.seoprofiler.com/category/search-engine-optimization/feed/',
  'https://ftf.agency/feed',
];

// Helper to shuffle array but keep it deterministic with page? Or just slice.
function getSubarray(arr: string[], page: number, size: number) {
  const startIdx = ((page - 1) * size) % arr.length;
  // If we wrap around, we can just slice then concat. But let's just do a simple slice.
  let result = arr.slice(startIdx, startIdx + size);
  if (result.length < size) {
    result = result.concat(arr.slice(0, size - result.length));
  }
  return result;
}

async function getLiveRssContext(page: number = 1, searchQuery?: string) {
  try {
    const fetchSize = searchQuery ? 30 : 12; // Fetch more feeds if searching
    const selectedFeeds = getSubarray(ALL_SEO_FEEDS, page, fetchSize);
    // Add catch to prevent unhandled promise rejections crashing Promise.allSettled? 
    // They are handled by allSettled, but good safety.
    const feedPromises = selectedFeeds.map(url => rssParser.parseURL(url));
    const results = await Promise.allSettled(feedPromises);
    const allItems: string[] = [];
    
    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value) {
        const sourceTitle = res.value.title;
        const itemsArray = searchQuery ? res.value.items : res.value.items?.slice(0, 5);
        
        itemsArray?.forEach(item => {
           if (searchQuery) {
             const contentToSearch = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
             if (contentToSearch.includes(searchQuery.toLowerCase())) {
               allItems.push(`Source: ${sourceTitle}\nTitle: ${item.title}\nLink: ${item.link}\nSummary: ${item.contentSnippet || item.content || ''}`);
             }
           } else {
             allItems.push(`Source: ${sourceTitle}\nTitle: ${item.title}\nLink: ${item.link}\nSummary: ${item.contentSnippet || item.content || ''}`);
           }
        });
      }
    });

    if (searchQuery) {
      if (allItems.length > 0) {
        const limitedItems = allItems.slice(0, 30);
        return `\n\n--- LIVE RSS SEARCH RESULTS for "${searchQuery}" ---\nHere are the matched articles retrieved from RSS feeds. Construct your news digest based on these:\n\n${limitedItems.join('\n\n---\n\n')}\n---------------------------\n`;
      } else {
        return `\n\n--- LIVE RSS SEARCH RESULTS for "${searchQuery}" ---\nNo exact matches found in the most recent feeds for "${searchQuery}". You must synthesize the best answer based on your knowledge and any related updates.\n---------------------------\n`;
      }
    }

    if (allItems.length > 0) {
      return `\n\n--- LIVE RSS DATA FEED ---\nHere are the absolute latest articles retrieved directly from top SEO RSS feeds in real-time. YOU MUST use these exact items to construct your news digest and summarize them to ensure 100% factual accuracy:\n\n${allItems.join('\n\n---\n\n')}\n---------------------------\n`;
    }
  } catch (error) {
    console.warn("RSS fetch error:", error);
  }
  return '';
}

// Simple server-side caching
const cache: Record<string, { timestamp: number; data: any }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API Routes
  app.get('/api/news', async (req, res) => {
    try {
      const cacheKey = req.originalUrl;
      if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(cache[cacheKey].data);
      }

      const category = (req.query.category as string) || 'SEO industry news';
      const page = parseInt(req.query.page as string) || 1;
      const searchQuery = req.query.searchQuery as string | undefined;
      
      let prompt = `Provide a daily dashboard digest of the exact most recent and latest news in the category: "${category}". 
Format the response in clean, beautiful Markdown. 
Source your information from popular SEO blogs, SEO professionals, and AI search experts.
Include:
- A "Trending Topics & Key Insights" intro summary.
- A list of EXACTLY 8-10 specific recent articles, news, or latest algorithm updates in this category. For each, use a sub-heading with the title (hyperlinked to its provided Link), the source (e.g. Search Engine Land, specific blogs), and a 3-4 sentence summary.
- Key takeaways or actionable insights for SEO professionals.
Keep the tone professional and focus on real, recent facts and events.`;

      if (category === 'My Feed' && req.query.prefs) {
        let prefs;
        try {
          prefs = JSON.parse(req.query.prefs as string);
        } catch(e) {
          prefs = {};
        }
        const cats = prefs.categories?.length > 0 ? prefs.categories.join(', ') : 'all SEO topics';
        const sources = prefs.sources?.length > 0 ? prefs.sources.join(', ') : 'popular SEO blogs';
        prompt = `Provide a personalized daily dashboard digest of the exact most recent and latest news for the following SEO categories: "${cats}". 
Source the information specifically prioritizing these blogs/experts: "${sources}". If they lack recent news, supplement with other trusted SEO sources.
Format the response in clean, beautiful Markdown. 
Include:
- A "Personalized Insights" intro summary for this feed.
- A list of EXACTLY 8-10 specific recent articles, news, or updates touching on these categories or from these sources. For each, use a sub-heading with the title (hyperlinked to its provided Link), the source, and a 3-4 sentence summary.
- Key takeaways for SEO professionals.
Keep the tone professional and focus on real facts.`;
      } else if (category.startsWith('Trend: ')) {
        const trend = category.substring(7);
        prompt = `Provide a deep dive into the recent trend: "${trend}" in the SEO industry.
Format the response in clean, beautiful Markdown. 
Source your information from popular SEO blogs, SEO professionals, and AI search experts.
Include:
- An overview of why "${trend}" is trending right now.
- A list of EXACTLY 8-10 specific recent articles or news covering this trend. For each, use a sub-heading with the title (hyperlinked to its provided Link), the source, and a summary.
- Actionable advice for SEOs regarding this trend.`;
      } else if (category === 'Search' && searchQuery) {
        prompt = `You are an intelligent search assistant for recent SEO news. The user has searched for the keyword: "${searchQuery}".
Format the response in clean, beautiful Markdown. 
Search through your knowledge and the provided RSS feed data for any relevant recent articles, news, or updates specifically regarding "${searchQuery}".
Include:
- A brief summary of the search insight for "${searchQuery}".
- A list of EXACTLY 8-10 specific recent articles or news related to this search query. For each, use a sub-heading with the title (hyperlinked to its provided Link), the source, and a summary.
- If fewer than 8 articles are found in the recent feeds for this exact query, supplement with other closely related recent SEO news.`;
      }

      // Append RSS contextual data to whatever the prompt is
      const rssContext = await getLiveRssContext(page, searchQuery || (category.startsWith('Search: ') ? category.substring(8) : undefined));
      if (rssContext) {
        prompt += rssContext;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
        },
      });

      const responseData = { content: response.text };
      cache[cacheKey] = {
        timestamp: Date.now(),
        data: responseData
      };
      res.json(responseData);
    } catch (error: any) {
      console.error('Error generating news:', error);
      if (error?.status === 429 || error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('quota')) {
        res.status(429).json({ error: 'AI API Rate Limit Exceeded. Please try again in a few minutes.' });
      } else {
        res.status(500).json({ error: 'Failed to fetch news' });
      }
    }
  });

  app.get('/api/trends', async (req, res) => {
    try {
      const cacheKey = req.originalUrl;
      if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(cache[cacheKey].data);
      }

      const rssContext = await getLiveRssContext();
      const prompt = `Analyze the provided RSS feed data from the last 7 days and identify the top 5 to 7 currently trending topics, concepts, or keywords in the SEO industry. Provide the topic name, an 'interest' score out of 100 reflecting its current impact/chatter based on these articles, and a short 1-sentence description.\n\n${rssContext}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                score: { type: Type.INTEGER },
                description: { type: Type.STRING }
              },
              required: ["topic", "score", "description"]
            }
          }
        }
      });
      const responseData = { trends: JSON.parse(response.text || '[]') };
      cache[cacheKey] = {
        timestamp: Date.now(),
        data: responseData
      };
      res.json(responseData);
    } catch (error: any) {
      console.error('Error generating trends:', error);
      if (error?.status === 429 || error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('quota')) {
         res.status(429).json({ error: 'AI API Rate Limit Exceeded. Trends temporarily unavailable.' });
      } else {
         res.status(500).json({ error: 'Failed to fetch trends' });
      }
    }
  });

  app.post('/api/subscribe', (req, res) => {
    const { name, email, consent } = req.body;
    if (!name || !email || !consent) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    // Mock save logic
    console.log(`Subscribed: ${name} <${email}>`);
    res.json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Notice the updated express v5 '*' route
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
