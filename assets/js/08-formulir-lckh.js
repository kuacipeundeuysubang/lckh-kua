// Penyempurnaan formulir; dijalankan setelah modul autentikasi dan master.
function sikapValidEntryDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+'T12:00:00');
 return !Number.isNaN(d.getTime())&&d.getFullYear()===Number(value.slice(0,4))&&d.getMonth()+1===Number(value.slice(5,7))&&d.getDate()===Number(value.slice(8,10));
}
let sikapEntryNextDate='';
const sikapEntryBase=entry;
entry=function(){
 sikapEntryBase();
 const form=E('lckhForm');if(!form)return;
 const saved=db.entries.find(x=>x.id===state.editId),draft=state.copyDraft;
 if(!saved&&!draft&&sikapEntryNextDate){E('fdate').value=sikapEntryNextDate;sikapEntryNextDate='';}
 const notes=E('fnote')?.closest('.field');
 if(!E('fevidence')){
  const field=document.createElement('div');field.className='field full';
  field.innerHTML='<label for="fevidence">Jenis bukti dukung</label><input id="fevidence" maxlength="1500" placeholder="Contoh: daftar hadir, notulen, dokumentasi foto">';
  notes?.before(field);E('fevidence').value=state.selected?.evidence||draft?.evidence||'';
 }
 form.querySelectorAll('.field').forEach(field=>{const label=field.querySelector('label');const input=field.querySelector('input[id],textarea[id],select[id]');if(label&&input&&!label.htmlFor)label.htmlFor=input.id;});
};
const sikapEntryPickBase=pick;
pick=function(index){
 sikapEntryPickBase(index);
 const activity=state.selected;
 if(E('fevidence')&&!state.editId)E('fevidence').value=activity?.evidence||'';
 if(!state.editId&&activity?.unit){E('funitSelect').innerHTML=sikapOpsiSatuan(activity.unit);const manual=E('funitManual');if(manual)manual.value=sikapSatuanLain(activity.unit);sikapSatuanBerubah();}
};
function sikapEntryContinue(date){
 sikapEntryNextDate=date;state.copyDraft=null;state.selected=null;state.selectedRole=null;state.mode='master';go('entry');E('fdate')?.focus();
}
function sikapEntrySaved(date,edited){
 const box=document.createElement('section');box.className='panel sikap-entry-success';box.setAttribute('role','status');
 const text=document.createElement('strong');text.textContent=edited?'✓ Perubahan LCKH berhasil disimpan.':'✓ LCKH berhasil disimpan.';box.appendChild(text);
 const description=document.createElement('p');description.className='muted mini';description.textContent='Tanggal '+dd(date);box.appendChild(description);
 const button=document.createElement('button');button.type='button';button.className='btn';button.textContent='＋ Tambah kegiatan pada tanggal yang sama';button.onclick=()=>sikapEntryContinue(date);box.appendChild(button);E('content').prepend(box);toast('LCKH berhasil disimpan');
}
