import React from 'react'
import styles from './Header.module.css'

export default function Header({ theme, onToggleTheme, dateRange, filtered, totalTransactions }) {
  const fmtDate = d => d ? d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—'

  return (
    <header className={styles.header}>
      <div className={styles.wordmark}>
        <img
          src="/ledyard_logo.png"
          alt="Ledyard Canoe Club logo"
          className={styles.logo}
        />
        <span className={styles.wordmarkName}>Ledyard Canoe Club</span>
      </div>

      <div className={styles.center}>
        {dateRange && (
          <div className={styles.metaRow}>
            <span className={styles.dateRange}>
              {fmtDate(dateRange.min)} – {fmtDate(dateRange.max)}
            </span>
            {filtered && (
              <span className={styles.filterBadge}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                Filtered
              </span>
            )}
          </div>
        )}
      </div>

      <div className={styles.controls}>
        {totalTransactions != null && (
          <span className={styles.txCount}>
            {totalTransactions.toLocaleString()} trips
          </span>
        )}
        <button
          className={styles.themeBtn}
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
