import { useState } from 'react'
import { useNews, useNewsSources } from '../hooks/useNews'

export default function NewsFeed() {
  const [page, setPage] = useState(1)
  const [selectedSource, setSelectedSource] = useState(null)

  const { data: newsData, isLoading, error } = useNews(page, selectedSource)
  const { data: sources } = useNewsSources()

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Cubs News</h3>
        <p className="text-red-500">Failed to load news</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Cubs News</h3>
        {sources && sources.length > 0 && (
          <select
            value={selectedSource || ''}
            onChange={(e) => {
              setSelectedSource(e.target.value || null)
              setPage(1)
            }}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="">All Sources</option>
            {sources.map((source) => (
              <option key={source.source} value={source.source}>
                {source.source} ({source.article_count})
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : newsData?.articles?.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No news articles found</p>
      ) : (
        <div className="space-y-4">
          {newsData?.articles?.map((article) => (
            <article key={article.id} className="border-b border-gray-100 pb-4 last:border-0">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
              >
                <div className="flex gap-3">
                  {article.image_url && (
                    <img
                      src={article.image_url}
                      alt=""
                      className="w-16 h-16 object-cover rounded flex-shrink-0"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 line-clamp-2 text-sm">
                      {article.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {article.source} • {formatDate(article.published_at)}
                    </p>
                    {article.summary && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>
      )}

      {newsData?.pagination && newsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {newsData.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= newsData.pagination.totalPages}
            className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
