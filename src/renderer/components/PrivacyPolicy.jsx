// ── Google Form Feedback Link ──
export const GOOGLE_FORM_FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfdwuzZKvknENWpzBeyQlh1j4pgLPU90p6u1pfZTNvbYZDzUg/viewform'

export default function PrivacyPolicy({ onClose }) {
  function handleOpenFeedback() {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(GOOGLE_FORM_FEEDBACK_URL)
    } else {
      window.open(GOOGLE_FORM_FEEDBACK_URL, '_blank')
    }
  }

  return (
    <div className="privacy-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="privacy-modal">
        <button className="privacy-close" onClick={onClose}>✕</button>
        
        <div className="privacy-header">
          <div className="privacy-icon">🔒</div>
          <h2 className="privacy-title">Privacy Policy</h2>
          <p className="privacy-updated">Last updated: July 2026</p>
        </div>

        <div className="privacy-body">
          <section className="privacy-section">
            <h3>📋 Information We Collect</h3>
            <p>YoTube Video Downloader operates entirely on your device. We do <strong>not</strong> collect, store, or transmit any personal data, browsing history, or download activity to external servers.</p>
          </section>

          <section className="privacy-section">
            <h3>📥 Downloads</h3>
            <p>All video downloads are processed locally on your device. URLs are sent directly to the video hosting service. We do not track, log, or monitor your downloads.</p>
          </section>

          <section className="privacy-section">
            <h3>💳 Payments</h3>
            <p>Subscription payments are handled entirely by the <strong>Microsoft Store</strong>. We never see or store your payment information, card numbers, or billing details.</p>
          </section>

          <section className="privacy-section">
            <h3>📊 Analytics</h3>
            <p>We do not use any analytics, tracking pixels, or telemetry. Your usage of the app is completely private.</p>
          </section>

          <section className="privacy-section">
            <h3>🔐 Data Storage</h3>
            <p>Download history and app preferences are stored <strong>locally</strong> on your device using browser localStorage. This data never leaves your computer.</p>
          </section>

          <section className="privacy-section feedback-section">
            <h3>💬 Feedback & Support Form</h3>
            <p>Have questions, suggestions, or issues? Fill out our official Google Form to send us direct feedback.</p>
            <button className="btn-privacy-feedback" onClick={handleOpenFeedback} style={{
              marginTop: '10px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📋 Submit Feedback via Google Form
            </button>
          </section>

          <section className="privacy-section">
            <h3>📬 Contact</h3>
            <p>If you have questions about this privacy policy, please reach out to us through our feedback form or the Microsoft Store listing.</p>
          </section>
        </div>

        <button className="privacy-accept" onClick={onClose}>
          I Understand
        </button>
      </div>
    </div>
  )
}
