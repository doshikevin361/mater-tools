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
  log('info', '🌐 Scraping Indian proxies from proxy5.net website...')
  
  // Hardcoded Indian proxies as primary fallback (from your specification)
  const fallbackIndianProxies: Proxy[] = [
    {
      ip: '103.74.227.130',
      port: 56417,
      protocol: 'socks4',
      anonymity: 'Anonymous',
      country: 'India',
      city: 'Lucknow',
      isp: 'Tachyon Communications Pvt Ltd',
      latency: 1964,
      uptime: 100,
      lastChecked: '37 min'
    },
    {
      ip: '64.227.131.240',
      port: 1080,
      protocol: 'socks4',
      anonymity: 'Anonymous',
      country: 'India',
      city: 'Bengaluru',
      isp: 'DigitalOcean, LLC',
      latency: 2746,
      uptime: 100,
      lastChecked: '36 min'
    },
    {
      ip: '159.89.174.192',
      port: 35059,
      protocol: 'socks5',
      anonymity: 'Anonymous',
      country: 'India',
      city: 'Bengaluru',
      isp: 'DigitalOcean, LLC',
      latency: 1945,
      uptime: 100,
      lastChecked: '31 min'
    }
  ]
  
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
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled'
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
    
    log('info', '📄 Page loaded, extracting Indian proxy data...')
    
    // Extract proxy data from the table with enhanced parsing
    const proxies = await page.evaluate(() => {
      const proxyRows = Array.from(document.querySelectorAll('table tbody tr, .proxy-list tr, .proxy-table tr'))
      const extractedProxies: any[] = []
      
      for (const row of proxyRows) {
        try {
          const cells = Array.from(row.querySelectorAll('td'))
          if (cells.length >= 6) {
            const ip = cells[0]?.textContent?.trim()
            const port = cells[1]?.textContent?.trim()
            const protocols = cells[2]?.textContent?.trim()
            const anonymity = cells[3]?.textContent?.trim()
            const countryCity = cells[4]?.textContent?.trim()
            const isp = cells[5]?.textContent?.trim()
            const latency = cells[6]?.textContent?.trim()
            const uptime = cells[7]?.textContent?.trim()
            const lastChecked = cells[8]?.textContent?.trim()
            
            if (ip && port && !isNaN(parseInt(port))) {
              // Parse country and city
              let country = 'India'
              let city = ''
              if (countryCity) {
                const parts = countryCity.split('\n').filter(p => p.trim())
                if (parts.length >= 2) {
                  country = parts[0].trim()
                  city = parts[1].trim()
                } else {
                  const singleLine = countryCity.trim()
                  if (singleLine.includes('India')) {
                    country = 'India'
                    city = singleLine.replace('India', '').trim()
                  }
                }
              }
              
              // Only include Indian proxies
              if (country.toLowerCase().includes('india') || country.toLowerCase() === 'in') {
                // Parse protocols (could be multiple like "SOCKS4, SOCKS5")
                const protocolList = protocols ? protocols.toLowerCase().split(',').map(p => p.trim()) : ['http']
                
                // Create proxy entries for each protocol
                for (const protocol of protocolList) {
                  const cleanProtocol = protocol.replace(/[^a-z0-9]/g, '') || 'http'
                  
                  extractedProxies.push({
                    ip: ip,
                    port: parseInt(port),
                    protocol: cleanProtocol,
                    anonymity: anonymity || 'unknown',
                    country: 'India',
                    city: city || undefined,
                    isp: isp || undefined,
                    latency: latency ? parseInt(latency.replace(/[^0-9]/g, '')) : undefined,
                    uptime: uptime ? parseInt(uptime.replace(/[^0-9]/g, '')) : undefined,
                    lastChecked: lastChecked || undefined
                  })
                }
              }
            }
          }
        } catch (error) {
          // Skip malformed rows
          continue
        }
      }
      
      return extractedProxies
    })
    
    if (proxies.length > 0) {
      log('success', `✅ Scraped ${proxies.length} Indian proxies from website`)
      // Combine scraped proxies with fallback proxies
      return [...proxies, ...fallbackIndianProxies]
    } else {
      log('info', '⚠️ No proxies found via scraping, using fallback Indian proxies')
      return fallbackIndianProxies
    }
    
  } catch (error) {
    log('error', `❌ Scraping failed: ${error.message}, using fallback Indian proxies`)
    return fallbackIndianProxies
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Test proxy connectivity with enhanced validation for Indian proxies
async function testProxy(proxy: Proxy): Promise<boolean> {
  try {
    // Test basic connectivity first
    const basicTest = await testBasicConnectivity(proxy)
    if (!basicTest) {
      return false
    }
    
    // Additional validation for Indian proxies
    if (proxy.country?.toLowerCase().includes('india')) {
      return await testIndianProxyForInstagram(proxy)
    }
    
    return basicTest
  } catch (error) {
    return false
  }
}

// Basic connectivity test
async function testBasicConnectivity(proxy: Proxy): Promise<boolean> {
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
    
    // Verify the response shows we're using the proxy IP
    if (response.status === 200 && response.data && response.data.origin) {
      const responseIP = response.data.origin.split(',')[0].trim()
      return responseIP === proxy.ip
    }
    
    return response.status === 200
  } catch (error) {
    return false
  }
}

// Enhanced testing specifically for Indian proxies used with Instagram
async function testIndianProxyForInstagram(proxy: Proxy): Promise<boolean> {
  try {
    log('info', `🇮🇳 Testing Indian proxy for Instagram compatibility: ${proxy.ip}:${proxy.port}`)
    
    // Test 1: Basic HTTP connectivity
    const httpTest = await testBasicConnectivity(proxy)
    if (!httpTest) {
      log('verbose', `❌ Indian proxy failed basic HTTP test: ${proxy.ip}:${proxy.port}`)
      return false
    }
    
    // Test 2: HTTPS connectivity (Instagram uses HTTPS)
    try {
      const httpsResponse = await axios.get('https://httpbin.org/ip', {
        timeout: 15000,
        proxy: {
          host: proxy.ip,
          port: proxy.port,
          protocol: proxy.protocol
        },
        headers: {
          "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
        }
      })
      
      if (httpsResponse.status !== 200) {
        log('verbose', `❌ Indian proxy failed HTTPS test: ${proxy.ip}:${proxy.port}`)
        return false
      }
    } catch (error) {
      log('verbose', `❌ Indian proxy failed HTTPS test: ${proxy.ip}:${proxy.port} - ${error.message}`)
      return false
    }
    
    // Test 3: Check if proxy can access Instagram-related domains
    try {
      const instagramTest = await axios.get('https://www.instagram.com/robots.txt', {
        timeout: 20000,
        proxy: {
          host: proxy.ip,
          port: proxy.port,
          protocol: proxy.protocol
        },
        headers: {
          "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          "Accept": "text/plain"
        }
      })
      
      if (instagramTest.status !== 200) {
        log('verbose', `❌ Indian proxy failed Instagram access test: ${proxy.ip}:${proxy.port}`)
        return false
      }
    } catch (error) {
      log('verbose', `❌ Indian proxy failed Instagram access test: ${proxy.ip}:${proxy.port} - ${error.message}`)
      return false
    }
    
    log('success', `✅ Indian proxy passed all tests: ${proxy.ip}:${proxy.port}`)
    return true
    
  } catch (error) {
    log('verbose', `❌ Indian proxy validation failed: ${proxy.ip}:${proxy.port} - ${error.message}`)
    return false
  }
}

// Filter and validate proxies with priority for Indian proxies
async function filterWorkingProxies(proxies: Proxy[], maxTests: number = 5): Promise<Proxy[]> {
  log('info', `🔍 Testing ${Math.min(proxies.length, maxTests)} proxies for connectivity...`)
  
  // Separate Indian and non-Indian proxies
  const indianProxies = proxies.filter(p => p.country?.toLowerCase().includes('india'))
  const otherProxies = proxies.filter(p => !p.country?.toLowerCase().includes('india'))
  
  log('info', `📊 Found ${indianProxies.length} Indian proxies and ${otherProxies.length} other proxies`)
  
  const workingProxies: Proxy[] = []
  
  // Test Indian proxies first (priority)
  const indianToTest = indianProxies.slice(0, Math.min(maxTests, indianProxies.length))
  log('info', `🇮🇳 Testing ${indianToTest.length} Indian proxies first...`)
  
  for (const proxy of indianToTest) {
    const isWorking = await testProxy(proxy)
    if (isWorking) {
      workingProxies.push(proxy)
      log('success', `✅ Indian proxy working: ${proxy.ip}:${proxy.port} (${proxy.city || 'Unknown City'})`)
    } else {
      log('warning', `❌ Indian proxy failed: ${proxy.ip}:${proxy.port}`)
    }
  }
  
  // If we need more proxies and haven't reached maxTests, test other proxies
  const remainingTests = maxTests - indianToTest.length
  if (workingProxies.length < maxTests && remainingTests > 0 && otherProxies.length > 0) {
    log('info', `🌐 Testing ${Math.min(remainingTests, otherProxies.length)} additional proxies...`)
    
    const otherToTest = otherProxies.slice(0, remainingTests)
    for (const proxy of otherToTest) {
      const isWorking = await testProxy(proxy)
      if (isWorking) {
        workingProxies.push(proxy)
        log('success', `✅ Proxy working: ${proxy.ip}:${proxy.port}`)
      } else {
        log('warning', `❌ Proxy failed: ${proxy.ip}:${proxy.port}`)
      }
    }
  }
  
  const indianWorkingCount = workingProxies.filter(p => p.country?.toLowerCase().includes('india')).length
  log('info', `✅ Found ${workingProxies.length} working proxies (${indianWorkingCount} Indian) out of ${Math.min(proxies.length, maxTests)} tested`)
  
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