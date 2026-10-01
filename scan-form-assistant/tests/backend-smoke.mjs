import assert from 'node:assert/strict';
const base='https://scan-form-assistant-t0kucv.v2.appdeploy.ai';
const origin='https://syahmiyahya-ai.github.io';
async function request(path, body) {
  const r=await fetch(base+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal(r.headers.get('access-control-allow-origin'),origin,'GitHub CORS');
  const data=await r.json();
  return {status:r.status,data};
}
const pre=await fetch(base+'/api/household-links',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});
console.log('Preflight status:',pre.status,'headers:',Object.fromEntries(pre.headers));
if(!pre.ok) console.log('Preflight public error:',(await pre.text()).slice(0,1000));
assert.ok(pre.ok,'CORS preflight must succeed');
assert.equal(pre.headers.get('access-control-allow-origin'),origin);
let link;
try {
  const created=await request('/api/household-links',{caseId:'external-smoke-fictional',dummyOnly:true});
  assert.equal(created.status,200,'Create online link');
  link=created.data;
  assert.ok(link.id && link.token && link.doctorToken);
  const opened=await request('/api/household-open',{id:link.id,token:link.token});
  assert.equal(opened.status,200);
  assert.equal(opened.data.submitted,false);
  assert.equal((await request('/api/household-response',{id:link.id,doctorToken:link.token})).status,403,'Household token cannot retrieve doctor response');
  const keys=['child_name','child_id','child_id_type','child_gender','child_dob','child_age','guardian_name','guardian_relationship','guardian_phone','contact_address','mother_name','father_name','respondent','incident_date','incident_time','incident_location','incident_history','hazard_access','witnesses','first_aid','clinic_care'];
  const fields=Object.fromEntries(keys.map(k=>[k,'']));
  Object.assign(fields,{respondent:'Fictional Parent',guardian_relationship:'Father',child_name:'Fictional Child'});
  const submitted=await request('/api/household-submit',{id:link.id,token:link.token,fields,confirmed:true,dummyOnly:true});
  assert.equal(submitted.status,200);
  const response=await request('/api/household-response',{id:link.id,doctorToken:link.doctorToken});
  assert.equal(response.status,200);
  assert.equal(response.data.response.fields.child_name,'Fictional Child');
  assert.equal((await request('/api/household-open',{id:link.id,token:link.token})).data.submitted,true);
  assert.equal((await request('/api/extract',{notes:'',dummyOnly:true})).status,400,'Empty extraction guard');
  console.log('PASS: CORS, create, household open/submit, doctor response, access boundary and input validation.');
} finally {
  if(link) {
    const deleted=await request('/api/household-delete',{id:link.id,doctorToken:link.doctorToken});
    assert.equal(deleted.status,200);
    assert.equal((await request('/api/household-open',{id:link.id,token:link.token})).status,404);
    console.log('PASS: deletion and revoked link.');
  }
}
