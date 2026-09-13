// Optional real-browser check of the SAME checked-in byte vectors. Loopback only;
// separate from the protected playable preview server. No writes, no game imports.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
const page=`<!doctype html><meta charset="utf-8"><title>LOFT Step 1 byte contracts</title><pre id="result">Running</pre><script type="module">
import {seedBytes,shotSeed,boundaryKeyBytes,boundaryWord,courseBytes,courseHash} from '/contracts.mjs';
try {
 const f=await (await fetch('/vectors.json')).json();
 const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
 let checks=0;const equal=(a,b)=>{if(a!==b)throw Error(a+' !== '+b);checks++;};
 for(const v of f.seedVectors){equal(hex(seedBytes(v.input)),v.bytes);equal(shotSeed(v.input),v.shotSeed);}
 for(const v of f.boundaryVectors){equal(hex(boundaryKeyBytes(v.input)),v.bytes);equal(boundaryWord(v.input),v.boundaryWord);}
 for(const v of f.courses){equal(hex(courseBytes(v.input)),v.bytes);equal(await courseHash(v.input),v.sha256);}
 const p=structuredClone(f.courses[1].input);p.holes[0].tee[0]=-0;equal(await courseHash(p),f.courses[1].sha256);
 for(const v of [NaN,Infinity,-Infinity]){p.holes[0].tee[0]=v;let rejected=false;try{courseBytes(p);}catch{rejected=true;}equal(rejected,true);}
 document.querySelector('#result').textContent=JSON.stringify({status:'PASS',checks,runtime:navigator.userAgent,courseHashes:f.courses.map(c=>c.sha256)},null,2);
} catch(error){document.querySelector('#result').textContent='FAIL '+error.stack;}
</script>`;
const routes={
 '/':['text/html; charset=utf-8',page],
 '/contracts.mjs':['text/javascript',readFileSync(new URL('contracts-v1.mjs',import.meta.url))],
 '/vectors.json':['application/json',readFileSync(new URL('fixtures/contract-vectors-v1.json',import.meta.url))]
};
const server=createServer((req,res)=>{
 const route=routes[req.url];if(req.method!=='GET'||!route){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':route[0],'Cache-Control':'no-store'});res.end(route[1]);
});
server.listen(0,'127.0.0.1',()=>console.log('CONTRACT CHECK http://127.0.0.1:'+server.address().port+'/'));
