import React, { useState } from 'react'

const slides = [
  {
    icon: '🎬',
    title: 'Welcome to StreamSaver HD',
    description: 'Download your favorite videos in stunning quality — from 720p all the way to 4K Ultra HD.',
    highlight: 'Free to use · No sign-up required'
  },
  {
    icon: '🚀',
    title: 'Lightning Fast Downloads',
    description: 'Paste any video URL and download in seconds. Choose your quality, pick your format, and save anywhere.',
    highlight: 'Supports YouTube, Vimeo & 1000+ sites'
  },
  {
    icon: '⚡',
    title: 'Go Pro for Unlimited Power',
    description: 'Free users get 1 download per day. Upgrade to Pro for unlimited 4K downloads, MP3 extraction, and batch processing.',
    highlight: 'Try your first download free!'
  }
]

export default function Onboarding({ onComplete }) {
  const [current, setCurrent] = useState(0)

  function handleNext() {
    if (current < slides.length - 1) {
      setCurrent(current + 1)
    } else {
      localStorage.setItem('ss_onboarding_done', 'true')
      onComplete()
    }
  }

  function handleSkip() {
    localStorage.setItem('ss_onboarding_done', 'true')
    onComplete()
  }

  const slide = slides[current]

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* Skip button */}
        <button className="onboarding-skip" onClick={handleSkip}>
          Skip
        </button>

        {/* Slide content */}
        <div className="onboarding-slide" key={current}>
          <div className="onboarding-icon">{slide.icon}</div>
          <h1 className="onboarding-title">{slide.title}</h1>
          <p className="onboarding-desc">{slide.description}</p>
          <div className="onboarding-highlight">{slide.highlight}</div>
        </div>

        {/* Dots */}
        <div className="onboarding-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`onboarding-dot ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>

        {/* Actions */}
        <button className="onboarding-next" onClick={handleNext}>
          {current === slides.length - 1 ? '🚀 Get Started' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
