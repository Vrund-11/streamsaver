import { spawn } from 'child_process'
import { app } from 'electron'
import { join, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import os from 'os'

// Path to bundled yt-dlp and ffmpeg binaries
const resourcesPath = app.isPackaged
  ? join(process.resourcesPath, 'resources')
  : join(__dirname, '../../resources')

const ytdlpPath = join(resourcesPath, 'yt-dlp.exe')
const ffmpegPath = join(resourcesPath, 'ffmpeg.exe')

let activeProcess = null

/**
 * Fetch video information (title, thumbnail, available formats)
 */
export async function fetchVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-playlist',
      '--ffmpeg-location', ffmpegPath,
      url
    ]

    let output = ''
    let errorOutput = ''

    const proc = spawn(ytdlpPath, args)

    proc.stdout.on('data', (data) => { output += data.toString() })
    proc.stderr.on('data', (data) => { errorOutput += data.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || 'Failed to fetch video info'))
        return
      }

      try {
        const info = JSON.parse(output)
        const formats = extractFormats(info.formats || [])
        resolve({
          title: info.title,
          thumbnail: info.thumbnail,
          duration: formatDuration(info.duration),
          uploader: info.uploader,
          formats,
          url
        })
      } catch (e) {
        reject(new Error('Failed to parse video info'))
      }
    })
  })
}

/**
 * Start downloading a video with progress events
 */
export async function startDownload({ url, format, quality, savePath }, onProgress) {
  return new Promise((resolve, reject) => {
    const outputTemplate = savePath || join(os.homedir(), 'Downloads', 'YoTube Video Downloader', '%(title)s.%(ext)s')
    const downloadsDir = dirname(outputTemplate)
    if (!existsSync(downloadsDir)) mkdirSync(downloadsDir, { recursive: true })

    let formatArg
    if (format === 'mp3') {
      formatArg = 'bestaudio[ext=m4a]/bestaudio'
    } else if (quality === '4K' || quality === '2160p') {
      formatArg = 'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best'
    } else if (quality === '1080p60') {
      formatArg = 'bestvideo[height<=1080][fps>=50][ext=mp4]+bestaudio[ext=m4a]/best'
    } else if (quality === '1080p') {
      formatArg = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best'
    } else if (quality === '720p') {
      formatArg = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best'
    } else if (quality === '480p') {
      formatArg = 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best'
    } else {
      formatArg = 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best'
    }

    const args = [
      '-f', formatArg,
      '--ffmpeg-location', ffmpegPath,
      '--newline',
      '--progress',
      '--no-playlist',
      '-o', outputTemplate,
    ]

    if (format === 'mp3') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0')
    } else {
      args.push('--merge-output-format', 'mp4')
    }

    args.push(url)

    activeProcess = spawn(ytdlpPath, args)

    activeProcess.stdout.on('data', (data) => {
      const line = data.toString().trim()
      const progress = parseProgress(line)
      if (progress) onProgress(progress)
    })

    activeProcess.stderr.on('data', (data) => {
      console.error('[yt-dlp stderr]', data.toString())
    })

    activeProcess.on('close', (code) => {
      activeProcess = null
      if (code === 0) resolve({ downloadsDir })
      else reject(new Error(`Download failed with code ${code}`))
    })
  })
}

/**
 * Cancel an in-progress download
 */
export function cancelDownload() {
  if (activeProcess) {
    activeProcess.kill('SIGTERM')
    activeProcess = null
  }
}

// ──── HELPERS ────────────────────────────────────────────────

function parseProgress(line) {
  // yt-dlp progress format: [download]  45.3% of 123.45MiB at 2.50MiB/s ETA 00:30
  const match = line.match(
    /\[download\]\s+([\d.]+)%\s+of\s+([\d.]+\w+)\s+at\s+([\d.]+\w+\/s)\s+ETA\s+(\S+)/
  )
  if (match) {
    return {
      percent: parseFloat(match[1]),
      totalSize: match[2],
      speed: match[3],
      eta: match[4]
    }
  }
  return null
}

function formatDuration(seconds) {
  if (!seconds) return 'Unknown'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function extractFormats(formats) {
  const available = []
  const heights = new Set()

  formats.forEach(f => {
    if (f.height) heights.add(f.height)
  })

  const qualityMap = [
    { label: '4K (2160p)', quality: '4K', height: 2160, pro: true },
    { label: '1080p 60fps', quality: '1080p60', height: 1080, pro: true },
    { label: '1080p HD', quality: '1080p', height: 1080, pro: true },
    { label: '720p', quality: '720p', height: 720, pro: false },
    { label: '480p', quality: '480p', height: 480, pro: false },
    { label: '360p', quality: '360p', height: 360, pro: false },
  ]

  qualityMap.forEach(q => {
    if (heights.has(q.height) || q.height <= 720) {
      available.push(q)
    }
  })

  // Always offer MP3
  available.push({ label: 'MP3 Audio Only', quality: 'mp3', format: 'mp3', pro: true })

  return available
}
