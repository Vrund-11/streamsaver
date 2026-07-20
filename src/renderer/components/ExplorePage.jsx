import React, { useState, useEffect, useRef } from 'react'

export default function ExplorePage({ onCopyUrl }) {
  const isElectron = !!window.electronAPI
  const [currentUrl, setCurrentUrl] = useState('https://www.youtube.com')
  const [inputValue, setInputValue] = useState('https://www.youtube.com')
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
      setInputValue(url) // Sync address bar with loaded page
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

  // Helper to check if string looks like a URL
  function isUrl(str) {
    const clean = str.trim()
    if (clean.startsWith('http://') || clean.startsWith('https://')) return true
    if (
      clean.startsWith('youtube.com') || 
      clean.startsWith('www.youtube.com') || 
      clean.startsWith('youtu.be') || 
      clean.startsWith('m.youtube.com')
    ) return true
    
    // Domain check (has dot, no spaces)
    if (clean.includes('.') && !clean.includes(' ')) return true
    return false
  }

  // Fetch search suggestions
  useEffect(() => {
    const query = inputValue.trim()
    if (!query || isUrl(query)) {
      setSuggestions([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`)
        const text = await res.text()
        
        const match = text.match(/window\.google\.ac\.h\((.*)\)/)
        if (match && match[1]) {
          const data = JSON.parse(match[1])
          const queries = data[1].map(item => item[0])
          setSuggestions(queries.slice(0, 6))
        } else {
          const cleanText = text.replace('window.google.ac.h(', '').replace(')', '')
          const data = JSON.parse(cleanText)
          const queries = data[1].map(item => item[0])
          setSuggestions(queries.slice(0, 6))
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err)
        // Fallback static suggestions
        const staticSuggestions = [
          query,
          `${query} music`,
          `${query} live`,
          `${query} mix`,
          `${query} official video`,
          `${query} lofi`
        ]
        setSuggestions(staticSuggestions)
      }
    }, 250)

    return () => clearTimeout(delayDebounce)
  }, [inputValue])

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
    const homeUrl = 'https://www.youtube.com'
    if (webviewRef.current) {
      webviewRef.current.loadURL(homeUrl)
    } else {
      setCurrentUrl(homeUrl)
      setInputValue(homeUrl)
    }
  }

  function handleSearchSubmit(queryText) {
    const input = (queryText || inputValue).trim()
    if (!input) return

    setShowSuggestions(false)
    let targetUrl = ''

    if (isUrl(input)) {
      // Ensure protocol is present
      targetUrl = input
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl
      }
    } else {
      // Treat as YouTube search query
      targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(input)}`
    }

    if (webviewRef.current) {
      webviewRef.current.loadURL(targetUrl)
    } else {
      setCurrentUrl(targetUrl)
      setInputValue(targetUrl)
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
            disabled={isLoading}
          >
            {isLoading ? '...' : '⟳'}
          </button>
          <button 
            className="toolbar-btn" 
            onClick={handleGoHome} 
            title="YouTube Home"
          >
            🏠
          </button>
        </div>

        {/* Address & Search Input */}
        <div className="toolbar-search-wrap">
          <form 
            className="toolbar-search-form" 
            onSubmit={(e) => { e.preventDefault(); handleSearchSubmit() }}
          >
            <input
              ref={searchInputRef}
              type="text"
              className="toolbar-search-input"
              placeholder="Search YouTube or paste video URL..."
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setShowSuggestions(true) }}
              onFocus={(e) => {
                setShowSuggestions(true)
                // Select all text on focus for quick replacing / editing
                e.target.select()
              }}
            />
            <button type="submit" className="toolbar-search-btn">Go</button>
          </form>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul ref={suggestionsRef} className="search-suggestions-list">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index}
                  className="suggestion-item"
                  onClick={() => {
                    setInputValue(suggestion)
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
          {copied ? '✓ Fetching...' : '⬇ Download Video'}
        </button>
      </div>

      {/* Main View Area */}
      <div className="explore-view-area">
        {isElectron ? (
          <webview
            ref={webviewRef}
            src="https://www.youtube.com"
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
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
                    const rickUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    setCurrentUrl(rickUrl)
                    setInputValue(rickUrl)
                  }}
                >
                  Simulate Playing Rick Astley
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    const zooUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
                    setCurrentUrl(zooUrl)
                    setInputValue(zooUrl)
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
