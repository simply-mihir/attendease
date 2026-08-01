const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/subjects/page.tsx', 'utf8');

if (!content.includes('import { FuturisticLoader }')) {
  content = content.replace(/(import .*;\n)/, "$1import { FuturisticLoader } from \"@/components/FuturisticLoader\";\n");
}

content = content.replace(/\{loading \? \(\s*<SubjectsSkeleton \/>\s*\)/,
  `{loading ? (\n        <FuturisticLoader variant="section" title="Loading subjects" icon="📚" />\n      )`);

content = content.replace(/import\s*\{\s*SubjectsSkeleton\s*\}\s*from\s*"@\/components\/Skeleton";?\n/, "");

fs.writeFileSync('src/app/(app)/subjects/page.tsx', content);
