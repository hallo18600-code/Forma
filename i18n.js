// Health Maxxing – Übersetzungen
// Die App ist auf Deutsch geschrieben. Für andere Sprachen wird nach jedem Aufbau der Text auf dem Bildschirm
// übersetzt (Wörterbuch in i18n/<sprache>.js). Zahlen werden dabei als Platzhalter behandelt ({0}, {1} …),
// zusammengesetzte Texte („A · B“) Stück für Stück. Gespeicherte Werte bleiben deutsch, die Logik ändert sich nicht.
const LANGS = { de:"Deutsch", en:"English", fr:"Français", es:"Español", it:"Italiano", nl:"Nederlands" };
const LOCALES = { de:"de-DE", en:"en-GB", fr:"fr-FR", es:"es-ES", it:"it-IT", nl:"nl-NL" };
function langPick(p){
  if(p && LANGS[p]) return p;
  const n=((navigator.languages&&navigator.languages[0])||navigator.language||"de").slice(0,2).toLowerCase();
  return LANGS[n]?n:"en";
}
const LANG = (()=>{ try{ return langPick(((JSON.parse(localStorage.getItem("forma-app-v1"))||{}).profile||{}).lang); }catch(e){ return langPick(); } })();
const LOC = LOCALES[LANG];
const QUOTE = { de:["„","“"], en:["“","”"], fr:["« "," »"], es:["«","»"], it:["«","»"], nl:["“","”"] };
window.I18N = window.I18N || {};
const I18N_CACHE = new Map();
// Zahlen (auch 1.234 / 12,5 / 2 974) → {0}; Uhrzeiten bleiben ganz
const NUM_RE = /\d+(?:[.,  ]\d+)*/g;
function trNorm(s){ const nums=[]; const k=s.replace(NUM_RE,m=>{ nums.push(m); return "{"+(nums.length-1)+"}"; }); return [k,nums]; }
function trFill(t,nums){ return t.replace(/\{(\d+)\}/g,(m,i)=>nums[+i]!=null?nums[+i]:m); }
const TR_SEPS = [" · "," + "," → ",". ",": ",", "," / "," – "];
// Muster mit {*} (z. B. „Details zu {*}“) einmal vorbereiten
let TR_W=null;
function trWild(D){ if(!TR_W) TR_W=Object.keys(D).filter(k=>k.includes("{*}")).map(k=>[new RegExp("^"+k.replace(/[.*+?^$()|[\]\\]/g,"\\$&").replace("\\{\\*\\}","(.+)").replace("{\\*}","(.+)")+"$"),D[k]]); return TR_W; }
function tr(s){
  if(LANG==="de"||!s) return s;
  const D=I18N[LANG]; if(!D) return s;
  if(I18N_CACHE.has(s)) return I18N_CACHE.get(s);
  // Rand abtrennen: Leerzeichen, Emojis/Symbole vorne, Pfeile hinten, Anführungszeichen außen
  const mm=s.match(/^([^\p{L}\p{N}{(+\-–~„]*)([\s\S]*?)([\s›▾▴⌄…]*)$/u);
  let lead=mm[1], core=mm[2], tail=mm[3];
  if(/^„.*“$/s.test(core)){ const r=lead+QUOTE[LANG][0]+tr(core.slice(1,-1))+QUOTE[LANG][1]+tail; I18N_CACHE.set(s,r); return r; }
  let out=core;
  if(core&&/[A-Za-zÄÖÜäöüß]/.test(core)){
    if(D[core]!=null) out=D[core];
    else {
      const [k,nums]=trNorm(core);
      const w=!D[k]&&trWild(D).find(([re])=>re.test(core));
      if(D[k]!=null) out=trFill(D[k],nums);
      else if(w){ const m=core.match(w[0]); out=w[1].replace("{*}",tr(m[1])); }
      else {
        // Klein geschriebener Satzanfang („nach 8 Wochen …“): groß nachschlagen, klein zurückgeben
        const up=core[0].toUpperCase()+core.slice(1), ku=trNorm(up)[0];
        // Satzzeichen am Ende („… Sonne.“, „Abnehmen ·“): ohne nachschlagen, Zeichen wieder anhängen
        const pm=core.match(/^([\s\S]*?[^\s.·,:;])(\s*[.·,:;])$/), pk=pm&&trNorm(pm[1])[0];
        if(up!==core&&(D[up]!=null||D[ku]!=null)){ const t=D[up]!=null?D[up]:trFill(D[ku],nums); out=t[0].toLowerCase()+t.slice(1); }
        else if(pm&&(D[pm[1]]!=null||D[pk]!=null)) out=tr(pm[1])+pm[2];
        else {
          // Zusammengesetzt: am stärksten Trenner zuerst teilen, Teile einzeln übersetzen
          const sep=TR_SEPS.find(x=>core.includes(x));
          if(sep) out=core.split(sep).map(p=>tr(p)).join(sep);
        }
      }
    }
  }
  const r=lead+out+tail; if(I18N_CACHE.size<20000) I18N_CACHE.set(s,r); return r;
}
// Texte und Beschriftungen eines Bereichs übersetzen. Elemente mit class="notr" (z. B. Lebensmittelnamen) bleiben.
function trDom(root){
  if(LANG==="de"||!root) return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{
    const p=n.parentElement; if(!p||!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
    if(p.closest(".notr,script,style,textarea")) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT; }});
  const list=[]; while(w.nextNode()) list.push(w.currentNode);
  list.forEach(n=>{ const t=tr(n.nodeValue); if(t!==n.nodeValue) n.nodeValue=t; });
  root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(el=>{
    ["placeholder","aria-label","title"].forEach(a=>{ const v=el.getAttribute(a); if(v){ const t=tr(v); if(t!==v) el.setAttribute(a,t); } });
  });
}
// Für Texte außerhalb der Seite (z. B. confirm/alert)
function T(s){ return tr(s); }
document.documentElement.lang = LANG;
// Alles, was in #app neu angezeigt wird, automatisch übersetzen (auch Teil-Updates außerhalb von render())
function trWatch(){
  if(LANG==="de") return;
  const root=document.getElementById("app"); if(!root) return;
  const mo=new MutationObserver(()=>{ mo.disconnect(); trDom(root); mo.observe(root,{childList:true,subtree:true,characterData:true}); });
  trDom(root); mo.observe(root,{childList:true,subtree:true,characterData:true});
}
document.addEventListener("DOMContentLoaded",trWatch);
