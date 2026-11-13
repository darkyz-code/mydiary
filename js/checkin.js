(function(H){
 'use strict';
 H.dayCheckin=function(read,write,changed){
  const {h,ui}=H;let period=new Date().getHours()<18?'day':'evening';
  const host=h('div.day-checkin'),tabs=h('div.checkin-tabs'),body=h('div.checkin-body'),summary=h('p.checkin-summary');
  const labels={day:'День',evening:'Вечер'},keys={overall:'Настроение / самочувствие',energy:'Энергия, бодрость',stress:'Стресс, напряжение'};
  function refreshSummary(){const d=read(),g=H.metrics.general(d),p=d&&d.general&&d.general.periods||{};const val=v=>H.metrics.rating(v)==null?'не отмечено':v+'/10';summary.textContent=`День: ${val(p.day&&p.day.overall)} · Вечер: ${val(p.evening&&p.evening.overall)} · За день: ${val(g.overall==null?null:Math.round(g.overall*10)/10)}`;}
  function draw(){H.clear(tabs);H.clear(body);const d=read(),g=d&&d.general||{},p=g.periods&&g.periods[period]||{};
   for(const id of ['day','evening'])tabs.appendChild(h('button.btn'+(period===id?'.primary':''),{type:'button','aria-pressed':String(period===id),onclick:()=>{period=id;draw();}},labels[id]));
   body.appendChild(h('h4',period==='day'?'Как ты днём?':'Как ты вечером?'));
   const set=(key,value)=>{const d=write();d.general=d.general||{};d.general.periods=d.general.periods||{};const slot=d.general.periods[period]||(d.general.periods[period]={});if(value==null||value==='')delete slot[key];else slot[key]=value;changed('general');refreshSummary();};
   for(const key of Object.keys(keys)){const slider=ui.slider({value:H.metrics.rating(p[key]),min:0,max:10,mode:key==='stress'?'bad':'good',onChange:v=>set(key,v)});slider.setAttribute('aria-label',keys[key]+' — '+labels[period]);body.appendChild(h('div.checkin-field',h('span',keys[key]),slider));}
   body.appendChild(ui.textarea(p.note||'',v=>set('note',v),'Пара слов об этой части дня — по желанию',2));
   if(['overall','energy','stress'].some(k=>H.metrics.rating(g[k])!=null))body.appendChild(h('p.faint','Ранее за день: '+Object.keys(keys).filter(k=>H.metrics.rating(g[k])!=null).map(k=>keys[k]+' '+g[k]+'/10').join(' · ')+'. Для каждого показателя новые отметки используются вместо прежней общей оценки.'));
   refreshSummary();
  }
  host.append(tabs,body,summary,h('small.faint','Можно заполнить только одну часть дня. Сон, эмоции, симптомы и лекарства остаются общими за день.'));draw();return host;
 };
})(window.H);
