import { NextResponse } from 'next/server';

const FEEDS = [
  {
    id: 'the-hindu',
    name: 'The Hindu',
    url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss',
    icon: '📰',
  },
  {
    id: 'indian-express',
    name: 'Indian Express',
    url: 'https://indianexpress.com/section/opinion/editorials/feed/',
    icon: '📰',
  },
  {
    id: 'livelaw',
    name: 'LiveLaw',
    url: 'https://www.livelaw.in/google_feeds.xml',
    icon: '⚖️',
  },
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

  // Extract <item> elements
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
    const link = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i);
    const pubDate = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);

    const titleText = (title?.[1] || title?.[2] || '').trim();
    const linkText = (link?.[1] || link?.[2] || '').trim();

    if (titleText && linkText) {
      items.push({
        title: titleText.replace(/<\/?[^>]+(>|$)/g, ''), // strip any HTML entities
        link: linkText,
        pubDate: pubDate?.[1]?.trim() || '',
        source: source.name,
        sourceId: source.id,
        icon: source.icon,
      });
    }
  }

  return items;
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      FEEDS.map(async (source) => {
        const res = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CLATly/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml',
          },
          next: { revalidate: 1800 }, // cache for 30 mins
        });

        if (!res.ok) {
          console.warn(`RSS fetch failed for ${source.name}: ${res.status}`);
          return { source, items: [] };
        }

        const xml = await res.text();
        const items = parseRSSItems(xml, source);
        return { source, items };
      })
    );

    const allItems: EditorialItem[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value.items);
      }
    }

    // Sort by date (newest first)
    allItems.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateB - dateA;
    });

    return NextResponse.json({
      items: allItems.slice(0, 12), // max 12 items
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Editorials RSS error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch editorials', items: [] },
      { status: 200 } // return empty array, don't break the UI
    );
  }
}
