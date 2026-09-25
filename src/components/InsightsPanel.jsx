import React, { useState } from 'react'
import styles from './InsightsPanel.module.css'

export default function InsightsPanel({ insights }) {
  const [expanded, setExpanded] = useState(false)
  if (!insights || insights.length === 0) return null

  const visible = expanded ? insights : insights.slice(0, 3)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Season Insights</h2>
        </div>
        <span className={styles.badge}>{insights.length} findings</span>
      </div>

      <div className={styles.list}>
        {visible.map((ins, i) => (
          <div key={i} className={styles.item}>
            <p className={styles.text}>{ins.text}</p>
          </div>
        ))}
      </div>

      {insights.length > 3 && (
        <button className={styles.toggle} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less' : `Show ${insights.length - 3} more insights`}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      )}
    </div>
  )
}
