import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import styles from './ChartCard.module.css'
import distStyles from './RevenueDistribution.module.css'

const BINS = [
  { label: '$0–5',    min: 0,   max: 5    },
  { label: '$5–10',   min: 5,   max: 10   },
  { label: '$10–15',  min: 10,  max: 15   },
  { label: '$15–20',  min: 15,  max: 20   },
  { label: '$20–30',  min: 20,  max: 30   },
  { label: '$30–50',  min: 30,  max: 50   },
  { label: '$50–100', min: 50,  max: 100  },
  { label: '$100+',   min: 100, max: 99999 },
]

function percentile(sorted, p) {
  const idx = Math.floor(sorted.length * p)
  return sorted[Math.min(idx, sorted.length - 1)]
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipDot} style={{ background: 'var(--accent)' }} />
        <span>Transactions:</span>
        <span className={styles.tooltipVal}>{payload[0].value.toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function RevenueDistribution({ withRevenue }) {
  const revenues = useMemo(() =>
    (withRevenue || [])
      .map(r => r.revenue)
      .filter(v => v !== null && v > 0)
      .sort((a, b) => a - b),
    [withRevenue]
  )

  const stats = useMemo(() => {
    if (!revenues.length) return {}
    return {
      p25: percentile(revenues, 0.25),
      p50: percentile(revenues, 0.50),
      p75: percentile(revenues, 0.75),
      p90: percentile(revenues, 0.90),
      mean: revenues.reduce((s, v) => s + v, 0) / revenues.length,
    }
  }, [revenues])

  const bins = useMemo(() =>
    BINS.map(b => ({
      label: b.label,
      count: revenues.filter(v => v >= b.min && v < b.max).length,
    })),
    [revenues]
  )

  const maxCount = Math.max(...bins.map(b => b.count), 1)

  const fmtMoney = v => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v)

  const pctils = [
    { label: 'p25', val: stats.p25, color: 'var(--accent-light)' },
    { label: 'Median', val: stats.p50, color: 'var(--accent)' },
    { label: 'Mean', val: stats.mean, color: 'var(--accent-pop)' },
    { label: 'p75', val: stats.p75, color: 'var(--accent-mid)' },
    { label: 'p90', val: stats.p90, color: 'var(--dkayak-color)' },
  ]

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Transaction Size Distribution</h2>
        <span className={styles.cardMeta}>{revenues.length.toLocaleString()} paid trips</span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={bins} margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false} axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false} axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent-glow)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Transactions">
            {bins.map((b, i) => {
              const ratio = b.count / maxCount
              return <Cell key={i} fill={`var(--accent)`} opacity={0.25 + ratio * 0.75} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Percentile stat row */}
      <div className={distStyles.statRow}>
        {pctils.map(p => (
          <div key={p.label} className={distStyles.statCell}>
            <span className={distStyles.statDot} style={{ background: p.color }} />
            <span className={distStyles.statLabel}>{p.label}</span>
            <span className={distStyles.statVal}>{fmtMoney(p.val)}</span>
          </div>
        ))}
      </div>

      {/* Insight callout */}
      <div className={distStyles.callout}>
        Half of all trips are under <strong>{fmtMoney(stats.p50)}</strong>, but the top 10% generate over <strong>{fmtMoney(stats.p90)}</strong> each — focus on converting those high-value combo bookings.
      </div>
    </div>
  )
}
