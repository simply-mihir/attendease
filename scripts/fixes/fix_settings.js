const fs = require('fs');

const files = [
  { path: 'src/app/(app)/settings/goal/page.tsx', title: 'Loading goal', icon: '🎯' },
  { path: 'src/app/(app)/settings/semesters/page.tsx', title: 'Loading semesters', icon: '🎓' },
  { path: 'src/app/(app)/settings/notifications/page.tsx', title: 'Loading notifications', icon: '🔔' },
  { path: 'src/app/(app)/forecast/page.tsx', title: 'Loading forecast', icon: '🔮' },
];

for (const { path, title, icon } of files) {
  if (!fs.existsSync(path)) continue;
  
  let content = fs.readFileSync(path, 'utf8');

  if (!content.includes('import { FuturisticLoader }')) {
    content = content.replace(/(import .*;\n)/, "$1import { FuturisticLoader } from \"@/components/FuturisticLoader\";\n");
  }

  // Common pattern
  content = content.replace(/if\s*\([^)]*(loading|isLoading|pageLoading)[^)]*\)\s*\{[\s\S]*?return\s*\([\s\S]*?(animate-fade-in|animate-pulse)[\s\S]*?<\/[a-z]+>\s*\);\s*\}/,
    `if ($1) {\n    return <FuturisticLoader variant="section" title="${title}" icon="${icon}" />;\n  }`);

  fs.writeFileSync(path, content);
}
