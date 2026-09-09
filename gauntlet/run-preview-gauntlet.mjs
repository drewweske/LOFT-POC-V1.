import assert from 'node:assert/strict';
import {request} from 'node:http';
import {createPreviewServer,previewHost,detectPreviewHost} from './serve.mjs';
const server=createPreviewServer(process.cwd());
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const get=(path,method='GET')=>new Promise((resolve,reject)=>{
  const req=request({host:'127.0.0.1',port,path,method},response=>{
    let text='';response.on('data',chunk=>text+=chunk);response.on('end',()=>resolve({status:response.statusCode,headers:response.headers,text}));
  });req.on('error',reject);req.end();
});
let count=0;
try{
  for(const path of ['/','/prototype1/','/prototype1/game.js','/prototype1/putting.js','/vendor/three.module.js','/prototype1/assets/loft-ball-official.webp']){
    const response=await get(path);assert.equal(response.status,200,path);assert.equal(response.headers['cache-control'],'no-store');
  }
  count++;console.log('PASS  playable distribution and shared modules are served without stale caches');
  for(const path of ['/.git/config','/AGENTS.md','/GAUNTLET_STATE.md','/gauntlet/STATE.md','/prototype1/../.git/config','/prototype1/%2e%2e/%2e%2e/secret','/prototype1/%5c..%5c.git%5cconfig','/prototype1/.private.js','/vendor/']){
    assert.equal((await get(path)).status,404,path);
  }
  assert.equal((await get('/prototype1/','POST')).status,405);
  count++;console.log('PASS  private files, path escapes, listings and mutation methods are denied');
  assert.equal((await get('/prototype1/','HEAD')).text,'');
  assert.equal(previewHost(),'127.0.0.1');assert.equal(previewHost('192.168.0.57'),'192.168.0.57');
  for(const host of ['0.0.0.0','8.8.8.8','::','192.168.0.999'])assert.throws(()=>previewHost(host));
  count++;console.log('PASS  explicit private LAN binding only; loopback stays the default');
  const wifi=address=>({family:'IPv4',internal:false,address});
  assert.equal(detectPreviewHost({WiFi:[wifi('192.168.0.68')],Loopback:[{...wifi('127.0.0.1'),internal:true}],Other:[wifi('169.254.1.2')]}),'192.168.0.68');
  assert.equal(detectPreviewHost({WiFi:[wifi('192.168.0.99')]}),'192.168.0.99');
  assert.throws(()=>detectPreviewHost({WiFi:[wifi('192.168.0.68')],VPN:[wifi('10.0.0.2')]}),/Multiple private interfaces/);
  assert.throws(()=>detectPreviewHost({}),/No private/);
  count++;console.log('PASS  LAN startup follows current address and rejects ambiguous interfaces');
}finally{await new Promise(resolve=>server.close(resolve));}
console.log(`\nLOFT PREVIEW GAUNTLET: ${count}/${count} checks passed`);
