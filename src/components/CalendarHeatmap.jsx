import React, { useState, useMemo } from 'react'
import styles from './CalendarHeatmap.module.css'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function colorForValue(value, max, metric) {
  if (!value || max === 0) return null
  const ratio = Math.min(value / max, 1)
  return ratio
}

export default function CalendarHeatmap({ calendarData, monthlyData }) {
  const [metric, setMetric] = useState('revenue')
  const [tooltip, setTooltip] = useState(null)

  // Build lookup map
  const dataMap = useMemo(() => {
    const map = {}
    ;(calendarData || []).forEach(d => {
      map[d.date] = d
    })
    return map
  }, [calendarData])

  const maxRevenue = useMemo(() =>
    Math.max(...(calendarData || []).map(d => d.revenue), 1), [calendarData])
  const maxTransactions = useMemo(() =>
    Math.max(...(calendarData || []).map(d => d.transactions), 1), [calendarData])

  // Find all months with data
  const months = useMemo(() => {
    if (!calendarData || !calendarData.length) return []
    const set = new Set()
    calendarData.forEach(d => {
      const dt = new Date(d.date + 'T00:00:00')
      set.add(`${dt.getFullYear()}-${dt.getMonth()}`)
    })
    return [...set].sort().map(key => {
      const [y, m] = key.split('-').map(Number)
      return { year: y, month: m }
    })
  }, [calendarData])

  const fmt = v => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(v)
  const fmtDate = s => {
    const d = new Date(s + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function renderMonth({ year, month }) {
    const firstDay = new Date(year, month, 1)
    const lastDay  = new Date(year, month + 1, 0)
    const startDow = firstDay.getDay() // 0=Sun

    const cells = []
    // Leading blanks
    for (let i = 0; i < startDow; i++) cells.push(null)
    // Days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(new Date(year, month, d))
    }
    // Trailing blanks to complete last row
    while (cells.length % 7 !== 0) cells.push(null)

    const max = metric === 'revenue' ? maxRevenue : maxTransactions

    return (
      <div key={`${year}-${month}`} className={styles.monthBlock}>
        <div className={styles.monthLabel}>{MONTHS[month]} {year}</div>
        <div className={styles.dayHeaders}>
          {DAYS.map((d, i) => (
            <span key={i} className={styles.dayHeader}>{d}</span>
          ))}
        </div>
        <div className={styles.grid}>
          {cells.map((date, i) => {
            if (!date) return <span key={i} className={styles.cellEmpty} />
            const iso  = getISODate(date)
            const data = dataMap[iso]
            const val  = data ? (metric === 'revenue' ? data.revenue : data.transactions) : 0
            const ratio = val && max ? Math.min(val / max, 1) : 0

            return (
              <span
                key={i}
                className={`${styles.cell} ${ratio > 0 ? styles.cellActive : ''}`}
                style={ratio > 0 ? { '--ratio': ratio } : {}}
                onMouseEnter={e => {
                  if (!data) return
                  const rect = e.target.getBoundingClientRect()
                  setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 8,
                    iso,
                    revenue: data.revenue,
                    transactions: data.transactions,
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Daily Activity</h2>
        <div className={styles.tabs}>
          {[
            { id: 'revenue',      label: 'Revenue' },
            { id: 'transactions', label: 'Trips'   },
          ].map(v => (
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

      <div className={styles.scroll}>
        <div className={styles.months}>
          {months.map(m => renderMonth(m))}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        {[0.15, 0.35, 0.55, 0.75, 1.0].map((r, i) => (
          <span key={i} className={styles.legendSwatch} style={{ '--ratio': r }} />
        ))}
        <span className={styles.legendLabel}>More</span>
      </div>

      {/* Monthly bar summary */}
      {monthlyData && monthlyData.length > 0 && (
        <div className={styles.monthBar}>
          {monthlyData.map(m => {
            const val = metric === 'revenue' ? m.revenue : m.transactions
            const maxVal = Math.max(...monthlyData.map(x => metric === 'revenue' ? x.revenue : x.transactions), 1)
            return (
              <div key={m.key} className={styles.monthBarItem}>
                <div className={styles.monthBarTrack}>
                  <div
                    className={styles.monthBarFill}
                    style={{ height: `${(val / maxVal) * 100}%` }}
                  />
                </div>
                <span className={styles.monthBarLabel}>{m.shortLabel}</span>
                <span className={styles.monthBarVal}>
                  {metric === 'revenue' ? fmt(val) : val}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className={styles.tooltipDate}>{fmtDate(tooltip.iso)}</div>
          <div className={styles.tooltipRow}>
            <span>Revenue:</span>
            <span className={styles.tooltipVal}>{fmt(tooltip.revenue)}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span>Trips:</span>
            <span className={styles.tooltipVal}>{tooltip.transactions}</span>
          </div>
        </div>
      )}
    </div>
  )
}
