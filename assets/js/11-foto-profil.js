// Foto lokal per akun; tidak mengubah tabel atau hak akses database.
(function(){
 function key(){return typeof s67currentUser!=='undefined'&&s67currentUser?'sikap-photo-v1:'+s67currentUser:null;}
 function getPhoto(){try{const k=key();const value=k?localStorage.getItem(k):null;return value&&/^data:image\/(jpeg|png|webp);base64,/.test(value)?value:null;}catch{return null;}}
 function paint(target){
  if(!target)return;target.replaceChildren();const photo=getPhoto();
  if(photo){const image=document.createElement('img');image.src=photo;image.alt='Foto profil';target.append(image);}
  else target.textContent=Array.from(String(db.profile.name||'P').trim())[0].toUpperCase();
 }
 const baseHome=home;home=function(){baseHome();paint(document.querySelector('.sikap-home-avatar'));};
 const baseSettings=settings;settings=function(){
  baseSettings();const panel=document.createElement('section');panel.className='panel sikap-photo-settings';
  panel.innerHTML='<h2>Foto profil</h2><div class="sikap-photo-row"><div class="sikap-photo-preview" id="sikapPhotoPreview"></div><div class="sikap-photo-controls"><label for="sikapPhotoFile">Pilih foto</label><input id="sikapPhotoFile" type="file" accept="image/jpeg,image/png,image/webp"><div class="actions"><button id="sikapPhotoRemove" type="button" class="tinybtn">Hapus foto</button></div></div></div><p class="notice">Foto disimpan pada browser ini untuk akun Anda. Maksimal 5 MB; JPG, PNG, atau WebP.</p><p id="sikapPhotoStatus" class="notice" role="status" aria-live="polite"></p>';
  E('content').prepend(panel);paint(E('sikapPhotoPreview'));
  E('sikapPhotoRemove').disabled=!getPhoto();
  E('sikapPhotoRemove').onclick=()=>{try{const k=key();if(k)localStorage.removeItem(k);paint(E('sikapPhotoPreview'));E('sikapPhotoRemove').disabled=true;E('sikapPhotoStatus').textContent='Foto dihapus.';}catch{E('sikapPhotoStatus').textContent='Foto belum dapat dihapus.';}};
  E('sikapPhotoFile').onchange=async event=>{
   const input=event.target,file=input.files?.[0];if(!file)return;
   const status=E('sikapPhotoStatus'),k=key();
   if(!k){status.textContent='Masuk kembali untuk mengatur foto.';return;}
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){status.textContent='Pilih JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.';input.value='';return;}
   input.disabled=true;status.textContent='Menyimpan foto…';let objectURL;
   try{
    objectURL=URL.createObjectURL(file);const image=new Image();image.src=objectURL;await image.decode();
    if(!image.naturalWidth||!image.naturalHeight)throw Error('Gambar tidak valid.');
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const context=canvas.getContext('2d');
    const side=Math.min(image.naturalWidth,image.naturalHeight);context.fillStyle='#fff';context.fillRect(0,0,256,256);context.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,256,256);
    if(key()!==k)throw Error('Akun berubah. Buka kembali pengaturan.');
    localStorage.setItem(k,canvas.toDataURL('image/jpeg',0.82));paint(E('sikapPhotoPreview'));E('sikapPhotoRemove').disabled=false;status.textContent='Foto profil disimpan.';
   }catch(error){status.textContent='Foto gagal disimpan. '+(error.message||'Coba foto lain.');}
   finally{if(objectURL)URL.revokeObjectURL(objectURL);input.disabled=false;input.value='';}
  };
 };
 if(document.querySelector('.sikap-home-avatar'))paint(document.querySelector('.sikap-home-avatar'));
})();
