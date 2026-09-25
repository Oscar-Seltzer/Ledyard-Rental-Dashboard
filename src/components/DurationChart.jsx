import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import styles from './ChartCard.module.css'

const GRADIENT_COLORS = [
  '#7ab893',
  '#62a87e',
  '#4a8c5c',
  '#3a7a52',
  '#2d5a3d',
  '#1e3f2b',
  '#162d1e',
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipDot} style={{ background:'var(--accent)' }} />
        <span>Rentals:</span>
        <span className={styles.tooltipVal}>{payload[0].value.toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function DurationChart({ durationData }) {
  const total = (durationData || []).reduce((s,d) => s + d.count, 0)

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Rental Duration</h2>
        <span className={styles.cardMeta}>{total.toLocaleString()} rentals with valid times</span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={durationData || []}
          margin={{ top:8, right:16, left:4, bottom:8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize:11, fill:'var(--text-muted)' }}
            tickLine={false} axisLine={false}
          />
          <YAxis
            tick={{ fontSize:11, fill:'var(--text-muted)' }}
            tickLine={false} axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill:'var(--accent-glow)' }} />
          <Bar dataKey="count" radius={[4,4,0,0]} name="Rentals">
            {(durationData || []).map((entry, i) => (
              <Cell key={i} fill={GRADIENT_COLORS[i % GRADIENT_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Duration insights row */}
      <div className={styles.insightRow}>
        {(durationData || []).map((d, i) => {
          const pct = total ? ((d.count / total) * 100).toFixed(0) : 0
          return (
            <div key={i} className={styles.insightChip}>
              <span className={styles.insightDot} style={{ background: GRADIENT_COLORS[i % GRADIENT_COLORS.length] }} />
              <span className={styles.insightLabel}>{d.label}</span>
              <span className={styles.insightPct}>{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
