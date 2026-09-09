import {createReadStream,statSync,realpathSync} from 'node:fs';
import {createServer} from 'node:http';
import {extname,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {networkInterfaces} from 'node:os';

const types={
  '.css':'text/css; charset=utf-8',
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml',
  '.woff2':'font/woff2', '.ico':'image/x-icon'
};

export function createPreviewServer(directory){
 const root=realpathSync(directory);
 return createServer((request,response)=>{
  try{
    if(!['GET','HEAD'].includes(request.method)){
      response.writeHead(405,{'Allow':'GET, HEAD'});response.end();return;
    }
    const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    // LAN preview is only the playable distribution, never Git metadata,
    // development notes, neighboring files, dotfiles or directory listings.
    if(pathname.includes('\\')||pathname.split('/').some(part=>part.startsWith('.')))throw new Error('PRIVATE');
    if(!['/','/index.html'].includes(pathname)&&!pathname.startsWith('/prototype1/')&&!pathname.startsWith('/vendor/'))throw new Error('PRIVATE');
    let file=resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+sep))throw new Error('OUTSIDE_ROOT');
    if(statSync(file).isDirectory())file=resolve(file,'index.html');
    if(!types[extname(file)])throw new Error('PRIVATE');
    file=realpathSync(file);
    if(!file.startsWith(root+sep))throw new Error('OUTSIDE_ROOT');
    if(file!==resolve(root,'index.html')&&!file.startsWith(resolve(root,'prototype1')+sep)&&!file.startsWith(resolve(root,'vendor')+sep))throw new Error('PRIVATE_LINK');
    if(file.slice(root.length+1).split(sep).some(part=>part.startsWith('.'))||!types[extname(file)])throw new Error('PRIVATE_LINK');
    response.writeHead(200,{
      'Content-Type':types[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'
    });
    if(request.method==='HEAD'){response.end();return;}
    createReadStream(file).on('error',()=>response.destroy()).pipe(response);
  }catch{
    response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
    response.end('Not found');
  }
 });
}

export function previewHost(value='127.0.0.1'){
  const parts=value.split('.').map(Number);
  const valid=parts.length===4&&parts.every(n=>Number.isInteger(n)&&n>=0&&n<=255);
  const privateIP=parts[0]===10||(parts[0]===172&&parts[1]>=16&&parts[1]<=31)||(parts[0]===192&&parts[1]===168);
  if(!valid||(value!=='127.0.0.1'&&!privateIP))throw new Error('Use loopback or an explicit private Wi-Fi IPv4 address; public/wildcard binds are disabled.');
  return value;
}

export function detectPreviewHost(interfaces=networkInterfaces()){
  const addresses=[...new Set(Object.values(interfaces).flatMap(entries=>(entries||[])
    .filter(entry=>!entry.internal&&(entry.family==='IPv4'||entry.family===4))
    .map(entry=>entry.address).filter(address=>{
      try{return previewHost(address)!=='127.0.0.1';}catch{return false;}
    })))];
  if(addresses.length!==1)throw new Error(addresses.length?
    `Multiple private interfaces: ${addresses.join(', ')}. Pass the intended Wi-Fi IPv4 address explicitly.`:
    'No private Wi-Fi/LAN IPv4 address found. Connect to your trusted Wi-Fi and retry.');
  return addresses[0];
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{
    const port=Number(process.argv[2]||4173),host=process.argv[3]==='--lan'?detectPreviewHost():previewHost(process.argv[3]);
    if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Choose a port from 1024 to 65535.');
    const server=createPreviewServer(process.cwd());
    server.on('error',error=>{
      const hint=error.code==='EADDRNOTAVAIL'?'The Wi-Fi address changed. Retry with --lan.':
        error.code==='EADDRINUSE'?'This port is already in use. Keep the existing preview or choose another port.':error.message;
      console.error(`LOFT preview could not start: ${hint}`);process.exitCode=1;
    });
    server.listen(port,host,()=>console.log(`LOFT preview: http://${host}:${port}/prototype1/`));
  }catch(error){console.error(`LOFT preview could not start: ${error.message}`);process.exitCode=1;}
}
