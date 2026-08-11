/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const OUT_DIR = path.join(__dirname, '..', 'public', 'screenshots')
const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3001'
const VIEWPORT = { width: 1440, height: 900 }

async function snap(page, filename, clip) {
  const out = path.join(OUT_DIR, filename)
  await page.screenshot({ path: out, fullPage: false, clip, type: 'png' })
  console.log('Saved', out)
}

async function snapElement(page, selector, filename, pad = 8) {
  const el = await page.$(selector)
  if (!el) throw new Error(`Missing selector: ${selector}`)
  const box = await el.boundingBox()
  if (!box) throw new Error(`No bounding box: ${selector}`)
  await snap(page, filename, {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: Math.min(VIEWPORT.width, box.width + pad * 2),
    height: Math.min(VIEWPORT.height, box.height + pad * 2),
  })
}

async function clickText(page, text) {
  return page.evaluate((label) => {
    const nodes = Array.from(document.querySelectorAll('button, a, [role="tab"]'))
    const hit = nodes.find((n) => n.textContent?.trim().includes(label))
    if (hit) {
      hit.click()
      return true
    }
    return false
  }, text)
}

async function captureDashboard(page) {
  await page.goto(`${BASE}/#prototype-demo`, { waitUntil: 'networkidle2', timeout: 90000 })
  await page.waitForSelector('#prototype-demo', { timeout: 30000 })
  await page.evaluate(() => {
    document.getElementById('prototype-demo')?.scrollIntoView({ block: 'center' })
  })
  await new Promise((r) => setTimeout(r, 1200))
  await clickText(page, 'Client portal')
  await new Promise((r) => setTimeout(r, 800))
  await snapElement(page, '#prototype-demo', 'screenshot-dashboard.png', 12)
}

async function captureFromLocal(page) {
  await captureDashboard(page)

  // Drawings tab (document vault)
  await clickText(page, 'Drawings')
  await new Promise((r) => setTimeout(r, 600))
  await snapElement(page, '#prototype-demo', 'screenshot-documents.png', 12)

  // 3) RFIs tab
  await clickText(page, 'RFIs')
  await new Promise((r) => setTimeout(r, 800))
  await snapElement(page, '#prototype-demo', 'screenshot-rfis.png', 12)
}

async function captureFromLiveApp(page) {
  await page.goto('https://app.5bloc.com', { waitUntil: 'networkidle2', timeout: 90000 })
  await new Promise((r) => setTimeout(r, 3000))
  await snap(page, 'screenshot-dashboard.png')

  await clickText(page, 'Documents') || (await clickText(page, 'Drawings'))
  await new Promise((r) => setTimeout(r, 2000))
  await snap(page, 'screenshot-documents.png')

  await clickText(page, 'RFIs') || (await clickText(page, 'RFI'))
  await new Promise((r) => setTimeout(r, 2000))
  await snap(page, 'screenshot-rfis.png')
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)

  try {
    if (BASE.includes('localhost') || BASE.includes('127.0.0.1')) {
      await captureFromLocal(page)
    } else {
      await captureFromLiveApp(page)
    }
  } catch (err) {
    console.error('Primary capture failed:', err.message)
    if (!BASE.includes('localhost')) {
      console.log('Retrying with localhost:3001 …')
      await captureFromLocal(page)
    } else {
      throw err
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
