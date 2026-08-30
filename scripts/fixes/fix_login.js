const fs = require('fs');
let content = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8');

if (!content.includes('GraduationCap')) {
    content = content.replace(
        'import { LogIn',
        'import { LogIn, GraduationCap'
    );
}
content = content.replace(
    '<span className="text-2xl">🎓</span>',
    '<GraduationCap className="h-7 w-7 text-white" />'
);

fs.writeFileSync('src/app/(auth)/login/page.tsx', content);
