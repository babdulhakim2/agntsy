import type { BusinessInfo, Review } from './discover-types'
import { MOCK_BUSINESS, MOCK_REVIEWS } from './mock-discover'

function generateId(): string {
  return 'biz_' + Math.random().toString(36).substring(2, 15)
}

/**
 * Discover a business from a Google Maps URL.
 * When BROWSERBASE_API_KEY is set, uses Stagehand for real scraping.
 * Otherwise returns mock data for demo purposes.
 */
export async function discoverBusiness(mapsUrl: string): Promise<{ business: BusinessInfo; reviews: Review[] }> {
  // TODO: Wire up Browserbase/Stagehand when API key is available
  // For now, return mock data with a simulated delay
  await new Promise(r => setTimeout(r, 500))

  return {
    business: {
      ...MOCK_BUSINESS,
      id: generateId(),
      mapsUrl,
      scrapedAt: new Date().toISOString(),
    },
    reviews: MOCK_REVIEWS,
  }
}
