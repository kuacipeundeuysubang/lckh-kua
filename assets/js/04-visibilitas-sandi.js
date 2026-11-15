
(function(){
 const button=document.getElementById('s67togglePassword');
 const password=document.getElementById('s67password');
 if(!button||!password)return;
 button.addEventListener('click',function(){
  const visible=password.type==='password';
  password.type=visible?'text':'password';
  button.setAttribute('aria-pressed',String(visible));
  button.setAttribute('aria-label',visible?'Sembunyikan kata sandi':'Tampilkan kata sandi');
  button.title=visible?'Sembunyikan kata sandi':'Tampilkan kata sandi';
 });
})();
