import React, { useState, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import UrlInput from './components/UrlInput'
import VideoCard from './components/VideoCard'
import ProgressBar from './components/ProgressBar'
import SubscriptionGate from './components/SubscriptionGate'
import DownloadHistory from './components/DownloadHistory'
import Onboarding from './components/Onboarding'
import RatingPopup from './components/RatingPopup'
import PrivacyPolicy from './components/PrivacyPolicy'
import iconPng from './assets/icon.png'

// ── Rate-limit helpers ──
function getTodayKey() {
  return `ss_dl_count_${new Date().toISOString().slice(0, 10)}`
}
function getTodayDownloads() {
  return parseInt(localStorage.getItem(getTodayKey()) || '0', 10)
}
function incrementTodayDownloads() {
  const count = getTodayDownloads() + 1
  localStorage.setItem(getTodayKey(), String(count))
  return count
}
function getTotalDownloads() {
  return parseInt(localStorage.getItem('ss_total_downloads') || '0', 10)
}
function incrementTotalDownloads() {
  const count = getTotalDownloads() + 1
  localStorage.setItem('ss_total_downloads', String(count))
  return count
}

const FREE_DAILY_LIMIT = 1

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

  // New state for added features
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showRating, setShowRating]         = useState(false)
  const [showPrivacy, setShowPrivacy]       = useState(false)
  const [pastedUrl, setPastedUrl]           = useState('')

  // Sequence state: true if we are running the onboarding -> paywall -> rating sequence on first launch
  const [isInitialSequence, setIsInitialSequence] = useState(false)

  // Check if onboarding needed on mount (force trigger for testing)
  useEffect(() => {
    localStorage.removeItem('ss_onboarding_done')
    setShowOnboarding(true)
    setIsInitialSequence(true)
  }, [])

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
      // Browser mock: free user for testing rate-limit UI
      setLicense({ isPro: false, plan: 'free', source: 'browser' })
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
    // Rate limiting check (free users)
    if (!license.isPro) {
      const todayCount = getTodayDownloads()
      if (todayCount >= FREE_DAILY_LIMIT) {
        setShowGate(true)
        return
      }
    }

    // Check if pro quality is needed
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
          // Increment counters
          const newDailyCount = incrementTodayDownloads()
          const newTotalCount = incrementTotalDownloads()

          // Add to history
          setHistory(prev => [{
            title: videoInfo?.title || url,
            quality,
            format,
            date: new Date().toLocaleString()
          }, ...prev].slice(0, 50))

          setDownloadState('done')
          setProgress(null)

          // Show rating popup on odd downloads (1st, 3rd, 5th...) for free users if they haven't rated
          const hasRated = localStorage.getItem('ss_user_rated')
          if (!hasRated && newTotalCount % 2 === 1) {
            setTimeout(() => setShowRating(true), 1000)
          }
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

    // Increment counters
    const newDailyCount = incrementTodayDownloads()
    const newTotalCount = incrementTotalDownloads()

    // Add to history
    setHistory(prev => [{
      title: videoInfo?.title || url,
      quality,
      format,
      date: new Date().toLocaleString()
    }, ...prev].slice(0, 50))

    setDownloadState('done')
    setProgress(null)

    // Show rating popup on odd downloads (1st, 3rd, 5th...)
    const hasRated = localStorage.getItem('ss_user_rated')
    if (!hasRated && newTotalCount % 2 === 1) {
      setTimeout(() => setShowRating(true), 1000)
    }
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

  // Rate limit info for UI
  const dailyRemaining = license.isPro ? '∞' : Math.max(0, FREE_DAILY_LIMIT - getTodayDownloads())

  return (
    <div className="app-shell">
      {/* Onboarding overlay */}
      {showOnboarding && (
        <Onboarding onComplete={() => {
          setShowOnboarding(false)
          setShowGate(true) // Trigger Paywall directly after onboarding
        }} />
      )}

      <TitleBar isPro={license.isPro} />

      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo-mark">
            <img src={iconPng} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', marginRight: '10px', objectFit: 'cover' }} />
            <span className="logo-text">YoTube Video <strong>Downloader</strong></span>
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

            <div className="nav-divider"></div>

            <button className="nav-btn nav-btn-small" onClick={() => setShowPrivacy(true)}>
              <span className="nav-icon">🔒</span> Privacy Policy
            </button>
            <button className="nav-btn nav-btn-small" onClick={() => setShowRating(true)}>
              <span className="nav-icon">⭐</span> Rate Us
            </button>
          </nav>

          <div className="sidebar-footer">
            {/* Daily limit badge */}
            <div className="daily-limit-badge">
              <span className="limit-label">Downloads today</span>
              <span className="limit-value">{getTodayDownloads()} / {license.isPro ? '∞' : FREE_DAILY_LIMIT}</span>
            </div>

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
                  prefillUrl={pastedUrl}
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
                  <p>Saved to your <strong>{downloadsFolder || 'Downloads / YoTube Video Downloader'}</strong> folder.</p>
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

      {/* Modals */}
      {showGate && (
        <SubscriptionGate
          onClose={() => {
            setShowGate(false)
            if (isInitialSequence) {
              setIsInitialSequence(false)
              setShowRating(true) // Trigger Rate popup directly after Paywall is closed
            }
          }}
          onPurchase={() => {
            setShowGate(false)
            setLicense({ isPro: true, plan: 'monthly', source: 'dev-purchase' })
            if (isInitialSequence) {
              setIsInitialSequence(false)
              setShowRating(true) // Trigger Rate popup directly after Paywall is purchased
            }
          }}
        />
      )}

      {showRating && (
        <RatingPopup
          onClose={() => setShowRating(false)}
          onRate={(rating) => console.log('User rated:', rating)}
        />
      )}

      {showPrivacy && (
        <PrivacyPolicy onClose={() => setShowPrivacy(false)} />
      )}
    </div>
  )
}
