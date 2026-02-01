import { Stagehand } from '@browserbasehq/stagehand'
import { z } from 'zod'
import type { BusinessInfo, Review } from './discover-types'

function generateId(): string {
  return 'biz_' + Math.random().toString(36).substring(2, 15)
}

export interface ScrapeResult {
  business: BusinessInfo
  browserbaseSessionId?: string
  browserbaseSessionUrl?: string
}

export async function scrapeWithStagehand(mapsUrl: string): Promise<ScrapeResult> {
  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey: process.env.BROWSERBASE_API_KEY!,
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    model: 'openai/gpt-4o',
  })

  await stagehand.init()

  const sessionId = stagehand.browserbaseSessionId
  const sessionUrl = sessionId
    ? `https://www.browserbase.com/sessions/${sessionId}`
    : undefined
  console.log(`[Stagehand] Session: ${sessionUrl || 'unknown'}`)

  const page = stagehand.context.pages()[0]

  try {
    await page.goto(mapsUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(12000)

    // Dismiss consent dialogs
    try {
      const btn = page.locator('button:has-text("Accept all"), form[action*="consent"] button')
      if (await btn.count() > 0) { await btn.first().click(); await page.waitForTimeout(3000) }
    } catch {}

    const title = await page.title()
    console.log(`[Stagehand] Title: "${title}"`)

    // Click first result if on search page
    if (title === 'Google Maps' || !title.includes(' - Google Maps')) {
      try {
        await page.evaluate(() => {
          const firstResult = document.querySelector('[role="feed"] > div a, .Nv2PK a, a[href*="/maps/place/"]')
          if (firstResult) (firstResult as HTMLElement).click()
        })
        await page.waitForTimeout(6000)
      } catch {}
    }

    // ─── Extract business info via targeted DOM selectors ───
    const info = await page.evaluate(() => {
      const name = document.querySelector('h1')?.textContent?.trim() || ''

      // Rating from aria-label
      const rLabel = document.querySelector('[role="img"][aria-label*="star"]')?.getAttribute('aria-label') || ''
      const rm = rLabel.match(/([\d.]+)/)
      const rating = rm ? parseFloat(rm[1]) : 0

      // Review count — scan buttons/spans for "X reviews"
      let reviewCount = 0
      document.querySelectorAll('button,span,a').forEach(el => {
        const t = el.textContent || ''
        const m = t.match(/([\d,]+)\s*reviews?/i)
        if (m && !reviewCount) reviewCount = parseInt(m[1].replace(/,/g, ''))
      })

      // Category/type
      let type = ''
      const typeBtn = document.querySelector('button[jsaction*="category"]')
      if (typeBtn) type = typeBtn.textContent?.trim() || ''
      if (!type) {
        document.querySelectorAll('span,button').forEach(el => {
          const t = el.textContent?.trim() || ''
          if (/^(Coffee shop|Restaurant|Cafe|Bar|Bakery|Hotel|Store|Shop|Gym|Salon|Spa|Clinic|Dentist|Agency|Studio)/i.test(t)) {
            if (!type) type = t
          }
        })
      }

      // Address
      let address = ''
      const addrEl = document.querySelector('[data-item-id="address"] .Io6YTe') ||
        document.querySelector('button[data-item-id="address"]')
      if (addrEl) address = addrEl.textContent?.trim() || ''

      // Phone
      let phone = ''
      const phoneEl = document.querySelector('[data-item-id*="phone"] .Io6YTe') ||
        document.querySelector('button[data-item-id*="phone"]')
      if (phoneEl) phone = phoneEl.textContent?.trim() || ''

      // Website
      let website = ''
      const wEl = document.querySelector('a[data-item-id="authority"]')
      if (wEl) website = wEl.getAttribute('href') || ''

      // Hours
      let hours = ''
      const hEl = document.querySelector('[aria-label*="Monday"]')
      if (hEl) {
        const full = hEl.getAttribute('aria-label') || ''
        // Trim the long hours string
        hours = full.length > 200 ? full.slice(0, 200) + '...' : full
      }

      // Price level
      let priceLevel = ''
      document.querySelectorAll('[aria-label*="Price"]').forEach(el => {
        priceLevel = el.textContent?.trim() || ''
      })

      return { name, rating, reviewCount, type, address, phone, website, hours, priceLevel }
    })

    console.log(`[Stagehand] Extracted: "${info.name}" ${info.rating}★ (${info.reviewCount} reviews)`)

    // ─── Extract visible review snippets from overview ───
    let reviews: Review[] = []

    try {
      // Try clicking the star rating area to open reviews panel
      try {
        const ratingEl = page.locator('[role="img"][aria-label*="star"]').first()
        await ratingEl.click({ timeout: 5000 })
        await page.waitForTimeout(5000)
      } catch {}

      // Extract any reviews visible on the page
      const domReviews = await page.evaluate(() => {
        const results: Array<{ author: string; rating: number; date: string; text: string }> = []
        // Try standard review selectors
        document.querySelectorAll('[data-review-id], .jftiEf').forEach(el => {
          const author = el.querySelector('.d4r55')?.textContent?.trim() || ''
          const rLabel = el.querySelector('[role="img"][aria-label*="star"]')?.getAttribute('aria-label') || ''
          const rm = rLabel.match(/(\d)/)
          const rating = rm ? parseInt(rm[1]) : 0
          const date = el.querySelector('.rsqaWe')?.textContent?.trim() || ''
          const text = el.querySelector('.wiI7pd')?.textContent?.trim() || ''
          if (author && (text || rating)) results.push({ author, rating, date, text })
        })
        return results
      })

      reviews = domReviews.map(r => ({
        ...r,
        sentiment: r.rating >= 4 ? 'positive' as const
          : r.rating <= 2 ? 'negative' as const
          : 'neutral' as const,
      }))
      console.log(`[Stagehand] Reviews from DOM: ${reviews.length}`)
    } catch (err) {
      console.error('[Stagehand] Reviews failed:', err)
    }

    const business: BusinessInfo = {
      id: generateId(),
      name: info.name || 'Unknown Business',
      type: info.type || 'Business',
      rating: info.rating || 0,
      review_count: info.reviewCount || reviews.length || 0,
      address: info.address || '',
      phone: info.phone || undefined,
      website: info.website || undefined,
      hours: info.hours || undefined,
      price_level: info.priceLevel || undefined,
      maps_url: mapsUrl,
      scraped_at: new Date().toISOString(),
      reviews,
    }

    console.log(`[Stagehand] Done: "${business.name}" — ${reviews.length} reviews scraped`)

    return {
      business,
      browserbaseSessionId: sessionId,
      browserbaseSessionUrl: sessionUrl,
    }
  } catch (err) {
    console.error('[Stagehand] Fatal:', err)
    throw Object.assign(err as Error, {
      browserbaseSessionId: sessionId,
      browserbaseSessionUrl: sessionUrl,
    })
  } finally {
    await stagehand.close().catch(() => {})
  }
}
