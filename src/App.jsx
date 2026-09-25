import React, { useEffect, useState, useCallback } from 'react'
import { useCountUp } from './hooks/useCountUp'
import { loadData } from './utils/parseData'
import Header        from './components/Header'
import KpiRow        from './components/KpiRow'
import RevenueTimeSeries from './components/RevenueTimeSeries'
import BoatBreakdown from './components/BoatBreakdown'
import TimeOfDay     from './components/TimeOfDay'
import DurationChart from './components/DurationChart'
import InsightsPanel from './components/InsightsPanel'
import CalendarHeatmap from './components/CalendarHeatmap'
import UnitEconomics from './components/UnitEconomics'
import HeatmapGrid from './components/HeatmapGrid'
import RevenueDistribution from './components/RevenueDistribution'
import DateFilter    from './components/DateFilter'
import styles from './App.module.css'

function getInitialTheme() {
  const stored = localStorage.getItem('ledyard-theme')
  if (stored === 'dark' || stored === 'light') return stored
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export default function App() {
  const [theme, setTheme]     = useState(getInitialTheme)
  const [rawData, setRawData] = useState(null)   // full unfiltered parse
  const [data, setData]       = useState(null)   // currently displayed (filtered)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [dateFilter, setDateFilter] = useState(null)
  const [filtering, setFiltering]   = useState(false)

  /* Apply theme to root */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ledyard-theme', theme)
  }, [theme])

  /* Initial load — full dataset */
  useEffect(() => {
    loadData(null)
      .then(d => {
        setRawData(d)
        setData(d)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  /* Re-filter when date range changes */
  const handleFilter = useCallback(filter => {
    setDateFilter(filter)
    setFiltering(true)
    loadData(filter)
      .then(d => { setData(d); setFiltering(false) })
      .catch(() => setFiltering(false))
  }, [])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  // Always call hooks unconditionally (Rules of Hooks)
  const animatedRevenue = useCountUp(data?.kpis?.totalRevenue ?? 0, 900, 0)

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingInner}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Loading rental data…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className={styles.loadingScreen}>
      <div className={styles.errorBox}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>Failed to load master.csv</p>
        <code>{error}</code>
      </div>
    </div>
  )

  const totalRevFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(animatedRevenue)

  return (
    <div className={styles.app}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        dateRange={data?.kpis?.dateRange}
        filtered={!!dateFilter}
        totalTransactions={data?.kpis?.totalTransactions}
      />

      {/* Date filter bar */}
      <DateFilter
        fullDateRange={rawData?.fullDateRange}
        onFilter={handleFilter}
      />

      <main className={`${styles.main} ${filtering ? styles.mainFiltering : ''}`}>
        {/* Hero section */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>
              {dateFilter ? 'Filtered View' : 'Season Overview'}
            </p>
            <h1 className={styles.heroHeadline}>Rental Analytics</h1>
            <p className={styles.heroSub}>
              Live from <code className={styles.heroCode}>master.csv</code>
            </p>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>${totalRevFmt}</span>
            <span className={styles.heroStatLabel}>
              {dateFilter ? 'Period Revenue' : 'Season Revenue'}
            </span>
          </div>
        </section>

        {/* KPIs */}
        <KpiRow kpis={data.kpis} weeklyData={data.weeklyData} />

        {/* Insights */}
        <div className={styles.insightsWrap}>
          <InsightsPanel insights={data.insights} />
        </div>

        {/* Charts grid */}
        <div className={styles.grid}>
          {/* Full-width: time series */}
          <div className={styles.colFull}>
            <RevenueTimeSeries
              weeklyData={data.weeklyData}
              forecastData={data.forecastData}
              dailyData={data.dailyData}
              monthlyData={data.monthlyData}
            />
          </div>

          {/* Full-width: calendar heatmap */}
          <div className={styles.colFull}>
            <CalendarHeatmap
              calendarData={data.calendarData}
              monthlyData={data.monthlyData}
            />
          </div>

          {/* Half-half: boat breakdown + temporal */}
          <div className={styles.colHalf}>
            <BoatBreakdown
              boatData={data.boatData}
              primaryBoatData={data.primaryBoatData}
            />
          </div>
          <div className={styles.colHalf}>
            <TimeOfDay
              hourlyData={data.hourlyData}
              dowData={data.dowData}
            />
          </div>

          {/* Half: duration chart */}
          <div className={styles.colHalf}>
            <DurationChart durationData={data.durationData} />
          </div>

          {/* Half: unit economics */}
          <div className={styles.colHalf}>
            <UnitEconomics
              unitEconomics={data.unitEconomics}
              primaryBoatData={data.primaryBoatData}
              comboData={data.comboData}
            />
          </div>

          {/* Full-width: hour × day heatmap */}
          <div className={styles.colFull}>
            <HeatmapGrid raw={data.raw} />
          </div>

          {/* Half: revenue distribution */}
          <div className={styles.colHalf}>
            <RevenueDistribution withRevenue={data.withRevenue} />
          </div>

          {/* Half: top days table */}
          <div className={styles.colHalf}>
            <TopDaysTable dailyData={data.dailyData} />
          </div>

          {/* Half: weekly leaderboard */}
          <div className={styles.colHalf}>
            <TopWeeksTable weeklyData={data.weeklyData} />
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>Ledyard Canoe Club · Rental Dashboard</span>
        <span className={styles.footerMeta}>
          {data.kpis.totalTransactions.toLocaleString()} transactions · Data sourced from master.csv
        </span>
      </footer>
    </div>
  )
}

/* ── Top Revenue Days ──────────────────────────────────── */
function TopDaysTable({ dailyData }) {
  const fmt = v => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:2 }).format(v)
  const top = [...(dailyData || [])].sort((a,b) => b.revenue - a.revenue).slice(0,8)
  const max = top[0]?.revenue || 1

  const fmtDate = s => {
    const d = new Date(s + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Top Revenue Days</h2>
      </div>
      <div className={styles.tableBody}>
        {top.map((d, i) => (
          <div key={d.date} className={styles.tableRow}>
            <span className={styles.tableRank}>{i + 1}</span>
            <div className={styles.tableInfo}>
              <span className={styles.tableDate}>{fmtDate(d.date)}</span>
              <div className={styles.tableBar}>
                <div className={styles.tableBarFill} style={{ width: `${(d.revenue / max) * 100}%` }} />
              </div>
            </div>
            <div className={styles.tableNums}>
              <span className={styles.tableRev}>{fmt(d.revenue)}</span>
              <span className={styles.tableTx}>{d.transactions} trips</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Top Revenue Weeks ─────────────────────────────────── */
function TopWeeksTable({ weeklyData }) {
  const fmt = v => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:0, maximumFractionDigits:0 }).format(v)
  const top = [...(weeklyData || [])].sort((a,b) => b.revenue - a.revenue).slice(0,8)
  const max = top[0]?.revenue || 1

  const fmtDate = d => {
    if (!d) return ''
    const dt = d instanceof Date ? d : new Date(d)
    return dt.toLocaleDateString('en-US', { month:'short', day:'numeric' })
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Top Revenue Weeks</h2>
      </div>
      <div className={styles.tableBody}>
        {top.map((w, i) => (
          <div key={fmtDate(w.date)} className={styles.tableRow}>
            <span className={styles.tableRank}>{i + 1}</span>
            <div className={styles.tableInfo}>
              <span className={styles.tableDate}>Week of {fmtDate(w.date)}</span>
              <div className={styles.tableBar}>
                <div className={styles.tableBarFill} style={{ width: `${(w.revenue / max) * 100}%` }} />
              </div>
            </div>
            <div className={styles.tableNums}>
              <span className={styles.tableRev}>{fmt(w.revenue)}</span>
              <span className={styles.tableTx}>{w.transactions} trips</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
