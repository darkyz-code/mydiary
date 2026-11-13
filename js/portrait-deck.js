(function(H){
 'use strict';
 H.pickPortraitQuestion=function(items,answers,state,random=Math.random){
  if(!items.length)return null;
  const ids=new Set(items.map(x=>x.id));
  state.seen=Array.isArray(state.seen)?state.seen.filter(id=>ids.has(id)):[];
  let fresh=items.filter(x=>!state.seen.includes(x.id));
  if(!fresh.length){state.seen=[];fresh=items.filter(x=>items.length===1||x.id!==state.last);}
  const unanswered=fresh.filter(x=>!answers[x.id]||!String(answers[x.id].text||'').trim());
  const pool=unanswered.length?unanswered:fresh;
  const chosen=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
  state.seen.push(chosen.id);state.last=chosen.id;return chosen;
 };
})(window.H);
