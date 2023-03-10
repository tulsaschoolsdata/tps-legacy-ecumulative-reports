import path from 'path'
import nunjucks from 'nunjucks'

export function formatDate(
  date: Date,
  locales: string | string[] = 'en-US',
  options: Intl.DateTimeFormatOptions = { timeZone: 'UTC' }
): string {
  return new Intl.DateTimeFormat(locales, options).format(date)
}

const templates = nunjucks
  .configure(path.join(__dirname, '..', 'templates'), { autoescape: true })
  .addFilter('formatDate', formatDate)

// @ts-ignore
export const render = (...args) => templates.render(...args)

export default templates
