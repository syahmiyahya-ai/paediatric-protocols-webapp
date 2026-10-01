import { PDFDocument, PDFTextField, PDFCheckBox, PDFSignature, StandardFonts, rgb } from 'pdf-lib';
import { FIELDS } from './fields';

export type Placement = { id: string; key: string; page: number; x: number; y: number; width: number; height: number; kind: 'text' | 'checkbox' | 'strike' };
export type PdfTemplate = {
  name: string; hash: string; bytes: Uint8Array; pages: { width: number; height: number }[];
  fields: { name: string; kind: string }[]; mapping: Record<string,string>;
  placements: Placement[]; confirmed: boolean;
};
const aliases: Record<string,string> = {
  namaibu:'mother_name', namabapa:'father_name', namapenjaga:'guardian_name', notel:'guardian_phone',
  alamatterkini:'contact_address', namapegawai:'doctor_name', pengenalanno:'doctor_id',
  namapesakit:'child_name', jantina:'child_gender', umur:'child_age', tarikh:'report_date',
  nokpibu:'mother_id', nokpbapa:'father_id', nopendaftaranpesakit:'registration_number'
};
const normal = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export function saveDownload(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function inspectTemplate(bytes: Uint8Array, name: string): Promise<PdfTemplate> {
  if (bytes.length > 15000000) throw new Error('Use a blank PDF under 15 MB.');
  const pdf = await PDFDocument.load(bytes);
  if (!pdf.getPageCount() || pdf.getPageCount() > 20) throw new Error('Use a PDF with 1–20 pages.');
  if (pdf.getForm().getFields().some(f => f instanceof PDFSignature))
    throw new Error('Use an unsigned blank template. Signed PDFs must not be modified.');
  const fields = pdf.getForm().getFields().map(f => ({
    name: f.getName(), kind: f instanceof PDFTextField ? 'text' : f instanceof PDFCheckBox ? 'checkbox' : 'manual'
  }));
  if (new Set(fields.map(f => f.name)).size !== fields.length) throw new Error('Duplicate PDF field names. Repair the blank template in Acrobat first.');
  const mapping: Record<string,string> = {};
  for (const f of fields) {
    if (/sign|tandatangan|cop rasmi/i.test(f.name)) { mapping[f.name] = ''; continue; }
    mapping[f.name] = FIELDS.find(([k]) => normal(k) === normal(f.name))?.[0] || aliases[normal(f.name)] || '';
  }
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.slice().buffer)))
    .map(b => b.toString(16).padStart(2,'0')).join('');
  return { name, hash, bytes, pages: pdf.getPages().map(p => p.getSize()), fields, mapping, placements: [], confirmed: false };
}
function isYes(value: string) { return /^(yes|ya|true|checked)$/i.test(value.trim()); }
export async function fillTemplate(template: PdfTemplate, values: Record<string,string>): Promise<Uint8Array> {
  if (!template.confirmed) throw new Error('Confirm this template mapping before export.');
  const pdf = await PDFDocument.load(template.bytes);
  const form = pdf.getForm();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const overflow: { label: string; text: string }[] = [];
  const labelFor = (key: string) => FIELDS.find(([k]) => k === key)?.[1] || key;
  function wrap(text: string, width: number, size: number): string[] {
    const result: string[] = [];
    for (const paragraph of text.split(/\r?\n/)) {
      let line = '';
      for (const char of paragraph) {
        if (font.widthOfTextAtSize(line + char, size) > width && line) { result.push(line.trimEnd()); line = ''; }
        line += char;
      }
      result.push(line.trimEnd());
    }
    return result;
  }
  function fitted(text: string, width: number, height: number, key: string) {
    font.encodeText(text);
    for (let size = 11; size >= 7; size -= .5) {
      const lines = wrap(text, Math.max(10,width-4), size);
      if (lines.length * size * 1.2 + 4 <= height) return { text, size };
    }
    overflow.push({ label: labelFor(key), text });
    return { text: 'See continuation '+overflow.length, size: 7 };
  }
  for (const info of template.fields) {
    const key = template.mapping[info.name];
    if (!key) continue;
    const field = form.getField(info.name);
    if (field instanceof PDFTextField) {
      const value = values[key] || '';
      const widgets = field.acroField.getWidgets();
      const rect = widgets[0]?.getRectangle();
      const fit = rect ? fitted(value, rect.width, rect.height, key) : {text:value,size:9};
      if (rect && rect.height > 25) field.enableMultiline();
      field.setText(fit.text); field.setFontSize(fit.size);
    } else if (field instanceof PDFCheckBox) {
      const checked = key === '__checked' || (key !== '__unchecked' && isYes(values[key] || ''));
      checked ? field.check() : field.uncheck();
    }
  }
  for (const place of template.placements) {
    const page = pdf.getPage(place.page);
    if (!page || place.x < 0 || place.y < 0 || place.width < 10 || place.height < 10 ||
        place.x+place.width > page.getWidth()+.1 || place.y+place.height > page.getHeight()+.1)
      throw new Error('Placement is outside a PDF page. Correct its coordinates.');
    if(place.kind==='strike') {
      if(/^(no|tidak|not applicable|tiada berkaitan)$/i.test((values[place.key]||'').trim()))
        page.drawLine({start:{x:place.x,y:place.y+place.height/2},end:{x:place.x+place.width,y:place.y+place.height/2},thickness:1,color:rgb(0,0,0)});
      continue;
    }
    const fieldName = 'SCAN_'+place.id;
    if (form.getFields().some(f => f.getName() === fieldName)) throw new Error('Duplicate placement ID.');
    if (place.kind === 'checkbox') {
      const f = form.createCheckBox(fieldName);
      f.addToPage(page,{x:place.x,y:place.y,width:place.width,height:place.height,borderWidth:0});
      if (isYes(values[place.key] || '')) f.check();
    } else {
      const fit = fitted(values[place.key] || '',place.width,place.height,place.key);
      const f = form.createTextField(fieldName);
      if (place.height > 25) f.enableMultiline();
      f.setText(fit.text);
      f.addToPage(page,{x:place.x,y:place.y,width:place.width,height:place.height,borderWidth:0,textColor:rgb(0,0,0),font});
      f.setFontSize(fit.size);
    }
  }
  for (let index=0; index<overflow.length; index++) {
    const entry=overflow[index];
    let page=pdf.addPage([595.28,841.89]), y=788;
    const heading=()=>{page.drawText(template.name+' - continuation '+(index+1),{x:40,y,size:12,font});y-=25;
      for(const line of wrap(entry.label,515,10)){page.drawText(line,{x:40,y,size:10,font});y-=14;} y-=12;};
    heading();
    for (const line of wrap(entry.text,515,10)) {
      if(y<50){page=pdf.addPage([595.28,841.89]);y=788;heading();}
      page.drawText(line,{x:40,y,size:10,font});y-=14;
    }
  }
  form.updateFieldAppearances(font);
  const bytes=await pdf.save();
  const check=await PDFDocument.load(bytes);
  for(const place of template.placements) {
    if(place.kind==='strike')continue;
    const field=check.getForm().getField('SCAN_'+place.id);
    if(place.kind==='text' && !(field instanceof PDFTextField)) throw new Error('PDF field validation failed.');
    if(field.acroField.getWidgets().some(w=>!w.getAppearances()?.normal)) throw new Error('PDF appearance validation failed.');
  }
  return bytes;
}
function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open('scan-blank-templates',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('templates',{keyPath:'name'});
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
export async function templateStore(action: 'read'|'write'|'delete', template?: PdfTemplate, name?: string): Promise<PdfTemplate[]> {
  const database=await openStore();
  return new Promise((resolve,reject)=>{
    const transaction=database.transaction('templates',action==='read'?'readonly':'readwrite');
    const store=transaction.objectStore('templates');
    const request=action==='read'?store.getAll():action==='write'?store.put(template!):store.delete(name!);
    transaction.oncomplete=()=>{resolve(action==='read'?request.result as PdfTemplate[]:[]);database.close();};
    transaction.onerror=()=>{reject(transaction.error);database.close();};
  });
}
