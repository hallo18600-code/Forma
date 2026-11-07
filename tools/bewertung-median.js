// Berechnet zwei Tabellen in bewertung.js neu:
//  1. R_IMP – typische Werte je Lebensmittel-Art, mit denen fehlende Angaben geschätzt werden
//     [Zucker-Anteil der Kohlenhydrate, Ballaststoffe je g Kohlenhydrate, Salz g pro 100 g, Anteil stark verarbeitet (NOVA 4)]
//     Grundlage: nur Produkte, bei denen der Wert wirklich angegeben ist (Median, robust gegen Ausreißer).
//  2. R_MED – typische Nährwert-Bewertung je Art (mit den geschätzten Werten, damit beides zusammenpasst).
// Nötig, wenn die Formeln in rNutri(), die Erkennung oder foods.json geändert werden.  Aufruf:  node tools/bewertung-median.js
const fs=require("fs"), vm=require("vm"), path=require("path");
const dir=path.join(__dirname,".."), rd=f=>fs.readFileSync(path.join(dir,f),"utf8");
const app=rd("app.js"), cut=(a,b)=>app.slice(app.indexOf(a),app.indexOf(b));
const p=path.join(dir,"bewertung.js");
const load=src=>{ const ctx={window:{},console}; vm.createContext(ctx);
  vm.runInContext(rd("data.js")+"\n"+src+"\n"+cut("const FOOD_KW","// scoreFood steht")+"\nthis.CL=rClassify; this.NU=rNutri;",ctx); return ctx; };
const rows=JSON.parse(rd("foods.json")).rows;
const item=x=>({name:x[1],brand:x[2]||"",kcal:x[3],protein:x[4]||0,carbs:x[5]||0,fat:x[6]||0,sugar:x[7]??undefined,fiber:x[8]??undefined,salt:x[9]??undefined,nova:x[11]>0?x[11]:undefined,processed:x[11]>=4});
const med=a=>{ if(!a.length) return null; a=a.slice().sort((x,y)=>x-y); return a[Math.floor(a.length/2)]; };
const r2=(v,d)=>v==null?null:Math.round(v*10**d)/10**d;

// ---------- 1) R_IMP: ohne Schätzung klassifizieren, Mediane der vorhandenen Werte ----------
let src=fs.readFileSync(p,"utf8");
const ctx0=load(src.replace(/const R_IMP=\{.*\};/,"const R_IMP={};"));
const G={}, all={su:[],fi:[],sa:[],nv:[]};
for(const x of rows){
  const it=item(x), C=ctx0.CL(it), k=C.cat?C.cat.id:"_", g=G[k]=G[k]||{su:[],fi:[],sa:[],nv:[]};
  const add=(f,v)=>{ g[f].push(v); all[f].push(v); };
  if(x[7]!=null&&x[5]>=1) add("su",Math.min(1,x[7]/x[5]));
  if(x[8]!=null&&x[5]>=2) add("fi",Math.min(1,x[8]/x[5]));
  if(x[9]!=null) add("sa",x[9]);
  if(x[11]>0) add("nv",x[11]>=4?1:0);
}
const MIN=25, imp={};
const val=(g,f,d)=>g[f].length>=MIN?med(g[f]):med(all[f]);
for(const k of Object.keys(G).sort()){ const g=G[k];
  const nv=g.nv.length>=MIN?g.nv.reduce((a,b)=>a+b,0)/g.nv.length:null;
  imp[k]=[r2(val(g,"su"),2),r2(val(g,"fi"),2),r2(val(g,"sa"),2),r2(nv,2)];
}
src=src.replace(/const R_IMP=\{.*\};/,"const R_IMP="+JSON.stringify(imp).replace(/"(\w+)":/g,"$1:")+";");
fs.writeFileSync(p,src);

// ---------- 2) R_MED mit den geschätzten Werten ----------
const ctx=load(src), groups={};
for(const x of rows){
  const C=ctx.CL(item(x)), id=C.cat?C.cat.id:"", N=ctx.NU(C.nut,id); if(!N) continue;
  const k=id||("_"+(C.nova||0)); (groups[k]=groups[k]||[[],[],[],[]]).forEach((a,i)=>a.push(N[i]));
}
const out={}; Object.keys(groups).sort().forEach(k=>out[k]=groups[k].map(a=>Math.round(med(a))));
fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace(/const R_MED=\{.*\};/,"const R_MED="+JSON.stringify(out).replace(/"(\w+)":/g,"$1:")+";"));
console.log(Object.keys(imp).length+" Arten für Schätzungen, "+Object.keys(out).length+" Arten für Mediane aktualisiert.");
