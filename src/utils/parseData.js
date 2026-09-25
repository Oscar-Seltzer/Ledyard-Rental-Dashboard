/**
 * parseData.js
 * Fetches /master.csv (from public/) and returns all derived datasets.
 * Re-run any time master.csv is updated — no hardcoded values.
 */
import Papa from 'papaparse'

/* ── boat-type detection ───────────────────────────────── */
const BOAT_LABELS = {
  Canoe:  'Canoe',
  SUP:    'SUP',
  Kayak:  'Kayak',
  DKayak: 'Double Kayak',
}

function detectBoatTypes(itemsStr) {
  if (!itemsStr) return []
  const types = []
  if (itemsStr.includes('Canoe'))               types.push('Canoe')
  if (itemsStr.includes('Paddleboard'))          types.push('SUP')
  if (itemsStr.includes('Single Kayak'))         types.push('Kayak')
  if (itemsStr.includes('Double Kayak'))         types.push('DKayak')
  return types
}

/**
 * Parse quantity from an item segment like "Canoe (Capacity: 2-3 People) x3"
 * Returns the integer after the last "x", defaulting to 1.
 */
function parseQty(segment) {
  const m = segment.match(/x(\d+)\s*$/)
  return m ? parseInt(m[1], 10) : 1
}

/**
 * For each row's Items string, extract per-boat-type unit counts.
 * Returns { Canoe: n, SUP: n, Kayak: n, DKayak: n }
 */
function extractUnitCounts(itemsStr) {
  if (!itemsStr) return { Canoe:0, SUP:0, Kayak:0, DKayak:0 }
  const segments = itemsStr.split('|').map(s => s.trim())
  const counts = { Canoe:0, SUP:0, Kayak:0, DKayak:0 }
  for (const seg of segments) {
    const qty = parseQty(seg)
    if (seg.includes('Double Kayak'))                    counts.DKayak += qty
    else if (seg.includes('Single Kayak'))               counts.Kayak  += qty
    else if (seg.includes('Paddleboard'))                counts.SUP    += qty
    else if (seg.includes('Canoe'))                      counts.Canoe  += qty
  }
  return counts
}

function boatTypeLabel(types) {
  if (!types.length) return 'Other'
  return types.map(t => BOAT_LABELS[t]).join(' + ')
}

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/* ── main parse ────────────────────────────────────────── */
export async function loadData(dateFilter = null) {
  const res = await fetch('/master.csv')
  if (!res.ok) throw new Error(`Could not load master.csv: ${res.status}`)
  const text = await res.text()

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        try {
          const raw = results.data.map(row => {
            const issuedAt    = row['Issued At']    ? new Date(row['Issued At'])    : null
            const completedAt = row['Completed At'] ? new Date(row['Completed At']) : null
            const revenue     = parseFloat(String(row['Adjusted total']).replace(/[$,]/g, ''))
            const durationHrs = (issuedAt && completedAt)
              ? (completedAt - issuedAt) / 3_600_000
              : null
            const boatTypes   = detectBoatTypes(row['Items'])
            const unitCounts  = extractUnitCounts(row['Items'])
            const totalUnits  = Object.values(unitCounts).reduce((s, n) => s + n, 0)
            const isCombo     = boatTypes.length > 1
            return {
              items: row['Items'] || '',
              issuedAt,
              completedAt,
              revenue:      isNaN(revenue) ? null : revenue,
              durationHrs,
              boatTypes,
              boatLabel:    boatTypeLabel(boatTypes),
              unitCounts,
              totalUnits,
              isCombo,
              hour:      issuedAt ? issuedAt.getHours() : null,
              dayOfWeek: issuedAt
                ? issuedAt.toLocaleDateString('en-US', { weekday: 'long' })
                : null,
              month:     issuedAt ? issuedAt.getMonth() : null,  // 0-indexed
              year:      issuedAt ? issuedAt.getFullYear() : null,
            }
          }).filter(r => r.issuedAt && !isNaN(r.issuedAt.getTime()))

          /* ── Date filter ── */
          const filtered = dateFilter
            ? raw.filter(r => r.issuedAt >= dateFilter.start && r.issuedAt <= dateFilter.end)
            : raw

          const withRevenue = filtered.filter(r => r.revenue !== null && r.revenue > 0)

          /* ── KPIs ── */
          const totalRevenue      = withRevenue.reduce((s, r) => s + r.revenue, 0)
          const totalTransactions = withRevenue.length
          const avgTransaction    = totalTransactions ? totalRevenue / totalTransactions : 0
          const totalUnitsRented  = withRevenue.reduce((s, r) => s + r.totalUnits, 0)
          const avgRevenuePerUnit = totalUnitsRented ? totalRevenue / totalUnitsRented : 0

          const allDates = filtered.map(r => r.issuedAt)
          const dateRange = {
            min: new Date(Math.min(...allDates)),
            max: new Date(Math.max(...allDates)),
          }

          /* ── Combo vs Solo ── */
          const comboRentals = withRevenue.filter(r => r.isCombo)
          const soloRentals  = withRevenue.filter(r => !r.isCombo)
          const comboRevenue = comboRentals.reduce((s, r) => s + r.revenue, 0)
          const soloRevenue  = soloRentals.reduce((s, r) => s + r.revenue, 0)
          const comboData = [
            { label: 'Combo Rental',  revenue: comboRevenue, transactions: comboRentals.length },
            { label: 'Single Type',   revenue: soloRevenue,  transactions: soloRentals.length  },
          ]

          /* ── Weekly aggregation ── */
          const weekMap = new Map()
          withRevenue.forEach(r => {
            const d = new Date(r.issuedAt)
            const day = d.getDay()
            const sunday = new Date(d)
            sunday.setDate(d.getDate() - day)
            sunday.setHours(0, 0, 0, 0)
            const key = sunday.toISOString().slice(0, 10)
            if (!weekMap.has(key)) weekMap.set(key, { date: new Date(sunday), revenue: 0, transactions: 0 })
            const w = weekMap.get(key)
            w.revenue      += r.revenue
            w.transactions += 1
          })
          const weeklyData = [...weekMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => v)
          let cum = 0
          weeklyData.forEach(w => { cum += w.revenue; w.cumulative = cum })

          /* ── Monthly aggregation ── */
          const monthMap = new Map()
          withRevenue.forEach(r => {
            const key = `${r.year}-${String(r.month).padStart(2, '0')}`
            if (!monthMap.has(key)) monthMap.set(key, {
              key, year: r.year, month: r.month,
              label: `${MONTH_NAMES[r.month]} ${r.year}`,
              shortLabel: MONTH_NAMES[r.month],
              revenue: 0, transactions: 0,
            })
            const m = monthMap.get(key)
            m.revenue      += r.revenue
            m.transactions += 1
          })
          const monthlyData = [...monthMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => v)

          /* ── Day-of-week ── */
          const dowMap = {}
          DAY_ORDER.forEach(d => { dowMap[d] = { day: d, revenue: 0, transactions: 0 } })
          withRevenue.forEach(r => {
            if (r.dayOfWeek && dowMap[r.dayOfWeek]) {
              dowMap[r.dayOfWeek].revenue      += r.revenue
              dowMap[r.dayOfWeek].transactions += 1
            }
          })
          const dowData = DAY_ORDER.map(d => dowMap[d])

          /* ── Hourly ── */
          const hourMap = {}
          for (let h = 8; h <= 20; h++) hourMap[h] = { hour: h, revenue: 0, transactions: 0 }
          withRevenue.forEach(r => {
            const h = r.hour
            if (h !== null && hourMap[h]) {
              hourMap[h].revenue      += r.revenue
              hourMap[h].transactions += 1
            }
          })
          const hourlyData = Object.values(hourMap)

          /* ── Boat type breakdown ── */
          const boatMap = {}
          withRevenue.forEach(r => {
            const label = r.boatLabel
            if (!boatMap[label]) boatMap[label] = { label, revenue: 0, transactions: 0 }
            boatMap[label].revenue      += r.revenue
            boatMap[label].transactions += 1
          })
          const boatData = Object.values(boatMap).sort((a, b) => b.revenue - a.revenue)

          /* ── Primary boat types (for filter) ── */
          const primaryBoatData = ['Canoe', 'SUP', 'Kayak', 'DKayak'].map(key => {
            const label = BOAT_LABELS[key]
            const rows  = withRevenue.filter(r => r.boatTypes.includes(key))
            const units = rows.reduce((s, r) => s + r.unitCounts[key], 0)
            return {
              key, label,
              revenue:      rows.reduce((s, r) => s + r.revenue, 0),
              transactions: rows.length,
              units,
              avgPerUnit:   units ? rows.reduce((s, r) => s + r.revenue, 0) / units : 0,
            }
          }).filter(b => b.transactions > 0)

          /* ── Unit economics ── */
          const unitEconomics = primaryBoatData.map(b => ({
            name: b.label,
            avgPerUnit: Math.round(b.avgPerUnit * 100) / 100,
            units: b.units,
          })).sort((a, b) => b.avgPerUnit - a.avgPerUnit)

          /* ── Duration distribution ── */
          const durBins = [
            { label: '<30 min',   min: 0,   max: 0.5  },
            { label: '30–60 min', min: 0.5, max: 1    },
            { label: '1–1.5 hr',  min: 1,   max: 1.5  },
            { label: '1.5–2 hr',  min: 1.5, max: 2    },
            { label: '2–3 hr',    min: 2,   max: 3    },
            { label: '3–5 hr',    min: 3,   max: 5    },
            { label: '5+ hr',     min: 5,   max: 999  },
          ]
          const validDur    = filtered.filter(r => r.durationHrs !== null && r.durationHrs > 0 && r.durationHrs < 24)
          const durationData = durBins.map(b => ({
            label: b.label,
            count: validDur.filter(r => r.durationHrs >= b.min && r.durationHrs < b.max).length,
          }))

          /* ── Daily data ── */
          const dailyMap = new Map()
          withRevenue.forEach(r => {
            const key = r.issuedAt.toLocaleDateString('en-CA')
            if (!dailyMap.has(key)) dailyMap.set(key, { date: key, revenue: 0, transactions: 0 })
            const d = dailyMap.get(key)
            d.revenue      += r.revenue
            d.transactions += 1
          })
          const dailyData = [...dailyMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => v)

          /* ── Calendar heatmap data ── */
          // Returns all daily data with ISO date string for heatmap rendering
          const calendarData = dailyData.map(d => ({
            date:         d.date,
            revenue:      d.revenue,
            transactions: d.transactions,
          }))

          /* ── Forecast (weighted linear, 7 weeks) ── */
          const n  = weeklyData.length
          const xs = weeklyData.map((_, i) => i)
          const ys = weeklyData.map(w => w.cumulative)

          const weights = xs.map((_, i) => {
            if (i === n - 1) return 1.0
            if (i === n - 2) return 1.0
            if (i === n - 3) return 0.5
            return 0.05
          })
          let wx = 0, wy = 0, wxx = 0, wxy = 0, wsum = 0
          xs.forEach((x, i) => {
            wx   += weights[i] * x
            wy   += weights[i] * ys[i]
            wxx  += weights[i] * x * x
            wxy  += weights[i] * x * ys[i]
            wsum += weights[i]
          })
          const denom     = wsum * wxx - wx * wx
          const m         = denom ? (wsum * wxy - wx * wy) / denom : 500
          const slope     = Math.max(m, 500)
          const intercept = (wy - slope * wx) / wsum

          const lastWeek = weeklyData[n - 1]
          const lastDate = new Date(lastWeek.date)
          const lastCum  = lastWeek.cumulative

          const forecastData = []
          for (let i = 1; i <= 7; i++) {
            const fd = new Date(lastDate)
            fd.setDate(fd.getDate() + 7 * i)
            const fitVal = slope * (n - 1 + i) + intercept
            forecastData.push({
              date:       fd,
              cumulative: Math.max(lastCum + slope * i, fitVal),
              isForecast: true,
            })
          }

          /* ── Auto-insights ── */
          const insights = []

          // Best day of week
          const bestDow = [...dowData].sort((a, b) => b.revenue - a.revenue)[0]
          if (bestDow) insights.push({
            text: `${bestDow.day}s are your strongest day — ${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(bestDow.revenue)} in revenue this season.`,
          })

          // Peak hour
          const peakHour = [...hourlyData].sort((a, b) => b.transactions - a.transactions)[0]
          if (peakHour) {
            const h = peakHour.hour
            const label = h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`
            insights.push({
              text: `${label} is your peak checkout hour with ${peakHour.transactions} rentals — staff accordingly.`,
            })
          }

          // Combo rental share
          const comboPct = totalTransactions ? Math.round((comboRentals.length / totalTransactions) * 100) : 0
          if (comboPct > 0) insights.push({
            text: `${comboPct}% of rentals are combo bookings (multiple boat types). These average ${
              comboRentals.length
                ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(comboRevenue / comboRentals.length)
                : '$0'
            } each — your highest-value transactions.`,
          })

          // Best boat by revenue per unit
          const bestUnit = unitEconomics[0]
          if (bestUnit) insights.push({
            text: `${bestUnit.name}s generate the highest revenue per unit rented at ${
              new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(bestUnit.avgPerUnit)
            } per boat.`,
          })

          // Weekend vs weekday
          const weekendRevenue  = ['Saturday','Sunday'].reduce((s, d) => s + (dowMap[d]?.revenue || 0), 0)
          const weekdayRevenue  = ['Monday','Tuesday','Wednesday','Thursday','Friday'].reduce((s, d) => s + (dowMap[d]?.revenue || 0), 0)
          const weekendPct      = totalRevenue ? Math.round((weekendRevenue / totalRevenue) * 100) : 0
          insights.push({
            text: `Weekends account for ${weekendPct}% of total revenue (${
              new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(weekendRevenue)
            } vs ${
              new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(weekdayRevenue)
            } on weekdays).`,
          })

          // Most popular duration
          const topDur = [...durationData].sort((a, b) => b.count - a.count)[0]
          if (topDur && topDur.count > 0) insights.push({
            text: `Most rentals (${topDur.count}) fall in the ${topDur.label} range — consider pricing tiers around this sweet spot.`,
          })

          resolve({
            raw: filtered,
            withRevenue,
            kpis: {
              totalRevenue,
              totalTransactions,
              avgTransaction,
              totalUnitsRented,
              avgRevenuePerUnit,
              dateRange,
            },
            weeklyData,
            monthlyData,
            forecastData,
            dowData,
            hourlyData,
            boatData,
            primaryBoatData,
            unitEconomics,
            durationData,
            dailyData,
            calendarData,
            comboData,
            insights,
            /* raw date range for filter UI (always full dataset) */
            fullDateRange: {
              min: new Date(Math.min(...raw.map(r => r.issuedAt))),
              max: new Date(Math.max(...raw.map(r => r.issuedAt))),
            },
          })
        } catch (err) {
          reject(err)
        }
      },
      error: reject,
    })
  })
}
