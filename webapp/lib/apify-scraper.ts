import { ApifyClient } from 'apify-client'
import type { BusinessInfo, Review } from './discover-types'

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN || '',
})

function generateId(): string {
  return 'biz_' + Math.random().toString(36).substring(2, 15)
}

/**
 * Scrape a Google Maps business using Apify's Google Maps Scraper
 * Actor: compass/crawler-google-places
 */
export async function scrapeGoogleMaps(mapsUrl: string): Promise<{ business: BusinessInfo }> {
  if (!process.env.APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN not set')
  }

  // Run the Google Maps scraper actor
  const run = await client.actor('compass/crawler-google-places').call({
    startUrls: [{ url: mapsUrl }],
    maxCrawledPlacesPerSearch: 1,
    language: 'en',
    maxReviews: 30,
    reviewsSort: 'newest',
    reviewsTranslation: 'originalAndTranslated',
    scrapeReviewerName: true,
    scrapeReviewerId: false,
    scrapeReviewerUrl: false,
    scrapeReviewId: false,
    scrapeReviewUrl: false,
    scrapeResponseFromOwnerText: true,
  }, {
    waitSecs: 120,
  })

  // Get results from the dataset
  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  if (!items || items.length === 0) {
    throw new Error('No results from Apify scraper')
  }

  const place = items[0] as Record<string, any>

  // Map reviews
  const reviews: Review[] = (place.reviews || []).map((r: any) => ({
    author: r.name || r.reviewerName || 'Anonymous',
    rating: r.stars || r.rating || 3,
    text: r.text || r.reviewText || '',
    date: r.publishedAtDate || r.date || '',
    sentiment: (r.stars || r.rating || 3) >= 4 ? 'positive' as const
      : (r.stars || r.rating || 3) <= 2 ? 'negative' as const
      : 'neutral' as const,
  }))

  const business: BusinessInfo = {
    id: generateId(),
    name: place.title || place.name || 'Unknown',
    type: place.categoryName || place.category || 'Business',
    rating: place.totalScore || place.rating || 0,
    review_count: place.reviewsCount || place.totalReviews || 0,
    address: place.address || place.street || '',
    phone: place.phone || place.phoneUnformatted || undefined,
    website: place.website || place.url || undefined,
    hours: place.openingHours
      ? (Array.isArray(place.openingHours)
        ? place.openingHours.map((h: any) => typeof h === 'string' ? h : `${h.day}: ${h.hours}`).join(', ')
        : String(place.openingHours))
      : undefined,
    price_level: place.price || place.priceLevel || undefined,
    maps_url: place.url || mapsUrl,
    scraped_at: new Date().toISOString(),
    reviews,
  }

  return { business }
}

/**
 * Alternative: Scrape just reviews for a place using place ID
 */
export async function scrapeReviews(placeUrl: string, maxReviews = 40): Promise<Review[]> {
  if (!process.env.APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN not set')
  }

  const run = await client.actor('compass/crawler-google-places').call({
    startUrls: [{ url: placeUrl }],
    maxCrawledPlacesPerSearch: 1,
    language: 'en',
    maxReviews,
    reviewsSort: 'newest',
  }, {
    waitSecs: 120,
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  const place = (items?.[0] || {}) as Record<string, any>

  return (place.reviews || []).map((r: any) => ({
    author: r.name || 'Anonymous',
    rating: r.stars || 3,
    text: r.text || '',
    date: r.publishedAtDate || '',
    sentiment: (r.stars || 3) >= 4 ? 'positive' as const
      : (r.stars || 3) <= 2 ? 'negative' as const
      : 'neutral' as const,
  }))
}
