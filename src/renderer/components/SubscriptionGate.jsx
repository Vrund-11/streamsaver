import React from 'react'

export default function SubscriptionGate({ onClose, onPurchase }) {
  async function handlePurchase() {
    // In a packaged MSIX app this opens the native Windows Store purchase dialog
    // In dev mode, we just simulate success for testing
    if (window.electronAPI?.purchase) {
      await window.electronAPI.purchase('streamsaverhd_pro_monthly')
    }
    onPurchase()
  }

  return (
    <div className="gate-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="gate-modal">
        {/* Close */}
        <button className="gate-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="gate-header">
          <div className="gate-crown">⚡</div>
          <h2 className="gate-title">Unlock StreamSaver HD Pro</h2>
          <p className="gate-sub">Get unlimited access to all features</p>
        </div>

        {/* Features */}
        <ul className="gate-features">
          <li><span className="check">✓</span> 4K & 1080p HD downloads</li>
          <li><span className="check">✓</span> 1080p 60fps downloads</li>
          <li><span className="check">✓</span> MP3 audio extraction</li>
          <li><span className="check">✓</span> Unlimited downloads per day</li>
          <li><span className="check">✓</span> Batch URL downloading</li>
          <li><span className="check">✓</span> Background download queue</li>
        </ul>

        {/* Pricing */}
        <div className="gate-pricing">
          <div className="price-card highlighted">
            <div className="price-badge">Most Popular</div>
            <div className="price-plan">Monthly</div>
            <div className="price-amount">₹99<span>/mo</span></div>
          </div>
          <div className="price-card">
            <div className="price-plan">Yearly</div>
            <div className="price-amount">₹499<span>/yr</span></div>
            <div className="price-save">Save 58%</div>
          </div>
        </div>

        {/* CTA */}
        <button className="btn-subscribe" onClick={handlePurchase}>
          ⚡ Subscribe via Microsoft Store
        </button>
        <p className="gate-note">
          Secure payment via Microsoft Store · Cancel anytime · Billed in INR
        </p>
      </div>
    </div>
  )
}
