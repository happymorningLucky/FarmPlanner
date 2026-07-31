import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const lat = searchParams.get('lat') || '13.75'
    const lon = searchParams.get('lon') || '100.5167'

    // 1. Fetch Open-Meteo (Base Data)
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,relative_humidity_2m_mean,precipitation_probability_max&timezone=auto&forecast_days=14&past_days=31`
    const omRes = await fetch(openMeteoUrl)
    const omData = await omRes.json()

    let mergedDaily = {
      time: [...omData.daily.time],
      temperature_2m_max: [...omData.daily.temperature_2m_max],
      relative_humidity_2m_mean: [...omData.daily.relative_humidity_2m_mean],
      precipitation_probability_max: [...omData.daily.precipitation_probability_max],
      source: omData.daily.time.map(() => 'Global') // Default source
    }

    // 2. Try fetching TMD Data if API key is present
    const tmdKey = process.env.TMD_API_KEY
    if (tmdKey) {
      try {
        // We use Bangkok as default for this example. A real app might map lat/lon to province.
        const tmdUrl = `https://data.tmd.go.th/api/WeatherForecast7Days/V1/?type=json&province=กรุงเทพมหานคร`
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3500) // 3.5s timeout for Vercel

        const tmdRes = await fetch(tmdUrl, {
          headers: {
            'Authorization': `Bearer ${tmdKey}`,
            'Accept': 'application/json'
          },
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (tmdRes.ok) {
          const tmdData = await tmdRes.json()
          const provinceData = tmdData?.Provinces?.[0]
          const forecasts = provinceData?.WeatherForecasts
          
          if (forecasts && Array.isArray(forecasts)) {
            // Map TMD forecast to our arrays
            forecasts.forEach((f: any) => {
              // TMD Date format usually "YYYY-MM-DD" or similar
              const dateStr = f.Date ? f.Date.split(' ')[0] : null // Ensure YYYY-MM-DD
              if (dateStr) {
                const idx = mergedDaily.time.indexOf(dateStr)
                if (idx !== -1) {
                  // Replace with TMD data
                  if (f.tc_max !== undefined) mergedDaily.temperature_2m_max[idx] = parseFloat(f.tc_max)
                  if (f.rh !== undefined) mergedDaily.relative_humidity_2m_mean[idx] = parseFloat(f.rh)
                  // rain probability in TMD is usually 'cond' (condition) or not precisely provided as %, so we fallback/keep OM's precip prob.
                  mergedDaily.source[idx] = 'TMD'
                }
              }
            })
          }
        }
      } catch (err) {
        console.error("Failed to fetch TMD data, falling back to Open-Meteo", err)
      }
    }

    return NextResponse.json({ daily: mergedDaily })

  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
