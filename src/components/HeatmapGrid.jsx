import React, { useState, useMemo } from 'react'
import styles from './HeatmapGrid.module.css'

const HOURS = Array.from({ length: 12 }, (_, i) => i + 9) // 9 AM – 8 PM
const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const DAY_FULL = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function fmtHour(h) {
  if (h === 12) return '12p'
  if (h < 12)  return `${h}a`
  return `${h - 12}p`
}

export default function HeatmapGrid({ raw }) {
  const [metric, setMetric] = useState('transactions')
  const [hovered, setHovered] = useState(null)

  // Build hour × dow matrix
  const matrix = useMemo(() => {
    const m = {}
    DAYS.forEach((_, di) => {
      HOURS.forEach(h => {
        m[`${di}-${h}`] = { transactions: 0, revenue: 0 }
      })
    })
    ;(raw || []).forEach(r => {
      if (!r.issuedAt || r.revenue === null) return
      const dow = r.issuedAt.getDay()       // 0=Sun
      const dayIdx = dow === 0 ? 6 : dow - 1 // Mon=0..Sun=6
      const h = r.issuedAt.getHours()
      const key = `${dayIdx}-${h}`
      if (m[key]) {
        m[key].transactions += 1
        if (r.revenue > 0) m[key].revenue += r.revenue
      }
    })
    return m
  }, [raw])

  const maxVal = useMemo(() => {
    return Math.max(...Object.values(matrix).map(c => c[metric]), 1)
  }, [matrix, metric])

  const fmt = v => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(v)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Activity Heatmap</h2>
        <div className={styles.tabs}>
          {[{ id: 'transactions', label: 'Trips' }, { id: 'revenue', label: 'Revenue' }].map(v => (
            <button
              key={v.id}
              className={`${styles.tab} ${metric === v.id ? styles.tabActive : ''}`}
              onClick={() => setMetric(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.subtitle}>
        Hour of day (checkout) × day of week — darker = more {metric === 'transactions' ? 'trips' : 'revenue'}
      </div>

      <div className={styles.wrap}>
        {/* Hour axis labels (top) */}
        <div className={styles.axisRow}>
          <div className={styles.axisCorner} />
          {HOURS.map(h => (
            <div key={h} className={styles.hourLabel}>{fmtHour(h)}</div>
          ))}
        </div>

        {/* Rows: one per day */}
        {DAYS.map((day, di) => (
          <div key={day} className={styles.row}>
            <div className={styles.dayLabel}>{day}</div>
            {HOURS.map(h => {
              const key  = `${di}-${h}`
              const cell = matrix[key]
              const val  = cell[metric]
              const ratio = val / maxVal

              return (
                <div
                  key={h}
                  className={`${styles.cell} ${val > 0 ? styles.cellActive : ''}`}
                  style={val > 0 ? { '--ratio': ratio } : {}}
                  onMouseEnter={() => setHovered({ day: DAY_FULL[di], h, ...cell })}
                  onMouseLeave={() => setHovered(null)}
                />
              )
            })}
          </div>
        ))}

        {/* Column totals */}
        <div className={styles.totalRow}>
          <div className={styles.totalLabel}>Total</div>
          {HOURS.map(h => {
            const total = DAYS.reduce((s, _, di) => {
              const v = matrix[`${di}-${h}`]
              return s + (v ? v[metric] : 0)
            }, 0)
            const ratio = maxVal ? total / (maxVal * DAYS.length) * 3 : 0
            return (
              <div key={h} className={styles.totalCell}>
                <div
                  className={styles.totalBar}
                  style={{ height: `${Math.min(ratio * 100, 100)}%` }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Low</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((r, i) => (
          <span key={i} className={styles.legendSwatch} style={{ '--ratio': r }} />
        ))}
        <span className={styles.legendLabel}>High</span>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className={styles.tooltipStatic}>
          <strong>{hovered.day}</strong> at {fmtHour(hovered.h)}:
          &nbsp;{hovered.transactions} trips · {fmt(hovered.revenue)}
        </div>
      )}
    </div>
  )
}
