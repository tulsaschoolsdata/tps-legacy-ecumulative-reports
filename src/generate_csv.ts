import { stringify as csvStringify } from 'csv-stringify'
import fs from 'fs/promises'
import { PrismaClient } from '@prisma/client'
import type { STUDENT } from '@prisma/client'

export const prisma = new PrismaClient()

type StudentNumberNameDob = Pick<
  STUDENT,
  | 'STUDENT_NUMBER'
  | 'STUDENT_LNAME'
  | 'STUDENT_FNAME'
  | 'STUDENT_MI'
  | 'STUDENT_BIRTHDATE'
>

const studentsData = async (): Promise<StudentNumberNameDob[]> =>
  await prisma.$queryRaw<
    StudentNumberNameDob[]
  >`SELECT STUDENT_NUMBER,rtrim(STUDENT_LNAME) as STUDENT_LNAME,rtrim(STUDENT_FNAME) as STUDENT_FNAME,rtrim(STUDENT_MI) as STUDENT_MI,STUDENT_BIRTHDATE FROM ECUM_Report_Student.ECUM.STUDENT`

async function generateCSV(): Promise<void> {
  const queryResults = await studentsData()

  await fs.writeFile(
    'index.csv',
    csvStringify(queryResults, {
      header: true,
      columns: [
        'STUDENT_NUMBER',
        'STUDENT_LNAME',
        'STUDENT_FNAME',
        'STUDENT_MI',
        'STUDENT_BIRTHDATE',
      ],
    })
  )
}

generateCSV()
