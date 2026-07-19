import React, { useState } from 'react'

const PRO_QUALITIES = ['1080p', '1080p60', '4K', '2160p', 'mp3']

export default function VideoCard({ info, isPro, onDownload, onReset, downloadsFolder, onChangeFolder }) {
  const [selectedFormat, setSelectedFormat] = useState(info.formats?.[0] || null)
  const [isStarting, setIsStarting] = useState(false)

  async function handleDownload() {
    if (!selectedFormat) return
    setIsStarting(true)
    await onDownload(
      info.url || window._currentUrl,
      selectedFormat.quality,
      selectedFormat.format || 'mp4'
    )
    setIsStarting(false)
  }

  const needsPro = selectedFormat && PRO_QUALITIES.includes(selectedFormat.quality) && !isPro

  return (
    <div className="video-card">
      {/* Thumbnail */}
      <div className="video-thumb-wrap">
        {info.thumbnail ? (
          <img src={info.thumbnail} alt={info.title} className="video-thumb" />
        ) : (
          <div className="video-thumb-placeholder">▶</div>
        )}
        <div className="video-duration">{info.duration}</div>
      </div>

      {/* Meta */}
      <div className="video-meta">
        <h2 className="video-title" title={info.title}>{info.title}</h2>
        {info.uploader && (
          <p className="video-uploader">by {info.uploader}</p>
        )}
      </div>

      {/* Format Selector */}
      <div className="format-selector">
        <p className="format-label">Choose quality:</p>
        <div className="format-grid">
          {(info.formats || []).map((fmt) => {
            const locked = PRO_QUALITIES.includes(fmt.quality) && !isPro
            return (
              <button
                key={fmt.quality}
                className={`format-btn ${selectedFormat?.quality === fmt.quality ? 'selected' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => setSelectedFormat(fmt)}
              >
                {locked && <span className="lock-icon">🔒</span>}
                {fmt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Save Location Selector */}
      <div className="location-selector">
        <p className="location-label">Save Location:</p>
        <div className="location-row">
          <span className="location-path" title={downloadsFolder || 'Downloads / StreamSaver HD'}>
            {downloadsFolder ? downloadsFolder : 'Default (Downloads / StreamSaver HD)'}
          </span>
          <button className="btn-change-folder" onClick={onChangeFolder} disabled={isStarting}>
            Change Folder
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="video-actions">
        <button className="btn-back" onClick={onReset} disabled={isStarting}>
          ← Back
        </button>
        <button
          className={`btn-download ${needsPro ? 'btn-pro-prompt' : ''}`}
          onClick={handleDownload}
          disabled={!selectedFormat || isStarting}
        >
          {isStarting
            ? 'Starting...'
            : needsPro
              ? '🔒 Upgrade to Download'
              : `⬇ Download ${selectedFormat?.label || ''}`
          }
        </button>
      </div>
    </div>
  )
}
