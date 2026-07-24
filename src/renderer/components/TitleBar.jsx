import React from 'react'

export default function TitleBar({ isPro }) {
  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <span className="titlebar-logo">
          <span className="brand-badge">↓</span> StreamSaver HD
        </span>
        {isPro && <span className="titlebar-pro-badge">PRO</span>}
      </div>
      <div className="titlebar-controls">
        <button
          className="tb-btn tb-minimize"
          onClick={() => window.electronAPI?.minimize()}
          title="Minimize"
        >─</button>
        <button
          className="tb-btn tb-maximize"
          onClick={() => window.electronAPI?.maximize()}
          title="Maximize"
        >□</button>
        <button
          className="tb-btn tb-close"
          onClick={() => window.electronAPI?.close()}
          title="Close"
        >✕</button>
      </div>
    </div>
  )
}
