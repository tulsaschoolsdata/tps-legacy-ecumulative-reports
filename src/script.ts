import type { queueAsPromised } from 'fastq'
import type { Browser } from '~/browser'

import report from 'puppeteer-report'
import path from 'path'
import fs from 'fs/promises'
import PDFMerger from 'pdf-merger-js'
import fastq from 'fastq'
import CliProgress from 'cli-progress'

import { render } from '~/templates'
import  { queries, prisma } from '~/queries'
import { launchBrowser, closeBrowser } from '~/browser'

const errors: Error[] = []

type Task = {
  browser: Browser,
  student_number: number,
}

type StudentNumberFilter = number[]

const q: queueAsPromised<Task> = fastq.promise(asyncWorker, 20)

async function asyncWorker({browser, student_number}: Task): Promise<void> {
  await runReport(browser, student_number)
}

const REPORT_DATE = new Date()
const OUT_DIRECTORY = path.join(__dirname, '..', 'out')
const outFilePath = (filename:string) => path.join(OUT_DIRECTORY, filename)
const progress = new CliProgress.SingleBar({})

const classHistReducer = (prev: any, curr: any): any => {
  const key = `${curr.HIST_FROM_YEAR}/${curr.HIST_TO_YEAR}`
  prev[key] = [...(prev[key] || []), curr]
  return prev
}

const testTableHeader = (testName: string, gradeLevel: number, testDateStr: string, schoolName: string): string => {
  const date = new Date(testDateStr)
  const formattedDate = date.getMonth() + "/" + date.getFullYear()
  const name = testName.toUpperCase()
  const grade = String(gradeLevel).padStart(2, '0')
  const school = schoolName.toUpperCase()
  return `${name}    Grade: ${grade}  Date: ${formattedDate}  School: ${school}`
}

async function runReport(browser: Browser, student_number: number) {

  const transcript_html_path = outFilePath(`${student_number}-transcript.html`)
  const transcript_pdf_path = outFilePath(`${student_number}-transcript.pdf`)
  const testscores_html_path = outFilePath(`${student_number}-testscores.html`)
  const testscores_pdf_path = outFilePath(`${student_number}-testscores.pdf`)
  const personalinfo_html_path = outFilePath(`${student_number}-personalinfo.html`)
  const personalinfo_pdf_path = outFilePath(`${student_number}-personalinfo.pdf`)
  const merged_pdf_path = outFilePath(`${student_number}.pdf`)

  try {
    // queries
    const student_data_transcript = await queries.studentDataTranscript(student_number)
    const student_data_tests = await queries.studentDataTests(student_number)
    const ecum = await queries.ecum(student_number)
    const demo = await queries.demo(student_number)
    const misc = await queries.misc(student_number)
    const years_grade = await queries.yearsGrade(student_number)
    const fall_class_hst = (await queries.fallClassHst(student_number)).reduce(classHistReducer, {})
    const spring_class_hst = (await queries.springClassHst(student_number)).reduce(classHistReducer, {})
    const elem_grd = await queries.elemGrd(student_number)
    const attend = await queries.attend(student_number)
    const mobility = await queries.mobility(student_number)
    const address_history = await queries.addressHistory(student_number)
    const admin = await queries.admin(student_number)

    // queries testscores - OTIS-LENNON
    const otis = await queries.otis(student_number)

    // queries testscores - IOWA
    const iowa_new = await queries.newitbs(student_number)

    // queries testscores - OKLAHOMA CORE
    const oklacore = await queries.occ(student_number)

    // queries testscores - GATES
    const gates = await queries.reading(student_number)

    // queries testscores - EXPLORE - 8
    // queries testscores - END OF INSTRUCTION - 9,10
    // queries testscores - PLAN - 9
    // queries testscores - ACT - 12

    // html transcript
    fs.writeFile(transcript_html_path, render('transcript.njk', {
      date: REPORT_DATE,
      student_data_transcript,
      student_data_tests,
      ecum,
      demo,
      misc,
      years_grade,
      fall_class_hst,
      spring_class_hst,
      elem_grd,
      attend,
      mobility,
      address_history,
    }))

    // html testscores
    fs.writeFile(testscores_html_path, render('testscores.njk', {
      date: REPORT_DATE,
      student_data_transcript,
      admin,
      otis,
      iowa_new,
      oklacore,
      gates
    }))

    // html personalinfo
    fs.writeFile(personalinfo_html_path, render('personalinfo.njk', {
      date: REPORT_DATE,
      student_data_transcript,
    }))

    // pdf transcript
    await report.pdf(browser, transcript_html_path, {
      path: transcript_pdf_path,
      format: 'letter',
      landscape: true,
      printBackground: true,
      margin: {
        bottom: '0.25in',
        left: '1in',
        right: '1in',
        top: '0.25in',
      }
    })

    // pdf testscores
    await report.pdf(browser, testscores_html_path, {
      path: testscores_pdf_path,
      format: 'letter',
      landscape: true,
      printBackground: true,
      margin: {
        bottom: '0.25in',
        left: '1in',
        right: '1in',
        top: '0.25in',
      }
    })

    // pdf personalinfo
    await report.pdf(browser, personalinfo_html_path, {
      path: personalinfo_pdf_path,
      format: 'letter',
      printBackground: true,
      margin: {
        bottom: '0.25in',
        left: '0.25in',
        right: '0.25in',
        top: '0.25in',
      }
    })

    // merge all of the pdf files
    const merger = new PDFMerger()
    await merger.add(transcript_pdf_path)
    await merger.add(testscores_pdf_path)
    await merger.add(personalinfo_pdf_path)
    await merger.save(merged_pdf_path)
  } catch (error) {
    await Promise.allSettled([
      merged_pdf_path,
    ].map(fs.unlink))
    throw error
  } finally {
    await Promise.allSettled([
      transcript_html_path,
      transcript_pdf_path,
      testscores_html_path,
      testscores_pdf_path,
    ].map(fs.unlink))
  }
}

async function runReports(browser: Browser, student_number_filter?: StudentNumberFilter) {
  const student_numbers = (await queries.studentNumbers())
    .map(o => o.STUDENT_NUMBER)
    .filter(number => !student_number_filter || student_number_filter.includes(number))
  console.info('Student Number Count:', student_numbers.length)

  progress.start(student_numbers.length, 0)

  student_numbers.forEach(student_number => {
    q
      .push({browser, student_number})
      .catch((error) => {
        errors.push(error)
        console.error('\nError:', student_number, error)
      })
      .finally(() => progress.increment())
  })

  await q.drained().then(() => progress.stop())
}

function studentNumbersFilter(): StudentNumberFilter|undefined {
  const argv_integers = process.argv.map(Number).filter(n => n % 1 == 0 && n > 0)

  if (argv_integers.length) {
    return argv_integers
  }
}

process.on('exit', () => {
  console.info('')

  console.info('Error count:', errors.length)

  console.info('Disconnecting…')
  const disconnectPromise = prisma.$disconnect()

  console.info('Closing Browser…')
  const closePromise = closeBrowser()

  return Promise.all([
    disconnectPromise,
    closePromise,
  ])
})

;(async () => {
  try {
    await fs.mkdir(OUT_DIRECTORY, {recursive: true})
    const browser = await launchBrowser()
    await runReports(browser, studentNumbersFilter())
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
