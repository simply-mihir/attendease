const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/medical-leave/page.tsx', 'utf8');

content = content.replace(/if\s*\(loading\)\s*\{[\s\S]*?return\s*\([\s\S]*?className="max-w-2xl mx-auto space-y-6 animate-fade-in"[\s\S]*?<\/[a-z]+>\s*\);\s*\}/,
  `if (loading) {\n    return <FuturisticLoader variant="section" title="Loading medical leave" icon="🏥" />;\n  }`);

fs.writeFileSync('src/app/(app)/medical-leave/page.tsx', content);
