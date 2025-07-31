import { NextRequest, NextResponse } from "next/server"
import axios from "axios"
import puppeteer from "puppeteer"

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]

interface Proxy {
  ip: string
  port: number
  protocol: string
  anonymity: string
  country: string
  city?: string
  isp?: string
  latency?: number
  uptime?: number
  lastChecked?: string
}

interface ProxyResponse {
  success: boolean
  proxies?: Proxy[]
  error?: string
  source: 'api' | 'scraping'
  count: number
}

function log(level: string, message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString()
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`)
  if (data) console.log(`[${timestamp}] [DATA]`, data)
}

// Try to get proxies via API first
async function getProxiesViaAPI(): Promise<Proxy[]> {
  log('info', '🌐 Attempting to fetch proxies via API...')
  
  try {
    // Try proxy5.net API endpoint (if available)
    const apiResponse = await axios.get('https://proxy5.net/api/proxies?country=IN&format=json', {
      timeout: 10000,
      headers: {
        "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        "Accept": "application/json"
      }
    })
    
    if (apiResponse.data && Array.isArray(apiResponse.data)) {
      const proxies = apiResponse.data.map((proxy: any) => ({
        ip: proxy.ip || proxy.address,
        port: parseInt(proxy.port),
        protocol: proxy.protocol?.toLowerCase() || 'http',
        anonymity: proxy.anonymity || 'unknown',
        country: proxy.country || 'IN',
        city: proxy.city,
        isp: proxy.isp,
        latency: proxy.latency,
        uptime: proxy.uptime,
        lastChecked: proxy.lastChecked
      }))
      
      log('success', `✅ API returned ${proxies.length} proxies`)
      return proxies
    }
  } catch (error) {
    log('warning', `⚠️ API request failed: ${error.message}`)
  }
  
  // Try alternative API endpoints
  const alternativeAPIs = [
    'https://api.getproxylist.com/proxy?country[]=IN&protocol[]=http&protocol[]=https&anonymity[]=anonymous&anonymity[]=high%20anonymity&maxConnectTime=3&minUptime=70',
    'https://www.proxy-list.download/api/v1/get?type=http&anon=elite&country=IN',
    'https://api.proxyscrape.com/v2/?request=get&protocol=http&timeout=10000&country=IN&ssl=all&anonymity=all'
  ]
  
  for (const apiUrl of alternativeAPIs) {
    try {
      const response = await axios.get(apiUrl, {
        timeout: 10000,
        headers: {
          "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          "Accept": "application/json, text/plain"
        }
      })
      
      if (response.data) {
        let proxies: Proxy[] = []
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
          proxies = response.data.map((proxy: any) => ({
            ip: proxy.ip || proxy.address,
            port: parseInt(proxy.port),
            protocol: proxy.protocol?.toLowerCase() || 'http',
            anonymity: proxy.anonymity || 'unknown',
            country: proxy.country || 'IN',
            city: proxy.city,
            isp: proxy.isp,
            latency: proxy.latency,
            uptime: proxy.uptime,
            lastChecked: proxy.lastChecked
          }))
        } else if (typeof response.data === 'string') {
          // Handle plain text format (IP:PORT)
          const lines = response.data.split('\n').filter((line: string) => line.trim())
          proxies = lines.map((line: string) => {
            const [ip, port] = line.split(':')
            return {
              ip: ip.trim(),
              port: parseInt(port.trim()),
              protocol: 'http',
              anonymity: 'unknown',
              country: 'IN',
              city: undefined,
              isp: undefined,
              latency: undefined,
              uptime: undefined,
              lastChecked: undefined
            }
          })
        }
        
        if (proxies.length > 0) {
          log('success', `✅ Alternative API returned ${proxies.length} proxies`)
          return proxies
        }
      }
    } catch (error) {
      log('warning', `⚠️ Alternative API failed: ${error.message}`)
    }
  }
  
  return []
}

// Scrape proxies from proxy5.net website
async function scrapeProxiesFromWebsite(): Promise<Proxy[]> {
  log('info', '🌐 Scraping proxies from proxy5.net website...')
  
  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    })
    
    const page = await browser.newPage()
    await page.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)])
    await page.setViewport({ width: 1366, height: 768 })
    
    // Navigate to proxy5.net India page
    await page.goto('https://proxy5.net/free-proxy/india', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    
    log('info', '📄 Page loaded, extracting proxy data...')
    
    // Extract proxy data from the table
    const proxies = await page.evaluate(() => {
      const proxyRows = Array.from(document.querySelectorAll('table tbody tr'))
      const extractedProxies: any[] = []
      
      for (const row of proxyRows) {
        try {
          const cells = Array.from(row.querySelectorAll('td'))
          if (cells.length >= 8) {
            const ip = cells[0]?.textContent?.trim()
            const port = cells[1]?.textContent?.trim()
            const protocol = cells[2]?.textContent?.trim()
            const anonymity = cells[3]?.textContent?.trim()
            const countryCity = cells[4]?.textContent?.trim()
            const isp = cells[5]?.textContent?.trim()
            const latency = cells[6]?.textContent?.trim()
            const uptime = cells[7]?.textContent?.trim()
            const lastChecked = cells[8]?.textContent?.trim()
            
            if (ip && port && !isNaN(parseInt(port))) {
              const [country, city] = countryCity ? countryCity.split(' ') : ['IN', '']
              
              extractedProxies.push({
                ip: ip,
                port: parseInt(port),
                protocol: protocol?.toLowerCase() || 'http',
                anonymity: anonymity || 'unknown',
                country: country || 'IN',
                city: city || undefined,
                isp: isp || undefined,
                latency: latency ? parseInt(latency.replace('ms', '').trim()) : undefined,
                uptime: uptime ? parseInt(uptime.replace('%', '').trim()) : undefined,
                lastChecked: lastChecked || undefined
              })
            }
          }
        } catch (error) {
          // Skip malformed rows
          continue
        }
      }
      
      return extractedProxies
    })
    
    log('success', `✅ Scraped ${proxies.length} proxies from website`)
    return proxies
    
  } catch (error) {
    log('error', `❌ Scraping failed: ${error.message}`)
    return []
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Test proxy connectivity
async function testProxy(proxy: Proxy): Promise<boolean> {
  try {
    const testUrl = 'http://httpbin.org/ip'
    const timeout = 10000
    
    const response = await axios.get(testUrl, {
      timeout,
      proxy: {
        host: proxy.ip,
        port: proxy.port,
        protocol: proxy.protocol
      },
      headers: {
        "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
      }
    })
    
    return response.status === 200
  } catch (error) {
    return false
  }
}

// Filter and validate proxies
async function filterWorkingProxies(proxies: Proxy[], maxTests: number = 5): Promise<Proxy[]> {
  log('info', `🔍 Testing ${Math.min(proxies.length, maxTests)} proxies for connectivity...`)
  
  const workingProxies: Proxy[] = []
  const testProxies = proxies.slice(0, maxTests)
  
  for (const proxy of testProxies) {
    const isWorking = await testProxy(proxy)
    if (isWorking) {
      workingProxies.push(proxy)
      log('success', `✅ Proxy working: ${proxy.ip}:${proxy.port}`)
    } else {
      log('warning', `❌ Proxy failed: ${proxy.ip}:${proxy.port}`)
    }
  }
  
  log('info', `✅ Found ${workingProxies.length} working proxies out of ${testProxies.length} tested`)
  return workingProxies
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const count = parseInt(searchParams.get('count') || '10')
    const test = searchParams.get('test') === 'true'
    const maxTests = parseInt(searchParams.get('maxTests') || '5')
    
    log('info', `🚀 Proxy request: count=${count}, test=${test}, maxTests=${maxTests}`)
    
    let proxies: Proxy[] = []
    let source: 'api' | 'scraping' = 'api'
    
    // Try API first
    proxies = await getProxiesViaAPI()
    
    // If API fails, fallback to scraping
    if (proxies.length === 0) {
      log('info', '🔄 API failed, falling back to web scraping...')
      proxies = await scrapeProxiesFromWebsite()
      source = 'scraping'
    }
    
    if (proxies.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No proxies available from any source",
        source: 'none',
        count: 0
      } as ProxyResponse, { status: 404 })
    }
    
    // Limit to requested count
    proxies = proxies.slice(0, count)
    
    // Test proxies if requested
    if (test) {
      proxies = await filterWorkingProxies(proxies, maxTests)
    }
    
    log('success', `✅ Returning ${proxies.length} proxies (source: ${source})`)
    
    return NextResponse.json({
      success: true,
      proxies,
      source,
      count: proxies.length
    } as ProxyResponse)
    
  } catch (error) {
    log('error', `❌ Proxy service error: ${error.message}`)
    return NextResponse.json({
      success: false,
      error: error.message,
      source: 'error',
      count: 0
    } as ProxyResponse, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { count = 10, test = false, maxTests = 5 } = body
    
    log('info', `🚀 Proxy POST request: count=${count}, test=${test}, maxTests=${maxTests}`)
    
    let proxies: Proxy[] = []
    let source: 'api' | 'scraping' = 'api'
    
    // Try API first
    proxies = await getProxiesViaAPI()
    
    // If API fails, fallback to scraping
    if (proxies.length === 0) {
      log('info', '🔄 API failed, falling back to web scraping...')
      proxies = await scrapeProxiesFromWebsite()
      source = 'scraping'
    }
    
    if (proxies.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No proxies available from any source",
        source: 'none',
        count: 0
      } as ProxyResponse, { status: 404 })
    }
    
    // Limit to requested count
    proxies = proxies.slice(0, count)
    
    // Test proxies if requested
    if (test) {
      proxies = await filterWorkingProxies(proxies, maxTests)
    }
    
    log('success', `✅ Returning ${proxies.length} proxies (source: ${source})`)
    
    return NextResponse.json({
      success: true,
      proxies,
      source,
      count: proxies.length
    } as ProxyResponse)
    
  } catch (error) {
    log('error', `❌ Proxy service error: ${error.message}`)
    return NextResponse.json({
      success: false,
      error: error.message,
      source: 'error',
      count: 0
    } as ProxyResponse, { status: 500 })
  }
}