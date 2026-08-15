const fs = require('fs');
const file = './src/lib/chatbot.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace all asterisks used for bolding in template literals inside formatFallback
// It's safer to just replace *text* with **text** everywhere in that function.
// Or just write a simple replacer script since doing it via replace_file_content requires perfect line counts.

// Let's just find and replace the typical bold patterns:
code = code.replace(/\*Schedule:\*/g, '**Schedule:**');
code = code.replace(/\*Schedule for (.*?)\*/g, '**Schedule for $1**');
code = code.replace(/\*\$\{idx\}\. \$\{c.subjectName\}\*/g, '**${idx}. ${c.subjectName}**');
code = code.replace(/\*Summary:\*/g, '**Summary:**');
code = code.replace(/\*Attendance recorded successfully\.\*/g, '**Attendance recorded successfully.**');
code = code.replace(/\*Bulk attendance recorded successfully\.\*/g, '**Bulk attendance recorded successfully.**');
code = code.replace(/\*\$\{s.name\}\*/g, '**${s.name}**');
code = code.replace(/\*Attendance Analytics Overview\*/g, '**Attendance Analytics Overview**');
code = code.replace(/\*\$\{result.overallPct\}%\*/g, '**${result.overallPct}%**');
code = code.replace(/\*Subject-wise details:\*/g, '**Subject-wise details:**');
code = code.replace(/\*Immediate attention required for:\*/g, '**Immediate attention required for:**');
code = code.replace(/\*Subject Report: (.*?)\*/g, '**Subject Report: $1**');
code = code.replace(/\*Good news!\*/g, '**Good news!**');
code = code.replace(/\*Recovery plan:\*/g, '**Recovery plan:**');
code = code.replace(/\*Weekly schedule:\*/g, '**Weekly schedule:**');
code = code.replace(/\*Skip Optimizer Result\*/g, '**Skip Optimizer Result**');
code = code.replace(/\*\$\{r.subjectName\}\*/g, '**${r.subjectName}**');
code = code.replace(/\*Recommended allocation:\*/g, '**Recommended allocation:**');
code = code.replace(/\*Do not skip:\*/g, '**Do not skip:**');
code = code.replace(/\*Schedule Override Confirmed\*/g, '**Schedule Override Confirmed**');
code = code.replace(/\*Attendance History\*/g, '**Attendance History**');
code = code.replace(/\*Attendance History \(last (.*?)\)\*/g, '**Attendance History (last $1)**');

fs.writeFileSync(file, code);
console.log('Fixed markdown asterisks.');
