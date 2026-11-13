(function(H){
 'use strict';
 const clamp=x=>Math.max(0,Math.min(1,x)), ease=x=>{x=clamp(x);return x*x*(3-2*x)};
 const noise=x=>Math.sin(x*1.71)*.5+Math.sin(x*4.13)*.29+Math.sin(x*9.7)*.13;
 // Shared torn boundaries keep the pieces fitted together before separation.
 const vertices=[[0,0],[208,0],[360,0],[360,148],[360,329],[360,450],[170,450],[0,450],[0,285],[0,108],[128,137],[249,243],[107,333]];
 const outlines=[[0,1,10,9],[1,2,3,11,10],[9,10,12,8],[10,11,12],[3,4,11],[4,5,6,12,11],[8,12,6,7]];
 const boundaries=new Map();
 function tornEdge(a,b){
  const reverse=a>b;if(reverse)[a,b]=[b,a];const key=a+':'+b;
  if(!boundaries.has(key)){
   const A=vertices[a],B=vertices[b],dx=B[0]-A[0],dy=B[1]-A[1],length=Math.hypot(dx,dy),n=Math.ceil(length/2);
   const outside=(A[0]===B[0]&&(A[0]===0||A[0]===360))||(A[1]===B[1]&&(A[1]===0||A[1]===450));
   const pts=[];for(let j=0;j<=n;j++){const t=j/n;const d=outside?0:Math.sin(Math.PI*t)*(noise(t*6+a+b)*15+noise(t*67+a*9)*3);pts.push([A[0]+dx*t-dy/length*d,A[1]+dy*t+dx/length*d]);}boundaries.set(key,pts);
  }const pts=boundaries.get(key);return reverse?pts.slice().reverse():pts;
 }
 const scraps=outlines.map(ids=>{const pts=ids.flatMap((a,i)=>tornEdge(a,ids[(i+1)%ids.length]).slice(0,-1));return {pts,cx:ids.reduce((s,i)=>s+vertices[i][0],0)/ids.length,cy:ids.reduce((s,i)=>s+vertices[i][1],0)/ids.length};});

 // A moving density field gives the flame soft, irregular boundaries rather than vector outlines.
 const fireCanvas=document.createElement('canvas');fireCanvas.width=210;fireCanvas.height=190;
 const fireContext=fireCanvas.getContext('2d'),firePixels=fireContext.createImageData(210,190);
 const randomGrid=new Float32Array(65536);let seed=731;
 for(let i=0;i<randomGrid.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;randomGrid[i]=(seed>>>0)/4294967295;}
 function field(x,y){const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);const a=randomGrid[((iy&255)<<8)+(ix&255)],b=randomGrid[((iy&255)<<8)+((ix+1)&255)],c=randomGrid[(((iy+1)&255)<<8)+(ix&255)],d=randomGrid[(((iy+1)&255)<<8)+((ix+1)&255)];return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;}
 function drawFire(g,front,time){
  const data=firePixels.data,seconds=time*4.4;
  const base=front(180),top=base-235;
  for(let py=0;py<190;py++)for(let px=0;px<210;px++){
   const x=px*2-30,y=top+py*1.6,edge=front(clamp(x/360)*360),rise=edge-y;
   const idx=(py*210+px)*4;
   if(x<0||x>360||rise<0||rise>225||edge<=0||edge>450){data[idx+3]=0;continue;}
   const h=Math.max(0,rise)/210;
   const warp=(field(x*.017, rise*.016-seconds*1.8)-.5)*55*h;
   const n=field((x+warp)*.035,rise*.018+seconds*2.9)*.64+field((x+warp)*.078,rise*.041+seconds*4.6)*.26+field(x*.16,rise*.095+seconds*6.5)*.10;
   const fuel=.71+.16*Math.sin(x*.051)+.13*Math.sin(x*.113+1.9);
   const density=fuel-h*1.1+(n-.5)*1.15;
   const side=ease(x/8)*ease((360-x)/8)*ease(time/.035)*ease(edge/32),bottom=1;
   const alpha=ease((density-.16)/.24)*side*bottom*(1-ease((h-.78)/.22));
   const heat=clamp((density-.27)*1.65);
   data[idx]=255;data[idx+1]=Math.round(69+186*Math.pow(heat,.65));data[idx+2]=Math.round(8+222*Math.pow(heat,3.1));data[idx+3]=Math.round(alpha*235);
  }
  fireContext.putImageData(firePixels,0,0);
  g.save();g.imageSmoothingEnabled=true;g.globalAlpha*=.19;g.filter='blur(9px)';g.drawImage(fireCanvas,-30,top,420,304);g.restore();
  g.save();g.imageSmoothingEnabled=true;g.filter='blur(0.7px)';g.drawImage(fireCanvas,-30,top,420,304);g.restore();
 }


 // Freeze the exact editor appearance for tearing: same typography, theme, text and scroll.
 function copyEditor(source){
  const clone=source.cloneNode(true),originals=[source,...source.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')];
  originals.forEach((el,i)=>{const copy=copies[i],style=getComputedStyle(el);for(const name of style)copy.style.setProperty(name,style.getPropertyValue(name));copy.removeAttribute('id');copy.removeAttribute('autofocus');copy.setAttribute('tabindex','-1');if('value' in el)copy.value=el.value;copy.style.animation='none';copy.style.transition='none';});
  clone.style.cssText+=';position:absolute;inset:0 auto auto 0;margin:0;transform:none;box-sizing:border-box;pointer-events:none;';
  return {clone,restoreScroll:()=>originals.forEach((el,i)=>{copies[i].scrollTop=el.scrollTop;copies[i].scrollLeft=el.scrollLeft;})};
 }
 const pending=new WeakMap();
 H.releasePaper=function(paper,kind){if(pending.has(paper))return pending.get(paper);const task=new Promise(resolve=>{
  if(document.documentElement.classList.contains('no-anim')||matchMedia('(prefers-reduced-motion: reduce)').matches){resolve();return;}
  paper.dataset.releasing='1';
  const old={visibility:paper.style.visibility,clipPath:paper.style.clipPath,webkitClipPath:paper.style.webkitClipPath,pointerEvents:paper.style.pointerEvents};
  const layer=document.createElement('div');layer.setAttribute('aria-hidden','true');layer.style.cssText='position:fixed;inset:0;z-index:10000;pointer-events:none;overflow:hidden;';document.body.appendChild(layer);
  const c=document.createElement('canvas');c.style.cssText='position:absolute;pointer-events:none;';let pieces=[];
  if(kind==='burn')layer.appendChild(c);
  else {
   const r=paper.getBoundingClientRect();
   pieces=scraps.map(scrap=>{const holder=document.createElement('div');holder.style.cssText='position:absolute;pointer-events:none;';holder.style.width=r.width+'px';holder.style.height=r.height+'px';const polygon='polygon('+scrap.pts.map(([x,y])=>(x/360*100)+'% '+(y/450*100)+'%').join(',')+')';holder.style.clipPath=polygon;holder.style.webkitClipPath=polygon;const frozen=copyEditor(paper);frozen.clone.style.width=r.width+'px';frozen.clone.style.height=r.height+'px';holder.appendChild(frozen.clone);layer.appendChild(holder);frozen.restoreScroll();return {holder,...scrap};});
   paper.style.visibility='hidden';
  }
  paper.style.pointerEvents='none';let raf,ended=false,timeout;
  const done=()=>{if(ended)return;ended=true;cancelAnimationFrame(raf);clearTimeout(timeout);layer.remove();Object.assign(paper.style,old);delete paper.dataset.releasing;resolve();};
  const start=performance.now();timeout=setTimeout(done,5500);
  const tick=now=>{try{
   if(!paper.isConnected)return done();const t=clamp((now-start)/4400),r=paper.getBoundingClientRect();
   if(kind==='burn'){
    const progress=ease(t/.88),front=x=>Math.max(0,Math.min(450,450-progress*515+(noise(x/35)*15+Math.sin(x/83+progress*5)*12)*ease(t/.12)));
    const edge=[];for(let x=0;x<=360;x+=3)edge.push([x,front(x)]);
    const polygon='polygon(0% 0%,100% 0%,'+edge.slice().reverse().map(([x,y])=>(x/360*100)+'% '+(y/450*100)+'%').join(',')+')';paper.style.clipPath=polygon;paper.style.webkitClipPath=polygon;
    // Canvas contains only flames. The editor itself is consumed in place.
    const d=Math.min(devicePixelRatio||1,1.5),pad=100;c.style.left=(r.left-30)+'px';c.style.top=(r.top-pad)+'px';c.style.width=(r.width+60)+'px';c.style.height=(r.height+pad)+'px';
    const w=Math.round((r.width+60)*d),h=Math.round((r.height+pad)*d);if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;const g=c.getContext('2d');g.clearRect(0,0,w,h);g.save();g.scale(d,d);g.translate(30,pad);g.scale(r.width/360,r.height/450);g.globalAlpha=1-ease((t-.84)/.16);if(progress>0&&progress<1)drawFire(g,front,t);g.restore();
   }else for(let i=0;i<pieces.length;i++){
    const {holder,cx,cy}=pieces[i],split=ease((t-.08-(i%3)*.045)/.34),fall=ease((t-.53-(i%4)*.025)/.43);
    holder.style.left=r.left+'px';holder.style.top=r.top+'px';holder.style.transformOrigin=(cx/360*100)+'% '+(cy/450*100)+'%';holder.style.transform='translate('+((cx-180)*r.width/360*split*.28+noise(i*5)*split*15+Math.sin(i*4+t*9)*fall*40)+'px,'+((cy-225)*r.height/450*split*.16+fall*360)+'px) rotate('+(noise(i*7+1)*split*.30+(i%2?1:-1)*fall*.9)+'rad)';holder.style.opacity=1-ease((t-.84)/.16);
   }
   if(t<1)raf=requestAnimationFrame(tick);else done();
  }catch(e){done();}};raf=requestAnimationFrame(tick);
 });pending.set(paper,task);task.then(()=>pending.delete(paper));return task;};
})(window.H=window.H||{});
