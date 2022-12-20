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

```console
$ npm ci && npx prisma generate
$ npx ts-node src/script.ts
Launching Browser…
Student Number Count: 172012
progress [----------------------------------------] 0% | ETA: 1854s | 60/172012
```

Output files are generated in `out/`

```console
$ ls out | head -n3
280222.pdf
282051.pdf
284261.pdf
```
