const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/calendar/page.tsx', 'utf8');

if (!content.includes('Calendar')) {
   content = content.replace(
      'from "lucide-react";',
      ', Calendar } from "lucide-react";'
   );
} else if (!content.match(/Calendar[,}]/)) { // If Calendar is not in the lucide-react import
   content = content.replace(
      'Timer } from "lucide-react";',
      'Timer, Calendar } from "lucide-react";'
   );
}

fs.writeFileSync('src/app/(app)/calendar/page.tsx', content);
