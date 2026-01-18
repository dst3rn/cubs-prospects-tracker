import { Link } from 'react-router-dom'
import TrendIndicator from './TrendIndicator'

export default function ProspectCard({ prospect }) {
  const { seasonStats, isPitcher, trend } = prospect

  const formatStat = (value, decimals = 3) => {
    if (value === null || value === undefined) return '-'
    return typeof value === 'number' ? value.toFixed(decimals) : value
  }

  return (
    <Link
      to={`/prospect/${prospect.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cubs-blue text-white rounded-full flex items-center justify-center font-bold">
            {prospect.pipeline_rank}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{prospect.name}</h3>
            <p className="text-sm text-gray-500">
              {prospect.position} • {prospect.current_team}
            </p>
          </div>
        </div>
        <TrendIndicator trend={trend} />
      </div>

      {seasonStats && (
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {isPitcher ? (
            <>
              <div>
                <p className="text-xs text-gray-500">ERA</p>
                <p className="font-semibold">{formatStat(seasonStats.era, 2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">WHIP</p>
                <p className="font-semibold">{formatStat(seasonStats.whip, 2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">K</p>
                <p className="font-semibold">{seasonStats.strikeoutsPitching || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">W-L</p>
                <p className="font-semibold">{seasonStats.wins || 0}-{seasonStats.losses || 0}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-500">AVG</p>
                <p className="font-semibold">{formatStat(seasonStats.avg)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">OPS</p>
                <p className="font-semibold">{formatStat(seasonStats.ops)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">HR</p>
                <p className="font-semibold">{seasonStats.homeRuns || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">RBI</p>
                <p className="font-semibold">{seasonStats.rbis || 0}</p>
              </div>
            </>
          )}
        </div>
      )}

      {!seasonStats && (
        <div className="mt-4 text-center text-gray-400 text-sm py-2">
          No stats available
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">{prospect.current_level}</p>
      </div>
    </Link>
  )
}
