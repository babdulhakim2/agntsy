import { NextRequest } from 'next/server'
import { discoverBusiness } from '@/lib/browserbase'
import { analyzeBusinessReviews } from '@/lib/analyzer'
import { storeBusiness, storeAnalysis } from '@/lib/redis-client'

/**
 * Streaming discover + analyze endpoint.
 * Sends SSE events as the pipeline progresses so the frontend can show
 * the Browserbase live session embed WHILE scraping is happening.
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const mapsUrl = body.maps_url || body.mapsUrl || body.url
  if (!mapsUrl) {
    return new Response(JSON.stringify({ error: 'maps_url required' }), { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Phase 1: Discover
        send('step', { step: 'connecting', message: 'Launching browser agent...' })

        const discovery = await discoverBusiness(mapsUrl)
        const { business, browserbaseSessionId, browserbaseSessionUrl } = discovery

        // Fetch the embeddable live view URL from Browserbase API
        if (browserbaseSessionId && process.env.BROWSERBASE_API_KEY) {
          try {
            const liveRes = await fetch(
              `https://api.browserbase.com/v1/sessions/${browserbaseSessionId}/debug`,
              { headers: { 'x-bb-api-key': process.env.BROWSERBASE_API_KEY } }
            )
            if (liveRes.ok) {
              const liveData = await liveRes.json()
              const embedUrl = liveData.debuggerFullscreenUrl || liveData.debuggerUrl || browserbaseSessionUrl
              send('session', {
                sessionUrl: browserbaseSessionUrl || `https://www.browserbase.com/sessions/${browserbaseSessionId}`,
                liveViewUrl: embedUrl,
                sessionId: browserbaseSessionId,
              })
              console.log('[Stream] Live view URL:', embedUrl)
            } else {
              send('session', {
                sessionUrl: browserbaseSessionUrl || `https://www.browserbase.com/sessions/${browserbaseSessionId}`,
                sessionId: browserbaseSessionId,
              })
            }
          } catch {
            send('session', {
              sessionUrl: browserbaseSessionUrl || `https://www.browserbase.com/sessions/${browserbaseSessionId}`,
              sessionId: browserbaseSessionId,
            })
          }
        } else if (browserbaseSessionUrl) {
          send('session', { sessionUrl: browserbaseSessionUrl })
        }

        send('step', { step: 'extracting_info', message: 'Business info extracted' })
        send('business', {
          name: business.name,
          type: business.type,
          rating: business.rating,
          review_count: business.review_count,
          address: business.address,
          reviews_scraped: business.reviews.length,
        })

        await storeBusiness(business.id, business)

        // Phase 2: Analyze
        send('step', { step: 'analyzing', message: 'AI analyzing reviews...' })

        let analysis
        if (process.env.OPENAI_API_KEY) {
          try {
            analysis = await analyzeBusinessReviews(business)
            await storeAnalysis(business.id, analysis)
          } catch (err) {
            console.error('[Stream] Analysis failed:', err)
          }
        }

        send('step', { step: 'complete', message: 'Discovery complete!' })
        send('complete', {
          business,
          analysis: analysis || null,
          browserbaseSessionId,
          browserbaseSessionUrl,
        })
      } catch (err: any) {
        send('error', { message: err?.message || 'Pipeline failed' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
