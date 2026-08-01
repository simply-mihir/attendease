const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/import/page.tsx', 'utf8');

if (!content.includes('import { FuturisticLoader }')) {
  content = content.replace(/(import .*;\n)/, "$1import { FuturisticLoader } from \"@/components/FuturisticLoader\";\n");
}

content = content.replace(/\{analyzing && \(\s*<div className="glass rounded-2xl p-6 text-center animate-pulse">[\s\S]*?<\/div>\s*\)\}/,
  `{analyzing && (\n            <FuturisticLoader variant="section" title="AI is reading your timetable..." icon="✨" />\n          )}`);

fs.writeFileSync('src/app/(app)/import/page.tsx', content);
