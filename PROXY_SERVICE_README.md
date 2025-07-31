# Proxy5.net Free Proxy Service

This service provides free Indian proxy servers from proxy5.net with API fallback to web scraping functionality.

## Features

- **API First**: Attempts to fetch proxies via proxy5.net API
- **Web Scraping Fallback**: If API fails, scrapes the proxy5.net website
- **Proxy Testing**: Optional connectivity testing before returning proxies
- **Multiple Protocols**: Supports HTTP, HTTPS, SOCKS4, and SOCKS5
- **Indian Proxies**: Focuses on Indian proxy servers for enhanced anonymity
- **Integration Ready**: Easy integration with Instagram account creation

## API Endpoints

### GET /api/proxy
Fetch proxies with query parameters:
- `count`: Number of proxies to fetch (default: 10)
- `test`: Whether to test proxy connectivity (default: false)
- `maxTests`: Maximum number of proxies to test (default: 5)

### POST /api/proxy
Fetch proxies with JSON body:
```json
{
  "count": 10,
  "test": true,
  "maxTests": 5
}
```

## Response Format

```json
{
  "success": true,
  "proxies": [
    {
      "ip": "103.12.246.45",
      "port": 4145,
      "protocol": "socks4",
      "anonymity": "transparent",
      "country": "IN",
      "city": "Gurugram",
      "isp": "Instant Cable Network PVT LTD",
      "latency": 951,
      "uptime": 100,
      "lastChecked": "0 min"
    }
  ],
  "source": "scraping",
  "count": 1
}
```

## Usage Examples

### Basic Usage
```typescript
import { proxyService } from '@/lib/proxy-service'

// Get a single working proxy
const proxy = await proxyService.getSingleProxy()

// Get multiple proxies
const proxies = await proxyService.getMultipleProxies(5)
```

### Integration with Instagram Account Creation
The proxy service is automatically integrated with the Instagram account creation system. It will:

1. Try to fetch a working Indian proxy
2. Use the proxy for browser automation
3. Fall back to direct connection if no proxy is available

### Demo Page
Visit `/proxy-demo` to test the proxy service with a web interface.

## Configuration

The proxy service can be configured with the following options:

```typescript
const proxyService = new ProxyService({
  baseUrl: 'http://localhost:3000',
  timeout: 15000,
  maxRetries: 3,
  testProxies: false,
  maxTests: 5
})
```

## Error Handling

The service includes comprehensive error handling:
- API failures fall back to web scraping
- Web scraping failures fall back to alternative proxy sources
- Connection timeouts and retries
- Graceful degradation when no proxies are available

## Proxy Sources

1. **Primary**: proxy5.net API
2. **Fallback 1**: proxy5.net web scraping
3. **Fallback 2**: GetProxyList API
4. **Fallback 3**: ProxyKingdom API
5. **Fallback 4**: Proxy-list.download API

## Testing

The service includes built-in proxy testing functionality:
- Tests proxy connectivity using httpbin.org
- Validates proxy response times
- Filters out non-working proxies

## Security Features

- Random user agent rotation
- Request timeout protection
- Rate limiting considerations
- Secure proxy validation

## Integration with Instagram Automation

The proxy service is specifically designed to work with the Instagram account creation system:

1. **Enhanced Anonymity**: Uses Indian proxies for better location-based anonymity
2. **Browser Integration**: Seamlessly integrates with Puppeteer browser automation
3. **Fallback Strategy**: Multiple fallback options ensure proxy availability
4. **Performance**: Optimized for speed and reliability

## Troubleshooting

### Common Issues

1. **No proxies returned**: Check if proxy5.net is accessible
2. **API failures**: Service will automatically fall back to scraping
3. **Connection timeouts**: Increase timeout in configuration
4. **Proxy testing failures**: Some proxies may be temporarily unavailable

### Debug Mode

Enable debug logging by setting the log level in the proxy service:

```typescript
// Add debug logging to see detailed proxy fetching process
console.log('Proxy service debug info:', proxyService.getProxyInfo(proxy))
```

## License

This service is part of the Instagram automation system and follows the same licensing terms.