// Header bersama untuk pegawai, Admin KUA dan Super Admin.
(function(){
 const bar=document.getElementById('onlineBar');
 const header=document.querySelector('.sikap-app-header');
 if(!bar||!header)return;
 // Pindahkan elemen asli agar handler login/logout dan pengamanan tombol tetap bekerja.
 bar.parentNode.insertBefore(header,bar);
 header.classList.add('sikap-global-header');
 const actions=document.createElement('div');actions.className='sikap-header-actions';
 header.appendChild(actions);const install=document.getElementById('sikapInstall');if(install)actions.appendChild(install);actions.appendChild(bar);
 const reload=document.getElementById('s67reload');if(reload){reload.title='Muat ulang data';reload.setAttribute('aria-label','Muat ulang data');}
})();
