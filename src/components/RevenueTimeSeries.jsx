import React, { useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import styles from './ChartCard.module.css'

const fmt = v => `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)}`

const VIEWS = [
  { id: 'monthly',    label: 'Monthly'             },
  { id: 'weekly-bar', label: 'Weekly Revenue'       },
  { id: 'cumulative', label: 'Cumulative + Forecast' },
  { id: 'daily',      label: 'Daily'                },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className={styles.tooltipRow} style={{ color: p.color }}>
          <span className={styles.tooltipDot} style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className={styles.tooltipVal}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function RevenueTimeSeries({ weeklyData, forecastData, dailyData, monthlyData }) {
  const [view, setView] = useState('monthly')

  const fmtDate = d => {
    if (!d) return ''
    const dt = d instanceof Date ? d : new Date(d)
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  /* ── Monthly bar data ── */
  const monthlyChartData = (monthlyData || []).map(m => ({
    name:         m.label,
    Revenue:      Math.round(m.revenue),
    Transactions: m.transactions,
  }))

  /* ── Weekly bar data ── */
  const weeklyChartData = (weeklyData || []).slice(0, -1).map(w => ({
    name:         fmtDate(w.date),
    Revenue:      Math.round(w.revenue),
    Transactions: w.transactions,
  }))

  /* ── Cumulative + forecast ── */
  const actualCum = (weeklyData || []).map((w, i) => ({
    name:   fmtDate(w.date),
    Actual: Math.round(w.cumulative),
    idx:    i,
  }))
  const forecastCum = (forecastData || []).map((f, i) => ({
    name:     fmtDate(f.date),
    Forecast: Math.round(f.cumulative),
    idx:      (weeklyData?.length || 0) + i,
  }))
  const lastActual = actualCum[actualCum.length - 1]
  if (lastActual && forecastCum.length) {
    forecastCum[0] = { ...forecastCum[0], Forecast: lastActual.Actual }
  }
  const cumulativeData = [
    ...actualCum,
    ...forecastCum.map(f => ({ name: f.name, Forecast: f.Forecast })),
  ]

  /* ── Daily ── */
  const dailyChartData = (dailyData || []).map(d => ({
    name:    fmtDate(d.date),
    Revenue: Math.round(d.revenue),
    Transactions: d.transactions,
  }))

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Revenue Over Time</h2>
        <div className={styles.tabs}>
          {VIEWS.map(v => (
            <button
              key={v.id}
              className={`${styles.tab} ${view === v.id ? styles.tabActive : ''}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chartWrap}>
        {/* ── Monthly ── */}
        {view === 'monthly' && (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={monthlyChartData} margin={{ top: 8, right: 16, left: 8, bottom: 28 }}>
              <defs>
                <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0}  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                tickLine={false} axisLine={false}
              />
              <YAxis
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false} axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent-glow)' }} />
              <Bar dataKey="Revenue" fill="var(--accent)" radius={[5, 5, 0, 0]} name="Revenue" />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {/* ── Weekly ── */}
        {view === 'weekly-bar' && (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={weeklyChartData} margin={{ top: 8, right: 16, left: 8, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false} axisLine={false}
                angle={-35} textAnchor="end" dy={8}
              />
              <YAxis
                tickFormatter={v => `$${(v / 1000).toFixed(1)}k`}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false} axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent-glow)' }} />
              <Bar dataKey="Revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Revenue" />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {/* ── Cumulative ── */}
        {view === 'cumulative' && (
          <div>
            <div className={styles.forecastNote}>
              <span className={styles.forecastDot} />
              Dashed = 7-week weighted-linear forecast
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={cumulativeData} margin={{ top: 8, right: 16, left: 8, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false} axisLine={false}
                  angle={-35} textAnchor="end" dy={8} interval={1}
                />
                <YAxis
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false} axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                <Area
                  type="monotone" dataKey="Actual"
                  stroke="var(--accent)" strokeWidth={2.5}
                  fill="var(--forecast-fill)"
                  dot={false} name="Actual" connectNulls
                />
                <Line
                  type="monotone" dataKey="Forecast"
                  stroke="var(--accent-light)" strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false} name="Forecast" connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Daily ── */}
        {view === 'daily' && (
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={dailyChartData} margin={{ top: 8, right: 16, left: 8, bottom: 28 }}>
              <defs>
                <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0}  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false} axisLine={false}
                angle={-35} textAnchor="end" dy={8} interval={6}
              />
              <YAxis
                tickFormatter={v => `$${v}`}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false} axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
              <Area
                type="monotone" dataKey="Revenue"
                stroke="var(--accent)" strokeWidth={2}
                fill="url(#dailyGrad)"
                dot={false} name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
