import React, { useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart,
} from 'recharts'
import styles from './ChartCard.module.css'

const fmt = v => `$${new Intl.NumberFormat('en-US', { maximumFractionDigits:0 }).format(v)}`

const VIEWS = [
  { id: 'revenue',      label: 'Revenue' },
  { id: 'transactions', label: 'Trips' },
]

function fmtHour(h) {
  if (h === 12) return '12 PM'
  if (h < 12) return `${h} AM`
  return `${h-12} PM`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{fmtHour(Number(label))}</div>
      {payload.map((p,i) => (
        <div key={i} className={styles.tooltipRow} style={{ color:'var(--accent)' }}>
          <span className={styles.tooltipDot} style={{ background:'var(--accent)' }} />
          <span>{p.name}:</span>
          <span className={styles.tooltipVal}>{p.name === 'Revenue' ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function TimeOfDay({ hourlyData, dowData }) {
  const [metric, setMetric] = useState('revenue')

  const hourChart = (hourlyData || []).map(h => ({
    hour: h.hour,
    Revenue: Math.round(h.revenue),
    Trips: h.transactions,
  }))

  const dowChart = (dowData || []).map(d => ({
    name: d.day.slice(0,3),
    Revenue: Math.round(d.revenue),
    Trips: d.transactions,
  }))

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Temporal Patterns</h2>
        <div className={styles.tabs}>
          {VIEWS.map(v => (
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

      <div className={styles.twoCharts}>
        {/* Hour of day */}
        <div>
          <div className={styles.subTitle}>By Hour of Day</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourChart} margin={{ top:4, right:8, left:4, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="hour"
                tickFormatter={fmtHour}
                tick={{ fontSize:10, fill:'var(--text-muted)' }}
                tickLine={false} axisLine={false}
                angle={-30} textAnchor="end" dy={4}
              />
              <YAxis
                tickFormatter={metric === 'revenue' ? v => `$${(v/1000).toFixed(1)}k` : v => v}
                tick={{ fontSize:10, fill:'var(--text-muted)' }}
                tickLine={false} axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:'var(--accent-glow)' }} />
              <Bar
                dataKey={metric === 'revenue' ? 'Revenue' : 'Trips'}
                name={metric === 'revenue' ? 'Revenue' : 'Trips'}
                fill="var(--accent)"
                radius={[3,3,0,0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Day of week */}
        <div>
          <div className={styles.subTitle}>By Day of Week</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dowChart} margin={{ top:4, right:8, left:4, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize:11, fill:'var(--text-muted)' }}
                tickLine={false} axisLine={false}
              />
              <YAxis
                tickFormatter={metric === 'revenue' ? v => `$${(v/1000).toFixed(1)}k` : v => v}
                tick={{ fontSize:10, fill:'var(--text-muted)' }}
                tickLine={false} axisLine={false}
              />
              <Tooltip
                formatter={(v, name) => [metric === 'revenue' ? fmt(v) : v, metric === 'revenue' ? 'Revenue' : 'Trips']}
                labelFormatter={l => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(l)] || l}
                contentStyle={{
                  background:'var(--bg-card)',
                  border:'1px solid var(--border)',
                  borderRadius:'8px',
                  color:'var(--text-primary)',
                  fontSize:'13px',
                }}
              />
              <Bar
                dataKey={metric === 'revenue' ? 'Revenue' : 'Trips'}
                fill="var(--accent-mid)"
                radius={[3,3,0,0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
