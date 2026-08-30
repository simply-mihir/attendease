const fs = require('fs');
const path = require('path');

function patchFile(filePath, regexToFind, newContent, importStatement) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(importStatement)) {
    content = importStatement + '\n' + content;
  }
  content = content.replace(regexToFind, newContent);
  fs.writeFileSync(filePath, content);
  console.log(`Patched ${filePath}`);
}

// 1. bulk/route.ts
patchFile(
  'src/app/api/v1/attendance/bulk/route.ts',
  /return Response\.json\(\{\ records:\ results,\ count:\ results\.length\ \},\ \{\ status:\ 201\ \}\);/,
  `notifyUserModification(user.id, "Bulk Attendance Saved", \`Successfully recorded \${results.length} attendance updates across \${subjectIds.length} subjects.\`).catch(console.error);
    return Response.json({ records: results, count: results.length }, { status: 201 });`,
  'import { notifyUserModification } from "@/lib/attendance-notifier";'
);

// 2. holidays/route.ts
patchFile(
  'src/app/api/v1/semesters/[id]/holidays/route.ts',
  /return NextResponse\.json\(created,\ \{\ status:\ 201\ \}\);/,
  `if (created.length > 0) {
    const title = created.length === 1 ? "Holiday Marked" : "Holidays Marked";
    const msg = created.length === 1 ? \`\${created[0].name} on \${created[0].date.toDateString()}\` : \`\${created.length} holidays added.\`;
    notifyUserModification(user.id, title, msg).catch(console.error);
  }
  return NextResponse.json(created, { status: 201 });`,
  'import { notifyUserModification } from "@/lib/attendance-notifier";'
);

// 3. medical-leave/route.ts
patchFile(
  'src/app/api/v1/attendance/medical-leave/route.ts',
  /return Response\.json\(\{[\s\S]*?marked:\ upsertPromises\.length,[\s\S]*?subjects:\ affectedSubjectNames,[\s\S]*?\}\);/,
  `notifyUserModification(user.id, "Medical Leave Approved", \`Duration: \${start.toDateString()} to \${end.toDateString()}\\nReason: \${reason}\\nRecords updated: \${upsertPromises.length}\`).catch(console.error);
    return Response.json({
      marked: upsertPromises.length,
      subjects: affectedSubjectNames,
    });`,
  'import { notifyUserModification } from "@/lib/attendance-notifier";'
);

// 4. schedule-override/route.ts
patchFile(
  'src/app/api/v1/schedule-override/route.ts',
  /return Response\.json\(record\);/,
  `const overridesText = overrides.length === 1 ? \`1 override applied on \${overrides[0].date.toDateString()}\` : \`\${overrides.length} overrides applied.\`;
    notifyUserModification(user.id, "Schedule Modified", overridesText).catch(console.error);
    return Response.json(record);`,
  'import { notifyUserModification } from "@/lib/attendance-notifier";'
);

// 5. chatbot.ts (needs multiple replaces inside switch)
let chatbotContent = fs.readFileSync('src/lib/chatbot.ts', 'utf8');
if (!chatbotContent.includes('notifyUserModification')) {
  chatbotContent = chatbotContent.replace('import { notifyAttendanceMarked }', 'import { notifyAttendanceMarked, notifyUserModification }');
  
  // mark_bulk_attendance
  chatbotContent = chatbotContent.replace(
    /result = await execMarkBulkAttendance\(user\.id, params\.status\);\s+if \(result\.success\) actions\.push\("attendance_marked"\);/,
    `result = await execMarkBulkAttendance(user.id, params.status);
        if (result.success) {
          actions.push("attendance_marked");
          notifyUserModification(user.id, "Bulk Attendance", \`Marked all classes today as \${params.status.toUpperCase()}\`).catch(console.error);
        }`
  );
  
  // mark_holiday
  chatbotContent = chatbotContent.replace(
    /result = await execMarkHoliday\(user\.id, params\.date, params\.name \|\| "Holiday"\);\s+if \(result\.success\) actions\.push\("schedule_changed"\);/,
    `result = await execMarkHoliday(user.id, params.date, params.name || "Holiday");
        if (result.success) {
          actions.push("schedule_changed");
          notifyUserModification(user.id, "Holiday Marked", \`\${result.name} on \${result.date}\`).catch(console.error);
        }`
  );

  // mark_medical_leave
  chatbotContent = chatbotContent.replace(
    /result = await execMarkMedicalLeave\(user\.id, params\.startDate, params\.endDate \|\| params\.startDate, params\.reason \|\| "Medical Leave"\);\s+if \(result\.success\) actions\.push\("attendance_marked"\);/,
    `result = await execMarkMedicalLeave(user.id, params.startDate, params.endDate || params.startDate, params.reason || "Medical Leave");
        if (result.success) {
          actions.push("attendance_marked");
          notifyUserModification(user.id, "Medical Leave", \`Duration: \${result.start} to \${result.end}\\nReason: \${result.reason}\`).catch(console.error);
        }`
  );

  // schedule_override
  chatbotContent = chatbotContent.replace(
    /result = await execScheduleOverride\(user\.id, params, todayStr\);\s+if \(result\.success\) actions\.push\("schedule_changed"\);/,
    `result = await execScheduleOverride(user.id, params, todayStr);
        if (result.success) {
          actions.push("schedule_changed");
          notifyUserModification(user.id, "Schedule Modified", \`\${params.action.toUpperCase()} action processed successfully.\`).catch(console.error);
        }`
  );

  fs.writeFileSync('src/lib/chatbot.ts', chatbotContent);
  console.log('Patched chatbot.ts');
}
