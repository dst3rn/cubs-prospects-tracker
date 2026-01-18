const API_BASE = '/api'

export async function fetchProspects(params = {}) {
  const searchParams = new URLSearchParams(params)
  const response = await fetch(`${API_BASE}/prospects?${searchParams}`)
  if (!response.ok) throw new Error('Failed to fetch prospects')
  return response.json()
}

export async function fetchProspect(id) {
  const response = await fetch(`${API_BASE}/prospects/${id}`)
  if (!response.ok) throw new Error('Failed to fetch prospect')
  return response.json()
}

export async function fetchStats(playerId, days = null) {
  const params = days ? `?days=${days}` : ''
  const response = await fetch(`${API_BASE}/stats/${playerId}${params}`)
  if (!response.ok) throw new Error('Failed to fetch stats')
  return response.json()
}

export async function fetchBattingLeaders(params = {}) {
  const searchParams = new URLSearchParams(params)
  const response = await fetch(`${API_BASE}/stats/leaders/batting?${searchParams}`)
  if (!response.ok) throw new Error('Failed to fetch batting leaders')
  return response.json()
}

export async function fetchPitchingLeaders(params = {}) {
  const searchParams = new URLSearchParams(params)
  const response = await fetch(`${API_BASE}/stats/leaders/pitching?${searchParams}`)
  if (!response.ok) throw new Error('Failed to fetch pitching leaders')
  return response.json()
}

export async function fetchNews(page = 1, source = null) {
  const params = new URLSearchParams({ page, limit: 20 })
  if (source) params.append('source', source)
  const response = await fetch(`${API_BASE}/news?${params}`)
  if (!response.ok) throw new Error('Failed to fetch news')
  return response.json()
}

export async function fetchNewsSources() {
  const response = await fetch(`${API_BASE}/news/sources`)
  if (!response.ok) throw new Error('Failed to fetch news sources')
  return response.json()
}

export async function refreshStats() {
  const response = await fetch(`${API_BASE}/admin/refresh/stats`, { method: 'POST' })
  if (!response.ok) throw new Error('Failed to refresh stats')
  return response.json()
}

export async function refreshNews() {
  const response = await fetch(`${API_BASE}/admin/refresh/news`, { method: 'POST' })
  if (!response.ok) throw new Error('Failed to refresh news')
  return response.json()
}
