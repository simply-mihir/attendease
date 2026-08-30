const fs = require('fs');
const filesToFix = [
  { file: 'src/app/(app)/forecast/page.tsx', icon: 'Sparkles' },
  { file: 'src/app/(app)/medical-leave/page.tsx', icon: 'Hospital' },
  { file: 'src/app/(app)/reminders/page.tsx', icon: 'AlarmClock' },
  { file: 'src/app/(app)/semesters/[id]/page.tsx', icon: 'GraduationCap' },
  { file: 'src/app/(app)/settings/semesters/page.tsx', icon: 'GraduationCap' },
  { file: 'src/app/(app)/simulator/page.tsx', icon: 'TestTube' },
  { file: 'src/app/(app)/subjects/[id]/page.tsx', icon: 'BookOpen' },
  { file: 'src/app/(auth)/login/page.tsx', icon: 'GraduationCap' },
  { file: 'src/app/(widget)/widget/page.tsx', icon: 'Smartphone' },
  { file: 'src/components/DashboardView.tsx', icon: 'BarChart3' }
];

for (const { file, icon } of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('from "lucide-react"')) {
     content = content.replace(/from "lucide-react"/, `, ${icon} } from "lucide-react"`);
  } else {
     if (content.startsWith('"use client";')) {
         content = content.replace('"use client";', `"use client";\nimport { ${icon} } from "lucide-react";`);
     } else {
         content = `import { ${icon} } from "lucide-react";\n` + content;
     }
  }
  
  fs.writeFileSync(file, content);
  console.log("Fixed missing import in", file);
}
