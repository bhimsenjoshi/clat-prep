import { NextResponse } from 'next/server';

const FEEDS = [
  { id: 'the-hindu', name: 'The Hindu', url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss', icon: '📰' },
  { id: 'the-hindu-opinion', name: 'The Hindu Opinion', url: 'https://www.thehindu.com/opinion/feeder/default.rss', icon: '📝' },
  { id: 'indian-express', name: 'Indian Express', url: 'https://indianexpress.com/section/opinion/editorials/feed/', icon: '📰' },
  { id: 'livelaw', name: 'LiveLaw', url: 'https://www.livelaw.in/google_feeds.xml', icon: '⚖️' },
];

interface EditorialItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sourceId: string;
  icon: string;
}

function parseRSSItems(xml: string, source: typeof FEEDS[0]): EditorialItem[] {
  const items: EditorialItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
    const link = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i);
    const pubDate = itemXml.match(/<pubDate[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/pubDate>/i);

    const titleText = (title?.[1] || title?.[2] || '').trim();
    const linkText = (link?.[1] || link?.[2] || '').trim();

    if (titleText && linkText) {
      items.push({
        title: titleText.replace(/<\/?[^>]+(>|$)/g, ''),
        link: linkText,
        pubDate: (pubDate?.[1] || pubDate?.[2] || '').trim(),
        source: source.name,
        sourceId: source.id,
        icon: source.icon,
      });
    }
  }
  return items;
}

export const dynamic = 'force-dynamic'; // don't cache the response itself

export async function GET() {
  const feedResults: { source: typeof FEEDS[0]; items: EditorialItem[]; error?: string }[] = [];

  for (const source of FEEDS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        feedResults.push({ source, items: [], error: `HTTP ${res.status}` });
        continue;
      }

      const xml = await res.text();
      const items = parseRSSItems(xml, source);
      feedResults.push({ source, items: items.slice(0, 3) }); // keep top 3 per source
    } catch (err: any) {
      feedResults.push({ source, items: [], error: err.message || 'Unknown error' });
    }
  }

  // Flatten for backward compatibility
  const allItems: EditorialItem[] = [];
  for (const r of feedResults) {
    allItems.push(...r.items);
  }

  return NextResponse.json({
    items: allItems,
    sources: feedResults.map(r => ({
      id: r.source.id,
      name: r.source.name,
      icon: r.source.icon,
      count: r.items.length,
      error: r.error || null,
    })),
    updatedAt: new Date().toISOString(),
  });
}
