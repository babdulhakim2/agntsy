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
    // ─── Navigate ───
    await page.goto(mapsUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
    // Wait longer for Google Maps to fully render (it's heavy JS)
    await page.waitForTimeout(15000)

    // Dismiss consent / cookie dialogs (varies by region)
    try {
      const consentSelectors = [
        'button:has-text("Accept all")',
        'button:has-text("Accept")',
        'button:has-text("Agree")',
        'form[action*="consent"] button',
        '[aria-label="Accept all"]',
        'button.VfPpkd-LgbsSe[jsname]',
      ]
      for (const sel of consentSelectors) {
        const btn = page.locator(sel)
        if (await btn.count() > 0) {
          await btn.first().click()
          await page.waitForTimeout(3000)
          break
        }
      }
    } catch {}

    const title = await page.title()
    console.log(`[Stagehand] Title: "${title}"`)

    // Click first result if we're on a search results page
    if (title === 'Google Maps' || !title.includes(' - Google Maps')) {
      try {
        await page.evaluate(() => {
          const selectors = [
            '[role="feed"] > div a',
            '.Nv2PK a',
            'a[href*="/maps/place/"]',
            '.hfpxzc',
          ]
          for (const sel of selectors) {
            const el = document.querySelector(sel)
            if (el) { (el as HTMLElement).click(); return true }
          }
          return false
        })
        await page.waitForTimeout(8000)
      } catch {}
    }

    // ─── Extract business info ───
    const info = await page.evaluate(() => {
      const name = document.querySelector('h1')?.textContent?.trim() || ''

      // Rating - try multiple approaches
      let rating = 0
      const rImgs = document.querySelectorAll('[role="img"][aria-label*="star"]')
      for (const img of rImgs) {
        const label = img.getAttribute('aria-label') || ''
        const m = label.match(/([\d.]+)/)
        if (m) { rating = parseFloat(m[1]); break }
      }
      if (!rating) {
        // Backup: look for rating text like "4.5"
        const spans = document.querySelectorAll('span.ceNzKf, span.fontDisplayLarge, div.fontDisplayLarge')
        for (const s of spans) {
          const t = s.textContent?.trim() || ''
          if (/^\d\.\d$/.test(t)) { rating = parseFloat(t); break }
        }
      }

      // Review count - try multiple patterns
      let reviewCount = 0
      const allText = document.querySelectorAll('button, span, a, div')
      for (const el of allText) {
        const t = el.textContent || ''
        // Match "1,234 reviews" or "(1,234)"
        const m = t.match(/([\d,]+)\s*reviews?/i) || t.match(/\(([\d,]+)\)/)
        if (m) {
          const n = parseInt(m[1].replace(/,/g, ''))
          if (n > reviewCount) reviewCount = n
        }
      }

      // Business type
      let type = ''
      const typeSelectors = [
        'button[jsaction*="category"]',
        'button[jsaction*="pane.rating.category"]',
        '.DkEaL',
      ]
      for (const sel of typeSelectors) {
        const el = document.querySelector(sel)
        if (el) { type = el.textContent?.trim() || ''; break }
      }
      if (!type) {
        const spans = document.querySelectorAll('span, button')
        for (const el of spans) {
          const t = el.textContent?.trim() || ''
          if (/^(Coffee shop|Restaurant|Cafe|Bar|Bakery|Hotel|Store|Shop|Gym|Salon|Spa|Clinic|Dentist|Agency|Studio|Vietnamese|Thai|Chinese|Japanese|Italian|Mexican|Indian|Pizza|Burger|Sushi)/i.test(t) && t.length < 40) {
            type = t; break
          }
        }
      }

      // Address
      let address = ''
      const addrSelectors = [
        '[data-item-id="address"] .Io6YTe',
        'button[data-item-id="address"]',
        '[data-item-id="address"]',
        'button[aria-label*="Address"]',
      ]
      for (const sel of addrSelectors) {
        const el = document.querySelector(sel)
        if (el) {
          address = el.textContent?.trim() || ''
          if (address) break
        }
      }

      // Phone
      let phone = ''
      const phoneSelectors = [
        '[data-item-id*="phone"] .Io6YTe',
        'button[data-item-id*="phone"]',
        '[data-item-id*="phone"]',
      ]
      for (const sel of phoneSelectors) {
        const el = document.querySelector(sel)
        if (el) { phone = el.textContent?.trim() || ''; if (phone) break }
      }

      // Website
      let website = ''
      const wEl = document.querySelector('a[data-item-id="authority"]')
      if (wEl) website = wEl.getAttribute('href') || ''

      // Hours
      let hours = ''
      const hEl = document.querySelector('[aria-label*="Monday"], [aria-label*="hours"], .OqCZI')
      if (hEl) {
        const full = hEl.getAttribute('aria-label') || hEl.textContent?.trim() || ''
        hours = full.length > 200 ? full.slice(0, 200) + '...' : full
      }

      // Price level
      let priceLevel = ''
      const priceSelectors = ['[aria-label*="Price"]', 'span:has-text("$")']
      for (const sel of priceSelectors) {
        try {
          const el = document.querySelector(sel)
          if (el) { priceLevel = el.textContent?.trim() || ''; if (priceLevel) break }
        } catch {}
      }

      return { name, rating, reviewCount, type, address, phone, website, hours, priceLevel }
    })

    console.log(`[Stagehand] Business: "${info.name}" ${info.rating}★ (${info.reviewCount} reviews)`)

    // ─── Click to open Reviews ───
    let clickedReviews = false

    // Dump all clickable elements with "review" in text/label for debugging
    const reviewClickTargets = await page.evaluate(() => {
      const targets: string[] = []
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent?.trim() || ''
        const aria = el.getAttribute('aria-label') || ''
        const role = el.getAttribute('role') || ''
        const tag = el.tagName.toLowerCase()
        const jsaction = el.getAttribute('jsaction') || ''

        if (
          (/review/i.test(text) && text.length < 60) ||
          /review/i.test(aria) ||
          /review/i.test(jsaction)
        ) {
          const clickable = tag === 'button' || tag === 'a' || role === 'tab' || el.getAttribute('tabindex') !== null || jsaction
          targets.push(`<${tag} role="${role}" aria="${aria}" jsaction="${jsaction.slice(0, 60)}" text="${text.slice(0, 50)}" clickable=${!!clickable}>`)
        }
      })
      return targets
    })
    console.log('[Stagehand] Review click targets:', JSON.stringify(reviewClickTargets))

    // Strategy 1: Click the review count near rating (e.g. "415 reviews" or "(415)")
    try {
      clickedReviews = await page.evaluate(() => {
        // Look for elements containing review count pattern
        const allEls = document.querySelectorAll('button, a, span, div[role="button"], [tabindex]')
        for (const el of allEls) {
          const text = el.textContent?.trim() || ''
          // Match patterns like "415 reviews", "(415)", "Reviews"
          if (/^\d[\d,]*\s*reviews?$/i.test(text) || /^reviews$/i.test(text)) {
            console.log('[click] Clicking review element:', text, el.tagName)
            ;(el as HTMLElement).click()
            return true
          }
        }
        // Try role="tab" elements
        const tabs = document.querySelectorAll('[role="tab"]')
        for (const tab of tabs) {
          if (/review/i.test(tab.textContent || '') || /review/i.test(tab.getAttribute('aria-label') || '')) {
            console.log('[click] Clicking tab:', tab.textContent?.trim())
            ;(tab as HTMLElement).click()
            return true
          }
        }
        // Try the specific aria-label element found in debug
        const ariaEl = document.querySelector('[aria-label*="review"]')
        if (ariaEl) {
          console.log('[click] Clicking aria review element:', ariaEl.tagName, ariaEl.getAttribute('aria-label'))
          ;(ariaEl as HTMLElement).click()
          return true
        }
        // Try any element with jsaction containing "review"
        const jsEls = document.querySelectorAll('[jsaction*="review"]')
        for (const el of jsEls) {
          console.log('[click] Clicking jsaction review element')
          ;(el as HTMLElement).click()
          return true
        }
        return false
      })
      if (clickedReviews) {
        console.log('[Stagehand] Clicked a review element via DOM')
        await page.waitForTimeout(5000)
      }
    } catch (e) {
      console.log('[Stagehand] DOM review click error:', e)
    }

    // Strategy 2: Use Playwright locator to find and click Reviews tab
    if (!clickedReviews) {
      try {
        const reviewTab = page.locator('button:has-text("Reviews"), [role="tab"]:has-text("Reviews"), button:has-text("reviews")')
        if (await reviewTab.count() > 0) {
          await reviewTab.first().click()
          clickedReviews = true
          console.log('[Stagehand] Playwright locator clicked Reviews')
          await page.waitForTimeout(5000)
        }
      } catch (e) {
        console.log('[Stagehand] Playwright locator failed:', e)
      }
    }

    // Strategy 3: Click the star rating area or review summary to open reviews panel
    if (!clickedReviews) {
      try {
        clickedReviews = await page.evaluate(() => {
          // The star rating display is often clickable and opens reviews
          const starAreas = document.querySelectorAll('[role="img"][aria-label*="star"]')
          for (const star of starAreas) {
            const parent = star.closest('button, a, [role="button"]')
            if (parent) {
              ;(parent as HTMLElement).click()
              return true
            }
          }
          return false
        })
        if (clickedReviews) {
          console.log('[Stagehand] Clicked star rating area')
          await page.waitForTimeout(5000)
        }
      } catch {}
    }

    console.log(`[Stagehand] Reviews click result: ${clickedReviews}`)

    // Wait for reviews to actually load (scroll container becomes populated)
    let reviewsLoaded = false
    for (let attempt = 0; attempt < 12; attempt++) {
      const state = await page.evaluate(() => {
        const containers = document.querySelectorAll('.m6QErb')
        let maxHeight = 0
        for (const c of containers) {
          if (c.scrollHeight > maxHeight) maxHeight = c.scrollHeight
        }
        const reviewCount = document.querySelectorAll('[data-review-id], .jftiEf, .jJc9Ad').length
        return { maxHeight, reviewCount }
      })
      console.log(`[Stagehand] Wait check ${attempt + 1}: maxHeight=${state.maxHeight}, reviewCount=${state.reviewCount}`)

      if (state.reviewCount > 0 || state.maxHeight > 500) {
        reviewsLoaded = true
        console.log(`[Stagehand] Reviews loaded after ${attempt + 1} checks`)
        break
      }
      await page.waitForTimeout(2000)
    }

    if (!reviewsLoaded) {
      console.log('[Stagehand] WARNING: Reviews did not load — will try extraction anyway')
    }

    // ─── Debug: dump the DOM structure to find review containers ───
    const debugInfo = await page.evaluate(() => {
      // Check what review-like containers exist
      const containers: string[] = []
      const possibleContainers = [
        '[data-review-id]',
        '.jftiEf',
        '.jJc9Ad',
        '.GHT2ce',
        '.MyEned',
        '.bwb7ce',
        '.WMbnJf',
        // Generic fallbacks
        '[jsaction*="review"]',
        '[aria-label*="review"]',
      ]
      for (const sel of possibleContainers) {
        const count = document.querySelectorAll(sel).length
        if (count > 0) containers.push(`${sel}: ${count}`)
      }

      // Check scrollable containers
      const scrollables: string[] = []
      const scrollSelectors = [
        '.m6QErb.DxyBCb',
        '.m6QErb.XiKgde',
        '[tabindex="-1"].m6QErb',
        '.m6QErb',
        '.section-scrollbox',
        '[role="feed"]',
        '.e07Vkf',
      ]
      for (const sel of scrollSelectors) {
        const el = document.querySelector(sel)
        if (el) scrollables.push(`${sel}: height=${el.scrollHeight}`)
      }

      // Grab sample of text from potential review elements
      const sampleTexts: string[] = []
      const reviewCandidates = document.querySelectorAll('[data-review-id], .jftiEf, .jJc9Ad, .GHT2ce')
      for (let i = 0; i < Math.min(3, reviewCandidates.length); i++) {
        sampleTexts.push(reviewCandidates[i].textContent?.slice(0, 150) || '(empty)')
      }

      return { containers, scrollables, sampleTexts, bodyText: document.body.innerText.slice(0, 500) }
    })
    console.log('[Stagehand] Debug DOM:', JSON.stringify(debugInfo, null, 2))

    // ─── Scroll to load reviews ───
    const scrollContainerFound = await page.evaluate(() => {
      const selectors = [
        '.m6QErb.DxyBCb',
        '.m6QErb.XiKgde',
        '[tabindex="-1"].m6QErb',
        '.m6QErb',
        '.section-scrollbox',
        '[role="feed"]',
        '.e07Vkf',
      ]
      for (const sel of selectors) {
        const el = document.querySelector(sel)
        if (el && el.scrollHeight > 500) {
          (window as any).__reviewScrollContainer = sel
          return sel
        }
      }
      return null
    })
    console.log(`[Stagehand] Scroll container: ${scrollContainerFound}`)

    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => {
        const sel = (window as any).__reviewScrollContainer
        if (sel) {
          const el = document.querySelector(sel)
          if (el) el.scrollTop = el.scrollHeight
        }
        // Also try scrolling the main panel
        const panels = document.querySelectorAll('.m6QErb, .section-scrollbox, [role="main"]')
        for (const p of panels) {
          if (p.scrollHeight > p.clientHeight) {
            p.scrollTop = p.scrollHeight
          }
        }
      })
      await page.waitForTimeout(2000)
    }

    // ─── Expand truncated reviews ("More" buttons) ───
    await page.evaluate(() => {
      const moreButtons = document.querySelectorAll(
        'button.w8nwRe, button.M77dve, [jsaction*="review.expandReview"], button[aria-label="See more"]'
      )
      moreButtons.forEach(btn => (btn as HTMLElement).click())
    })
    await page.waitForTimeout(1500)

    // ─── Extract reviews with multiple selector strategies ───
    const domReviews = await page.evaluate(() => {
      const results: Array<{ author: string; rating: number; date: string; text: string }> = []
      const seen = new Set<string>()

      // Strategy 1: data-review-id elements (most reliable)
      const reviewEls = document.querySelectorAll('[data-review-id]')
      console.log(`[extract] Found ${reviewEls.length} [data-review-id] elements`)

      // Strategy 2: Common review container classes
      const altEls = document.querySelectorAll('.jftiEf, .jJc9Ad, .GHT2ce')
      console.log(`[extract] Found ${altEls.length} alt review elements`)

      const allReviewEls = reviewEls.length > 0 ? reviewEls : altEls

      allReviewEls.forEach(el => {
        // Author name - try multiple selectors
        let author = ''
        const authorSelectors = ['.d4r55', '.WNxzHc > div', '.TSUbDb a', 'a[href*="/contrib/"]', '.al6Kxe']
        for (const sel of authorSelectors) {
          const aEl = el.querySelector(sel)
          if (aEl) { author = aEl.textContent?.trim() || ''; if (author) break }
        }

        // Rating - from star images
        let rating = 0
        const starEl = el.querySelector('[role="img"][aria-label*="star"]')
        if (starEl) {
          const label = starEl.getAttribute('aria-label') || ''
          const m = label.match(/(\d)/)
          if (m) rating = parseInt(m[1])
        }
        if (!rating) {
          // Backup: count filled stars
          const stars = el.querySelectorAll('.hCCjke.google-symbols, .elGi1d, .hCCjke')
          if (stars.length > 0) rating = stars.length
        }

        // Date
        let date = ''
        const dateSelectors = ['.rsqaWe', '.xRkPPb', '.DU9Pgb', 'span.dehysf']
        for (const sel of dateSelectors) {
          const dEl = el.querySelector(sel)
          if (dEl) { date = dEl.textContent?.trim() || ''; if (date) break }
        }

        // Review text
        let text = ''
        const textSelectors = ['.wiI7pd', '.MyEned span', '.Jtu6Td span', '.review-full-text', '.bwb7ce']
        for (const sel of textSelectors) {
          const tEl = el.querySelector(sel)
          if (tEl) { text = tEl.textContent?.trim() || ''; if (text) break }
        }
        // Fallback: get longest text block in the review element
        if (!text) {
          const spans = el.querySelectorAll('span')
          let longest = ''
          spans.forEach(s => {
            const t = s.textContent?.trim() || ''
            if (t.length > longest.length && t.length > 20) longest = t
          })
          text = longest
        }

        if (text && text.length > 10) {
          // Use text as dedup key if no author
          const key = `${author || 'anon'}|${text.slice(0, 50)}`
          if (!seen.has(key)) {
            seen.add(key)
            results.push({ author: author || 'Anonymous', rating, date, text })
          }
        }
      })

      // Strategy 3: If still empty, try to find reviews by text pattern
      if (results.length === 0) {
        console.log('[extract] Trying text-pattern fallback')
        // Look for elements with star ratings that also have substantial text nearby
        document.querySelectorAll('[aria-label*="star"]').forEach(starEl => {
          const parent = starEl.closest('div[class]')
          if (!parent) return
          const container = parent.parentElement?.parentElement
          if (!container) return

          const label = starEl.getAttribute('aria-label') || ''
          const m = label.match(/(\d)/)
          const rating = m ? parseInt(m[1]) : 0

          // Find the longest text block near this star rating
          let text = ''
          container.querySelectorAll('span').forEach(s => {
            const t = s.textContent?.trim() || ''
            if (t.length > text.length && t.length > 30) text = t
          })

          if (text && rating) {
            const key = `star|${text.slice(0, 50)}`
            if (!seen.has(key)) {
              seen.add(key)
              results.push({ author: 'Reviewer', rating, date: '', text })
            }
          }
        })
      }

      return results
    })

    const reviews: Review[] = domReviews.map(r => ({
      ...r,
      sentiment: r.rating >= 4 ? 'positive' as const
        : r.rating <= 2 ? 'negative' as const
        : 'neutral' as const,
    }))

    console.log(`[Stagehand] Reviews scraped: ${reviews.length}`)

    // ─── If we have reviews, also try getting lowest-rated ones ───
    if (reviews.length > 0) {
      try {
        // Click sort button
        await page.evaluate(() => {
          const sortSelectors = [
            '[aria-label*="Sort"]',
            'button[data-value="sort"]',
            'button[aria-label*="sort"]',
          ]
          for (const sel of sortSelectors) {
            const el = document.querySelector(sel)
            if (el) { (el as HTMLElement).click(); return }
          }
          // Fallback: find "Most relevant" button
          document.querySelectorAll('button').forEach(b => {
            if (/most relevant|sort/i.test(b.textContent || '')) (b as HTMLElement).click()
          })
        })
        await page.waitForTimeout(2000)

        // Click "Lowest rating"
        await page.evaluate(() => {
          document.querySelectorAll('[role="menuitemradio"], [data-index], .fxNQSd').forEach(el => {
            if (/lowest/i.test(el.textContent || '')) (el as HTMLElement).click()
          })
        })
        await page.waitForTimeout(4000)

        // Scroll
        for (let i = 0; i < 4; i++) {
          await page.evaluate(() => {
            const sel = (window as any).__reviewScrollContainer
            if (sel) {
              const el = document.querySelector(sel)
              if (el) el.scrollTop = el.scrollHeight
            }
          })
          await page.waitForTimeout(1500)
        }

        // Expand
        await page.evaluate(() => {
          document.querySelectorAll('button.w8nwRe, button.M77dve, [jsaction*="review.expandReview"]').forEach(b =>
            (b as HTMLElement).click()
          )
        })
        await page.waitForTimeout(1000)

        // Extract lowest reviews
        const lowestReviews = await page.evaluate(() => {
          const results: Array<{ author: string; rating: number; date: string; text: string }> = []
          document.querySelectorAll('[data-review-id], .jftiEf, .jJc9Ad').forEach(el => {
            let author = ''
            for (const sel of ['.d4r55', '.WNxzHc > div', '.TSUbDb a', 'a[href*="/contrib/"]']) {
              const aEl = el.querySelector(sel)
              if (aEl) { author = aEl.textContent?.trim() || ''; if (author) break }
            }
            const rLabel = el.querySelector('[role="img"][aria-label*="star"]')?.getAttribute('aria-label') || ''
            const rm = rLabel.match(/(\d)/)
            const rating = rm ? parseInt(rm[1]) : 0
            let date = ''
            for (const sel of ['.rsqaWe', '.xRkPPb', '.DU9Pgb']) {
              const dEl = el.querySelector(sel)
              if (dEl) { date = dEl.textContent?.trim() || ''; if (date) break }
            }
            let text = ''
            for (const sel of ['.wiI7pd', '.MyEned span', '.Jtu6Td span']) {
              const tEl = el.querySelector(sel)
              if (tEl) { text = tEl.textContent?.trim() || ''; if (text) break }
            }
            if (text && text.length > 10) results.push({ author: author || 'Anonymous', rating, date, text })
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
      } catch (e) {
        console.log('[Stagehand] Lowest sort skipped:', e)
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
