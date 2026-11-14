const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('fs'),assert=require('assert');
(async()=>{
const vc=new VirtualConsole(),w=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test',runScripts:'outside-only',virtualConsole:vc}).window;w.structuredClone=structuredClone;w.BAMCO_ASSESSMENT={isReadOnly:()=>false};let calls=[],respond;
w.supabase={createClient:()=>({rpc:async(name,body)=>{calls.push(body);return respond(body)}})};
let source=fs.readFileSync('assessment-workspace.js','utf8').replace("navigate(window.BAMCO_BOOT_SCREEN || (location.search === '?observer' ? 'observer' : 'home'));", "window.testSetCurrent=()=>{current={id:'case-1',title:'Test',status:'active',revision:1};pending=null;syncState=''};");w.eval(source);w.testSetCurrent();
respond=()=>({error:Error('offline')});assert.equal(await w.BAMCO_CASES.saveNow({records:{a:{score:8}}}),false);assert.equal(calls.length,1);
respond=()=>({data:{revision:2}});assert.equal(await w.BAMCO_CASES.saveNow({records:{a:{score:9}}}),true);assert.equal(calls.at(-1).args.snapshot.records.a.score,9);assert.equal(calls.at(-1).args.revision,1);
w.testSetCurrent();let release;respond=()=>new Promise(resolve=>release=resolve);const first=w.BAMCO_CASES.saveNow({records:{a:{score:5}}});await new Promise(r=>setTimeout(r,0));const second=w.BAMCO_CASES.saveNow({records:{a:{score:10}}});respond=()=>({data:{revision:3}});release({data:{revision:2}});assert(await first);assert(await second);assert.equal(calls.at(-1).args.snapshot.records.a.score,10);assert.equal(calls.at(-1).args.revision,2);
w.testSetCurrent();respond=()=>({data:null});assert.equal(await w.BAMCO_CASES.saveNow({records:{}}),false);w.close();console.log('PASS explicit server save: offline failure, retry with latest snapshot, inflight edits drained and revision conflicts not reported as saved.');
})().catch(e=>{console.error(e);process.exit(1)});
