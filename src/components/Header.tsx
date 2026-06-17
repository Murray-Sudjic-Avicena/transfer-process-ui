export default function Header() {
  const navItems = ['Draft', 'Dashboard', 'Component', 'Processes'];

  return (
    <header className="app-header">
      <div className="header-logo">
        <img src="/avicena.png" alt="Avicena" height={28} />
      </div>

      {/* // Navigation dummy buttons */}
      <nav className="header-nav">
        {navItems.map(item => (
          <button key={item} className="header-nav-item">
            {item.toUpperCase()}
            <span style={{ fontSize: 9, marginLeft: 1 }}>▾</span>
          </button>
        ))}

        {/* // User Icon, dummy button */}
        <button className="header-nav-item header-nav-item--user">
          <svg className="icon" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          USER
        </button>
      </nav>
    </header>
  );
}
