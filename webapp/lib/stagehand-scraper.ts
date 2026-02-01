import { Stagehand } from '@browserbasehq/stagehand'
import type { BusinessInfo, Review } from './discover-types'

function generateId(): string {
  return 'biz_' + Math.random().toString(36).substring(2, 15)
}

export interface ScrapeResult {
  business: BusinessInfo
  browserbaseSessionId?: string
  browserbaseSessionUrl?: string
}

/**
 * Ensure the Maps URL has the !9m1!1b1 param that forces the reviews panel open.
 */
function ensureReviewsParam(url: string): string {
  if (url.includes('!9m1!1b1')) return url
  // If it has /data= section, append the reviews flag
  if (url.includes('/data=')) {
    return url.replace(/(\?entry=)/, '!9m1!1b1$1').replace(/(#|$)/, '!9m1!1b1$1')
  }
  // If no data section, add one
  const sep = url.includes('?') ? '&' : '?'
  return url
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
    // Navigate — try to force reviews panel open
    const targetUrl = ensureReviewsParam(mapsUrl)
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
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

    // ─── Extract business info ───
    const info = await page.evaluate(() => {
      const name = document.querySelector('h1')?.textContent?.trim() || ''

      const rLabel = document.querySelector('[role="img"][aria-label*="star"]')?.getAttribute('aria-label') || ''
      const rm = rLabel.match(/([\d.]+)/)
      const rating = rm ? parseFloat(rm[1]) : 0

      let reviewCount = 0
      document.querySelectorAll('button,span,a').forEach(el => {
        const t = el.textContent || ''
        const m = t.match(/([\d,]+)\s*reviews?/i)
        if (m && !reviewCount) reviewCount = parseInt(m[1].replace(/,/g, ''))
      })

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

      let address = ''
      const addrEl = document.querySelector('[data-item-id="address"] .Io6YTe') ||
        document.querySelector('button[data-item-id="address"]')
      if (addrEl) address = addrEl.textContent?.trim() || ''

      let phone = ''
      const phoneEl = document.querySelector('[data-item-id*="phone"] .Io6YTe') ||
        document.querySelector('button[data-item-id*="phone"]')
      if (phoneEl) phone = phoneEl.textContent?.trim() || ''

      let website = ''
      const wEl = document.querySelector('a[data-item-id="authority"]')
      if (wEl) website = wEl.getAttribute('href') || ''

      let hours = ''
      const hEl = document.querySelector('[aria-label*="Monday"]')
      if (hEl) {
        const full = hEl.getAttribute('aria-label') || ''
        hours = full.length > 200 ? full.slice(0, 200) + '...' : full
      }

      let priceLevel = ''
      document.querySelectorAll('[aria-label*="Price"]').forEach(el => {
        priceLevel = el.textContent?.trim() || ''
      })

      return { name, rating, reviewCount, type, address, phone, website, hours, priceLevel }
    })

    console.log(`[Stagehand] Business: "${info.name}" ${info.rating}★ (${info.reviewCount} reviews)`)

    // ─── Click Reviews tab if visible ───
    try {
      await page.evaluate(() => {
        const tabs = document.querySelectorAll('[role="tab"], button')
        for (const tab of tabs) {
          if (/^Reviews$/i.test((tab.textContent || '').trim())) {
            (tab as HTMLElement).click()
            return true
          }
        }
        return false
      })
      await page.waitForTimeout(4000)
    } catch {}

    // ─── Scroll to load more reviews ───
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => {
        // The scrollable reviews container
        const scrollable = document.querySelector('.m6QErb.DxyBCb') ||
          document.querySelector('.m6QErb.XiKgde') ||
          document.querySelector('[tabindex="-1"].m6QErb')
        if (scrollable) {
          scrollable.scrollTop = scrollable.scrollHeight
          return true
        }
        return false
      })
      await page.waitForTimeout(1500)
    }

    // ─── Expand truncated reviews ───
    await page.evaluate(() => {
      document.querySelectorAll('button.w8nwRe, button.M77dve').forEach(btn => {
        (btn as HTMLElement).click()
      })
    })
    await page.waitForTimeout(1000)

    // ─── Extract reviews ───
    const domReviews = await page.evaluate(() => {
      const results: Array<{ author: string; rating: number; date: string; text: string }> = []
      const seen = new Set<string>()
      document.querySelectorAll('[data-review-id], .jftiEf').forEach(el => {
        const author = el.querySelector('.d4r55')?.textContent?.trim() || ''
        const rLabel = el.querySelector('[role="img"][aria-label*="star"]')?.getAttribute('aria-label') || ''
        const rm = rLabel.match(/(\d)/)
        const rating = rm ? parseInt(rm[1]) : 0
        const date = el.querySelector('.rsqaWe')?.textContent?.trim() || ''
        const text = el.querySelector('.wiI7pd')?.textContent?.trim() || ''
        if (author && text) {
          const key = `${author}|${text.slice(0, 50)}`
          if (!seen.has(key)) {
            seen.add(key)
            results.push({ author, rating, date, text })
          }
        }
      })
      return results
    })

    const reviews: Review[] = domReviews.map(r => ({
      ...r,
      sentiment: r.rating >= 4 ? 'positive' as const
        : r.rating <= 2 ? 'negative' as const
        : 'neutral' as const,
    }))

    console.log(`[Stagehand] Reviews scraped: ${reviews.length}`)

    // ─── If no reviews yet, try sorting by lowest to get critical ones ───
    if (reviews.length > 0) {
      try {
        // Click sort
        await page.evaluate(() => {
          const sortBtn = document.querySelector('[aria-label*="Sort"], button[data-value="sort"]')
          if (sortBtn) { (sortBtn as HTMLElement).click(); return }
          document.querySelectorAll('button').forEach(b => {
            if (/most relevant|sort/i.test(b.textContent || '')) (b as HTMLElement).click()
          })
        })
        await page.waitForTimeout(2000)

        // Click "Lowest rating"
        await page.evaluate(() => {
          document.querySelectorAll('[role="menuitemradio"], [data-index]').forEach(el => {
            if (/lowest/i.test(el.textContent || '')) (el as HTMLElement).click()
          })
        })
        await page.waitForTimeout(3000)

        // Scroll
        for (let i = 0; i < 4; i++) {
          await page.evaluate(() => {
            const s = document.querySelector('.m6QErb.DxyBCb') || document.querySelector('[tabindex="-1"].m6QErb')
            if (s) s.scrollTop = s.scrollHeight
          })
          await page.waitForTimeout(1500)
        }

        // Expand
        await page.evaluate(() => {
          document.querySelectorAll('button.w8nwRe, button.M77dve').forEach(b => (b as HTMLElement).click())
        })
        await page.waitForTimeout(1000)

        // Extract lowest
        const lowestReviews = await page.evaluate(() => {
          const results: Array<{ author: string; rating: number; date: string; text: string }> = []
          document.querySelectorAll('[data-review-id], .jftiEf').forEach(el => {
            const author = el.querySelector('.d4r55')?.textContent?.trim() || ''
            const rLabel = el.querySelector('[role="img"][aria-label*="star"]')?.getAttribute('aria-label') || ''
            const rm = rLabel.match(/(\d)/)
            const rating = rm ? parseInt(rm[1]) : 0
            const date = el.querySelector('.rsqaWe')?.textContent?.trim() || ''
            const text = el.querySelector('.wiI7pd')?.textContent?.trim() || ''
            if (author && text) results.push({ author, rating, date, text })
          })
          return results
        })

        const existingKeys = new Set(reviews.map(r => `${r.author}|${r.text.slice(0, 50)}`))
        for (const r of lowestReviews) {
          const key = `${r.author}|${r.text.slice(0, 50)}`
          if (!existingKeys.has(key)) {
            existingKeys.add(key)
            reviews.push({
              ...r,
              sentiment: r.rating >= 4 ? 'positive' : r.rating <= 2 ? 'negative' : 'neutral',
            })
          }
        }
        console.log(`[Stagehand] Total after lowest sort: ${reviews.length}`)
      } catch {
        console.log('[Stagehand] Lowest sort skipped')
      }
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

    console.log(`[Stagehand] Done: "${business.name}" — ${reviews.length} reviews`)

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
