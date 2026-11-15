
// SIKAP multi-KUA: Admin KUA mengelola pegawai KUA sendiri dan penugasan rangkap diri sendiri; RLS memverifikasi.
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const OPTIONS=['Penghulu','PLO','PUO','Pengadministrasi Perkantoran','Penyuluh Agama Islam','KEPALA','Operator SIMKAH'];
let staff=[],loaded=new Map(),busy=false;
function msg(t){$('sikapRangkapPesan').textContent=t;}
window.sikapRangkapDaftar=async function(profiles,roles){
 if(typeof s95role==='undefined'||s95role!=='admin_kua')return;
 staff=profiles.filter(p=>p.kua_id===s67profile?.kua_id&&(roles.get(p.user_id)==='pegawai'||(roles.get(p.user_id)==='admin_kua'&&p.user_id===s67currentUser)));
 $('sikapRangkapPegawai').replaceChildren(new Option('Pilih pegawai',''),...staff.map(p=>new Option(`${p.nama} — ${p.nip_id}${roles.get(p.user_id)==='admin_kua'?' (Admin KUA / saya)':''}`,p.user_id)));
 $('sikapRangkapUtama').value='';
 loaded=new Map();
 $('sikapRangkapOpsi').innerHTML=OPTIONS.map(r=>`<label style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600"><input type="checkbox" value="${r}" style="width:18px;height:18px"> ${r==='KEPALA'?'Kepala KUA':r}</label>`).join('');
 const {data,error}=await s67client.from('sikap_tugas_rangkap').select('user_id,kua_id,peran_tambahan').eq('kua_id',s67profile.kua_id).limit(1001);
 if(error){msg('Belum dapat membaca penugasan: '+error.message+' — Jalankan SQL paket revisi terlebih dahulu.');return;}
 if(data.length>1000){msg('Data penugasan melebihi batas; hubungi pengelola.');return;}
 for(const x of data)if(x.kua_id===s67profile.kua_id)loaded.set(x.user_id,x.peran_tambahan||[]);
 msg('Daftar siap. Admin KUA dapat mengatur pegawai serta penugasan rangkap dirinya sendiri.');
};
$('sikapRangkapPegawai').addEventListener('change',()=>{
 const id=$('sikapRangkapPegawai').value;
 const p=staff.find(x=>x.user_id===id);
 $('sikapRangkapUtama').value=p?.jabatan||'';
 const selected=loaded.get(id)||[];
 for(const el of $('sikapRangkapOpsi').querySelectorAll('input[type=checkbox]')){el.checked=selected.includes(el.value);el.disabled=!p||el.value===p.jabatan;}
 msg(p?`Atur tugas tambahan ${p.nama}. Jabatan utama: ${p.jabatan||'belum diisi'}.`:'Pilih pegawai.');
});
$('sikapRangkapReload').onclick=()=>s67run(()=>s95load());
$('sikapRangkapSimpan').onclick=async()=>{
 if(busy)return;
 const id=$('sikapRangkapPegawai').value,p=staff.find(x=>x.user_id===id);
 if(!p||!s67client||s95role!=='admin_kua'||p.kua_id!==s67profile?.kua_id){msg('Pilih pegawai dalam lingkup KUA Anda.');return;}
 const roles=[...$('sikapRangkapOpsi').querySelectorAll('input:checked')].map(x=>x.value).filter(r=>OPTIONS.includes(r)&&r!==p.jabatan);
 if(!confirm(`Simpan ${roles.length} penugasan tambahan untuk ${p.nama}?`))return;
 busy=true;$('sikapRangkapSimpan').disabled=true;msg('Menyimpan ke Supabase…');
 try{
  const {error}=await s67client.from('sikap_tugas_rangkap').upsert({user_id:id,kua_id:p.kua_id,peran_tambahan:roles},{onConflict:'user_id'});
  if(error)throw Error(error.message);
  const {data,error:checkError}=await s67client.from('sikap_tugas_rangkap').select('peran_tambahan,kua_id').eq('user_id',id).single();
  if(checkError||checkError||!data||data.kua_id!==p.kua_id||JSON.stringify([...data.peran_tambahan].sort())!==JSON.stringify([...roles].sort()))throw Error('Verifikasi penyimpanan belum sesuai. Periksa data sebelum mencoba lagi.');
  loaded.set(id,roles);
  msg('Penugasan rangkap '+p.nama+' berhasil tersimpan dan diverifikasi. Muat ulang halaman sebelum mengisi LCKH untuk melihat kegiatan tambahan.');
 }catch(e){msg('Gagal: '+(e?.message||String(e)));}
 finally{busy=false;$('sikapRangkapSimpan').disabled=false;}
};
})();
