const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/semesters/page.tsx', 'utf8');

if (!content.includes('import { FuturisticLoader }')) {
  content = content.replace(/(import .*;\n)/, "$1import { FuturisticLoader } from \"@/components/FuturisticLoader\";\n");
}

content = content.replace(/if\s*\(isLoading\)\s*\{[\s\S]*?return\s*\([\s\S]*?className="max-w-4xl mx-auto space-y-6 animate-fade-in"[\s\S]*?<\/[a-z]+>\s*\);\s*\}/,
  `if (isLoading) {\n    return <FuturisticLoader variant="section" title="Loading semesters" icon="🎓" />;\n  }`);

fs.writeFileSync('src/app/(app)/semesters/page.tsx', content);
