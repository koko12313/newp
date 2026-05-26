const fs = require('fs');
const html = fs.readFileSync('pinterest_dump.html', 'utf8');

// Check what we actually have in the dump
console.log('--- HTML length:', html.length);

// Try to find pin URLs in the page
const pinUrls = [...html.matchAll(/href="(\/pin\/\d+[^"]*?)"/g)].map(m => m[1]);
console.log('--- Pin URLs found:', pinUrls.length);
if (pinUrls.length > 0) console.log('First 3:', pinUrls.slice(0, 3));

// Check for image URLs from Pinterest CDN
const imgUrls = [...html.matchAll(/https:\/\/i\.pinimg\.com\/[^"'\\]+\.(jpg|png|gif|webp)/g)].map(m => m[0]);
console.log('--- Image URLs found:', imgUrls.length);
if (imgUrls.length > 0) console.log('First 3:', imgUrls.slice(0, 3));

// Check if page is a login wall
const isLoginWall = html.includes('Log in') && !html.includes('data-test-id');
console.log('--- Is login wall?', isLoginWall);

// Check for JSON data blob
const hasJsonData = html.includes('__PWS_DATA__') || html.includes('__PWS_INITIAL_PROPS__');
console.log('--- Has JSON data blob?', hasJsonData);

// Check data-test-id values present
const testIds = [...html.matchAll(/data-test-id="([^"]+)"/g)].map(m => m[1]);
const unique = [...new Set(testIds)];
console.log('--- Unique data-test-ids found:', unique.length);
console.log('First 20:', unique.slice(0, 20));
