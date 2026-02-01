import type { BusinessInfo } from './discover-types'
import { MOCK_BUSINESS } from './mock-discover'

function generateId(): string {
  return 'biz_' + Math.random().toString(36).substring(2, 15)
}

export interface DiscoverResult {
  business: BusinessInfo
  browserbaseSessionId?: string
  browserbaseSessionUrl?: string
}

/**
 * Discover a business from a Google Maps URL.
 * Priority: Browserbase/Stagehand → Apify → Mock data
 * If Browserbase gets business info but 0 reviews, supplements with mock reviews.
 */
export async function discoverBusiness(mapsUrl: string): Promise<DiscoverResult> {
  // Try Browserbase/Stagehand if keys are set
  if (process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID) {
    try {
      const { scrapeWithStagehand } = await import('./stagehand-scraper')
      console.log('[Discovery] Using Browserbase/Stagehand')
      const result = await scrapeWithStagehand(mapsUrl)

      // If Browserbase got business info but 0 reviews, supplement with mock reviews
      if (result.business && result.business.reviews.length === 0) {
        console.log('[Discovery] Browserbase got 0 reviews — supplementing with mock reviews for demo')
        result.business.reviews = MOCK_BUSINESS.reviews
        result.business.review_count = result.business.review_count || MOCK_BUSINESS.reviews.length
      }

      return result
    } catch (err: any) {
      console.error('[Discovery] Stagehand failed:', err?.message || err)
      // Even on failure, if we got a session URL, pass it through with mock data
      if (err?.browserbaseSessionId || err?.browserbaseSessionUrl) {
        console.log('[Discovery] Stagehand failed but got session — using mock data with session replay')
        return {
          business: {
            ...MOCK_BUSINESS,
            id: generateId(),
            maps_url: mapsUrl,
            scraped_at: new Date().toISOString(),
          },
          browserbaseSessionId: err.browserbaseSessionId,
          browserbaseSessionUrl: err.browserbaseSessionUrl,
        }
      }
    }
  }

  // Try Apify if token is set
  if (process.env.APIFY_API_TOKEN) {
    try {
      const { scrapeGoogleMaps } = await import('./apify-scraper')
      console.log('[Discovery] Using Apify')
      return await scrapeGoogleMaps(mapsUrl)
    } catch (err) {
      console.error('[Discovery] Apify failed:', err)
    }
  }

  // Mock fallback
  console.log('[Discovery] Using mock data (no session)')
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
