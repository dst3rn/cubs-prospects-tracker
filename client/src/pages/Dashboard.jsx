import { useState } from 'react'
import { useProspects } from '../hooks/useProspects'
import StatsTable from '../components/StatsTable'
import ProspectCard from '../components/ProspectCard'
import NewsFeed from '../components/NewsFeed'

export default function Dashboard() {
  const [viewMode, setViewMode] = useState('table') // 'table' or 'cards'
  const [filters, setFilters] = useState({
    position: '',
    level: ''
  })

  const { data: prospects, isLoading, error } = useProspects(filters)

  const positions = ['C', 'SS', 'OF', '2B', '3B', '1B', 'SP', 'RP', 'LHP', 'RHP']
  const levels = ['Triple-A', 'Double-A', 'High-A', 'Single-A', 'Rookie']

  const handleSort = (column, direction) => {
    // Sort is handled locally since we have all data
    console.log('Sort by', column, direction)
  }

  return (
    <div className="space-y-6">
      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-3">
          <select
            value={filters.position}
            onChange={(e) => setFilters({ ...filters, position: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Positions</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          <select
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Levels</option>
            {levels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'table' ? 'bg-white shadow text-cubs-blue' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'cards' ? 'bg-white shadow text-cubs-blue' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cards
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {error ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-red-500">Failed to load prospects. Please try again.</p>
            </div>
          ) : isLoading ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : !prospects || prospects.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-center">No prospects found. Add prospects to get started.</p>
            </div>
          ) : viewMode === 'table' ? (
            <StatsTable prospects={prospects} onSort={handleSort} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prospects.map((prospect) => (
                <ProspectCard key={prospect.id} prospect={prospect} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - News Feed */}
        <div className="lg:col-span-1">
          <NewsFeed />
        </div>
      </div>
    </div>
  )
}
