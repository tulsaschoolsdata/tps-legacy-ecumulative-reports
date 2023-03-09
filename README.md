# TPS Legacy Electronic Cumulative Reports

Tool to generate PDF reports for legacy Electronic Cumulative transcripts and test scores.

- Source data is in a Microsoft SQL Server database.
- Original report tool was created in SAP BusinessObjects InfoView Web Intelligence reports.

## Environment Variables

```properties
# .env
ECUM_REPORT_STUDENT_DATABASE_URL=sqlserver://••••••••\ARCHIVE;database=ECUM_Report_Student;user=••••••••;password=••••••••;trustServerCertificate=true;
MFLEGACY_STUDENT_DATABASE_URL=sqlserver://••••••••\ARCHIVE;database=MFLegacy_Student;user=••••••••;password=••••••••;trustServerCertificate=true;
```

## Operation

Generate the prisma client code.

```console
$ npm ci && npx prisma generate
```

Run the script for specific student numbers.

```console
$ npx ts-node src/script.ts -- 1234005 1234006 1234007
Launching Browser…
Student Number Count: 3
progress [----------------------------------------] 0% | ETA: 0s | 0/1
```

Run the `script.ts` file to generate pdf files for all student numbers.

```console
$ npx ts-node src/script.ts
Launching Browser…
Student Number Count: 172012
progress [----------------------------------------] 0% | ETA: 1854s | 60/172012
```

Run the `generate_csv.ts` file to generate a csv containing metadata for all student numbers.

```console
$ npx ts-node src/generate_csv.ts
Launching Browser…
Student Number Count: 172012
```

Output files are generated in `out/`

```console
$ ls out | head -n4
280222.pdf
282051.pdf
284261.pdf
index.csv
```
