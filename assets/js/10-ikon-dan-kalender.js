// Ikon SVG konsisten; kalender ringkas mengikuti desain aplikasi.
(function(){
 const paths={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
 entry:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M12 8v8m-4-4h8"/>',
 history:'<path d="M3 11a9 9 0 1 1 2.6 7.4M3 5v6h6m3-4v5l3 2"/>',
 reports:'<path d="M4 21V12h4v9m2 0V7h4v14m2 0V3h4v18"/>',
 settings:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 5 3 3 5-5"/>',
 left:'<path d="m14 6-6 6 6 6"/>',right:'<path d="m10 6 6 6-6 6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>'
 };
 function icon(key){return '<svg class="sikap-ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[key]+'</svg>';}
 function navigation(){
  const keys=['home','entry','history','reports','settings'];
  ['#nav','#footnav'].forEach(selector=>document.querySelectorAll(selector+' button').forEach((button,i)=>{
   const slot=button.querySelector(selector==='#nav'?'span':'b');if(slot&&keys[i])slot.innerHTML=icon(keys[i]);
  }));
 }
 const renderBase=render;
 render=function(){renderBase();navigation();};
 navigation();
 const calendarBase=sikapKalenderRender;
 sikapKalenderRender=function(){
  calendarBase();
  const panel=document.querySelector('.sikap-calendar-panel');if(!panel)return;
  const title=panel.querySelector('h2');if(title)title.innerHTML=icon('calendar')+'<span>Kalender LCKH</span>';
  const toolbar=panel.querySelector('.sikap-calendar-toolbar');if(toolbar){const arrows=toolbar.querySelectorAll('button');if(arrows[0])arrows[0].innerHTML=icon('left');if(arrows[1])arrows[1].innerHTML=icon('right');}
  const summary=panel.querySelector('.sikap-calendar-summary');
  if(summary){const labels=['Kegiatan','Hari terisi','Belum terisi*'];summary.querySelectorAll('span').forEach((cell,i)=>{const value=cell.querySelector('b')?.textContent||'0';cell.innerHTML=icon('calendar')+'<div><b>'+h(value)+'</b><small>'+labels[i]+'</small></div>';});}
  const grid=panel.querySelector('.sikap-calendar-grid');if(grid){
   grid.querySelectorAll('.sikap-calendar-day.filled small').forEach(label=>{label.textContent=label.textContent.replace(' kerja',' keg.');});
   // Tujuh judul hari + sel minggu penuh, termasuk akhir bulan.
   while((grid.children.length-7)%7){const blank=document.createElement('span');blank.className='sikap-calendar-blank';blank.setAttribute('aria-hidden','true');grid.append(blank);}
  }
  const legend=panel.querySelector('.sikap-calendar-legend');if(legend)legend.innerHTML='<span><i class="dot filled"></i>Terisi</span><span><i class="dot empty"></i>Belum</span><span><i class="dot today"></i>Hari ini</span>';
 };
 // Beranda mungkin sudah dirender saat pemulihan sesi selesai lebih awal.
 if(document.querySelector('.sikap-calendar-panel'))sikapKalenderRender();
})();
