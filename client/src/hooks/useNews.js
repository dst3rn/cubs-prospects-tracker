import { useQuery } from '@tanstack/react-query'
import { fetchNews, fetchNewsSources } from '../services/api'

export function useNews(page = 1, source = null) {
  return useQuery({
    queryKey: ['news', page, source],
    queryFn: () => fetchNews(page, source)
  })
}

export function useNewsSources() {
  return useQuery({
    queryKey: ['news-sources'],
    queryFn: fetchNewsSources
  })
}
