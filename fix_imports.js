const fs = require('fs');

let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// The duplicate imports are on line 3:
// import { TrendingUp, BookOpen, Flame, AlertTriangle, Target, ChevronRight, ArrowDown, Plus, GraduationCap } from "lucide-react";
// Let's just remove that line. We can add missing ones to the main lucide-react import.

content = content.replace('import { TrendingUp, BookOpen, Flame, AlertTriangle, Target, ChevronRight, ArrowDown, Plus, GraduationCap } from "lucide-react";\n', '');

// Then we find the main lucide-react import and add ChevronRight, ArrowDown, GraduationCap, which were likely missing
content = content.replace(
  'import {\n  Plus, Clock, MapPin, Flame, AlertTriangle, CheckCircle2, XCircle,\n  Timer, TrendingUp, BookOpen, ArrowRight, Sparkles, Zap, Ban, Target, ChevronDown, Camera, Download\n} from "lucide-react";',
  'import {\n  Plus, Clock, MapPin, Flame, AlertTriangle, CheckCircle2, XCircle,\n  Timer, TrendingUp, BookOpen, ArrowRight, Sparkles, Zap, Ban, Target, ChevronDown, Camera, Download, ChevronRight, ArrowDown, GraduationCap\n} from "lucide-react";'
);

// Fallback if formatting was slightly different
if (!content.includes('ChevronRight, ArrowDown, GraduationCap')) {
   content = content.replace(
     '} from "lucide-react";',
     '  ,ChevronRight, ArrowDown, GraduationCap } from "lucide-react";'
   );
}

fs.writeFileSync('src/components/DashboardView.tsx', content);
