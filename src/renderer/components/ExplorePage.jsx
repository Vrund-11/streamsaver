import React, { useState, useEffect, useRef } from 'react'

export default function ExplorePage({ onCopyUrl }) {
  const isElectron = !!window.electronAPI
  const [currentUrl, setCurrentUrl] = useState('https://www.youtube.com')
  const [canGoBack, setCanGoBack] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const webviewRef = useRef(null)

  // Listen to webview navigation changes in Electron
  useEffect(() => {
    if (!isElectron) return

    const webview = webviewRef.current
    if (!webview) return

    const handleNavigate = () => {
      const url = webview.getURL()
      setCurrentUrl(url)
      setCanGoBack(webview.canGoBack())
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

  function handleGoBack() {
    if (webviewRef.current && canGoBack) {
      webviewRef.current.goBack()
    }
  }

  function handleGoHome() {
    const homeUrl = 'https://www.youtube.com'
    if (webviewRef.current) {
      webviewRef.current.loadURL(homeUrl)
    } else {
      setCurrentUrl(homeUrl)
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
      {/* Main View Area (takes 100% space) */}
      <div className="explore-view-area">
        {isElectron ? (
          <webview
            ref={webviewRef}
            src="https://www.youtube.com"
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
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
                  }}
                >
                  Simulate Playing Rick Astley
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    const zooUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
                    setCurrentUrl(zooUrl)
                  }}
                >
                  Simulate Playing Me at the zoo
                </button>
              </div>

              {isWatchUrl(currentUrl) && (
                <div className="fallback-download-prompt">
                  <div className="sparkle">✨</div>
                  <p>A playable video is loaded! You can now click the download button on the floating control bar below.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Action Controller (translucent overlay pill) */}
        <div className="explore-floating-controls">
          <button 
            className="floating-btn btn-back" 
            onClick={handleGoBack} 
            disabled={!canGoBack}
            title="Go Back"
          >
            ←
          </button>
          <button 
            className="floating-btn btn-home" 
            onClick={handleGoHome} 
            title="Go YouTube Home"
          >
            🏠
          </button>
          
          <div className="floating-divider"></div>
          
          <button 
            className={`floating-download-btn ${isWatchUrl(currentUrl) ? 'active' : ''}`}
            disabled={!isWatchUrl(currentUrl)}
            onClick={handleDownloadCurrent}
            title={isWatchUrl(currentUrl) ? "Click to download this video!" : "Play a video to unlock download"}
          >
            {copied ? '✓ Fetching...' : (
              <>
                <span className="dl-icon">⬇</span>
                <span className="dl-text">Download Video</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
