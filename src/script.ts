import type { queueAsPromised } from 'fastq'
import type { Browser } from '~/browser'

import report from 'puppeteer-report'
import path from 'path'
import fs from 'fs/promises'
import * as readline from 'node:readline/promises';
import PDFMerger from 'pdf-merger-js'
import fastq from 'fastq'
import CliProgress from 'cli-progress'

import { render } from '~/templates'
import { queries, prisma, studentNumbers } from '~/queries'
import { launchBrowser, closeBrowser } from '~/browser'

const errors: Error[] = []

type Task = {
  browser: Browser
  student_number: number
}


type StudentNumberFilter = number[]

const q: queueAsPromised<Task> = fastq.promise(asyncWorker, 20)

async function asyncWorker({ browser, student_number }: Task): Promise<void> {
  await runReport(browser, student_number)
}

const REPORT_DATE = new Date()
const OUT_DIRECTORY = path.join(__dirname, '..', 'out')
const outFilePath = (filename: string) => path.join(OUT_DIRECTORY, filename)
const progress = new CliProgress.SingleBar({})

const classHistReducer = (prev: any, curr: any): any => {
  const key = `${curr.HIST_FROM_YEAR}/${curr.HIST_TO_YEAR}`
  prev[key] = [...(prev[key] || []), curr]
  return prev
}

async function runReport(browser: Browser, student_number: number) {
  const transcript_html_path = outFilePath(`${student_number}-transcript.html`)
  const transcript_pdf_path = outFilePath(`${student_number}-transcript.pdf`)
  const testscores_html_path = outFilePath(`${student_number}-testscores.html`)
  const testscores_pdf_path = outFilePath(`${student_number}-testscores.pdf`)
  const personalinfo_html_path = outFilePath(
    `${student_number}-personalinfo.html`
  )
  const personalinfo_pdf_path = outFilePath(
    `${student_number}-personalinfo.pdf`
  )
  const merged_pdf_path = outFilePath(`${student_number}.pdf`)

  try {
    // queries
    const student_data_transcript = await queries.studentDataTranscript(
      student_number
    )
    const student_data_tests = await queries.studentDataTests(student_number)
    const student_personal_data_report = await queries.studentPersonalDataReport(student_number)
    const ecum = await queries.ecum(student_number)
    const demo = await queries.demo(student_number)
    const misc = await queries.misc(student_number)
    const years_grade = await queries.yearsGrade(student_number)
    const fall_class_hst = (await queries.fallClassHst(student_number)).reduce(
      classHistReducer,
      {}
    )
    const spring_class_hst = (
      await queries.springClassHst(student_number)
    ).reduce(classHistReducer, {})
    const elem_grd = await queries.elemGrd(student_number)
    const attend = await queries.attend(student_number)
    const mobility = await queries.mobility(student_number)
    const address_history = await queries.addressHistory(student_number)

    // testscores
    const studentTestList = await queries.admin(student_number)
    const otis = await queries.otis(student_number)
    const iowa_new = await queries.newitbs(student_number)
    const oklacore = await queries.occ(student_number)
    const gates = await queries.reading(student_number)
    const explore = await queries.explore(student_number)
    const eoi = await queries.eoi(student_number)
    const plan = await queries.plan_test(student_number)
    const act = await queries.act(student_number)
    const pbp = await queries.pbp(student_number)
    const sta9 = await queries.sat9(student_number)
    const sat = await queries.sat(student_number)
    const itbs = await queries.itbs(student_number)
    const nagle = await queries.nagle(student_number)

    const spd_mobility = await queries.spd_Mobility(student_number)
    const spd_immunizations = await queries.spd_Immunizations(student_number)
    const spd_demo = await queries.spd_Demo(student_number)
    const spd_suspensions = await queries.spd_Suspensions(student_number)
    const spd_special_ed = await queries.spd_SpecialEd(student_number)
    const spd_special_ed_inactive = await queries.spd_SpecialEdInactive(student_number)

    // html transcript
    fs.writeFile(
      transcript_html_path,
      render('transcript.njk', {
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
      })
    )

    // html testscores
    fs.writeFile(
      testscores_html_path,
      render('testscores.njk', {
        date: REPORT_DATE,
        student_data_transcript,
        studentTestList,
        otis,
        iowa_new,
        oklacore,
        gates,
        explore,
        eoi,
        plan,
        act,
        pbp,
        sta9,
        sat,
        itbs,
        nagle
      })
    )

    // html personalinfo
    fs.writeFile(personalinfo_html_path, render('personalinfo.njk', {
      date: REPORT_DATE,
      student_personal_data_report,
      student_data_transcript,
      spd_mobility,
      spd_immunizations,
      spd_special_ed,
      spd_special_ed_inactive,
      spd_suspensions,
      spd_demo,
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
      },
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
      },
    })

    // pdf personalinfo
    await report.pdf(browser, personalinfo_html_path, {
      path: personalinfo_pdf_path,
      format: 'letter',
      printBackground: true,
      margin: {
        bottom: '0.25in',
        left: '1in',
        right: '1in',
        top: '0.25in',
      },
    })

    // merge all of the pdf files
    const merger = new PDFMerger()
    await merger.add(transcript_pdf_path)
    await merger.add(testscores_pdf_path)
    await merger.add(personalinfo_pdf_path)
    await merger.save(merged_pdf_path)
  } catch (error) {
    await Promise.allSettled([merged_pdf_path].map(fs.unlink))
    throw error
  } finally {
    await Promise.allSettled(
      [
        transcript_html_path,
        transcript_pdf_path,
        testscores_html_path,
        testscores_pdf_path,
        personalinfo_html_path,
        personalinfo_pdf_path,

      ].map(fs.unlink)
    )
  }
}
// race conditions can occur if there are long write times to a remote drive.
async function runReports(
  browser: Browser,
  student_number_filter?: StudentNumberFilter
) {
  const student_numbers: Array<number> = []

  console.info('Student Number Count:', student_numbers.length)

  progress.start(student_numbers.length, 0)

  student_numbers.forEach((student_number) => {
    q.push({ browser, student_number })
      .catch((error) => {
        errors.push(error)
        console.error('\nError:', student_number, error)
      })
      .finally(() => progress.increment())
  })
  await q.drained().then(() => progress.stop())
}

async function studentNumbersFilter(): Promise<StudentNumberFilter | undefined> {

  const stdin_integers = []
  if (!(process.stdin.isTTY)) {
    for await (const line of readline.createInterface({ input: process.stdin })) {
      const student_number = parseInt(line.trim())
      if (student_number) stdin_integers.push(student_number);
    }

  }

  const argv_integers = process.argv
    .map(Number)
    .filter((n) => n % 1 == 0 && n > 0)
  const integers = stdin_integers.concat(argv_integers)
  if (integers.length) {
    return integers
  }
}

process.on('exit', () => {
  console.info('')

  console.info('Error count:', errors.length)

  console.info('Disconnecting…')
  const disconnectPromise = prisma.$disconnect()

  console.info('Closing Browser…')
  const closePromise = closeBrowser()

  return Promise.all([disconnectPromise, closePromise])
})
  ; (async () => {
    try {
      await fs.mkdir(OUT_DIRECTORY, { recursive: true })
      const browser = await launchBrowser()
      await runReports(browser, await studentNumbersFilter())
      process.exit(0)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })()
