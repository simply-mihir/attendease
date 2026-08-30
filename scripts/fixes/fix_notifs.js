const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/settings/notifications/page.tsx', 'utf8');

// Find the function and remove it
content = content.replace(/\/\* ===== SKELETON ===== \*\/[\s\S]*?function NotifSettingsSkeleton\(\) \{[\s\S]*?\}(?=\n|$)/, "");

fs.writeFileSync('src/app/(app)/settings/notifications/page.tsx', content);
