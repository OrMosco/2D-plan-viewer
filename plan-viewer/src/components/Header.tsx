interface HeaderProps {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  onAnalyze: () => void
  isAnalyzing: boolean
}

function Header({ theme, toggleTheme, onAnalyze, isAnalyzing }: HeaderProps) {
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
        <button
          className="ai-analyze-btn"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          title="Run AI Structural Analysis on the plan"
        >
          {isAnalyzing ? (
            <>
              <span className="ai-spinner" />
              Analyzing…
            </>
          ) : (
            <>✨ AI Analyze Structure</>
          )}
        </button>
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
