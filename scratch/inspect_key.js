const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (key) {
    console.log('Key length:', key.length);
    let hex = '';
    for (let i = 0; i < key.length; i++) {
        hex += key.charCodeAt(i).toString(16) + ' ';
    }
    console.log('Key Hex:', hex);
    
    // Check if there are any non-printable chars
    const nonPrintable = [];
    for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        if (char < 32 || char > 126) {
            nonPrintable.push({ index: i, char: char });
        }
    }
    console.log('Non-printable chars:', nonPrintable);
} else {
    console.log('Key not found');
}
