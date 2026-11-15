// Antarmuka web responsif dan instalasi PWA; data tetap melalui modul daring.
(function(){
 const main=document.querySelector('#sikapApp .main');
 if(main){
  const header=document.createElement('div');header.className='sikap-app-header';
  header.innerHTML='<div class="sikap-app-brand"><img src="assets/images/sikap-logo.png?v=3" alt=""><div><strong>SIKAP</strong><span>Sistem Kinerja Pegawai KUA</span></div></div><button id="sikapInstall" type="button" aria-label="Pasang aplikasi SIKAP">Pasang</button>';
  main.prepend(header);
 }
 const baseHome=home;
 home=function(){
  baseHome();
  const layout=document.querySelector('.sikap-home-layout');if(!layout)return;
  const identity=document.createElement('button');identity.type='button';identity.className='sikap-home-person';identity.onclick=()=>go('settings');
  const avatar=document.createElement('span');avatar.className='sikap-home-avatar';avatar.textContent=Array.from(String(db.profile.name||'P').trim())[0].toUpperCase();
  const text=document.createElement('span'),name=document.createElement('strong'),unit=document.createElement('small');name.textContent=db.profile.name||'Pegawai';unit.textContent=db.profile.unit||'Unit kerja';text.append(name,unit);identity.append(avatar,text);const arrow=document.createElement('span');arrow.textContent='›';arrow.setAttribute('aria-hidden','true');identity.append(arrow);layout.prepend(identity);
  const add=document.createElement('button');add.type='button';add.className='btn sikap-calendar-add';add.textContent='＋ Isi LCKH';add.onclick=()=>go('entry');document.querySelector('.sikap-calendar-panel').append(add);
  const recent=document.querySelector('.sikap-home-recent');if(recent){recent.querySelectorAll(':scope > div:not(.section-head)').forEach(x=>x.classList.add('sikap-recent-card'));}
 };
 const baseHistory=history;
 history=function(){baseHistory();document.querySelector('#content>section')?.classList.add('sikap-history-cards');document.querySelectorAll('.sikap-history-cards tbody tr').forEach(row=>{['Tanggal','Kegiatan','Output','Volume','Aksi'].forEach((label,i)=>{if(row.children[i])row.children[i].dataset.label=label;});});};
 const nav=document.querySelector('#footnav');if(nav)nav.setAttribute('aria-label','Menu aplikasi');
 const baseRender=render;
 render=function(){baseRender();document.querySelectorAll('#nav button,#footnav button').forEach(button=>{if(button.classList.contains('active'))button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});};
 let installPrompt=null;
 const install=document.querySelector('#sikapInstall');
 function updateInstall(){if(install)install.hidden=window.matchMedia('(display-mode: standalone)').matches||Boolean(navigator.standalone);}
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;updateInstall();});
 if(install)install.onclick=async()=>{
  if(installPrompt){const prompt=installPrompt;installPrompt=null;await prompt.prompt();await prompt.userChoice;updateInstall();}
  else if(/iPad|iPhone|iPod/.test(navigator.userAgent))alert('Pasang SIKAP: buka dengan Safari, ketuk Bagikan, lalu pilih Tambahkan ke Layar Utama.');
  else alert('Pasang SIKAP melalui menu browser: pilih Instal aplikasi atau Tambahkan ke layar utama. Jika belum tersedia, muat ulang setelah membuka situs melalui HTTPS.');
 };
 updateInstall();window.addEventListener('appinstalled',()=>{installPrompt=null;if(install)install.hidden=true;});
 const status=document.createElement('div');status.className='sikap-network-status';status.setAttribute('role','status');status.textContent='Tidak ada koneksi. Hubungkan internet untuk memuat dan menyimpan LCKH.';document.body.prepend(status);
 function network(){status.hidden=navigator.onLine;}network();window.addEventListener('online',network);window.addEventListener('offline',network);
 if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(error=>console.warn('Instalasi aplikasi belum tersedia:',error.message));
})();
