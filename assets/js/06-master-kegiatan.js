
(()=>{'use strict';
const $=id=>document.getElementById(id);
let serverRows=[],masterPage=1;
const types=['KEPALA','Penghulu','Operator SIMKAH','PLO','PUO','Pengadministrasi Perkantoran','Penyuluh Agama Islam'];
function msg(v){const el=$('sikapMasterMsg');if(el)el.textContent=v;}
const builtInRows=MASTER.slice();
function bindRows(){
 const query=$('sikapMasterFilter').value.toLowerCase().trim().split(/\s+/).filter(Boolean);
 const category=$('sikapMasterViewCategory').value,source=$('sikapMasterViewSource').value;
 const shared=serverRows.map(r=>({...r,...sikapKlasifikasiMaster(r),shared:true}));
 const rows=source==='shared'?shared:source==='builtin'?builtInRows:[...builtInRows,...shared];
 const filtered=rows.filter(r=>(!category||r.category===category)&&query.every(word=>
  [r.choice,r.detail,r.role,r.code,r.service,FUNCTIONS9[r.category]].join(' ').toLowerCase().includes(word)
 )).sort((a,b)=>a.category.localeCompare(b.category)||a.choice.localeCompare(b.choice,'id'));
 const size=Number($('sikapMasterSize').value),pages=Math.max(1,Math.ceil(filtered.length/size));
 masterPage=Math.min(masterPage,pages);
 $('sikapMasterRows').innerHTML=filtered.length?filtered.slice((masterPage-1)*size,masterPage*size).map(r=>{
  const id=h(r.id);
  const actions=r.shared?`<div class="actions"><button class="tinybtn" data-edit-master="${id}" type="button">Edit</button><button class="tinybtn" data-toggle-master="${id}" type="button">${r.aktif?'Nonaktifkan':'Aktifkan'}</button><button class="tinybtn sikap-danger-btn" data-delete-master="${id}" type="button">Hapus</button></div>`:'';
  return `<tr><td><b>${h(r.choice)}</b><div class="mini muted">${h(r.detail)}</div></td><td>${h(r.role)}</td><td><b>Fungsi ${h(r.category)}</b><div class="mini">${h(sikapNamaKelompok(r))}</div></td><td>${r.shared?(r.aktif?'Aktif':'Nonaktif'):'Bawaan'}</td><td>${actions}</td></tr>`;
 }).join(''):'<tr><td colspan="5" class="empty">Tidak ada kegiatan yang cocok.</td></tr>';
 $('sikapMasterPaging').innerHTML=`<span class="mini">${filtered.length} kegiatan · Halaman ${masterPage}/${pages}</span><button type="button" data-master-page="-1" ${masterPage===1?'disabled':''}>←</button><button type="button" data-master-page="1" ${masterPage===pages?'disabled':''}>→</button>`;
}
function merge(){
 for(let i=MASTER.length-1;i>=0;i--)if(MASTER[i].sikapServerMaster)MASTER.splice(i,1);
 for(const r of serverRows){
  if(!r.aktif||!types.includes(r.role))continue;
  MASTER.push({...r,...sikapKlasifikasiMaster(r),evidence:r.evidence||'',unit:r.unit||'Layanan',sikapServerMaster:r.id,sikapKodeLama:r.code||''});
 }
}
window.sikapLoadSharedMaster=async function(){
 if(!s67client||!s67currentUser)return;
 const {data,error}=await s67client.from('sikap_master_bersama').select('id,role,category,code,choice,detail,output,evidence,unit,aktif').order('choice').limit(1001);
 if(error){bindRows();msg('Master tambahan tidak dapat dimuat: '+error.message);return;}
 if(data.length>1000){msg('Master tambahan melebihi 1.000 data. Hubungi pengelola.');return;}
 serverRows=data;merge();if(s95role==='super_admin'){bindRows();msg(`${data.length} kegiatan master tambahan berhasil dimuat (termasuk yang nonaktif).`);}
};
function sikapMasterKindChange(){
 const sp=document.getElementById('sikapMasterKind').value==='sp';
 document.getElementById('sikapMasterCodeWrap').hidden=!sp;
 document.getElementById('sikapMasterCategoryWrap').hidden=sp;
 document.getElementById('sikapMasterCodeWrap').style.display=sp?'':'none';
 document.getElementById('sikapMasterCategoryWrap').style.display=sp?'none':'';
 document.getElementById('sikapMasterCode').required=sp;
 document.getElementById('sikapMasterCategory').required=!sp;
 if(!sp)document.getElementById('sikapMasterCode').value='';
 else if(!document.getElementById('sikapMasterCode').value)document.getElementById('sikapMasterCode').selectedIndex=1;
}
function sikapMasterRoleMode(){const editing=!!$('sikapMasterId').value;const option=$('sikapMasterRole').querySelector('option[value="__ALL__"]');if(option)option.disabled=editing;if(editing&&$('sikapMasterRole').value==='__ALL__')$('sikapMasterRole').value='KEPALA';}
function reset(){for(const id of ['sikapMasterId','sikapMasterChoice','sikapMasterDetail','sikapMasterOutput','sikapMasterEvidence','sikapMasterUnit'])$(id).value='';$('sikapMasterRole').value='KEPALA';sikapMasterRoleMode();$('sikapMasterCategory').value='H';$('sikapMasterCode').value='';$('sikapMasterKind').value='sp';sikapMasterKindChange();}
function actionReady(){return s95role==='super_admin'&&!!s67client&&!!s67currentUser;}
$('sikapMasterCategory').innerHTML=Object.entries(FUNCTIONS9).map(([k,v])=>`<option value="${k}">${k} · ${h(v)}</option>`).join('');$('sikapMasterCode').innerHTML='<option value="">Tidak terkait SP / kegiatan internal</option>'+Object.entries(SIKAP_STANDAR_888).map(([k,v])=>`<option value="${k}">${k} · ${h(v)}</option>`).join('');$('sikapMasterKind').addEventListener('change',sikapMasterKindChange);reset();
$('sikapMasterForm').onsubmit=async(e)=>{e.preventDefault();if(!actionReady()){msg('Akses khusus Super Admin.');return;}
 const kind=$('sikapMasterKind').value,code=kind==='sp'?$('sikapMasterCode').value:'',role=$('sikapMasterRole').value,category=$('sikapMasterCategory').value;
 if(!(types.includes(role)||role==='__ALL__')||!FUNCTIONS9[category]||(kind==='sp'&&!SIKAP_STANDAR_888[code])){msg('Jabatan atau kategori tidak valid.');return;}
 const inferredCategory=code?code.substring(3,4):category;
 const base={category:inferredCategory,code,choice:$('sikapMasterChoice').value.trim(),detail:$('sikapMasterDetail').value.trim(),output:$('sikapMasterOutput').value.trim(),evidence:$('sikapMasterEvidence').value.trim(),unit:$('sikapMasterUnit').value.trim()||'Layanan'};
 if(!base.choice||!base.detail||!base.output){msg('Pilihan, uraian, dan output wajib diisi.');return;}
 const id=$('sikapMasterId').value; if(id&&!serverRows.some(r=>String(r.id)===id)){msg('ID master tidak dikenal. Muat ulang.');return;}
 if(id&&role==='__ALL__'){msg('Opsi Semua Jabatan hanya untuk menambahkan kegiatan baru. Batalkan edit terlebih dahulu.');return;}
 const targetRoles=role==='__ALL__'?types:[role];
 // Baris yang sudah ada diabaikan agar operasi Semua Jabatan dapat dilanjutkan dengan aman.
 const normalize=v=>String(v||'').trim().toLocaleLowerCase('id-ID');
 const existingRoles=!id?serverRows.filter(r=>targetRoles.includes(r.role)&&String(r.code||'')===code&&normalize(r.choice)===normalize(base.choice)&&normalize(r.detail)===normalize(base.detail)).map(r=>r.role):[];
 const remainingRoles=targetRoles.filter(r=>!existingRoles.includes(r));
 if(!id&&!remainingRoles.length){msg('Master ini sudah ada untuk seluruh jabatan yang dipilih. Tidak ada data baru disimpan.');return;}
 if(!confirm(id?'Simpan perubahan master kegiatan?':role==='__ALL__'?'Tambahkan kegiatan ini untuk SEMUA '+types.length+' jabatan pada seluruh KUA?':'Tambahkan kegiatan ini untuk seluruh KUA?'))return;
 msg('Menyimpan…');
 const submitButton=$('sikapMasterForm').querySelector('button[type="submit"]');submitButton.disabled=true;
 try{
  if(id){
   const {data,error}=await s67client.from('sikap_master_bersama').update({...base,code:code,role}).eq('id',id).select('id');
   if(error){msg('Gagal memperbarui master: '+error.message);return;}
   if(!data?.length){msg('Perubahan tidak tersimpan. Periksa izin UPDATE (RLS) Supabase untuk Super Admin.');return;}
   reset();await window.sikapLoadSharedMaster();msg('Master berhasil diperbarui.');return;
  }
  const succeeded=[],failures=[];
  // Simpan satu per satu agar kegagalan satu jabatan tidak menyembunyikan hasil jabatan lain.
  for(const targetRole of remainingRoles){
   msg(`Menyimpan ${succeeded.length+1} dari ${remainingRoles.length} jabatan: ${targetRole}…`);
   const {data,error}=await s67client.from('sikap_master_bersama').insert({...base,code:code,role:targetRole}).select('id');
   if(error||!data?.length){failures.push(`${targetRole}: ${error?.message||'Ditolak oleh kebijakan INSERT/SELECT (RLS)'}`);}
   else succeeded.push(targetRole);
  }
  if(succeeded.length){reset();await window.sikapLoadSharedMaster();}
  msg(`${succeeded.length} jabatan berhasil disimpan${existingRoles.length?`, ${existingRoles.length} sudah ada`:''}.${failures.length?' GAGAL '+failures.length+' jabatan: '+failures.join(' | '):' Kegiatan tersedia setelah memuat ulang LCKH.'}`);
 }catch(err){msg('Kesalahan saat menyimpan: '+(err?.message||String(err)));}
 finally{submitButton.disabled=false;}
};
$('sikapMasterRows').onclick=async(e)=>{const eb=e.target.closest('[data-edit-master]'),tb=e.target.closest('[data-toggle-master]'),del=e.target.closest('[data-delete-master]');if(del){if(!actionReady()){msg('Hanya Super Admin dapat menghapus master.');return;}const r=serverRows.find(x=>String(x.id)===del.dataset.deleteMaster);if(!r)return;if(!confirm(`HAPUS PERMANEN master kegiatan “${r.choice}” untuk jabatan “${r.role}”?\n\nMaster akan dihapus dari pilihan LCKH. Riwayat LCKH pegawai yang sudah dicatat tidak dihapus.`))return;const typed=prompt('Ketik HAPUS untuk mengonfirmasi penghapusan permanen:');if(typed!=='HAPUS'){msg('Penghapusan dibatalkan.');return;}del.disabled=true;msg('Menghapus master…');try{const {data,error}=await s67client.from('sikap_master_bersama').delete().eq('id',r.id).select('id');if(error){msg('Gagal menghapus: '+error.message+'; periksa izin DELETE (RLS) Supabase.');return;}if(!data?.length){msg('Master belum terhapus. Kemungkinan kebijakan DELETE (RLS) Supabase belum mengizinkan.');return;}if($('sikapMasterId').value===String(r.id))reset();await window.sikapLoadSharedMaster();msg('Master “'+r.choice+'” untuk '+r.role+' berhasil dihapus. Riwayat LCKH tetap ada.');}catch(err){msg('Gagal menghapus: '+(err?.message||String(err)));}finally{del.disabled=false;}return;}if(eb){const r=serverRows.find(x=>String(x.id)===eb.dataset.editMaster);if(!r)return;const mapped=sikapKlasifikasiMaster(r);$('sikapMasterId').value=r.id;for(const [fld,k] of [['Role','role'],['Category','category'],['Code','code'],['Choice','choice'],['Detail','detail'],['Output','output'],['Evidence','evidence'],['Unit','unit']])$('sikapMaster'+fld).value=k==='code'||k==='category'?mapped[k]:(r[k]||'');$('sikapMasterKind').value=mapped.code?'sp':'fungsi';sikapMasterKindChange();sikapMasterRoleMode();$('sikapMasterForm').scrollIntoView({behavior:'smooth'});return;}if(tb){if(!actionReady())return;const r=serverRows.find(x=>String(x.id)===tb.dataset.toggleMaster);if(!r||!confirm(`${r.aktif?'Nonaktifkan':'Aktifkan'} kegiatan “${r.choice}”? Riwayat LCKH tidak dihapus.`))return;const {error}=await s67client.from('sikap_master_bersama').update({aktif:!r.aktif}).eq('id',r.id);if(error){msg('Gagal: '+error.message);return;}await window.sikapLoadSharedMaster();}};
$('sikapMasterReset').onclick=reset;
$('sikapMasterViewCategory').insertAdjacentHTML('beforeend',sikapOpsiFungsi());
for(const id of ['sikapMasterViewCategory','sikapMasterViewSource'])$(id).onchange=()=>{masterPage=1;bindRows();};
bindRows();
$('sikapMasterFilter').oninput=()=>{masterPage=1;bindRows()};$('sikapMasterSize').onchange=()=>{masterPage=1;bindRows()};$('sikapMasterPaging').onclick=e=>{const b=e.target.closest('[data-master-page]');if(b){masterPage+=Number(b.dataset.masterPage);bindRows();}};
$('sikapSuperTabs').onclick=e=>{const b=e.target.closest('[data-pane]');if(!b)return;const pane=b.dataset.pane;for(const x of document.querySelectorAll('[data-sikap-super]'))x.hidden=x.dataset.sikapSuper!==pane;for(const x of $('sikapSuperTabs').querySelectorAll('button'))x.classList.toggle('active',x===b);if(pane==='master'&&actionReady())window.sikapLoadSharedMaster();};
$('s96size').onchange=()=>{s96pages.clear();s96groupRender()};$('s96groups').addEventListener('click',e=>{const b=e.target.closest('[data-s96-page]');if(!b)return;e.preventDefault();const key=b.dataset.s96Page;const parent=b.closest('details'),wasOpen=parent?.open;s96pages.set(key,Math.max(1,(s96pages.get(key)||1)+Number(b.dataset.dir)));s96groupRender();const all=[...$('s96groups').querySelectorAll('details')],found=all.find(x=>x.querySelector(`[data-s96-page="${key}"]`));if(found)found.open=wasOpen;});
for(const id of ['s95filter','s95statusfilter','s95size'])$(id).addEventListener(id==='s95filter'?'input':'change',()=>{s95page=1;s95renderRows()});
$('s95paging').onclick=e=>{const b=e.target.closest('[data-s95-dir]');if(b){s95page+=Number(b.dataset.s95Dir);s95renderRows();}};
})();
