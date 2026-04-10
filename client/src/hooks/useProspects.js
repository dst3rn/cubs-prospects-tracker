import { useQuery } from '@tanstack/react-query'
import { fetchProspects, fetchProspect, fetchLatestGames } from '../services/api'

export function useProspects(params = {}) {
  return useQuery({
    queryKey: ['prospects', params],
    queryFn: () => fetchProspects(params)
  })
}

export function useLatestGames() {
  return useQuery({
    queryKey: ['latestGames'],
    queryFn: fetchLatestGames,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

export function useProspect(id) {
  return useQuery({
    queryKey: ['prospect', id],
    queryFn: () => fetchProspect(id),
    enabled: !!id
  })
}
