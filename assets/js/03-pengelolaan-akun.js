
(()=>{
'use strict';
const $=id=>document.getElementById(id);
let shownRole='', loading=false;
async function refreshRole(){
 const role=typeof s95role==='string'?s95role:'';
 const signed=!!s67currentUser&&!!s67client;
 const inPersonalLckh=typeof s953personal!=='undefined'&&s953personal;
 const visible=signed&&(role==='super_admin'||role==='admin_kua')&&!inPersonalLckh&&$('sikapApp')?.style.display!=='flex';
 const panel=$('sikapManageAccounts');panel.style.display=visible?'block':'none';
 if(!visible){shownRole='';return;}
 if(shownRole===role)return;shownRole=role;
 $('mgTitle').textContent=role==='super_admin'?'Tambah Admin KUA':'Tambah Pegawai';
 $('mgSubmit').textContent=role==='super_admin'?'Buat Admin KUA':'Buat Pegawai';
 $('mgKuaWrap').style.display=role==='super_admin'?'grid':'none';
 $('mgKua').required=role==='super_admin';
 $('mgStatus').textContent='Formulir terhubung ke Edge Functions SIKAP yang sudah dipasang.';
 if(role==='super_admin'){
  const {data,error}=await s67client.from('sikap_kua').select('id,nama').order('nama');
  if(error){$('mgStatus').textContent='Daftar KUA belum dapat dibaca: '+error.message;return;}
  $('mgKua').replaceChildren(new Option('Pilih KUA',''),...(data||[]).map(k=>new Option(k.nama,k.id)));
 }
}
$('mgForm').addEventListener('submit',async e=>{
 e.preventDefault();if(loading)return;
 const role=s95role;
 if(!s67client||!s67currentUser||!['super_admin','admin_kua'].includes(role))return;
 if(role==='super_admin'&&!$('mgKua').value){$('mgStatus').textContent='Pilih KUA.';return;}
 if(!['Penghulu','Pengadministrasi Perkantoran','Penyuluh Agama Islam','PLO','PUO'].includes($('mgJob').value)){$('mgStatus').textContent='Pilih jabatan utama dari daftar.';return;}
 loading=true;$('mgSubmit').disabled=true;$('mgStatus').textContent='Mengirim permintaan ke server…';
 try{
  const {data:{session},error:sessionError}=await s67client.auth.getSession();
  if(sessionError||!session?.access_token)throw Error('Sesi login sudah berakhir. Silakan masuk lagi.');
  const payload={nip_id:$('mgNip').value.trim(),nama:$('mgName').value.trim(),email:$('mgEmail').value.trim(),jabatan:$('mgJob').value,peran:role==='super_admin'?'admin_kua':'pegawai'};
  if(role==='super_admin')payload.kua_id=$('mgKua').value;
  const functionName=role==='super_admin'?'sikap-buat-admin-kua':'sikap-tambah-pegawai';
  delete payload.peran; // Penetapan peran dilakukan oleh Edge Function sesuai otorisasi server.
  if(!confirm('Buat akun '+(role==='super_admin'?'Admin KUA':'Pegawai')+' untuk '+payload.nama+'?\nTindakan ini membuat akun Supabase sungguhan.'))return;
  const {data,error}=await s67client.functions.invoke(functionName,{body:payload});
  if(error){
    let message=error.message||'Permintaan ditolak.';
    try{const detail=await error.context?.clone?.().json();message=detail?.message||detail?.error||message;}catch{}
    throw Error(message);
  }
  if(!data?.user_id||!data?.temporary_password)throw Error('Respons server belum lengkap. Periksa daftar akun sebelum mencoba ulang.');
  $('mgStatus').textContent='Akun berhasil dibuat. Salin sandi sementara ini secara pribadi (hanya tampil sekali): '+data.temporary_password;
  $('mgForm').reset();
 }catch(err){$('mgStatus').textContent='Belum berhasil: '+(err?.message||String(err))+'\nTidak ada alasan untuk mengulang permintaan sebelum status akun diperiksa.';}
 finally{loading=false;$('mgSubmit').disabled=false;}
});
// Only controls visibility. Permissions and authorization are enforced by the Supabase server.
setInterval(refreshRole,900);refreshRole();
})();
