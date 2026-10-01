import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();page.setDefaultTimeout(60000);
const base='https://syahmiyahya-ai.github.io/paediatric-protocols-webapp/scan-form-assistant/';
try {
  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('aside').getByRole('button',{name:/Information/}).click();
  await page.getByLabel('Child name',{exact:true}).fill('Fictional Child');
  await page.getByLabel('IC number',{exact:true}).fill('200229141235');
  assert.equal(await page.getByLabel('Date of birth',{exact:true}).inputValue(),'2020-02-29');
  assert.equal(await page.getByLabel('Gender / sex',{exact:true}).inputValue(),'Male');
  await page.reload();
  await page.locator('aside').getByRole('button',{name:/Information/}).click();
  assert.equal(await page.getByLabel('Child name',{exact:true}).inputValue(),'Fictional Child');
  assert.equal(await page.getByLabel('Date of birth',{exact:true}).inputValue(),'2020-02-29');
  console.log('PASS: Information fields, IC-derived DOB and sex, and refresh-safe draft.');
  await page.locator('aside').getByRole('button',{name:/PDF templates/}).click();
  const borang=await PDFDocument.create();for(let i=0;i<4;i++)borang.addPage([595.28,841.89]);
  borang.getForm().createTextField('child_name').addToPage(borang.getPage(0),{x:80,y:700,width:250,height:25});
  await page.getByLabel('Upload Borang 9',{exact:true}).setInputFiles({name:'fixture-borang.pdf',mimeType:'application/pdf',buffer:Buffer.from(await borang.save())});
  await page.getByText('Borang 9 · 4 pages · 1 Acrobat fields · 0 placed fields',{exact:true}).waitFor();
  await page.getByLabel('I checked every mapped field and placement on all pages.').check();
  const jkm=await PDFDocument.create();jkm.addPage([595.28,841.89]);jkm.addPage([595.28,841.89]);
  await page.getByLabel('Upload JKM referral',{exact:true}).setInputFiles({name:'fixture-jkm.pdf',mimeType:'application/pdf',buffer:Buffer.from(await jkm.save())});
  const canvas=page.getByLabel('JKM referral page 1',{exact:true});
  await canvas.waitFor();await page.waitForFunction(()=>document.querySelector('canvas')?.getAttribute('data-ready')==='true');
  const rect=await canvas.boundingBox();assert.ok(rect);
  await page.mouse.move(rect.x+rect.width*.14,rect.y+rect.height*.14);
  await page.mouse.down();await page.mouse.move(rect.x+rect.width*.57,rect.y+rect.height*.18);await page.mouse.up();
  await page.getByText('JKM referral · 2 pages · 0 Acrobat fields · 1 placed fields',{exact:true}).waitFor();
  await page.getByLabel('I checked every mapped field and placement on all pages.').check();
  await page.locator('aside').getByRole('button',{name:/Review/}).click();
  await page.getByLabel('I checked identities, dates, attribution, findings, missing fields and actions. This confirms review, not signature or notification.').check();
  await page.locator('aside').getByRole('button',{name:/PDF templates/}).click();
  const downloads=[];page.on('download',d=>downloads.push(d));
  await page.getByRole('button',{name:'Download both official forms',exact:true}).click();
  await page.getByText('Both forms exported. Check every page and continuation, then sign and send through your usual reporting channel.',{exact:true}).count();
  await page.waitForFunction(()=>document.body.textContent.includes('Both forms exported.'));
  assert.equal(downloads.length,2);
  for(const download of downloads){
    const stream=await download.createReadStream(),chunks=[];
    for await(const chunk of stream)chunks.push(chunk);
    const pdf=await PDFDocument.load(Buffer.concat(chunks));
    assert.equal(pdf.getPageCount(),download.suggestedFilename().startsWith('Borang')?4:2);
    assert.ok(pdf.getForm().getFields().some(f=>f.constructor.name.includes('Text')&&f.getText()==='Fictional Child'));
  }
  console.log('PASS: Acrobat and scanned templates, manual placement, two editable PDFs and original page counts.');
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.pdf-sheet canvas')).every(c=>c.width>500));
  const image=await page.locator('.pdf-sheet').first().screenshot();console.log('SCREENSHOT:'+image.toString('base64'));
  const cloud=await page.evaluate(async()=>{
    const frame=document.querySelector('iframe[title="SCAN backend transport"]');
    if(!frame)return null;
    return await new Promise(resolve=>{
      const id=crypto.randomUUID(),listen=e=>{if(e.data?.id===id){window.removeEventListener('message',listen);resolve(e.data.ok);}};
      window.addEventListener('message',listen);
      frame.contentWindow.postMessage({type:'scan-backend-request',id,path:'/api/cases-list',body:{}},'https://scan-form-assistant-t0kucv.v2.appdeploy.ai');
      setTimeout(()=>resolve('timeout'),20000);
    });
  });
  assert.equal(cloud,false);
  console.log('PASS: anonymous access to private doctor cases denied.');
}finally{await browser.close();}
