// In-memory store (Redis integration TODO when key available)
const store = new Map<string, string>()

async function set(key: string, value: string): Promise<void> {
  store.set(key, value)
}

async function get(key: string): Promise<string | null> {
  return store.get(key) || null
}

export async function storeBusiness(id: string, data: unknown): Promise<void> {
  await set(`business:${id}`, JSON.stringify(data))
}

export async function getBusiness(id: string): Promise<unknown | null> {
  const d = await get(`business:${id}`)
  return d ? JSON.parse(d) : null
}

export async function storeAnalysis(id: string, data: unknown): Promise<void> {
  await set(`analysis:${id}`, JSON.stringify(data))
}

export async function getAnalysis(id: string): Promise<unknown | null> {
  const d = await get(`analysis:${id}`)
  return d ? JSON.parse(d) : null
}

export async function storeWorkflows(id: string, data: unknown): Promise<void> {
  await set(`workflows:${id}`, JSON.stringify(data))
}

export async function getWorkflows(id: string): Promise<unknown | null> {
  const d = await get(`workflows:${id}`)
  return d ? JSON.parse(d) : null
}
