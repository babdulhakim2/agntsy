import type { BusinessInfo } from './discover-types'
import { MOCK_BUSINESS } from './mock-discover'

function generateId(): string {
  return 'biz_' + Math.random().toString(36).substring(2, 15)
}

/**
 * Discover a business from a Google Maps URL.
 * Priority: Apify (APIFY_API_TOKEN) → Mock data
 */
export async function discoverBusiness(mapsUrl: string): Promise<{ business: BusinessInfo }> {
  // Try Apify if token is set
  if (process.env.APIFY_API_TOKEN) {
    try {
      const { scrapeGoogleMaps } = await import('./apify-scraper')
      return await scrapeGoogleMaps(mapsUrl)
    } catch (err) {
      console.error('Apify scrape failed, falling back to mock:', err)
    }
  }

  // Mock fallback
  await new Promise(r => setTimeout(r, 500))
  return {
    business: {
      ...MOCK_BUSINESS,
      id: generateId(),
      maps_url: mapsUrl,
      scraped_at: new Date().toISOString(),
    },
  }
}
