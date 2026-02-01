import type { BusinessInfo } from './discover-types'
import { MOCK_BUSINESS } from './mock-discover'

function generateId(): string {
  return 'biz_' + Math.random().toString(36).substring(2, 15)
}

export async function discoverBusiness(mapsUrl: string): Promise<{ business: BusinessInfo }> {
  // TODO: Wire up Browserbase/Stagehand when API key is available
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
