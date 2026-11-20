
'use strict';
let s67client=null,s67profile=null,s67currentUser=null,s95role=null;
const s67id=id=>document.getElementById(id);
const s67msg=(message,failed=false)=>{const el=s67id('s67msg');el.textContent=message;el.style.background=failed?'#fee9e6':'#eaf4ed';};
let s67busy=false;
async function s67run(action){if(s67busy)return;s67busy=true;document.querySelectorAll('#onlineGate button,#onlineBar button').forEach(x=>x.disabled=true);try{await action()}catch(e){s67msg('Gagal: '+(e?.message||String(e)),true)}finally{s67busy=false;document.querySelectorAll('#onlineGate button,#onlineBar button').forEach(x=>x.disabled=false)}}
s67id('s67connect').onclick=()=>s67run(async()=>{
  const url=s67id('s67url').value.trim().replace(/\/$/,'');const key=s67id('s67key').value.trim();
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||!key)throw Error('URL atau publishable key tidak valid.');
  if(!window.supabase?.createClient)throw Error('Supabase JS belum termuat. Periksa koneksi internet.');
  s67client=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  s67id('s67loginarea').hidden=false;s67msg('Memeriksa sesi akun…');
  // Pemulihan sesi: jangan mengeluarkan pengguna hanya karena masalah jaringan sementara.
  // Client Supabase mempertahankan/menyegarkan refresh token melalui storage standar.
  let recovered=null,sessionError=null;
  for(let attempt=0;attempt<3;attempt++){
    const result=await s67client.auth.getSession();
    if(result.data?.session?.user?.id){recovered=result.data.session;break;}
    sessionError=result.error;
    if(attempt<2)await new Promise(resolve=>setTimeout(resolve,350*(attempt+1)));
  }
  if(!recovered){
    s67msg(sessionError?'Sesi belum bisa dipulihkan. Periksa koneksi lalu muat ulang; sesi tidak dihapus.':'Silakan masuk menggunakan akun Anda.',!!sessionError);
    return;
  }
  s67id('s67loginarea').hidden=true;
  try{
    // getSession() menggunakan token yang dikelola SDK. Akses akhir tetap divalidasi
    // oleh RLS ketika membaca profil, peran, dan LCKH.
    await s67finishLogin(recovered.user.id);
  }catch(restoreErr){
    // Jangan otomatis signOut pada kesalahan pembacaan jaringan/RLS.
    s67msg('Sesi tersimpan, tetapi pemuatan dashboard belum berhasil: '+(restoreErr?.message||String(restoreErr))+'. Coba muat ulang halaman.',true);
    s67id('s67loginarea').hidden=true;
    s67id('s67retryRestore').hidden=false;
  }
 });
async function s67getRows(){
  const {data:u,error:ue}=await s67client.auth.getUser();if(ue||!u?.user)throw Error('Sesi sudah tidak berlaku; login ulang.');
  if(u.user.id!==s67currentUser)throw Error('Identitas sesi tidak sesuai; login ulang.');
  const {data:items,error}=await s67client.from('sikap_lckh').select('id,tanggal,created_at,kode_sp,fungsi,jabatan_kegiatan,sumber_kegiatan,nama_layanan,uraian_kegiatan,output_kegiatan,bukti_kegiatan,volume,satuan,keterangan,referensi_bukti').eq('user_id',s67currentUser).eq('kua_id',s67profile.kua_id).order('tanggal',{ascending:false}).order('created_at',{ascending:true}).limit(1000);
  if(error)throw Error('Tidak dapat membaca LCKH: '+error.message);
  if(items.length===1000)throw Error('Jumlah LCKH mencapai batas pemuatan 1000. Hubungi admin untuk pagination sebelum melanjutkan.');
  await sikapMuatTugasRangkap();
  db.entries=items.map(x=>({id:x.id,date:x.tanggal,createdAt:x.created_at||'',role:x.jabatan_kegiatan||'',source:x.sumber_kegiatan==='master'?'master':'manual',code:x.kode_sp||'',category:x.fungsi||'',service:x.nama_layanan||'',detail:x.uraian_kegiatan||'',output:x.output_kegiatan||'',evidence:x.bukti_kegiatan||'',volume:Number(x.volume),unit:x.satuan||'',note:x.keterangan||'',link:x.referensi_bukti||''}));
  render();
  s67id('s67identity').textContent=`${s67profile.nama||'Pegawai'} | ${s67profile.nip_id||'tanpa NIP'} | ${s67profile.kuaNama||'KUA terdaftar'} | ${u.user.email||''}`;
  s67id('onlineGate').hidden=true;s67id('sikapApp').style.display='flex';s67id('onlineBar').hidden=false;
  s67msg('Data LCKH berhasil dimuat: '+items.length+' kegiatan.');
}
s67id('s67login').onclick=event=>{event.preventDefault();s67run(async()=>{
 const identifier=s67id('s67email').value.trim(), password=s67id('s67password').value;
 if(!s67client)throw Error('Hubungkan Supabase dahulu.');
 if(!identifier||!password)throw Error('Masukkan email/NIP dan kata sandi.');
 let uid=null;
 try{
   if(identifier.includes('@')){
     const {data,error}=await s67client.auth.signInWithPassword({email:identifier,password});
     if(error)throw Error('Email/NIP atau kata sandi tidak sesuai.');
     uid=data?.user?.id;
   }else{
     if(!/^\d{8,24}$/.test(identifier))throw Error('NIP harus berupa 8–24 digit angka.');
     const {data,error}=await s67client.functions.invoke('sikap-login-nip',{body:{nip:identifier,password}});
     if(error||!data?.access_token||!data?.refresh_token)throw Error('Email/NIP atau kata sandi tidak sesuai.');
     const result=await s67client.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});
     if(result.error)throw Error('Sesi login tidak dapat diaktifkan.');
     uid=result.data?.user?.id;
   }
 }finally{s67id('s67password').value='';}
 if(!uid)throw Error('Login tidak menghasilkan user ID.');
 await s67finishLogin(uid);
});};
// Validasi akses satu jalur untuk login baru maupun pemulihan sesi.
async function s67finishLogin(uid){
 const [p,r]=await Promise.all([s67client.from('sikap_profil').select('user_id,kua_id,nama,nip_id,jabatan,aktif,wajib_ganti_sandi').eq('user_id',uid).maybeSingle(),s67client.from('sikap_peran').select('peran').eq('user_id',uid).maybeSingle()]);
 if(p.error||r.error)throw Error('Pembacaan profil/peran ditolak oleh database (RLS). '+(p.error||r.error).message+' Periksa kebijakan baca profil sendiri.');
 if(!p.data?.aktif||!['pegawai','admin_kua','super_admin'].includes(r.data?.peran)||(r.data.peran!=='super_admin'&&!p.data?.kua_id)){
  throw Error('Akun belum terverifikasi. Periksa apakah profil dan peran dapat dibaca oleh akun login, atau hubungi Admin KUA.');
 }
 if(p.data.wajib_ganti_sandi){
  s67currentUser=uid;s67profile=p.data;s95role=r.data.peran;
  s67id('s67loginarea').hidden=true;s67id('s67firstChange').hidden=false;
  s67msg('Login sementara diterima untuk '+(p.data.nama||'pengguna')+'. Silakan ganti kata sandi pertama.');
  return;
 }
 s95role=r.data.peran;
 s67currentUser=uid;s67profile=p.data;
 const k=await s67client.from('sikap_kua').select('nama').eq('id',p.data.kua_id).maybeSingle();
 s67profile.kuaNama=k.error?'KUA terdaftar':(k.data?.nama||'KUA terdaftar');
 db.profile.name=p.data.nama||'Pegawai';db.profile.nip=p.data.nip_id||'';db.profile.position=p.data.jabatan||'';db.profile.unit=s67profile.kuaNama;
 if(s95role==='super_admin'){
   db.entries=[];s67id('onlineGate').hidden=true;s67id('sikapApp').style.display='none';
   s67id('footnav').style.display='none';s67id('s95admin').style.display='none';
   s67id('s96super').style.display='block';s67id('onlineBar').hidden=false;
   s67id('s67identity').textContent=`${s67profile.nama||'Super Admin'} | Super Admin SIKAP`;
   s67id('s67reload').textContent='Muat Ulang Dashboard';
   await s96load();return;
 }
 // Admin KUA menggunakan layar terpisah, tanpa memuat atau menyimpan data pegawai ke browser.
 if(s95role==='admin_kua'){
   s953personal=false;db.entries=[]; s67id('onlineGate').hidden=true; s67id('sikapApp').style.display='none';
   s67id('footnav').style.display='none';s67id('s95admin').style.display='block';s67id('onlineBar').hidden=false;
   s67id('s67identity').textContent=`${s67profile.nama||'Admin KUA'} | ${s67profile.kuaNama}`;
   s67id('s67reload').textContent='Muat Ulang Dashboard';
   await s95load();return;
 }
 s67id('s95admin').style.display='none';s67id('footnav').style.display='';s67id('s67reload').textContent='Muat Ulang LCKH';
 await s91loadProfile();
 await s67getRows();
}
// Login pertama semua peran: gunakan Edge Function yang telah digunakan pada tahap V4.1.
// Tidak memberi akses dashboard sampai fungsi server berhasil memperbarui sandi dan status profil.
async function s67resetFirstChange(){
 await s67client?.auth.signOut();
 s67currentUser=null;s67profile=null;s95role=null;
 s67id('s67firstForm').reset();s67id('s67firstChange').hidden=true;
 s67id('s67loginarea').hidden=false;
}
s67id('s67firstCancel').onclick=()=>s67run(async()=>{await s67resetFirstChange();s67msg('Proses dibatalkan. Silakan login lagi.');});
s67id('s67firstForm').addEventListener('submit',ev=>{
 ev.preventDefault();s67run(async()=>{
  if(!s67client||!s67currentUser)throw Error('Sesi sementara tidak ditemukan. Login ulang.');
  const oldPass=s67id('s67oldPassword').value;
  const newPass=s67id('s67newPassword').value;
  const confirmPass=s67id('s67confirmPassword').value;
  if(newPass!==confirmPass)throw Error('Konfirmasi kata sandi tidak sama.');
  if(newPass.length<12||newPass.length>128||newPass===oldPass)throw Error('Gunakan sandi baru berbeda, minimal 12 karakter.');
  const {data:sessionData,error:sessionError}=await s67client.auth.getUser();
  if(sessionError||sessionData?.user?.id!==s67currentUser)throw Error('Sesi tidak cocok. Login ulang.');
  const {data,error}=await s67client.functions.invoke('sikap-ganti-sandi-pertama',{
   body:{password_lama:oldPass,password_baru:newPass}
  });
  if(error){
   let message=error.message||'Gagal mengganti sandi.';
   try{const detail=await error.context?.clone?.().json();message=detail?.message||detail?.error||message}catch{}
   throw Error(message);
  }
  // Hanya server yang berwenang menandai wajib_ganti_sandi=false.
  await s67resetFirstChange();
  s67msg((data?.message||'Kata sandi berhasil diganti.')+' Login kembali menggunakan kata sandi baru.');
 });
});
s67id('s67reload').onclick=()=>s67run(s95role==='super_admin'?s96load:(s95role==='admin_kua'&&!s953personal?s95load:s67getRows));
s67id('s67logout').onclick=()=>s67run(async()=>{
 await s67client?.auth.signOut();s67currentUser=null;s67profile=null;s95role=null;s953personal=false;db.entries=[];s67id('s95admin').style.display='none';s67id('s96super').style.display='none';s67id('s953backadmin').hidden=true;s67id('footnav').style.display='';db.profile={name:'',nip:'',position:'',rank:'',unit:'',organization:'',supervisorName:'',supervisorNip:'',supervisorPosition:''};
 s67id('s67firstChange').hidden=true;s67id('s67firstForm').reset();s67id('s67loginarea').hidden=false;s67id('onlineBar').hidden=true;s67id('sikapApp').style.display='none';s67id('onlineGate').hidden=false;s67msg('Sudah keluar. Silakan login ulang.');
});
// Tahap 7.9: INSERT, UPDATE, dan DELETE terbatas untuk baris simulasi manual.
// Penyimpanan V3.3 lokal dinonaktifkan agar tidak mencampur data uji online.
save=function(){};
const sikap77go=go;
go=function(tab){
 // Pengaturan dibuka pada Tahap 9.1; identitas administratif tetap hanya-baca.
 return sikap77go(tab);
};
// Hindari perubahan sumber atau jabatan saat edit; untuk master, kegiatan yang dipilih tetap identik.
const sikap77setMode=setMode;
setMode=function(mode){if(state.editId){alert('Saat EDIT, mode Master/Manual tidak dapat diubah. Batalkan edit jika ingin membuat kegiatan baru.');return;}return sikap77setMode(mode)};
const sikap77roleChange=roleChange;
roleChange=function(){if(state.editId){alert('Jabatan kegiatan tidak dapat diubah saat EDIT.');entry();return;}return sikap77roleChange()};
let sikap77saving=false;
submitEntry=async function(event){
 event?.preventDefault();
 if(sikap77saving)return;
 if(!s67client||!s67profile||!s67currentUser){alert('Silakan login ulang.');return;}
 const old=state.editId?db.entries.find(x=>x.id===state.editId):null;
 if(state.editId&&!old){alert('Data edit tidak ada di Riwayat online. Muat ulang LCKH.');return;}
 const manual=old?old.source==='manual':state.mode==='manual';
 const m=state.selected;
 if(!old&&!sikapPeranTersedia().includes(V('frole'))){toast('Pilih jabatan aktif atau penugasan rangkap.');return;}
 if(manual&&!old&&!sikapFungsiJabatan(V('frole')).some(([key])=>key===V('fcategory'))){toast('Pilih fungsi yang sesuai jabatan.');return;}
 if(!manual&&!old&&!sikapKegiatanTerpilih(m)){toast('Pilih kegiatan dari master yang sesuai jabatan.');return;}
 const e={
   date:V('fdate'),role:old?old.role:V('frole'),source:manual?'manual':'master',
   code:old?(old.code||''):(manual?'':m.code),category:old?old.category:(manual?V('fcategory'):m.category),
   service:old?old.service:(manual?FUNCTIONS9[V('fcategory')]:m.service),
   detail:manual?V('fdetail').trim():(old?.detail||m?.detail),
   output:V('foutput').trim(),
   evidence:V('fevidence').trim(),
   volume:Number(V('fvolume')),unit:sikapNilaiSatuan(),
   note:V('fnote').trim(),link:old?.link||''
 };
  const validLayanan=Boolean(e.code&&SIKAP_STANDAR_888[e.code]);
 const validFungsi=Boolean(!e.code&&FUNCTIONS9[e.category]&&e.category!=='I');
 if(!old&&!validLayanan&&!validFungsi){alert('Pilih 28 standar pelayanan atau Fungsi A–H.');return;}
 if(!sikapValidEntryDate(e.date)){alert('Tanggal pelaksanaan tidak valid.');return;}
 if((!old&&!e.role)||!e.detail||!e.output){alert('Jabatan, uraian, atau output belum lengkap.');return;}
 if(!e.unit){alert('Pilih satuan, atau isi satuan manual jika memilih Lainnya.');return;}
 if(!Number.isFinite(e.volume)||e.volume<=0){alert('Isi volume realisasi lebih dari nol.');return;}
 if(e.volume>9999999999.99||Math.abs(e.volume*100-Math.round(e.volume*100))>0.00001){alert('Volume maksimum 2 angka desimal.');return;}
 if(db.entries.some(x=>x.id!==old?.id&&x.date===e.date&&x.detail.trim().toLowerCase()===e.detail.toLowerCase()&&x.unit.trim().toLowerCase()===e.unit.toLowerCase())){
   if(!confirm('Ada kegiatan serupa pada tanggal ini. Tetap simpan kegiatan ini?'))return;
 }
 const mode=old?'UPDATE':'INSERT';
 if(!confirm('Simpan '+(old?'perubahan':'kegiatan')+' LCKH sebagai '+(s67profile.nama||'Pegawai')+'?\n\n'+e.date+' • '+e.detail+' • '+e.volume+' '+e.unit))return;
 sikap77saving=true;
 const submit=document.querySelector('#lckhForm button[type="submit"]');const submitLabel=submit?.textContent;if(submit){submit.disabled=true;submit.textContent='Menyimpan…';}
 try{
   const {data:userRes,error:userErr}=await s67client.auth.getUser();
   if(userErr||userRes?.user?.id!==s67currentUser)throw Error('Identitas sesi tidak sesuai; login ulang.');
   const payload={
     tanggal:e.date,kode_sp:e.code||null,fungsi:e.category,uraian_kegiatan:e.detail,
     volume:e.volume,satuan:e.unit,bukti_kegiatan:e.evidence||null,
     jabatan_kegiatan:e.role,sumber_kegiatan:e.source,nama_layanan:e.service,
     output_kegiatan:e.output,keterangan:e.note||null,referensi_bukti:e.link||null
   };
   let result;
   if(old){
     // RLS tetap menentukan izin akhir. Identitas pemilik tidak pernah diubah.
     const {kode_sp,fungsi,jabatan_kegiatan,sumber_kegiatan,nama_layanan,...changes}=payload;
     result=await s67client.from('sikap_lckh').update({...changes,updated_at:new Date().toISOString()})
       .eq('id',old.id).eq('user_id',s67currentUser).eq('kua_id',s67profile.kua_id).select('id');
   }else{
     result=await s67client.from('sikap_lckh').insert({...payload,user_id:s67currentUser,kua_id:s67profile.kua_id,id_master:null}).select('id');
   }
   if(result.error)throw Error(result.error.message);
   if(!Array.isArray(result.data)||result.data.length!==1){
      throw Error(mode+' tidak mengembalikan tepat 1 baris (hasil '+(result.data?.length??'tidak diketahui')+'). Periksa database; jangan ulangi tanpa verifikasi.');
   }
   const savedId=result.data[0].id;
   state.selected=null;state.editId=null;state.copyDraft=null;state.activityQuery='';state.mode='master';
   try{await s67getRows();go('history');sikapEntrySaved(e.date,Boolean(old));}
   catch(reloadError){alert(mode+' berhasil (ID '+savedId+'), tetapi pemuatan ulang gagal: '+reloadError.message+'\nJangan ulangi penyimpanan. Gunakan Muat Ulang LCKH.');}
 }catch(err){alert(mode+' tidak terkonfirmasi: '+(err?.message||String(err))+'\nPeriksa Riwayat atau Supabase sebelum mencoba lagi.');}
 finally{sikap77saving=false;if(submit?.isConnected){submit.disabled=false;submit.textContent=submitLabel;}}
};
// Tahap 9.5.12: DELETE terbatas lingkungan KUA terdaftar, entri MASTER/MANUAL milik akun sendiri.
// Pengamanan otoritatif: RLS pada public.sikap_lckh; filter user_id dan kua_id diterapkan juga di query.
let sikap79deleting=false;
removeEntry=async function(id){
  if(sikap79deleting||sikap77saving)return;
  if(!s67client||!s67currentUser||!s67profile){alert('Login ulang sebelum menghapus.');return;}

  const target=db.entries.find(e=>e.id===id);
  if(!target){alert('Data tidak ditemukan. Muat ulang Riwayat.');return;}
  if(!target.id){alert('ID kegiatan tidak tersedia. Muat ulang Riwayat.');return;}
  if(!confirm('Hapus permanen LCKH pribadi ini?\n\n'+target.date+' • '+target.detail+'\nVolume: '+target.volume+' '+target.unit+'\n\nHanya data milik akun ini yang dapat dihapus. Tindakan tidak bisa dibatalkan dari aplikasi.'))return;
  if(prompt('Konfirmasi penghapusan LCKH milik sendiri. Ketik: HAPUS','')!=='HAPUS'){
    alert('Penghapusan dibatalkan.');return;
  }
  sikap79deleting=true;
  try{
    const {data:auth,error:authErr}=await s67client.auth.getUser();
    if(authErr||auth?.user?.id!==s67currentUser)throw Error('Identitas sesi tidak sesuai; login ulang.');
    const {data,error}=await s67client.from('sikap_lckh').delete()
      .eq('id',target.id).eq('user_id',s67currentUser).eq('kua_id',s67profile.kua_id)
      .select('id');
    if(error)throw Error(error.message);
    if(!Array.isArray(data)||data.length!==1)
      throw Error('DELETE tidak mengembalikan tepat 1 baris ('+(data?.length??'tidak diketahui')+'). Periksa Riwayat/Supabase sebelum mencoba lagi.');
    try{await s67getRows();go('history');alert('LCKH berhasil dihapus.\nID: '+data[0].id);}
    catch(e){alert('DELETE berhasil, tetapi muat ulang gagal: '+e.message+'\nJangan ulangi DELETE.');}
  }catch(e){alert('DELETE belum terkonfirmasi: '+(e?.message||String(e))+'\nPeriksa Riwayat/Supabase sebelum mengulangi.');}
  finally{sikap79deleting=false;}
};
// Tahap 9.1: profil pelengkap laporan terpisah dari identitas administratif.
const s91fields={printPosition:'jabatan_laporan',rank:'pangkat_golongan',unit:'unit_kerja',organization:'unit_organisasi',supervisorName:'nama_atasan',supervisorNip:'nip_atasan',supervisorPosition:'jabatan_atasan'};
async function s91loadProfile(){
 if(!s67client||!s67currentUser||!s67profile)throw Error('Sesi profil belum tersedia.');
 const {data,error}=await s67client.from('sikap_profil_laporan')
  .select('jabatan_laporan,pangkat_golongan,unit_kerja,unit_organisasi,nama_atasan,nip_atasan,jabatan_atasan')
  .eq('user_id',s67currentUser).maybeSingle();
 if(error)throw Error('Gagal mengambil profil laporan: '+error.message);
 // Jangan pernah membaca identitas pegawai dari localStorage saat login.
 db.profile.name=s67profile.nama||'';
 db.profile.nip=s67profile.nip_id||'';
 db.profile.position=(data?.jabatan_laporan||s67profile.jabatan||'').trim();
 db.profile.printPosition=data?.jabatan_laporan||'';
 db.profile.rank=data?.pangkat_golongan||'';
 db.profile.unit=data?.unit_kerja||s67profile.kuaNama||'';
 db.profile.organization=data?.unit_organisasi||'Kantor Kementerian Agama Kab. Subang';
 db.profile.supervisorName=data?.nama_atasan||'';
 db.profile.supervisorNip=data?.nip_atasan||'';
 db.profile.supervisorPosition=data?.jabatan_atasan||'';
 return !!data;
}
settings=function(){
 const p=db.profile||{};
 const readOnly=[['name','Nama pegawai'],['nip','NIP / ID Pegawai']];
 const editable=[['printPosition','Jabatan kedinasan untuk laporan dan tanda tangan'],['rank','Pangkat / Golongan'],['unit','Unit kerja'],['organization','Unit organisasi'],['supervisorName','Nama atasan langsung'],['supervisorNip','NIP atasan'],['supervisorPosition','Jabatan atasan']];
 const field=(key,label,locked=false)=>`<div class="field"><label for="p_${key}">${h(label)}${locked?' (dari administrator)':''}</label><input id="p_${key}" value="${h(p[key]||'')}" placeholder="${h(label)}" ${locked?'readonly aria-readonly="true" style="background:#f0f4f0;color:#586c5e"':'maxlength="250"'}></div>`;
 E('content').innerHTML=`<section class="panel" style="margin-top:0"><h2>Identitas Pegawai dan Atasan — Online</h2><p class="info" style="margin-bottom:15px">Peran sistem (Admin KUA atau Pegawai) hanya menentukan hak akses. Isi <b>Jabatan kedinasan untuk laporan dan tanda tangan</b> sesuai jabatan sebenarnya, misalnya Pengadministrasi Perkantoran, Penghulu, atau Penyuluh Agama Islam. Jabatan cetak tidak mengubah kewenangan akun.</p><form id="s91profileForm" onsubmit="saveSettings(event)" class="formgrid">${readOnly.map(x=>field(x[0],x[1],true)).join('')}${editable.map(x=>field(x[0],x[1])).join('')}<div class="full actions"><button class="btn" id="s91save" type="submit">✓ Simpan Profil Online</button><button class="btn ghost" type="button" onclick="s91reload()">↻ Muat Profil dari Supabase</button></div><div class="full"><small class="muted" id="s91status">Data pelengkap laporan hanya dapat dibaca dan diperbarui oleh akun yang sedang login.</small></div></form></section><section class="panel"><h2>Cadangan dan Pemulihan</h2><p class="notice">Riwayat LCKH tersimpan secara daring. Fitur cadangan dan pemulihan melalui halaman ini tidak tersedia.</p></section><section class="panel"><h2>Status versi</h2><p class="notice">Periksa kelengkapan profil laporan sebelum mencetak dokumen.</p></section>`;
};
let s91saving=false;
saveSettings=async function(ev){
 ev?.preventDefault();
 if(s91saving)return;
 if(!s67client||!s67currentUser||!s67profile){alert('Silakan login ulang.');return;}
 const payload={user_id:s67currentUser};
 for(const [key,col] of Object.entries(s91fields))payload[col]=V('p_'+key).trim()||null;
 // Hindari upsert: UPDATE dan INSERT memiliki izin kolom berbeda.
 s91saving=true;
 const button=E('s91save');if(button)button.disabled=true;
 const status=E('s91status');if(status)status.textContent='Menyimpan ke Supabase…';
 try{
  const {data:auth,error:authError}=await s67client.auth.getUser();
  if(authError||auth?.user?.id!==s67currentUser)throw Error('Sesi tidak valid. Silakan login ulang.');
  const check=await s67client.from('sikap_profil_laporan').select('user_id').eq('user_id',s67currentUser).maybeSingle();
  if(check.error)throw Error(check.error.message);
  const result=check.data
   ?await s67client.from('sikap_profil_laporan').update(Object.fromEntries(Object.entries(payload).filter(([k])=>k!=='user_id'))).eq('user_id',s67currentUser).select('user_id')
   :await s67client.from('sikap_profil_laporan').insert(payload).select('user_id');
  if(result.error)throw Error(result.error.message);
  if(result.data?.length!==1)throw Error('Penyimpanan tidak mengembalikan tepat 1 baris. Periksa data sebelum mengulangi.');
  await s91loadProfile();
  settings();toast('Profil laporan berhasil disimpan ke Supabase');
 }catch(error){if(status)status.textContent='Gagal: '+(error?.message||String(error));alert('Profil belum terkonfirmasi tersimpan: '+(error?.message||String(error)));}
 finally{s91saving=false;if(button?.isConnected)button.disabled=false;}
};
async function s91reload(){
 if(!s67client||!s67currentUser){alert('Silakan login ulang.');return;}
 try{await s91loadProfile();settings();toast('Profil online dimuat ulang');}catch(e){alert('Gagal memuat profil: '+e.message);}
}
// Pengunduhan backup dari fungsi V3.3 bukan backup database online.
backup=function(){alert('Backup lokal dinonaktifkan dalam pengujian online. Gunakan prosedur backup server setelah disiapkan.');};
// editEntry asli mengisi state.editId dan membuka formulir; tidak mengubah database.
copyEntry=function(){alert('Penyalinan dinonaktifkan pada Tahap 7.9.')};
restoreFile=async function(){alert('Impor/pemulihan data lokal dinonaktifkan pada Tahap 7.9.')};

// Tahap 9.5: hanya pembacaan untuk admin_kua. Otorisasi akhir tetap RLS database.
let s95allProfiles=[],s95counts=new Map(),s95page=1;
function s95renderRows(){
 const tbody=s67id('s95body'),q=(s67id('s95filter')?.value||'').trim().toLowerCase(),status=s67id('s95statusfilter')?.value||'all',size=Number(s67id('s95size')?.value||10);
 const rows=s95allProfiles.filter(p=>[p.nama,p.nip_id,p.jabatan].join(' ').toLowerCase().includes(q)&&(status==='all'||(status==='active'?!!p.aktif:!p.aktif)));
 const pages=Math.max(1,Math.ceil(rows.length/size));s95page=Math.min(s95page,pages);
 tbody.innerHTML=rows.length?rows.slice((s95page-1)*size,s95page*size).map(p=>{const a=s95counts.get(p.user_id),role=s953roles.get(p.user_id),label=role==='admin_kua'?'Admin KUA':role==='pegawai'?'Pegawai':role||'Belum dapat dibaca';return `<tr><td>${h(p.nama||'-')}</td><td>${h(p.nip_id||'-')}</td><td>${h(p.jabatan||'-')}</td><td>${h(label)}</td><td>${p.aktif?'Aktif':'Tidak aktif'}</td><td>${a?.count||0}</td><td>${a?.days.size||0}</td><td>${s953trusted&&role==='pegawai'?`<button type="button" class="tinybtn" data-s953-user="${h(p.user_id)}">Lihat LCKH</button> <button type="button" class="tinybtn" data-s95-edit-user="${h(p.user_id)}">Edit Identitas</button>`:'—'}</td></tr>`}).join(''):'<tr><td colspan="8" class="empty">Tidak ada pegawai yang cocok.</td></tr>';
 s67id('s95paging').innerHTML=`<span class="mini">${rows.length} pengguna · Halaman ${s95page}/${pages}</span><button type="button" data-s95-dir="-1" ${s95page===1?'disabled':''}>←</button><button type="button" data-s95-dir="1" ${s95page===pages?'disabled':''}>→</button>`;
}
let s95busy=false;
async function s95load(){
 if(s95busy)return;
 if(s95role!=='admin_kua'||!s67client||!s67profile?.kua_id||!s67currentUser)throw Error('Admin KUA belum terautentikasi.');
 s95busy=true;const status=s67id('s95status'),btn=s67id('s95refresh');btn.disabled=true;
 const tbody=s67id('s95body');status.textContent='Memeriksa sesi dan memuat data sesuai RLS…';
 s67id('s953detail').hidden=true;for(const id of ['s95total','s95active','s95admins','s95entries'])s67id(id).textContent='—';
 tbody.innerHTML='<tr><td colspan="8" class="empty">Memuat…</td></tr>';s67id('s95secondary').textContent='Pegawai mengisi LCKH: —';
 try{
  const auth=await s67client.auth.getUser();
  if(auth.error||auth.data?.user?.id!==s67currentUser)throw Error('Sesi tidak sesuai. Silakan login ulang.');
  const month=s67id('s95month').value;
  if(!/^\d{4}-\d{2}$/.test(month))throw Error('Pilih bulan yang valid.');
  const d0=month+'-01';const [y,m]=month.split('-').map(Number);
  const d1=new Date(Date.UTC(y,m,1)).toISOString().slice(0,10);
  const [pr,lr,rr]=await Promise.all([
   s67client.from('sikap_profil').select('user_id,nama,nip_id,jabatan,aktif,kua_id').eq('kua_id',s67profile.kua_id).order('nama').limit(1001),
   s67client.from('sikap_lckh').select('user_id,tanggal,kua_id').eq('kua_id',s67profile.kua_id).gte('tanggal',d0).lt('tanggal',d1).limit(1001),
   s67client.from('sikap_peran').select('user_id,peran').limit(1001)
  ]);
  if(pr.error)throw Error('Akses baca profil ditolak atau gagal: '+pr.error.message);
  if(lr.error)throw Error('Akses baca LCKH ditolak atau gagal: '+lr.error.message);
  const profiles=pr.data||[],entries=lr.data||[];
  if(profiles.length>1000||entries.length>1000)throw Error('Data melebihi 1.000 baris. Pagination diperlukan; hasil parsial tidak ditampilkan sebagai total.');
  // Pertahanan tambahan: jangan tampilkan baris di luar unit meski kebijakan RLS keliru.
  if(profiles.some(p=>p.kua_id!==s67profile.kua_id)||entries.some(e=>e.kua_id!==s67profile.kua_id))throw Error('Ketidaksesuaian KUA pada hasil. Data tidak ditampilkan.');
  // Peran sumber tunggal adalah sikap_peran, bukan kolom jabatan.
  // Bila RLS hanya memperbolehkan membaca peran sendiri, jangan menerka peran pegawai lain.
  const roleRows=rr.error?[]:(rr.data||[]);
  const roleMap=new Map(roleRows.map(r=>[r.user_id,r.peran]));
  roleMap.set(s67currentUser,'admin_kua'); // Sudah divalidasi ketika login.
  // Akun Super Admin adalah pengelola sistem, bukan pegawai operasional KUA.
  // Filter berdasarkan peran autentikasi, bukan berdasarkan nama atau jabatan.
  const visibleProfiles=profiles.filter(p=>roleMap.get(p.user_id)!=='super_admin');
  const unknown=visibleProfiles.filter(p=>!roleMap.has(p.user_id));
  const staff=visibleProfiles.filter(p=>roleMap.get(p.user_id)==='pegawai');
  const admins=visibleProfiles.filter(p=>roleMap.get(p.user_id)==='admin_kua');
  const staffIds=new Set(staff.map(p=>p.user_id));
  const stats=new Map();for(const e of entries){let a=stats.get(e.user_id);if(!a){a={count:0,days:new Set()};stats.set(e.user_id,a)}a.count++;a.days.add(e.tanggal)}
  const trusted=!rr.error&&!unknown.length;
  s67id('s95total').textContent=trusted?String(staff.length):'—';
  s67id('s95active').textContent=trusted?String(staff.filter(p=>p.aktif).length):'—';
  s67id('s95admins').textContent=trusted?String(admins.length):'—';
  s67id('s95entries').textContent=trusted?String(entries.filter(e=>staffIds.has(e.user_id)).length):'—';
  s67id('s95secondary').textContent=trusted?`Pegawai mengisi LCKH: ${staff.filter(p=>stats.has(p.user_id)).length} dari ${staff.length} pegawai.`:'Statistik berdasarkan peran belum dapat diverifikasi. Periksa izin SELECT pada sikap_peran untuk Admin KUA.';
  s67id('s95who').textContent=`${s67profile.nama||'Admin'} · ${s67profile.kuaNama||'KUA'} · ${month}`;
  s953profiles=visibleProfiles; s953roles=roleMap; s953trusted=trusted; await sikapRangkapDaftar(visibleProfiles,roleMap); s95allProfiles=visibleProfiles;s95counts=stats;s95page=1;s95renderRows()
  status.textContent=trusted?`Rekap dan peran berhasil dibaca untuk ${month}. Hasil mengikuti kebijakan RLS.`:`PERHATIAN: Data profil/LCKH terbaca, tetapi ${rr.error?'pembacaan peran ditolak: '+rr.error.message:unknown.length+' peran profil belum terlihat'}. Statistik pegawai disembunyikan agar tidak keliru.`;
 }catch(e){status.textContent='BELUM BERHASIL: '+(e?.message||String(e));s95allProfiles=[];s95counts=new Map();s67id('s95paging').innerHTML='';tbody.innerHTML='<tr><td colspan="8" class="empty">Data tidak ditampilkan karena pemeriksaan gagal.</td></tr>';throw e;
 }finally{s95busy=false;btn.disabled=false}
}
s67id('s95month').value=today().slice(0,7);
s67id('s95month').onchange=()=>s67run(s95load);
s67id('s95refresh').onclick=()=>s67run(s95load);

// Tahap 9.5.3: detail baca-saja dan dua ruang kerja pada akun Admin KUA.
let s953profiles=[],s953roles=new Map(),s953trusted=false,s953personal=false;
async function s953mine(){
 if(s95role!=='admin_kua'||!s67currentUser)throw Error('Akses tidak sesuai.');
 await s91loadProfile();
 s67id('s95admin').style.display='none';
 s67id('sikapApp').style.display='flex';s67id('footnav').style.display='';
 s67id('s953personalnav').style.display='flex';
 s67id('s67reload').textContent='Muat Ulang LCKH Saya';
 s953personal=true;
 await s67getRows();
}
function s953returnAdmin(){
 if(s95role!=='admin_kua')return;
 s953personal=false;db.entries=[];state.editId=null;state.copyDraft=null;
 s67id('sikapApp').style.display='none';s67id('s953personalnav').style.display='none';s67id('footnav').style.display='none';
 s67id('s95admin').style.display='block';s67id('s953backadmin').hidden=true;
 s67id('s67reload').textContent='Muat Ulang Dashboard';
 s67id('s67identity').textContent=`${s67profile.nama||'Admin KUA'} | ${s67profile.kuaNama}`;
}
s67id('s953mine').onclick=()=>s67run(s953mine);
s67id('s953backadmin').onclick=s953returnAdmin;
s67id('s953close').onclick=()=>{s67id('s953detail').hidden=true;s953printData=null;s67id('s953printone').disabled=true;document.querySelectorAll('[data-s953-report]').forEach(b=>b.disabled=true)};
s67id('s953printone').onclick=()=>s953printSelected('lckh');
 document.querySelectorAll('[data-s953-report]').forEach(b=>b.onclick=()=>s953printSelected(b.dataset.s953Report));
s67id('s95body').addEventListener('click',ev=>{
 const b=ev.target.closest('[data-s953-user]');if(!b)return;
 s67run(()=>s953detail(b.getAttribute('data-s953-user')));
});
let s953printData=null;
function s953printSelected(type='lckh'){
 if(s95role!=='admin_kua'||s953personal||!s953trusted||!s953printData) {alert('Pratinjau belum tersedia atau akses Admin KUA tidak valid.');return;}
 if(!['lckh','lckb','rkb','wfo'].includes(type))return;
 const {profile:p,month,rows,reportProfile:rp}=s953printData;
 const provided={nama_atasan:s67id('s953superName').value.trim(),nip_atasan:s67id('s953superNip').value.trim(),jabatan_atasan:s67id('s953superPosition').value.trim()};
 // Gunakan mesin perhitungan dan tabel yang sama dengan akun pegawai,
 // tetapi jangan memodifikasi tampilan, data, atau sesi pegawai/Admin.
 const entries=rows.map(x=>({
   id:x.id,date:x.tanggal,createdAt:x.created_at||'',role:x.jabatan_kegiatan||'',
   source:x.sumber_kegiatan==='master'?'master':'manual',
   code:x.kode_sp||'',category:x.fungsi||'',service:x.nama_layanan||'',
   detail:x.uraian_kegiatan||'',output:x.output_kegiatan||'',
   evidence:x.bukti_kegiatan||'',volume:Number(x.volume)||0,
   unit:x.satuan||'',note:x.keterangan||'',link:x.referensi_bukti||''
 }));
 const profile={name:p.nama||'',nip:p.nip_id||'',position:p.jabatan||'',
  printPosition:rp?.jabatan_laporan||'',rank:rp?.pangkat_golongan||'',
  unit:rp?.unit_kerja||s67profile.kuaNama||'',
  organization:(()=>{const org=String(rp?.unit_organisasi||'').trim();return !org||/^Kantor Kementerian Agama$/i.test(org)?'Kantor Kementerian Agama Kab. Subang':org;})(),
  supervisorName:provided.nama_atasan,supervisorNip:provided.nip_atasan,
  supervisorPosition:provided.jabatan_atasan};
 const originalEntries=db.entries,originalProfile=db.profile,originalMonth=state.month,originalType=state.reportType;
 let table='',identity='',signatures='',cols=[],unmapped=0,amount=0;
 try{
  db.entries=entries;db.profile=profile;state.month=month;state.reportType=type;
  const result=reportRows();cols=colDefs();amount=result.length;
  table=reportTableBody(result,cols);identity=reportIdentity();
  if(type==='lckb')unmapped=lckbData(filtered()).unmapped.length;
  // Titimangsa khusus cetak Admin, tidak membaca atau menimpa preferensi browser pegawai.
  const signDate=s67id('s953signDate').value||month+'-'+String(new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate()).padStart(2,'0');
  const loc=s67id('s953signPlace').value.trim()||'Cipeundeuy';
  const vp=v=>h(String(v||'').trim()||'Belum diisi');
  signatures=`<div class="signature-area"><div class="signature-location"><div></div><div class="signature-location-date">${h(formatTitimangsa(loc,signDate))}</div></div><div class="signature-columns"><div class="signature-person"><div>${type==='wfo'?'Pejabat Penilai Kinerja':'Mengetahui,'}</div><div>${vp(profile.supervisorPosition)}</div><div class="signature-space"></div><div class="signature-name">${vp(profile.supervisorName)}</div><div>NIP. ${vp(profile.supervisorNip)}</div></div><div class="signature-person"><div>&nbsp;</div><div>${vp(sikapJabatanCetak())}</div><div class="signature-space"></div><div class="signature-name">${vp(profile.name)}</div><div>NIP. ${vp(profile.nip)}</div></div></div></div>`;
 }finally{db.entries=originalEntries;db.profile=originalProfile;state.month=originalMonth;state.reportType=originalType;}
 const titles={lckh:'LAPORAN CAPAIAN KINERJA HARIAN',lckb:'LAPORAN CAPAIAN KINERJA BULANAN',rkb:'RENCANA KINERJA BULANAN',wfo:'LAPORAN WFO (JUMAT)'};
 const monthTitle=new Date(month+'-02T12:00:00').toLocaleDateString('id-ID',{month:'long',year:'numeric'}).toUpperCase();
 const missing=['nama_atasan','nip_atasan','jabatan_atasan'].filter(k=>!String(provided[k]||'').trim());
 if(missing.length){alert('Identitas atasan belum lengkap. Isi Nama, NIP, dan Jabatan atasan pada bagian Identitas Tanda Tangan dan Titimangsa Cetak sebelum mencetak. Data ini hanya untuk cetak dan tidak mengubah data pegawai.');s67id('s953super'+({'nama_atasan':'Name','nip_atasan':'Nip','jabatan_atasan':'Position'}[missing[0]])).focus();return;}
 const win=window.open('','_blank');if(!win){alert('Izinkan pop-up untuk mencetak laporan.');return;}
 const css=`body{font:12px Arial,sans-serif;color:#173a2b;padding:12px}h2{margin:0;text-align:center;font-size:18px}h2+h2{margin:4px 0 20px}.controls{text-align:right;margin-bottom:18px}.controls button{padding:9px 14px}.report-identity{display:grid;grid-template-columns:140px 10px 1fr;gap:5px 8px;margin-bottom:18px}.identity-label{font-weight:500}.report-table{width:100%;border-collapse:collapse}.report-table th,.report-table td{border:1px solid #adb9b1;padding:7px 6px;text-align:left;vertical-align:top;white-space:pre-line}.report-table th{background:#edf3ef}.report-table thead{display:table-header-group}.report-table tr{break-inside:avoid}.report-table .lckb-group{break-after:avoid;page-break-after:avoid}.report-table td{overflow-wrap:anywhere;word-break:normal}.report-table td:nth-child(3),.report-table td:nth-child(4){white-space:pre-line}.date-group{text-align:center!important;white-space:nowrap!important}.day-name,.date-value{display:block}.signature-area{margin-top:45px;break-inside:avoid}.signature-location{display:grid;grid-template-columns:1fr 1fr;text-align:center;margin-bottom:8px}.signature-columns{display:grid;grid-template-columns:1fr 1fr;gap:24px;text-align:center}.signature-person{line-height:1.6}.signature-space{height:78px}.signature-name{font-weight:bold;text-decoration:underline}.notice{font-size:11px;color:#64501b;margin:15px 0}.muted{font-size:11px;color:#526456}@page{size:A4 landscape;margin:12mm}@media print{body{padding:0}.controls{display:none}.signature-area{margin-top:32px}}`;
 const sharedPrintCSS=sikapReportPrintCSS();
 const note=''; // Keterangan sumber internal tidak dicetak dalam laporan resmi.
 win.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${h(titles[type])} - ${h(profile.name)} - ${h(month)}</title><style>${css}\n${sharedPrintCSS}</style></head><body><div class="controls"><button onclick="window.print()">Cetak / Simpan PDF</button></div><h2>${titles[type]}</h2><h2>BULAN ${h(monthTitle)}</h2>${identity}${unmapped?`<p class="notice">${unmapped} kegiatan belum dapat diklasifikasikan dalam LCKB.</p>`:''}<table class="report-table ${type==='lckb'?'sikap-lckb-table':''}"><thead><tr>${cols.map(c=>`<th>${h(c)}</th>`).join('')}</tr></thead><tbody>${table}</tbody></table>${note?`<p class="muted">${h(note)}</p>`:""}${signatures}</body></html>`);
 win.document.close();
}
async function s953detail(userId){
 if(s95role!=='admin_kua'||s953personal||!s953trusted)throw Error('Mode monitoring tidak tersedia.');
 const p=s953profiles.find(x=>x.user_id===userId);
 if(!p||p.kua_id!==s67profile.kua_id||s953roles.get(userId)!=='pegawai')throw Error('Pegawai bukan dalam cakupan Admin KUA.');
 const month=s67id('s95month').value;const [year,mon]=month.split('-').map(Number);
 if(!/^\d{4}-\d{2}$/.test(month)||mon<1||mon>12)throw Error('Periode tidak valid.');
 const d0=month+'-01',d1=new Date(Date.UTC(year,mon,1)).toISOString().slice(0,10);
 s953printData=null;s67id('s953printone').disabled=true;document.querySelectorAll('[data-s953-report]').forEach(b=>b.disabled=true);
 const pane=s67id('s953detail');pane.hidden=false;
 s67id('s953detailtitle').textContent='Rincian LCKH — '+(p.nama||'Pegawai');
 s67id('s953detailstatus').textContent='Memuat rincian melalui Supabase…';
 s67id('s953detailbody').innerHTML='';
 const auth=await s67client.auth.getUser();if(auth.error||auth.data?.user?.id!==s67currentUser)throw Error('Sesi Admin tidak valid.');
 const {data,error}=await s67client.from('sikap_lckh')
  .select('id,user_id,kua_id,tanggal,created_at,kode_sp,fungsi,jabatan_kegiatan,sumber_kegiatan,nama_layanan,uraian_kegiatan,output_kegiatan,volume,satuan,bukti_kegiatan,keterangan,referensi_bukti')
  .eq('user_id',p.user_id).eq('kua_id',s67profile.kua_id).gte('tanggal',d0).lt('tanggal',d1)
  .order('tanggal',{ascending:false}).limit(1001);
 if(error)throw Error('Akses rincian ditolak: '+error.message);
 if(data.length>1000||data.some(x=>x.user_id!==userId||x.kua_id!==s67profile.kua_id))throw Error('Jumlah/lingkup data tidak sesuai, hasil tidak ditampilkan.');
 s67id('s953detailbody').innerHTML=data.length?data.map(x=>`<tr><td>${h(x.tanggal)}</td><td>${h(x.uraian_kegiatan)}</td><td>${h(x.output_kegiatan)}</td><td>${h(x.volume)}</td><td>${h(x.satuan)}</td><td>${h(x.bukti_kegiatan)}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">Belum ada kegiatan di periode ini.</td></tr>';
 const prof=await s67client.from('sikap_profil_laporan').select('jabatan_laporan,pangkat_golongan,unit_kerja,unit_organisasi,nama_atasan,nip_atasan,jabatan_atasan').eq('user_id',p.user_id).maybeSingle();
 // RLS may disallow another user's report profile. Do not elevate permissions or invent identities.
 const reportProfile=prof.error?null:prof.data;
 // Prioritaskan data profil laporan pegawai bila dapat dibaca, tanpa menulis ke database.
 s67id('s953superName').value=reportProfile?.nama_atasan||'';
 s67id('s953superNip').value=reportProfile?.nip_atasan||'';
 s67id('s953superPosition').value=reportProfile?.jabatan_atasan||'';
 s67id('s953signPlace').value='Cipeundeuy';
 s67id('s953signDate').value=month+'-'+String(new Date(year,mon,0).getDate()).padStart(2,'0');
 s67id('s953superSource').textContent=prof.error?'Data profil laporan tidak dapat dibaca oleh Admin KUA: '+prof.error.message+'. Isi identitas atasan di atas untuk dokumen cetak.':!reportProfile?'Profil laporan pegawai belum ditemukan atau belum dapat dibaca. Lengkapi Nama, NIP, dan Jabatan atasan di atas sebelum mencetak.':'Identitas atasan diisi dari profil laporan pegawai; dapat disesuaikan khusus untuk cetak tanpa menyimpan perubahan.';
 s953printData={profile:p,month,rows:data,reportProfile};s67id('s953printone').disabled=false;document.querySelectorAll('[data-s953-report]').forEach(b=>b.disabled=false);
 s67id('s953detailstatus').textContent=`${data.length} kegiatan • ${month} • baca-saja${!reportProfile?' • Data tanda tangan pegawai tidak terbaca, periksa RLS profil laporan':''}`;
 pane.scrollIntoView({behavior:'smooth',block:'start'});
}


// Dashboard Super Admin operasional; seluruh baca/tulis dibatasi RLS/RPC di server.
let s96users=[],s96roles=new Map(),s96kuas=[],s96busy=false;
let s96pages=new Map();
function s96groupRender(){
 const q=s67id('s96filter').value.trim().toLocaleLowerCase('id-ID'); const size=Number(s67id('s96size')?.value||10);
 const users=s96users.filter(p=>[p.nama,p.nip_id,p.jabatan,s96kuas.find(k=>k.id===p.kua_id)?.nama,s96roles.get(p.user_id)].join(' ').toLocaleLowerCase('id-ID').includes(q));
 const parts=[...s96kuas.map(k=>({key:k.id,name:k.nama,users:users.filter(p=>p.kua_id===k.id&&s96roles.get(p.user_id)!=='super_admin')})),{key:'system',name:'Administrasi Sistem',users:users.filter(p=>!p.kua_id||s96roles.get(p.user_id)==='super_admin')}];
 const groups=parts.filter(g=>g.users.length||(!q&&g.key!=='system'));
 s67id('s96groups').innerHTML=groups.map(g=>{const total=g.users.length,pages=Math.max(1,Math.ceil(total/size)),page=Math.min(s96pages.get(g.key)||1,pages);s96pages.set(g.key,page);const rows=g.users.slice((page-1)*size,page*size);
 return `<details class="panel sikap-compact" style="margin:9px 0" ${q?'open':''}><summary>▣ ${h(g.name)} <span class="pill">${total} pengguna</span></summary><div class="tablewrap" style="margin-top:12px"><table><thead><tr><th>Nama</th><th>NIP/ID</th><th>Jabatan</th><th>Peran</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>${rows.length?rows.map(p=>{const role=s96roles.get(p.user_id),self=p.user_id===s67currentUser;const can=role!=='super_admin'&&!self&&p.aktif&&p.kua_id&&!p.wajib_ganti_sandi;return `<tr><td>${h(p.nama)}</td><td>${h(p.nip_id)}</td><td>${h(p.jabatan||'-')}</td><td>${h(role||'-')}</td><td>${p.aktif?'Aktif':'Nonaktif'}${p.wajib_ganti_sandi?' · Sandi pertama':''}</td><td>${can?`<button class="tinybtn" data-s96uid="${h(p.user_id)}" data-s96to="${role==='pegawai'?'admin_kua':'pegawai'}">${role==='pegawai'?'Tetapkan Admin KUA':'Jadikan Pegawai'}</button>`:'—'}</td></tr>`}).join(''):'<tr><td colspan="6">Belum ada pengguna.</td></tr>'}</tbody></table></div><div class="sikap-pages"><span class="mini">Halaman ${page} / ${pages}</span><button type="button" data-s96-page="${h(g.key)}" data-dir="-1" ${page===1?'disabled':''}>←</button><button type="button" data-s96-page="${h(g.key)}" data-dir="1" ${page===pages?'disabled':''}>→</button></div></details>`}).join('')||'<p class="muted">Tidak ada pengguna yang cocok.</p>';
}

async function s96load(){
 if(s96busy)return;if(s95role!=='super_admin'||!s67client||!s67currentUser)throw Error('Akses Super Admin diperlukan.');
 s96busy=true;const status=s67id('s96status');s67id('s96refresh').disabled=true;
 try{
  const auth=await s67client.auth.getUser();if(auth.error||auth.data?.user?.id!==s67currentUser)throw Error('Sesi tidak valid. Login ulang.');
  const [pr,rr,kr]=await Promise.all([s67client.from('sikap_profil').select('user_id,kua_id,nama,nip_id,jabatan,aktif,wajib_ganti_sandi').order('nama').limit(1001),s67client.from('sikap_peran').select('user_id,peran').limit(1001),s67client.from('sikap_kua').select('id,nama,aktif').order('nama').limit(1001)]);
  if(pr.error||rr.error||kr.error)throw Error('Gagal membaca data: '+(pr.error||rr.error||kr.error).message);
  if([pr,rr,kr].some(r=>r.data.length>1000))throw Error('Data melewati 1.000 baris; perlu pagination.');
  const roles=new Map(rr.data.map(x=>[x.user_id,x.peran]));if(pr.data.some(p=>!roles.has(p.user_id)))throw Error('Sebagian peran tidak dapat dibaca.');
  s96users=pr.data;s96roles=roles;s96kuas=kr.data;
  s67id('s96total').textContent=String(pr.data.length);s67id('s96kua').textContent=String(kr.data.length);s67id('s96admincount').textContent=String(pr.data.filter(p=>roles.get(p.user_id)==='admin_kua').length);
  s96groupRender();s97render();s98load();if(window.sikapLoadSharedMaster)await window.sikapLoadSharedMaster();status.textContent=`${pr.data.length} pengguna di ${kr.data.length} KUA. Data mengikuti kewenangan Super Admin.`;
 }catch(e){status.textContent='GAGAL: '+e.message;throw e}finally{s96busy=false;s67id('s96refresh').disabled=false;}
}
async function s96change(userId,targetRole){
 if(s95role!=='super_admin'||s96busy)throw Error('Akses Super Admin diperlukan.');
 const p=s96users.find(x=>x.user_id===userId),role=s96roles.get(userId);
 if(!p||p.user_id===s67currentUser||!p.aktif||!p.kua_id||p.wajib_ganti_sandi||!['pegawai','admin_kua'].includes(role)||targetRole===(role))throw Error('Pengguna belum memenuhi syarat perubahan peran.');
 if(!confirm(`Ubah peran ${p.nama} (${p.nip_id}) dari ${role} menjadi ${targetRole}?`))return;
 if(prompt('Ketik TETAPKAN untuk mengonfirmasi:')!=='TETAPKAN')return;
 const {error}=await s67client.rpc('sikap_tetapkan_admin_kua',{target_user:userId,peran_baru:targetRole});if(error)throw Error(error.message);
 await s96load();if(s96roles.get(userId)!==targetRole)throw Error('Perubahan belum terverifikasi. Jangan kirim ulang sebelum memeriksa data.');
 alert('Peran pengguna berhasil diperbarui.');
}
s67id('s96refresh').onclick=()=>s67run(s96load);
s67id('s96filter').oninput=s96groupRender;
s67id('s96groups').addEventListener('click',e=>{const b=e.target.closest('button[data-s96uid]');if(b)s67run(()=>s96change(b.dataset.s96uid,b.dataset.s96to));});
function s97render(){
 const profiles=s96users.filter(p=>p.user_id!==s67currentUser&&['pegawai','admin_kua'].includes(s96roles.get(p.user_id)));
 s67id('s97user').innerHTML='<option value="">Pilih pengguna</option>'+profiles.map(p=>`<option value="${h(p.user_id)}">${h(s96kuas.find(k=>k.id===p.kua_id)?.nama||'Tanpa KUA')} — ${h(p.nama)} (${h(p.nip_id)})</option>`).join('');
 s67id('s97kua').innerHTML='<option value="">Pilih KUA tujuan</option>'+s96kuas.filter(k=>k.aktif).map(k=>`<option value="${h(k.id)}">${h(k.nama)}</option>`).join('');
}
s67id('s97action').onchange=()=>{s67id('s97kua').disabled=s67id('s97action').value!=='move'};
s67id('s97submit').onclick=()=>s67run(async()=>{
 if(s95role!=='super_admin'||s96busy)throw Error('Akses Super Admin diperlukan.');
 const uid=s67id('s97user').value,action=s67id('s97action').value,kua=s67id('s97kua').value,p=s96users.find(x=>x.user_id===uid);
 if(!p||p.user_id===s67currentUser||!['pegawai','admin_kua'].includes(s96roles.get(uid)))throw Error('Pilih pengguna yang sah.');
 if(!['activate','deactivate','move'].includes(action))throw Error('Pilih tindakan.');
 if(action==='move'&&(!kua||!s96kuas.some(k=>k.id===kua&&k.aktif)||kua===p.kua_id))throw Error('Pilih KUA tujuan yang berbeda dan aktif.');
 if((action==='activate'&&p.aktif)||(action==='deactivate'&&!p.aktif))throw Error('Status pengguna sudah sesuai.');
 const detail=action==='move'?'Pindahkan ke '+s96kuas.find(k=>k.id===kua).nama:action==='activate'?'Aktifkan':'Nonaktifkan';
 if(!confirm(`Konfirmasi ${detail} untuk ${p.nama}? Perubahan ini memengaruhi akses akun operasional.`))return;
 if(prompt('Ketik SETUJU untuk menyimpan:')!=='SETUJU')return;
 const args={target_user:uid,status_aktif:action==='activate'?true:action==='deactivate'?false:null,penempatan_kua:action==='move'?kua:null};
 const {error}=await s67client.rpc('sikap_kelola_pegawai',args);if(error)throw Error('Server menolak tindakan: '+error.message);
 await s96load();const verify=s96users.find(x=>x.user_id===uid);
 if(!verify||(action==='activate'&&!verify.aktif)||(action==='deactivate'&&verify.aktif)||(action==='move'&&verify.kua_id!==kua))throw Error('Verifikasi ulang tidak sesuai. Jangan coba berulang sebelum diperiksa.');
 s67id('s97status').textContent='Berhasil: '+detail+' — '+p.nama;
});
let s98busy=false;
function s98load(){
 s67id('s98count').textContent=String(s96kuas.length);s67id('s98testcount').textContent=String(s96kuas.filter(k=>k.aktif).length);
 s67id('s98target').innerHTML='<option value="">Pilih KUA</option>'+s96kuas.map(k=>`<option value="${h(k.id)}">${h(k.nama)}</option>`).join('');
 s67id('s98body').innerHTML=s96kuas.map(k=>`<tr><td>${h(k.nama)}</td><td>${s96users.filter(p=>p.kua_id===k.id&&s96roles.get(p.user_id)!=='super_admin').length}</td><td>${k.aktif?'Aktif':'Nonaktif'}</td></tr>`).join('')||'<tr><td colspan="3">Belum ada KUA.</td></tr>';
 s67id('s98status').textContent=`${s96kuas.length} KUA terdaftar. Perubahan harus diotorisasi server.`;
}
s67id('s98action').onchange=()=>{const action=s67id('s98action').value;s67id('s98target').disabled=action==='create';s67id('s98name').disabled=action==='activate'||action==='deactivate'||action==='delete';s67id('s98submit').textContent=action==='delete'?'Hapus KUA Permanen':'Simpan Perubahan KUA';};
s67id('s98refresh').onclick=()=>s67run(s96load);
s67id('s98submit').onclick=()=>s67run(async()=>{
 if(s95role!=='super_admin'||s98busy)throw Error('Akses Super Admin diperlukan.');s98busy=true;
 try{
  const action=s67id('s98action').value,id=s67id('s98target').value,name=s67id('s98name').value.trim(),target=s96kuas.find(k=>k.id===id);
  if(!['create','rename','activate','deactivate','delete'].includes(action))throw Error('Pilih tindakan KUA.');
  if(['create','rename'].includes(action)&&(!/^KUA\s+/i.test(name)||name.length<7||name.length>120))throw Error('Nama KUA harus diawali KUA dan berisi 7–120 karakter.');
  if(action!=='create'&&!target)throw Error('Pilih KUA yang terdaftar.');
  if(action==='activate'&&target.aktif||action==='deactivate'&&!target.aktif)throw Error('Status KUA sudah sesuai.');
  if(action==='deactivate'&&s96users.some(p=>p.kua_id===id&&p.aktif))throw Error('Nonaktifkan atau pindahkan dahulu semua pengguna aktif pada KUA ini.');
  if(action==='delete'){
    if(target.aktif)throw Error('Nonaktifkan KUA terlebih dahulu sebelum menghapusnya.');
    if(/^administrasi sistem$/i.test(target.nama.trim()))throw Error('Unit sistem tidak dapat dihapus.');
    if(s96users.some(p=>p.kua_id===id))throw Error('KUA masih memiliki pengguna terdaftar (termasuk nonaktif). Pindahkan atau tangani akun dahulu.');
    if(!confirm(`PERINGATAN: Anda akan MENGHAPUS PERMANEN unit \"${target.nama}\".\n\nPenghapusan hanya diizinkan jika KUA nonaktif dan tidak memiliki pengguna, LCKH, atau data terkait. Lanjutkan pemeriksaan akhir?`))return;
    const typedName=prompt(`Untuk mengonfirmasi identitas unit, ketik nama KUA secara PERSIS:\n${target.nama}`);
    if(typedName!==target.nama){s67id('s98status').textContent='Penghapusan dibatalkan: nama KUA tidak cocok.';return;}
    if(prompt('Konfirmasi terakhir: ketik HAPUS (huruf kapital):')!=='HAPUS'){s67id('s98status').textContent='Penghapusan dibatalkan.';return;}
    const {data,error}=await s67client.rpc('sikap_hapus_kua_aman',{p_kua_id:id,p_nama_konfirmasi:typedName,p_konfirmasi:'HAPUS'});
    if(error)throw Error('Database MENOLAK penghapusan: '+error.message+' Tidak ada penghapusan yang terverifikasi.');
    if(!data||data.id!==id||data.dihapus!==true)throw Error('Balasan penghapusan tidak terverifikasi. Periksa database sebelum mencoba kembali.');
    await s96load();
    if(s96kuas.some(k=>k.id===id))throw Error('KUA masih terdaftar setelah permintaan. Periksa database.');
    s67id('s98status').textContent='KUA '+target.nama+' berhasil dihapus dan telah diverifikasi tidak lagi terdaftar.';
    s67id('s98action').value='';s67id('s98action').onchange();
    return;
  }
  if(!confirm(`Simpan perubahan KUA: ${action==='create'?name:target.nama} (${action})?`))return;
  if(prompt('Ketik SETUJU untuk mengonfirmasi:')!=='SETUJU')return;
  const {error}=await s67client.rpc('sikap_kelola_kua_operasional',{p_tindakan:action,p_kua_id:action==='create'?null:id,p_nama:['create','rename'].includes(action)?name:null});
  if(error)throw Error('Server menolak perubahan KUA: '+error.message+' Pastikan SQL pada paket telah dijalankan.');
  await s96load();
  const verified=action==='create'?s96kuas.some(k=>k.nama===name):action==='rename'?s96kuas.some(k=>k.id===id&&k.nama===name):s96kuas.some(k=>k.id===id&&k.aktif===(action==='activate'));
  if(!verified)throw Error('Perubahan belum terverifikasi dari database. Jangan mencoba berulang sebelum diperiksa.');
  s67id('s98status').textContent='Perubahan KUA berhasil diverifikasi.';
 }finally{s98busy=false;}
});

// Konfigurasi publik frontend untuk proyek SIKAP; bukan service_role atau secret key.
// Koneksi otomatis, tanpa menyimpan kredensial di localStorage.
s67id('s67url').value = 'https://fyzighrpchditaidnmtb.supabase.co';
s67id('s67key').value = 'sb_publishable_bnhClNQ8WI6rPxqhnAB09Q_-Vzhfcu9';
s67id('s67retryRestore').onclick=()=>{s67id('s67retryRestore').hidden=true;s67id('s67connect').click();};
s67id('s67connect').click();
