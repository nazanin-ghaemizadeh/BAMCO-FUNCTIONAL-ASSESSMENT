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
for(const target of [10000,15000,20000,25000,30000,35000,40000,45000,50000]){
 const plan=planner.calculate({target,fixed:true,twoDiff:false});
 assert.deepEqual(plan.rows.map(r=>r.weight),[25,40,15,2,18]);
 assert.equal(plan.schedule.at(-1).cum,target);
 for(const row of plan.rows)for(const cycle of [1,2,3,4]){
  const legs=plan.schedule.filter(day=>day.cycle===cycle&&day.routeId===row.id);
  assert(legs.every(day=>day.km>0&&day.km<=row.cap));
  assert.equal(legs.reduce((sum,day)=>sum+day.km,0),row.km/4);
 }
 if(target===35000){
  assert.deepEqual(plan.rows.map(r=>[r.km,r.days,r.lastKm]),[[8750,32,87.5],[14000,21,700],[5250,12,312.5],[700,4,175],[6300,20,175]]);
  const mileage={};
  for(const day of plan.schedule.slice(0,9)){
   mileage[day.day]=day.km;
   const after=planner.replan({plan:plan.schedule,fromDay:day.day+1,mileage,rows:plan.rows});
   assert.equal(after.length,89);assert.equal(after.at(-1).cum,35000);
  }
 }
}
for(const target of [5000,11000,55000])assert.throws(()=>planner.calculate({target,fixed:true}));
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
