import {createReadStream,statSync} from 'node:fs';
import {createServer} from 'node:http';
import {extname,resolve,sep} from 'node:path';

const root=resolve(process.cwd());
const port=Number(process.argv[2]||4173);
const types={
  '.css':'text/css; charset=utf-8',
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.webp':'image/webp'
};

createServer((request,response)=>{
  try{
    const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    let file=resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+sep))throw new Error('OUTSIDE_ROOT');
    if(statSync(file).isDirectory())file=resolve(file,'index.html');
    response.writeHead(200,{
      'Content-Type':types[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'
    });
    createReadStream(file).pipe(response);
  }catch{
    response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
    response.end('Not found');
  }
}).listen(port,'127.0.0.1',()=>console.log(`LOFT preview: http://127.0.0.1:${port}/prototype1/`));
