// Hindi-English mixed comments (fallback if AI fails)
const generateHindiEnglishComment = (sentiment: string, index: number) => {
  const comments = {
    positive: [
      "Aap ki post bohot achi hai! Very nice 👍",
      "Waah bhai! Amazing content 🔥", 
      "Bohot khoob! Keep it up 💯",
      "Ekdum zabardast! Love it ❤️",
      "Bahut sundar! Excellent work 👌",
      "Maja aa gaya! Great content 🙌",
      "Sach mein bohot badhiya! Awesome 🔥",
      "Kamaal ka post hai! Perfect 💫",
      "Outstanding bro! Keep growing 📈",
      "Superb content! Aur banao aise posts 🚀"
    ],
    negative: [
      "Thoda aur mehnat karna chahiye was better expected",
      "Content improve kar sakte hain I think 🤔",
      "Acha hai but thoda boring laga honestly",
      "Expected more from you yaar 😐",
      "Average content hai could be better",
      "Thoda aur creativity chahiye maybe 💭",
      "Previous posts zyada ache the tbh",
      "Content quality maintain karo please 📉",
      "Thoda disappointing laga sorry to say",
      "Aur interesting banao content ko 🤷‍♂️"
    ],
    neutral: [
      "Nice post! Thanks for sharing 👍",
      "Interesting content! Informative hai 📚",
      "Good information! Helpful content 💡",
      "Noted! Thanks for the update 📝",
      "Acha hai! Keep sharing such posts 👌",
      "Informative post! Useful content 📖",
      "Good to know! Thanks buddy 🙏",
      "Helpful information! Appreciated 💯",
      "Nice share! Educational content 🎓",
      "Valuable content! Thanks for posting 🔄"
    ]
  };

  const sentimentComments = comments[sentiment as keyof typeof comments] || comments.positive;
  return sentimentComments[index % sentimentComments.length];
};

import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

// Fixed Gemini function for your Instagram automation
async function generateGeminiComment(postDescription: string, sentiment: string, accountIndex: number) {
  const GEMINI_API_KEY = 'AIzaSyDXYs8TsJP4g8yF62tVHzHeeGtYDiGXNX4';
  
  if (!GEMINI_API_KEY) {
    console.log('⚠️ No Gemini API key found, using fallback comments');
    return generateHindiEnglishComment(sentiment, accountIndex);
  }

  try {
    const prompt = createEnhancedPrompt(postDescription, sentiment, accountIndex);
    
    console.log(`🤖 Calling Gemini 1.5 Flash for account ${accountIndex + 1}...`);
    
    // ✅ FIXED: Use gemini-1.5-flash instead of gemini-pro
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 100,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ HTTP Error ${response.status}:`, data);
      throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
    }
    
    // ✅ FIXED: Updated response parsing for new API structure
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      let comment = data.candidates[0].content.parts[0].text;
      
      if (!comment || typeof comment !== 'string') {
        throw new Error('Generated comment is null or invalid');
      }
      
      // Clean up the response
      comment = comment.trim()
        .replace(/"/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Ensure it's not too long
      if (comment.length > 100) {
        comment = comment.substring(0, 97) + "...";
      }
      
      // Validate comment
      if (comment.length < 5) {
        throw new Error('Generated comment too short');
      }
      
      console.log(`✅ AI Generated comment: "${comment}"`);
      console.log(`📊 Token usage: ${data.usageMetadata?.totalTokenCount || 'unknown'} tokens`);
      
      return comment;
    } else {
      console.error('❌ Invalid response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }
    
  } catch (error: any) {
    console.error('❌ Gemini API error:', error);
    console.log('🔄 Using fallback comment...');
    return generateHindiEnglishComment(sentiment, accountIndex);
  }
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0'
]

const SCREEN_PROFILES = [
  { width: 1920, height: 1080, mobile: false, deviceType: 'desktop', name: 'Full HD' },
  { width: 1366, height: 768, mobile: false, deviceType: 'desktop', name: 'HD Laptop' },
  { width: 1440, height: 900, mobile: false, deviceType: 'desktop', name: 'MacBook Pro' },
  { width: 1536, height: 864, mobile: false, deviceType: 'desktop', name: 'Surface Laptop' },
  { width: 1600, height: 900, mobile: false, deviceType: 'desktop', name: 'HD+' },
  { width: 1280, height: 720, mobile: false, deviceType: 'desktop', name: 'HD' },
]

const OS_PROFILES = [
  {
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    languages: ['en-US', 'en'],
    timezone: 'America/New_York',
  },
  {
    platform: 'MacIntel', 
    oscpu: 'Intel Mac OS X 10_15_7',
    languages: ['en-US', 'en'],
    timezone: 'America/New_York',
  },
  {
    platform: 'Linux x86_64',
    oscpu: 'Linux x86_64',
    languages: ['en-US', 'en'],
    timezone: 'America/New_York',
  }
]

function log(level: string, message: string, data: any = null) {
  const timestamp = new Date().toLocaleTimeString()
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`)
  if (data) console.log(`[${timestamp}] [DATA]`, data)
}

const humanWait = (minMs = 2000, maxMs = 5000) => {
  const patterns = [
    () => minMs + Math.random() * (maxMs - minMs), 
    () => minMs + Math.random() * (maxMs - minMs) * 1.5, // Slower (thinking)
    () => minMs * 0.7 + Math.random() * (maxMs - minMs) * 0.8, // Faster (confident)
    () => minMs + Math.random() * (maxMs - minMs) + Math.random() * 2000 // Distracted
  ]
  
  const pattern = patterns[Math.floor(Math.random() * patterns.length)]
  const delay = Math.max(1000, pattern())
  
  log('verbose', `Human wait: ${Math.round(delay)}ms`)
  return new Promise(resolve => setTimeout(resolve, delay))
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
  log('info', '🎭 Creating MAXIMUM stealth browser for Instagram automation...')
  
  const deviceProfile = generateDeviceProfile()
  
  const browser = await puppeteer.launch({
    headless: 'shell',
    args: [
      // Core flags
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

  // COMPREHENSIVE stealth injection using your system
  await page.evaluateOnNewDocument((profile: any) => {
    // === COMPLETE AUTOMATION TRACE REMOVAL ===
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    
    // Remove ALL possible automation indicators
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
        delete (window as any)[prop]
        delete (document as any)[prop]
        delete (window.document as any)[prop]
      } catch (e) {}
    })

    // Mock chrome runtime
    ;(window as any).chrome = {
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

    // === HARDWARE SPOOFING ===
    Object.defineProperty(navigator, 'platform', { 
      get: () => profile.os.platform
    })
    
    Object.defineProperty(navigator, 'hardwareConcurrency', { 
      get: () => profile.hardware.cores
    })
    
    Object.defineProperty(navigator, 'deviceMemory', { 
      get: () => profile.hardware.memory
    })

    // === LANGUAGE SPOOFING ===
    Object.defineProperty(navigator, 'languages', { 
      get: () => profile.os.languages
    })
    
    Object.defineProperty(navigator, 'language', { 
      get: () => profile.os.languages[0]
    })

    // === WebGL SPOOFING ===
    const getParameter = WebGLRenderingContext.prototype.getParameter
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) return profile.webgl.vendor // UNMASKED_VENDOR_WEBGL
      if (parameter === 37446) return profile.webgl.renderer // UNMASKED_RENDERER_WEBGL
      if (parameter === 7936) return `WebGL ${Math.floor(Math.random() * 3) + 1}.0` // VERSION
      if (parameter === 7937) return `OpenGL ES ${Math.floor(Math.random() * 3) + 2}.0` // SHADING_LANGUAGE_VERSION
      return getParameter.apply(this, arguments)
    }

    // === CANVAS SPOOFING ===
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
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

    // === SCREEN SPOOFING ===
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

    // === TIMEZONE SPOOFING ===
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

  }, deviceProfile)

  // Set user agent
  await page.setUserAgent(deviceProfile.userAgent)
  
  // Enhanced headers with realistic variations
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
    'sec-fetch-user': '?1'
  }
  
  await page.setExtraHTTPHeaders(headers)

  // Set viewport
  await page.setViewport(deviceProfile.viewport)

  log('success', '✅ Maximum stealth browser created with realistic device profile')
  
  return { browser, page, deviceProfile }
}

// MAXIMUM human-like typing using your system
async function humanTypeMaxStealth(page: any, selector: string, text: string) {
  log('detailed', `⌨️ Human typing: "${text}" into ${selector}`)
  
  try {
    const element = await page.waitForSelector(selector, { timeout: 20000 })
    
    // Random pre-typing mouse movement
    const box = await element.boundingBox()
    if (box) {
      // Approach the element naturally
      await page.mouse.move(
        box.x - 50 + Math.random() * 100,
        box.y - 50 + Math.random() * 100,
        { steps: 3 + Math.floor(Math.random() * 7) }
      )
      await humanWait(200, 600)
      
      // Move to element
      await page.mouse.move(
        box.x + box.width * (0.3 + Math.random() * 0.4),
        box.y + box.height * (0.3 + Math.random() * 0.4),
        { steps: 2 + Math.floor(Math.random() * 5) }
      )
    }
    
    await element.click()
    await humanWait(400, 1000)
    
    // Clear field with realistic method
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await humanWait(100, 300)
    await page.keyboard.press('Backspace')
    
    await humanWait(200, 500)
    
    // Type with MAXIMUM human realism
    const words = text.split(' ')
    
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const word = words[wordIndex]
      
      for (let charIndex = 0; charIndex < word.length; charIndex++) {
        const char = word[charIndex]
        
        // Variable typing speed based on character complexity
        let baseDelay = 120
        if (char.match(/[aeiou]/)) baseDelay = 100 // Vowels are faster
        if (char.match(/[qwerty]/)) baseDelay = 110 // Home row is faster
        if (char.match(/[zxcv]/)) baseDelay = 140 // Bottom row is slower
        if (char.match(/[0-9]/)) baseDelay = 150 // Numbers are slower
        if (char.match(/[!@#$%^&*()]/)) baseDelay = 180 // Special chars are slower
        
        const typeDelay = baseDelay + Math.random() * 100
        
        // Occasional typos (3% chance)
        if (Math.random() < 0.03 && charIndex > 0) {
          const wrongChars = 'abcdefghijklmnopqrstuvwxyz'
          const wrongChar = wrongChars[Math.floor(Math.random() * wrongChars.length)]
          
          await element.type(wrongChar, { delay: typeDelay })
          await humanWait(150, 400) // Realize mistake
          await page.keyboard.press('Backspace')
          await humanWait(200, 500) // Correct it
          await element.type(char, { delay: typeDelay + 50 })
        } else {
          await element.type(char, { delay: typeDelay })
        }
        
        // Thinking moments (20% chance)
        if (Math.random() < 0.2) {
          await humanWait(300, 1500)
        }
        
        // Micro-pauses within words (15% chance)
        if (Math.random() < 0.15 && charIndex < word.length - 1) {
          await humanWait(100, 400)
        }
      }
      
      // Space between words
      if (wordIndex < words.length - 1) {
        await element.type(' ', { delay: 120 })
        await humanWait(200, 600) // Longer pause between words
      }
      
      // Longer thinking pauses between words (30% chance)
      if (Math.random() < 0.3 && wordIndex < words.length - 1) {
        await humanWait(500, 2000)
      }
    }
    
    await humanWait(300, 800)
    log('verbose', `✅ Successfully typed: "${text}"`)
    
  } catch (error: any) {
    log('error', `❌ Typing failed: ${error.message}`)
    throw error
  }
}

const elementExists = async (page: any, selector: string, timeout = 5000) => {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
};

// AI-powered Hindi-English comment generation using direct Gemini API
const generateAIComment = async (postDescription: string, sentiment: string, accountIndex: number) => {
  try {
    // Use direct Gemini API call
    const comment = await generateGeminiComment(postDescription, sentiment, accountIndex);
    return comment;
  } catch (error) {
    log('error', `AI comment generation failed: ${error}`)
    
    // Fallback to predefined comments if AI fails
    return generateHindiEnglishComment(sentiment, accountIndex);
  }
};

// Enhanced Gemini prompts for better Hindi-English comments
const createEnhancedPrompt = (postDescription: string, sentiment: string, accountIndex: number) => {
  const basePrompts = {
    positive: `Generate a positive, encouraging comment in Hindi-English mix (Hinglish) for this Instagram post: "${postDescription}". 
    Requirements:
    - 5-15 words maximum
    - Mix Hindi and English naturally (like: "Aap ki post bohot achi hai! Very nice")
    - Sound like a real Indian person commenting
    - Include appropriate emojis (1-2 maximum)
    - Be supportive and enthusiastic
    - Make it unique and relevant to the post content
    - Reference the post content naturally
    - Make it unique for account ${accountIndex + 1}
    
    Examples based on content: 
    - For photos: "Waah bhai! Amazing shot 🔥", "Bohot sundar! Keep posting 💯"
    - For quotes: "Bilkul sahi baat! Inspiring words ❤️", "True hai yaar! Thanks for sharing 🙏"
    - For food: "Dekh kar bhookh lag gayi! Looks delicious 😋", "Kahan se hai yeh? Amazing food 🤤"`,
    
    negative: `Generate a mildly critical but constructive comment in Hindi-English mix (Hinglish) for this Instagram post: "${postDescription}". 
    Requirements:
    - 5-15 words maximum
    - Mix Hindi and English naturally
    - Sound like a real Indian person commenting
    - Be constructive, not harsh or offensive
    - Include appropriate emojis if needed (1 maximum)
    - Make it unique and relevant to the post content
    - Reference the post content naturally
    - Make it unique for account ${accountIndex + 1}
    
    Examples based on content:
    - For photos: "Thoda aur clear hota toh better 🤔", "Angle change kar sakte the maybe"
    - For content: "Expected more detail yaar 😐", "Thoda short laga, elaborate karo"
    - General: "Good attempt but improvement possible", "Next time better hoga surely"`,
    
    neutral: `Generate a neutral, informative comment in Hindi-English mix (Hinglish) for this Instagram post: "${postDescription}". 
    Requirements:
    - 5-15 words maximum
    - Mix Hindi and English naturally
    - Sound like a real Indian person commenting
    - Be informative or acknowledging
    - Include appropriate emojis (1 maximum)
    - Make it unique and relevant to the post content
    - Reference the post content naturally
    - Make it unique for account ${accountIndex + 1}
    
    Examples based on content:
    - For information: "Nice information! Thanks for sharing 👍", "Noted bhai! Helpful content 📚"
    - For photos: "Good capture! Nice timing", "Interesting perspective! Well done"
    - General: "Thanks for posting yaar", "Good to know! Appreciated 💯"`
  };
  
  return basePrompts[sentiment as keyof typeof basePrompts] || basePrompts.positive;
};

// Login to Instagram using your maximum stealth system
const loginToInstagram = async (page: any, account: any) => {
  try {
    log('info', `Logging in with account: ${account.username}`)
    
    await page.goto("https://www.instagram.com/accounts/login/", {
      waitUntil: "networkidle2",
    });

    await humanWait(2000, 4000);

    // Username field
    if (!(await elementExists(page, 'input[name="username"]'))) {
      return { status: false, message: "Username field not found" };
    }

    log('info', 'Typing username...')
    await page.click('input[name="username"]');
    await humanTypeMaxStealth(page, 'input[name="username"]', account.username);
    await humanWait(1000, 2000);

    // Password field
    if (!(await elementExists(page, 'input[name="password"]'))) {
      return { status: false, message: "Password field not found" };
    }

    log('info', 'Typing password...')
    await page.click('input[name="password"]');
    await humanTypeMaxStealth(page, 'input[name="password"]', account.password);
    await humanWait(1500, 3000);

    // Login button
    if (!(await elementExists(page, 'button[type="submit"]'))) {
      return { status: false, message: "Login button not found" };
    }

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }),
    ]);

    // Handle "Not Now" buttons using your system
    await humanWait(2000, 3000);
    const buttons = await page.$$("button");
    for (const btn of buttons) {
      try {
        const text = await page.evaluate((el: any) => el.textContent, btn);
        if (text && (text.includes("Not Now") || text.includes("Save Info"))) {
          await btn.click();
          await humanWait(500, 1000);
          break;
        }
      } catch (err) {
        log('verbose', 'Error clicking button:', err)
      }
    }

    // Final check: is home page or some known element visible?
    if (!(await elementExists(page, '[aria-label="Home"]', 10000))) {
      return {
        status: false,
        message: "Login failed or did not reach home page",
      };
    }

    log('success', `✅ Logged in successfully: ${account.username}`)
    return { status: true, message: "Login successful" };
  } catch (error: any) {
    return { status: false, message: `Login error: ${error.message}` };
  }
};

// Navigate to post using your system
const navigateToPost = async (page: any, url: string, timeout = 10000) => {
  try {
    log('info', `Navigating to post: ${url}`)
    await page.goto(url, { waitUntil: "networkidle2", timeout });

    // Wait after navigation with a bit of randomness
    await humanWait(3000, 6000);

    return { status: true, message: "Post loaded successfully" };
  } catch (err: any) {
    return { status: false, message: `Navigation error: ${err.message}` };
  }
};

// Comment on post using your human-like system
const commentOnPost = async (page: any, commentText: string, timeout = 10000) => {
  try {
    if (!commentText) {
      return { status: false, message: "No comment text provided" };
    }

    log('info', `Preparing to comment: ${commentText}`)

    // Wait for textarea using your system
    if (!(await elementExists(page, "textarea"))) {
      return { status: false, message: "Textarea field not found" };
    }

    await page.waitForSelector("textarea", { timeout });

    // Focus and click the comment box
    await page.click("textarea");
    await humanWait(1000, 2000);
    await humanTypeMaxStealth(page, "textarea", commentText);

    await humanWait(1000, 2000);

    // Press enter to submit comment
    await page.keyboard.press("Enter");

    log('success', `✅ Comment posted: ${commentText}`)
    return { status: true, message: "Comment posted successfully" };
  } catch (err: any) {
    log('error', `❌ Comment failed: ${err.message}`)
    return { status: false, message: `Comment error: ${err.message}` };
  }
};

// Get random active accounts from your database
const getRandomActiveAccounts = async (accountCount = 3) => {
  try {
    const { db } = await connectToDatabase();
    
    // Get active Instagram accounts, prioritizing least recently used
    const accounts = await db.collection("social_accounts")
      .aggregate([
        { 
          $match: { 
            platform: "instagram",
            status: "active",
            // Only use accounts that haven't been used in the last hour
            $or: [
              { lastUsed: { $exists: false } },
              { lastUsed: { $lt: new Date(Date.now() - 60 * 60 * 1000) } }
            ]
          }
        },
        { $sample: { size: accountCount } } // Random selection
      ])
      .toArray();

    if (accounts.length === 0) {
      // If no accounts meet criteria, get any active accounts
      const fallbackAccounts = await db.collection("social_accounts")
        .aggregate([
          { 
            $match: { 
              platform: "instagram",
              status: "active"
            }
          },
          { $sample: { size: accountCount } }
        ])
        .toArray();
      
      return fallbackAccounts;
    }

    return accounts;
  } catch (error: any) {
    log('error', `Failed to get accounts: ${error.message}`)
    throw new Error("Failed to retrieve accounts from database");
  }
};

// Update account status in database
const updateAccountStatus = async (username: string, status: string, reason?: string) => {
  try {
    const { db } = await connectToDatabase();
    const update: any = { 
      status,
      updatedAt: new Date()
    };
    
    if (reason) {
      update.statusReason = reason;
    }
    
    await db.collection("social_accounts").updateOne(
      { username },
      { $set: update }
    );
  } catch (error: any) {
    log('error', `Failed to update account status: ${error.message}`)
  }
};

// Calculate optimal timing between accounts for commenting (2-3 seconds)
function calculateCommentingDelay() {
  // For commenting, use much shorter delays (2-3 seconds as requested)
  const baseDelay = 2000 // 2 seconds minimum
  const maxDelay = 3000  // 3 seconds maximum
  
  const delay = baseDelay + Math.random() * (maxDelay - baseDelay)
  
  log('info', `⏰ Next comment in ${Math.round(delay / 1000)} seconds`)
  
  return delay
}

// Main Instagram automation function using your maximum stealth system
const automateInstagramComments = async (
  postUrl: string, 
  postContent: string, 
  sentiment: string, 
  requestedComments = 3
) => {
  const results: any[] = [];
  
  log('info', `🚀 Starting Instagram automation for ${requestedComments} comments with MAXIMUM STEALTH`)

  // Get all available accounts from your database
  const availableAccounts = await getRandomActiveAccounts(50); // Get up to 50 accounts to choose from
  
  if (availableAccounts.length === 0) {
    throw new Error("No active Instagram accounts found in database");
  }

  // Calculate distribution: how many comments per account
  const commentsPerAccount = Math.ceil(requestedComments / availableAccounts.length);
  const accountsNeeded = Math.min(availableAccounts.length, requestedComments);
  
  log('success', `🎭 Found ${availableAccounts.length} active accounts. Using ${accountsNeeded} accounts.`)
  log('info', `📊 Distribution: ${requestedComments} comments across ${accountsNeeded} accounts (${commentsPerAccount} comments per account)`)

  // Use only the accounts we need
  const accountsToUse = availableAccounts.slice(0, accountsNeeded);
  
  let totalCommentsPosted = 0;

  for (let i = 0; i < accountsToUse.length && totalCommentsPosted < requestedComments; i++) {
    const account = accountsToUse[i];
    let browser = null;
    
    // Calculate how many comments this account should post
    const remainingComments = requestedComments - totalCommentsPosted;
    const commentsForThisAccount = Math.min(commentsPerAccount, remainingComments);
    
    try {
      log('info', `\n🔄 === PROCESSING ACCOUNT ${i + 1}/${accountsToUse.length} ===`)
      log('info', `👤 Account: ${account.username} (${account.profile?.fullName || 'Unknown'})`)
      log('info', `📝 Will post ${commentsForThisAccount} comment(s) with this account`)

      // Create maximum stealth browser for each account using your system
      const browserSetup = await createMaximumStealthBrowser();
      browser = browserSetup.browser;
      const page = browserSetup.page;
      const deviceProfile = browserSetup.deviceProfile;

      // Login with current account using your stealth system
      const loginResult = await loginToInstagram(page, account);
      if (!loginResult.status) {
        results.push({
          account: account.username,
          status: "failed",
          message: `Login failed: ${loginResult.message}`,
          comment: null,
          commentsRequested: commentsForThisAccount,
          commentsPosted: 0
        });
        continue;
      }

      // Navigate to post using your system
      const navResult = await navigateToPost(page, postUrl);
      if (!navResult.status) {
        results.push({
          account: account.username,
          status: "failed",
          message: `Navigation failed: ${navResult.message}`,
          comment: null,
          commentsRequested: commentsForThisAccount,
          commentsPosted: 0
        });
        continue;
      }

      // Post multiple comments with this account if needed
      let accountCommentsPosted = 0;
      const accountComments = [];
      
      for (let commentIndex = 0; commentIndex < commentsForThisAccount; commentIndex++) {
        // Generate AI-powered Hindi-English comment for each comment
        log('info', `🤖 Generating AI comment ${commentIndex + 1}/${commentsForThisAccount} for account ${account.username}...`)
        const commentText = await generateAIComment(postContent || "Instagram post", sentiment, totalCommentsPosted + commentIndex);
        log('info', `💬 Generated comment: "${commentText}"`)

        // Comment on post using your human-like system
        const commentResult = await commentOnPost(page, commentText);
        
        if (commentResult.status) {
          accountCommentsPosted++;
          totalCommentsPosted++;
          accountComments.push(commentText);
          log('success', `✅ COMMENT ${commentIndex + 1} SUCCESS: ${account.username} - "${commentText}"`)
          
          // Update account usage
          const { db } = await connectToDatabase();
          await db.collection("social_accounts").updateOne(
            { username: account.username },
            { 
              $set: { lastUsed: new Date() },
              $inc: { commentCount: 1 }
            }
          );
        } else {
          log('error', `❌ COMMENT ${commentIndex + 1} FAILED: ${account.username} - ${commentResult.message}`)
        }

        // Short delay between comments from same account (1-2 seconds)
        if (commentIndex < commentsForThisAccount - 1) {
          const delay = 1000 + Math.random() * 1000; // 1-2 seconds
          log('info', `⏳ Short delay: ${Math.round(delay / 1000)} seconds until next comment...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
      
      results.push({
        account: account.username,
        accountId: account._id,
        status: accountCommentsPosted > 0 ? "success" : "failed",
        message: accountCommentsPosted > 0 ? `Posted ${accountCommentsPosted} comments successfully` : "Failed to post any comments",
        comments: accountComments,
        commentsRequested: commentsForThisAccount,
        commentsPosted: accountCommentsPosted,
        deviceProfile: deviceProfile.screen.name,
        userAgent: deviceProfile.userAgent.substring(0, 50) + '...',
        maxStealth: true
      });

      // Delay between accounts (2-3 seconds)
      if (i < accountsToUse.length - 1 && totalCommentsPosted < requestedComments) {
        const delay = calculateCommentingDelay();
        log('info', `⏳ ACCOUNT DELAY: ${Math.round(delay / 1000)} seconds until next account...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }

    } catch (error: any) {
      log('error', `❌ Error with account ${account.username}: ${error.message}`)
      results.push({
        account: account.username,
        status: "failed",
        message: `Automation error: ${error.message}`,
        comments: [],
        commentsRequested: commentsForThisAccount,
        commentsPosted: 0
      });
      
      // Update account status if it seems to be banned/blocked
      if (error.message.includes("challenge") || error.message.includes("suspended")) {
        await updateAccountStatus(account.username, "banned", error.message);
      }
    } finally {
      if (browser) {
        // Keep browser open for a bit to avoid suspicion, then close
        setTimeout(async () => {
          try {
            await browser.close();
            log('info', '🔒 Browser closed')
          } catch (e) {}
        }, 3000) // 3 seconds delay before closing
      }
    }
  }

  // Log results to database using your system
  const { db } = await connectToDatabase();
  const totalSuccessfulComments = results.reduce((sum, r) => sum + (r.commentsPosted || 0), 0);
  const totalFailedComments = requestedComments - totalSuccessfulComments;
  
  await db.collection("comment_automation_logs").insertOne({
    postUrl,
    postContent,
    sentiment,
    requestedComments,
    accountCount: accountsToUse.length,
    results,
    timestamp: new Date(),
    successCount: totalSuccessfulComments,
    failureCount: totalFailedComments,
    accountsUsed: results.filter(r => r.status === "success").length,
    strategy: "maximum_stealth_hindi_english_comments_distributed",
    maxStealth: true,
    realAccounts: true,
    enhanced: true,
    distributed: true
  });

  log('success', `🎉 AUTOMATION COMPLETED: ${totalSuccessfulComments}/${requestedComments} comments posted across ${accountsToUse.length} accounts with MAXIMUM STEALTH`)
  return results;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postUrl, postContent, commentStyle, sentiment, platforms, accountCount } = body

    if (!postUrl || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: "Post URL and platforms are required" }, { status: 400 })
    }

    let detectedPlatform = "instagram"
    if (postUrl.includes("facebook.com")) detectedPlatform = "facebook"
    else if (postUrl.includes("twitter.com") || postUrl.includes("x.com")) detectedPlatform = "twitter"
    else if (postUrl.includes("youtube.com")) detectedPlatform = "youtube"
    else if (postUrl.includes("instagram.com")) detectedPlatform = "instagram"

    // Connect to database
    const { db } = await connectToDatabase()

    // Check if Instagram is selected - use your created accounts with maximum stealth
    if (platforms.includes("instagram") && postUrl.includes("instagram.com")) {
      log('info', '🎭 Instagram automation requested - using MAXIMUM STEALTH system')
      
      // Check available Instagram accounts from social_accounts collection
      const availableInstagramAccounts = await db
        .collection("social_accounts")
        .countDocuments({ 
          platform: "instagram",
          status: "active"
        })

      if (availableInstagramAccounts < (accountCount || 3)) {
        return NextResponse.json({ 
          error: `Only ${availableInstagramAccounts} active Instagram accounts available. Requested: ${accountCount || 3}` 
        }, { status: 400 })
      }

      // Generate preview comment using AI with post description
      log('info', `🤖 Generating AI preview comment...`)
      const sampleComment = await generateAIComment(postContent || "Instagram post", sentiment || "positive", 0);
      log('info', `💬 Sample comment: "${sampleComment}"`)

      log('success', `🚀 Starting Instagram automation with ${accountCount || 3} accounts`)
      log('info', `📝 Post description: "${postContent || 'No description provided'}"`)
      log('info', `😊 Sentiment: ${sentiment || 'positive'}`)

      // Start Instagram automation in background using your maximum stealth system
      automateInstagramComments(postUrl, postContent, sentiment || "positive", accountCount || 3)
        .then(results => {
          log('success', `🎉 Instagram automation completed: ${results.filter(r => r.status === "success").length}/${results.length} successful`)
        })
        .catch(error => {
          log('error', `❌ Instagram automation failed: ${error.message}`)
        })

      return NextResponse.json({
        success: true,
        message: "Instagram comment automation started using MAXIMUM STEALTH created accounts",
        sampleComment: sampleComment,
        accountsFound: availableInstagramAccounts,
        platforms: ["instagram"],
        estimatedComments: accountCount || 3,
        estimatedDuration: `${(accountCount || 3) * 3} seconds`, // 3 seconds per account for commenting
        strategy: "ai_generated_unique_comments_per_account",
        maxStealth: true,
        realAccounts: true,
        enhanced: true,
        aiGenerated: true,
        uniqueCommentsPerAccount: true,
        hindiEnglishComments: true,
        description: "Each account gets unique AI-generated Hindi-English comment based on post description"
      })
    }

    // For other platforms, use the original logic
    const availableAccounts: any = {}

    for (const platform of platforms) {
      const collectionName = `${platform}_accounts`
      const accounts = await db
        .collection(collectionName)
        .find({ status: "active" })
        .limit(accountCount || 3)
        .toArray()

      availableAccounts[platform] = accounts
    }

    // Generate sample comment for preview using direct Gemini API
    const sampleComment = await generateGeminiComment(postContent || "Social media post", sentiment || "positive", 0);

    // Log the automation request
    await db.collection("automation_logs").insertOne({
      postUrl,
      postContent,
      commentStyle,
      sentiment,
      platforms,
      accountCount,
      availableAccounts: Object.keys(availableAccounts).reduce((acc, platform) => {
        acc[platform] = availableAccounts[platform].length
        return acc
      }, {} as any),
      sampleComment: sampleComment.comment,
      timestamp: new Date(),
      status: "initiated",
    })

    return NextResponse.json({
      success: true,
      message: "Comment automation started successfully",
      sampleComment: sampleComment,
      accountsFound: Object.keys(availableAccounts).reduce((total, platform) => {
        return total + availableAccounts[platform].length
      }, 0),
      platforms: platforms,
      estimatedComments: platforms.length * (accountCount || 3),
    })
  } catch (error) {
    console.error("Error in comment automation:", error)
    return NextResponse.json({ error: "Failed to start comment automation" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const checkAccounts = searchParams.get("checkAccounts") === "true"
    const platform = searchParams.get("platform")
    const count = Number.parseInt(searchParams.get("count") || "3")

    const { db } = await connectToDatabase()

    // Handle account availability check
    if (checkAccounts && platform) {
      const availableAccounts = await db
        .collection("social_accounts")
        .countDocuments({ 
          platform: platform,
          status: "active"
        })

      if (availableAccounts === 0) {
        return NextResponse.json({ 
          success: false, 
          error: `No active ${platform} accounts available` 
        }, { status: 400 })
      }

      // Calculate how comments will be distributed
      const commentsPerAccount = Math.ceil(count / availableAccounts)
      
      return NextResponse.json({
        success: true,
        availableAccounts,
        requestedComments: count,
        commentsPerAccount,
        distribution: `${count} comments across ${availableAccounts} accounts (${commentsPerAccount} comments per account)`,
        message: `Found ${availableAccounts} active ${platform} accounts. Each account will post approximately ${commentsPerAccount} comments.`
      })
    }

    // Get recent automation logs
    const logs = await db.collection("automation_logs").find({}).sort({ timestamp: -1 }).limit(limit).toArray()

    // Get Instagram automation logs as well
    const instagramLogs = await db.collection("comment_automation_logs").find({}).sort({ timestamp: -1 }).limit(limit).toArray()

    // Get statistics
    const stats = await db
      .collection("automation_logs")
      .aggregate([
        {
          $group: {
            _id: null,
            totalAutomations: { $sum: 1 },
            totalComments: { $sum: "$estimatedComments" },
            platformBreakdown: {
              $push: "$platforms",
            },
          },
        },
      ])
      .toArray()

    // Get Instagram account stats from your social_accounts collection
    const instagramAccountStats = await db.collection("social_accounts")
      .aggregate([
        {
          $match: { platform: "instagram" }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ])
      .toArray()

    // Get Instagram automation stats
    const instagramStats = await db.collection("comment_automation_logs")
      .aggregate([
        {
          $group: {
            _id: null,
            totalInstagramAutomations: { $sum: 1 },
            totalInstagramComments: { $sum: "$successCount" },
            totalInstagramFailures: { $sum: "$failureCount" },
            avgInstagramSuccessRate: { 
              $avg: { 
                $divide: ["$successCount", { $add: ["$successCount", "$failureCount"] }] 
              } 
            }
          }
        }
      ])
      .toArray()

    return NextResponse.json({
      logs: [...logs, ...instagramLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      stats: stats[0] || { totalAutomations: 0, totalComments: 0, platformBreakdown: [] },
      instagramStats: instagramStats[0] || { totalInstagramAutomations: 0, totalInstagramComments: 0, totalInstagramFailures: 0, avgInstagramSuccessRate: 0 },
      instagramAccountStats: instagramAccountStats.reduce((acc: any, stat: any) => {
        acc[stat._id] = stat.count
        return acc
      }, {}),
      strategy: "maximum_stealth_system_integrated"
    })
  } catch (error) {
    console.error("Error fetching automation data:", error)
    return NextResponse.json({ error: "Failed to fetch automation data" }, { status: 500 })
  }
}