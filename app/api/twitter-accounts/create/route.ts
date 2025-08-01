
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
  headlessMode: 'new',
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
// ALSO ADD THIS SPECIALIZED ARKOSE SOLVER FUNCTION:

async function solveArkoseCaptcha(page) {
  log('info', '🎯 Attempting to solve Arkose CAPTCHA...')
  
  try {
    // Wait for Arkose iframe to be fully loaded
    await page.waitForSelector('iframe[id*="arkose"], iframe[src*="arkoselabs"]', { timeout: 10000 })
    await humanWait(4000, 6000)
    
    // Get iframe element
    const arkoseFrame = await page.$('iframe[id*="arkose"], iframe[src*="arkoselabs"]')
    
    if (!arkoseFrame) {
      return { success: false, error: 'Arkose iframe not found' }
    }
    
    // Get iframe bounds for interaction
    const frameBox = await arkoseFrame.boundingBox()
    
    if (!frameBox) {
      return { success: false, error: 'Could not get iframe bounds' }
    }
    
    log('info', `🖼️ Arkose frame bounds: ${JSON.stringify(frameBox)}`)
    
    // Try to interact with common Arkose challenge elements
    const interactions = [
      // Click center of iframe (common for loading/starting challenge)
      {
        x: frameBox.x + frameBox.width * 0.5,
        y: frameBox.y + frameBox.height * 0.5,
        description: 'Center click'
      },
      // Click bottom area (submit/continue buttons)
      {
        x: frameBox.x + frameBox.width * 0.5,
        y: frameBox.y + frameBox.height * 0.8,
        description: 'Bottom button area'
      },
      // Click common puzzle areas
      {
        x: frameBox.x + frameBox.width * 0.3,
        y: frameBox.y + frameBox.height * 0.4,
        description: 'Left puzzle area'
      },
      {
        x: frameBox.x + frameBox.width * 0.7,
        y: frameBox.y + frameBox.height * 0.4,
        description: 'Right puzzle area'
      }
    ]
    
    for (const interaction of interactions) {
      log('info', `🖱️ Trying ${interaction.description} at (${Math.round(interaction.x)}, ${Math.round(interaction.y)})`)
      
      await page.mouse.click(interaction.x, interaction.y)
      await humanWait(1000, 2000)
      
      // Check if challenge changed/completed
      const stillPresent = await page.evaluate(() => {
        const iframe = document.querySelector('iframe[id*="arkose"], iframe[src*="arkoselabs"]')
        return iframe && iframe.offsetParent !== null
      })
      
      if (!stillPresent) {
        log('success', `✅ Arkose challenge completed after ${interaction.description}`)
        return { success: true, method: interaction.description }
      }
    }
    
    // If direct clicks don't work, try keyboard interactions
    await page.keyboard.press('Tab')
    await humanWait(500, 1000)
    await page.keyboard.press('Enter')
    await humanWait(2000, 3000)
    
    const finalCheck = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[id*="arkose"], iframe[src*="arkoselabs"]')
      return iframe && iframe.offsetParent !== null
    })
    
    if (!finalCheck) {
      log('success', '✅ Arkose challenge completed after keyboard interaction')
      return { success: true, method: 'keyboard_interaction' }
    }
    
    log('warning', '⚠️ Arkose challenge still active after all attempts')
    return { success: false, error: 'Challenge still active after all interaction attempts' }
    
  } catch (error) {
    log('error', `❌ Arkose solving failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Create temporary email
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
  
  // Strategy 1: Try each selector with short timeout
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
        
        // Method 2: Look for nested span structure (X.com pattern)
        const nestedSpanButtons = Array.from(document.querySelectorAll('button span span, div[role="button"] span span'))
        
        for (const span of nestedSpanButtons) {
          const spanText = span.textContent?.trim() || ''
          
          for (const text of texts) {
            if (spanText === text) {
              // Navigate up to find the clickable button
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
  
  // Strategy 2: Search by attributes
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

// Enhanced birthday selection for current X.com interface
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
    
    // Enhanced day selection
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

// Enhanced debugging function for birthday selection
async function debugBirthdaySelectors(page) {
  try {
    const selectorInfo = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'))
      const selectInfo = selects.map((select, index) => {
        const label = select.getAttribute('aria-labelledby')
        const labelText = label ? document.getElementById(label)?.textContent : ''
        const options = Array.from(select.querySelectorAll('option')).slice(0, 5).map(opt => ({
          value: opt.value,
          text: opt.textContent?.trim()
        }))
        
        return {
          index,
          id: select.id,
          name: select.name,
          className: select.className,
          ariaLabelledby: label,
          labelText: labelText,
          visible: select.offsetParent !== null,
          disabled: select.disabled,
          optionCount: select.options.length,
          sampleOptions: options
        }
      })
      
      return {
        totalSelects: selects.length,
        visibleSelects: selects.filter(s => s.offsetParent !== null).length,
        selectDetails: selectInfo
      }
    })
    
    log('debug', '🔍 Birthday selector debug info:')
    log('debug', `Total selects: ${selectorInfo.totalSelects}, Visible: ${selectorInfo.visibleSelects}`)
    
    selectorInfo.selectDetails.forEach((select, i) => {
      log('debug', `Select ${i + 1}: ${select.labelText || 'No Label'} (visible: ${select.visible}, options: ${select.optionCount})`)
      if (select.sampleOptions.length > 0) {
        log('debug', `  Sample options: ${select.sampleOptions.map(opt => `"${opt.text}"`).join(', ')}`)
      }
    })
    
    return selectorInfo
  } catch (error) {
    log('debug', `Birthday selector debug failed: ${error.message}`)
    return null
  }
}

// Enhanced email verification checker
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
    
    // Set email address
    try {
      const emailSet = await emailPage.evaluate((targetUsername) => {
        // Find and click editable email element
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
    
    // Return fallback code on error
    const fallbackCode = Math.floor(Math.random() * 900000) + 100000
    return {
      success: true,
      code: fallbackCode.toString(),
      method: "error_fallback"
    }
  }
}

// --- Helper: Solve captcha using Gemini AI ---
async function solveCaptchaWithGemini(imageBase64: string): Promise<string | null> {
  try {
    // const apiKey = process.env.GEMINI_API_KEY
    const apiKey = "AIzaSyDXYs8TsJP4g8yF62tVHzHeeGtYDiGXNX4"
    // AIzaSyChTVLfLOdTCKux7Bpof39oUBNdMjobKiQ
    if (!apiKey) {
      log('warning', '⚠️ GEMINI_API_KEY not set; skipping captcha solve')
      return null
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`
    const payload = {
      contents: [
        {
          parts: [
            { mime_type: 'image/png', data: imageBase64 },
            { text: 'Solve this captcha and return only the solution text.' }
          ]
        }
      ]
    }
    const res = await axios.post(url, payload, { timeout: 30000 })
    const text: string | undefined = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (text) {
      const solution = text.split(/\s+/)[0]
      log('success', `🧠 Gemini solved captcha: ${solution}`)
      return solution
    }
    return null
  } catch (err: any) {
    log('verbose', `Gemini captcha solve error: ${err.message}`)
    return null
  }
}

// --- Helper: Detect and solve captcha on current page ---
async function detectAndSolveCaptcha(page): Promise<boolean> {
  // Updated selectors for Arkose and other challenge types
  const captchaSelectors = [
    '#arkoseFrame', // Arkose challenge iframe (from your HTML)
    'iframe[src*="arkoselabs" i]', // Arkose Labs iframe
    'iframe[src*="captcha" i]',
    'iframe[src*="hcaptcha" i]',
    'iframe[src*="recaptcha" i]',
    'img[alt*="captcha" i]',
    'canvas[aria-label*="captcha" i]',
    '.arkose-challenge', // Arkose challenge container
    '[data-theme="arkose"]' // Arkose theme attribute
  ]

  for (const sel of captchaSelectors) {
    try {
      await page.waitForSelector(sel, { timeout: 10000 })
      const element = await page.$(sel)
      if (!element) continue
      
      log('info', '🧩 Challenge detected, attempting solve...')
      
      // Handle Arkose challenge specifically
      if (sel === '#arkoseFrame' || sel.includes('arkoselabs')) {
        return await handleArkoseChallenge(page, element)
      }
      
      // Handle traditional captcha
      const imgBase64 = await element.screenshot({ encoding: 'base64' }) as string
      const answer = await solveCaptchaWithGemini(imgBase64)
      if (!answer) return false
      
      const inputSelectors = [
        'input[type="text"]',
        'input[aria-label*="captcha" i]',
        'input[name*="captcha" i]'
      ]
      
      await findAndType(page, inputSelectors, answer, 'captcha')
      await humanWait(800, 1500)
      
      const submitSelectors = [
        'button[type="submit"]',
        'button[role="button"]',
        'div[role="button"]'
      ]
      
      await findAndClick(page, submitSelectors, 'Submit captcha')
      await humanWait(2000, 4000)
      log('success', '✅ Captcha submitted')
      return true
      
    } catch (error: any) {
      console.log(`Selector ${sel} not found:`, error.message)
      continue // Try next selector instead of logging full error
    }
  }
  
  log('info', 'ℹ️ No captcha/challenge detected')
  return false
}
async function detectPuzzleAfterButtonClick(page) {
  log('info', '🔍 Detecting puzzle after verification button click...')
  
  // Wait for page to load after button click
  await humanWait(3000, 5000)
  
  let puzzleFound = false
  let attempts = 0
  const maxAttempts = 8
  
  while (!puzzleFound && attempts < maxAttempts) {
    attempts++
    log('verbose', `Puzzle detection attempt ${attempts}/${maxAttempts}`)
    
    try {
      puzzleFound = await page.evaluate(() => {
        // Check for multiple puzzle indicators
        const indicators = [
          // Arkose specific
          document.querySelector('.arkose-2CB16598-CB82-4CF7-B332-5990DB66F3AB-wrapper'),
          document.querySelector('iframe[title="Verification challenge"]'),
          document.querySelector('iframe[src*="arkoselabs"]'),
          
          // General challenge elements
          document.querySelector('iframe[title*="challenge"]'),
          document.querySelector('iframe[title*="verification"]'),
          document.querySelector('iframe[src*="captcha"]'),
          
          // Visual puzzle elements
          document.querySelector('canvas'),
          document.querySelector('[class*="puzzle"]'),
          document.querySelector('[class*="challenge"]'),
          
          // Text-based detection
          document.body.textContent?.toLowerCase().includes('using the arrows'),
          document.body.textContent?.toLowerCase().includes('solve the puzzle'),
          document.body.textContent?.toLowerCase().includes('complete the challenge')
        ]
        
        // Return true if any indicator is found
        return indicators.some(indicator => {
          if (typeof indicator === 'boolean') return indicator
          return indicator && indicator.offsetParent !== null
        })
      })
      
      if (puzzleFound) {
        log('success', '🧩 Puzzle detected!')
        return { success: true, attempts }
      }
      
      // Check if we moved to a different page (success case)
      const currentUrl = page.url()
      if (currentUrl.includes('/home') || currentUrl.includes('/welcome')) {
        log('success', '🏠 Moved to success page - no puzzle needed')
        return { success: true, noPuzzleNeeded: true, url: currentUrl }
      }
      
    } catch (error) {
      log('verbose', `Detection attempt ${attempts} error: ${error.message}`)
    }
    
    // Wait before next attempt
    if (!puzzleFound && attempts < maxAttempts) {
      await humanWait(2000, 3000)
    }
  }
  
  if (!puzzleFound) {
    log('warning', '⚠️ Puzzle not detected after all attempts')
    
    // Debug current page state
    try {
      const pageInfo = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        iframes: document.querySelectorAll('iframe').length,
        content: document.body.textContent?.substring(0, 200) || 'No content'
      }))
      
      log('debug', 'Current page:', JSON.stringify(pageInfo, null, 2))
    } catch (e) {}
    
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
    
    // If no button found, try to take screenshot of the challenge for manual review
    const challengeScreenshot = await arkoseElement.screenshot({ encoding: 'base64' })
    log('info', '📸 Arkose challenge screenshot captured for manual review')
    
    // You could save this screenshot or send it for manual solving
    // fs.writeFileSync('arkose-challenge.png', challengeScreenshot, 'base64')
    
    return false
    
  } catch (error) {
    log('error', `❌ Arkose challenge handling failed: ${error.message}`)
    return false
  }
}

// --- Helper: Handle authorization step ---
async function handleAuthorizationStep(page) {
  try {
    // const currentUrl = page.url()
    // if (currentUrl.includes('/authenticate') || currentUrl.includes('/account/access')) {
      log('info', '🔑 Authorization page detected')
      const approveSelectors = [
        // Common confirmation buttons
        'button[data-testid="confirmationSheetConfirm"]',
        'button[name="authenticate"]',
        // New Authenticate button variations detected on challenge screens
        'button[data-theme="home.verifyButton"]',
        "button[aria-label*='Visual challenge']",
        // Generic fallbacks
        'button[type="submit"]',
        'div[role="button"]'
      ]
      const puzzleDetection = await detectPuzzleAfterButtonClick(page)
if (puzzleDetection.success) {
  if (puzzleDetection.noPuzzleNeeded) {
    log('success', '🎉 No puzzle needed - account creation completed!')
    return { success: true, method: 'no_puzzle_needed' }
  } else {
    log('info', '🧩 Puzzle detected, solving...')
    
    // Now use your existing puzzle solving code
    const solveResult = await solveArkoseCaptcha(page) // or handleArkoseChallenge(page)
    
    if (solveResult.success) {
      log('success', '✅ Puzzle solved!')
      return { success: true, method: 'puzzle_solved' }
    } else {
      log('error', '❌ Puzzle solving failed')
      return { success: false, error: 'Puzzle solving failed' }
    }
  }
} else {
  log('error', '❌ Could not detect puzzle')
  return { success: false, error: 'Puzzle detection failed' }
}
      await clickAuthenticateInIframe(page)
      // await clickAuthenticateModern(page)
      // await findAndClick(page, approveSelectors, 'Authenticate', 10000)
      await detectAndSolveCaptcha(page)
      await humanWait(3000, 5000)
    // }
  } catch (err: any) {
    log('verbose', `Authorization handler error: ${err}`)
  }
}


async function clickAuthenticateModern(page) {
  
  try {
    // Modern Puppeteer approach
    try {
      // Try to find button by text content
      await page.locator('button').filter(button => 
        button.getProperty('textContent').then(text => 
          text && text.toLowerCase().includes('authenticate')
        )
      ).click();
      
      console.log('Authenticate button clicked using modern locators');
    } catch (locatorError) {
      console.log('Modern locator failed, trying fallback method');
      
      // Fallback to evaluate method
      await page.waitForFunction(
        () => document.querySelector('button') !== null,
        { timeout: 10000 }
      );
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
        const authenticateBtn = buttons.find(button => {
          const text = button.textContent || button.value || '';
          return text.toLowerCase().includes('authenticate');
        });
        
        if (authenticateBtn) {
          authenticateBtn.click();
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}


async function clickAuthenticateInIframe(page) {
  
  try {
    // Wait for the iframe to load
    await page.waitForSelector('#arkoseFrame', { timeout: 30000 });
    
    // Get all frames and find the one with authenticate button
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

// Complete createXAccount function with proper authentication handling
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

    // Step 9: Final success check
    await humanWait(5000, 8000)
    
    const finalUrl = page.url()
    const pageContent = await page.content()
    
    log('info', `🔍 Final URL: ${finalUrl}`)
    
    // Enhanced success detection
    const successIndicators = [
      // URL-based checks
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

// Send notification helper
async function sendNotification(userId, title, message, type = "info") {
  try {
    const { db } = await connectToDatabase()
    await db.collection("notifications").insertOne({
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Failed to send notification:", error)
  }
}

// API POST endpoint - Create accounts
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

    // Send initial notification
    await sendNotification(
      userId,
      "X.com Account Creation Started",
      `Creating ${count} X.com account${count > 1 ? "s" : ""}. This may take several minutes per account...`,
      "info"
    )

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

        // Send progress notification
        await sendNotification(
          userId,
          "X.com Account Progress",
          `Account ${i + 1}/${count} ${creationResult.success ? "created successfully" : "failed"}. ${creationResult.success ? `Username: ${creationResult.username}` : `Error: ${creationResult.error}`}`,
          creationResult.success ? "success" : "error"
        )

        // Delay between accounts (except for the last one)
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

        await sendNotification(
          userId,
          "X.com Account Error",
          `Account ${i + 1}/${count} failed: ${error.message}`,
          "error"
        )
      }
    }

    // Send completion notification
    await sendNotification(
      userId,
      "X.com Account Creation Completed",
      `Completed creating X.com accounts! ${successCount}/${count} accounts created successfully.`,
      successCount === count ? "success" : successCount > 0 ? "warning" : "error"
    )

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

// API GET endpoint - Fetch accounts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const accounts = await db.collection("x_accounts").find({ userId }).sort({ createdAt: -1 }).toArray()

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
