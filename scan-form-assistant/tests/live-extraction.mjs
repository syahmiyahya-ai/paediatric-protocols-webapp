import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||undefined});
try {
  for (const base of ['https://scan-form-assistant-t0kucv.v2.appdeploy.ai/','https://syahmiyahya-ai.github.io/paediatric-protocols-webapp/scan-form-assistant/']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base,{waitUntil:'networkidle'});
    console.log('URL',base,'TITLE',await page.title());
    await page.getByRole('button',{name:'Load scald example',exact:true}).click();
    assert.match(await page.getByLabel('Clinical history').inputValue(),/Maggi/);
    await page.getByRole('button',{name:'Identify required information',exact:true}).click();
    await page.waitForFunction(()=>!document.body.textContent.includes('Extracting…'),{},{timeout:120000});
    console.log('RESULT',await page.locator('[role="status"]').allTextContents());
    const incident=page.getByLabel('Incident history',{exact:true});
    if(await incident.count()) assert.match(await incident.inputValue(),/scald|soup|hand/i);
    else throw Error('Extraction did not open Information: '+await page.locator('[role="status"]').allTextContents());
    await page.getByRole('button',{name:'Upload PDFs',exact:true}).click();
    const picker=page.waitForEvent('filechooser');
    await page.getByRole('button',{name:'Upload Borang 9 PDF',exact:true}).click();
    await picker;
    assert.deepEqual(errors,[]);
    console.log('PASS live extraction, navigation and PDF file picker',base);
    await context.close();
  }
} finally { await browser.close(); }
