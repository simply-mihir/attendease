const fs = require('fs');

let content = fs.readFileSync('src/components/FuturisticLoader.tsx', 'utf8');

// Add import
content = content.replace(
  'import { useEffect, useState } from "react";',
  'import { useEffect, useState } from "react";\nimport { LucideIcon, GraduationCap } from "lucide-react";'
);

// Update interface
content = content.replace(
  /icon\?: string; \s*\/\/ emoji icon for center, default 🎓/,
  'Icon?: LucideIcon; // Changed from emoji string to Lucide component'
);

// Update props
content = content.replace(
  /icon = "🎓",/,
  'Icon = GraduationCap,'
);

// Update usages
// Inline variant
content = content.replace(
  /<span className="text-xs">\{icon\}<\/span>/,
  '<Icon className="h-3 w-3 text-white" />'
);

// Section variant
content = content.replace(
  /<span className="text-lg">\{icon\}<\/span>/,
  '<Icon className="h-5 w-5 text-white" />'
);

// Full variant
content = content.replace(
  /<span className="text-2xl">\{icon\}<\/span>/,
  '<Icon className="h-6 w-6 text-white" />'
);

fs.writeFileSync('src/components/FuturisticLoader.tsx', content);
