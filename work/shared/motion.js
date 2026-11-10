/* Vitrina motion kit for the concept sites.
   Load last: <script src="../shared/motion.js" data-accent="#hex" data-bg="#hex" data-fg="#hex"
                  data-name="Lazur" data-photos="a.jpg,b.jpg,..."></script>
   Adds: hero headline word rise, scroll reveals, image curtain reveals, gentle parallax,
   a scroll-linked photo band under the hero, a reading progress bar and magnetic buttons.
   Uses the individual translate/scale properties so it never fights a site's own transforms. */
(function(){
  const me = document.currentScript, D = me ? me.dataset : {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]shot/.test(location.search);
  const root = document.documentElement;
  const accent = D.accent || "#B08A4F", bg = D.bg || "#111", fg = D.fg || "#fff";
  root.style.setProperty("--mk-accent", accent);
  root.style.setProperty("--mk-bg", bg);
  root.style.setProperty("--mk-fg", fg);

  const css = `
  .mk-bar{position:fixed;left:0;top:0;height:3px;width:100%;background:var(--mk-accent);transform-origin:0 50%;transform:scaleX(0);z-index:9999;pointer-events:none}
  .mk-on .mk-w{display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:.08em;margin-bottom:-.08em}
  .mk-on .mk-w>span{display:inline-block;translate:0 105%;transition:translate 1.1s cubic-bezier(.2,.8,.1,1);transition-delay:calc(var(--d,0) * 1ms)}
  .mk-go .mk-w>span{translate:0 0}
  .mk-on .mk-rv{opacity:0;translate:0 34px;transition:opacity .9s ease,translate 1s cubic-bezier(.2,.8,.1,1);transition-delay:calc(var(--d,0) * 1ms)}
  .mk-on .mk-rv.mk-in{opacity:1;translate:0 0}
  .mk-on .mk-img{clip-path:inset(14% 8% 14% 8% round 6px);scale:1.14;transition:clip-path 1.3s cubic-bezier(.7,0,.2,1),scale 1.6s cubic-bezier(.2,.8,.1,1);transition-delay:calc(var(--d,0) * 1ms)}
  .mk-on .mk-img.mk-in{clip-path:inset(0 0 0 0 round 0);scale:1}
  .mk-band{position:relative;overflow:hidden;background:var(--mk-bg);color:var(--mk-fg);padding:clamp(40px,7vw,96px) 0;isolation:isolate}
  .mk-row{display:flex;gap:clamp(10px,1.4vw,20px);width:max-content;will-change:transform}
  .mk-row+.mk-row{margin-top:clamp(10px,1.4vw,20px)}
  .mk-row figure{margin:0;flex:none;width:clamp(170px,22vw,340px);aspect-ratio:4/3;border-radius:clamp(10px,1.2vw,18px);overflow:hidden;background:#0002}
  .mk-row figure:nth-child(3n+2){aspect-ratio:1/1;width:clamp(130px,16vw,250px)}
  .mk-row figure:nth-child(4n+3){border-radius:999px}
  .mk-row img{width:100%;height:100%;object-fit:cover;display:block;transition:scale .8s cubic-bezier(.2,.8,.1,1)}
  .mk-row figure:hover img{scale:1.08}
  .mk-name{position:relative;z-index:2;white-space:nowrap;font-size:clamp(64px,13vw,220px);line-height:.92;letter-spacing:-.02em;margin:clamp(10px,1.4vw,20px) 0;width:max-content;will-change:transform}
  .mk-name span{color:transparent;-webkit-text-stroke:1.5px var(--mk-fg)}
  .mk-name b{font-weight:inherit;color:var(--mk-accent)}
  .mk-name i{font-style:normal;display:inline-block;margin:0 .25em;color:var(--mk-accent);font-size:.5em;vertical-align:middle;animation:mk-spin 9s linear infinite}
  @keyframes mk-spin{to{rotate:360deg}}
  .mk-mag{transition:translate .5s cubic-bezier(.2,.8,.1,1)}
  @media (prefers-reduced-motion: reduce){.mk-name i{animation:none}}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.append(st);

  /* progress bar */
  const bar = document.createElement("div"); bar.className = "mk-bar"; document.body.append(bar);

  /* photo band, placed before the first section */
  const photos = (D.photos || "").split(",").map(s => s.trim()).filter(Boolean);
  const name = D.name || document.title.split("·")[0].trim();
  let rows = [];
  const first = document.querySelector("main section, body > section");
  if (photos.length && first) {
    const band = document.createElement("div"); band.className = "mk-band"; band.setAttribute("aria-hidden", "true");
    const h1 = document.querySelector("h1");
    const mkRow = list => { const r = document.createElement("div"); r.className = "mk-row";
      const L = list.concat(list, list); L.forEach(p => { const f = document.createElement("figure"); const i = new Image(); i.src = "photos/" + p; i.alt = ""; i.loading = "lazy"; f.append(i); r.append(f); }); return r; };
    const half = Math.ceil(photos.length / 2);
    const r1 = mkRow(photos.slice(0, half).concat(photos.slice(half)));
    const r2 = mkRow(photos.slice(half).concat(photos.slice(0, half)).reverse());
    const nm = document.createElement("div"); nm.className = "mk-name";
    if (h1) { const cs = getComputedStyle(h1); nm.style.fontFamily = cs.fontFamily; nm.style.fontWeight = cs.fontWeight; nm.style.textTransform = cs.textTransform; }
    const unit = `<span>${name}</span><i>✦</i><b>${name}</b><i>✦</i>`;
    nm.innerHTML = unit.repeat(4);
    band.append(r1, nm, r2);
    first.parentNode.insertBefore(band, first);
    rows = [[r1, -1, .22], [nm, 1, .32], [r2, 1, .18]];
  }

  if (reduce) { addEventListener("scroll", () => { const h = root.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; }, {passive:true}); return; }

  root.classList.add("mk-on");

  /* hero headline: split text into words that rise one by one */
  const h1 = document.querySelector("h1");
  function split(el){
    let n = 0;
    const walk = node => {
      [...node.childNodes].forEach(c => {
        if (c.nodeType === 3) {
          const parts = c.textContent.split(/(\s+)/); const frag = document.createDocumentFragment();
          parts.forEach(p => { if (!p) return; if (/^\s+$/.test(p)) { frag.append(document.createTextNode(p)); return; }
            const w = document.createElement("span"); w.className = "mk-w"; const s = document.createElement("span"); s.textContent = p; s.style.setProperty("--d", 120 + n++ * 85); w.append(s); frag.append(w); });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && c.tagName !== "BR" && c.tagName !== "IMG" && c.tagName !== "SVG") walk(c);
      });
    };
    walk(el); return n;
  }
  let words = 0;
  if (h1) words = split(h1);
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("mk-go")));
  if (typeof window.setLang === "function") { const o = window.setLang; window.setLang = l => { o(l); if (h1 && !h1.querySelector(".mk-w")) split(h1); }; }

  /* hero supporting elements fade up after the headline */
  const heroBox = h1 ? h1.closest(".hero, header, .w, div") : null;
  const after = 200 + words * 85;
  if (heroBox) [...heroBox.querySelectorAll(":scope > *:not(h1), :scope > div > *:not(h1)")].filter(e => !e.contains(h1)).slice(0, 8)
    .forEach((e, i) => { e.classList.add("mk-rv"); e.style.setProperty("--d", after + i * 110); });

  /* scroll reveals */
  const skip = "#ast, .ast, [class*=assistant], [class*=chat], form, footer details";
  const sel = "section h2, section h3, section > .w > p, section .w > p, section article, section [class*=card], section li, section figure, section .item, section .dish, section .row";
  const seen = new Set();
  document.querySelectorAll(sel).forEach(el => {
    if (el.closest(skip) || el.closest(".mk-band") || seen.has(el)) return;
    for (const s of seen) if (s.contains(el)) return;
    seen.add(el); el.classList.add("mk-rv");
  });
  document.querySelectorAll("section img, .hero img").forEach(img => {
    if (img.closest(skip) || img.closest(".mk-band") || img.width < 80) return;
    img.classList.add("mk-img");
  });
  /* stagger siblings that enter together */
  const io = new IntersectionObserver(es => {
    const batch = es.filter(e => e.isIntersecting).map(e => e.target);
    batch.forEach((el, i) => { if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", i * 90); el.classList.add("mk-in"); io.unobserve(el); });
  }, {rootMargin: "0px 0px -8% 0px", threshold: .08});
  document.querySelectorAll(".mk-rv, .mk-img").forEach(el => {
    if (heroBox && heroBox.contains(el) && el.classList.contains("mk-rv")) { setTimeout(() => el.classList.add("mk-in"), 30); return; }
    io.observe(el);
  });
  /* safety: never leave anything hidden */
  setTimeout(() => document.querySelectorAll(".mk-rv:not(.mk-in), .mk-img:not(.mk-in)").forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add("mk-in"); }), 2500);

  /* parallax for photos inside cropped frames */
  const par = [];
  document.querySelectorAll("section img, .hero img").forEach(img => {
    if (img.closest(skip) || img.closest(".mk-band")) return;
    const p = img.parentElement; if (!p) return;
    const cs = getComputedStyle(p);
    if ((cs.overflow === "hidden" || cs.overflowY === "hidden" || cs.overflow === "clip") && img.offsetHeight > 120) { img.style.scale = "1.12"; par.push(img); img.classList.remove("mk-img"); img.classList.add("mk-par"); }
  });

  /* magnetic buttons (mouse only) */
  if (matchMedia("(pointer:fine)").matches) document.querySelectorAll("a.btn, button.btn, .ctas a, .cta").forEach(b => {
    b.classList.add("mk-mag");
    b.addEventListener("mousemove", e => { const r = b.getBoundingClientRect(); b.style.translate = `${(e.clientX - r.left - r.width / 2) * .18}px ${(e.clientY - r.top - r.height / 2) * .28}px`; });
    b.addEventListener("mouseleave", () => b.style.translate = "0 0");
  });

  /* one scroll loop for bar, band and parallax */
  let ticking = false;
  function frame(){
    ticking = false;
    const h = root.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    rows.forEach(([el, dir, k]) => { const r = el.parentElement.getBoundingClientRect(); const prog = innerHeight - r.top; el.style.transform = `translate3d(${dir * prog * k - (dir < 0 ? 0 : el.scrollWidth * .25)}px,0,0)`; });
    par.forEach(img => { const r = img.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; img.style.translate = `0 ${c * -8}%`; });
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, {passive:true});
  addEventListener("resize", frame); frame();
})();
