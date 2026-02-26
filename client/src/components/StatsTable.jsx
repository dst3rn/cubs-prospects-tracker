import { useState } from 'react'
import { Link } from 'react-router-dom'
import TrendIndicator from './TrendIndicator'

function getStatsForPeriod(prospect, timePeriod) {
  switch (timePeriod) {
    case '7': return prospect.rolling7
    case '14': return prospect.rolling14
    case '28': return prospect.rolling28
    default: return prospect.seasonStats
  }
}

function MobileProspectRow({ prospect, isPitcher, formatStat, timePeriod }) {
  const stats = getStatsForPeriod(prospect, timePeriod)

  return (
    <Link
      to={`/prospect/${prospect.id}`}
      className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm active:bg-gray-50"
    >
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cubs-blue text-white text-xs font-bold flex-shrink-0">
        {prospect.pipeline_rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 truncate">{prospect.name}</p>
          <TrendIndicator trend={prospect.trend} />
        </div>
        <p className="text-xs text-gray-500">{prospect.position} • {prospect.current_team}</p>
      </div>
      <div className="flex gap-3 text-right flex-shrink-0">
        {isPitcher ? (
          <>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">ERA</p>
              <p className="text-sm font-semibold font-mono">{formatStat(stats?.era, 2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">K</p>
              <p className="text-sm font-semibold">{stats?.strikeoutsPitching || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">WHIP</p>
              <p className="text-sm font-semibold font-mono">{formatStat(stats?.whip, 2)}</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">AVG</p>
              <p className="text-sm font-semibold font-mono">{formatStat(stats?.avg)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">OPS</p>
              <p className="text-sm font-semibold font-mono">{formatStat(stats?.ops)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">HR</p>
              <p className="text-sm font-semibold">{stats?.homeRuns || '-'}</p>
            </div>
          </>
        )}
      </div>
    </Link>
  )
}

export default function StatsTable({ prospects, onSort, timePeriod = 'season' }) {
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
          <span>{sortDirection === 'asc' ? '\u2191' : '\u2193'}</span>
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
      {/* Hitters */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Position Players</h3>

        {/* Mobile compact list */}
        <div className="md:hidden space-y-2">
          {hitters.map((prospect) => (
            <MobileProspectRow key={prospect.id} prospect={prospect} isPitcher={false} formatStat={formatStat} timePeriod={timePeriod} />
          ))}
          {hitters.length === 0 && (
            <p className="text-center text-gray-500 py-8">No position players found</p>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
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
              {hitters.map((prospect) => {
                const stats = getStatsForPeriod(prospect, timePeriod)
                return (
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
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{stats?.games || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-mono">{formatStat(stats?.avg)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-mono">{formatStat(stats?.obp)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-mono">{formatStat(stats?.slg)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-mono font-semibold">{formatStat(stats?.ops)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{stats?.homeRuns || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{stats?.rbis || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{stats?.stolenBases || '-'}</td>
                  </tr>
                )
              })}
              {hitters.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-3 py-8 text-center text-gray-500">No position players found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pitchers */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Pitchers</h3>

        {/* Mobile compact list */}
        <div className="md:hidden space-y-2">
          {pitchers.map((prospect) => (
            <MobileProspectRow key={prospect.id} prospect={prospect} isPitcher={true} formatStat={formatStat} timePeriod={timePeriod} />
          ))}
          {pitchers.length === 0 && (
            <p className="text-center text-gray-500 py-8">No pitchers found</p>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
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
              {pitchers.map((prospect) => {
                const stats = getStatsForPeriod(prospect, timePeriod)
                return (
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
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{stats?.wins || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{stats?.losses || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-mono font-semibold">{formatStat(stats?.era, 2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-mono">{formatStat(stats?.whip, 2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{stats?.inningsPitched || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{stats?.strikeoutsPitching || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{stats?.walksAllowed || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{stats?.saves || '-'}</td>
                  </tr>
                )
              })}
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
