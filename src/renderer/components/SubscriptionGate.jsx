import React, { useState } from 'react'

const STORE_IDS = {
  monthly: '9P947CB5W067',
  yearly: '9N742Z07B04K'
}

export default function SubscriptionGate({ onClose, onPurchase }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly') // 'monthly' | 'yearly'

  async function handlePurchase() {
    const storeId = STORE_IDS[selectedPlan]
    // In a packaged MSIX app this opens the native Windows Store purchase dialog
    // In dev mode, we simulate success for seamless testing
    if (window.electronAPI?.purchase) {
      const res = await window.electronAPI.purchase(storeId)
      if (res?.success) {
        onPurchase()
      } else if (res?.reason) {
        alert(`Store Purchase Status: ${res.reason}`)
      } else {
        onPurchase()
      }
    } else {
      onPurchase()
    }
  }

  return (
    <div className="gate-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="gate-modal">
        {/* Close */}
        <button className="gate-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="gate-header">
          <div className="gate-crown">⚡</div>
          <h2 className="gate-title">Unlock YoTube Video Downloader Pro</h2>
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
          <div
            className={`price-card ${selectedPlan === 'monthly' ? 'highlighted' : ''}`}
            onClick={() => setSelectedPlan('monthly')}
            style={{ cursor: 'pointer' }}
          >
            <div className="price-badge">Most Popular</div>
            <div className="price-plan">Monthly</div>
            <div className="price-amount">₹99<span>/mo</span></div>
          </div>
          <div
            className={`price-card ${selectedPlan === 'yearly' ? 'highlighted' : ''}`}
            onClick={() => setSelectedPlan('yearly')}
            style={{ cursor: 'pointer' }}
          >
            <div className="price-plan">Yearly</div>
            <div className="price-amount">₹499<span>/yr</span></div>
            <div className="price-save">Save 58%</div>
          </div>
        </div>

        {/* CTA */}
        <button className="btn-subscribe" onClick={handlePurchase}>
          ⚡ Subscribe ({selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'}) via Microsoft Store
        </button>
        <p className="gate-note">
          Secure payment via Microsoft Store · Cancel anytime · Billed in INR
        </p>
      </div>
    </div>
  )
}
