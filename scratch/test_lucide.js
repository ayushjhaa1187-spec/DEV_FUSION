const lucide = require('lucide-react');
console.log('ShieldCheck' in lucide);
console.log('UserCheck' in lucide);
console.log('Timer' in lucide);
console.log(Object.keys(lucide).filter(k => k.includes('Check')));
