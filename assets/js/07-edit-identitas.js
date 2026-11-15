
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const form=$('s95editIdentityForm'), panel=$('s95editIdentityPanel');
 if(!form||!panel)return;
 let target=null,original=null,busy=false;
 function close(){if(busy)return;panel.hidden=true;target=null;original=null;form.reset();$('s95editIdentityStatus').textContent='Pilih tombol Edit Identitas pada pegawai.';}
 $('s95editCancel').addEventListener('click',close);
 $('s95body').addEventListener('click',event=>{
   const btn=event.target.closest('[data-s95-edit-user]');if(!btn)return;
   const uid=btn.getAttribute('data-s95-edit-user');
   const p=(typeof s953profiles!=='undefined'?s953profiles:[]).find(row=>row.user_id===uid);
   const role=typeof s953roles!=='undefined'?s953roles.get(uid):null;
   if(s95role!=='admin_kua'||!s953trusted||s953personal||role!=='pegawai'||!p||p.kua_id!==s67profile?.kua_id||uid===s67currentUser){alert('Hanya identitas pegawai dalam KUA yang sama dapat diedit.');return;}
   target=uid;original={nama:p.nama||'',nip_id:p.nip_id||'',jabatan:p.jabatan||'',kua_id:p.kua_id};
   $('s95editName').value=original.nama;
   $('s95editNip').value=original.nip_id;
   $('s95editJob').value=original.jabatan;
   if($('s95editJob').value!==original.jabatan){
     const option=new Option(original.jabatan+' (jabatan saat ini)',original.jabatan);
     $('s95editJob').add(option);$('s95editJob').value=original.jabatan;
   }
   $('s95editKua').value=s67profile?.kuaNama||'KUA sesuai penempatan akun';
   $('s95editIdentityStatus').textContent='Periksa ejaan nama, NIP dan jabatan sebelum menyimpan.';
   panel.hidden=false;panel.scrollIntoView({behavior:'smooth',block:'start'});
 });
 form.addEventListener('submit',async e=>{
   e.preventDefault();if(busy)return;
   const nama=$('s95editName').value.trim().replace(/\s+/g,' ');
   const nip_id=$('s95editNip').value.trim();
   const jabatan=$('s95editJob').value;
   const status=$('s95editIdentityStatus');
   if(!nama||nama.length<2||!/^[0-9]{8,24}$/.test(nip_id)||!jabatan){status.textContent='Nama wajib diisi, NIP harus 8–24 digit angka, dan jabatan wajib dipilih.';return;}
   if(!target||!original||s95role!=='admin_kua'||!s953trusted||s953personal||!s67client||!s67currentUser||original.kua_id!==s67profile?.kua_id){status.textContent='Sesi atau ruang lingkup KUA tidak valid. Muat ulang dahulu.';return;}
   if(nama===original.nama&&nip_id===original.nip_id&&jabatan===original.jabatan){status.textContent='Tidak ada perubahan identitas.';return;}
   if(!confirm('Ubah identitas pegawai dari "'+original.nama+'" menjadi "'+nama+'"?\nData LCKH dan ID akun tidak akan berubah.'))return;
   busy=true;$('s95editSave').disabled=true;$('s95editCancel').disabled=true;status.textContent='Memverifikasi izin dan menyimpan profil…';
   try{
     const auth=await s67client.auth.getUser();
     if(auth.error||auth.data?.user?.id!==s67currentUser)throw Error('Sesi Admin KUA tidak valid. Silakan login ulang.');
     const check=await s67client.from('sikap_profil').select('user_id,kua_id,nama,nip_id,jabatan').eq('user_id',target).eq('kua_id',s67profile.kua_id).maybeSingle();
     if(check.error)throw Error(check.error.message);
     if(!check.data||check.data.kua_id!==original.kua_id)throw Error('Pegawai tidak ditemukan dalam KUA Anda.');
     if(check.data.nama!==original.nama||check.data.nip_id!==original.nip_id||check.data.jabatan!==original.jabatan)throw Error('Data pegawai berubah sejak dibuka. Muat ulang sebelum mengedit.');
     const res=await s67client.from('sikap_profil').update({nama,nip_id,jabatan}).eq('user_id',target).eq('kua_id',original.kua_id).eq('nama',original.nama).eq('nip_id',original.nip_id).eq('jabatan',original.jabatan).select('user_id,nama,nip_id,jabatan,kua_id');
     if(res.error)throw Error(res.error.message);
     if(!res.data||res.data.length!==1)throw Error('Perubahan tidak terkonfirmasi. Periksa kebijakan RLS dan izin UPDATE sikap_profil.');
     status.textContent='Identitas berhasil diperbarui. Memuat ulang daftar pegawai…';
     // Master profil laporan memiliki data tanda tangan terpisah; jangan ubah tanpa otorisasi.
     target=null;original=null;
     if(typeof s95load==='function')await s95load();
     status.textContent='Berhasil. Identitas akun pegawai telah diperbarui; data LCKH tidak diubah. Jika nama pada laporan cetak masih lama, periksa profil laporan pegawai.';
   }catch(error){status.textContent='Belum berhasil: '+(error?.message||String(error))+' Tidak ada data LCKH yang diedit.';}
   finally{busy=false;$('s95editSave').disabled=false;$('s95editCancel').disabled=false;}
 });
})();
