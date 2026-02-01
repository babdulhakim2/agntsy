import { Stagehand } from '@browserbasehq/stagehand'
import { z } from 'zod'
import type { BusinessInfo, Review } from './discover-types'

function generateId(): string {
  return 'biz_' + Math.random().toString(36).substring(2, 15)
}

export async function scrapeWithStagehand(mapsUrl: string): Promise<{ business: BusinessInfo }> {
  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey: process.env.BROWSERBASE_API_KEY!,
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    model: 'openai/gpt-4o',
  })

  await stagehand.init()
  const page = stagehand.context.pages()[0]

  try {
    // Navigate to Google Maps URL
    await page.goto(mapsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(8000)

    // If it's a search results page, click the first result
    const title = await page.title()
    if (!title.includes(' - Google Maps') || title === 'Google Maps') {
      try {
        await stagehand.act('Click on the first business result in the list on the left side')
        await page.waitForTimeout(5000)
      } catch {
        // Already on a place page
      }
    }

    // Extract business info
    const info = await stagehand.extract(
      'Extract the business name, business type/category, star rating (number), total number of reviews, full address, phone number, website URL, price level (like $ or $$), and business hours from this Google Maps listing.',
      z.object({
        name: z.string(),
        type: z.string(),
        rating: z.number(),
        review_count: z.number(),
        address: z.string(),
        phone: z.string().optional(),
        website: z.string().optional(),
        price_level: z.string().optional(),
        hours: z.string().optional(),
      })
    )

    // Click on Reviews tab
    await stagehand.act('Click on the Reviews tab or reviews section')
    await page.waitForTimeout(3000)

    // Sort by newest first
    try {
      await stagehand.act('Click the sort button and select "Newest" to sort reviews by newest first')
      await page.waitForTimeout(3000)
    } catch {
      // Sort might not be available
    }

    // Scroll to load more reviews
    for (let i = 0; i < 3; i++) {
      await stagehand.act('Scroll down in the reviews panel to load more reviews')
      await page.waitForTimeout(1500)
    }

    // Extract reviews
    const reviewData = await stagehand.extract(
      'Extract all visible reviews. For each review get: the reviewer name, their star rating (1-5), when they posted it (like "2 weeks ago"), and the full review text.',
      z.object({
        reviews: z.array(z.object({
          author: z.string(),
          rating: z.number(),
          date: z.string(),
          text: z.string(),
        }))
      })
    )

    // Now sort by lowest rating
    let lowestReviews: typeof reviewData.reviews = []
    try {
      await stagehand.act('Click the sort button and select "Lowest rating" to sort by lowest rated reviews')
      await page.waitForTimeout(3000)

      // Scroll to load more
      for (let i = 0; i < 2; i++) {
        await stagehand.act('Scroll down in the reviews panel to load more reviews')
        await page.waitForTimeout(1500)
      }

      const lowestData = await stagehand.extract(
        'Extract all visible reviews. For each review get: the reviewer name, their star rating (1-5), when they posted it, and the full review text.',
        z.object({
          reviews: z.array(z.object({
            author: z.string(),
            rating: z.number(),
            date: z.string(),
            text: z.string(),
          }))
        })
      )
      lowestReviews = lowestData.reviews || []
    } catch {
      // Lowest sort failed, continue with what we have
    }

    // Combine and dedupe reviews
    const allReviews = [...(reviewData.reviews || []), ...lowestReviews]
    const seen = new Set<string>()
    const reviews: Review[] = allReviews
      .filter(r => {
        const key = `${r.author}-${r.text.slice(0, 50)}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map(r => ({
        ...r,
        sentiment: r.rating >= 4 ? 'positive' as const
          : r.rating <= 2 ? 'negative' as const
          : 'neutral' as const,
      }))

    const business: BusinessInfo = {
      id: generateId(),
      name: info.name || 'Unknown Business',
      type: info.type || 'Business',
      rating: info.rating || 0,
      review_count: info.review_count || 0,
      address: info.address || '',
      phone: info.phone || undefined,
      website: info.website || undefined,
      hours: info.hours || undefined,
      price_level: info.price_level || undefined,
      maps_url: mapsUrl,
      scraped_at: new Date().toISOString(),
      reviews,
    }

    return { business }
  } finally {
    await stagehand.close()
  }
}
