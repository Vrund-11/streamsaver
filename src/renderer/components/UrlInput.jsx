import React, { useState, useRef, useEffect } from 'react'

export default function UrlInput({ onSubmit, isLoading, error, prefillUrl }) {
  const [url, setUrl] = useState('')
  const inputRef = useRef(null)

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Fill URL from Explore tab copy
  useEffect(() => {
    if (prefillUrl) {
      setUrl(prefillUrl)
    }
  }, [prefillUrl])

  // Auto-paste from clipboard on Ctrl+V anywhere on the page
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && document.activeElement !== inputRef.current) {
        try {
          const text = await navigator.clipboard.readText()
          if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
            setUrl(text)
          }
        } catch {/* clipboard not available */}
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text')
    setUrl(pasted)
    // Auto-submit after paste
    setTimeout(() => {
      if (pasted.trim()) onSubmit(pasted.trim())
    }, 100)
  }

  return (
    <div className="url-input-section">
      <div className="url-hero">
        <div className="url-hero-icon">▼</div>
        <h1 className="url-hero-title">Download Any Video</h1>
        <p className="url-hero-sub">
          Paste a video URL below. Supports YouTube, Instagram, Twitter, Facebook and 1000+ sites.
        </p>
      </div>

      <form className="url-form" onSubmit={handleSubmit}>
        <div className={`url-input-wrap ${isLoading ? 'loading' : ''} ${error ? 'has-error' : ''}`}>
          <span className="url-icon">🔗</span>
          <input
            ref={inputRef}
            className="url-input"
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onPaste={handlePaste}
            placeholder="YouTube"
            disabled={isLoading}
            autoComplete="off"
            spellCheck="false"
          />
          {url && !isLoading && (
            <button
              type="button"
              className="url-clear"
              onClick={() => setUrl('')}
              title="Clear"
            >✕</button>
          )}
          {isLoading && <div className="url-spinner" />}
        </div>

        <button
          type="submit"
          className="btn-fetch"
          disabled={!url.trim() || isLoading}
        >
          {isLoading ? 'Fetching...' : 'Get Video →'}
        </button>
      </form>

      {error && (
        <div className="error-banner">
          <span>⚠</span> {error}
        </div>
      )}

      <div className="url-tips">
        <span className="tip">💡 Tip: Just copy the URL from your browser — it auto-pastes!</span>
      </div>
    </div>
  )
}
