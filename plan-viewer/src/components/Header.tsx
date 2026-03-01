interface HeaderProps {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

function Header({ theme, toggleTheme }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <span className="header-logo">🏗️</span>
        <div>
          <div className="header-title">2D Plan Viewer</div>
          <div className="header-subtitle">Spacial.io Assignment</div>
        </div>
      </div>

      <nav className="header-nav">
        <a
          className="nav-link"
          href="https://github.com/OrMosco/2D-plan-viewer"
          target="_blank"
          rel="noopener noreferrer"
        >
          ⭐ GitHub
        </a>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </nav>
    </header>
  )
}

export default Header
