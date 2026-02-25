import { useParams, Link } from 'react-router-dom'
import { useProspect } from '../hooks/useProspects'
import TrendIndicator from '../components/TrendIndicator'
import { useState } from 'react'

export default function ProspectDetail() {
  const { id } = useParams()
  const { data: prospect, isLoading, error } = useProspect(id)
  const [selectedPeriod, setSelectedPeriod] = useState('season')

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !prospect) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-500">Failed to load prospect details.</p>
        <Link to="/" className="text-cubs-blue hover:underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatStat = (value, decimals = 3) => {
    if (value === null || value === undefined || isNaN(value)) return '-'
    return Number(value).toFixed(decimals)
  }

  const periods = [
    { key: 'season', label: 'Season', data: prospect.seasonStats },
    { key: '30', label: 'Last 30 Days', data: prospect.rolling30 },
    { key: '14', label: 'Last 14 Days', data: prospect.rolling14 },
    { key: '7', label: 'Last 7 Days', data: prospect.rolling7 }
  ]

  const currentPeriodData = periods.find(p => p.key === selectedPeriod)?.data

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/" className="text-cubs-blue hover:underline text-sm flex items-center gap-1 py-2">
        <span>←</span> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-cubs-blue text-white rounded-full flex items-center justify-center font-bold text-2xl">
              {prospect.pipeline_rank}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{prospect.name}</h1>
              <p className="text-gray-600">
                {prospect.position} • {prospect.current_team}
              </p>
              <p className="text-sm text-gray-500">{prospect.current_level}</p>
            </div>
          </div>
          <TrendIndicator trend={prospect.trend} />
        </div>

        {/* Player Info */}
        {prospect.playerInfo && (
          <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {prospect.playerInfo.birthDate && (
              <div>
                <p className="text-gray-500">Born</p>
                <p className="font-medium">{formatDate(prospect.playerInfo.birthDate)}</p>
                {prospect.playerInfo.birthCity && (
                  <p className="text-xs text-gray-400">
                    {prospect.playerInfo.birthCity}, {prospect.playerInfo.birthCountry}
                  </p>
                )}
              </div>
            )}
            {prospect.playerInfo.height && (
              <div>
                <p className="text-gray-500">Height</p>
                <p className="font-medium">{prospect.playerInfo.height}</p>
              </div>
            )}
            {prospect.playerInfo.weight && (
              <div>
                <p className="text-gray-500">Weight</p>
                <p className="font-medium">{prospect.playerInfo.weight} lbs</p>
              </div>
            )}
            {(prospect.playerInfo.batSide || prospect.playerInfo.pitchHand) && (
              <div>
                <p className="text-gray-500">Bats/Throws</p>
                <p className="font-medium">
                  {prospect.playerInfo.batSide || '-'}/{prospect.playerInfo.pitchHand || '-'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Career Stats */}
      {prospect.careerStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Career Stats</h3>
          {prospect.isPitcher ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">Games</p>
                <p className="text-xl font-bold">{prospect.careerStats.games || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">W-L</p>
                <p className="text-xl font-bold">{prospect.careerStats.wins || 0}-{prospect.careerStats.losses || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">ERA</p>
                <p className="text-xl font-bold">{formatStat(prospect.careerStats.era, 2)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">WHIP</p>
                <p className="text-xl font-bold">{formatStat(prospect.careerStats.whip, 2)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">IP</p>
                <p className="text-xl font-bold">{prospect.careerStats.inningsPitched || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">K</p>
                <p className="text-xl font-bold">{prospect.careerStats.strikeoutsPitching || 0}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">Games</p>
                <p className="text-xl font-bold">{prospect.careerStats.games || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">AVG</p>
                <p className="text-xl font-bold">{formatStat(prospect.careerStats.avg)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">OPS</p>
                <p className="text-xl font-bold">{formatStat(prospect.careerStats.ops)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">HR</p>
                <p className="text-xl font-bold">{prospect.careerStats.homeRuns || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">RBI</p>
                <p className="text-xl font-bold">{prospect.careerStats.rbis || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">SB</p>
                <p className="text-xl font-bold">{prospect.careerStats.stolenBases || 0}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rolling Stats with Period Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Performance by Period</h3>
          <div className="flex gap-1 flex-wrap">
            {periods.map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-4 py-2 text-sm rounded-full transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-cubs-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {!currentPeriodData ? (
          <p className="text-gray-500 text-center py-8">No stats available for this period</p>
        ) : prospect.isPitcher ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="ERA" value={formatStat(currentPeriodData.era, 2)} season={prospect.seasonStats?.era} lowerIsBetter />
            <StatCard label="WHIP" value={formatStat(currentPeriodData.whip, 2)} season={prospect.seasonStats?.whip} lowerIsBetter />
            <StatCard label="K" value={currentPeriodData.strikeoutsPitching || 0} />
            <StatCard label="IP" value={currentPeriodData.inningsPitched || 0} />
            <StatCard label="Wins" value={currentPeriodData.wins || 0} />
            <StatCard label="Losses" value={currentPeriodData.losses || 0} />
            <StatCard label="Saves" value={currentPeriodData.saves || 0} />
            <StatCard label="BB" value={currentPeriodData.walksAllowed || 0} season={prospect.seasonStats?.walksAllowed} lowerIsBetter />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="AVG" value={formatStat(currentPeriodData.avg)} season={prospect.seasonStats?.avg} selectedPeriod={selectedPeriod} />
            <StatCard label="OBP" value={formatStat(currentPeriodData.obp)} season={prospect.seasonStats?.obp} selectedPeriod={selectedPeriod} />
            <StatCard label="SLG" value={formatStat(currentPeriodData.slg)} season={prospect.seasonStats?.slg} selectedPeriod={selectedPeriod} />
            <StatCard label="OPS" value={formatStat(currentPeriodData.ops)} season={prospect.seasonStats?.ops} selectedPeriod={selectedPeriod} />
            <StatCard label="HR" value={currentPeriodData.homeRuns || 0} />
            <StatCard label="RBI" value={currentPeriodData.rbis || 0} />
            <StatCard label="SB" value={currentPeriodData.stolenBases || 0} />
            <StatCard label="Games" value={currentPeriodData.games || 0} />
          </div>
        )}

        {selectedPeriod !== 'season' && prospect.seasonStats && (
          <p className="text-xs text-gray-400 mt-4 text-center">
            Compared to season: <span className="text-green-600">green = better</span>, <span className="text-red-600">red = worse</span>
          </p>
        )}
      </div>

      {/* Year by Year Stats */}
      {prospect.yearByYear && prospect.yearByYear.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Year-by-Year Stats</h3>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-3">
            {prospect.yearByYear.map((year, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{year.season}</span>
                  <span className="text-xs text-gray-500">{year.team} ({year.level})</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  {prospect.isPitcher ? (
                    <>
                      <div><p className="text-[10px] text-gray-400">ERA</p><p className="font-semibold font-mono">{formatStat(year.stats?.era, 2)}</p></div>
                      <div><p className="text-[10px] text-gray-400">W-L</p><p className="font-semibold">{year.stats?.wins || 0}-{year.stats?.losses || 0}</p></div>
                      <div><p className="text-[10px] text-gray-400">K</p><p className="font-semibold">{year.stats?.strikeoutsPitching || 0}</p></div>
                      <div><p className="text-[10px] text-gray-400">WHIP</p><p className="font-semibold font-mono">{formatStat(year.stats?.whip, 2)}</p></div>
                    </>
                  ) : (
                    <>
                      <div><p className="text-[10px] text-gray-400">AVG</p><p className="font-semibold font-mono">{formatStat(year.stats?.avg)}</p></div>
                      <div><p className="text-[10px] text-gray-400">OPS</p><p className="font-semibold font-mono">{formatStat(year.stats?.ops || (parseFloat(year.stats?.obp || 0) + parseFloat(year.stats?.slg || 0)))}</p></div>
                      <div><p className="text-[10px] text-gray-400">HR</p><p className="font-semibold">{year.stats?.homeRuns || 0}</p></div>
                      <div><p className="text-[10px] text-gray-400">RBI</p><p className="font-semibold">{year.stats?.rbis || 0}</p></div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                  {prospect.isPitcher ? (
                    <>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">G</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">W</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">L</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">ERA</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">IP</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">K</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">WHIP</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">G</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">AB</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">AVG</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">OBP</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">SLG</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">HR</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">RBI</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prospect.yearByYear.map((year, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">{year.season}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{year.team}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{year.level}</td>
                    {prospect.isPitcher ? (
                      <>
                        <td className="px-3 py-2 text-right text-sm">{year.stats?.games || 0}</td>
                        <td className="px-3 py-2 text-right text-sm">{year.stats?.wins || 0}</td>
                        <td className="px-3 py-2 text-right text-sm">{year.stats?.losses || 0}</td>
                        <td className="px-3 py-2 text-right text-sm font-mono">{formatStat(year.stats?.era, 2)}</td>
                        <td className="px-3 py-2 text-right text-sm">{year.stats?.inningsPitched || 0}</td>
                        <td className="px-3 py-2 text-right text-sm">{year.stats?.strikeoutsPitching || 0}</td>
                        <td className="px-3 py-2 text-right text-sm font-mono">{formatStat(year.stats?.whip, 2)}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-right text-sm">{year.stats?.games || 0}</td>
                        <td className="px-3 py-2 text-right text-sm">{year.stats?.atBats || 0}</td>
                        <td className="px-3 py-2 text-right text-sm font-mono">{formatStat(year.stats?.avg)}</td>
                        <td className="px-3 py-2 text-right text-sm font-mono">{formatStat(year.stats?.obp)}</td>
                        <td className="px-3 py-2 text-right text-sm font-mono">{formatStat(year.stats?.slg)}</td>
                        <td className="px-3 py-2 text-right text-sm">{year.stats?.homeRuns || 0}</td>
                        <td className="px-3 py-2 text-right text-sm">{year.stats?.rbis || 0}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, season, lowerIsBetter = false, selectedPeriod }) {
  let colorClass = ''

  if (season !== undefined && selectedPeriod !== 'season') {
    const current = parseFloat(value)
    const seasonVal = parseFloat(season)

    if (!isNaN(current) && !isNaN(seasonVal) && seasonVal !== 0) {
      const diff = ((current - seasonVal) / seasonVal) * 100

      if (Math.abs(diff) > 5) {
        if (lowerIsBetter) {
          colorClass = diff < 0 ? 'text-green-600' : 'text-red-600'
        } else {
          colorClass = diff > 0 ? 'text-green-600' : 'text-red-600'
        }
      }
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className="text-xs text-gray-500 uppercase mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  )
}
