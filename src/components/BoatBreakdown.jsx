import React, { useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import styles from './ChartCard.module.css'

const fmt = v => `$${new Intl.NumberFormat('en-US', { maximumFractionDigits:0 }).format(v)}`

const COLORS = [
  'var(--canoe-color)',
  'var(--sup-color)',
  'var(--kayak-color)',
  'var(--dkayak-color)',
  'var(--combo-color)',
]

const VIEWS = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'trips',   label: 'Trips' },
]

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{p.name || p.payload?.label}</div>
      <div className={styles.tooltipRow} style={{ color: p.color || p.payload?.fill }}>
        <span className={styles.tooltipDot} style={{ background: p.color || p.payload?.fill }} />
        <span>{p.dataKey === 'revenue' || p.name === 'revenue' ? 'Revenue' : 'Trips'}:</span>
        <span className={styles.tooltipVal}>
          {p.dataKey === 'revenue' || p.name === 'revenue'
            ? fmt(p.value)
            : p.value.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

const RADIAN = Math.PI / 180
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.04) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="var(--text-on-accent)" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={600} fontFamily="var(--font-body)">
      {`${(percent*100).toFixed(0)}%`}
    </text>
  )
}

export default function BoatBreakdown({ boatData, primaryBoatData }) {
  const [metric, setMetric] = useState('revenue')

  // For pie: top 5 + "Other"
  const sorted = [...(boatData || [])].sort((a,b) =>
    metric === 'revenue' ? b.revenue - a.revenue : b.transactions - a.transactions
  )
  const top5 = sorted.slice(0,5)
  const rest = sorted.slice(5)
  const otherVal = rest.reduce((s,r) => s + (metric === 'revenue' ? r.revenue : r.transactions), 0)
  const pieData = otherVal > 0
    ? [...top5, { label:'Other', revenue: otherVal, transactions: rest.reduce((s,r)=>s+r.transactions,0) }]
    : top5

  // Bar chart: primary boat types only
  const barData = (primaryBoatData || []).map(b => ({
    name: b.label,
    revenue: Math.round(b.revenue),
    transactions: b.transactions,
  }))

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Boat Type Breakdown</h2>
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

      <div className={styles.splitLayout}>
        {/* Pie */}
        <div className={styles.pieWrap}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey={metric === 'revenue' ? 'revenue' : 'transactions'}
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={50}
                labelLine={false}
                label={renderCustomLabel}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--bg-card)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className={styles.pieLegend}>
            {pieData.map((entry, i) => (
              <div key={i} className={styles.pieLegendRow}>
                <span className={styles.pieLegendDot} style={{ background: COLORS[i % COLORS.length] }} />
                <span className={styles.pieLegendLabel}>{entry.label}</span>
                <span className={styles.pieLegendVal}>
                  {metric === 'revenue' ? fmt(entry.revenue) : entry.transactions.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar */}
        <div className={styles.barWrap}>
          <div className={styles.barTitle}>Primary Boat Types</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top:4, right:16, left:4, bottom:4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={metric === 'revenue' ? v => `$${(v/1000).toFixed(1)}k` : v => v}
                tick={{ fontSize:11, fill:'var(--text-muted)' }} tickLine={false} axisLine={false}
              />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize:12, fill:'var(--text-secondary)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:'var(--accent-glow)' }} />
              <Bar
                dataKey={metric === 'revenue' ? 'revenue' : 'transactions'}
                fill="var(--accent)"
                radius={[0,4,4,0]}
                name={metric}
              >
                {barData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
