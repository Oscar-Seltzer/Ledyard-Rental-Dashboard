import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import styles from './ChartCard.module.css'
import unitStyles from './UnitEconomics.module.css'

const fmt  = v => `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)}`
const fmtDec = v => `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`

const COLORS = [
  'var(--canoe-color)',
  'var(--sup-color)',
  'var(--kayak-color)',
  'var(--dkayak-color)',
]

const VIEWS = [
  { id: 'avgPerUnit', label: 'Rev / Unit' },
  { id: 'units',     label: 'Units Out'  },
  { id: 'combo',     label: 'Combo Mix'  },
]

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const isRevenue = p.dataKey === 'avgPerUnit'
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{p.payload.name || p.payload.label}</div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipDot} style={{ background: p.fill || p.color || 'var(--accent)' }} />
        <span>{isRevenue ? 'Avg rev/unit' : p.dataKey === 'units' ? 'Units rented' : 'Trips'}:</span>
        <span className={styles.tooltipVal}>
          {isRevenue ? fmtDec(p.value) : p.value.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

const RADIAN = Math.PI / 180
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="var(--text-on-accent)" textAnchor="middle"
      dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function UnitEconomics({ unitEconomics, primaryBoatData, comboData }) {
  const [view, setView] = useState('avgPerUnit')

  const barData = (unitEconomics || []).map((u, i) => ({
    ...u,
    fill: COLORS[i % COLORS.length],
  }))

  const unitsData = (primaryBoatData || []).map((b, i) => ({
    name:  b.label,
    units: b.units,
    fill:  COLORS[i % COLORS.length],
  })).sort((a, b) => b.units - a.units)

  const comboColors = ['var(--accent)', 'var(--accent-light)']

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Unit Economics</h2>
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

      {view === 'avgPerUnit' && (
        <div>
          <p className={unitStyles.subtitle}>Average revenue generated per individual boat unit rented</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 60, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={v => `$${v}`}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false} axisLine={false}
              />
              <YAxis
                type="category" dataKey="name" width={96}
                tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                tickLine={false} axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent-glow)' }} />
              <Bar dataKey="avgPerUnit" radius={[0, 4, 4, 0]} name="Rev/unit"
                label={{ position: 'right', formatter: v => fmtDec(v), fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {view === 'units' && (
        <div>
          <p className={unitStyles.subtitle}>Total individual boat units rented out this season</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={unitsData} layout="vertical" margin={{ top: 4, right: 60, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false} axisLine={false}
              />
              <YAxis
                type="category" dataKey="name" width={96}
                tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                tickLine={false} axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent-glow)' }} />
              <Bar dataKey="units" radius={[0, 4, 4, 0]} name="Units"
                label={{ position: 'right', formatter: v => v.toLocaleString(), fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                {unitsData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {view === 'combo' && (
        <div className={unitStyles.comboWrap}>
          <div className={unitStyles.comboChart}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={comboData || []}
                  dataKey="revenue"
                  nameKey="label"
                  cx="50%" cy="50%"
                  outerRadius={90} innerRadius={42}
                  labelLine={false}
                  label={PieLabel}
                >
                  {(comboData || []).map((entry, i) => (
                    <Cell key={i} fill={comboColors[i % comboColors.length]} stroke="var(--bg-card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [
                    `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)}`,
                    name,
                  ]}
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={unitStyles.comboLegend}>
            <p className={unitStyles.subtitle} style={{ marginBottom: 14 }}>
              Combo bookings rent multiple boat types in one transaction — typically your largest tickets.
            </p>
            {(comboData || []).map((d, i) => (
              <div key={i} className={unitStyles.comboRow}>
                <span className={unitStyles.comboDot} style={{ background: comboColors[i % comboColors.length] }} />
                <span className={unitStyles.comboLabel}>{d.label}</span>
                <div className={unitStyles.comboNums}>
                  <span className={unitStyles.comboRev}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(d.revenue)}
                  </span>
                  <span className={unitStyles.comboTrips}>{d.transactions} trips</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
