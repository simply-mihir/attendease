const fs = require('fs');
const path = require('path');

const config = {
  'src/app/(app)/loading.tsx': { title: 'Loading', icon: '🎓' },
  'src/app/(app)/dashboard/loading.tsx': { title: 'Loading your dashboard', icon: '📊' },
  'src/app/(app)/subjects/loading.tsx': { title: 'Loading subjects', icon: '📚' },
  'src/app/(app)/schedule/loading.tsx': { title: 'Loading schedule', icon: '📅' },
  'src/app/(app)/analytics/loading.tsx': { title: 'Crunching numbers', icon: '📈' },
  'src/app/(app)/calendar/loading.tsx': { title: 'Loading calendar', icon: '🗓️' },
  'src/app/(app)/settings/loading.tsx': { title: 'Loading settings', icon: '⚙️' },
  'src/app/(app)/semesters/loading.tsx': { title: 'Loading semesters', icon: '🎓' },
  'src/app/(auth)/loading.tsx': { title: 'Preparing login', icon: '🔐' },
  'src/app/(app)/forecast/loading.tsx': { title: 'Loading forecast', icon: '🔮' },
  'src/app/(app)/settings/semesters/loading.tsx': { title: 'Loading semesters', icon: '🎓' },
  'src/app/(app)/settings/notifications/loading.tsx': { title: 'Loading notifications', icon: '🔔' },
  'src/app/(app)/settings/goal/loading.tsx': { title: 'Loading goal', icon: '🎯' },
  'src/app/(app)/optimizer/loading.tsx': { title: 'Loading optimizer', icon: '⚡' },
  'src/app/(app)/medical-leave/loading.tsx': { title: 'Loading medical leave', icon: '🏥' },
  'src/app/(app)/groups/loading.tsx': { title: 'Loading groups', icon: '👥' },
  'src/app/(app)/semesters/[id]/dashboard/loading.tsx': { title: 'Loading dashboard', icon: '📊' },
  'src/app/(app)/simulator/loading.tsx': { title: 'Loading simulator', icon: '🧪' },
  'src/app/(app)/subjects/new/loading.tsx': { title: 'Loading', icon: '➕' },
  'src/app/(app)/subjects/[id]/loading.tsx': { title: 'Loading subject', icon: '📚' },
  'src/app/(app)/export/loading.tsx': { title: 'Loading export', icon: '📥' },
  'src/app/(app)/import/loading.tsx': { title: 'Loading import', icon: '📤' },
  'src/app/(app)/reminders/loading.tsx': { title: 'Loading reminders', icon: '⏰' },
};

Object.entries(config).forEach(([file, { title, icon }]) => {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const compName = file
    .replace('src/app/', '')
    .replace(/\/[a-z]/g, match => match.substring(1).toUpperCase())
    .replace(/[^a-zA-Z]/g, '')
    + 'Loading';

  const content = `import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function ${compName}() {
  return <FuturisticLoader title="${title}" icon="${icon}" variant="full" />;
}
`;
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
