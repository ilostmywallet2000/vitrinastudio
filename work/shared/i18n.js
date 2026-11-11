/* Language switch (ES, EN, RU, CA; missing CA falls back to ES). Pages define window.T = {key:{es,en,ru}} and mark text with
   data-i="key" (text) or data-ip="key" (placeholder). Buttons with data-l switch language. */
(function(){
  const LANGS=["es","en","ru","ca"],KEY="lang:"+location.pathname;
  let lang=document.documentElement.dataset.default||"es";
  try{const s=localStorage.getItem(KEY);if(LANGS.includes(s))lang=s;}catch(e){}
  function apply(l){
    lang=l;document.documentElement.lang=l;
    document.querySelectorAll("[data-i]").forEach(e=>{const v=T[e.dataset.i];if(v)e.textContent=v[l]??v.es;});
    document.querySelectorAll("[data-ih]").forEach(e=>{const v=T[e.dataset.ih];if(v)e.innerHTML=v[l]??v.es;});
    document.querySelectorAll("[data-ip]").forEach(e=>{const v=T[e.dataset.ip];if(v)e.placeholder=v[l]??v.es;});
    document.querySelectorAll("[data-l]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.l===l));
    try{localStorage.setItem(KEY,l);}catch(e){}
  }
  document.querySelectorAll("[data-l]").forEach(b=>b.addEventListener("click",()=>apply(b.dataset.l)));
  window.setLang=apply;apply(lang);
})();
