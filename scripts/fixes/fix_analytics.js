const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/analytics/page.tsx', 'utf8');

if (!content.includes('import { FuturisticLoader }')) {
  content = content.replace(/(import .*;\n)/, "$1import { FuturisticLoader } from \"@/components/FuturisticLoader\";\n");
}

content = content.replace(/if\s*\(loading\s*\|\|\s*!dashboard\)\s*\{[\s\S]*?return\s*\([\s\S]*?className="space-y-6 animate-fade-in"[\s\S]*?<\/[a-z]+>\s*\);\s*\}/,
  `if (loading || !dashboard) {\n    return <FuturisticLoader variant="section" title="Crunching numbers" icon="📈" />;\n  }`);

fs.writeFileSync('src/app/(app)/analytics/page.tsx', content);
