import React from 'react'

export default function ProgressBar({ progress, videoTitle, onCancel }) {
  const percent = progress?.percent ?? 0
  const speed   = progress?.speed   ?? '—'
  const eta     = progress?.eta     ?? '—'
  const size    = progress?.totalSize ?? '—'

  return (
    <div className="progress-section">
      <div className="progress-icon-wrap">
        <div className="progress-icon-ring" style={{ '--p': percent }}>
          <span className="progress-icon-pct">{Math.round(percent)}%</span>
        </div>
      </div>

      <h2 className="progress-title">Downloading...</h2>
      {videoTitle && (
        <p className="progress-video-name" title={videoTitle}>
          {videoTitle.length > 60 ? videoTitle.slice(0, 57) + '...' : videoTitle}
        </p>
      )}

      {/* Linear progress bar */}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="progress-stats">
        <div className="stat">
          <span className="stat-label">Speed</span>
          <span className="stat-value">{speed}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Size</span>
          <span className="stat-value">{size}</span>
        </div>
        <div className="stat">
          <span className="stat-label">ETA</span>
          <span className="stat-value">{eta}</span>
        </div>
      </div>

      <button className="btn-cancel" onClick={onCancel}>
        Cancel Download
      </button>
    </div>
  )
}
