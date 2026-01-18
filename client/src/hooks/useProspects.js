import { useQuery } from '@tanstack/react-query'
import { fetchProspects, fetchProspect } from '../services/api'

export function useProspects(params = {}) {
  return useQuery({
    queryKey: ['prospects', params],
    queryFn: () => fetchProspects(params)
  })
}

export function useProspect(id) {
  return useQuery({
    queryKey: ['prospect', id],
    queryFn: () => fetchProspect(id),
    enabled: !!id
  })
}
