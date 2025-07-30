import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import axios from "axios"
import { GoogleGenerativeAI } from '@google/generative-ai'
import puppeteer from "puppeteer"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]
const genAI = new GoogleGenerativeAI('AIzaSyDXYs8TsJP4g8yF62tVHzHeeGtYDiGXNX4')

// Enhanced User Agents for 2024/2025
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
]

const SCREEN_PROFILES = [
  { width: 1920, height: 1080, mobile: false, deviceType: 'desktop', name: 'Full HD Desktop' },
  { width: 1366, height: 768, mobile: false, deviceType: 'desktop', name: 'HD Laptop' },
  { width: 1440, height: 900, mobile: false, deviceType: 'desktop', name: 'MacBook Pro' },
  { width: 1536, height: 864, mobile: false, deviceType: 'desktop', name: 'Surface Laptop' },
  { width: 1280, height: 720, mobile: false, deviceType: 'desktop', name: 'HD Display' },
  { width: 1600, height: 900, mobile: false, deviceType: 'desktop', name: 'HD+ Display' }
]

const STEALTH_CONFIG = {
  maxAccountsPerDay: 20,
  minDelayBetweenAccounts: 30 * 60 * 1000, 
  maxDelayBetweenAccounts: 2 * 60 * 60 * 1000, 
  headlessMode: false,
  simulateHumanBehavior: true,
  maxRetries: 3
}

function log(level, message, data = null) {
  const timestamp = new Date().toLocaleTimeString()
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`)
  if (data) console.log(`[${timestamp}] [DATA]`, data)
}

const humanWait = (minMs = 1500, maxMs = 4000) => {
  const delay = minMs + Math.random() * (maxMs - minMs)
  log('verbose', `Human wait: ${Math.round(delay)}ms`)
  return new Promise(resolve => setTimeout(resolve, delay))
}

function generateDeviceProfile() {
  const screenProfile = SCREEN_PROFILES[Math.floor(Math.random() * SCREEN_PROFILES.length)]
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
  
  return {
    userAgent,
    screen: screenProfile,
    viewport: {
      width: screenProfile.width,
      height: screenProfile.height,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false
    }
  }
}

async function createMaximumStealthBrowser() {
  log('info', '🎭 Creating stealth browser for X.com...')
  
  const deviceProfile = generateDeviceProfile()
  
  const browser = await puppeteer.launch({
    headless: STEALTH_CONFIG.headlessMode,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-hang-monitor',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--disable-translate',
      '--disable-background-timer-throttling',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-background-downloads',
      '--disable-office-editing-component-extension',
      '--disable-background-media-suspend',
      '--no-default-browser-check',
      '--disable-plugins-discovery',
      '--disable-preconnect',
      '--disable-prefetch',
      '--disable-logging',
      '--disable-background-networking',
      '--disable-print-preview',
      '--disable-speech-api',
      '--hide-scrollbars',
      '--mute-audio',
      '--memory-pressure-off',
      '--max_old_space_size=4096'
    ],
    ignoreDefaultArgs: [
      '--enable-automation',
      '--enable-blink-features=IdleDetection'
    ],
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    devtools: false
  })

  const pages = await browser.pages()
  const page = pages[0] || await browser.newPage()

  log('info', '🛡️ Applying stealth measures...')

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    
    const automationProps = [
      '__webdriver_script_fn', '__webdriver_script_func', '__webdriver_script_function',
      '__fxdriver_id', '__driver_evaluate', '__webdriver_evaluate', '__selenium_evaluate',
      '__fxdriver_evaluate', '__driver_unwrapped', '__webdriver_unwrapped',
      '__selenium_unwrapped', '__fxdriver_unwrapped', '__webdriver_script_element',
      '_phantom', '__nightmare', '_selenium', 'callPhantom', 'callSelenium',
      '_Selenium_IDE_Recorder', '__webdriver_chrome_runtime', 'webdriver',
      'domAutomation', 'domAutomationController', '__lastWatirAlert', '__lastWatirConfirm',
      '__lastWatirPrompt', '_WEBDRIVER_ELEM_CACHE', 'ChromeDriverw', 'driver-evaluate',
      'cdc_adoQpoasnfa76pfcZLmcfl_Array', 'cdc_adoQpoasnfa76pfcZLmcfl_Promise',
      'cdc_adoQpoasnfa76pfcZLmcfl_Symbol', '$chrome_asyncScriptInfo', '$cdc_asdjflasutopfhvcZLmcfl_'
    ]
    
    automationProps.forEach(prop => {
      try {
        delete window[prop]
        delete document[prop]
      } catch (e) {}
    })

    // Enhanced Chrome object
    window.chrome = {
      runtime: {
        onConnect: null,
        onMessage: null,
        PlatformOs: {
          MAC: 'mac',
          WIN: 'win',
          ANDROID: 'android',
          CROS: 'cros',
          LINUX: 'linux',
          OPENBSD: 'openbsd'
        },
        PlatformArch: {
          ARM: 'arm',
          X86_32: 'x86-32',
          X86_64: 'x86-64'
        }
      },
      loadTimes: function() {
        return {
          requestTime: Date.now() / 1000 - Math.random(),
          startLoadTime: Date.now() / 1000 - Math.random() * 2,
          commitLoadTime: Date.now() / 1000 - Math.random(),
          finishDocumentLoadTime: Date.now() / 1000 - Math.random(),
          finishLoadTime: Date.now() / 1000 - Math.random(),
          firstPaintTime: Date.now() / 1000 - Math.random(),
          firstPaintAfterLoadTime: 0,
          navigationType: 'Other',
          wasFetchedViaSpdy: false,
          wasNpnNegotiated: false,
          npnNegotiatedProtocol: 'unknown',
          wasAlternateProtocolAvailable: false,
          connectionInfo: 'http/1.1'
        }
      },
      csi: function() {
        return {
          startE: Date.now() - Math.random() * 1000,
          onloadT: Date.now() - Math.random() * 500,
          pageT: Math.random() * 100,
          tran: Math.floor(Math.random() * 20)
        }
      }
    }

    const originalQuery = navigator.permissions.query
    navigator.permissions.query = (parameters) => {
      return Promise.resolve({ state: 'denied' })
    }

    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Native Client', filename: 'internal-nacl-plugin' }
      ]
    })

    // Mock languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en']
    })
    
    Object.defineProperty(navigator, 'language', {
      get: () => 'en-US'
    })

    const getParameter = WebGLRenderingContext.prototype.getParameter
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) return 'Intel Inc.' // UNMASKED_VENDOR_WEBGL
      if (parameter === 37446) return 'Intel Iris OpenGL Engine' // UNMASKED_RENDERER_WEBGL
      return getParameter.apply(this, arguments)
    }
  })

  await page.setUserAgent(deviceProfile.userAgent)
  await page.setViewport(deviceProfile.viewport)
  
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="122", "Google Chrome";v="122"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
  })

  log('success', '✅ Stealth browser created successfully')
  return { browser, page, deviceProfile }
}

// Helper function for checking email verification (already exists in your code)
async function checkEmailVerification(page) {
  log('info', '🔍 Checking for email verification...')
  
  try {
    const verificationCheck = await page.evaluate(() => {
      const pageContent = document.body.textContent?.toLowerCase() || ''
      const currentUrl = window.location.href
      
      const emailKeywords = [
        'check your email',
        'we sent you a code',
        'verification code',
        'confirm your email',
        'email verification',
        'enter the code'
      ]
      
      const hasEmailVerification = emailKeywords.some(keyword => pageContent.includes(keyword))
      
      const verificationInputs = document.querySelectorAll(
        'input[data-testid*="verification"], input[placeholder*="code"], input[placeholder*="verification"]'
      )
      
      return {
        hasEmailVerification: hasEmailVerification || verificationInputs.length > 0,
        inputCount: verificationInputs.length,
        currentUrl,
        pageContent: pageContent.substring(0, 200)
      }
    })
    
    return verificationCheck
    
  } catch (error) {
    log('error', `❌ Email verification check failed: ${error.message}`)
    return { hasEmailVerification: false }
  }
}
async function solveArkoseCaptcha(page) {
  log('info', '🎯 Solving Arkose CAPTCHA with official 2Captcha API...')
  
  try {
    // Wait for iframe to load
    await page.waitForSelector('#arkoseFrame, iframe[src*="arkoselabs"], iframe[src*="arkose"]', { timeout: 15000 })
    await humanWait(3000, 5000)
    
    const arkoseFrame = await page.$('#arkoseFrame, iframe[src*="arkoselabs"], iframe[src*="arkose"]')
    if (!arkoseFrame) {
      return { success: false, error: 'Arkose iframe not found' }
    }
    
    // Extract required data from the page
    const arkoseData = await page.evaluate(() => {
      const iframe = document.querySelector('#arkoseFrame, iframe[src*="arkoselabs"], iframe[src*="arkose"]')
      if (!iframe || !iframe.src) return null
      
      // Extract public key from iframe src or data attributes
      const src = iframe.src
      const urlParams = new URLSearchParams(src.split('?')[1] || '')
      
      // Try to find public key in various ways
      let publicKey = urlParams.get('pk') || urlParams.get('public_key')
      
      // Try to find public key from data-pkey attribute
      if (!publicKey) {
        const funcaptchaDiv = document.querySelector('[data-pkey]')
        if (funcaptchaDiv) {
          publicKey = funcaptchaDiv.getAttribute('data-pkey')
        }
      }
      
      // Try to find from fc-token element
      if (!publicKey) {
        const fcTokenElement = document.querySelector('[name="fc-token"]')
        if (fcTokenElement && fcTokenElement.value) {
          const tokenMatch = fcTokenElement.value.match(/pk=([^|]+)/)
          if (tokenMatch) {
            publicKey = tokenMatch[1]
          }
        }
      }
      
      // Extract subdomain from iframe src
      let subdomain = 'client-api.arkoselabs.com' // default
      if (src.includes('arkoselabs.com')) {
        const domainMatch = src.match(/https?:\/\/([^\/]+\.arkoselabs\.com)/)
        if (domainMatch) {
          subdomain = domainMatch[1]
        }
      }
      
      return {
        publicKey: publicKey,
        websiteURL: window.location.href,
        subdomain: subdomain,
        userAgent: navigator.userAgent,
        iframeSrc: src
      }
    })
    
    if (!arkoseData || !arkoseData.publicKey) {
      log('warning', '⚠️ Could not extract Arkose public key')
      return { success: false, error: 'Public key not found' }
    }
    
    log('info', `🔑 Found public key: ${arkoseData.publicKey}`)
    log('info', `🌐 Subdomain: ${arkoseData.subdomain}`)
    
    // Step 1: Create task using official 2captcha API v2
    const taskId = await createCaptchaTask(arkoseData)
    if (!taskId) {
      return { success: false, error: 'Failed to create task' }
    }
    
    log('info', `📤 Task created with ID: ${taskId}`)
    
    // Step 2: Wait for solution
    const solution = await waitForTaskResult(taskId)
    if (!solution) {
      return { success: false, error: 'Failed to get solution' }
    }
    
    log('success', `✅ Got solution token: ${solution.substring(0, 50)}...`)
    
    // Step 3: Apply solution to the page
    const applied = await applySolution(page, solution)
    if (applied) {
      log('success', '✅ Solution applied successfully')
      return { success: true, method: '2captcha_official_api' }
    } else {
      log('warning', '⚠️ Solution application failed')
      return { success: false, error: 'Failed to apply solution' }
    }
    
  } catch (error) {
    log('error', `❌ 2Captcha solving failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}
async function waitForTaskResult(taskId) {
  const maxAttempts = 60 // 5 minutes max wait (5 second intervals)
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Wait before checking (2captcha recommends 5 second intervals)
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      log('info', `🔄 Checking result attempt ${attempt}/${maxAttempts}...`)
      
      const response = await axios.post('https://api.2captcha.com/getTaskResult', {
        clientKey: '3ddb992ad8f9114b483a1179ebbf2018',
        taskId: taskId
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.data.errorId === 0) {
        if (response.data.status === 'ready') {
          log('success', `✅ Task completed! Cost: $${response.data.cost}`)
          return response.data.solution.token
        } else if (response.data.status === 'processing') {
          log('info', '⏳ Task still processing...')
          continue
        } else {
          log('warning', `⚠️ Unexpected status: ${response.data.status}`)
          continue
        }
      } else {
        log('error', `❌ API error: ${response.data.errorDescription}`)
        return null
      }
      
    } catch (error) {
      log('verbose', `Check attempt ${attempt} failed: ${error.message}`)
      if (attempt === maxAttempts) {
        return null
      }
      continue
    }
  }
  
  log('error', '❌ Timeout waiting for solution')
  return null
}
async function applySolution(page, token) {
  try {
    log('info', '🔧 Applying solution token to page...')
    
    // Method 1: Try to apply token directly to FunCaptcha
    const directApply = await page.evaluate((solutionToken) => {
      try {
        // Cast window to any to avoid TypeScript errors
        const win = window as any
        const parentWin = window.parent as any
        
        // Look for FunCaptcha global objects
        if (win.fc && win.fc.callback) {
          win.fc.callback(solutionToken)
          return true
        }
        
        if (parentWin && parentWin.fc && parentWin.fc.callback) {
          parentWin.fc.callback(solutionToken)
          return true
        }
        
        // Look for callback function
        if (win.funcaptchaCallback) {
          win.funcaptchaCallback(solutionToken)
          return true
        }
        
        if (parentWin && parentWin.funcaptchaCallback) {
          parentWin.funcaptchaCallback(solutionToken)
          return true
        }
        
        // Look for other common callback names
        if (win.arkoseCallback) {
          win.arkoseCallback(solutionToken)
          return true
        }
        
        if (win.onArkoseComplete) {
          win.onArkoseComplete(solutionToken)
          return true
        }
        
        // Try to find fc-token input and set value
        const fcTokenInput = document.querySelector('input[name="fc-token"]') as HTMLInputElement
        if (fcTokenInput) {
          fcTokenInput.value = solutionToken
          
          // Dispatch events to notify of value change
          fcTokenInput.dispatchEvent(new Event('input', { bubbles: true }))
          fcTokenInput.dispatchEvent(new Event('change', { bubbles: true }))
          
          // Trigger form submission or continue button
          const form = fcTokenInput.closest('form')
          if (form) {
            // Look for submit button
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement
            if (submitBtn) {
              submitBtn.click()
              return true
            }
          }
        }
        
        // Look for other token input variations
        const tokenInputs = [
          'input[name*="token"]',
          'input[name*="captcha"]',
          'input[name*="arkose"]',
          'input[id*="token"]',
          'input[id*="captcha"]'
        ]
        
        for (const selector of tokenInputs) {
          const input = document.querySelector(selector) as HTMLInputElement
          if (input) {
            input.value = solutionToken
            input.dispatchEvent(new Event('input', { bubbles: true }))
            input.dispatchEvent(new Event('change', { bubbles: true }))
          }
        }
        
        // Store token in common locations
        win.funcaptchaToken = solutionToken
        win.arkoseToken = solutionToken
        win.captchaToken = solutionToken
        
        // Try to trigger any pending verification
        if (win.submitCaptcha) {
          win.submitCaptcha(solutionToken)
          return true
        }
        
        return false
        
      } catch (e) {
        console.error('Direct apply error:', e)
        return false
      }
    }, token)
    
    if (directApply) {
      await humanWait(3000, 5000)
      
      // Check if captcha disappeared
      const completed = await page.evaluate(() => {
        const iframe = document.querySelector('#arkoseFrame, iframe[src*="arkoselabs"]')
        return !iframe || iframe.offsetParent === null
      })
      
      if (completed) {
        return true
      }
    }
    
    // Method 2: Try to trigger continuation manually
    await page.evaluate((solutionToken) => {
      const win = window as any
      
      // Set token in various locations
      win.funcaptchaToken = solutionToken
      win.arkoseToken = solutionToken
      win.captchaToken = solutionToken
      win.token = solutionToken
      
      // Try localStorage as backup
      try {
        localStorage.setItem('captcha_token', solutionToken)
        localStorage.setItem('arkose_token', solutionToken)
        localStorage.setItem('funcaptcha_token', solutionToken)
      } catch (e) {
        // Ignore localStorage errors
      }
      
      // Try to find and click continue/submit buttons
      const continueSelectors = [
        'button[data-testid="ocfNextButton"]',
        'button[data-testid="ocfSubmitButton"]', 
        'button[data-testid="confirmationSheetConfirm"]',
        'div[data-testid="ocfNextButton"]',
        'button[type="submit"]'
      ]
      
      for (const selector of continueSelectors) {
        const elements = document.querySelectorAll(selector)
        for (const element of elements) {
          const el = element as HTMLElement
          if (el.offsetParent !== null && !el.hasAttribute('disabled')) {
            setTimeout(() => el.click(), 100)
            break
          }
        }
      }
      
      // Also try to find buttons by text content
      const allButtons = document.querySelectorAll('button, div[role="button"]')
      for (const button of allButtons) {
        const text = button.textContent?.toLowerCase() || ''
        const el = button as HTMLElement
        if ((text.includes('next') || text.includes('continue') || text.includes('submit') || text.includes('verify')) &&
            el.offsetParent !== null && !el.hasAttribute('disabled')) {
          setTimeout(() => el.click(), 200)
          break
        }
      }
      
      // Try to dispatch custom events that might trigger continuation
      try {
        const customEvents = [
          'arkose:solved',
          'funcaptcha:solved', 
          'captcha:completed',
          'verification:complete'
        ]
        
        for (const eventName of customEvents) {
          window.dispatchEvent(new CustomEvent(eventName, { 
            detail: { token: solutionToken }
          }))
        }
      } catch (e) {
        // Ignore event dispatch errors
      }
      
    }, token)
    
    await humanWait(5000, 7000)
    
    // Method 3: Try iframe-specific token injection
    try {
      const iframeResult = await page.evaluate((solutionToken) => {
        const iframe = document.querySelector('#arkoseFrame, iframe[src*="arkoselabs"]') as HTMLIFrameElement
        if (iframe && iframe.contentWindow) {
          try {
            const iframeWin = iframe.contentWindow as any
            
            // Try to set token in iframe window
            iframeWin.token = solutionToken
            iframeWin.funcaptchaToken = solutionToken
            iframeWin.arkoseToken = solutionToken
            
            // Try to call iframe callbacks
            if (iframeWin.callback) {
              iframeWin.callback(solutionToken)
            }
            
            if (iframeWin.onComplete) {
              iframeWin.onComplete(solutionToken)
            }
            
            return true
          } catch (e) {
            // Cross-origin access might fail, that's ok
            return false
          }
        }
        return false
      }, token)
      
      if (iframeResult) {
        await humanWait(2000, 3000)
      }
    } catch (e) {
      // Ignore iframe access errors
    }
    
    // Final check
    const finalCompleted = await page.evaluate(() => {
      const iframe = document.querySelector('#arkoseFrame, iframe[src*="arkoselabs"]')
      return !iframe || iframe.offsetParent === null
    })
    
    return finalCompleted
    
  } catch (error) {
    log('error', `❌ Solution application failed: ${error.message}`)
    return false
  }
}
async function createCaptchaTask(arkoseData) {
  try {
    const taskPayload = {
      clientKey: '3ddb992ad8f9114b483a1179ebbf2018',
      task: {
        type: "FunCaptchaTaskProxyless",
        websiteURL: arkoseData.websiteURL,
        websitePublicKey: arkoseData.publicKey,
        funcaptchaApiJSSubdomain: arkoseData.subdomain,
        userAgent: arkoseData.userAgent
      }
    }
    
    log('info', '📝 Creating task with payload:', JSON.stringify(taskPayload, null, 2))
    
    const response = await axios.post('https://api.2captcha.com/createTask', taskPayload, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.data.errorId === 0) {
      return response.data.taskId
    } else {
      log('error', `❌ Task creation failed: ${response.data.errorDescription}`)
      return null
    }
    
  } catch (error) {
    log('error', `❌ Create task error: ${error.message}`)
    return null
  }
}

async function performMatchingPattern(page, frameBox) {
  // Click potential matching areas based on typical visual puzzle layouts
  const matchingAreas = [
    { x: frameBox.x + frameBox.width * 0.2, y: frameBox.y + frameBox.height * 0.4 },  // Left icon area
    { x: frameBox.x + frameBox.width * 0.8, y: frameBox.y + frameBox.height * 0.4 },  // Right icon area
    { x: frameBox.x + frameBox.width * 0.5, y: frameBox.y + frameBox.height * 0.85 }  // Submit button
  ]
  
  for (const area of matchingAreas) {
    await page.mouse.click(area.x, area.y)
    await humanWait(1000, 2000)
  }
}

async function createTempEmail() {
  log('info', '📧 Creating temporary email...')
  
  try {
    const response = await axios.get('https://www.guerrillamail.com/ajax.php?f=get_email_address', {
      timeout: 15000,
      headers: {
        "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        "Referer": "https://www.guerrillamail.com/",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9"
      }
    })
    
    if (response.data && response.data.email_addr) {
      log('success', `✅ Created email: ${response.data.email_addr}`)
      return {
        success: true,
        email: response.data.email_addr,
        sessionId: response.data.sid_token,
        provider: "guerrillamail"
      }
    }
    throw new Error("Failed to get email address")
  } catch (error) {
    log('error', `❌ Email creation failed: ${error.message}`)
    throw error
  }
}

// Generate Indian profile
function generateProfile() {
  log('info', '👤 Generating realistic Indian profile...')
  
  const indianFirstNames = [
    "Arjun", "Aarav", "Vivaan", "Aditya", "Vihaan", "Sai", "Aryan", "Krishna", 
    "Ishaan", "Shaurya", "Atharv", "Reyansh", "Siddharth", "Rudra", "Ayaan", 
    "Yash", "Om", "Darsh", "Rishab", "Armaan", "Vedant", "Ahaan", "Tejas",
    "Saanvi", "Ananya", "Aadhya", "Diya", "Kavya", "Pihu", "Angel", "Pari",
    "Fatima", "Aaradhya", "Sara", "Anaya", "Aisha", "Anvi", "Riya", "Myra",
    "Prisha", "Aanya", "Navya", "Drishti", "Shanaya", "Avni", "Kiara", "Khushi"
  ]

  const indianLastNames = [
    "Sharma", "Verma", "Singh", "Kumar", "Gupta", "Agarwal", "Mishra", "Jain",
    "Patel", "Shah", "Mehta", "Joshi", "Desai", "Modi", "Reddy", "Nair",
    "Iyer", "Rao", "Pillai", "Menon", "Bhat", "Shetty", "Malhotra", "Kapoor",
    "Chopra", "Khanna", "Arora", "Bajaj", "Bansal", "Mittal", "Jindal",
    "Agrawal", "Goyal", "Saxena", "Rastogi", "Srivastava", "Shukla", "Pandey"
  ]

  const firstName = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)]
  const lastName = indianLastNames[Math.floor(Math.random() * indianLastNames.length)]
  const birthYear = Math.floor(Math.random() * 25) + 1985 // 1985-2009
  const birthMonth = Math.floor(Math.random() * 12) + 1
  const birthDay = Math.floor(Math.random() * 28) + 1

  const timestamp = Date.now().toString().slice(-6)
  const randomSuffix = Math.floor(Math.random() * 99999)
  
  const usernames = [
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${timestamp}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${timestamp}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}`,
    `${firstName.toLowerCase()}${randomSuffix}`,
    `${firstName.toLowerCase()}_${randomSuffix}`,
    `indian_${firstName.toLowerCase()}${lastName.toLowerCase()}`
  ]

  const password = `${firstName}${Math.floor(Math.random() * 9999)}!${lastName.charAt(0)}`

  const profile = {
    firstName,
    lastName,
    birthYear,
    birthMonth,
    birthDay,
    usernames,
    password,
    fullName: `${firstName} ${lastName}`
  }

  log('success', `✅ Generated profile: ${profile.fullName} (@${profile.usernames[0]})`)
  return profile
}

// Enhanced human typing with realistic patterns
async function humanType(page, selector, text, timeout = 30000) {
  log('detailed', `⌨️ Typing: "${text}" into ${selector}`)
  
  try {
    await page.waitForSelector(selector, { timeout, visible: true })
    const element = await page.$(selector)
    
    if (!element) {
      throw new Error(`Element not found: ${selector}`)
    }
    
    // Click and focus
    await (element as HTMLElement).click()
    await humanWait(200, 500)
    
    // Clear existing content
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await humanWait(50, 150)
    
    // Type with human-like patterns
    const words = text.split(' ')
    
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const word = words[wordIndex]
      
      for (let charIndex = 0; charIndex < word.length; charIndex++) {
        const char = word[charIndex]
        const baseDelay = 80 + Math.random() * 120
        
        if (Math.random() < 0.02 && charIndex > 0) {
          const wrongChar = 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
          await page.keyboard.type(wrongChar, { delay: baseDelay })
          await humanWait(100, 300)
          await page.keyboard.press('Backspace')
          await humanWait(100, 200)
        }
        
        await page.keyboard.type(char, { delay: baseDelay })
        
        if (Math.random() < 0.15) {
          await humanWait(200, 800)
        }
      }
      
      if (wordIndex < words.length - 1) {
        await page.keyboard.type(' ', { delay: 100 })
        await humanWait(150, 400)
      }
    }
    
    await humanWait(200, 500)
    log('verbose', `✅ Successfully typed: "${text}"`)
    
  } catch (error) {
    log('error', `❌ Typing failed for ${selector}: ${error.message}`)
    throw error
  }
}

async function humanClick(page, selector, timeout = 30000) {
  log('detailed', `🖱️ Clicking: ${selector}`)
  
  try {
    await page.waitForSelector(selector, { timeout, visible: true })
    const element = await page.$(selector)
    console.log(element, page, selector, "tetet")
    if (!element) {
      throw new Error(`Element not found: ${selector}`)
    }
    
    // Get element position
    const box = await element.boundingBox()
    if (box) {
      // Move to element with natural curve
      const startX = Math.random() * 100
      const startY = Math.random() * 100
      const endX = box.x + box.width * (0.2 + Math.random() * 0.6)
      const endY = box.y + box.height * (0.2 + Math.random() * 0.6)
      
      await page.mouse.move(startX, startY)
      await page.mouse.move(endX, endY, { steps: 3 + Math.floor(Math.random() * 7) })
      await humanWait(50, 200)
      await page.mouse.click(endX, endY)
    } else {
      await (element as HTMLElement).click()
    }
    
    await humanWait(200, 500)
    log('verbose', `✅ Successfully clicked: ${selector}`)
    
  } catch (error) {
    log('error', `❌ Clicking failed for ${selector}: ${error.message}`)
    throw error
  }
}

async function debugAvailableButtons(page, context = "unknown") {
  try {
    const buttonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, div[role="button"], span[role="button"]'))
      return buttons.slice(0, 10).map(button => ({ // Limit to first 10 buttons
        tagName: button.tagName,
        role: button.getAttribute('role'),
        type: button.type,
        className: button.className?.substring(0, 50) + '...', // Truncate long class names
        textContent: button.textContent?.trim().substring(0, 30) || '', // Truncate long text
        visible: button.offsetParent !== null,
        disabled: button.disabled,
        style: button.getAttribute('style')?.substring(0, 50) || ''
      }))
    })
    
    log('debug', `🔍 Available buttons (${context}):`)
    buttonInfo.forEach((btn, index) => {
      log('debug', `  ${index + 1}. ${btn.tagName}[role="${btn.role}"] "${btn.textContent}" (visible: ${btn.visible}, disabled: ${btn.disabled})`)
    })
    
    return buttonInfo
  } catch (error) {
    log('verbose', `Debug button scan failed: ${error.message}`)
    return []
  }
}

// Enhanced element finder with multiple strategies
async function findAndClick(page, possibleSelectors, elementName, timeout = 3000) {
  log('info', `🔍 Looking for ${elementName}...`)
  
  // Strategy 0: Direct approach for X.com "Create account" button structure
  if (elementName === 'Create account') {
    try {
      const directFound = await page.evaluate(() => {
        // Look for the exact button structure shown in the HTML
        const buttons = Array.from(document.querySelectorAll('button[role="button"][type="button"]'))
        
        for (const button of buttons) {
          const buttonText = button.textContent?.trim() || ''
          const hasXcomClasses = button.classList.contains('css-175oi2r')
          const hasDarkBackground = button.style.backgroundColor === 'rgb(15, 20, 25)' || 
                                   button.style.backgroundColor === 'rgb(29, 155, 240)'
          
          // Check for "Create account" text and X.com styling
          if (buttonText === 'Create account' && 
              (hasXcomClasses || hasDarkBackground) && 
              button.offsetParent !== null && 
              !button.disabled) {
            (button as HTMLElement).click()
            return { success: true, method: 'direct_xcom_structure' }
          }
        }
        
        // Fallback: any button with "Create account" text
        for (const button of buttons) {
          const buttonText = button.textContent?.trim() || ''
          if (buttonText === 'Create account' && button.offsetParent !== null && !button.disabled) {
            (button as HTMLElement).click()
            return { success: true, method: 'direct_text_match' }
          }
        }
        
        return { success: false }
      })
      
      if (directFound.success) {
        log('success', `✅ Found ${elementName} via direct X.com approach (${directFound.method})`)
        await humanWait(500, 1000)
        return true
      }
    } catch (e) {
      log('verbose', `Direct X.com approach failed: ${e.message}`)
    }
  }
  
  for (const selector of possibleSelectors) {
    try {
      await humanClick(page, selector, timeout ? timeout : 3000)
      log('success', `✅ Found ${elementName} with selector: ${selector}`)
      return true
    } catch (e) {
      continue
    }
  }
  
  // Strategy 2: Search by text content with enhanced X.com structure detection
  try {
    const found = await page.evaluate((elementName) => {
   const searchTexts = {
  'Create account': ['Create account', 'Sign up', 'Join X', 'Get started', 'Join now'],
  'Next': ['Next', 'Continue', 'Proceed', 'Submit'],
  'Sign up': ['Sign up', 'Create account', 'Register', 'Join'],
  'Verify': ['Verify', 'Confirm', 'Check'],
  'Done': ['Done', 'Finish', 'Complete'],
  'Authenticate': ['Authenticate', 'Verify account', 'Security check', 'Continue', 'Verify', 'Begin', 'Start'],  // EXPANDED
  'Submit': ['Submit', 'Continue', 'Verify', 'Confirm', 'Next']  // ENHANCED
}
      
      const textsToFind = searchTexts[elementName] || [elementName]
      
      for (const text of textsToFind) {
        // First try: Look specifically for buttons with the X.com structure
        const buttons = Array.from(document.querySelectorAll('button[role="button"], button[type="button"]'))
        for (const button of buttons) {
          // 0.a Check button's aria-label (accessibility label)
          const aria = button.getAttribute('aria-label')?.trim() || ''
          if (aria && textsToFind.includes(aria)) {
            (button as HTMLElement).click()
            return { success: true, text: aria, method: 'button_aria_exact' }
          }
          // Check if button contains nested spans with our target text
          const spans = button.querySelectorAll('span')
          for (const span of spans) {
            const spanText = span.textContent?.trim() || ''
            if (spanText === text && button.offsetParent !== null && !button.disabled) {
              (button as HTMLElement).click()
              return { success: true, text, method: 'button_span_exact' }
            }
          }
          
          // Check button's direct text content
          const buttonText = button.textContent?.trim() || ''
          if (buttonText === text && button.offsetParent !== null && !button.disabled) {
            (button as HTMLElement).click()
            return { success: true, text, method: 'button_text_exact' }
          }
        }
        
        // Second try: Look for any interactive element with exact text
        const allElements = Array.from(document.querySelectorAll('*'))
        for (const element of allElements) {
          const ariaLabel = element.getAttribute('aria-label')?.trim() || ''
          const elementText = element.textContent?.trim() || ''
          const isInteractive = element.tagName === 'BUTTON' || 
                               element.getAttribute('role') === 'button' ||
                               element.onclick ||
                               element.style.cursor === 'pointer' ||
                               element.getAttribute('data-testid') ||
                               element.classList.contains('css-175oi2r') // X.com button class
          if ((elementText === text || ariaLabel === text) && isInteractive && element.offsetParent !== null) {
            (element as HTMLElement).click()
            return { success: true, text, method: 'element_exact' }
          }
        }
        
        // Third try: Case-insensitive partial match for buttons
        for (const button of buttons) {
          const buttonText = button.textContent?.trim().toLowerCase() || ''
          if (buttonText.includes(text.toLowerCase()) && button.offsetParent !== null && !button.disabled) {
            (button as HTMLElement).click()
            return { success: true, text: button.textContent?.trim(), method: 'button_partial' }
          }
        }
      }
      return { success: false }
    }, elementName)
    
    if (found.success) {
      log('success', `✅ Found ${elementName} by ${found.method}: "${found.text}"`)
      await humanWait(500, 1000)
      return true
    }
  } catch (e) {
    log('verbose', `Text search failed for ${elementName}: ${e.message}`)
  }
  
  // Strategy 3: Look for X.com specific button structure and characteristics
  try {
    const xcomButtonFound = await page.evaluate((elementName) => {
      const targetTexts = {
        'Create account': ['Create account', 'Sign up'],
        'Next': ['Next', 'Continue'],
        'Sign up': ['Sign up', 'Create account'],
        'Verify': ['Verify', 'Confirm'],
        'Done': ['Done', 'Finish']
      }
      
      const texts = targetTexts[elementName] || [elementName]
      
      // Look for buttons with X.com's typical structure
      const xcomButtons = Array.from(document.querySelectorAll('button.css-175oi2r, button[role="button"].css-175oi2r'))
      
      for (const button of xcomButtons) {
        const buttonText = button.textContent?.trim() || ''
        
        for (const text of texts) {
          if (buttonText === text && button.offsetParent !== null && !button.disabled) {
            (button as HTMLElement).click()
            return { success: true, text, method: 'xcom_css_class' }
          }
        }
      }
      
      // Also try buttons with the dark background style (typical for primary buttons)
      const styledButtons = Array.from(document.querySelectorAll('button[style*="background-color: rgb(15, 20, 25)"], button[style*="background-color: rgb(29, 155, 240)"]'))
      
      for (const button of styledButtons) {
        const buttonText = button.textContent?.trim() || ''
        
        for (const text of texts) {
          if (buttonText === text && button.offsetParent !== null && !button.disabled) {
            (button as HTMLElement).click()
            return { success: true, text, method: 'styled_button' }
          }
        }
      }
      
      return { success: false }
    }, elementName)
    
    if (xcomButtonFound.success) {
      log('success', `✅ Found ${elementName} by X.com structure: "${xcomButtonFound.text}" (${xcomButtonFound.method})`)
      await humanWait(500, 1000)
      return true
    }
  } catch (e) {
    log('verbose', `X.com structure search failed for ${elementName}: ${e.message}`)
  }
  
    // Strategy 4: Enhanced X.com specific detection
    try {
      const enhancedXcomFound = await page.evaluate((elementName) => {
        const targetTexts = {
          'Create account': ['Create account'],
          'Next': ['Next', 'Continue'],
          'Sign up': ['Sign up'],
          'Verify': ['Verify', 'Confirm'],
          'Done': ['Done', 'Finish']
        }
        
        const texts = targetTexts[elementName] || [elementName]
        
        // Method 1: Look for buttons with specific X.com characteristics
        const allButtons = Array.from(document.querySelectorAll('button, div[role="button"]'))
        
        for (const button of allButtons) {
          const buttonText = button.textContent?.trim() || ''
          const computedStyle = window.getComputedStyle(button)
          const backgroundColor = computedStyle.backgroundColor
          
          // Check for X.com primary button styles
          const isPrimaryButton = backgroundColor === 'rgb(15, 20, 25)' || // Dark theme primary
                                 backgroundColor === 'rgb(29, 155, 240)' || // Light theme primary
                                 button.classList.contains('css-175oi2r') ||
                                 button.style.backgroundColor === 'rgb(15, 20, 25)' ||
                                 button.style.backgroundColor === 'rgb(29, 155, 240)'
          
          for (const text of texts) {
            if (buttonText === text && isPrimaryButton && button.offsetParent !== null && !button.disabled) {
              (button as HTMLElement).click()
              return { success: true, text, method: 'enhanced_xcom_primary' }
            }
          }
        }
        
        const nestedSpanButtons = Array.from(document.querySelectorAll('button span span, div[role="button"] span span'))
        
        for (const span of nestedSpanButtons) {
          const spanText = span.textContent?.trim() || ''
          
          for (const text of texts) {
            if (spanText === text) {
              let clickableElement = span
              while (clickableElement && clickableElement.tagName !== 'BUTTON' && clickableElement.getAttribute('role') !== 'button') {
                clickableElement = clickableElement.parentElement
              }
              
              if (clickableElement && clickableElement.offsetParent !== null && !clickableElement.disabled) {
                clickableElement.click()
                return { success: true, text, method: 'nested_span_structure' }
              }
            }
          }
        }
        
        // Method 3: Look by CSS classes typical of X.com buttons
        const xcomStyleButtons = Array.from(document.querySelectorAll('.css-175oi2r, .r-sdzlij, .r-1phboty'))
        
        for (const button of xcomStyleButtons) {
          const buttonText = button.textContent?.trim() || ''
          
          for (const text of texts) {
            if (buttonText === text && (button.tagName === 'BUTTON' || button.getAttribute('role') === 'button') && 
                button.offsetParent !== null && !button.disabled) {
              (button as HTMLElement).click()
              return { success: true, text, method: 'xcom_css_classes' }
            }
          }
        }
        
        return { success: false }
      }, elementName)
      
      if (enhancedXcomFound.success) {
        log('success', `✅ Found ${elementName} by enhanced X.com detection: "${enhancedXcomFound.text}" (${enhancedXcomFound.method})`)
        await humanWait(500, 1000)
        return true
      }
    } catch (e) {
      log('verbose', `Enhanced X.com detection failed for ${elementName}: ${e.message}`)
    }
    
    // Strategy 5: Last resort - look for any clickable element with the text
  try {
    const attributeFound = await page.evaluate((elementName) => {
      const attributePatterns = {
        'Create account': ['signup', 'register', 'create', 'join'],
        'Next': ['next', 'continue', 'proceed', 'submit'],
        'Sign up': ['signup', 'register', 'join'],
        'Verify': ['verify', 'confirm', 'check'],
        'Done': ['done', 'finish', 'complete']
      }
      
      const patterns = attributePatterns[elementName] || [elementName.toLowerCase()]
      const elements = Array.from(document.querySelectorAll('button, div[role="button"], span[role="button"], a[role="button"]'))
      
      for (const pattern of patterns) {
        for (const element of elements) {
          const testId = element.getAttribute('data-testid') || ''
          const className = element.className || ''
          const ariaLabel = element.getAttribute('aria-label') || ''
          
          if ((testId.toLowerCase().includes(pattern) ||
               className.toLowerCase().includes(pattern) ||
               ariaLabel.toLowerCase().includes(pattern)) &&
              element.offsetParent !== null && !element.disabled) {
            (element as HTMLElement).click()
            return { success: true, method: 'attribute', pattern }
          }
        }
      }
      
      return { success: false }
    }, elementName)
    
    if (attributeFound.success) {
      log('success', `✅ Found ${elementName} by attribute: ${attributeFound.pattern}`)
      await humanWait(500, 1000)
      return true
    }
  } catch (e) {
    log('verbose', `Attribute search failed for ${elementName}: ${e.message}`)
  }

  // Fallback: click first visible button if only one is on screen
  const genericClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
      .filter(b => b.offsetParent !== null && !b.disabled);
    if (buttons.length === 1) {
      (buttons[0] as HTMLElement).click();
      return true;
    }
    return false;
  });
  if (genericClicked) return true;
  
  // If all strategies failed, debug what's available
  log('warning', `❌ Could not find ${elementName} with any strategy`)
  await debugAvailableButtons(page, `searching for ${elementName}`)
  
  throw new Error(`Could not find ${elementName} after trying all strategies`)
}

// Enhanced input field finder
async function findAndType(page, possibleSelectors, text, fieldName, timeout = 30000) {
  log('info', `🔍 Looking for ${fieldName} field...`)
  
  // Strategy 1: Try each selector
  for (const selector of possibleSelectors) {
    try {
      await humanType(page, selector, text, 3000)
      log('success', `✅ Found ${fieldName} field with selector: ${selector}`)
      return true
    } catch (e) {
      continue
    }
  }
  
  try {
    const inputFound = await page.evaluate((text, fieldName) => {
      const fieldMappings = {
        'name': {
          keywords: ['name', 'full name', 'display name', 'firstname', 'lastname'],
          types: ['text'],
          attributes: ['name', 'displayname', 'fullname']
        },
        'email': {
          keywords: ['email', 'e-mail', 'mail'],
          types: ['email', 'text'],
          attributes: ['email', 'mail']
        },
        'password': {
          keywords: ['password', 'pass', 'pwd'],
          types: ['password'],
          attributes: ['password', 'pass', 'pwd']
        },
        'username': {
          keywords: ['username', 'user name', 'handle', 'user'],
          types: ['text'],
          attributes: ['username', 'handle', 'user']
        },
        'verification': {
          keywords: ['verification', 'code', 'confirm', 'otp', 'pin'],
          types: ['text', 'tel', 'number'],
          attributes: ['verification', 'code', 'otp']
        }
      }
      
      const mapping = fieldMappings[fieldName.toLowerCase()] || {
        keywords: [fieldName.toLowerCase()],
        types: ['text'],
        attributes: [fieldName.toLowerCase()]
      }
      
      const inputs = Array.from(document.querySelectorAll('input'))
      
      for (const input of inputs) {
        const placeholder = input.placeholder?.toLowerCase() || ''
        const type = input.type?.toLowerCase() || ''
        const name = input.name?.toLowerCase() || ''
        const ariaLabel = input.getAttribute('aria-label')?.toLowerCase() || ''
        const testId = input.getAttribute('data-testid')?.toLowerCase() || ''
        
        // Check if input matches our criteria
        const matchesKeyword = mapping.keywords.some(keyword => 
          placeholder.includes(keyword) || 
          ariaLabel.includes(keyword) || 
          name.includes(keyword) ||
          testId.includes(keyword)
        )
        
        const matchesType = mapping.types.includes(type)
        
        const matchesAttribute = mapping.attributes.some(attr =>
          name.includes(attr) || testId.includes(attr)
        )
        
        if ((matchesKeyword || matchesAttribute || (fieldName.toLowerCase() === 'email' && type === 'email')) &&
            matchesType &&
            input.offsetParent !== null && 
            !input.disabled && 
            !input.readOnly) {
          
          input.focus()
          input.select()
          input.value = text
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
          input.dispatchEvent(new Event('blur', { bubbles: true }))
          
          return { 
            success: true, 
            placeholder: input.placeholder,
            type: input.type,
            method: matchesKeyword ? 'keyword' : matchesAttribute ? 'attribute' : 'type'
          }
        }
      }
      
      return { success: false }
    }, text, fieldName)
    
    if (inputFound.success) {
      log('success', `✅ Found ${fieldName} field by ${inputFound.method}: "${inputFound.placeholder}" (${inputFound.type})`)
      await humanWait(500, 1000)
      return true
    }
  } catch (e) {
    log('verbose', `Input search failed for ${fieldName}: ${e.message}`)
  }
  
  throw new Error(`Could not find ${fieldName} field after trying all strategies`)
}

async function handleBirthdaySelection(page, profile) {
  log('info', '📅 Handling birthday selection...')
  
  try {
    await humanWait(3000, 5000)
    
    const monthName = MONTHS[profile.birthMonth - 1]
    
    // Enhanced month selection with current X.com structure
    log('info', `🗓️ Selecting month: ${monthName}`)
    
    const monthResult = await page.evaluate((targetMonth, targetMonthIndex) => {
      // Method 1: Direct select element approach
      const monthSelects = document.querySelectorAll('select[aria-labelledby*="LABEL"], select[id*="SELECTOR"]')
      for (const select of monthSelects) {
        const label = select.getAttribute('aria-labelledby')
        if (label) {
          const labelElement = document.getElementById(label)
          if (labelElement && labelElement.textContent?.includes('Month')) {
            const options = select.querySelectorAll('option')
            for (const option of options) {
              if (option.textContent?.trim() === targetMonth || option.value === targetMonthIndex.toString()) {
                select.value = option.value
                select.dispatchEvent(new Event('change', { bubbles: true }))
                select.dispatchEvent(new Event('input', { bubbles: true }))
                return { success: true, method: 'direct_select', value: option.value }
              }
            }
          }
        }
      }
      
      // Method 2: Look for select with month options
      const allSelects = document.querySelectorAll('select')
      for (const select of allSelects) {
        const options = select.querySelectorAll('option')
        let hasMonths = false
        
        // Check if this select contains month names
        for (const option of options) {
          const text = option.textContent?.trim() || ''
          if (['January', 'February', 'March', 'April', 'May', 'June'].includes(text)) {
            hasMonths = true
            break
          }
        }
        
        if (hasMonths) {
          for (const option of options) {
            if (option.textContent?.trim() === targetMonth || option.value === targetMonthIndex.toString()) {
              select.value = option.value
              select.dispatchEvent(new Event('change', { bubbles: true }))
              select.dispatchEvent(new Event('input', { bubbles: true }))
              select.focus()
              select.blur()
              return { success: true, method: 'month_detection', value: option.value }
            }
          }
        }
      }
      
      // Method 3: CSS class based approach for X.com
      const xcomSelects = document.querySelectorAll('select.r-30o5oe, select[class*="r-"]')
      for (const select of xcomSelects) {
        if (select.offsetParent !== null && !select.disabled) {
          const options = select.querySelectorAll('option')
          for (const option of options) {
            if (option.textContent?.trim() === targetMonth) {
              select.value = option.value
              select.dispatchEvent(new Event('change', { bubbles: true }))
              select.dispatchEvent(new Event('input', { bubbles: true }))
              return { success: true, method: 'css_class', value: option.value }
            }
          }
        }
      }
      
      return { success: false }
    }, monthName, profile.birthMonth)
    
    if (monthResult && monthResult.success) {
      await humanWait(1500, 2500)
      log('success', `✅ Month selected: ${monthName} (${monthResult.method})`)
    } else {
      log('warning', '⚠️ Month selection failed, trying alternative approach...')
      
      // Alternative approach: Click-based month selection
      const monthClickResult = await page.evaluate((targetMonth) => {
        // Look for month dropdown trigger
        const labels = document.querySelectorAll('label')
        for (const label of labels) {
          if (label.textContent?.includes('Month')) {
            const select = label.querySelector('select')
            if (select) {
              select.click()
              select.focus()
              
              // Try to set value directly
              const options = select.querySelectorAll('option')
              for (const option of options) {
                if (option.textContent?.trim() === targetMonth) {
                  select.value = option.value
                  const event = new Event('change', { bubbles: true })
                  select.dispatchEvent(event)
                  return { success: true, method: 'click_alternative' }
                }
              }
            }
          }
        }
        return { success: false }
      }, monthName)
      
      if (monthClickResult && monthClickResult.success) {
        await humanWait(1000, 2000)
        log('success', '✅ Month selected via alternative method')
      }
    }
    
    log('info', `📅 Selecting day: ${profile.birthDay}`)
    
    const dayResult = await page.evaluate((targetDay) => {
      // Method 1: Look for day select by label
      const daySelects = document.querySelectorAll('select[aria-labelledby*="LABEL"], select[id*="SELECTOR"]')
      for (const select of daySelects) {
        const label = select.getAttribute('aria-labelledby')
        if (label) {
          const labelElement = document.getElementById(label)
          if (labelElement && labelElement.textContent?.includes('Day')) {
            const options = select.querySelectorAll('option')
            for (const option of options) {
              if (option.value === targetDay.toString() || option.textContent?.trim() === targetDay.toString()) {
                select.value = option.value
                select.dispatchEvent(new Event('change', { bubbles: true }))
                select.dispatchEvent(new Event('input', { bubbles: true }))
                return { success: true, method: 'label_based', value: option.value }
              }
            }
          }
        }
      }
      
      // Method 2: Look for select with day numbers (1-31)
      const allSelects = document.querySelectorAll('select')
      for (const select of allSelects) {
        const options = select.querySelectorAll('option')
        let hasDays = false
        
        // Check if this select contains day numbers
        for (const option of options) {
          const text = option.textContent?.trim() || ''
          const num = parseInt(text)
          if (num >= 1 && num <= 31 && text === num.toString()) {
            hasDays = true
            break
          }
        }
        
        if (hasDays) {
          for (const option of options) {
            if (option.value === targetDay.toString() || option.textContent?.trim() === targetDay.toString()) {
              select.value = option.value
              select.dispatchEvent(new Event('change', { bubbles: true }))
              select.dispatchEvent(new Event('input', { bubbles: true }))
              select.focus()
              select.blur()
              return { success: true, method: 'day_detection', value: option.value }
            }
          }
        }
      }
      
      return { success: false }
    }, profile.birthDay)
    
    if (dayResult && dayResult.success) {
      await humanWait(1500, 2500)
      log('success', `✅ Day selected: ${profile.birthDay} (${dayResult.method})`)
    }
    
    // Enhanced year selection
    log('info', `🗓️ Selecting year: ${profile.birthYear}`)
    
    const yearResult = await page.evaluate((targetYear) => {
      // Method 1: Look for year select by label
      const yearSelects = document.querySelectorAll('select[aria-labelledby*="LABEL"], select[id*="SELECTOR"]')
      for (const select of yearSelects) {
        const label = select.getAttribute('aria-labelledby')
        if (label) {
          const labelElement = document.getElementById(label)
          if (labelElement && labelElement.textContent?.includes('Year')) {
            const options = select.querySelectorAll('option')
            for (const option of options) {
              if (option.value === targetYear.toString() || option.textContent?.trim() === targetYear.toString()) {
                select.value = option.value
                select.dispatchEvent(new Event('change', { bubbles: true }))
                select.dispatchEvent(new Event('input', { bubbles: true }))
                return { success: true, method: 'label_based', value: option.value }
              }
            }
          }
        }
      }
      
      // Method 2: Look for select with year values (1900-2025)
      const allSelects = document.querySelectorAll('select')
      for (const select of allSelects) {
        const options = select.querySelectorAll('option')
        let hasYears = false
        
        // Check if this select contains years
        for (const option of options) {
          const text = option.textContent?.trim() || ''
          const num = parseInt(text)
          if (num >= 1900 && num <= 2025) {
            hasYears = true
            break
          }
        }
        
        if (hasYears) {
          for (const option of options) {
            if (option.value === targetYear.toString() || option.textContent?.trim() === targetYear.toString()) {
              select.value = option.value
              select.dispatchEvent(new Event('change', { bubbles: true }))
              select.dispatchEvent(new Event('input', { bubbles: true }))
              select.focus()
              select.blur()
              return { success: true, method: 'year_detection', value: option.value }
            }
          }
        }
      }
      
      return { success: false }
    }, profile.birthYear)
    
    if (yearResult && yearResult.success) {
      await humanWait(1500, 2500)
      log('success', `✅ Year selected: ${profile.birthYear} (${yearResult.method})`)
    }
    
    // Final validation and form submission trigger
    await humanWait(2000, 3000)
    
    // Trigger form validation by clicking outside or pressing tab
    await page.evaluate(() => {
      const selects = document.querySelectorAll('select')
      if (selects.length > 0) {
        selects[selects.length - 1].blur()
      }
      
      // Trigger any form validation
      const form = document.querySelector('form')
      if (form) {
        form.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    
    await humanWait(1000, 2000)
    
    log('success', `✅ Birthday selection completed: ${monthName} ${profile.birthDay}, ${profile.birthYear}`)
    return { success: true }
    
  } catch (error) {
    log('error', `❌ Birthday selection failed: ${error.message}`)
    
    // Fallback: Try to interact with any visible selects
    try {
      await page.evaluate((month, day, year) => {
        const selects = document.querySelectorAll('select')
        const visibleSelects = Array.from(selects).filter(s => s.offsetParent !== null && !s.disabled)
        
        if (visibleSelects.length >= 3) {
          // Assume first three visible selects are month, day, year
          const [monthSelect, daySelect, yearSelect] = visibleSelects
          
          // Set month
          const monthOptions = monthSelect.querySelectorAll('option')
          for (const option of monthOptions) {
            if (option.value === month.toString() || option.textContent?.includes(MONTHS[month - 1])) {
              monthSelect.value = option.value
              monthSelect.dispatchEvent(new Event('change', { bubbles: true }))
              break
            }
          }
          
          // Set day
          const dayOptions = daySelect.querySelectorAll('option')
          for (const option of dayOptions) {
            if (option.value === day.toString()) {
              daySelect.value = option.value
              daySelect.dispatchEvent(new Event('change', { bubbles: true }))
              break
            }
          }
          
          // Set year
          const yearOptions = yearSelect.querySelectorAll('option')
          for (const option of yearOptions) {
            if (option.value === year.toString()) {
              yearSelect.value = option.value
              yearSelect.dispatchEvent(new Event('change', { bubbles: true }))
              break
            }
          }
        }
      }, profile.birthMonth, profile.birthDay, profile.birthYear)
      
      await humanWait(2000, 3000)
      log('warning', '⚠️ Used fallback birthday selection method')
      return { success: true, method: 'fallback' }
      
    } catch (fallbackError) {
      log('error', `❌ Fallback birthday selection also failed: ${fallbackError.message}`)
      return { success: false, error: error.message }
    }
  }
}
async function checkEmailForOTP(email, maxWaitMinutes = 3, browser) {
  const startTime = Date.now()
  const maxWaitTime = maxWaitMinutes * 60 * 1000
  const [username] = email.split('@')
  
  log('info', `📧 Checking for OTP in email: ${email}`)
  
  let emailPage = null
  
  try {
    emailPage = await browser.newPage()
    await emailPage.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)])
    
    await emailPage.goto('https://www.guerrillamail.com/', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    
    await humanWait(2000, 4000)
    
    try {
      const emailSet = await emailPage.evaluate((targetUsername) => {
        const editableElements = document.querySelectorAll('.editable, [contenteditable="true"], span[onclick]')
        for (const element of editableElements) {
          const text = element.textContent?.trim() || ''
          if (text && text.length > 3 && !text.includes('@')) {
            (element as HTMLElement).click()
            return { success: true, clicked: text }
          }
        }
        return { success: false }
      }, username)
      
      if (emailSet.success) {
        await humanWait(500, 1000)
        
        // Type username
        const inputSet = await emailPage.evaluate((targetUsername) => {
          const inputs = document.querySelectorAll('input[type="text"]')
          for (const input of inputs) {
            if (input.offsetParent !== null && !input.disabled) {
              input.focus()
              input.select()
              input.value = targetUsername
              input.dispatchEvent(new Event('input', { bubbles: true }))
              input.dispatchEvent(new Event('change', { bubbles: true }))
              return { success: true }
            }
          }
          return { success: false }
        }, username)
        
        if (inputSet.success) {
          await humanWait(300, 600)
          
          // Click set button
          const buttonClicked = await emailPage.evaluate(() => {
            const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]')
            for (const button of buttons) {
              const text = (button.textContent || button.value || '').trim().toLowerCase()
              if (text === 'set' && button.offsetParent !== null) {
                (button as HTMLElement).click()
                return { success: true }
              }
            }
            return { success: false }
          })
          
          if (!buttonClicked.success) {
            await emailPage.keyboard.press('Enter')
          }
        }
      }
    } catch (emailSetError) {
      log('verbose', `Email setup warning: ${emailSetError.message}`)
    }
    
    await humanWait(3000, 5000)
    
    // Check for OTP
    let checkCount = 0
    const maxChecks = Math.floor(maxWaitTime / 8000)
    
    while (Date.now() - startTime < maxWaitTime && checkCount < maxChecks) {
      checkCount++
      log('info', `📧 OTP Check ${checkCount}/${maxChecks}...`)
      
      try {
        await emailPage.reload({ waitUntil: 'networkidle2', timeout: 15000 })
        await humanWait(2000, 3000)
        
        const otpResult = await emailPage.evaluate(() => {
          const pageContent = document.body.textContent || document.body.innerText || ''
          
          // Enhanced OTP patterns for X.com
          const patterns = [
            /(\d{6})\s+is\s+your\s+X\s+verification\s+code/gi,
            /(\d{6})\s+is\s+your\s+Twitter\s+verification\s+code/gi,
            /Your\s+X\s+confirmation\s+code\s+is\s+(\d{6})/gi,
            /Your\s+Twitter\s+confirmation\s+code\s+is\s+(\d{6})/gi,
            /X\s+confirmation\s+code:\s*(\d{6})/gi,
            /Twitter\s+confirmation\s+code:\s*(\d{6})/gi,
            /verification\s+code:\s*(\d{6})/gi,
            /(\d{6})\s+.*\s+X\.com/gi,
            /(\d{6})\s+.*\s+Twitter\.com/gi
          ]
          
          for (const pattern of patterns) {
            const match = pageContent.match(pattern)
            if (match) {
              const codeMatch = match[0].match(/\d{6}/)
              if (codeMatch) {
                return {
                  success: true,
                  code: codeMatch[0],
                  method: 'pattern_match',
                  context: match[0].substring(0, 100)
                }
              }
            }
          }
          
          // Fallback: X/Twitter mention with 6-digit code
          if (pageContent.includes('X.com') || pageContent.includes('Twitter') || 
              pageContent.includes('x.com') || pageContent.includes('twitter.com')) {
            const codes = pageContent.match(/\b\d{6}\b/g)
            if (codes && codes.length > 0) {
              return {
                success: true,
                code: codes[0],
                method: 'x_mention_fallback'
              }
            }
          }
          
          return { success: false }
        })
        
        if (otpResult.success) {
          log('success', `✅ Found OTP: ${otpResult.code} (${otpResult.method})`)
          if (emailPage) await emailPage.close()
          return {
            success: true,
            code: otpResult.code,
            method: otpResult.method,
            context: otpResult.context
          }
        }
        
        await humanWait(6000, 10000)
        
      } catch (checkError) {
        log('verbose', `OTP check ${checkCount} error: ${checkError.message}`)
        await humanWait(4000, 6000)
      }
    }
    
    // Generate fallback code if no OTP found
    const fallbackCode = Math.floor(Math.random() * 900000) + 100000
    log('info', `🎲 Using fallback OTP: ${fallbackCode}`)
    
    if (emailPage) await emailPage.close()
    
    return {
      success: true,
      code: fallbackCode.toString(),
      method: "fallback_generated"
    }
    
  } catch (error) {
    log('error', `❌ Email OTP check failed: ${error.message}`)
    
    if (emailPage) {
      try {
        await emailPage.close()
      } catch (e) {}
    }
    
    const fallbackCode = Math.floor(Math.random() * 900000) + 100000
    return {
      success: true,
      code: fallbackCode.toString(),
      method: "error_fallback"
    }
  }
}




async function detectPuzzleAfterButtonClick(page) {
  log('info', '🔍 Detecting puzzle after verification button click...')
  
  await humanWait(2000, 4000) // Give more time for challenge to load
  let puzzleFound = false
  let attempts = 0
  const maxAttempts = 10 // Increased attempts
  
  while (!puzzleFound && attempts < maxAttempts) {
    attempts++
    log('verbose', `Puzzle detection attempt ${attempts}/${maxAttempts}`)
    
    try {
      puzzleFound = await page.evaluate(() => {
        // Enhanced detection methods
        const indicators = [
          // ARKOSE SPECIFIC DETECTION
          document.querySelector('#arkoseFrame'),
          document.querySelector('iframe[src*="arkoselabs"]'),
          document.querySelector('iframe[src*="arkose"]'),
          document.querySelector('iframe[title*="challenge"]'),
          document.querySelector('iframe[title*="verification"]'),
          document.querySelector('iframe[title*="security"]'),
          
          // ARKOSE WRAPPER DETECTION
          document.querySelector('.arkose-enforcement-challenge'),
          document.querySelector('[data-arkose]'),
          document.querySelector('[id*="arkose"]'),
          document.querySelector('[class*="arkose"]'),
          
          // FUNCAPTCHA DETECTION (Arkose's challenge type)
          document.querySelector('[data-funcaptcha]'),
          document.querySelector('.funcaptcha'),
          document.querySelector('#funcaptcha'),
          
          // GENERAL CHALLENGE DETECTION
          document.querySelector('canvas[width][height]'), // Puzzle canvas
          document.querySelector('[role="img"][aria-label*="challenge"]'),
          document.querySelector('[role="img"][aria-label*="verification"]'),
          
          // TEXT-BASED DETECTION
          document.body.textContent?.toLowerCase().includes('solve the puzzle'),
          document.body.textContent?.toLowerCase().includes('complete the challenge'),
          document.body.textContent?.toLowerCase().includes('verify you are human'),
          document.body.textContent?.toLowerCase().includes('select all images'),
          document.body.textContent?.toLowerCase().includes('click verify'),
          document.body.textContent?.toLowerCase().includes('security check'),
          
          // BUTTON DETECTION
          document.querySelector('button[aria-label*="verify"]'),
          document.querySelector('button[aria-label*="challenge"]'),
          document.querySelector('div[role="button"][aria-label*="verify"]'),
          
          // X.COM SPECIFIC CHALLENGE DETECTION
          document.querySelector('[data-testid*="challenge"]'),
          document.querySelector('[data-testid*="verification"]'),
          document.querySelector('[data-testid*="captcha"]')
        ]
        
        // Check if any visual indicator is present
        const hasVisualIndicator = indicators.some(indicator => {
          if (typeof indicator === 'boolean') return indicator
          return indicator && indicator.offsetParent !== null && 
                 indicator.offsetWidth > 0 && indicator.offsetHeight > 0
        })
        
        // Additional check for iframe content loading
        const iframes = document.querySelectorAll('iframe')
        let hasLoadedChallenge = false
        
        for (const iframe of iframes) {
          try {
            const src = iframe.src || ''
            const title = iframe.title || ''
            
            if (src.includes('arkoselabs') || src.includes('arkose') || 
                src.includes('funcaptcha') || src.includes('challenge') ||
                title.includes('challenge') || title.includes('verification')) {
              
              // Check if iframe is visible and has content
              if (iframe.offsetParent !== null && 
                  iframe.offsetWidth > 100 && iframe.offsetHeight > 100) {
                hasLoadedChallenge = true
                break
              }
            }
          } catch (e) {
            // Cross-origin iframe, but presence indicates challenge
            if (iframe.offsetParent !== null) {
              hasLoadedChallenge = true
            }
          }
        }
        
        return hasVisualIndicator || hasLoadedChallenge
      })
      
      if (puzzleFound) {
        log('success', '🧩 Puzzle/Challenge detected!')
        
        // Additional verification - wait a bit more and check again
        await humanWait(1000, 2000)
        
        const doubleCheck = await page.evaluate(() => {
          const iframe = document.querySelector('#arkoseFrame, iframe[src*="arkoselabs"], iframe[src*="arkose"]')
          return iframe && iframe.offsetParent !== null
        })
        
        if (doubleCheck) {
          log('success', '✅ Challenge confirmed with double-check')
          return { success: true, attempts, confirmed: true }
        } else {
          log('info', '🔄 First detection was false positive, continuing...')
          puzzleFound = false
        }
      }
      
      // Check if we moved to a success page (no challenge needed)
      const currentUrl = page.url()
      const pageContent = await page.evaluate(() => document.body.textContent || '')
      
      const successIndicators = [
        currentUrl.includes('/home'),
        currentUrl.includes('/welcome'),
        currentUrl === 'https://x.com/' || currentUrl === 'https://twitter.com/',
        pageContent.toLowerCase().includes('welcome to x'),
        pageContent.toLowerCase().includes('home timeline'),
        pageContent.toLowerCase().includes('what\'s happening')
      ]
      
      if (successIndicators.some(indicator => indicator)) {
        log('success', '🏠 Moved to success page - no puzzle needed')
        return { success: true, noPuzzleNeeded: true, url: currentUrl }
      }
      
    } catch (error) {
      log('verbose', `Detection attempt ${attempts} error: ${error.message}`)
    }
    
    // Progressive wait times - start short, get longer
    const waitTime = Math.min(2000 + (attempts * 1000), 8000)
    if (!puzzleFound && attempts < maxAttempts) {
      await humanWait(waitTime, waitTime + 1000)
    }
  }
  
  if (!puzzleFound) {
    log('warning', '⚠️ Puzzle not detected after all attempts')
    
    // Final debug check
    try {
      const pageInfo = await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe')).map(iframe => ({
          src: iframe.src || 'no-src',
          title: iframe.title || 'no-title',
          visible: iframe.offsetParent !== null,
          dimensions: `${iframe.offsetWidth}x${iframe.offsetHeight}`
        }))
        
        return {
          url: window.location.href,
          title: document.title,
          iframeCount: iframes.length,
          iframes: iframes,
          bodyText: document.body.textContent?.substring(0, 300) || 'No content',
          hasArkoseFrame: !!document.querySelector('#arkoseFrame'),
          hasArkoselabsIframe: !!document.querySelector('iframe[src*="arkoselabs"]')
        }
      })
      
      log('debug', 'Final page state:', JSON.stringify(pageInfo, null, 2))
    } catch (e) {
      log('verbose', 'Debug info failed')
    }
    
    return { success: false, attempts }
  }
  
  return { success: true, attempts }
}

async function handleArkoseChallenge(page, arkoseElement): Promise<boolean> {
  try {
    log('info', '🔒 Arkose challenge detected')
    
    // Wait for the iframe to fully load
    await page.waitForSelector(arkoseElement, { timeout: 3000 })
    
    // Get the iframe content
    const frame = await arkoseElement.contentFrame()
    if (!frame) {
      log('error', '❌ Could not access Arkose iframe content')
      return false
    }
    
    // Wait for challenge to load inside iframe
    await frame.waitForSelector(arkoseElement, { timeout: 2000 })
    
    // Look for authenticate/verify button inside the iframe
    const buttonSelectors = [
      'button:contains("authenticate")',
      'button:contains("verify")',
      'button:contains("continue")',
      'button[type="submit"]',
      'div[role="button"]',
      '[data-theme*="button"]'
    ]
    
    for (const selector of buttonSelectors) {
      try {
        if (selector.includes(':contains')) {
          // Handle text-based selection
          const buttonFound = await frame.evaluate((text) => {
            const buttons = Array.from(document.querySelectorAll('button, div[role="button"], [role="button"]'))
            const targetButton = buttons.find(button => {
              const buttonText = button.textContent || button.innerHTML || ''
              return buttonText.toLowerCase().includes(text.toLowerCase())
            })
            
            if (targetButton) {
              targetButton.click()
              return true
            }
            return false
          }, selector.split('"')[1]) // Extract text from :contains("text")
          
          if (buttonFound) {
            log('success', '✅ Arkose authenticate button clicked')
            await humanWait(2000, 4000)
            return true
          }
        } else {
          // Handle CSS selector
          await frame.waitForSelector(selector, { timeout: 5000 })
          await frame.click(selector)
          log('success', '✅ Arkose challenge button clicked')
          await humanWait(2000, 4000)
          return true
        }
      } catch (selectorError) {
        continue // Try next selector
      }
    }
    
    const challengeScreenshot = await arkoseElement.screenshot({ encoding: 'base64' })
    log('info', '📸 Arkose challenge screenshot captured for manual review')
    
    return false 
  } catch (error) {
    log('error', `❌ Arkose challenge handling failed: ${error.message}`)
    return false
  }
}

async function handleAuthorizationStep(page) {
  try {
    log('info', '🔑 Handling authorization step...')
    
    // Step 1: Look for and click authentication/verify button
    const authButtonSelectors = [
      'button[data-testid="confirmationSheetConfirm"]',
      'button[aria-label*="Start"]',
      'button[aria-label*="Verify"]',
      'button[aria-label*="Continue"]',
      'button[data-testid*="confirm"]',
      'div[role="button"][aria-label*="Verify"]',
      'div[role="button"][aria-label*="Continue"]'
    ]
    
    let authButtonClicked = false
    
    for (const selector of authButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        await humanClick(page, selector)
        authButtonClicked = true
        log('success', `✅ Clicked auth button: ${selector}`)
        break
      } catch (e) {
        continue
      }
    }
    
    if (!authButtonClicked) {
      // Try generic button approach
      const genericClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'))
        const targetTexts = ['start', 'verify', 'continue', 'authenticate', 'begin']
        
        for (const button of buttons) {
          const text = (button.textContent || button.getAttribute('aria-label') || '').toLowerCase()
          
          if (targetTexts.some(target => text.includes(target)) && 
              button.offsetParent !== null && !button.disabled) {
            button.click()
            return { success: true, text: button.textContent?.trim() }
          }
        }
        
        return { success: false }
      })
      
      if (genericClicked.success) {
        authButtonClicked = true
        log('success', `✅ Clicked auth button (generic): "${genericClicked.text}"`)
      }
    }
    
    if (!authButtonClicked) {
      log('warning', '⚠️ No auth button found, proceeding anyway...')
    }
    
    // Step 2: Enhanced puzzle detection
    await humanWait(2000, 4000)
    
    const puzzleDetection = await detectPuzzleAfterButtonClick(page)
    
    if (puzzleDetection.success) {
      if (puzzleDetection.noPuzzleNeeded) {
        log('success', '🎉 No puzzle needed - authentication completed!')
        return { success: true, method: 'no_puzzle_needed', step: 'authentication_complete' }
      } else {
        log('info', '🧩 Puzzle detected, attempting to solve...')
        
        // Try the enhanced Arkose solver
        const solveResult = await solveArkoseCaptcha(page)
        
        if (solveResult.success) {
          log('success', `✅ Puzzle solved using: ${solveResult.method}`)
          
          // Wait and verify completion
          await humanWait(3000, 5000)
          
          // Check final state
          const finalUrl = page.url()
          const isSuccess = finalUrl.includes('/home') || 
                           finalUrl.includes('/welcome') || 
                           finalUrl === 'https://x.com/' || 
                           finalUrl === 'https://twitter.com/'
          
          if (isSuccess) {
            return { success: true, method: 'puzzle_solved', step: 'authentication_complete' }
          } else {
            return { success: true, method: 'puzzle_solved', step: 'continue_registration' }
          }
        } else {
          log('error', `❌ Puzzle solving failed: ${solveResult.error}`)
          return { success: false, error: 'Puzzle solving failed', step: 'puzzle_failed' }
        }
      }
    } else {
      log('error', '❌ Could not detect puzzle after authentication')
      return { success: false, error: 'Puzzle detection failed', step: 'detection_failed' }
    }
    
  } catch (err) {
    log('error', `❌ Authorization handler error: ${err.message}`)
    return { success: false, error: err.message, step: 'handler_error' }
  }
}
async function clickAuthenticateInIframe(page) {
  
  try {
    await page.waitForSelector('#arkoseFrame', { timeout: 30000 });
        const frames = await page.frames();
    
    for (const frame of frames) {
      try {
        // Check if this frame has the authenticate button
        const hasButton = await frame.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]'));
          return buttons.some(button => {
            const text = button.textContent || button.value || button.getAttribute('aria-label') || '';
            return text.toLowerCase().includes('authenticate');
          });
        });
        
        if (hasButton) {
          // Click the button in this frame
          const clicked = await frame.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]'));
            const authenticateBtn = buttons.find(button => {
              const text = button.textContent || button.value || button.getAttribute('aria-label') || '';
              return text.toLowerCase().includes('authenticate');
            });
            
            if (authenticateBtn) {
              authenticateBtn.click();
              return true;
            }
            return false;
          });
          
          if (clicked) {
            console.log('Authenticate button clicked in iframe');
            break;
          }
        }
      } catch (frameError) {
        // Skip frames that can't be accessed (cross-origin)
        continue;
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

async function createXAccount(accountData) {
  let browser, page, deviceProfile
  
  log('info', '🚀 Starting X.com account creation...')
  
  try {
    const browserSetup = await createMaximumStealthBrowser()
    browser = browserSetup.browser
    page = browserSetup.page
    deviceProfile = browserSetup.deviceProfile

    // Navigate to X.com signup
    log('info', '🌐 Navigating to X.com signup...')
    const signupUrls = [
      'https://x.com/i/flow/signup',
      'https://twitter.com/i/flow/signup'
    ]
    
    const signupUrl = signupUrls[Math.floor(Math.random() * signupUrls.length)]
    await page.goto(signupUrl, { 
      waitUntil: 'networkidle0',
      timeout: 45000
    })
    
    await humanWait(3000, 6000)

    // Step 1: Find and click Create account button
    log('info', '🖱️ Looking for Create account button...')
    
    const createAccountSelectors = [
      // Current X.com structure - targeting the exact button structure
      'button[role="button"][type="button"]',
      'button[role="button"].css-175oi2r',
      'button.css-175oi2r[role="button"]',
      // Target by nested span content
      'button[role="button"] span:contains("Create account")',
      'button[type="button"] span:contains("Create account")',
      // Fallback selectors
      'button[data-testid="signupButton"]',
      'div[data-testid="signupButton"]',
      'button[aria-label*="Create account"]',
      'div[role="button"][aria-label*="Create account"]',
      // Generic button targeting
      'button[type="button"]',
      'button[role="button"]'
    ]
    
    await findAndClick(page, createAccountSelectors, 'Create account')
    await humanWait(3000, 5000)

    // Step 2: Fill registration form
    log('info', '📝 Filling registration form...')
    
    // Name field
    const nameSelectors = [
      'input[data-testid="ocfEnterTextTextInput"]',
      'input[autocomplete="name"]',
      'input[name="name"]',
      'input[name="displayName"]',
      'input[placeholder*="Name"]',
      'input[placeholder*="name"]',
      'input[aria-label*="Name"]',
      'input[aria-label*="name"]'
    ]
    
    await findAndType(page, nameSelectors, accountData.profile.fullName, 'name')
    await humanWait(1500, 2500)
    
    // Email field  
    const emailSelectors = [
      'input[data-testid="ocfEnterTextEmailInput"]',
      'input[type="email"]',
      'input[autocomplete="email"]',
      'input[name="email"]',
      'input[placeholder*="Email"]',
      'input[placeholder*="email"]',
      'input[aria-label*="Email"]',
      'input[aria-label*="email"]'
    ]
    
    await findAndType(page, emailSelectors, accountData.email, 'email')
    await humanWait(1500, 2500)

    // Step 3: Handle birthday selection
    await handleBirthdaySelection(page, accountData.profile)
    await humanWait(2000, 3000)

    // Step 4: Click Next
    log('info', '📤 Submitting initial form...')
    const nextSelectors = [
      'button[data-testid="ocfSignupButton"]',
      'div[data-testid="ocfSignupButton"]',
      'button[data-testid="ocfNextButton"]',
      'div[data-testid="ocfNextButton"]',
      'button[role="button"][data-testid*="next"]',
      'div[role="button"][data-testid*="next"]',
      'button[type="submit"]'
    ]
    
    await findAndClick(page, nextSelectors, 'Next')
    await humanWait(4000, 7000)

    // Step 5: Handle authentication challenges (NEW - PROPERLY POSITIONED)
    log('info', '🔐 Checking for authentication challenges...')
    const authResult: any = await handleAuthorizationStep(page)
      
    // const authResult = await handleAuthenticationSteps(page, accountData)
    
    if (!authResult.success && authResult.step === 'phone_verification') {
      return {
        success: false,
        platform: "x",
        error: "Phone verification required - cannot proceed automatically",
        step: authResult.step,
        finalUrl: page.url()
      }
    }
    
    if (authResult.step === 'authentication_complete') {
      log('success', '🎉 Authentication completed, account creation successful!')
      
      const finalUrl = page.url()
      return {
        success: true,
        platform: "x",
        message: "X.com account created successfully",
        username: accountData.profile.usernames[0],
        email: accountData.email,
        finalUrl: finalUrl,
        authenticationPassed: true,
        method: "full_auth_flow"
      }
    }

    // Step 6: Handle email verification if required
    log('info', '🔍 Checking for email verification...')
    
    try {
      const verificationSelectors = [
        'input[data-testid="ocfEnterTextTextInput"]',
        'input[data-testid="verficationCodeInput"]',
        'input[autocomplete="one-time-code"]',
        'input[placeholder*="verification code"]',
        'input[placeholder*="Verification code"]',
        'input[placeholder*="code"]',
        'input[name="verfication_code"]',
        'input[name="verificationCode"]'
      ]
      
      let verificationNeeded = false
      let verificationSelector = null
      
      // Check if verification step appeared
      for (const selector of verificationSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 })
          verificationNeeded = true
          verificationSelector = selector
          break
        } catch (e) {
          continue
        }
      }
      
      if (!verificationNeeded) {
        // Check by page content
        const pageContent = await page.content()
        if (pageContent.includes('verification code') || 
            pageContent.includes('Verification code') ||
            pageContent.includes('Check your email') ||
            pageContent.includes('We sent you a code')) {
          verificationNeeded = true
          verificationSelector = verificationSelectors[0] // Use first selector as fallback
        }
      }
      
      if (verificationNeeded) {
        log('info', '📧 Email verification required - fetching OTP...')
        
        const emailResult = await checkEmailForOTP(accountData.email, 4, browser)
        
        if (emailResult.success) {
          await humanWait(1000, 2000)
          
          try {
            if (verificationSelector) {
              await findAndType(page, [verificationSelector], emailResult.code, 'verification')
            } else {
              await findAndType(page, verificationSelectors, emailResult.code, 'verification')
            }
            
            await humanWait(1000, 2000)
            
            // Click Next/Verify button
            const verifySelectors = [
              'button[data-testid="ocfVerifyButton"]',
              'button[data-testid="ocfNextButton"]',
              'div[data-testid="ocfVerifyButton"]',
              'div[data-testid="ocfNextButton"]',
              ...nextSelectors
            ]
            
            await findAndClick(page, verifySelectors, 'Verify')
            await humanWait(3000, 5000)
            
            log('success', '✅ Email verification completed')
            
          } catch (verifyError) {
            log('verbose', `Email verification failed: ${verifyError.message}`)
          }
        }
      } else {
        log('info', '📧 No email verification required')
      }
      
    } catch (emailError) {
      log('verbose', `Email verification step failed: ${emailError.message}`)
    }

    // Step 7: Handle password creation
    try {
      log('info', '🔒 Looking for password field...')
      
      const passwordSelectors = [
        'input[data-testid="ocfPasswordField"]',
        'input[type="password"]',
        'input[name="password"]',
        'input[placeholder*="password"]',
        'input[placeholder*="Password"]',
        'input[aria-label*="Password"]'
      ]
      
      // Check if password field exists
      let passwordFound = false
      for (const selector of passwordSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 })
          passwordFound = true
          break
        } catch (e) {
          continue
        }
      }
      
      if (passwordFound) {
        await findAndType(page, passwordSelectors, accountData.profile.password, 'password')
        await humanWait(1500, 2500)
        
        const passwordNextSelectors = [
          'button[data-testid="ocfPasswordNextButton"]',
          'button[data-testid="ocfNextButton"]',
          'div[data-testid="ocfPasswordNextButton"]',
          'div[data-testid="ocfNextButton"]',
          ...nextSelectors
        ]
        
        await findAndClick(page, passwordNextSelectors, 'Next')
        await humanWait(3000, 5000)
        
        log('success', '✅ Password created')
      } else {
        log('info', '🔒 Password step not found')
      }
      
    } catch (passwordError) {
      log('verbose', `Password creation failed: ${passwordError.message}`)
    }

    // Step 8: Handle username selection
    try {
      log('info', '👤 Looking for username field...')
      
      const usernameSelectors = [
        'input[data-testid="ocfUsernameField"]',
        'input[name="username"]',
        'input[placeholder*="username"]',
        'input[placeholder*="Username"]',
        'input[aria-label*="Username"]',
        'input[autocomplete="username"]'
      ]
      
      // Check if username field exists
      let usernameFound = false
      for (const selector of usernameSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 })
          usernameFound = true
          break
        } catch (e) {
          continue
        }
      }
      
      if (usernameFound) {
        // Try different usernames if first one fails
        for (let i = 0; i < accountData.profile.usernames.length; i++) {
          try {
            await findAndType(page, usernameSelectors, accountData.profile.usernames[i], 'username')
            await humanWait(1000, 2000)
            
            // Check if username is available
            const usernameAvailable = await page.evaluate(() => {
              const errorElements = document.querySelectorAll('[role="alert"], .error, [data-testid*="error"]')
              for (const element of errorElements) {
                const text = element.textContent?.toLowerCase() || ''
                if (text.includes('taken') || text.includes('unavailable') || text.includes('try another')) {
                  return false
                }
              }
              return true
            })
            
            if (usernameAvailable) {
              log('success', `✅ Username available: ${accountData.profile.usernames[i]}`)
              break
            } else {
              log('verbose', `Username taken: ${accountData.profile.usernames[i]}`)
              if (i < accountData.profile.usernames.length - 1) {
                await humanWait(500, 1000)
                continue
              }
            }
          } catch (usernameError) {
            log('verbose', `Username attempt ${i + 1} failed: ${usernameError.message}`)
          }
        }
        
        await humanWait(1500, 2500)
        
        const finalSelectors = [
          'button[data-testid="ocfFinishButton"]',
          'button[data-testid="ocfNextButton"]',
          'div[data-testid="ocfFinishButton"]',
          'div[data-testid="ocfNextButton"]',
          ...nextSelectors
        ]
        
        await findAndClick(page, finalSelectors, 'Done')
        await humanWait(5000, 8000)
        
        log('success', '✅ Username selected')
      } else {
        log('info', '👤 Username step not found')
      }
      
    } catch (usernameError) {
      log('verbose', `Username selection failed: ${usernameError.message}`)
    }

    await humanWait(5000, 8000)
    
    const finalUrl = page.url()
    const pageContent = await page.content()
    
    log('info', `🔍 Final URL: ${finalUrl}`)
    
    const successIndicators = [
      (finalUrl.includes('x.com') || finalUrl.includes('twitter.com')) && 
      !finalUrl.includes('/signup') && 
      !finalUrl.includes('/flow/'),
      
      finalUrl.includes('/home'),
      finalUrl === 'https://x.com/' || finalUrl === 'https://twitter.com/',
      finalUrl.includes('/welcome'),
      
      // Content-based checks
      pageContent.includes('Home') || pageContent.includes('Timeline'),
      pageContent.includes('What\'s happening') || pageContent.includes('For you'),
      pageContent.includes('Post') || pageContent.includes('Tweet'),
      pageContent.includes('Following') || pageContent.includes('Followers'),
      pageContent.includes('Messages') || pageContent.includes('Notifications'),
      
      // Onboarding checks
      pageContent.includes('Welcome to X') || pageContent.includes('Welcome to Twitter'),
      pageContent.includes('Follow some accounts') || pageContent.includes('Who to follow'),
      pageContent.includes('Customize your experience'),
      
      // Navigation elements
      pageContent.includes('[data-testid="SideNav"]') || pageContent.includes('nav'),
      pageContent.includes('[role="main"]') || pageContent.includes('main'),
      
      // Negative checks (absence of error indicators)
      !pageContent.includes('Something went wrong'),
      !pageContent.includes('Try again'),
      !pageContent.includes('Error occurred'),
      !pageContent.includes('suspended'),
      !pageContent.includes('verification required') || pageContent.includes('Home')
    ]
    
    const positiveIndicators = successIndicators.filter(Boolean).length
    const isSuccessful = positiveIndicators >= 4 // Need at least 4 positive indicators
    
    // Additional check for edge cases
    if (!isSuccessful) {
      await humanWait(3000, 5000)
      const laterUrl = page.url()
      const laterContent = await page.content()
      
      const additionalCheck = (
        (laterUrl.includes('x.com') || laterUrl.includes('twitter.com')) &&
        !laterUrl.includes('/signup') &&
        !laterUrl.includes('/flow/') &&
        (laterContent.includes('Home') || laterContent.includes('Timeline') || 
         laterContent.includes('What\'s happening') || laterContent.includes('For you'))
      )
      
      if (additionalCheck) {
        log('success', '🎉 X.com account creation successful (additional check)!')
        return {
          success: true,
          platform: "x",
          message: "X.com account created successfully",
          username: accountData.profile.usernames[0],
          email: accountData.email,
          finalUrl: laterUrl,
          positiveIndicators: positiveIndicators + 1,
          authenticationPassed: true,
          method: "additional_check"
        }
      }
    }
    
    if (isSuccessful) {
      log('success', '🎉 X.com account creation successful!')
      return {
        success: true,
        platform: "x",
        message: "X.com account created successfully",
        username: accountData.profile.usernames[0],
        email: accountData.email,
        finalUrl: finalUrl,
        positiveIndicators: positiveIndicators,
        authenticationPassed: true,
        method: "primary_check"
      }
    } else {
      log('warning', `❓ X.com account creation status unclear (${positiveIndicators} indicators)`)
      return {
        success: false,
        platform: "x",
        error: "Account creation status unclear - may need manual verification",
        finalUrl: finalUrl,
        positiveIndicators: positiveIndicators,
        authenticationPassed: false,
        debugInfo: {
          urlValid: finalUrl.includes('x.com') || finalUrl.includes('twitter.com'),
          hasSignupInUrl: finalUrl.includes('/signup') || finalUrl.includes('/flow/'),
          hasHomeContent: pageContent.includes('Home') || pageContent.includes('Timeline'),
          hasErrorContent: pageContent.includes('Error') || pageContent.includes('suspended'),
          contentLength: pageContent.length
        }
      }
    }

  } catch (error) {
    log('error', `❌ X.com account creation failed: ${error.message}`)
    return {
      success: false,
      platform: "x",
      error: error.message,
      authenticationPassed: false,
      stack: error.stack
    }
  } finally {
    if (browser) {
      // Keep browser open for a short time to ensure completion
      setTimeout(async () => {
        try {
          await browser.close()
          log('info', '🔒 Browser closed')
        } catch (e) {
          log('verbose', 'Browser close error (ignored)')
        }
      }, 30000) // 30 seconds delay
    }
  }
}

// Calculate optimal timing between accounts
function calculateNextAccountDelay() {
  const now = new Date()
  const currentHour = now.getHours()
  
  // Avoid peak usage hours for better success rates
  const peakHours = [9, 10, 11, 14, 15, 16, 19, 20, 21]
  const isPeakHour = peakHours.includes(currentHour)
  
  let baseDelay = STEALTH_CONFIG.minDelayBetweenAccounts
  let maxDelay = STEALTH_CONFIG.maxDelayBetweenAccounts
  
  // Longer delays during peak hours
  if (isPeakHour) {
    baseDelay *= 1.5
    maxDelay *= 2
  }
  
  // Weekend vs weekday variation
  const isWeekend = now.getDay() === 0 || now.getDay() === 6
  if (isWeekend) {
    baseDelay *= 0.8
    maxDelay *= 0.9
  }
  
  const delay = baseDelay + Math.random() * (maxDelay - baseDelay)
  
  log('info', `⏰ Next account in ${Math.round(delay / 1000 / 60)} minutes (Peak: ${isPeakHour}, Weekend: ${isWeekend})`)
  
  return delay
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { count = 1, userId } = body

    log('info', `🚀 API Request: Creating ${count} X.com accounts`)

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    if (count < 1 || count > STEALTH_CONFIG.maxAccountsPerDay) {
      return NextResponse.json(
        { success: false, message: `Count must be between 1 and ${STEALTH_CONFIG.maxAccountsPerDay}` },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    const results = []
    let successCount = 0

    log('success', `🎯 Starting X.com account creation with enhanced stealth`)

    for (let i = 0; i < count; i++) {
      log('info', `\n🔄 === CREATING X.COM ACCOUNT ${i + 1}/${count} ===`)

      try {
        // Create temporary email
        const emailResult = await createTempEmail()
        if (!emailResult.success) {
          throw new Error("Failed to create temporary email")
        }

        // Generate Indian profile
        const profile = generateProfile()
        log('info', `🇮🇳 Profile: ${profile.fullName} (@${profile.usernames[0]})`)
        log('info', `📧 Email: ${emailResult.email}`)

        const accountData = {
          email: emailResult.email,
          profile: profile,
          platform: "x"
        }

        // Create the account
        const creationResult = await createXAccount(accountData)

        // Save to database
        const xAccount = {
          userId: userId,
          accountNumber: i + 1,
          platform: "x",
          email: emailResult.email,
          username: creationResult.username || profile.usernames[0],
          password: profile.password,
          profile: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            fullName: profile.fullName,
            birthDate: `${profile.birthYear}-${profile.birthMonth.toString().padStart(2, "0")}-${profile.birthDay.toString().padStart(2, "0")}`
          },
          creationResult: creationResult,
          status: creationResult.success ? "active" : "failed",
          verified: creationResult.success,
          deviceProfile: creationResult.deviceProfile || "Desktop",
          finalUrl: creationResult.finalUrl,
          positiveIndicators: creationResult.positiveIndicators || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await db.collection("x_accounts").insertOne(xAccount)

        // Add to results
        results.push({
          accountNumber: i + 1,
          success: creationResult.success,
          platform: "x",
          email: emailResult.email,
          username: creationResult.username || profile.usernames[0],
          password: profile.password,
          profile: profile,
          message: creationResult.message,
          error: creationResult.error,
          finalUrl: creationResult.finalUrl,
          positiveIndicators: creationResult.positiveIndicators || 0
        })

        if (creationResult.success) {
          successCount++
          log('success', `✅ X.COM ACCOUNT ${i + 1} CREATED: ${creationResult.username}`)
        } else {
          log('error', `❌ X.COM ACCOUNT ${i + 1} FAILED: ${creationResult.error}`)
        }

        if (i < count - 1) {
          const delay = calculateNextAccountDelay()
          log('info', `⏳ Waiting ${Math.round(delay / 1000 / 60)} minutes until next account...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

      } catch (error) {
        log('error', `❌ X.COM ACCOUNT ${i + 1} FAILED: ${error.message}`)
        
        results.push({
          accountNumber: i + 1,
          success: false,
          platform: "x",
          error: error.message
        })

       
      }
    }

    log('success', `🎉 COMPLETED: ${successCount}/${count} X.com accounts created`)

    return NextResponse.json({
      success: true,
      message: `X.com account creation completed! ${successCount}/${count} accounts created successfully.`,
      totalRequested: count,
      totalCreated: successCount,
      successRate: `${Math.round((successCount / count) * 100)}%`,
      platform: "x",
      accounts: results,
      summary: {
        total: count,
        successful: successCount,
        failed: count - successCount,
        successRate: Math.round((successCount / count) * 100)
      }
    })

  } catch (error) {
    log('error', `❌ API ERROR: ${error.message}`)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create X.com accounts",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    let platform = searchParams.get("platform")
    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }
        const { db } = await connectToDatabase()

    const query = { userId }
    platform = platform ? platform.toLowerCase() : "x"

    if (platform) {
      query.platform = platform
    }

    const accounts = await db.collection("x_accounts").find({ query }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
      summary: {
        total: accounts.length,
        successful: accounts.filter(acc => acc.status === "active").length,
        failed: accounts.filter(acc => acc.status === "failed").length,
        verified: accounts.filter(acc => acc.verified).length,
        avgPositiveIndicators: accounts.reduce((sum, acc) => sum + (acc.positiveIndicators || 0), 0) / accounts.length || 0
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch X.com accounts",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
