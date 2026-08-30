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
  "⏰": "Bell",
  "🔔": "Bell",
  "⬇️": "Download",
  "⬆️": "Upload",
};

// Fallback icon
const defaultIcon = "Loader2";

const files = glob.sync("src/**/loading.tsx");

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // check if it has FuturisticLoader
  if (content.includes('FuturisticLoader')) {
    let iconToImport = "Loader2";
    
    // Find icon="emoji" pattern
    const iconMatch = content.match(/icon="([^"]+)"/);
    if (iconMatch && iconMap[iconMatch[1]]) {
      iconToImport = iconMap[iconMatch[1]];
    } else {
      // try to infer from title or path
      if (file.includes('dashboard')) iconToImport = "LayoutDashboard";
      else if (file.includes('subjects')) iconToImport = "BookOpen";
      else if (file.includes('schedule')) iconToImport = "CalendarDays";
      else if (file.includes('analytics')) iconToImport = "BarChart3";
      else if (file.includes('calendar')) iconToImport = "Calendar";
      else if (file.includes('settings')) iconToImport = "Settings";
      else if (file.includes('semesters')) iconToImport = "GraduationCap";
      else if (file.includes('auth')) iconToImport = "Lock";
      else if (file.includes('forecast')) iconToImport = "TrendingUp";
      else if (file.includes('optimizer')) iconToImport = "Lightbulb";
      else if (file.includes('medical-leave')) iconToImport = "Stethoscope";
      else if (file.includes('groups')) iconToImport = "Users";
      else if (file.includes('simulator')) iconToImport = "Bot";
      else if (file.includes('export')) iconToImport = "Upload";
      else if (file.includes('import')) iconToImport = "Download";
      else if (file.includes('reminders')) iconToImport = "Bell";
      else iconToImport = "GraduationCap";
    }

    // Replace icon="emoji" with Icon={LucideComponent}
    content = content.replace(/icon="[^"]+"/g, `Icon={${iconToImport}}`);
    
    // If it didn't have an icon prop, add it
    if (!content.includes('Icon=')) {
      content = content.replace(/<FuturisticLoader /, `<FuturisticLoader Icon={${iconToImport}} `);
    }

    // Add import statement
    const importStmt = `import { ${iconToImport} } from "lucide-react";\n`;
    if (!content.includes(`from "lucide-react"`)) {
      content = importStmt + content;
    }

    fs.writeFileSync(file, content);
  }
}
console.log("Updated loading files");
