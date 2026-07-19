import React, { useState, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import UrlInput from './components/UrlInput'
import VideoCard from './components/VideoCard'
import ProgressBar from './components/ProgressBar'
import SubscriptionGate from './components/SubscriptionGate'
import DownloadHistory from './components/DownloadHistory'

export default function App() {
  const [license, setLicense]           = useState({ isPro: false })
  const [videoInfo, setVideoInfo]        = useState(null)
  const [downloadState, setDownloadState] = useState('idle') // idle | fetching | ready | downloading | done | error
  const [progress, setProgress]          = useState(null)
  const [history, setHistory]            = useState([])
  const [showGate, setShowGate]          = useState(false)
  const [activeTab, setActiveTab]        = useState('home') // home | history
  const [errorMsg, setErrorMsg]          = useState('')
  const [downloadsFolder, setDownloadsFolder] = useState('')

  async function handleChangeFolder() {
    if (window.electronAPI) {
      const folder = await window.electronAPI.selectFolder()
      if (folder) setDownloadsFolder(folder)
    } else {
      setDownloadsFolder('C:\\Users\\vrund\\Desktop\\Downloads')
    }
  }

  // Check license on startup
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.checkLicense().then(setLicense)
    } else {
      setLicense({ isPro: true, plan: 'monthly', source: 'browser' })
    }
  }, [])

  // Subscribe to download progress events
  useEffect(() => {
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onDownloadProgress((prog) => {
        setProgress(prog)
      })
      return cleanup
    }
    return undefined
  }, [])

  async function handleFetchInfo(url) {
    setDownloadState('fetching')
    setVideoInfo(null)
    setErrorMsg('')
    
    let info
    if (window.electronAPI) {
      info = await window.electronAPI.fetchVideoInfo(url)
    } else {
      // Mock fetching delay in browser
      await new Promise(resolve => setTimeout(resolve, 1200))
      info = {
        title: "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        duration: "3:33",
        uploader: "Rick Astley",
        formats: [
          { label: '4K (2160p)', quality: '4K', height: 2160, pro: true },
          { label: '1080p HD', quality: '1080p', height: 1080, pro: true },
          { label: '720p', quality: '720p', height: 720, pro: false },
          { label: 'MP3 Audio Only', quality: 'mp3', format: 'mp3', pro: true }
        ],
        url
      }
    }

    if (info.error) {
      setErrorMsg('Could not fetch video. Check the URL and try again.')
      setDownloadState('error')
    } else {
      setVideoInfo(info)
      setDownloadState('ready')
    }
  }

  async function handleDownload(url, quality, format) {
    // Check if pro is needed
    const proQualities = ['1080p', '1080p60', '4K', '2160p', 'mp3']
    if (proQualities.includes(quality) && !license.isPro) {
      setShowGate(true)
      return
    }

    setDownloadState('downloading')
    setProgress({ percent: 0, speed: '...', eta: '...', totalSize: '...' })

    let result
    if (window.electronAPI) {
      result = await window.electronAPI.startDownload({
        url,
        format,
        quality,
        title: videoInfo?.title,
        downloadsFolder: downloadsFolder || undefined
      })
    } else {
      // Mock download progress loop in browser
      result = { success: true }
      let pct = 0
      const interval = setInterval(() => {
        pct += 10
        setProgress({ percent: pct, speed: '2.8 MB/s', eta: `${Math.round((100 - pct) / 10)}s`, totalSize: '15.4 MB' })
        if (pct >= 100) {
          clearInterval(interval)
          setDownloadState('done')
          setProgress(null)
        }
      }, 300)
      window._mockCancel = () => {
        clearInterval(interval)
        setProgress(null)
      }
      return
    }

    if (result.error === 'PRO_REQUIRED') {
      setShowGate(true)
      setDownloadState('ready')
      return
    }

    if (result.error === 'DOWNLOAD_CANCELLED') {
      setDownloadState('ready')
      return
    }

    if (result.error) {
      setErrorMsg('Download failed: ' + result.error)
      setDownloadState('error')
      return
    }

    // Add to history
    setHistory(prev => [{
      title: videoInfo?.title || url,
      quality,
      format,
      date: new Date().toLocaleString()
    }, ...prev].slice(0, 50))

    setDownloadState('done')
    setProgress(null)
  }

  function handleReset() {
    setVideoInfo(null)
    setDownloadState('idle')
    setProgress(null)
    setErrorMsg('')
  }

  function handleCancelDownload() {
    if (window.electronAPI) {
      window.electronAPI.cancelDownload()
    } else if (window._mockCancel) {
      window._mockCancel()
    }
    setDownloadState('ready')
    setProgress(null)
  }

  return (
    <div className="app-shell">
      <TitleBar isPro={license.isPro} />

      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo-mark">
            <span className="logo-icon">▼</span>
            <span className="logo-text">StreamSaver<br /><strong>HD</strong></span>
          </div>

          <nav className="nav-links">
            <button
              className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <span className="nav-icon">⬇</span> Download
            </button>
            <button
              className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <span className="nav-icon">🕐</span> History
            </button>
          </nav>

          <div className="sidebar-footer">
            {license.isPro ? (
              <div className="badge-pro">✦ PRO Active</div>
            ) : (
              <button className="btn-upgrade" onClick={() => setShowGate(true)}>
                ⚡ Upgrade to Pro
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="content">
          {activeTab === 'home' && (
            <>
              {(downloadState === 'idle' || downloadState === 'fetching' || downloadState === 'error') && (
                <UrlInput
                  onSubmit={handleFetchInfo}
                  isLoading={downloadState === 'fetching'}
                  error={errorMsg}
                />
              )}

              {downloadState === 'ready' && videoInfo && (
                <VideoCard
                  info={videoInfo}
                  isPro={license.isPro}
                  onDownload={handleDownload}
                  onReset={handleReset}
                  downloadsFolder={downloadsFolder}
                  onChangeFolder={handleChangeFolder}
                />
              )}

              {downloadState === 'downloading' && (
                <ProgressBar
                  progress={progress}
                  videoTitle={videoInfo?.title}
                  onCancel={handleCancelDownload}
                />
              )}

              {downloadState === 'done' && (
                <div className="done-card">
                  <div className="done-icon">✓</div>
                  <h2>Download Complete!</h2>
                  <p>Saved to your <strong>{downloadsFolder || 'Downloads / StreamSaver HD'}</strong> folder.</p>
                  <div className="done-actions">
                    <button className="btn-primary" onClick={handleReset}>
                      Download Another
                    </button>
                    <button className="btn-secondary" onClick={() => {
                      if (window.electronAPI) {
                        window.electronAPI.openDownloadsFolder('')
                      } else {
                        alert('Browser Mock: Downloads folder opened!')
                      }
                    }}>
                      Open Folder
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <DownloadHistory history={history} />
          )}
        </main>
      </div>

      {/* Subscription Gate Modal */}
      {showGate && (
        <SubscriptionGate
          onClose={() => setShowGate(false)}
          onPurchase={() => {
            setShowGate(false)
            if (window.electronAPI) {
              window.electronAPI.checkLicense().then(setLicense)
            }
          }}
        />
      )}
    </div>
  )
}
