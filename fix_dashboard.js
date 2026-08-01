const fs = require('fs');

let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');
if (!content.includes('import { FuturisticLoader }')) {
  content = content.replace(/(import .*;\n)/, "$1import { FuturisticLoader } from \"@/components/FuturisticLoader\";\n");
}

content = content.replace(/if\s*\(loading\)\s*\{\s*return\s*<DashboardSkeleton[^>]*>;?\s*\}/,
  `if (loading) {\n    return <FuturisticLoader variant="section" title="Loading your dashboard" icon="📊" />;\n  }`);

content = content.replace(/{loadingImportable \? \(\s*<div className="space-y-3 animate-pulse">[\s\S]*?<\/div>\s*\)\s*:\s*\(/,
  `{loadingImportable ? (\n                <FuturisticLoader variant="inline" title="Loading subjects" icon="📚" />\n              ) : (`);

// Remove DashboardSkeleton import
content = content.replace(/import\s*\{\s*DashboardSkeleton\s*\}\s*from\s*"@\/components\/Skeleton";?\n/, "");

fs.writeFileSync('src/components/DashboardView.tsx', content);
