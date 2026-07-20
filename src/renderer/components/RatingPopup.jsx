import React, { useState } from 'react'

export default function RatingPopup({ onClose, onRate }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    localStorage.setItem('ss_user_rated', 'true')
    localStorage.setItem('ss_user_rating', String(rating))
    setSubmitted(true)
    setTimeout(() => {
      onRate(rating)
      onClose()
    }, 1500)
  }

  function handleLater() {
    onClose()
  }

  return (
    <div className="rating-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="rating-modal">
        {submitted ? (
          <div className="rating-thanks">
            <div className="rating-thanks-icon">🎉</div>
            <h2>Thank You!</h2>
            <p>Your feedback helps us improve.</p>
          </div>
        ) : (
          <>
            <div className="rating-header">
              <div className="rating-emoji">⭐</div>
              <h2 className="rating-title">Enjoying StreamSaver HD?</h2>
              <p className="rating-sub">Rate your experience to help us improve!</p>
            </div>

            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  className={`rating-star ${star <= (hovered || rating) ? 'filled' : ''}`}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>

            <div className="rating-actions">
              <button
                className="btn-rate-submit"
                disabled={rating === 0}
                onClick={handleSubmit}
              >
                Submit Rating
              </button>
              <button className="btn-rate-later" onClick={handleLater}>
                Maybe Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
