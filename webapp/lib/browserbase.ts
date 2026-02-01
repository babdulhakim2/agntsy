import { BusinessInfo } from './types';
import { mockBusiness } from './mockData-discover';

function generateId(): string {
  return 'biz_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Mock business discovery — returns realistic fake data
 */
async function discoverBusinessMock(mapsUrl: string): Promise<BusinessInfo> {
  // Simulate scraping delay
  await new Promise((r) => setTimeout(r, 500));

  return {
    ...mockBusiness,
    id: generateId(),
    maps_url: mapsUrl,
    discovered_at: new Date().toISOString(),
  };
}

/**
 * Real business discovery using Browserbase/Stagehand
 */
async function discoverBusinessReal(mapsUrl: string): Promise<BusinessInfo> {
  // @ts-ignore - may not be installed
  const { Stagehand } = await import('@browserbasehq/stagehand');

  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
  });

  await stagehand.init();

  try {
    // Navigate to Google Maps URL
    await stagehand.page.goto(mapsUrl, { waitUntil: 'networkidle' });

    // Extract business info
    const info = await stagehand.extract({
      instruction: 'Extract the business name, type/category, star rating, total review count, full address, phone number, website URL, price level, and business hours from this Google Maps listing.',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          rating: { type: 'number' },
          review_count: { type: 'number' },
          address: { type: 'string' },
          phone: { type: 'string' },
          website: { type: 'string' },
          price_level: { type: 'string' },
          hours: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    // Click on Reviews tab
    await stagehand.act({ action: 'Click on the Reviews tab' });
    await new Promise((r) => setTimeout(r, 2000));

    // Sort by newest
    await stagehand.act({ action: 'Click the sort button and select "Newest"' });
    await new Promise((r) => setTimeout(r, 2000));

    // Scrape newest reviews
    const newestReviews = await stagehand.extract({
      instruction: 'Extract up to 20 reviews including the author name, star rating, date, and full review text.',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            author: { type: 'string' },
            rating: { type: 'number' },
            date: { type: 'string' },
            text: { type: 'string' },
          },
        },
      },
    });

    // Sort by lowest rating
    await stagehand.act({ action: 'Click the sort button and select "Lowest rating"' });
    await new Promise((r) => setTimeout(r, 2000));

    // Scrape lowest rated reviews
    const lowestReviews = await stagehand.extract({
      instruction: 'Extract up to 20 reviews including the author name, star rating, date, and full review text.',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            author: { type: 'string' },
            rating: { type: 'number' },
            date: { type: 'string' },
            text: { type: 'string' },
          },
        },
      },
    });

    // Combine and dedupe reviews
    const allReviews = [...(newestReviews || []), ...(lowestReviews || [])];
    const seenAuthors = new Set<string>();
    const reviews = allReviews.filter((r: any) => {
      if (seenAuthors.has(r.author)) return false;
      seenAuthors.add(r.author);
      return true;
    });

    // Try to scrape website if available
    let scraped_services: string[] = [];
    let scraped_menu: string[] = [];
    let scraped_pricing: { item: string; price: string }[] = [];

    if (info.website) {
      try {
        await stagehand.page.goto(info.website, { waitUntil: 'networkidle' });
        const websiteData = await stagehand.extract({
          instruction: 'Extract any services offered, menu items with prices, and pricing information from this website.',
          schema: {
            type: 'object',
            properties: {
              services: { type: 'array', items: { type: 'string' } },
              menu: { type: 'array', items: { type: 'string' } },
              pricing: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    item: { type: 'string' },
                    price: { type: 'string' },
                  },
                },
              },
            },
          },
        });
        scraped_services = websiteData.services || [];
        scraped_menu = websiteData.menu || [];
        scraped_pricing = websiteData.pricing || [];
      } catch {
        // Website scraping failed, continue without it
      }
    }

    const businessId = generateId();

    return {
      id: businessId,
      name: info.name || 'Unknown Business',
      type: info.type || 'Business',
      rating: info.rating || 0,
      review_count: info.review_count || 0,
      address: info.address || '',
      phone: info.phone,
      website: info.website,
      hours: info.hours,
      price_level: info.price_level,
      photos: [],
      reviews: reviews.map((r: any) => ({
        author: r.author,
        rating: r.rating,
        date: r.date,
        text: r.text,
        sentiment: r.rating >= 4 ? 'positive' as const : r.rating <= 2 ? 'negative' as const : 'neutral' as const,
      })),
      scraped_services,
      scraped_menu,
      scraped_pricing,
      screenshots: [],
      discovered_at: new Date().toISOString(),
      maps_url: mapsUrl,
    };
  } finally {
    await stagehand.close();
  }
}

/**
 * Discover a business from a Google Maps URL
 * Uses Browserbase/Stagehand if API key is available, otherwise returns mock data
 */
export async function discoverBusiness(mapsUrl: string): Promise<BusinessInfo> {
  if (process.env.BROWSERBASE_API_KEY) {
    try {
      return await discoverBusinessReal(mapsUrl);
    } catch (error) {
      console.error('Browserbase discovery failed, falling back to mock:', error);
      return discoverBusinessMock(mapsUrl);
    }
  }
  return discoverBusinessMock(mapsUrl);
}
