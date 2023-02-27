import type {
  STUDENT,
  BUILDING_MASTER,
  SRECUM_CICSTST1,
  STUDENT_DEMO,
  SCMISC_CICSTST1,
  ELEMGRD_CICSTST1,
  ATTEND_CUSTOM,
  MOBILITY,
  ADDHIST_CICSTST1,
  TESTS_ADMINISTERED,
  TESTS_OTIS,
  TESTS_READING_CUSTOM,
  TESTS_EXPLTEST,
  // CLASS_HISTORY_CUSTOM, // … no primary key
  // TESTS_TEST, // … no primary key
} from '@prisma/client'
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

const schoolYearMapper = (attr1: string, attr2: string = 'school_year') => {
  return (o: any) => {
    let a = parseInt(o[attr1].slice(0,2))
    let b = parseInt(o[attr1].slice(2,4))
    a += (a > 50) ? 1900 : 2000
    b += (b > 50) ? 1900 : 2000

    const school_year = `${a}-${b}`
    return {...o, [attr2]: school_year}
  }
}

const schoolYearSorter =  (attr: string = 'school_year') => {
  return (a: any, b: any) => a[attr] == b[attr] ? 0 : a[attr] > b[attr] ? 1 : -1
}

export type StudentNumber = Pick<STUDENT, 'STUDENT_NUMBER'>

export const studentNumbers = async (): Promise<StudentNumber[]> =>
  await prisma.$queryRaw<StudentNumber[]>`SELECT STUDENT_NUMBER FROM ECUM_Report_Student.ECUM.STUDENT`

type StudentDataTranscript = Pick<STUDENT,
  'STUDENT_NUMBER' |
  'STUDENT_SSN' |
  'STUDENT_LNAME' |
  'STUDENT_FNAME' |
  'STUDENT_MI' |
  'GOESBYNAME' |
  'STUDENT_BIRTHDATE' |
  'STUDENT_SEX' |
  'STUDENT_RACE' |
  'STUDENT_GRADE' |
  'STUDENT_HOUSE_NO' |
  'STUDENT_DIRECTION' |
  'STUDENT_STREET' |
  'STUDENT_APT_NO' |
  'STUDENT_ZIP1' |
  'STUDENT_PHONE' |
  'STUDENT_ENTRY_DATE' |
  'STUDENT_CURR_SCH'
>

export const studentDataTranscript = async (student_number: number): Promise<StudentDataTranscript | undefined> =>
  (await prisma.$queryRaw<StudentDataTranscript[]>`EXECUTE ECUM_Report_Student.ecum_queries.student_data_transcript ${student_number}`)[0]

type StudentDataTests = Pick<STUDENT,
  'STUDENT_NUMBER' |
  'STUDENT_LNAME' |
  'STUDENT_FNAME' |
  'STUDENT_MI' |
  'STUDENT_GRADE' |
  'STUDENT_CURR_SCH'
> & Pick<BUILDING_MASTER, 'BLDG_NAME'>

export const studentDataTests = async (student_number: number): Promise<StudentDataTests | undefined> =>
  (await prisma.$queryRaw<StudentDataTests[]>`EXECUTE ECUM_Report_Student.ecum_queries.student_data_tests ${student_number}`)[0]

type Ecum = Pick<SRECUM_CICSTST1,
  'BIRTHPLACE' |
  'BIRTH_CERT_NO' |
  'BIRTH_OTHER' |
  'FATHER' |
  'MOTHER' |
  'CUSTODY_REL' |
  'CUST_AFFIDAV' |
  'COURT_ORDER' |
  'CUST_DATE' |
  'MOTHER_MAIDEN'
>

export const ecum = async (student_number: number): Promise<Ecum | undefined> =>
  (await prisma.$queryRaw<Ecum[]>`EXECUTE ECUM_Report_Student.ecum_queries.ecum ${student_number}`)[0]

type Demo = Pick<STUDENT_DEMO,
  'PARENT_LNAME' |
  'PARENT_FNAME' |
  'PARENT_MI' |
  'SPARENT_LNAME' |
  'SPARENT_FNAME' |
  'SPARENT_MNAME'
>

export const demo = async (student_number: number): Promise<Demo | undefined> =>
  (await prisma.$queryRaw<Demo[]>`EXECUTE ECUM_Report_Student.ecum_queries.demo ${student_number}`)[0]

type Misc = Pick<SCMISC_CICSTST1,
  'RANK_STUD' |
  'RANK_CLASS' |
  'GRADUATION_DATE' |
  'OKLA_SCHOLARS'
>

export const misc = async (student_number: number): Promise<Misc | undefined> =>
  (await prisma.$queryRaw<Misc[]>`EXECUTE ECUM_Report_Student.ecum_queries.misc ${student_number}`)[0]

type YearGrade = {
  STUDENT_NUMBER: number // CLASS_HISTORY_CUSTOM
  HIST_FROM_YEAR: number // CLASS_HISTORY_CUSTOM
  HIST_TO_YEAR: number // CLASS_HISTORY_CUSTOM
  HIST_GRADE_LEVEL: string // CLASS_HISTORY_CUSTOM
  FALL_BLDG_NAME: string // CLASS_HISTORY_CUSTOM + BUILDING_MASTER
  SPRING_BLDG_NAME: string // CLASS_HISTORY_CUSTOM + BUILDING_MASTER
}

export const yearsGrade = (student_number: number): Promise<YearGrade[]> =>
  prisma.$queryRaw<YearGrade[]>`EXECUTE ECUM_Report_Student.ecum_queries.years_grade ${student_number}`

type ClassHst = {
  STUDENT_NUMBER: number // CLASS_HISTORY_CUSTOM
  HIST_FROM_YEAR: number // CLASS_HISTORY_CUSTOM
  HIST_TO_YEAR: number // CLASS_HISTORY_CUSTOM
  HIST_GRADE_LEVEL: string // CLASS_HISTORY_CUSTOM
  HIST_SEMESTER_SORT_CODE: string // CLASS_HISTORY_CUSTOM
  HIST_LOCATION: number // CLASS_HISTORY_CUSTOM
  HIST_COURSE_NAME: string // CLASS_HISTORY_CUSTOM
  HIST_COURSE_NUM: number // CLASS_HISTORY_CUSTOM
  HIST_SEMESTER: string // CLASS_HISTORY_CUSTOM
  HIST_SEM_GRADE: string // CLASS_HISTORY_CUSTOM
  HIST_CREDIT_EARNED: number // CLASS_HISTORY_CUSTOM
}

export const fallClassHst = (student_number: number): Promise<ClassHst[]> =>
  prisma.$queryRaw<ClassHst[]>`EXECUTE ECUM_Report_Student.ecum_queries.fallclasshst ${student_number}`

export const springClassHst = (student_number: number): Promise<ClassHst[]> =>
  prisma.$queryRaw<ClassHst[]>`EXECUTE ECUM_Report_Student.ecum_queries.springclasshst ${student_number}`

type ElemGrd = Exclude<ELEMGRD_CICSTST1, 'STUDENT_NUMBER'> & { school_year?: string }

export const elemGrd = async (student_number: number): Promise<ElemGrd[]> => {
  const elem_grd = (await prisma.$queryRaw<ElemGrd[]>`EXECUTE ECUM_Report_Student.ecum_queries.elemgrd ${student_number}`).map(schoolYearMapper('SCHOOL_YEAR', 'school_year'))
  elem_grd.sort(schoolYearSorter('school_year'))
  return elem_grd
}

type Attend = Pick<ATTEND_CUSTOM, 'ATTENDANCE_YEAR' | 'SCHOOL'> & Pick<BUILDING_MASTER, 'BLDG_NAME'> & {
  SUM_DAYS_PRESENT: number
  SUM_DAYS_ABSENT: number
  SUM_DAYS_NON_MEMBER: number
  school_year?: string
}

export const attend = async (student_number: number): Promise<Attend[]> => {
  const attend = (await prisma.$queryRaw<Attend[]>`EXECUTE ECUM_Report_Student.ecum_queries.attend ${student_number}`).map(schoolYearMapper('ATTENDANCE_YEAR', 'school_year'))
  attend.sort(schoolYearSorter('school_year'))
  return attend
}

type Mobility = Pick<MOBILITY,
  'SCHOOL_CODE' |
  'ENTRY_DATE' |
  'ENTRY_REASON_CODE' |
  'EXIT_DATE' |
  'EXIT_REASON_CODE'
>

export const mobility = async (student_number: number): Promise<Mobility[]> => {
  const mobility = (await prisma.$queryRaw<Mobility[]>`EXECUTE ECUM_Report_Student.ecum_queries.mobility ${student_number}`)
  mobility.sort((a, b) => a.ENTRY_DATE == b.ENTRY_DATE ? 0 : (a.ENTRY_DATE || 0) > (b.ENTRY_DATE || 0) ? 1 : -1)
  return mobility
}

type AddressHistory = Pick<ADDHIST_CICSTST1,
  'ADDR_DATE' |
  'HOUSE_NUMBER' |
  'DIRECTION' |
  'STREET_NAME' |
  'APARTMENT_LOT_NO' |
  'BLDG_LOT_NO' |
  'ZIP_CODE' |
  'ZIP_SUFFIX'
> & { address_date?: Date }

export const addressHistory = async (student_number: number): Promise<AddressHistory[]> => {
  const address_history = (await prisma.$queryRaw<AddressHistory[]>`EXECUTE ECUM_Report_Student.ecum_queries.addhist ${student_number}`).map(o => {
    const y = parseInt(o.ADDR_DATE.slice(0, 4))
    const m = parseInt(o.ADDR_DATE.slice(4, 6))
    const d = parseInt(o.ADDR_DATE.slice(6, 8))
    const address_date = new Date(y, m - 1, d)
    return {...o, address_date}
  })
  address_history.sort((a, b) => a.address_date == b.address_date ? 0 : a.address_date > b.address_date ? 1 : -1)
  return address_history
}

type Admin = Pick<TESTS_ADMINISTERED,
  'STUDENT_NUMBER' |
  'TYPE' |
  'GRADE' |
  'DATE' |
  'SORT_GRADE' |
  'SORT_DATE'
> & {
  TEST_NAME: string // TESTS_TEST
}

export const admin = async (student_number: number): Promise<Admin[]> => {
  const admin = (await prisma.$queryRaw<Admin[]>`EXECUTE ECUM_Report_Student.ecum_queries.admin ${student_number}`)
  return admin
}

type Otis = Pick<TESTS_ADMINISTERED,
  'STUDENT_NUMBER' |
  'GRADE' |
  'SORT_DATE' |
  'SORT_GRADE'  
  > & Pick<TESTS_OTIS,
  'STUDENT_NUMBER' |
  'SCHOOL_NAME' |
  'OTIS_AGE_YEARS' |
  'OTIS_AGE_MNTHS' |
  'OTIS_RAW_SCORE' |
  'OTIS_SAI_SCORE' |
  'OTIS_SAI_PCT' |
  'OTIS_SAI_STANINE' |
  'OTIS_GRD_ABILITY' |
  'OTIS_GRD_PCT' |
  'OTIS_GRD_STANINE' |
  'OTIS_SCALE_SCORE' |
  'OTIS_ADJ_SAI_SCORE' |
  'OTIS_ADJ_SAI_PCT' |
  'OTIS_SAI_STANINE'
  > & {
  TEST_NAME: string // TESTS_TEST
}

export const otis = async (student_number: number): Promise<Otis[]> => {
  const otis = (await prisma.$queryRaw<Otis[]>`EXECUTE ECUM_Report_Student.ecum_queries.otis ${student_number}`)
  return otis
}

//-------------- Student Personal Data Report Queries -------------------- 
type StudentPersonalDataReport = Pick<STUDENT,
'STUDENT_NUMBER' |
'GOESBYNAME' |
'STUDENT_STATUS' |
'STUDENT_CURR_SCH' |
'STUDENT_ENTRY_DATE' |
'STUDENT_BIRTHDATE' |
'STUDENT_GRADE' |
'STUDENT_SEX' |
'STUDENT_RACE'
  > & Pick<SCMISC_CICSTST1,
  'CURR_TRANS_CD' |	
  'CURR_TRANS_CD' |
  'HEALTH_CD' 
  > & {
  STUDENT_NAME: string,
  STUDENT_ADDRESS: string,
  STUDENT_PHONE: string,
  STUDENT_STATUS: string,
  MISC_REASON_CODE: string,
  }


export const studentPersonalDataReport = async (student_number: number): Promise<StudentPersonalDataReport[]> => {
  const student_personal_data_report = (await prisma.$queryRaw<StudentPersonalDataReport[]>`Execute ECUM_Report_Student.ecum_queries.student_personal_data_report ${student_number}`)
  return student_personal_data_report
}

type Spd_Mobility = Pick<MOBILITY,
  'STUDENT_NUMBER' | 
  'SCHOOL_CODE' |
  'ENTRY_DATE' |
  'TRANSFER_CODE' |
  'ENTRY_REASON_CODE' |
  'EXIT_DATE' |
  'EXIT_REASON_CODE'
  > & Pick<BUILDING_MASTER, 'BLDG_NAME'>

export const spd_Mobility = async (student_number: number): Promise<Spd_Mobility[]> => {
  const spd_mobility = (await prisma.$queryRaw<Spd_Mobility[]>`Execute ECUM_Report_student.ecum_queries.spd_mobility ${student_number}`)
  return spd_mobility
}

type Spd_Immunizations = {
  IMMUNIZATION_TYPE: string // HEALTH
  FIRST_DATE: Date      // HEALTH
  SECOND_DATE: Date     // HEALTH
  THIRD_DATE: Date      // HEALTH
  FOURTH_DATE: Date     // HEALTH
  FIFTH_DATE: Date      // HEALTH
  SIXTH_DATE: Date      // HEALTH
  CERTIFIED_BY: string  // HEALTH
 } & Pick<STUDENT, 'IMMUN_STATUS'>

export const spd_Immunizations = (student_number: number): Promise<Spd_Immunizations[]> => prisma.$queryRaw<Spd_Immunizations[]>`Execute ECUM_Report_student.ecum_queries.spd_immunizations ${student_number}`

type Spd_SpecialEdActive = {
  SPEC_PREFIX: string
  SPEC_NUMBER: number
  SPEC_PROG_DESIGN: string
  SPEC_ENTRY_DATE: Date
}

export const spd_SpecialEdActive = (student_number: number): Promise<Spd_SpecialEdActive[]> => prisma.$queryRaw<Spd_SpecialEdActive[]>`Execute ECUM_Report_Student.ECUM.ecum_queries.spd_special_ed_active ${student_number}`

type Spd_SpecialEdInactive = {
  SPEC_PREFIX: string
  SPEC_NUMBER: number
  SPEC_PROG_DESIGN: string
  SPEC_ENTRY_DATE: Date
}

export const spd_SpecialEdInactive = (student_number: number): Promise<Spd_SpecialEdInactive[]> => prisma.$queryRaw<Spd_SpecialEdInactive[]>`Execute ECUM_Report_Student.ECUM.ecum_queries.spd_special_ed_inactive ${student_number}`

type Spd_Suspensions = {
  SCHOOL: string              // SUSPEND
  NOTIFICATION: string        // SUSPEND
  START_DATE: Date            // SUSPEND
  END_DATE: Date              // SUSPEND
  NUMBER_DAYS: number         // SUSPEND
  COMMENT_LINE_1: string      // SUSPEND
  LOCATION: string            // SUSPEND
  REASON_DESCRIPTION: string  // SUSPEND_REASON_CODES
}

export const spd_Suspensions = (student_number: number): Promise<Spd_Suspensions[]> => prisma.$queryRaw<Spd_Suspensions[]>`Execute ECUM_ReportStudent.Ecum.ecum_queries.spd_suspensions ${student_number}`

type Spd_Demo = Pick<STUDENT_DEMO,
  'PARENT_LNAME' |
  'PARENT_FNAME' |
  'PARENT_MI' |
  'SPARENT_LNAME' |
  'SPARENT_FNAME' |
  'SPARENT_MNAME'
  >

export const spd_Demo = async (student_number: number): Promise<Spd_Demo[]> => {
  const spd_demo = (await prisma.$queryRaw<Spd_Demo[]>`EXECUTE ECUM_Report_Student.ecum_queries.spd_demo ${student_number}`)
  return spd_demo
}

type Reading = Pick<TESTS_ADMINISTERED,
  'STUDENT_NUMBER' |
  'GRADE' |
  'SORT_DATE' |
  'SORT_GRADE'
    >
& Pick<TESTS_READING_CUSTOM,
  'RAW_SCORE_1' |
  'PERCENTILE_1' |
  'GE_1' |
  'RAW_SCORE_2' |
  'PERCENTILE_2' |
  'GE_2' |
  'RAW_SCORE_3' |
  'PERCENTILE_3' |
  'GE_3' |
  'RAW_SCORE_4' |
  'PERCENTILE_4' |
  'GE_4'
    > & {
  TEST_NAME: string, // TESTS_TEST
  BLDG_NAME: string, // ECUM_BULIDING_MASTER
}

export const reading = async (student_number: number): Promise<Reading[]> => {
  const reading = (await prisma.$queryRaw<Reading[]>`EXECUTE ECUM_Report_Student.ecum_queries.reading ${student_number}`)
  return reading
}

type Explore = Pick<TESTS_ADMINISTERED,
  'STUDENT_NUMBER' |
  'GRADE' |
  'SORT_DATE' |
  'SORT_GRADE'
  > & Pick<TESTS_EXPLTEST,
  'SCHOOL_NAME' |
  'ENGLISH_SCR' |
  'MATH_SCR' |
  'READING_SCR' |
  'SCIENCE_SCR' |
  'COMPOSITE_SCR' |
  'SUBSCORE_UM' |
  'SUBSCORE_RH' |
  'ENGLISH_NAT_PERC' |
  'MATH_NAT_PERC' |
  'READING_NAT_PERC' |
  'SCIENCE_NAT_PERC' |
  'COMPOSITE_NAT_PERC' |
  'NAT_PERC_UM' |
  'NAT_PERC_RH' |
  'ENGLISH_LOC_PERC' |
  'MATH_LOC_PERC' |
  'READING_LOC_PERC' |
  'SCIENCE_LOC_PERC' |
  'COMPOSITE_LOC_PERC' |
  'LOC_PERC_UM' |
  'LOC_PERC_RH'
>

export const explore = async (student_number: number): Promise<Explore[]> => {
  const explore = (await prisma.$queryRaw<Explore[]>`EXECUTE ECUM_Report_Student.ecum_queries.explore ${student_number}`)
  return explore
}



export const queries = {
  studentNumbers,
  studentDataTranscript,
  studentDataTests, 
  ecum,
  demo,
  misc,
  yearsGrade,
  fallClassHst,
  springClassHst,
  elemGrd,
  attend,
  mobility,
  addressHistory,
  admin,
  otis,
  reading,
  explore,
  studentPersonalDataReport,
  spd_Mobility,
  spd_Immunizations,
  spd_SpecialEdActive,
  spd_SpecialEdInactive,
  spd_Suspensions,
  spd_Demo,
}
export default queries
