const fs = require('fs');
const glob = require('glob');

const files = glob.sync("src/**/*.{tsx,ts}");

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('} , ')) {
    content = content.replace(/} , ([a-zA-Z]+) } from "lucide-react";/g, ', $1 } from "lucide-react";');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log("Fixed syntax in", file);
  }
}
