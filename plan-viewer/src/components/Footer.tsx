function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <span>🏗️</span>
        <span>© 2026 Spacial.io — All rights reserved</span>
      </div>
      <div className="footer-links">
        <a
          className="footer-link"
          href="https://github.com/OrMosco/2D-plan-viewer"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a className="footer-link" href="#" onClick={e => e.preventDefault()}>
          About
        </a>
        <a className="footer-link" href="#" onClick={e => e.preventDefault()}>
          Contact
        </a>
      </div>
    </footer>
  )
}

export default Footer
