import React from 'react'
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines'
import styles from './KpiRow.module.css'

function KpiCard({ label, value, sub, accent, sparkData, trend }) {
  return (
    <div className={`${styles.card} ${accent ? styles.cardAccent : ''}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {sub && <span className={styles.sub}>{sub}</span>}
      {sparkData && sparkData.length > 1 && (
        <div className={styles.spark}>
          <Sparklines data={sparkData} width={80} height={24} margin={2}>
            <SparklinesLine
              color={accent ? '#fff' : 'var(--accent)'}
              style={{ fill: 'none', strokeWidth: 1.5 }}
            />
            <SparklinesSpots
              size={2}
              style={{ fill: accent ? '#fff' : 'var(--accent)', stroke: 'none' }}
            />
          </Sparklines>
          {trend !== undefined && (
            <span className={`${styles.trendBadge} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function KpiRow({ kpis, weeklyData }) {
  if (!kpis) return null

  const fmt    = v => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:0, maximumFractionDigits:0 }).format(v)
  const fmtDec = v => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:2, maximumFractionDigits:2 }).format(v)

  // Best week
  const bestWeek = weeklyData ? [...weeklyData].sort((a,b) => b.revenue - a.revenue)[0] : null
  const bestWeekLabel = bestWeek
    ? bestWeek.date.toLocaleDateString('en-US', { month:'short', day:'numeric' })
    : null

  // Avg weekly revenue
  const avgWeekly = weeklyData && weeklyData.length > 1
    ? weeklyData.slice(0,-1).reduce((s,w) => s+w.revenue, 0) / (weeklyData.length - 1)
    : null

  // Sparkline data: weekly revenues
  const sparkRevenue = (weeklyData || []).slice(-8).map(w => w.revenue)

  // Week-over-week trend (last 2 complete weeks)
  const recentWeeks = (weeklyData || []).slice(-3, -1)
  let weekTrend
  if (recentWeeks.length === 2 && recentWeeks[0].revenue > 0) {
    weekTrend = Math.round(((recentWeeks[1].revenue - recentWeeks[0].revenue) / recentWeeks[0].revenue) * 100)
  }

  // Sparkline for avg transaction (all daily avgs)
  const avgSpark = (weeklyData || []).slice(-8).map(w =>
    w.transactions > 0 ? w.revenue / w.transactions : 0
  )

  return (
    <div className={styles.row}>
      <KpiCard
        accent
        label="Season Revenue"
        value={fmt(kpis.totalRevenue)}
        sub={`${kpis.totalTransactions.toLocaleString()} rentals`}
        sparkData={sparkRevenue}
        trend={weekTrend}
      />
      <KpiCard
        label="Avg per Rental"
        value={fmtDec(kpis.avgTransaction)}
        sub="per transaction"
        sparkData={avgSpark}
      />
      {avgWeekly && (
        <KpiCard
          label="Avg Weekly"
          value={fmt(avgWeekly)}
          sub="revenue / week"
          sparkData={sparkRevenue}
        />
      )}
      {bestWeek && (
        <KpiCard
          label="Best Week"
          value={fmt(bestWeek.revenue)}
          sub={`w/o ${bestWeekLabel}`}
        />
      )}
      {kpis.avgRevenuePerUnit > 0 && (
        <KpiCard
          label="Rev / Unit"
          value={fmtDec(kpis.avgRevenuePerUnit)}
          sub={`${kpis.totalUnitsRented.toLocaleString()} boats out`}
        />
      )}
    </div>
  )
}
