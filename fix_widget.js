const fs = require('fs');

let content = fs.readFileSync('src/app/(widget)/widget/page.tsx', 'utf8');

if (!content.includes('import { FuturisticLoader }')) {
  content = content.replace(/(import .*;\n)/, "$1import { FuturisticLoader } from \"@/components/FuturisticLoader\";\n");
}

content = content.replace(/if\s*\(!mounted\s*\|\|\s*loading\)\s*\{[\s\S]*?return\s*\([\s\S]*?className="space-y-3 animate-fade-in"[\s\S]*?<\/[a-z]+>\s*\);\s*\}/,
  `if (!mounted || loading) {\n    return <FuturisticLoader variant="section" title="Loading widget..." icon="📱" />;\n  }`);

fs.writeFileSync('src/app/(widget)/widget/page.tsx', content);
