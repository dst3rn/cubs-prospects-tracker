import { useState } from 'react'
import { Link } from 'react-router-dom'
import TrendIndicator from './TrendIndicator'

export default function StatsTable({ prospects, onSort }) {
  const [sortColumn, setSortColumn] = useState('pipeline_rank')
  const [sortDirection, setSortDirection] = useState('asc')

  const handleSort = (column) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(column)
    setSortDirection(newDirection)
    onSort?.(column, newDirection)
  }

  const SortHeader = ({ column, children }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortColumn === column && (
          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  )

  const formatStat = (value, decimals = 3) => {
    if (value === null || value === undefined) return '-'
    return typeof value === 'number' ? value.toFixed(decimals) : value
  }

  // Separate hitters and pitchers
  const hitters = prospects.filter(p => !p.isPitcher)
  const pitchers = prospects.filter(p => p.isPitcher)

  return (
    <div className="space-y-8">
      {/* Hitters Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Position Players</h3>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader column="pipeline_rank">Rank</SortHeader>
                <SortHeader column="name">Name</SortHeader>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">G</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">AVG</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">OBP</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">SLG</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">OPS</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">HR</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">RBI</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">SB</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hitters.map((prospect) => (
                <tr key={prospect.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cubs-blue text-white text-xs font-bold">
                      {prospect.pipeline_rank}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link to={`/prospect/${prospect.id}`} className="text-cubs-blue hover:underline font-medium">
                      {prospect.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{prospect.position}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{prospect.current_team}</td>
                  <td className="px-3 py-2 whitespace-nowrap"><TrendIndicator trend={prospect.trend} /></td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{prospect.seasonStats?.games || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-mono">{formatStat(prospect.seasonStats?.avg)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-mono">{formatStat(prospect.seasonStats?.obp)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-mono">{formatStat(prospect.seasonStats?.slg)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-mono font-semibold">{formatStat(prospect.seasonStats?.ops)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{prospect.seasonStats?.homeRuns || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{prospect.seasonStats?.rbis || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{prospect.seasonStats?.stolenBases || '-'}</td>
                </tr>
              ))}
              {hitters.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-3 py-8 text-center text-gray-500">No position players found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pitchers Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Pitchers</h3>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader column="pipeline_rank">Rank</SortHeader>
                <SortHeader column="name">Name</SortHeader>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">W</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">L</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">ERA</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">WHIP</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">IP</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">K</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">BB</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">SV</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pitchers.map((prospect) => (
                <tr key={prospect.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cubs-blue text-white text-xs font-bold">
                      {prospect.pipeline_rank}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link to={`/prospect/${prospect.id}`} className="text-cubs-blue hover:underline font-medium">
                      {prospect.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{prospect.position}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{prospect.current_team}</td>
                  <td className="px-3 py-2 whitespace-nowrap"><TrendIndicator trend={prospect.trend} /></td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{prospect.seasonStats?.wins || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{prospect.seasonStats?.losses || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-mono font-semibold">{formatStat(prospect.seasonStats?.era, 2)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-mono">{formatStat(prospect.seasonStats?.whip, 2)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{prospect.seasonStats?.inningsPitched || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{prospect.seasonStats?.strikeoutsPitching || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{prospect.seasonStats?.walksAllowed || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{prospect.seasonStats?.saves || '-'}</td>
                </tr>
              ))}
              {pitchers.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-3 py-8 text-center text-gray-500">No pitchers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
