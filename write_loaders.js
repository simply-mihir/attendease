const fs = require('fs');
const path = require('path');

const loaders = [
  { dir: 'src/app/(app)/subjects', title: 'Loading subjects', icon: '📚' },
  { dir: 'src/app/(app)/calendar', title: 'Loading calendar', icon: '🗓️' },
  { dir: 'src/app/(app)/analytics', title: 'Crunching numbers', icon: '📈' },
  { dir: 'src/app/(app)/settings', title: 'Loading settings', icon: '⚙️' },
  { dir: 'src/app/(app)/semesters', title: 'Loading semesters', icon: '🎓' },
  { dir: 'src/app/(app)/groups', title: 'Loading friends', icon: '👥' },
  { dir: 'src/app/(app)/optimizer', title: 'Optimizing schedule', icon: '⚡' },
  { dir: 'src/app/(app)/simulator', title: 'Running simulation', icon: '🎮' },
  { dir: 'src/app/(app)/medical-leave', title: 'Loading medical leave', icon: '🏥' },
  { dir: 'src/app/(app)/export', title: 'Preparing export', icon: '📥' },
  { dir: 'src/app/(app)/import', title: 'Preparing import', icon: '📤' },
  { dir: 'src/app/(app)/reminders', title: 'Loading reminders', icon: '🔔' },
  { dir: 'src/app/(app)/forecast', title: 'Loading forecast', icon: '🔮' },
  { dir: 'src/app/(auth)', title: 'Preparing login', icon: '🔐' },
];

for (const loader of loaders) {
  const content = `import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function Loading() {
  return <FuturisticLoader title="${loader.title}" icon="${loader.icon}" variant="full" />;
}
`;
  const dirPath = path.join(__dirname, loader.dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(path.join(dirPath, 'loading.tsx'), content);
}
console.log('Loaders created successfully');
