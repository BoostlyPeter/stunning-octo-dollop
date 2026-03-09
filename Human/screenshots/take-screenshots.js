/**
 * Playwright script to screenshot all AI-First CRM mockups.
 * Mockups use click-to-advance — we click "Nästa" through all steps.
 *
 * Usage: node take-screenshots.js
 */
const { chromium } = require('C:/Users/SvenskVent/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');

const MOCKUPS_DIR = path.resolve(__dirname, '..', 'mockups');
const OUTPUT_DIR = __dirname;

const LANDSCAPE_W = 1400;
const LANDSCAPE_H = 788;

const mockups = [
    { file: '01-voice-transcript.html', name: '01-smart-followup',  width: LANDSCAPE_W, height: LANDSCAPE_H },
    { file: '02-chat-to-action.html',   name: '02-deal-creation',   width: LANDSCAPE_W, height: LANDSCAPE_H },
    { file: '03-pipeline-drilldown.html',name: '03-analytics-overview', width: LANDSCAPE_W, height: LANDSCAPE_H, stopAtStep: 3 },
    { file: '03-pipeline-drilldown.html',name: '03-analytics-trends',   width: LANDSCAPE_W, height: LANDSCAPE_H, fullPage: true },
    { file: '04-mobile-notifications.html', name: '04-mobile-dash', width: 500,  height: 960 },
    { file: '05-bankid-auth.html',       name: '05-bankid',          width: LANDSCAPE_W, height: LANDSCAPE_H },
    { file: '06-ovk-inspection.html',    name: '06-ovk-inspection',  width: LANDSCAPE_W, height: LANDSCAPE_H },
];

async function clickThroughSteps(page, stopAtStep) {
    // Click "Nästa" button repeatedly until all steps are done (or stopAtStep reached)
    let clicked = 0;
    const maxClicks = stopAtStep || 20; // safety limit

    for (let i = 0; i < maxClicks; i++) {
        // Try multiple selectors — some mockups use #btnNext, others use .step-controls button
        const btn = await page.$('#btnNext') || await page.$('.step-controls button');
        if (!btn) break;

        const text = await btn.textContent();
        // Stop if button says "Börja om" (or similar reset text) and we've clicked at least once
        if (clicked > 0 && (text.includes('om') || text.includes('Starta'))) break;
        // Stop if we've reached the target step
        if (stopAtStep && clicked >= stopAtStep) break;

        await btn.click();
        clicked++;
        // Wait for animations to settle
        await page.waitForTimeout(800);
    }
    // Extra settle time after last click
    await page.waitForTimeout(1000);
    return clicked;
}

(async () => {
    const browser = await chromium.launch();

    for (const m of mockups) {
        const ctx = await browser.newContext({ viewport: { width: m.width, height: m.height } });
        const page = await ctx.newPage();
        const url = 'file:///' + path.join(MOCKUPS_DIR, m.file).replace(/\\/g, '/');

        console.log(`Opening ${m.file} → ${m.name}...`);
        await page.goto(url, { waitUntil: 'load' });
        await page.waitForTimeout(1000);

        const steps = await clickThroughSteps(page, m.stopAtStep);
        console.log(`  Clicked ${steps} steps`);

        const outPath = path.join(OUTPUT_DIR, `${m.name}.png`);
        const fullPage = m.fullPage || false;
        await page.screenshot({ path: outPath, fullPage });
        console.log(`  → ${outPath}`);

        await ctx.close();
    }

    await browser.close();
    console.log('Done! All screenshots captured.');
})();
