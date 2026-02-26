import { useState } from 'react'

export default function RollingStats({ seasonStats, rolling7, rolling14, rolling28, isPitcher }) {
  const [selectedPeriod, setSelectedPeriod] = useState('season')

  const periods = [
    { key: 'season', label: 'Season', data: seasonStats },
    { key: '28', label: '28 Days', data: rolling28 },
    { key: '14', label: '14 Days', data: rolling14 },
    { key: '7', label: '7 Days', data: rolling7 }
  ]

  const currentData = periods.find(p => p.key === selectedPeriod)?.data

  const formatStat = (value, decimals = 3) => {
    if (value === null || value === undefined) return '-'
    return typeof value === 'number' ? value.toFixed(decimals) : value
  }

  const getComparison = (current, season, lowerIsBetter = false) => {
    if (!current || !season || season === 0) return null
    const diff = ((current - season) / season) * 100
    if (Math.abs(diff) < 5) return null
    if (lowerIsBetter) {
      return diff < 0 ? 'positive' : 'negative'
    }
    return diff > 0 ? 'positive' : 'negative'
  }

  const StatBox = ({ label, value, decimals = 3, compare = null, lowerIsBetter = false }) => {
    const comparisonClass = compare
      ? getComparison(value, compare, lowerIsBetter)
      : null

    return (
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <p className="text-xs text-gray-500 uppercase">{label}</p>
        <p className={`text-xl font-bold ${comparisonClass === 'positive' ? 'text-green-600' : comparisonClass === 'negative' ? 'text-red-600' : ''}`}>
          {formatStat(value, decimals)}
        </p>
      </div>
    )
  }

  if (!currentData && selectedPeriod === 'season') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Season Stats</h3>
        <p className="text-gray-500 text-center py-4">No stats available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Performance</h3>
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

      {!currentData ? (
        <p className="text-gray-500 text-center py-4">No data for this period</p>
      ) : isPitcher ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="ERA" value={currentData.era} decimals={2} compare={seasonStats?.era} lowerIsBetter />
          <StatBox label="WHIP" value={currentData.whip} decimals={2} compare={seasonStats?.whip} lowerIsBetter />
          <StatBox label="Strikeouts" value={currentData.strikeoutsPitching} decimals={0} compare={seasonStats?.strikeoutsPitching} />
          <StatBox label="Innings" value={currentData.inningsPitched} decimals={1} />
          <StatBox label="Wins" value={currentData.wins} decimals={0} />
          <StatBox label="Losses" value={currentData.losses} decimals={0} />
          <StatBox label="Saves" value={currentData.saves} decimals={0} />
          <StatBox label="Walks" value={currentData.walksAllowed} decimals={0} compare={seasonStats?.walksAllowed} lowerIsBetter />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="AVG" value={currentData.avg} compare={seasonStats?.avg} />
          <StatBox label="OBP" value={currentData.obp} compare={seasonStats?.obp} />
          <StatBox label="SLG" value={currentData.slg} compare={seasonStats?.slg} />
          <StatBox label="OPS" value={currentData.ops} compare={seasonStats?.ops} />
          <StatBox label="Home Runs" value={currentData.homeRuns} decimals={0} />
          <StatBox label="RBIs" value={currentData.rbis} decimals={0} />
          <StatBox label="Stolen Bases" value={currentData.stolenBases} decimals={0} />
          <StatBox label="Games" value={currentData.games} decimals={0} />
        </div>
      )}

      {selectedPeriod !== 'season' && seasonStats && (
        <p className="text-xs text-gray-400 mt-4 text-center">
          Green indicates better than season average, red indicates worse
        </p>
      )}
    </div>
  )
}
