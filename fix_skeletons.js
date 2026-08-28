const fs = require('fs');

function removeUnusedImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/import\s+{\s*Skeleton\s*}\s+from\s+"@\/components\/Skeleton";?\n?/g, '');
  fs.writeFileSync(filePath, content);
}

function replaceSkeletonFunction(filePath, skeletonFuncName, newReturnCode) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Find function skeletonFuncName() { ... }
  // We can use a regex to match the function declaration up to the closing brace,
  // assuming the skeleton function doesn't have nested top-level braces or just match it carefully.
  const regex = new RegExp(`function ${skeletonFuncName}\\(\\) \\{[\\s\\S]*?\\n\\}\\n?`, 'g');
  content = content.replace(regex, '');
  
  // Replace the usage: return <SkeletonFuncName />;
  const usageRegex = new RegExp(`return <${skeletonFuncName} \\/>;?`, 'g');
  content = content.replace(usageRegex, newReturnCode);
  
  fs.writeFileSync(filePath, content);
}

// 1. Remove unused imports
removeUnusedImports('src/app/(app)/analytics/page.tsx');
removeUnusedImports('src/app/(app)/forecast/page.tsx');
removeUnusedImports('src/app/(app)/optimizer/page.tsx');

// 2. Replace custom skeletons
replaceSkeletonFunction(
  'src/app/(app)/export/page.tsx', 
  'ExportSkeleton', 
  'return <FuturisticLoader title="Loading export..." variant="full" />;'
);
replaceSkeletonFunction(
  'src/app/(app)/medical-leave/page.tsx', 
  'MedicalLeaveSkeleton', 
  'return <FuturisticLoader title="Loading medical leave..." variant="full" />;'
);
replaceSkeletonFunction(
  'src/app/(app)/semesters/[id]/page.tsx', 
  'SemesterSkeleton', 
  'return <FuturisticLoader title="Loading semester details..." variant="full" />;'
);
replaceSkeletonFunction(
  'src/app/(app)/settings/goal/page.tsx', 
  'SettingsGoalSkeleton', 
  'return <FuturisticLoader title="Loading goals..." variant="full" />;'
);
replaceSkeletonFunction(
  'src/app/(app)/settings/notifications/page.tsx', 
  'SettingsNotificationsSkeleton', 
  'return <FuturisticLoader title="Loading notifications..." variant="full" />;'
);
replaceSkeletonFunction(
  'src/app/(app)/settings/semesters/page.tsx', 
  'SettingsSemestersSkeleton', 
  'return <FuturisticLoader title="Loading settings..." variant="full" />;'
);
replaceSkeletonFunction(
  'src/app/(app)/subjects/[id]/page.tsx', 
  'SubjectSkeleton', 
  'return <FuturisticLoader title="Loading subject..." variant="full" />;'
);

console.log("Done fixing skeletons");
