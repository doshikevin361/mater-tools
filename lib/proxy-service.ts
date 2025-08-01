import axios from 'axios'

export interface Proxy {
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
  source?: string
}

export interface ProxyResponse {
  success: boolean
  proxies?: Proxy[]
  error?: string
  source: 'api' | 'scraping'
  count: number
}

export interface ProxyServiceConfig {
  baseUrl?: string
  timeout?: number
  maxRetries?: number
  testProxies?: boolean
  maxTests?: number
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]

export class ProxyService {
  private config: ProxyServiceConfig
  private baseUrl: string

  constructor(config: ProxyServiceConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3000',
      timeout: config.timeout || 15000,
      maxRetries: config.maxRetries || 3,
      testProxies: config.testProxies || false,
      maxTests: config.maxTests || 5
    }
    this.baseUrl = this.config.baseUrl!
  }

  /**
   * Fetch proxies from the proxy service
   */
  async fetchProxies(count: number = 10, test: boolean = false): Promise<ProxyResponse> {
    const maxRetries = this.config.maxRetries!
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/proxy`, {
          count,
          test: test || this.config.testProxies,
          maxTests: this.config.maxTests
        }, {
          timeout: this.config.timeout,
          headers: {
            "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        })

        return response.data as ProxyResponse
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Failed to fetch proxies after all retries')
  }

  /**
   * Get a single working proxy
   */
  async getSingleProxy(): Promise<Proxy | null> {
    try {
      const response = await this.fetchProxies(1, true)
      
      if (response.success && response.proxies && response.proxies.length > 0) {
        return response.proxies[0]
      }
      
      return null
    } catch (error) {
      console.error('Failed to get single proxy:', error)
      return null
    }
  }

  /**
   * Get multiple proxies with testing
   */
  async getMultipleProxies(count: number = 5): Promise<Proxy[]> {
    try {
      const response = await this.fetchProxies(count, true)
      
      if (response.success && response.proxies) {
        return response.proxies
      }
      
      return []
    } catch (error) {
      console.error('Failed to get multiple proxies:', error)
      return []
    }
  }

  /**
   * Test a specific proxy
   */
  async testProxy(proxy: Proxy): Promise<boolean> {
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

  /**
   * Get proxy configuration for Puppeteer
   */
  getPuppeteerProxyConfig(proxy: Proxy): string | null {
    if (!proxy || !proxy.ip || !proxy.port) {
      return null
    }

    return `${proxy.protocol}://${proxy.ip}:${proxy.port}`
  }

  /**
   * Get proxy configuration for Axios
   */
  getAxiosProxyConfig(proxy: Proxy): any {
    if (!proxy || !proxy.ip || !proxy.port) {
      return null
    }

    return {
      host: proxy.ip,
      port: proxy.port,
      protocol: proxy.protocol
    }
  }

  /**
   * Format proxy for display
   */
  formatProxy(proxy: Proxy): string {
    return `${proxy.protocol}://${proxy.ip}:${proxy.port}`
  }

  /**
   * Get proxy info for logging
   */
  getProxyInfo(proxy: Proxy): string {
    const parts = [
      `${proxy.ip}:${proxy.port}`,
      proxy.protocol.toUpperCase(),
      proxy.anonymity,
      proxy.country
    ]
    
    if (proxy.city) parts.push(proxy.city)
    if (proxy.latency) parts.push(`${proxy.latency}ms`)
    if (proxy.uptime) parts.push(`${proxy.uptime}%`)
    
    return parts.join(' | ')
  }
}

// Default instance
export const proxyService = new ProxyService()

// Utility functions
export async function getFreeIndianProxy(): Promise<Proxy | null> {
  return await proxyService.getSingleProxy()
}

export async function getWorkingProxies(count: number = 5): Promise<Proxy[]> {
  return await proxyService.getMultipleProxies(count)
}

export function formatProxyString(proxy: Proxy): string {
  return proxyService.formatProxy(proxy)
}

export function getProxyLogInfo(proxy: Proxy): string {
  return proxyService.getProxyInfo(proxy)
}