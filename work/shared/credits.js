/* Photo credits from photos/credits.js (Wikimedia Commons, free licences). */
(function(){
  const C=window.CREDITS||[],AI=window.AI_PHOTOS||0;if(!C.length&&!AI)return;
  const f=document.querySelector("footer .w")||document.querySelector("footer");if(!f)return;
  const L={es:"Fotos",en:"Photos",ru:"Фото"};
  const N={es:"Fotos de ejemplo generadas con IA; se sustituyen por fotos reales del local.",en:"Example photos generated with AI; to be replaced with the business's own photos.",ru:"Примеры фото созданы ИИ; их заменят реальные фото заведения."};
  const d=document.createElement("details");d.style.cssText="flex-basis:100%;font-size:12px;opacity:.85";
  const s=document.createElement("summary");s.style.cursor="pointer";d.append(s);
  const ul=document.createElement("ul");ul.style.cssText="margin:8px 0 0;padding-left:18px;columns:2 260px";
  C.forEach(c=>{const li=document.createElement("li");const a=document.createElement("a");a.href=c.source;a.target="_blank";a.rel="noopener";a.textContent=c.title.replace(/\.(jpe?g|png)$/i,"");
    li.append(a,document.createTextNode(" · "+(c.author||"unknown")+" · "+c.license));ul.append(li);});
  d.append(ul);f.append(d);
  const note=document.createElement("p");note.style.margin="6px 0 0";d.insertBefore(note,ul);if(!C.length)ul.remove();
  const lab=()=>{const l=document.documentElement.lang;s.textContent=(L[l]||L.en)+(C.length?": IA / AI + Wikimedia Commons ("+C.length+")":": IA / AI");note.textContent=AI?(N[l]||N.en):"";};
  new MutationObserver(lab).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});lab();
})();
