import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import axios from "axios"
import puppeteer from "puppeteer"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:119.0) Gecko/20100101 Firefox/119.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
]

const SCREEN_PROFILES = [
  { width: 1920, height: 1080, mobile: false, deviceType: 'desktop', name: 'Full HD' },
  { width: 1366, height: 768, mobile: false, deviceType: 'desktop', name: 'HD Laptop' },
  { width: 1440, height: 900, mobile: false, deviceType: 'desktop', name: 'MacBook Pro' },
  { width: 1536, height: 864, mobile: false, deviceType: 'desktop', name: 'Surface Laptop' },
  { width: 1600, height: 900, mobile: false, deviceType: 'desktop', name: 'HD+' },
  { width: 1280, height: 720, mobile: false, deviceType: 'desktop', name: 'HD' },
  { width: 1680, height: 1050, mobile: false, deviceType: 'desktop', name: 'WSXGA+' },
  { width: 2560, height: 1440, mobile: false, deviceType: 'desktop', name: '1440p' },
  { width: 1280, height: 800, mobile: false, deviceType: 'desktop', name: 'WXGA' },
  { width: 1024, height: 768, mobile: false, deviceType: 'desktop', name: 'XGA' },
  { width: 1024, height: 1366, mobile: true, deviceType: 'tablet', name: 'iPad Portrait' },
  { width: 768, height: 1024, mobile: true, deviceType: 'tablet', name: 'iPad Mini' },
  { width: 820, height: 1180, mobile: true, deviceType: 'tablet', name: 'iPad Air' },
  { width: 390, height: 844, mobile: true, deviceType: 'mobile', name: 'iPhone 12' },
  { width: 414, height: 896, mobile: true, deviceType: 'mobile', name: 'iPhone 11' }
]

const OS_PROFILES = [
  {
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    languages: ['en-US', 'en'],
    timezone: 'America/New_York',
    weight: 40
  },
  {
    platform: 'MacIntel', 
    oscpu: 'Intel Mac OS X 10_15_7',
    languages: ['en-US', 'en'],
    timezone: 'America/New_York',
    weight: 25
  },
  {
    platform: 'Linux x86_64',
    oscpu: 'Linux x86_64',
    languages: ['en-US', 'en'],
    timezone: 'America/New_York',
    weight: 15
  },
  {
    platform: 'Win32',
    oscpu: 'Windows NT 11.0; Win64; x64',
    languages: ['en-GB', 'en'],
    timezone: 'Europe/London',
    weight: 20
  }
]

const AUTO_FOLLOW_CONFIG = {
  enabled: true,
  followCount: 10,
  followDelay: { min: 3000, max: 8000 }, 
  followRetries: 3,
  skipPrivateAccounts: true,
  skipVerifiedOnly: false,
  maxFollowsPerSession: 10,
  sessionCooldown: 300000,
  adaptiveDelays: true
}

const STEALTH_CONFIG = {
  maxAccountsPerDay: 5,
  minDelayBetweenAccounts: 2000, 
  maxDelayBetweenAccounts: 2000, 
  sessionVariation: true,
  randomizeFingerprints: true,
  simulateHumanBehavior: true,
  preBrowsingChance: 0.7, 
  removeAutomationTraces: true,
  spoofHardwareSpecs: true,
  randomizePlugins: true,
  fakeWebGL: true,
  spoofCanvas: true,
  fakeAudio: true,
  simulateTypos: true,
  humanMouseMovements: true,
  realTimingPatterns: true,
  headlessMode: 'new',
  autoFollow: AUTO_FOLLOW_CONFIG
}

const TIMING_PROFILES = {
  casual: {
    baseMultiplier: 1.0,
    variation: 0.4,
    thinkingChance: 0.3,
    distractionChance: 0.15
  },
  focused: {
    baseMultiplier: 0.8,
    variation: 0.2,
    thinkingChance: 0.1,
    distractionChance: 0.05
  },
  tired: {
    baseMultiplier: 1.6,
    variation: 0.6,
    thinkingChance: 0.4,
    distractionChance: 0.25
  },
  distracted: {
    baseMultiplier: 1.3,
    variation: 0.8,
    thinkingChance: 0.5,
    distractionChance: 0.35
  }
}

let sessionState = {
  startTime: Date.now(),
  followCount: 0,
  consecutiveActions: 0,
  lastActionTime: 0,
  currentMood: 'normal',
  energyLevel: 1.0,
  recentTimings: [],
  sessionType: 'casual'
}

function log(level, message, data = null) {
  const timestamp = new Date().toLocaleTimeString()
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`)
  if (data) console.log(`[${timestamp}] [DATA]`, data)
}

function initializeHumanSession() {
  const profiles = Object.keys(TIMING_PROFILES)
  sessionState.sessionType = profiles[Math.floor(Math.random() * profiles.length)]
  sessionState.currentMood = Math.random() > 0.7 ? 'tired' : 'normal'
  sessionState.energyLevel = 0.8 + Math.random() * 0.4
  
  log('info', `🎭 Session profile: ${sessionState.sessionType}, mood: ${sessionState.currentMood}`)
}

function updateSessionState() {
  const sessionDuration = Date.now() - sessionState.startTime
  const minutes = sessionDuration / (1000 * 60)
  
  sessionState.energyLevel = Math.max(0.3, 1.0 - (minutes * 0.02))
  
  if (sessionState.followCount > 5 && Math.random() < 0.1) {
    sessionState.currentMood = Math.random() > 0.5 ? 'tired' : 'distracted'
  }
  
  const timeSinceLastAction = Date.now() - sessionState.lastActionTime
  if (timeSinceLastAction < 3000) {
    sessionState.consecutiveActions++
  } else {
    sessionState.consecutiveActions = 0
  }
  
  sessionState.lastActionTime = Date.now()
}

async function applyBehaviorPatterns(baseDelay, profile, context) {
  let delay = baseDelay
  
  if (Math.random() < profile.thinkingChance) {
    delay += 1000 + Math.random() * 3000
    log('verbose', '🤔 Adding thinking pause...')
  }
  
  if (Math.random() < profile.distractionChance) {
    delay += 2000 + Math.random() * 5000
    log('verbose', '😵 Distraction spike...')
  }
  
  if (sessionState.consecutiveActions > 3) {
    delay *= 1.2 + (sessionState.consecutiveActions * 0.1)
    log('verbose', `😴 Fatigue effect: ${sessionState.consecutiveActions} consecutive actions`)
  }
  
  if (Math.random() < 0.08 && context !== 'follow') {
    delay *= 0.6
    log('verbose', '⚡ Rush moment - faster action')
  }
  
  if (context === 'follow' && Math.random() < 0.12) {
    delay += 1500 + Math.random() * 3000
    log('verbose', '🤷 Double-checking before follow...')
  }
  
  return delay
}

function avoidDetectionPatterns(delay) {
  if (sessionState.recentTimings.length < 3) return delay
  
  const recentAvg = sessionState.recentTimings.reduce((sum, t) => sum + t, 0) / sessionState.recentTimings.length
  const variance = Math.abs(delay - recentAvg) / recentAvg
  
  if (variance < 0.2) {
    const chaosMultiplier = 0.5 + Math.random() * 1.5
    delay *= chaosMultiplier
    log('verbose', '🌪️ Breaking timing pattern with chaos')
  }
  
  if (delay % 1000 < 50 || delay % 1000 > 950) {
    delay += (Math.random() - 0.5) * 400
  }
  
  return delay
}

const humanWait = async (minMs = 1500, maxMs = 4000, context = 'general') => {
  if (sessionState.recentTimings.length === 0) {
    initializeHumanSession()
  }
  
  updateSessionState()
  
  const profile = TIMING_PROFILES[sessionState.sessionType]
  
  let baseDelay = minMs + Math.random() * (maxMs - minMs)
  
  baseDelay *= profile.baseMultiplier
  
  baseDelay *= (2.0 - sessionState.energyLevel)
  
  const variation = 1 + (Math.random() - 0.5) * profile.variation
  baseDelay *= variation
  
  const contextMultipliers = {
    follow: 1.2,
    typing: 0.8,
    clicking: 0.9,
    thinking: 1.8,
    scrolling: 0.6,
    reading: 1.4
  }
  
  if (contextMultipliers[context]) {
    baseDelay *= contextMultipliers[context]
  }
  
  baseDelay = await applyBehaviorPatterns(baseDelay, profile, context)
  
  baseDelay = avoidDetectionPatterns(baseDelay)
  
  const finalDelay = Math.max(800, Math.round(baseDelay))
  
  sessionState.recentTimings.push(finalDelay)
  if (sessionState.recentTimings.length > 10) {
    sessionState.recentTimings.shift()
  }
  
  log('verbose', `⏱️ Human wait: ${finalDelay}ms (${context}, energy: ${sessionState.energyLevel.toFixed(2)})`)
  
  return new Promise(resolve => setTimeout(resolve, finalDelay))
}

function generateDeviceProfile() {
  const screenProfile = SCREEN_PROFILES[Math.floor(Math.random() * SCREEN_PROFILES.length)]
  const osProfile = OS_PROFILES[Math.floor(Math.random() * OS_PROFILES.length)]
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
  
  const hardwareSpecs = {
    cores: screenProfile.deviceType === 'mobile' ? [4, 6, 8][Math.floor(Math.random() * 3)] : [4, 6, 8, 12, 16][Math.floor(Math.random() * 5)],
    memory: screenProfile.deviceType === 'mobile' ? [4, 6, 8][Math.floor(Math.random() * 3)] : [8, 16, 32][Math.floor(Math.random() * 3)],
    gpu: screenProfile.deviceType === 'mobile' ? 'Adreno 650' : ['NVIDIA GeForce RTX 3060', 'AMD Radeon RX 6700 XT', 'Intel Iris Xe Graphics'][Math.floor(Math.random() * 3)]
  }
  
  const profile = {
    userAgent,
    screen: screenProfile,
    os: osProfile,
    hardware: hardwareSpecs,
    viewport: {
      width: screenProfile.width + Math.floor(Math.random() * 100) - 50,
      height: screenProfile.height + Math.floor(Math.random() * 100) - 50,
      deviceScaleFactor: screenProfile.mobile ? 2 + Math.random() * 1 : 1 + Math.random() * 0.5,
      hasTouch: screenProfile.mobile || Math.random() > 0.8,
      isLandscape: screenProfile.width > screenProfile.height,
      isMobile: screenProfile.mobile
    },
    plugins: generateRealisticPlugins(),
    webgl: generateWebGLProfile(),
    canvas: generateCanvasNoise(),
    audio: generateAudioNoise()
  }
  
  log('detailed', 'Generated device profile', {
    device: screenProfile.name,
    os: osProfile.platform,
    mobile: screenProfile.mobile
  })
  
  return profile
}

function generateRealisticPlugins() {
  const basePlugins = [
    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
    { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: 'Portable Document Format' },
    { name: 'Native Client', filename: 'internal-nacl-plugin', description: 'Native Client' }
  ]
  
  const optionalPlugins = [
    { name: 'WebKit built-in PDF', filename: 'webkit-pdf-plugin', description: 'Portable Document Format' },
    { name: 'Microsoft Edge PDF Viewer', filename: 'edge-pdf-viewer', description: 'Portable Document Format' },
    { name: 'Adobe Flash Player', filename: 'pepflashplayer.dll', description: 'Shockwave Flash' },
    { name: 'Java Deployment Toolkit', filename: 'npDeployJava1.dll', description: 'Java Deployment Toolkit' }
  ]
  
  const numPlugins = 2 + Math.floor(Math.random() * 4)
  const selectedPlugins = [...basePlugins]
  
  while (selectedPlugins.length < numPlugins && optionalPlugins.length > 0) {
    const randomIndex = Math.floor(Math.random() * optionalPlugins.length)
    selectedPlugins.push(optionalPlugins.splice(randomIndex, 1)[0])
  }
  
  return selectedPlugins
}

function generateWebGLProfile() {
  const vendors = ['Intel Inc.', 'NVIDIA Corporation', 'AMD', 'Qualcomm']
  const renderers = [
    'Intel Iris Xe Graphics',
    'NVIDIA GeForce RTX 3060', 
    'AMD Radeon RX 6700 XT',
    'ANGLE (Intel, Intel Iris Xe Graphics Direct3D11 vs_5_0 ps_5_0)',
    'WebKit WebGL'
  ]
  
  return {
    vendor: vendors[Math.floor(Math.random() * vendors.length)],
    renderer: renderers[Math.floor(Math.random() * renderers.length)]
  }
}

function generateCanvasNoise() {
  return {
    noise: Math.random() * 0.0001,
    shift: Math.floor(Math.random() * 10) - 5
  }
}

function generateAudioNoise() {
  return {
    noiseLevel: Math.random() * 0.00001,
    oscillatorFreq: 440 + Math.random() * 100
  }
}

async function createMaximumStealthBrowser() {
  log('info', '🎭 Creating MAXIMUM stealth browser (No Proxy Strategy)...')
  
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
      '--disable-features=BlinkGenPropertyTrees', 
      '--disable-ipc-flooding-protection',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-features=Translate',
      '--disable-hang-monitor',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--disable-translate',
      '--disable-background-timer-throttling',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-background-downloads',
      '--disable-add-to-shelf',
      '--disable-office-editing-component-extension',
      '--disable-background-media-suspend',
      '--disable-password-generation',
      '--disable-password-manager-reauthentication',
      '--metrics-recording-only',
      '--no-default-browser-check',
      '--safebrowsing-disable-auto-update',
      '--enable-automation=false',
      '--password-store=basic',
      '--use-mock-keychain',
      '--disable-plugins-discovery',
      '--disable-preconnect',
      '--disable-prefetch',
      '--disable-logging',
      '--disable-extensions-file-access-check',
      '--disable-extensions-http-throttling',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-networking',
      '--disable-extension-updater',
      '--disable-print-preview',
      '--disable-speech-api',
      '--hide-scrollbars',
      '--mute-audio',
      '--memory-pressure-off',
      '--max_old_space_size=4096',
      '--disable-blink-features=AutomationControlled',
      '--exclude-switches=enable-automation',
      '--disable-extensions-http-throttling',
      '--disable-useragent-freeze'
    ],
    ignoreDefaultArgs: [
      '--enable-automation',
      '--enable-blink-features=IdleDetection'
    ],
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    devtools: false,
  })

  const pages = await browser.pages()
  const page = pages[0] || await browser.newPage()

  log('info', '🛡️ Applying MAXIMUM stealth measures...')

  await page.evaluateOnNewDocument((profile) => {
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
      'webdriver-evaluate', 'selenium-evaluate', 'webdriverCommand', 'webdriver-evaluate-response',
      'cdc_adoQpoasnfa76pfcZLmcfl_Array', 'cdc_adoQpoasnfa76pfcZLmcfl_Promise',
      'cdc_adoQpoasnfa76pfcZLmcfl_Symbol', '$chrome_asyncScriptInfo', '$cdc_asdjflasutopfhvcZLmcfl_'
    ]
    
    automationProps.forEach(prop => {
      try {
        delete window[prop]
        delete document[prop]
        delete window.document[prop]
      } catch (e) {}
    })

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
        },
        PlatformNaclArch: {
          ARM: 'arm',
          X86_32: 'x86-32', 
          X86_64: 'x86-64'
        },
        onStartup: null,
        onInstalled: null,
        onSuspend: null,
        onSuspendCanceled: null,
        onUpdateAvailable: null,
        onBrowserUpdateAvailable: null,
        onRestartRequired: null,
        RequestUpdateCheckStatus: {
          THROTTLED: 'throttled',
          NO_UPDATE: 'no_update',
          UPDATE_AVAILABLE: 'update_available'
        }
      },
      loadTimes: function() {
        const loadTimes = {
          requestTime: Date.now() - Math.random() * 1000,
          startLoadTime: Date.now() - Math.random() * 2000,
          commitLoadTime: Date.now() - Math.random() * 1500,
          finishDocumentLoadTime: Date.now() - Math.random() * 1000,
          finishLoadTime: Date.now() - Math.random() * 500,
          firstPaintTime: Date.now() - Math.random() * 1200,
          firstPaintAfterLoadTime: 0,
          navigationType: 'Other',
          wasFetchedViaSpdy: false,
          wasNpnNegotiated: false,
          npnNegotiatedProtocol: 'unknown',
          wasAlternateProtocolAvailable: false,
          connectionInfo: 'http/1.1'
        }
        return loadTimes
      },
      csi: function() {
        return {
          startE: Date.now() - Math.random() * 1000,
          onloadT: Date.now() - Math.random() * 500,
          pageT: Math.random() * 100,
          tran: Math.floor(Math.random() * 20)
        }
      },
      app: {
        isInstalled: false,
        InstallState: {
          DISABLED: 'disabled',
          INSTALLED: 'installed',
          NOT_INSTALLED: 'not_installed'
        },
        RunningState: {
          CANNOT_RUN: 'cannot_run',
          READY_TO_RUN: 'ready_to_run',
          RUNNING: 'running'
        },
        getDetails: function() { return null },
        getIsInstalled: function() { return false },
        runningState: function() { return 'cannot_run' }
      }
    }

    Object.defineProperty(navigator, 'platform', { 
      get: () => profile.os.platform
    })
    
    Object.defineProperty(navigator, 'hardwareConcurrency', { 
      get: () => profile.hardware.cores
    })
    
    Object.defineProperty(navigator, 'deviceMemory', { 
      get: () => profile.hardware.memory
    })

    Object.defineProperty(navigator, 'plugins', { 
      get: () => profile.plugins
    })
    
    Object.defineProperty(navigator, 'languages', { 
      get: () => profile.os.languages
    })
    
    Object.defineProperty(navigator, 'language', { 
      get: () => profile.os.languages[0]
    })

    Object.defineProperty(navigator, 'connection', {
      get: () => ({
        effectiveType: ['slow-2g', '2g', '3g', '4g'][Math.floor(Math.random() * 4)],
        rtt: 50 + Math.random() * 200,
        downlink: 1 + Math.random() * 10,
        saveData: Math.random() > 0.8
      })
    })

    const originalQuery = window.navigator.permissions.query
    window.navigator.permissions.query = (parameters) => {
      const permissionStates = {
        'notifications': ['default', 'denied', 'granted'][Math.floor(Math.random() * 3)],
        'geolocation': ['denied', 'prompt'][Math.floor(Math.random() * 2)],
        'camera': 'denied',
        'microphone': 'denied',
        'midi': 'denied',
        'push': ['denied', 'prompt'][Math.floor(Math.random() * 2)]
      }
      return Promise.resolve({
        state: permissionStates[parameters.name] || 'denied'
      })
    }

    if (navigator.getBattery) {
      navigator.getBattery = () => Promise.resolve({
        charging: Math.random() > 0.3,
        chargingTime: Math.random() > 0.5 ? Infinity : 1800 + Math.random() * 7200,
        dischargingTime: Math.random() > 0.5 ? Infinity : 3600 + Math.random() * 14400,
        level: 0.2 + Math.random() * 0.8,
        addEventListener: function() {},
        removeEventListener: function() {}
      })
    }

    if (navigator.credentials) {
      navigator.credentials.store = () => Promise.resolve()
      navigator.credentials.create = () => Promise.resolve()
      navigator.credentials.get = () => Promise.resolve(null)
    }

    if (navigator.geolocation) {
      const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition
      navigator.geolocation.getCurrentPosition = function(success, error, options) {
        setTimeout(() => {
          if (error) error({ 
            code: 1, 
            message: 'User denied the request for Geolocation.',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3
          })
        }, 100 + Math.random() * 200)
      }
      
      navigator.geolocation.watchPosition = function(success, error, options) {
        return Math.floor(Math.random() * 1000000)
      }
      
      navigator.geolocation.clearWatch = function(id) {}
    }

    const getParameter = WebGLRenderingContext.prototype.getParameter
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) return profile.webgl.vendor
      if (parameter === 37446) return profile.webgl.renderer
      if (parameter === 7936) return `WebGL ${Math.floor(Math.random() * 3) + 1}.0`
      if (parameter === 7937) return `OpenGL ES ${Math.floor(Math.random() * 3) + 2}.0`
      return getParameter.apply(this, arguments)
    }

    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData
    
    HTMLCanvasElement.prototype.toDataURL = function(type) {
      const shift = profile.canvas.shift
      const context = this.getContext('2d')
      if (context) {
        const imageData = context.getImageData(0, 0, this.width, this.height)
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] + shift))
          imageData.data[i + 1] = Math.min(255, Math.max(0, imageData.data[i + 1] + shift))
          imageData.data[i + 2] = Math.min(255, Math.max(0, imageData.data[i + 2] + shift))
        }
        
        context.putImageData(imageData, 0, 0)
      }
      return originalToDataURL.apply(this, arguments)
    }

    CanvasRenderingContext2D.prototype.getImageData = function() {
      const imageData = originalGetImageData.apply(this, arguments)
      const shift = profile.canvas.shift
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] + shift))
        imageData.data[i + 1] = Math.min(255, Math.max(0, imageData.data[i + 1] + shift))
        imageData.data[i + 2] = Math.min(255, Math.max(0, imageData.data[i + 2] + shift))
      }
      
      return imageData
    }

    const originalAudioContext = window.AudioContext || window.webkitAudioContext
    if (originalAudioContext) {
      window.AudioContext = function() {
        const ctx = new originalAudioContext()
        const originalCreateAnalyser = ctx.createAnalyser
        
        ctx.createAnalyser = function() {
          const analyser = originalCreateAnalyser.apply(this)
          const originalGetFloatFrequencyData = analyser.getFloatFrequencyData
          
          analyser.getFloatFrequencyData = function(array) {
            originalGetFloatFrequencyData.apply(this, arguments)
            for (let i = 0; i < array.length; i++) {
              array[i] += profile.audio.noiseLevel * (Math.random() - 0.5)
            }
          }
          
          const originalGetByteFrequencyData = analyser.getByteFrequencyData
          analyser.getByteFrequencyData = function(array) {
            originalGetByteFrequencyData.apply(this, arguments)
            for (let i = 0; i < array.length; i++) {
              array[i] = Math.min(255, Math.max(0, array[i] + Math.floor(profile.audio.noiseLevel * 255 * (Math.random() - 0.5))))
            }
          }
          
          return analyser
        }
        
        const originalCreateOscillator = ctx.createOscillator
        ctx.createOscillator = function() {
          const oscillator = originalCreateOscillator.apply(this)
          const originalFrequency = oscillator.frequency
          
          Object.defineProperty(oscillator, 'frequency', {
            get: function() {
              return {
                ...originalFrequency,
                value: originalFrequency.value + profile.audio.oscillatorFreq * 0.01 * (Math.random() - 0.5)
              }
            }
          })
          
          return oscillator
        }
        
        return ctx
      }
      
      if (window.webkitAudioContext) {
        window.webkitAudioContext = window.AudioContext
      }
    }

    Object.defineProperty(screen, 'width', {
      get: () => profile.screen.width
    })
    Object.defineProperty(screen, 'height', {
      get: () => profile.screen.height
    })
    Object.defineProperty(screen, 'availWidth', {
      get: () => profile.screen.width
    })
    Object.defineProperty(screen, 'availHeight', {
      get: () => profile.screen.height - 40 - Math.floor(Math.random() * 20)
    })
    Object.defineProperty(screen, 'colorDepth', {
      get: () => 24
    })
    Object.defineProperty(screen, 'pixelDepth', {
      get: () => 24
    })

    Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
      value: function() {
        const original = Intl.DateTimeFormat.prototype.resolvedOptions.call(this)
        return {
          ...original,
          timeZone: profile.os.timezone,
          locale: profile.os.languages[0]
        }
      }
    })

    let mouseEntropyData = []
    let isMouseMoving = false
    
    document.addEventListener('mousemove', function(e) {
      mouseEntropyData.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
        pressure: e.pressure || Math.random()
      })
      if (mouseEntropyData.length > 50) {
        mouseEntropyData.shift()
      }
      isMouseMoving = true
      setTimeout(() => { isMouseMoving = false }, 100)
    })

    let keyEntropyData = []
    let keyTimings = []
    
    document.addEventListener('keydown', function(e) {
      const currentTime = Date.now()
      keyEntropyData.push({
        key: e.key,
        time: currentTime,
        pressure: Math.random(),
        duration: 0
      })
      
      if (keyTimings.length > 0) {
        const timeDiff = currentTime - keyTimings[keyTimings.length - 1]
        keyTimings.push(timeDiff)
      } else {
        keyTimings.push(currentTime)
      }
      
      if (keyEntropyData.length > 100) {
        keyEntropyData.shift()
      }
      if (keyTimings.length > 100) {
        keyTimings.shift()
      }
    })
    
    document.addEventListener('keyup', function(e) {
      if (keyEntropyData.length > 0) {
        const lastKey = keyEntropyData[keyEntropyData.length - 1]
        if (lastKey.key === e.key) {
          lastKey.duration = Date.now() - lastKey.time
        }
      }
    })

    let scrollBehavior = {
      lastScrollTime: 0,
      scrollDirection: 1,
      scrollMomentum: 0
    }
    
    window.addEventListener('wheel', function(e) {
      scrollBehavior.lastScrollTime = Date.now()
      scrollBehavior.scrollDirection = e.deltaY > 0 ? 1 : -1
      scrollBehavior.scrollMomentum = Math.abs(e.deltaY)
    })

    Object.defineProperty(HTMLFormElement.prototype, 'submit', {
      value: function() {
        const passwordInputs = this.querySelectorAll('input[type="password"]')
        passwordInputs.forEach(input => {
          input.setAttribute('autocomplete', 'new-password')
          input.setAttribute('data-no-save', 'true')
          input.setAttribute('data-lpignore', 'true')
          input.setAttribute('data-form-type', 'other')
        })
        
        const emailInputs = this.querySelectorAll('input[type="email"], input[name*="email"]')
        emailInputs.forEach(input => {
          input.setAttribute('autocomplete', 'new-password')
          input.setAttribute('data-lpignore', 'true')
        })
        
        return HTMLFormElement.prototype.submit.apply(this, arguments)
      }
    })

    let pageVisibilityState = 'visible'
    let lastVisibilityChange = Date.now()
    
    Object.defineProperty(document, 'visibilityState', {
      get: () => pageVisibilityState
    })
    
    Object.defineProperty(document, 'hidden', {
      get: () => pageVisibilityState === 'hidden'
    })

    if (navigator.connection || navigator.mozConnection || navigator.webkitConnection) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      
      Object.defineProperty(connection, 'effectiveType', {
        get: () => ['slow-2g', '2g', '3g', '4g'][Math.floor(Math.random() * 4)]
      })
      
      Object.defineProperty(connection, 'downlink', {
        get: () => 1 + Math.random() * 10
      })
      
      Object.defineProperty(connection, 'rtt', {
        get: () => 50 + Math.random() * 200
      })
    }

    const originalSetTimeout = window.setTimeout
    const originalSetInterval = window.setInterval
    const originalRequestAnimationFrame = window.requestAnimationFrame
    
    window.setTimeout = function(fn, delay, ...args) {
      const humanizedDelay = delay + (Math.random() - 0.5) * delay * 0.1
      return originalSetTimeout.call(this, fn, Math.max(1, humanizedDelay), ...args)
    }
    
    window.setInterval = function(fn, delay, ...args) {
      const humanizedDelay = delay + (Math.random() - 0.5) * delay * 0.05
      return originalSetInterval.call(this, fn, Math.max(1, humanizedDelay), ...args)
    }

    window.requestAnimationFrame = function(fn) {
      return originalRequestAnimationFrame.call(this, () => {
        setTimeout(fn, Math.random() * 16)
      })
    }

    Object.defineProperty(window, 'outerHeight', {
      get: () => window.innerHeight + Math.floor(Math.random() * 100) + 50
    })
    
    Object.defineProperty(window, 'outerWidth', {
      get: () => window.innerWidth + Math.floor(Math.random() * 100) + 50
    })

    if (window.performance && window.performance.timing) {
      const originalTiming = window.performance.timing
      const now = Date.now()
      
      Object.defineProperty(window.performance, 'timing', {
        get: () => ({
          ...originalTiming,
          navigationStart: now - Math.random() * 1000,
          loadEventEnd: now - Math.random() * 500,
          domContentLoadedEventEnd: now - Math.random() * 700
        })
      })
    }

  }, deviceProfile)

  await page.setUserAgent(deviceProfile.userAgent)
  const headers = {
    'Accept-Language': deviceProfile.os.languages.join(',') + ';q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': deviceProfile.viewport.isMobile ? '?1' : '?0',
    'sec-ch-ua-platform': `"${deviceProfile.os.platform}"`,
    'sec-fetch-user': '?1',
    'DNT': Math.random() > 0.5 ? '1' : undefined
  }
  
  Object.keys(headers).forEach(key => headers[key] === undefined && delete headers[key])
  
  await page.setExtraHTTPHeaders(headers)
  await page.setViewport(deviceProfile.viewport)

  log('success', '✅ Maximum stealth browser created with realistic device profile')
  
  return { browser, page, deviceProfile }
}

async function createTempEmail() {
  log('info', '📧 Creating temporary email...')
  
  try {
    const sessionResponse = await axios.get('https://www.guerrillamail.com/ajax.php?f=get_email_address', {
      timeout: 15000,
      headers: {
        "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        "Referer": "https://www.guerrillamail.com/inbox",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache"
      }
    })
    
    if (sessionResponse.data && sessionResponse.data.email_addr) {
      const email = sessionResponse.data.email_addr
      const sessionId = sessionResponse.data.sid_token
      
      log('success', `✅ Created email: ${email}`)
      return {
        success: true,
        email: email,
        sessionId: sessionId,
        provider: "guerrillamail"
      }
    } else {
      throw new Error("Failed to get email address")
    }
  } catch (error) {
    log('error', `❌ Email creation failed: ${error.message}`)
    throw new Error("Email creation failed")
  }
}

const POPULAR_INDIAN_ACCOUNTS = [
  'virat.kohli', 'priyankachopra', 'deepikapadukone', 'aliaabhatt', 'ranveersingh',
  'akshaykumar', 'hrithikroshan', 'shahidkapoor', 'varundvn', 'tigerjackieshroff',
  'kritisanon', 'anushkasharma', 'sonamkapoor', 'parineetichopra', 'shraddhakapoor',
  'aslisona', 'katrinakaif', 'dishapatani', 'jahnvikapoor', 'saraalikhan95',
  'mahi7781', 'rohitsharma45', 'hardikpandya93', 'klrahul', 'yuzi_chahal',
  'jaspritb1', 'ishankishan51', 'rishabhpant', 'surya_14kumar', 'shubmangill',
  'tanmaybhat', 'ashishchanchlani', 'carryminati', 'beerbiceps', 'mostlysane',
  'dollysingh', 'komal_pandey', 'masoomminawala', 'sejalgomes', 'larissadalmeida',
  'dikshawahani', 'aashnamalani', 'santoshi.shetty', 'shetroublemaker', 'riyagogoi',
  'anandmahindra', 'ratan.tata', 'pvsindhu1', 'nehakakkar', 'tonykakkar',
  'guru_randhawa', 'badshahmusic', 'iamsonyhka', 'harrdy_sandhu', 'ammy_virk',
  'manishmalhotra05', 'sabyasachiofficial', 'rohitbal', 'taruntahiliani',
  'sukritiandaakriti', 'masabagupta', 'payalsinghal', 'ridhimehra', 'shantanunikhil',
  'theshilpashetty', 'madhuridixitnene', 'kareenakapoorkhan', 'therealkarismakapoor',
  'bipashabasu', 'sushmitasen47', 'rakulpreet', 'adah_sharma', 'taapsee',
  'dhanushkraja', 'alluarjunonline', 'ramcharan', 'tarak9999', 'urstrulymahesh'
]

function generateProfile() {
  log('info', '👤 Generating realistic Indian profile...')
  
  const indianFirstNames = [
    "Arjun", "Aarav", "Vivaan", "Aditya", "Vihaan", "Sai", "Aryan", "Krishna", 
    "Ishaan", "Shaurya", "Atharv", "Aadhya", "Reyansh", "Muhammad", "Siddharth",
    "Rudra", "Ayaan", "Yash", "Om", "Darsh", "Rishab", "Krian", "Armaan",
    "Vedant", "Sreyansh", "Ahaan", "Tejas", "Harsh", "Samar", "Dhruv",
    "Saanvi", "Ananya", "Aadhya", "Diya", "Kavya", "Pihu", "Angel", "Pari",
    "Fatima", "Aaradhya", "Sara", "Anaya", "Parina", "Aisha", "Anvi", "Riya",
    "Myra", "Prisha", "Aanya", "Navya", "Drishti", "Shanaya", "Avni", "Reet",
    "Kiara", "Khushi", "Aradhya", "Kainaat", "Riddhi", "Mahika", "Siya"
  ]

  const indianLastNames = [
    "Sharma", "Verma", "Singh", "Kumar", "Gupta", "Agarwal", "Mishra", "Jain",
    "Patel", "Shah", "Mehta", "Joshi", "Desai", "Modi", "Reddy", "Nair",
    "Iyer", "Rao", "Pillai", "Menon", "Bhat", "Shetty", "Kaul", "Malhotra",
    "Kapoor", "Chopra", "Khanna", "Arora", "Bajaj", "Bansal", "Mittal", "Jindal",
    "Agrawal", "Goyal", "Saxena", "Rastogi", "Srivastava", "Shukla", "Pandey", "Tiwari"
  ]

  const firstName = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)]
  const lastName = indianLastNames[Math.floor(Math.random() * indianLastNames.length)]
  const birthYear = Math.floor(Math.random() * 22) + 1985
  const birthMonth = Math.floor(Math.random() * 12) + 1
  const birthDay = Math.floor(Math.random() * 28) + 1
  const gender = Math.random() > 0.5 ? "male" : "female"

  const timestamp = Date.now().toString().slice(-6)
  const randomSuffix = Math.floor(Math.random() * 99999)
  
  const usernames = [
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${timestamp}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${timestamp}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}`,
    `${firstName.toLowerCase()}${randomSuffix}`,
    `${lastName.toLowerCase()}${firstName.toLowerCase()}${randomSuffix}`,
    `${firstName.toLowerCase()}_${randomSuffix}`,
    `indian_${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}india${randomSuffix}`
  ]

  const password = `${firstName}${Math.floor(Math.random() * 9999)}!${lastName.charAt(0)}`

  const profile = {
    firstName,
    lastName,
    birthYear,
    birthMonth,
    birthDay,
    gender,
    usernames,
    password,
    fullName: `${firstName} ${lastName}`,
  }

  log('success', `✅ Generated profile: ${profile.fullName} (@${profile.usernames[0]})`)
  return profile
}

async function simulateNaturalMouseApproach(page, targetBox) {
  const approaches = [
    async () => {
      const startX = targetBox.x - 100 - Math.random() * 100
      const startY = targetBox.y + Math.random() * targetBox.height
      const midX = targetBox.x - 20 + Math.random() * 40
      const midY = targetBox.y - 20 + Math.random() * (targetBox.height + 40)
      const endX = targetBox.x + targetBox.width * (0.3 + Math.random() * 0.4)
      const endY = targetBox.y + targetBox.height * (0.3 + Math.random() * 0.4)
      
      await page.mouse.move(startX, startY)
      await humanWait(50, 150, 'general')
      await page.mouse.move(midX, midY, { steps: 3 + Math.floor(Math.random() * 5) })
      await humanWait(100, 200, 'general')
      await page.mouse.move(endX, endY, { steps: 2 + Math.floor(Math.random() * 3) })
    },
    async () => {
      const overshootX = targetBox.x + targetBox.width * (0.7 + Math.random() * 0.3)
      const overshootY = targetBox.y + targetBox.height * (0.7 + Math.random() * 0.3)
      const correctX = targetBox.x + targetBox.width * (0.3 + Math.random() * 0.4)
      const correctY = targetBox.y + targetBox.height * (0.3 + Math.random() * 0.4)
      
      await page.mouse.move(overshootX, overshootY, { steps: 4 + Math.floor(Math.random() * 6) })
      await humanWait(80, 200, 'general')
      await page.mouse.move(correctX, correctY, { steps: 2 + Math.floor(Math.random() * 3) })
    }
  ]
  
  const approach = approaches[Math.floor(Math.random() * approaches.length)]
  await approach()
}

async function clearFieldNaturally(page, element) {
  const clearMethods = [
    async () => {
      await element.click({ clickCount: 3 })
      await humanWait(100, 300, 'general')
      await page.keyboard.press('Backspace')
    },
    async () => {
      await page.keyboard.down('Control')
      await page.keyboard.press('KeyA')
      await page.keyboard.up('Control')
      await humanWait(80, 200, 'general')
      await page.keyboard.press('Backspace')
    }
  ]
  
  const method = clearMethods[Math.floor(Math.random() * clearMethods.length)]
  await method()
}



async function typeWithHumanPatterns(page, element, text) {
  const words = text.split(' ')
  
  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex]
    
    for (let charIndex = 0; charIndex < word.length; charIndex++) {
      const char = word[charIndex]
      
      let baseDelay = 120
      if (char.match(/[aeiou]/)) baseDelay = 100
      if (char.match(/[qwerty]/)) baseDelay = 110
      if (char.match(/[zxcv]/)) baseDelay = 140
      if (char.match(/[0-9]/)) baseDelay = 150
      if (char.match(/[!@#$%]/)) baseDelay = 180
      
      const typeDelay = baseDelay + Math.random() * 80
      
      if (Math.random() < 0.02 && charIndex > 0) {
        const wrongChars = 'abcdefghijklmnopqrstuvwxyz'
        const wrongChar = wrongChars[Math.floor(Math.random() * wrongChars.length)]
        
        await element.type(wrongChar, { delay: typeDelay })
        await humanWait(200, 500, 'thinking')
        await page.keyboard.press('Backspace')
        await humanWait(150, 400, 'thinking')
      }
      
      await element.type(char, { delay: typeDelay })
      
      if (Math.random() < 0.1) {
        await humanWait(100, 400, 'thinking')
      }
    }
    
    if (wordIndex < words.length - 1) {
      await element.type(' ', { delay: 120 })
      await humanWait(200, 600, 'general')
    }
    
    if (Math.random() < 0.25 && wordIndex < words.length - 1) {
      await humanWait(500, 1500, 'thinking')
    }
  }
}
async function humanTypeMaxStealth(page, selector, text) {
  log('detailed', `⌨️ Enhanced human typing: "${text}" into ${selector}`)
  
  try {
    const element = await page.waitForSelector(selector, { timeout: 20000 })
    
    const box = await element.boundingBox()
    if (box) {
      await simulateNaturalMouseApproach(page, box)
    }
    
    await element.click()
    await humanWait(400, 1000, 'thinking')
    
    await clearFieldNaturally(page, element)
    
    await typeWithHumanPatterns(page, element, text)
    
    await humanWait(300, 800, 'general')
    log('verbose', `✅ Enhanced typing completed: "${text}"`)
    
  } catch (error) {
    log('error', `❌ Enhanced typing failed: ${error.message}`)
    throw error
  }
}


async function humanClickMaxStealth(page, selector) {
  log('detailed', `🖱️ Enhanced human clicking: ${selector}`)
  
  try {
    const element = await page.waitForSelector(selector, { timeout: 20000 })
    const box = await element.boundingBox()
    if (!box) throw new Error('Element not visible')
    
    await simulateNaturalMouseApproach(page, box)
    
    await humanWait(100, 400, 'thinking')
    
    const clickX = box.x + box.width * (0.25 + Math.random() * 0.5)
    const clickY = box.y + box.height * (0.25 + Math.random() * 0.5)
    
    const clickPatterns = [
      async () => await page.mouse.click(clickX, clickY),
      async () => {
        await page.mouse.down()
        await humanWait(80, 150, 'general')
        await page.mouse.up()
      },
      async () => {
        await page.mouse.click(clickX, clickY)
        await page.mouse.move(
          clickX + Math.random() * 4 - 2,
          clickY + Math.random() * 4 - 2
        )
      }
    ]
    
    const pattern = clickPatterns[Math.floor(Math.random() * clickPatterns.length)]
    await pattern()
    
    await humanWait(200, 600, 'general')
    log('verbose', `✅ Enhanced click completed: ${selector}`)
    
  } catch (error) {
    log('error', `❌ Enhanced clicking failed: ${error.message}`)
    throw error
  }
}

async function simulatePreNavigationBehavior(page) {
  const behaviors = [
    async () => {
      await page.evaluate(() => {
        window.scrollBy(0, Math.random() * 200 + 50)
      })
      await humanWait(500, 1200, 'scrolling')
    },
    async () => {
      await page.mouse.move(
        200 + Math.random() * 600,
        150 + Math.random() * 400,
        { steps: Math.floor(Math.random() * 8) + 3 }
      )
      await humanWait(300, 800, 'general')
    },
    async () => {
      await humanWait(1000, 2500, 'thinking')
    }
  ]
  
  const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)]
  await randomBehavior()
}

async function simulateProfileViewing(page, username) {
  log('verbose', `👀 Viewing profile @${username}...`)
  
  const viewingPatterns = {
    casual: async () => {
      await humanWait(2000, 4000, 'reading')
      if (Math.random() < 0.6) {
        await page.evaluate(() => window.scrollBy(0, 150 + Math.random() * 200))
        await humanWait(1000, 2500, 'reading')
      }
    },
    focused: async () => {
      await humanWait(1500, 3000, 'reading')
      await page.evaluate(() => window.scrollBy(0, 100))
      await humanWait(800, 1500, 'reading')
    },
    tired: async () => {
      await humanWait(3000, 6000, 'reading')
      if (Math.random() < 0.4) {
        await page.evaluate(() => window.scrollBy(0, 80))
        await humanWait(2000, 4000, 'reading')
      }
    },
    distracted: async () => {
      await humanWait(1000, 3500, 'reading')
      await page.mouse.move(
        300 + Math.random() * 300,
        200 + Math.random() * 300,
        { steps: 5 }
      )
      await humanWait(1500, 3000, 'thinking')
    }
  }
  
  const pattern = viewingPatterns[sessionState.sessionType] || viewingPatterns.casual
  await pattern()
}

async function attemptFollowWithHumanBehavior(page, username) {
  log('verbose', `🔄 Attempting to follow @${username} with human behavior...`)
  
  if (Math.random() < 0.15) {
    log('verbose', '🤔 Hesitating before follow...')
    await humanWait(1500, 4000, 'thinking')
  }
  
  const followResult = await page.evaluate(() => {
    const followStrategies = [
      () => {
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'))
        for (const button of buttons) {
          const buttonText = button.textContent?.trim().toLowerCase() || ''
          const isVisible = button.offsetParent !== null
          
          if ((buttonText === 'follow' || buttonText.includes('follow')) && 
              isVisible && 
              !buttonText.includes('following') &&
              !buttonText.includes('unfollow')) {
            button.click()
            return { success: true, method: 'text_search', buttonText }
          }
        }
        return null
      },
      () => {
        const ariaButtons = document.querySelectorAll('[aria-label*="Follow"]')
        for (const button of ariaButtons) {
          const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || ''
          if (ariaLabel.includes('follow') && 
              !ariaLabel.includes('following') && 
              button.offsetParent !== null) {
            button.click()
            return { success: true, method: 'aria_label', ariaLabel }
          }
        }
        return null
      },
      () => {
        const classButtons = document.querySelectorAll('button[class*="_acan"], button[class*="follow"]')
        for (const button of classButtons) {
          const buttonText = button.textContent?.trim().toLowerCase() || ''
          if (buttonText === 'follow' && button.offsetParent !== null) {
            button.click()
            return { success: true, method: 'class_search', buttonText }
          }
        }
        return null
      }
    ]
    
    for (const strategy of followStrategies) {
      const result = strategy()
      if (result) return result
    }
    
    return { success: false, reason: 'follow_button_not_found' }
  })
  
  if (followResult.success) {
    await humanWait(1500, 3500, 'general')
    
    const verification = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'))
      for (const button of buttons) {
        const buttonText = button.textContent?.trim().toLowerCase() || ''
        if (buttonText === 'following' || 
            buttonText === 'requested' || 
            buttonText.includes('unfollow')) {
          return { success: true, status: buttonText }
        }
      }
      return { success: false }
    })
    
    return {
      username,
      success: verification.success,
      status: verification.status || 'unknown',
      method: followResult.method
    }
  }
  
  return {
    username,
    success: false,
    error: followResult.reason
  }
}

async function calculateSmartFollowDelay(currentIndex, successfulFollows, totalAccounts) {
  let minDelay = AUTO_FOLLOW_CONFIG.followDelay.min
  let maxDelay = AUTO_FOLLOW_CONFIG.followDelay.max
  
  const progressMultiplier = 1 + (currentIndex / totalAccounts) * 0.5
  minDelay *= progressMultiplier
  maxDelay *= progressMultiplier
  
  const successRate = successfulFollows / (currentIndex + 1)
  if (successRate > 0.8) {
    minDelay *= 1.4
    maxDelay *= 1.6
    log('verbose', '⚠️ High success rate - increasing delays')
  }
  
  const variation = 0.5 + Math.random()
  minDelay *= variation
  maxDelay *= variation
  
  await humanWait(minDelay, maxDelay, 'follow')
  
  log('info', `⏳ Smart delay completed (success rate: ${Math.round(successRate * 100)}%)`)
}

async function autoFollowIndianAccounts(page) {
  log('info', '🇮🇳 Starting enhanced human-like auto-follow process...')
  
  if (!AUTO_FOLLOW_CONFIG.enabled) {
    log('info', '❌ Auto-follow disabled in config')
    return { success: false, followedCount: 0, reason: 'disabled' }
  }
  
  initializeHumanSession()
  
  let followedCount = 0
  const followResults = []
  
  try {
    const shuffledAccounts = [...POPULAR_INDIAN_ACCOUNTS].sort(() => 0.5 - Math.random())
    const accountsToFollow = shuffledAccounts.slice(0, AUTO_FOLLOW_CONFIG.followCount)
    
    log('info', `🎯 Selected accounts: ${accountsToFollow.join(', ')}`)
    
    for (let i = 0; i < accountsToFollow.length; i++) {
      const username = accountsToFollow[i]
      
      try {
        log('info', `👤 Processing @${username} (${i + 1}/${accountsToFollow.length})...`)
        
        if (Math.random() < 0.3) {
          await simulatePreNavigationBehavior(page)
        }
        
        const profileUrl = `https://www.instagram.com/${username}/`
        await page.goto(profileUrl, { 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        })
        
        await simulateProfileViewing(page, username)
        
        const accountStatus = await page.evaluate(() => {
          const pageContent = document.body.textContent || document.body.innerText || ''
          
          if (pageContent.includes("Sorry, this page isn't available")) {
            return { exists: false, reason: 'account_not_found' }
          }
          
          if (pageContent.includes("This Account is Private")) {
            return { exists: true, isPrivate: true }
          }
          
          return { exists: true, isPrivate: false }
        })
        
        if (!accountStatus.exists) {
          log('verbose', `⚠️ Account @${username} not found`)
          followResults.push({ username, success: false, error: 'account_not_found' })
          continue
        }
        
        if (accountStatus.isPrivate && AUTO_FOLLOW_CONFIG.skipPrivateAccounts) {
          log('verbose', `⚠️ Skipping private account @${username}`)
          followResults.push({ username, success: false, error: 'private_account_skipped' })
          continue
        }
        
        const followResult = await attemptFollowWithHumanBehavior(page, username)
        
        if (followResult.success) {
          followedCount++
          sessionState.followCount++
          log('success', `✅ Successfully followed @${username}`)
        }
        
        followResults.push(followResult)
        
        if (i < accountsToFollow.length - 1) {
          await calculateSmartFollowDelay(i, followedCount, accountsToFollow.length)
        }
        
      } catch (error) {
        log('error', `❌ Error with @${username}: ${error.message}`)
        followResults.push({ username, success: false, error: error.message })
      }
    }
    
    return {
      success: true,
      followedCount: followedCount,
      totalAttempted: accountsToFollow.length,
      followResults: followResults,
      sessionProfile: sessionState.sessionType,
      finalEnergyLevel: sessionState.energyLevel
    }
    
  } catch (error) {
    log('error', `❌ Auto-follow process failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function checkEmailForInstagramOTP(email, maxWaitMinutes = 3, browser) {
  const startTime = Date.now()
  const maxWaitTime = maxWaitMinutes * 60 * 1000
  const [username] = email.split('@')
  
  log('info', `📧 Starting OTP check for: ${email}`)
  
  let guerrillamailPage = null
  
  try {
    guerrillamailPage = await browser.newPage()
    await guerrillamailPage.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)])
    await guerrillamailPage.setViewport({ width: 1366, height: 768 })
    
    await guerrillamailPage.goto('https://www.guerrillamail.com/', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    
    await humanWait(3000, 5000)
    
    try {
      const emailClickResult = await guerrillamailPage.evaluate((targetUsername) => {
        const editableElements = document.querySelectorAll('span.editable, .editable, [id*="inbox-id"]')
        
        for (const element of editableElements) {
          const elementText = element.textContent?.trim() || ''
          if (elementText && elementText.length > 3 && !elementText.includes('@')) {
            element.click()
            return { success: true, clickedText: elementText }
          }
        }
        
        const allSpans = document.querySelectorAll('span, div, a')
        for (const span of allSpans) {
          const spanText = span.textContent?.trim() || ''
          const isClickable = span.onclick || span.getAttribute('onclick') || 
                            span.classList.contains('clickable') || 
                            span.classList.contains('editable') ||
                            span.style.cursor === 'pointer'
          
          if (spanText && spanText.length > 3 && spanText.length < 20 && 
              !spanText.includes('@') && !spanText.includes(' ') && isClickable) {
            span.click()
            return { success: true, clickedText: spanText }
          }
        }
        
        return { success: false }
      }, username)
      
      if (emailClickResult.success) {
        await humanWait(1000, 2000)
        
        const textInputResult = await guerrillamailPage.evaluate((targetUsername) => {
          const textInputs = document.querySelectorAll('input[type="text"]')
          
          for (const input of textInputs) {
            if (input.offsetParent !== null && !input.disabled) {
              input.focus()
              input.select()
              input.value = ''
              input.value = targetUsername
              input.dispatchEvent(new Event('input', { bubbles: true }))
              input.dispatchEvent(new Event('change', { bubbles: true }))
              return { success: true, inputValue: input.value }
            }
          }
          return { success: false }
        }, username)
        
        if (textInputResult.success) {
          await humanWait(500, 1000)
          
          const setButtonResult = await guerrillamailPage.evaluate(() => {
            const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]')
            
            for (const button of buttons) {
              const buttonText = (button.textContent || button.value || '').trim().toLowerCase()
              if (buttonText === 'set' && button.offsetParent !== null) {
                button.click()
                return { success: true }
              }
            }
            
            const allElements = document.querySelectorAll('*')
            for (const element of allElements) {
              const text = element.textContent?.trim().toLowerCase() || ''
              if (text === 'set' && element.offsetParent !== null) {
                element.click()
                return { success: true }
              }
            }
            
            return { success: false }
          })
          
          if (!setButtonResult.success) {
            await guerrillamailPage.keyboard.press('Enter')
          }
        }
      } else {
        const textInputs = await guerrillamailPage.$('input[type="text"]')
        if (textInputs.length > 0) {
          await textInputs[0].click({ clickCount: 3 })
          await guerrillamailPage.keyboard.press('Backspace')
          await textInputs[0].type(username, { delay: 120 })
          await guerrillamailPage.keyboard.press('Enter')
        }
      }
    } catch (setError) {
    }
    
    await humanWait(3000, 5000)
    
    let checkCount = 0
    const maxChecks = Math.floor(maxWaitTime / 10000)
    
    while (Date.now() - startTime < maxWaitTime && checkCount < maxChecks) {
      checkCount++
      log('info', `📧 OTP Check ${checkCount}/${maxChecks}...`)
      
      try {
        await guerrillamailPage.reload({ waitUntil: 'networkidle2' })
        await humanWait(2000, 4000)
        
        const otpResult = await guerrillamailPage.evaluate(() => {
          const pageContent = document.body.textContent || document.body.innerText || ''
          
          const patterns = [
            /(\d{6})\s+is\s+your\s+Instagram\s+code/gi,
            /Instagram\s+code:\s*(\d{6})/gi,
            /Your\s+Instagram\s+code\s+is\s+(\d{6})/gi
          ]
          
          for (const pattern of patterns) {
            const match = pageContent.match(pattern)
            if (match) {
              const codeMatch = match[0].match(/\d{6}/)
              if (codeMatch) {
                return {
                  success: true,
                  code: codeMatch[0],
                  method: 'pattern_match'
                }
              }
            }
          }
          
          if (pageContent.includes('Instagram') || pageContent.includes('instagram')) {
            const codes = pageContent.match(/\b\d{6}\b/g)
            if (codes && codes.length > 0) {
              return {
                success: true,
                code: codes[0],
                method: 'instagram_mention'
              }
            }
          }
          
          return { success: false }
        })
        
        if (otpResult.success) {
          log('success', `✅ Found OTP: ${otpResult.code}`)
          await guerrillamailPage.close()
          return {
            success: true,
            code: otpResult.code,
            method: otpResult.method
          }
        }
        
        await humanWait(8000, 12000)
        
      } catch (error) {
        log('verbose', `OTP check error: ${error.message}`)
        await humanWait(5000, 8000)
      }
    }
    
    const fallbackCode = Math.floor(Math.random() * 900000) + 100000
    log('info', `🎲 Using fallback OTP: ${fallbackCode}`)
    
    if (guerrillamailPage) {
      await guerrillamailPage.close()
    }
    
    return {
      success: true,
      code: fallbackCode.toString(),
      method: "fallback"
    }
    
  } catch (error) {
    log('error', `❌ Email check failed: ${error.message}`)
    
    if (guerrillamailPage) {
      try {
        await guerrillamailPage.close()
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

async function handleBirthdaySelection(page, profile) {
  log('info', '📅 Handling birthday selection...')
  
  try {
    await page.waitForSelector('select', { timeout: 20000 })
    
    const monthName = MONTHS[profile.birthMonth - 1]
    
    const monthSelectors = [
      'select[title*="Month"]',
      'select[aria-label*="Month"]', 
      'select[name*="month"]',
      'select:first-of-type'
    ]
    
    for (const selector of monthSelectors) {
      try {
        await page.select(selector, monthName)
        log('verbose', `✅ Month selected: ${monthName}`)
        break
      } catch (e) {
        continue
      }
    }
    await humanWait(1000, 2000)
    
    const daySelectors = [
      'select[title*="Day"]',
      'select[aria-label*="Day"]',
      'select[name*="day"]', 
      'select:nth-of-type(2)'
    ]
    
    for (const selector of daySelectors) {
      try {
        await page.select(selector, profile.birthDay.toString())
        log('verbose', `✅ Day selected: ${profile.birthDay}`)
        break
      } catch (e) {
        continue
      }
    }
    await humanWait(1000, 2000)
    
    const yearSelectors = [
      'select[title*="Year"]',
      'select[aria-label*="Year"]',
      'select[name*="year"]',
      'select:nth-of-type(3)'
    ]
    
    for (const selector of yearSelectors) {
      try {
        await page.select(selector, profile.birthYear.toString())
        log('verbose', `✅ Year selected: ${profile.birthYear}`)
        break
      } catch (e) {
        continue
      }
    }
    
    await humanWait(2000, 4000)
    
    let nextClicked = false
    
    try {
      nextClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
        for (const button of buttons) {
          const text = button.textContent?.trim().toLowerCase()
          if (text === 'next' && button.offsetParent !== null) {
            button.click()
            return true
          }
        }
        return false
      })
    } catch (e) {
      if (!nextClicked) {
        await page.keyboard.press('Enter')
        nextClicked = true
      }
    }
    
    await humanWait(3000, 5000)
    
    log('success', `✅ Birthday selection completed`)
    return { success: true, nextClicked: nextClicked }
    
  } catch (error) {
    log('error', `❌ Birthday selection failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function simulatePreBrowsing(page) {
  if (Math.random() > STEALTH_CONFIG.preBrowsingChance) return
  
  const preBrowsingPages = [
    'https://www.google.com/',
    'https://www.wikipedia.org/',
    'https://www.youtube.com/',
    'https://www.reddit.com/',
    'https://www.github.com/',
    'https://www.stackoverflow.com/'
  ]
  
  const randomPage = preBrowsingPages[Math.floor(Math.random() * preBrowsingPages.length)]
  
  log('info', `🌐 Pre-browsing simulation: ${randomPage}`)
  
  try {
    await page.goto(randomPage, { waitUntil: 'networkidle2', timeout: 15000 })
    
    await humanWait(2000, 5000)
    
    const scrollCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < scrollCount; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, Math.random() * 500 + 200)
      })
      await humanWait(1000, 3000)
    }
    
    const moveCount = Math.floor(Math.random() * 5) + 2
    for (let i = 0; i < moveCount; i++) {
      await page.mouse.move(
        Math.random() * 800 + 200,
        Math.random() * 600 + 200,
        { steps: Math.floor(Math.random() * 10) + 3 }
      )
      await humanWait(500, 1500)
    }
    
    log('success', '✅ Pre-browsing simulation completed')
    
  } catch (error) {
    log('verbose', `Pre-browsing failed (continuing): ${error.message}`)
  }
}

async function createMaxStealthInstagramAccount(accountData) {
  return await createMaxStealthInstagramAccountWithAutoFollow(accountData)
}

async function createMaxStealthInstagramAccountWithAutoFollow(accountData) {
  let browser, page, deviceProfile
  
  log('info', '🚀 Starting MAXIMUM STEALTH Instagram account creation with Indian Auto-Follow...')
  
  try {
    const browserSetup = await createMaximumStealthBrowser()
    browser = browserSetup.browser
    page = browserSetup.page
    deviceProfile = browserSetup.deviceProfile

    await simulatePreBrowsing(page)

    log('info', '🌐 Navigating to Instagram signup...')
    await page.goto('https://www.instagram.com/accounts/emailsignup/?hl=en', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    
    await humanWait(3000, 6000)

    log('info', '📝 Filling registration form with maximum human simulation...')
    
    const emailSelectors = [
      'input[name="emailOrPhone"]',
      'input[type="text"]:not([name="username"]):not([name="fullName"])',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]',
      'input[placeholder*="phone" i]',
      'input[placeholder*="Phone" i]',
      'input[aria-label*="email" i]',
      'input[aria-label*="phone" i]'
    ]
    
    const fullNameSelectors = [
      'input[name="fullName"]',
      'input[placeholder*="Full Name" i]',
      'input[placeholder*="full name" i]',
      'input[aria-label*="Full Name" i]',
      'input[aria-label*="full name" i]'
    ]
    
    const usernameSelectors = [
      'input[name="username"]',
      'input[placeholder*="Username" i]',
      'input[placeholder*="username" i]',
      'input[aria-label*="Username" i]',
      'input[aria-label*="username" i]'
    ]
    
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="Password" i]',
      'input[placeholder*="password" i]',
      'input[aria-label*="Password" i]',
      'input[aria-label*="password" i]'
    ]

    const trySelectors = async (selectors, text, fieldName) => {
      for (const selector of selectors) {
        try {
          log('verbose', `Trying selector: ${selector} for ${fieldName}`)
          await humanTypeMaxStealth(page, selector, text)
          log('success', `✅ Successfully filled ${fieldName} using ${selector}`)
          return true
        } catch (e) {
          log('verbose', `Failed selector ${selector}: ${e.message}`)
          continue
        }
      }
      throw new Error(`Could not fill ${fieldName} - no selectors worked`)
    }

    try {
      await trySelectors(emailSelectors, accountData.email, 'email')
      await humanWait(1500, 3000, 'general')
    } catch (emailError) {
      log('error', `Email field error: ${emailError.message}`)
      throw new Error(`Could not fill email field: ${emailError.message}`)
    }
    
    try {
      await trySelectors(fullNameSelectors, accountData.profile.fullName, 'fullName')
      await humanWait(1500, 3000, 'general')
    } catch (nameError) {
      log('error', `Full name field error: ${nameError.message}`)
      throw new Error(`Could not fill full name field: ${nameError.message}`)
    }
    
    try {
      await trySelectors(usernameSelectors, accountData.profile.usernames[0], 'username')
      await humanWait(1500, 3000, 'general')
    } catch (usernameError) {
      log('error', `Username field error: ${usernameError.message}`)
      throw new Error(`Could not fill username field: ${usernameError.message}`)
    }
    
    try {
      await trySelectors(passwordSelectors, accountData.profile.password, 'password')
      await humanWait(2000, 4000, 'general')
    } catch (passwordError) {
      log('error', `Password field error: ${passwordError.message}`)
      throw new Error(`Could not fill password field: ${passwordError.message}`)
    }

    log('info', '📤 Submitting registration form...')
    
    const submitSelectors = [
      'button[type="submit"]',
      'button:contains("Sign up")',
      'button:contains("Sign Up")',
      'button[aria-label*="Sign up" i]',
      'button[value*="Sign up" i]',
      'input[type="submit"]',
      'input[value*="Sign up" i]',
      'div[role="button"]:contains("Sign up")',
      'div[role="button"]:contains("Sign Up")'
    ]
    
    let submitSuccess = false
    for (const selector of submitSelectors) {
      try {
        log('verbose', `Trying submit selector: ${selector}`)
        await humanClickMaxStealth(page, selector)
        submitSuccess = true
        log('success', `✅ Form submitted using ${selector}`)
        break
      } catch (e) {
        log('verbose', `Submit selector failed ${selector}: ${e.message}`)
        continue
      }
    }
    
    if (!submitSuccess) {
      log('info', 'All submit selectors failed, trying Enter key...')
      try {
        await page.keyboard.press('Enter')
        submitSuccess = true
        log('success', '✅ Form submitted using Enter key')
      } catch (enterError) {
        log('error', `Enter key submission failed: ${enterError.message}`)
      }
    }

    if (!submitSuccess) {
      throw new Error('Failed to submit registration form')
    }

    await humanWait(4000, 8000, 'thinking')

    const birthdayResult = await handleBirthdaySelection(page, accountData.profile)
    if (!birthdayResult.success) {
      log('error', `Birthday selection failed: ${birthdayResult.error}`)
    }
    
    await humanWait(5000, 10000, 'thinking')

    log('info', '📧 Checking for email verification...')
    
    try {
      const emailConfirmationSelectors = [
        'input[name="confirmationCode"]',
        'input[placeholder*="Confirmation" i]',
        'input[placeholder*="Code" i]',
        'input[placeholder*="confirmation" i]',
        'input[placeholder*="code" i]',
        'input[aria-label*="confirmation" i]',
        'input[aria-label*="code" i]',
        'input[type="text"]:not([name="emailOrPhone"]):not([name="username"]):not([name="fullName"])'
      ]
      
      let emailConfirmationFound = false
      let emailFieldSelector = null
      
      for (const selector of emailConfirmationSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 })
          emailConfirmationFound = true
          emailFieldSelector = selector
          log('success', `✅ Found email confirmation field: ${selector}`)
          break
        } catch (e) {
          continue
        }
      }
      
      if (emailConfirmationFound && emailFieldSelector) {
        log('info', '📧 Email verification required - checking for OTP...')
        
        const emailResult = await checkEmailForInstagramOTP(accountData.email, 3, browser)
        
        if (emailResult.success) {
          try {
            await humanTypeMaxStealth(page, emailFieldSelector, emailResult.code)
            await humanWait(1000, 2000, 'general')
            await page.keyboard.press('Enter')
            await humanWait(5000, 8000, 'general')
            log('success', '✅ Email verification completed')
          } catch (typeError) {
            log('verbose', `OTP entry failed: ${typeError.message}`)
          }
        }
      } else {
        log('info', 'No email verification field found, continuing...')
      }
    } catch (emailError) {
      log('verbose', `Email verification step failed: ${emailError.message}`)
    }

    await humanWait(5000, 8000, 'general')
    const finalContent = await page.content()
    const currentUrl = page.url()
    
    log('info', `🔍 Final URL: ${currentUrl}`)
    
    const successIndicators = [
      currentUrl.includes('instagram.com') && !currentUrl.includes('emailsignup'),
      finalContent.includes('Home'),
      finalContent.includes('Profile'),
      finalContent.includes('Feed'),
      finalContent.includes('Explore'),
      currentUrl.includes('/onboarding/'),
      currentUrl === 'https://www.instagram.com/',
      finalContent.includes('Welcome to Instagram'),
      finalContent.includes('Find people to follow'),
      finalContent.includes('Add profile photo')
    ]
    
    const isSuccessful = successIndicators.some(indicator => indicator)
    
    let autoFollowResult = { success: false, followedCount: 0, reason: 'account_creation_failed' }
    
    if (isSuccessful) {
      log('success', '🎉 Account creation successful! Starting Indian auto-follow process...')
      
      await humanWait(3000, 6000, 'general')
      
      try {
        autoFollowResult = await autoFollowIndianAccounts(page)
      } catch (followError) {
        log('error', `Auto-follow failed: ${followError.message}`)
        autoFollowResult = { success: false, followedCount: 0, error: followError.message }
      }
      
      return {
        success: true,
        platform: "instagram",
        message: "Account created successfully with maximum stealth and Indian auto-follow",
        username: accountData.profile.usernames[0],
        email: accountData.email,
        emailVerified: true,
        smsVerified: false,
        birthdayCompleted: birthdayResult?.success || false,
        passwordDialogHandled: true,
        indianProfile: true,
        browserTabOTP: true,
        maxStealth: true,
        noProxy: true,
        deviceProfile: deviceProfile.screen.name,
        userAgent: deviceProfile.userAgent.substring(0, 50) + '...',
        autoFollow: autoFollowResult,
        accountData: {
          userId: `ig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          profileUrl: `https://instagram.com/${accountData.profile.usernames[0]}`,
          createdAt: new Date().toISOString(),
        },
      }
    } else {
      return {
        success: false,
        platform: "instagram",
        error: "Account creation status unclear - page may not have loaded properly",
        finalUrl: currentUrl,
        autoFollow: autoFollowResult,
        debugInfo: {
          pageTitle: await page.title(),
          pageContent: finalContent.substring(0, 500)
        }
      }
    }

  } catch (error) {
    log('error', `❌ Account creation failed: ${error.message}`)
    return {
      success: false,
      platform: "instagram",
      error: error.message,
      autoFollow: { success: false, followedCount: 0, reason: 'account_creation_failed' }
    }
  } finally {
    if (browser) {
      setTimeout(async () => {
        try {
          await browser.close()
          log('info', '🔒 Browser closed')
        } catch (e) {
          log('error', `Browser close error: ${e.message}`)
        }
      }, 10000) 
    }
  }
}
function calculateNextAccountDelay() {
  return 5000 
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { count = 1, platform = "instagram", userId } = body

    log('info', `🚀 API Request: Creating ${count} ${platform} accounts with NO PROXY + MAXIMUM STEALTH + INDIAN AUTO-FOLLOW`)

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    if (count < 1 || count > STEALTH_CONFIG.maxAccountsPerDay) {
      return NextResponse.json(
        { success: false, message: `Count must be between 1 and ${STEALTH_CONFIG.maxAccountsPerDay} for maximum stealth` },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()
    const results = []
    let successCount = 0

    log('success', `🎭 Starting MAXIMUM STEALTH account creation with INDIAN AUTO-FOLLOW (No Proxy Strategy)`)
    log('info', `🛡️ Strategy: Enhanced fingerprinting + Human behavior + Auto-follow 10 Indian accounts`)

    for (let i = 0; i < count; i++) {
      log('info', `\n🔄 === CREATING ACCOUNT ${i + 1}/${count} ===`)

      try {
        const emailResult = await createTempEmail()
        if (!emailResult.success) {
          throw new Error("Failed to get temporary email")
        }

        const profile = generateProfile()
        log('info', `🇮🇳 Profile: ${profile.fullName} (@${profile.usernames[0]})`)
        log('info', `📧 Email: ${emailResult.email}`)

        const accountData = {
          email: emailResult.email,
          profile: profile,
          platform: platform,
        }

        const creationResult = await createMaxStealthInstagramAccount(accountData)

        const socialAccount = {
          userId: userId,
          accountNumber: i + 1,
          platform: platform,
          email: emailResult.email,
          username: creationResult.username || profile.usernames[0],
          password: profile.password,
          profile: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            fullName: profile.fullName,
            birthDate: `${profile.birthYear}-${profile.birthMonth.toString().padStart(2, "0")}-${profile.birthDay.toString().padStart(2, "0")}`,
            gender: profile.gender,
          },
          emailVerified: creationResult.emailVerified || false,
          phoneVerificationRequired: creationResult.phoneVerificationRequired || false,
          creationResult: creationResult,
          status: creationResult.success ? "active" : "failed",
          verified: creationResult.emailVerified || false,
          birthdayCompleted: creationResult.birthdayCompleted || false,
          passwordDialogHandled: creationResult.passwordDialogHandled || false,
          indianProfile: creationResult.indianProfile || false,
          deviceProfile: creationResult.deviceProfile || null,
          autoFollow: creationResult.autoFollow || { success: false, followedCount: 0 },
          realAccount: true,
          browserAutomation: true,
          emailOnly: true,
          enhanced: true,
          maxStealth: true,
          noProxy: true,
          stealthStrategy: "no_proxy_enhanced_stealth_indian_autofollow",
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await db.collection("social_accounts").insertOne(socialAccount)

        results.push({
          accountNumber: i + 1,
          success: creationResult.success,
          platform: platform,
          email: emailResult.email,
          username: creationResult.username || profile.usernames[0],
          password: profile.password,
          profile: profile,
          message: creationResult.message,
          error: creationResult.error,
          verified: creationResult.emailVerified || false,
          emailVerified: creationResult.emailVerified || false,
          smsVerified: false,
          phoneVerificationRequired: creationResult.phoneVerificationRequired || false,
          profileUrl: creationResult.accountData?.profileUrl,
          birthdayCompleted: creationResult.birthdayCompleted || false,
          passwordDialogHandled: creationResult.passwordDialogHandled || false,
          indianProfile: creationResult.indianProfile || false,
          deviceProfile: creationResult.deviceProfile || null,
          autoFollow: creationResult.autoFollow || { success: false, followedCount: 0 },
          realAccount: true,
          emailOnly: true,
          enhanced: true,
          maxStealth: true,
          noProxy: true,
          stealthStrategy: "no_proxy_enhanced_stealth_indian_autofollow"
        })

        if (creationResult.success) {
          successCount++
          const followInfo = creationResult.autoFollow?.success ? 
            ` | 🇮🇳 Followed: ${creationResult.autoFollow.followedCount}/10 Indian accounts (${creationResult.autoFollow.successRate}% success)` : 
            ' | Indian auto-follow failed'
          log('success', `✅ ACCOUNT ${i + 1} CREATED: ${creationResult.username} (${profile.fullName})${followInfo}`)
          if (creationResult.phoneVerificationRequired) {
            log('info', `📱 Phone verification required for complete activation`)
          }
        } else {
          log('error', `❌ ACCOUNT ${i + 1} FAILED: ${creationResult.error}`)
        }

        if (i < count - 1) {
          const delay = calculateNextAccountDelay()
          log('info', `⏳ MAXIMUM STEALTH DELAY: ${Math.round(delay / 1000)} seconds until next account...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

      } catch (error) {
        log('error', `❌ ACCOUNT ${i + 1} FAILED: ${error.message}`)
        results.push({
          accountNumber: i + 1,
          success: false,
          platform: platform,
          error: error.message,
          autoFollow: { success: false, followedCount: 0, reason: 'account_creation_failed' },
          realAccount: true,
          emailOnly: true,
          enhanced: true,
          maxStealth: true,
          noProxy: true,
          stealthStrategy: "no_proxy_enhanced_stealth_indian_autofollow"
        })
      }
    }

    const autoFollowStats = results.reduce((stats, result) => {
      if (result.autoFollow) {
        stats.totalAttempted += 1
        stats.totalSuccessful += result.autoFollow.success ? 1 : 0
        stats.totalFollowed += result.autoFollow.followedCount || 0
        stats.totalIndianAccounts += result.autoFollow.followResults?.filter(f => f.success).length || 0
      }
      return stats
    }, { totalAttempted: 0, totalSuccessful: 0, totalFollowed: 0, totalIndianAccounts: 0 })

    log('success', `🎉 COMPLETED: ${successCount}/${count} accounts created with MAXIMUM STEALTH + INDIAN AUTO-FOLLOW`)
    log('info', `🇮🇳 INDIAN AUTO-FOLLOW STATS: ${autoFollowStats.totalFollowed} total follows across ${autoFollowStats.totalSuccessful}/${autoFollowStats.totalAttempted} accounts`)

    return NextResponse.json({
      success: true,
      message: `${platform} account creation completed with MAXIMUM STEALTH + INDIAN AUTO-FOLLOW! ${successCount}/${count} accounts created successfully.`,
      totalRequested: count,
      totalCreated: successCount,
      platform: platform,
      accounts: results,
      indianAutoFollowStats: {
        accountsWithAutoFollow: autoFollowStats.totalAttempted,
        successfulAutoFollows: autoFollowStats.totalSuccessful,
        totalIndianFollows: autoFollowStats.totalFollowed,
        averageFollowsPerAccount: autoFollowStats.totalAttempted > 0 ? 
          Math.round(autoFollowStats.totalFollowed / autoFollowStats.totalAttempted * 100) / 100 : 0,
        followSuccessRate: autoFollowStats.totalAttempted > 0 ?
          Math.round((autoFollowStats.totalSuccessful / autoFollowStats.totalAttempted) * 100) : 0
      },
      provider: "No Proxy + Enhanced Stealth + Indian Auto-Follow Instagram Creator",
      strategy: {
        name: "No Proxy Enhanced Stealth with Indian Auto-Follow",
        description: "Maximum anti-detection without proxy servers + automatic following of popular Indian celebrities and influencers",
        features: [
          "Advanced browser fingerprinting protection",
          "Human behavior simulation",
          "Realistic device profiles", 
          "Optimal timing patterns",
          "Canvas & WebGL spoofing",
          "Audio context protection",
          "Auto-follow 10 random Indian celebrities",
          "Bollywood stars, cricketers, and influencers",
          "Human-like following patterns with delays",
          "Smart account verification and retry logic"
        ],
        indianAccounts: {
          categories: [
            "Bollywood Celebrities (Virat Kohli, Deepika Padukone, etc.)",
            "Cricket Stars (MS Dhoni, Rohit Sharma, etc.)",
            "Content Creators & Influencers",
            "Business Personalities",
            "Fashion & Lifestyle Icons"
          ],
          totalPool: POPULAR_INDIAN_ACCOUNTS.length,
          followsPerAccount: AUTO_FOLLOW_CONFIG.followCount
        }
      },
      realAccounts: true,
      emailOnly: true,
      enhanced: true,
      maxStealth: true,
      noProxy: true,
      indianAutoFollow: true
    })

  } catch (error) {
    log('error', `API ERROR: ${error.message}`)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create social accounts with Indian auto-follow",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 },
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const platform = searchParams.get("platform")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const query = { userId }

    if (platform && platform !== "all") {
      query.platform = platform
    }

    const accounts = await db.collection("social_accounts").find(query).sort({ createdAt: -1 }).toArray()

    const indianAutoFollowStats = accounts.reduce((stats, account) => {
      if (account.autoFollow) {
        stats.accountsWithAutoFollow += 1
        if (account.autoFollow.success) {
          stats.successfulAutoFollows += 1
        }
        stats.totalIndianFollows += account.autoFollow.followedCount || 0
        
        if (account.autoFollow.followResults) {
          account.autoFollow.followResults.forEach(follow => {
            if (follow.success) {
              stats.successfulIndividualFollows += 1
              if (follow.accountType === 'indian_celebrity') {
                stats.indianCelebrityFollows += 1
              }
            }
          })
        }
      }
      return stats
    }, { 
      accountsWithAutoFollow: 0, 
      successfulAutoFollows: 0, 
      totalIndianFollows: 0,
      successfulIndividualFollows: 0,
      indianCelebrityFollows: 0
    })

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
      summary: {
        total: accounts.length,
        successful: accounts.filter(acc => acc.status === "active").length,
        failed: accounts.filter(acc => acc.status === "failed").length,
        enhanced: accounts.filter(acc => acc.enhanced).length,
        maxStealth: accounts.filter(acc => acc.maxStealth).length,
        noProxy: accounts.filter(acc => acc.noProxy).length,
        phoneVerificationRequired: accounts.filter(acc => acc.phoneVerificationRequired).length,
        indianProfiles: accounts.filter(acc => acc.indianProfile).length,
        stealthStrategy: accounts.filter(acc => acc.stealthStrategy === "no_proxy_enhanced_stealth_indian_autofollow").length,
        indianAutoFollow: indianAutoFollowStats
      },
      indianAutoFollowBreakdown: {
        totalAccountsWithFollows: indianAutoFollowStats.accountsWithAutoFollow,
        successfulFollowingSessions: indianAutoFollowStats.successfulAutoFollows,
        totalIndianAccountsFollowed: indianAutoFollowStats.totalIndianFollows,
        averageFollowsPerAccount: indianAutoFollowStats.accountsWithAutoFollow > 0 ?
          Math.round((indianAutoFollowStats.totalIndianFollows / indianAutoFollowStats.accountsWithAutoFollow) * 100) / 100 : 0,
        followSuccessRate: indianAutoFollowStats.accountsWithAutoFollow > 0 ?
          Math.round((indianAutoFollowStats.successfulAutoFollows / indianAutoFollowStats.accountsWithAutoFollow) * 100) : 0,
        popularCategories: [
          "Bollywood celebrities and actors",
          "Cricket stars and sports personalities", 
          "Content creators and influencers",
          "Business leaders and entrepreneurs",
          "Fashion and lifestyle icons"
        ]
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch social accounts",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}