const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/reminders/page.tsx', 'utf8');

if (!content.includes('import { FuturisticLoader }')) {
  content = content.replace(/(import .*;\n)/, "$1import { FuturisticLoader } from \"@/components/FuturisticLoader\";\n");
}

content = content.replace(/\{loading \? \(\s*<div className="space-y-3">\s*\{\[1, 2, 3\]\.map\(\(i\) => \(\s*<div key=\{i\} className="h-20 glass rounded-2xl animate-pulse" \/>\s*\)\)\}\s*<\/div>\s*\)/,
  `{loading ? (\n        <FuturisticLoader variant="section" title="Loading reminders" icon="⏰" />\n      )`);

fs.writeFileSync('src/app/(app)/reminders/page.tsx', content);
