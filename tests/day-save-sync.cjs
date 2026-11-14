const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('fs'),assert=require('assert');
(async()=>{
const vc=new VirtualConsole(),w=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test',runScripts:'outside-only',virtualConsole:vc}).window;w.structuredClone=structuredClone;w.BAMCO_ASSESSMENT={isReadOnly:()=>false};let calls=[],respond;
w.supabase={createClient:()=>({rpc:async(name,body)=>{calls.push(body);return respond(body)}})};
let source=fs.readFileSync('assessment-workspace.js','utf8').replace("navigate(window.BAMCO_BOOT_SCREEN || (location.search === '?observer' ? 'observer' : 'home'));", "window.testSetCurrent=(snapshot={})=>{current={id:'case-1',title:'Test',status:'active',revision:1,snapshot};pending=null;overlapReview=null;syncState=''};");w.eval(source);w.testSetCurrent();
w.eval(fs.readFileSync('snapshot-merge.js','utf8'));
respond=()=>({error:Error('offline')});assert.equal(await w.BAMCO_CASES.saveNow({records:{a:{score:8}}}),false);assert.equal(calls.length,1);
respond=()=>({data:{revision:2}});assert.equal(await w.BAMCO_CASES.saveNow({records:{a:{score:9}}}),true);assert.equal(calls.at(-1).args.snapshot.records.a.score,9);assert.equal(calls.at(-1).args.revision,1);
w.testSetCurrent();let release;respond=()=>new Promise(resolve=>release=resolve);const first=w.BAMCO_CASES.saveNow({records:{a:{score:5}}});await new Promise(r=>setTimeout(r,0));const second=w.BAMCO_CASES.saveNow({records:{a:{score:10}}});respond=()=>({data:{revision:3}});release({data:{revision:2}});assert(await first);assert(await second);assert.equal(calls.at(-1).args.snapshot.records.a.score,10);assert.equal(calls.at(-1).args.revision,2);
w.testSetCurrent();respond=()=>({data:null});assert.equal(await w.BAMCO_CASES.saveNow({records:{}}),false);
const base={records:{a:{score:4,note:'before'},b:{score:3}}};
let server,rev,display;
w.BAMCO_ASSESSMENT.applyReconciledSnapshot=s=>{display=s};
function simulate(remote){w.testSetCurrent(structuredClone(base));server=structuredClone(remote);rev=2;
 respond=({operation,args})=>{if(operation==='open')return {data:{id:'case-1',revision:rev,status:'active',snapshot:structuredClone(server)}};
 if(args.revision!==rev)return {data:null};server=structuredClone(args.snapshot);return {data:{revision:++rev}}};}
const local=structuredClone(base);local.records.a.score=8;
simulate({records:{a:{score:4,note:'remote note'},b:{score:9}}});
assert(await w.BAMCO_CASES.saveNow(local));assert.equal(server.records.a.score,8);assert.equal(server.records.a.note,'remote note');assert.equal(display.records.b.score,9);
for(const [choice,expected] of [[0,8],[1,10]]){
 simulate({records:{a:{score:10,note:'before'},b:{score:6}}});assert.equal(await w.BAMCO_CASES.saveNow(local),false);assert.equal(server.records.a.score,10);
 const options=w.document.querySelectorAll('#assessmentSync button');assert.equal(options.length,2);await options[choice].onclick();assert.equal(server.records.a.score,expected);assert.equal(server.records.b.score,6);assert.equal(display.records.a.score,expected);
}
const stale={records:{a:{score:4}},missions:{'audit:general':{entries:[]},'drive:1':{customTests:[{id:'t',score:4}]}}};
const a=structuredClone(stale),b=structuredClone(stale);a.missions['drive:1'].customTests[0].score=8;b.missions['drive:1'].customTests[0].note='other';a.missions['audit:general'].entries.push({at:'1',action:'a'});b.missions['audit:general'].entries.push({at:'2',action:'b'});
const merged=w.BAMCO_RECONCILE(stale,a,b);assert.equal(merged.conflicts.length,0);assert.equal(merged.snapshot.missions['drive:1'].customTests[0].note,'other');assert.equal(merged.snapshot.missions['audit:general'].entries.length,2);
w.close();console.log('PASS explicit server save: offline failure, retry with latest snapshot, inflight edits drained and revision conflicts not reported as saved.');
})().catch(e=>{console.error(e);process.exit(1)});
