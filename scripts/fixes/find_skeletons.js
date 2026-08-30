const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchFiles(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Skeleton')) {
        console.log(`Found in: ${fullPath}`);
        // print lines containing Skeleton
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('Skeleton')) {
            console.log(`  ${i + 1}: ${line}`);
          }
        });
      }
    }
  }
}
searchFiles('src');
