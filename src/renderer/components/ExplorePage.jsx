import React, { useState, useEffect, useRef } from 'react'

export default function ExplorePage({ onCopyUrl }) {
  const isElectron = !!window.electronAPI
  const [currentUrl, setCurrentUrl] = useState('https://www.youtube.com')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const webviewRef = useRef(null)
  const searchInputRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Listen to webview navigation changes in Electron
  useEffect(() => {
    if (!isElectron) return

    const webview = webviewRef.current
    if (!webview) return

    const handleNavigate = () => {
      const url = webview.getURL()
      setCurrentUrl(url)
      setCanGoBack(webview.canGoBack())
      setCanGoForward(webview.canGoForward())
    }

    const handleLoadStart = () => setIsLoading(true)
    const handleLoadStop = () => setIsLoading(false)

    webview.addEventListener('did-navigate', handleNavigate)
    webview.addEventListener('did-navigate-in-page', handleNavigate)
    webview.addEventListener('did-start-loading', handleLoadStart)
    webview.addEventListener('did-stop-loading', handleLoadStop)

    return () => {
      webview.removeEventListener('did-navigate', handleNavigate)
      webview.removeEventListener('did-navigate-in-page', handleNavigate)
      webview.removeEventListener('did-start-loading', handleLoadStart)
      webview.removeEventListener('did-stop-loading', handleLoadStop)
    }
  }, [isElectron])

  // Fetch search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      try {
        // Fetch YouTube search autocomplete suggestions
        const res = await fetch(`https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(searchQuery)}`)
        const text = await res.text()
        
        // Extract array from window.google.ac.h(...) callback format
        const match = text.match(/window\.google\.ac\.h\((.*)\)/)
        if (match && match[1]) {
          const data = JSON.parse(match[1])
          const queries = data[1].map(item => item[0])
          setSuggestions(queries.slice(0, 6))
        } else {
          // Alternative fallback parsing if format differs
          const cleanText = text.replace('window.google.ac.h(', '').replace(')', '')
          const data = JSON.parse(cleanText)
          const queries = data[1].map(item => item[0])
          setSuggestions(queries.slice(0, 6))
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err)
        // Fallback suggestions
        const staticSuggestions = [
          searchQuery,
          `${searchQuery} music`,
          `${searchQuery} live`,
          `${searchQuery} mix`,
          `${searchQuery} official video`,
          `${searchQuery} lofi`
        ]
        setSuggestions(staticSuggestions)
      }
    }, 250)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  // Handle outside click to hide suggestions
  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && e.target !== searchInputRef.current) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleGoBack() {
    if (webviewRef.current && canGoBack) {
      webviewRef.current.goBack()
    }
  }

  function handleGoForward() {
    if (webviewRef.current && canGoForward) {
      webviewRef.current.goForward()
    }
  }

  function handleReload() {
    if (webviewRef.current) {
      webviewRef.current.reload()
    }
  }

  function handleGoHome() {
    if (webviewRef.current) {
      webviewRef.current.loadURL('https://www.youtube.com')
    } else {
      setCurrentUrl('https://www.youtube.com')
    }
  }

  function handleSearchSubmit(queryText) {
    const query = queryText || searchQuery
    if (!query.trim()) return

    setShowSuggestions(false)
    const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`

    if (webviewRef.current) {
      webviewRef.current.loadURL(targetUrl)
    } else {
      setCurrentUrl(targetUrl)
    }
  }

  function isWatchUrl(url) {
    return (
      url.includes('youtube.com/watch') || 
      url.includes('youtu.be/') || 
      url.includes('youtube.com/shorts/')
    )
  }

  function handleDownloadCurrent() {
    if (onCopyUrl) {
      onCopyUrl(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="explore-webview-container">
      {/* Browser Navigation Toolbar */}
      <div className="explore-toolbar">
        <div className="toolbar-navigation">
          <button 
            className="toolbar-btn" 
            onClick={handleGoBack} 
            disabled={!canGoBack}
            title="Back"
          >
            ←
          </button>
          <button 
            className="toolbar-btn" 
            onClick={handleGoForward} 
            disabled={!canGoForward}
            title="Forward"
          >
            →
          </button>
          <button 
            className="toolbar-btn" 
            onClick={handleReload} 
            title="Refresh"
          >
            ⟳
          </button>
          <button 
            className="toolbar-btn" 
            onClick={handleGoHome} 
            title="YouTube Home"
          >
            🏠
          </button>
        </div>

        {/* Search & Suggestions Form */}
        <div className="toolbar-search-wrap">
          <form 
            className="toolbar-search-form" 
            onSubmit={(e) => { e.preventDefault(); handleSearchSubmit() }}
          >
            <input
              ref={searchInputRef}
              type="text"
              className="toolbar-search-input"
              placeholder="Search YouTube..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
            />
            <button type="submit" className="toolbar-search-btn">🔍</button>
          </form>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul ref={suggestionsRef} className="search-suggestions-list">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index}
                  className="suggestion-item"
                  onClick={() => {
                    setSearchQuery(suggestion)
                    handleSearchSubmit(suggestion)
                  }}
                >
                  <span className="suggestion-icon">🔍</span>
                  <span className="suggestion-text">{suggestion}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Download Call to Action */}
        <button 
          className={`toolbar-download-btn ${isWatchUrl(currentUrl) ? 'active glow' : ''}`}
          disabled={!isWatchUrl(currentUrl)}
          onClick={handleDownloadCurrent}
          title={isWatchUrl(currentUrl) ? "Click to download this video!" : "Play a video first to download"}
        >
          {copied ? '✓ Loading Video...' : '⬇ Download Video'}
        </button>
      </div>

      {/* Main View Area */}
      <div className="explore-view-area">
        {isElectron ? (
          <webview
            ref={webviewRef}
            src="https://www.youtube.com"
            className="explore-webview"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <div className="explore-browser-fallback">
            <div className="fallback-card">
              <div className="fallback-icon">📺</div>
              <h3>YouTube Browser Viewer</h3>
              <p className="fallback-desc">
                In the desktop app, this loads the real, fully functional YouTube.com!
              </p>
              <div className="fallback-mock-url">
                <strong>Current URL:</strong> {currentUrl}
              </div>
              
              <div className="fallback-mock-actions">
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    setCurrentUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
                  }}
                >
                  Simulate Playing Rick Astley
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setCurrentUrl('https://www.youtube.com/watch?v=jNQXAC9IVRw')
                  }}
                >
                  Simulate Playing Me at the zoo
                </button>
              </div>

              {isWatchUrl(currentUrl) && (
                <div className="fallback-download-prompt">
                  <div className="sparkle">✨</div>
                  <p>A playable video is loaded! You can now click the download button on the toolbar above.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
