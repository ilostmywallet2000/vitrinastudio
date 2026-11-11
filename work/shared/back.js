/* "Back to Vitrina" button for the concept sites: a small pill in the bottom-left corner
   (the chat button lives bottom-right). Label follows the page language. */
(function(){
  const L = {es:"Volver a Vitrina", ca:"Tornar a Vitrina", en:"Back to Vitrina", ru:"Назад в Vitrina"};
  const css = `
  .vb-back{position:fixed;z-index:9990;left:calc(14px + env(safe-area-inset-left,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));
    display:inline-flex;align-items:center;gap:10px;padding:10px 16px 10px 12px;border-radius:999px;background:#131A2A;color:#F5F1E8;
    font:500 13px/1 "Geologica",system-ui,-apple-system,sans-serif;text-decoration:none;box-shadow:0 10px 30px -10px rgba(0,0,0,.45);
    border:1px solid rgba(210,174,110,.45);transition:transform .2s,background .2s}
  .vb-back:hover{transform:translateY(-2px);background:#1C2438}
  .vb-back:focus-visible{outline:2px solid #D2AE6E;outline-offset:3px}
  .vb-back .ar{font-size:15px;color:#D2AE6E}
  .vb-back .mk{position:relative;padding:3px 7px 3px 8px;letter-spacing:.32em;font-size:10.5px;margin-right:-.32em}
  .vb-back .mk i{position:absolute;width:5px;height:5px;border:1.2px solid #D2AE6E}
  .vb-back .mk i:nth-child(1){left:0;top:0;border-right:0;border-bottom:0}.vb-back .mk i:nth-child(2){right:.32em;top:0;border-left:0;border-bottom:0}
  .vb-back .mk i:nth-child(3){left:0;bottom:0;border-right:0;border-top:0}.vb-back .mk i:nth-child(4){right:.32em;bottom:0;border-left:0;border-top:0}
  @media (max-width:600px){.vb-back .tx{display:none}.vb-back{padding:10px 14px 10px 12px}}
  @media print{.vb-back{display:none}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const a = document.createElement("a");
  a.className = "vb-back"; a.href = "../../";
  a.innerHTML = '<span class="ar" aria-hidden="true">←</span><span class="mk" aria-hidden="true"><i></i><i></i><i></i><i></i>VITRINA</span><span class="tx"></span>';
  const set = () => { const l = (document.documentElement.lang || "es").slice(0, 2); const t = L[l] || L.en; a.querySelector(".tx").textContent = t; a.setAttribute("aria-label", t); };
  set(); document.body.appendChild(a);
  new MutationObserver(set).observe(document.documentElement, {attributes:true, attributeFilter:["lang"]});
})();
