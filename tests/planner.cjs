const assert=require('node:assert/strict');
const planner=require('../durability-planner.js');
for(const target of [1,101,5000,45000,200000])for(const twoDiff of [false,true]){
 const p=planner.calculate({target,twoDiff});
 assert.equal(p.schedule.reduce((s,d)=>s+d.km,0),target);
 for(const r of p.rows)for(let c=1;c<=4;c++)assert.equal(p.schedule.filter(d=>d.cycle===c&&d.routeId===r.id).reduce((s,d)=>s+d.km,0),r.km/4);
 assert(p.schedule.every(d=>d.km>0&&d.km<=d.cap));
 assert.equal(p.days,p.schedule.length);
 if(!twoDiff)assert(!p.schedule.some(d=>d.routeId==='offroad'));
}
assert.throws(()=>planner.calculate({target:0}));assert.throws(()=>planner.calculate({target:5000,shares:{urban:50}}));
const p=planner.calculate({target:45000,twoDiff:true});
const original=structuredClone(p.schedule),mileage={1:p.schedule[0].km,2:p.schedule[1].km};
const next=planner.replan({plan:p.schedule,fromDay:3,replacement:{...p.schedule[2],km:50,origin:'قم',destination:'کاشان'},mileage,rows:p.rows});
assert.deepEqual(next.slice(0,2),original.slice(0,2));assert.deepEqual(p.schedule,original);assert.equal(next[2].origin,'قم');assert(next.length>p.schedule.length);
for(const row of p.rows)assert.equal(next.filter(x=>x.routeId===row.id).reduce((s,x)=>s+x.km,0),row.km);
assert.throws(()=>planner.replan({plan:p.schedule,fromDay:2,replacement:p.schedule[1],mileage,rows:p.rows}));
const adjusted=planner.replan({plan:p.schedule,fromDay:2,mileage:{1:100},rows:p.rows});assert.deepEqual(adjusted[0],original[0]);assert.equal(adjusted.slice(1).reduce((s,d)=>s+d.km,0)+100,45000);
const checks=planner.checkpoints([{day:1,routeId:'hot'},{day:2,routeId:'urban'},{day:3,routeId:'hot'}],{1:100,2:9000,3:700},[{id:'hot',km:1000}],3);
assert.deepEqual(checks.map(c=>c.percent),[25,50,75]);
assert.deepEqual(planner.checkpoints([{day:1,routeId:'hot'}],{},[{id:'hot',km:1000}],1),[]);
console.log('PASS planner: allocations, four mixed cycles, caps, immutable prefix, actual remainder, independent route checkpoints, multiple crossed quarters.');
