export default function TrendIndicator({ trend }) {
  const config = {
    hot: { icon: '🔥', text: 'Hot', className: 'text-red-500' },
    cold: { icon: '🧊', text: 'Cold', className: 'text-blue-400' },
    neutral: { icon: '➡️', text: 'Neutral', className: 'text-gray-500' }
  }

  const { icon, text, className } = config[trend] || config.neutral

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title={text}>
      <span>{icon}</span>
    </span>
  )
}
