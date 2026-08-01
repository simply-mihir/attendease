const fs = require('fs');
const glob = require('glob');

const iconMap = {
  "🎓": "GraduationCap",
  "📊": "BarChart3",
  "📚": "BookOpen",
  "📅": "CalendarDays",
  "📈": "TrendingUp",
  "🗓️": "Calendar",
  "⚙️": "Settings",
  "🔐": "Lock",
  "🎯": "Target",
  "🔥": "Flame",
  "⚠️": "AlertTriangle",
  "✅": "CheckCircle",
  "📋": "ClipboardList",
  "📝": "FileEdit",
  "🎉": "Sparkles",
  "🌍": "Globe",
  "🕐": "Clock",
  "⏰": "AlarmClock",
  "📖": "BookOpen",
  "☀️": "Sun",
  "✨": "Sparkles",
  "🔍": "Search",
  "🤖": "Bot",
  "🚀": "Rocket",
  "👥": "Users",
  "🩺": "Stethoscope",
  "💡": "Lightbulb",
  "🔔": "Bell",
  "⬇️": "Download",
  "⬆️": "Upload",
  "🧪": "TestTube",
  "🏥": "Hospital",
  "🔮": "Sparkles",
  "📱": "Smartphone",
  "⚡": "Zap",
  "📥": "Download",
};

const files = glob.sync("src/**/*.{tsx,ts}");

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('FuturisticLoader') && content.match(/icon="([^"]+)"/)) {
    const matches = [...content.matchAll(/icon="([^"]+)"/g)];
    let importsToAdd = new Set();
    
    for (const match of matches) {
      const emoji = match[1];
      let iconToImport = iconMap[emoji] || "Loader2";
      
      content = content.replace(`icon="${emoji}"`, `Icon={${iconToImport}}`);
      importsToAdd.add(iconToImport);
      changed = true;
    }
    
    if (changed) {
      // Add missing imports safely at the top
      let newImports = [];
      for (const icon of importsToAdd) {
        if (!content.includes(icon)) {
           newImports.push(icon);
        }
      }
      
      if (newImports.length > 0) {
        const importLine = `import { ${newImports.join(', ')} } from "lucide-react";\n`;
        if (content.startsWith('"use client";')) {
           content = content.replace('"use client";\n', `"use client";\n${importLine}`);
        } else {
           content = importLine + content;
        }
      }

      fs.writeFileSync(file, content);
      console.log("Updated", file);
    }
  }
}
