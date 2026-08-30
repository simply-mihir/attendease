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
      // Add missing imports
      for (const icon of importsToAdd) {
        if (!content.includes(icon)) {
          if (content.includes('from "lucide-react"')) {
            content = content.replace(/from "lucide-react"/, `, ${icon} } from "lucide-react"`);
            content = content.replace(/{\s*,/, '{ '); // fix if we accidentally created { ,
          } else {
            content = `import { ${icon} } from "lucide-react";\n` + content;
          }
        }
      }
      fs.writeFileSync(file, content);
      console.log("Updated", file);
    }
  }
}
