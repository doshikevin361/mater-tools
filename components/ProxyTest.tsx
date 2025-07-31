'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Globe, Shield, CheckCircle, XCircle } from 'lucide-react'

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

export default function ProxyTest() {
  const [proxies, setProxies] = useState<Proxy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'api' | 'scraping' | null>(null)
  const [count, setCount] = useState(5)

  const fetchProxies = async (test: boolean = false) => {
    setLoading(true)
    setError(null)
    setProxies([])
    setSource(null)

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: count,
          test: test,
          maxTests: 3
        })
      })

      const data: ProxyResponse = await response.json()

      if (data.success && data.proxies) {
        setProxies(data.proxies)
        setSource(data.source)
      } else {
        setError(data.error || 'Failed to fetch proxies')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getProtocolColor = (protocol: string) => {
    switch (protocol.toLowerCase()) {
      case 'http': return 'bg-blue-100 text-blue-800'
      case 'https': return 'bg-green-100 text-green-800'
      case 'socks4': return 'bg-purple-100 text-purple-800'
      case 'socks5': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAnonymityColor = (anonymity: string) => {
    switch (anonymity.toLowerCase()) {
      case 'elite': return 'bg-green-100 text-green-800'
      case 'anonymous': return 'bg-yellow-100 text-yellow-800'
      case 'transparent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Proxy5.net Free Proxy Service
          </CardTitle>
          <CardDescription>
            Fetch free Indian proxies from proxy5.net with API fallback to web scraping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="count" className="text-sm font-medium">Count:</label>
              <input
                id="count"
                type="number"
                min="1"
                max="20"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 5)}
                className="w-20 px-2 py-1 border rounded text-sm"
              />
            </div>
            
            <Button 
              onClick={() => fetchProxies(false)}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              Fetch Proxies
            </Button>
            
            <Button 
              onClick={() => fetchProxies(true)}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Test & Fetch
            </Button>
          </div>

          {/* Status */}
          {source && (
            <div className="flex items-center gap-2">
              <Badge variant={source === 'api' ? 'default' : 'secondary'}>
                Source: {source.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {proxies.length} proxies found
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Proxy List */}
          {proxies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Available Proxies</h3>
              <div className="grid gap-3">
                {proxies.map((proxy, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-mono text-sm">
                            {proxy.ip}:{proxy.port}
                          </span>
                        </div>
                        
                        <Badge className={getProtocolColor(proxy.protocol)}>
                          {proxy.protocol.toUpperCase()}
                        </Badge>
                        
                        <Badge className={getAnonymityColor(proxy.anonymity)}>
                          {proxy.anonymity}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {proxy.country && (
                          <span>🇮🇳 {proxy.country}</span>
                        )}
                        {proxy.city && (
                          <span>{proxy.city}</span>
                        )}
                        {proxy.latency && (
                          <span>{proxy.latency}ms</span>
                        )}
                        {proxy.uptime && (
                          <span>{proxy.uptime}% uptime</span>
                        )}
                        {proxy.isp && (
                          <span className="max-w-32 truncate" title={proxy.isp}>
                            {proxy.isp}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• First attempts to fetch proxies via API from proxy5.net</li>
              <li>• If API fails, falls back to web scraping the proxy5.net website</li>
              <li>• Optionally tests proxy connectivity before returning</li>
              <li>• Returns only Indian proxies for enhanced anonymity</li>
              <li>• Supports HTTP, HTTPS, SOCKS4, and SOCKS5 protocols</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}