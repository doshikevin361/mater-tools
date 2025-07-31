import ProxyTest from '@/components/ProxyTest'

export default function ProxyDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Proxy5.net Free Proxy Service
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Integrated proxy service for Instagram account creation with API fallback to web scraping
          </p>
        </div>
        
        <ProxyTest />
      </div>
    </div>
  )
}