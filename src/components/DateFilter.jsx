import React, { useState } from 'react'
import styles from './DateFilter.module.css'

const PRESETS = [
  { label: 'All Time', id: 'all' },
  { label: 'Last 30d', id: '30d' },
  { label: 'Last 60d', id: '60d' },
  { label: 'This Month', id: 'month' },
  { label: 'Custom', id: 'custom' },
]

function toInputVal(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function DateFilter({ fullDateRange, onFilter }) {
  const [activePreset, setActivePreset] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd]     = useState('')

  function applyPreset(id) {
    setActivePreset(id)
    const now = new Date()
    if (id === 'all') {
      onFilter(null)
      return
    }
    if (id === '30d') {
      const start = new Date(now); start.setDate(now.getDate() - 30); start.setHours(0,0,0,0)
      onFilter({ start, end: new Date(now.setHours(23,59,59,999)) })
      return
    }
    if (id === '60d') {
      const start = new Date(now); start.setDate(now.getDate() - 60); start.setHours(0,0,0,0)
      onFilter({ start, end: new Date(now.setHours(23,59,59,999)) })
      return
    }
    if (id === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      onFilter({ start, end })
      return
    }
    // custom — don't apply until both dates selected
  }

  function applyCustom() {
    if (!customStart || !customEnd) return
    const start = new Date(customStart + 'T00:00:00')
    const end   = new Date(customEnd   + 'T23:59:59')
    if (start > end) return
    onFilter({ start, end })
  }

  const minDate = fullDateRange ? toInputVal(fullDateRange.min) : ''
  const maxDate = fullDateRange ? toInputVal(fullDateRange.max) : ''

  return (
    <div className={styles.bar}>
      <span className={styles.barLabel}>Period</span>
      <div className={styles.presets}>
        {PRESETS.map(p => (
          <button
            key={p.id}
            className={`${styles.preset} ${activePreset === p.id ? styles.presetActive : ''}`}
            onClick={() => applyPreset(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {activePreset === 'custom' && (
        <div className={styles.customRow}>
          <input
            type="date"
            className={styles.dateInput}
            min={minDate} max={maxDate}
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
          />
          <span className={styles.dash}>–</span>
          <input
            type="date"
            className={styles.dateInput}
            min={minDate} max={maxDate}
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
          />
          <button
            className={`${styles.preset} ${styles.applyBtn}`}
            onClick={applyCustom}
            disabled={!customStart || !customEnd}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
