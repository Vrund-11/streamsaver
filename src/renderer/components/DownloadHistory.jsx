import React from 'react'

const qualityColors = {
  '4K': '#f59e0b',
  '1080p60': '#8b5cf6',
  '1080p': '#3b82f6',
  '720p': '#10b981',
  '480p': '#6b7280',
  '360p': '#6b7280',
  'mp3': '#ec4899',
}

export default function DownloadHistory({ history }) {
  if (history.length === 0) {
    return (
      <div className="history-empty">
        <div className="history-empty-icon">🕐</div>
        <h2>No downloads yet</h2>
        <p>Your download history will appear here.</p>
      </div>
    )
  }

  return (
    <div className="history-section">
      <h2 className="history-heading">Download History</h2>
      <div className="history-list">
        {history.map((item, i) => (
          <div key={i} className="history-item">
            <div className="history-icon">⬇</div>
            <div className="history-info">
              <p className="history-title" title={item.title}>
                {item.title.length > 55 ? item.title.slice(0, 52) + '...' : item.title}
              </p>
              <p className="history-date">{item.date}</p>
            </div>
            <div
              className="history-quality"
              style={{ color: qualityColors[item.quality] || '#6b7280' }}
            >
              {item.quality === 'mp3' ? '🎵 MP3' : `📹 ${item.quality}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
