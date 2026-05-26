require('dotenv').config();
const puppeteer = require('puppeteer');
const config = require('./config.json');
const fs = require('fs');

(async () => {
    console.log('[Debug] Launching browser...');
    const browser = await puppeteer.launch({ 
        headless: false, // visible so you can watch
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    // Inject session cookie
    if (config.destination_channels[0].session_cookie) {
        await page.setCookie({
            name: '_pinterest_sess',
            value: config.destination_channels[0].session_cookie,
            domain: '.pinterest.com'
        });
        console.log('[Debug] Session cookie injected.');
    }

    // Log ALL XHR/API responses  
    const apiCalls = [];
    page.on('response', async (res) => {
        const url = res.url();
        const ct = res.headers()['content-type'] || '';
        if (ct.includes('json')) {
            try {
                const text = await res.text();
                apiCalls.push({ url: url.substring(0, 120), length: text.length });
            } catch(e) {}
        }
    });

    const targetUrl = config.target_channels[0];
    console.log('[Debug] Navigating to:', targetUrl);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));

    console.log('\n[Debug] === JSON API CALLS MADE ===');
    apiCalls.forEach(c => console.log(`  ${c.url} (${c.length} bytes)`));

    // Check the actual page URL after redirect
    const finalUrl = page.url();
    console.log('\n[Debug] Final URL after redirect:', finalUrl);

    // Dump the __PWS_DATA__ top-level keys
    const topKeys = await page.evaluate(() => {
        const tag = document.getElementById('__PWS_DATA__');
        if (!tag) return 'NO __PWS_DATA__ TAG FOUND';
        try {
            const data = JSON.parse(tag.textContent);
            // Show top-level keys and types
            const walk = (obj, prefix = '', depth = 0) => {
                if (depth > 3 || !obj || typeof obj !== 'object') return [];
                const results = [];
                for (const [k, v] of Object.entries(obj)) {
                    const type = Array.isArray(v) ? `Array(${v.length})` : typeof v;
                    results.push(`${prefix}${k}: ${type}`);
                    if (typeof v === 'object' && depth < 2) {
                        results.push(...walk(v, `${prefix}  `, depth + 1));
                    }
                }
                return results;
            };
            return walk(data).slice(0, 60).join('\n');
        } catch(e) {
            return 'Parse error: ' + e.message;
        }
    });
    console.log('\n[Debug] === __PWS_DATA__ STRUCTURE ===');
    console.log(topKeys);

    // Find any images in the page
    const imgs = await page.evaluate(() => {
        return [...document.querySelectorAll('img')]
            .map(img => img.src)
            .filter(src => src.includes('pinimg.com'))
            .slice(0, 5);
    });
    console.log('\n[Debug] Sample pinimg.com images on page:', imgs);

    await browser.close();
    console.log('\n[Debug] Done.');
})();
