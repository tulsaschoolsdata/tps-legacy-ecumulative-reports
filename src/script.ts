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
  // console.info(`Student Number: ${student_number}`)

  const transcript_html_path = outFilePath(`${student_number}-transcript.html`)
  const transcript_pdf_path = outFilePath(`${student_number}-transcript.pdf`)
  const testscores_html_path = outFilePath(`${student_number}-testscores.html`)
  const testscores_pdf_path = outFilePath(`${student_number}-testscores.pdf`)
  const personalinfo_html_path = outFilePath(`${student_number}-personalinfo.html`)
  const personalinfo_pdf_path = outFilePath(`${student_number}-personalinfo.pdf`)
  const merged_pdf_path = outFilePath(`${student_number}.pdf`)

  try {
    const student_data_transcript = await queries.studentDataTranscript(student_number)
    const student_data_tests = await queries.studentDataTests(student_number)
    const student_personal_data_report = await queries.studentPersonalDataReport(student_number)
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
    const otis = await queries.otis(student_number)
    const newitbs = await queries.newitbs(student_number)
    const spd_mobility = await queries.spd_Mobility(student_number)
    const spd_immunizations = await queries.spd_Immunizations(student_number)
    const spd_demo = await queries.spd_Demo(student_number)
    // const spd_suspensions = await queries.spd_Suspensions(student_number)
    // const spd_special_ed_active = await queries.spd_SpecialEdActive(student_number)
    // const spd_special_ed_inactive = await queries.spd_SpecialEdInactive(student_number)
    const new_iowa3 = newitbs.filter((row => {
       return row.GRADE == "03"
    }))
    const new_iowa4 = newitbs.filter((row => {
       return row.GRADE == "04"
    }))
    const new_iowa3_ge = new_iowa3.filter((row => {
       return row.MEASURE_RANK.trim() == 'GE'
    }))
    const new_iowa4_ge = new_iowa4.filter((row => {
       return row.MEASURE_RANK.trim() == 'GE'
    }))
    const new_iowa3_lpr = new_iowa3.filter((row => {
       return row.MEASURE_RANK == 'LPR'
    }))
    const new_iowa4_lpr = new_iowa4.filter((row => {
       return row.MEASURE_RANK == 'LPR'
    }))
    const new_iowa3_nce = new_iowa3.filter((row => {
       return row.MEASURE_RANK == 'NCE'
    }))
    const new_iowa4_nce = new_iowa4.filter((row => {
       return row.MEASURE_RANK == 'NCE'
    }))
    const new_iowa3_npr = new_iowa3.filter((row => {
       return row.MEASURE_RANK == 'NPR'
    }))
    const new_iowa4_npr = new_iowa4.filter((row => {
       return row.MEASURE_RANK == 'NPR'
    }))
    const new_iowa3_spr = new_iowa3.filter((row => {
       return row.MEASURE_RANK == 'SPR'
    }))
    const new_iowa4_spr = new_iowa4.filter((row => {
       return row.MEASURE_RANK == 'SPR'
    }))

    const new_iowa3_obj = {
      "GE": new_iowa3_ge,
      "LPR": new_iowa3_lpr,
      "NCE": new_iowa3_nce,
      "NPR": new_iowa3_npr,
      "SPR": new_iowa3_spr,
    }

    const new_iowa4_obj = {
      "GE": new_iowa4_ge,
      "LPR": new_iowa4_lpr,
      "NCE": new_iowa4_nce,
      "NPR": new_iowa4_npr,
      "SPR": new_iowa4_spr,
    }

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

    // console.info('Rendering Test Scores HTML…')
    fs.writeFile(testscores_html_path, render('testscores.njk', {
      date: REPORT_DATE,
      student_data_transcript,
      admin,
      otis,
      newitbs,
      new_iowa3_obj,
      new_iowa4_obj,
    }))


    // console.info('Rendering Personal Info HTML…')
    fs.writeFile(personalinfo_html_path, render('personalinfo.njk', {
      date: REPORT_DATE,
      student_personal_data_report,
      student_data_transcript,
      spd_mobility,
      spd_immunizations,
      // spd_special_ed_active,
      // spd_special_ed_inactive,
      // spd_suspensions,
      spd_demo,
    }))

    // console.info('Generating Transcript PDF…')
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

    // console.info('Generating Test Scores PDF…')
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

    // console.info('Generating Personal Info PDF…')
    await report.pdf(browser, personalinfo_html_path, {
      path: personalinfo_pdf_path,
      format: 'letter',
      printBackground: true,
      margin: {
        bottom: '0.25in',
        left: '1in',
        right: '1in',
        top: '0.25in',
      }
    })

    // console.info('Merging PDFs…')
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
} // end of async runReport student transcript

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
