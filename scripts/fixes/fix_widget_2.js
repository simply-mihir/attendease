const fs = require('fs');
let content = fs.readFileSync('src/app/(widget)/widget/page.tsx', 'utf8');

content = content.replace(/if\s*\(loading\)\s*\{[\s\S]*?return\s*\([\s\S]*?className="space-y-3 animate-fade-in"[\s\S]*?<\/[a-z]+>\s*\);\s*\}/,
  `if (loading) {\n    return <FuturisticLoader variant="section" title="Loading widget..." icon="📱" />;\n  }`);

fs.writeFileSync('src/app/(widget)/widget/page.tsx', content);
