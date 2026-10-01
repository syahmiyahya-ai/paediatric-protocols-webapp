import { backendUrl } from './BackendSettings';
async function post(path: string, body: unknown) {
  const base=backendUrl();
  if(!base) throw new Error('Configure the approved backend URL in connection settings.');
  const response=await fetch(base+path, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'omit',cache:'no-store'});
  const data=await response.json();
  if(!response.ok) throw new Error(data.error || data.message || 'Request failed');
  return {data};
}
export const api={post};
