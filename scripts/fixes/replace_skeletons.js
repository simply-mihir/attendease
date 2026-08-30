const fs = require('fs');

function processFile(file, title, icon) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add import if not exists
  if (!content.includes('import { FuturisticLoader }')) {
    content = content.replace(/(import .*;\n)/, "$1import { FuturisticLoader } from \"@/components/FuturisticLoader\";\n");
  }

  // Replace page-level loading patterns
  // Pattern 1: if (loading) return <SomethingSkeleton />;
  content = content.replace(/if\s*\([^)]*loading[^)]*\)\s*\{\s*return\s*<[A-Za-z]+Skeleton\s*\/>;?\s*\}/g, 
    `if (loading) { return <FuturisticLoader variant="section" title="${title}" icon="${icon}" />; }`);

  // Pattern 2: if (loading) { return ( <div animate-pulse ... ); }
  content = content.replace(/if\s*\([^)]*(loading|isLoading|!dashboard|pageLoading)[^)]*\)\s*\{\s*return\s*\(\s*<div[^>]*animate-pulse[^]*?;\s*\}/g,
    `if ($1) { return <FuturisticLoader variant="section" title="${title}" icon="${icon}" />; }`);

  fs.writeFileSync(file, content);
}

// Need to do this manually for files with complex skeletons... I will write a custom regex script.

