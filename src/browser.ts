export type { Browser } from 'puppeteer'
import type { Browser } from 'puppeteer'
import puppeteer from "puppeteer"

let browser: Browser | null = null

export const launchBrowser = async (): Promise<Browser> => {
  if (browser) {
    return browser
  }

  console.info('Launching Browser…')
  return await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  })
}

export const closeBrowser = async (): Promise<void> => {
  if (!browser) {
    return
  }

  console.info('Closing browser…')
  await browser.close()
}
