/* Ghostline assistant widget.
   One engine, tuned per business through window.ASSISTANT = {
     name, initials, role:{es,en,ru}, theme:{bg,fg,accent,onAccent,bubble,me,chat},
     greet:{es,en,ru}, demos:[{label:{es,en,ru}, steps:(lang)=>[{u}|{b}|{tool,args}]}],
     tools:[{name,description,inputSchema,execute(args,ui)}], brief:(lang,state)=>string
   }
   Live replies run through Claude when the page is open inside Claude (artifact "sample"
   capability). Everywhere else the demos play as recorded conversations. */
(function(){
  const A=window.ASSISTANT; if(!A) return;
  const LANGS=["es","en","ru","ca"];
  const UI={
    open:{es:"Escríbenos",en:"Message us",ru:"Написать нам",ca:"Escriu-nos"},
    online:{es:"responde al instante",en:"replies instantly",ru:"отвечает сразу",ca:"respon a l'instant"},
    typing:{es:"escribiendo…",en:"typing…",ru:"печатает…",ca:"escrivint…"},
    ph:{es:"Escribe un mensaje",en:"Type a message",ru:"Напишите сообщение",ca:"Escriu un missatge"},
    phRec:{es:"Toca una pregunta para ver la demo",en:"Tap a question to play the demo",ru:"Нажмите вопрос, чтобы запустить демо",ca:"Toca una pregunta per veure la demo"},
    rec:{es:"Demo grabada",en:"Recorded demo",ru:"Записанное демо",ca:"Demo gravada"},
    live:{es:"IA en vivo",en:"Live AI",ru:"Живой ИИ",ca:"IA en directe"},
    err:{es:"No he podido responder. Prueba otra vez.",en:"I couldn't reply that time. Try again.",ru:"Не получилось ответить. Попробуйте ещё раз.",ca:"No he pogut respondre. Torna-ho a provar."},
    close:{es:"Cerrar",en:"Close",ru:"Закрыть",ca:"Tancar"},
    reset:{es:"Nuevo chat",en:"New chat",ru:"Новый чат",ca:"Xat nou"}
  };
  const th=A.theme;
  const css=`
  .gw-btn{position:fixed;right:max(18px,env(safe-area-inset-right,0px));bottom:max(18px,env(safe-area-inset-bottom,0px));z-index:60;display:flex;align-items:center;gap:10px;border:0;border-radius:99px;padding:10px 18px 10px 10px;background:${th.bg};color:${th.fg};font:600 15px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 18px 40px -14px rgba(0,0,0,.45);transition:transform .2s}
  .gw-btn:hover{transform:translateY(-2px)}
  .gw-btn .gw-av{width:36px;height:36px}
  .gw-av{border-radius:50%;background:${th.accent};color:${th.onAccent};display:grid;place-items:center;font:700 13px/1 system-ui,sans-serif;flex:none;letter-spacing:.02em}
  .gw-dot{width:8px;height:8px;border-radius:50%;background:#34C17B;box-shadow:0 0 0 3px rgba(52,193,123,.25)}
  .gw-panel,.gw-panel *{box-sizing:border-box}
  .gw-panel{margin:0;padding:0;position:fixed;right:max(18px,env(safe-area-inset-right,0px));bottom:max(18px,env(safe-area-inset-bottom,0px));z-index:61;width:min(380px,calc(100vw - 24px));height:min(620px,calc(100dvh - 36px));display:flex;flex-direction:column;border-radius:26px;overflow:hidden;background:${th.chat};color:#1b1b1b;box-shadow:0 40px 90px -30px rgba(0,0,0,.55);font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;transform-origin:bottom right;animation:gwIn .28s cubic-bezier(.2,.8,.2,1)}
  @media (max-width:520px){.gw-panel{right:12px;left:12px;width:auto;bottom:12px;height:calc(100dvh - 24px)}}
  @keyframes gwIn{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:none}}
  .gw-head{background:${th.bg};color:${th.fg};padding:16px;display:flex;align-items:center;gap:11px}
  .gw-head .gw-av{width:40px;height:40px}
  .gw-head b{display:block;font-size:16px}
  .gw-head small{opacity:.72;font-size:12.5px}
  .gw-head .gw-g{flex:1;min-width:0}
  .gw-x{border:0;background:rgba(255,255,255,.12);color:inherit;width:32px;height:32px;border-radius:50%;font-size:18px;line-height:1;cursor:pointer}
  .gw-r{border:1px solid currentColor;background:none;color:inherit;border-radius:99px;font-size:12px;padding:6px 10px;opacity:.7;cursor:pointer}
  .gw-msgs{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:7px}
  .gw-b{max-width:85%;padding:9px 12px;border-radius:16px;white-space:pre-wrap;overflow-wrap:anywhere;animation:gwPop .25s ease-out both}
  .gw-b.bot{align-self:flex-start;background:${th.bubble};border-bottom-left-radius:5px}
  .gw-b.me{align-self:flex-end;background:${th.me};border-bottom-right-radius:5px}
  @keyframes gwPop{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
  .gw-tool{align-self:center;font:11px/1.3 ui-monospace,Menlo,monospace;color:#555;background:rgba(255,255,255,.65);border:1px dashed rgba(0,0,0,.18);padding:5px 10px;border-radius:99px;max-width:94%;text-align:center}
  .gw-card{align-self:flex-start;width:85%;background:${th.bg};color:${th.fg};border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:3px}
  .gw-card span{font:10.5px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;opacity:.75}
  .gw-typing{align-self:flex-start;background:${th.bubble};border-radius:16px;padding:12px 14px;display:flex;gap:4px}
  .gw-typing i{width:6px;height:6px;border-radius:50%;background:#aaa;animation:gwDot 1.1s infinite}
  .gw-typing i:nth-child(2){animation-delay:.15s}.gw-typing i:nth-child(3){animation-delay:.3s}
  @keyframes gwDot{30%{transform:translateY(-4px)}}
  .gw-chips{display:flex;gap:6px;overflow-x:auto;padding:6px 12px 2px;scrollbar-width:none}
  .gw-chips button{flex:none;border:1px solid rgba(0,0,0,.15);background:#fff;color:#1b1b1b;border-radius:99px;padding:7px 12px;font:13px/1.2 system-ui,sans-serif;cursor:pointer;white-space:nowrap}
  .gw-form{display:flex;gap:8px;padding:10px 12px 14px}
  .gw-form input{flex:1;min-width:0;border:0;border-radius:99px;padding:12px 15px;font:15px system-ui,sans-serif;background:#fff;color:#1b1b1b}
  .gw-form button{width:44px;height:44px;border-radius:50%;border:0;background:${th.accent};color:${th.onAccent};font-size:18px;cursor:pointer}
  .gw-form :disabled{opacity:.5}
  .gw-mode{align-self:center;font:11px/1 ui-monospace,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:#777;padding:2px 0 6px}
  @media (prefers-reduced-motion:reduce){.gw-panel,.gw-b,.gw-typing i{animation:none}}`;
  const st=document.createElement("style");st.textContent=css;document.head.append(st);

  const lang=()=>{const l=document.documentElement.lang;return LANGS.includes(l)?l:"en";};
  const u=k=>UI[k][lang()];
  const el=(t,c,txt)=>{const e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e;};

  const btn=el("button","gw-btn");btn.type="button";
  const av=el("span","gw-av",A.initials);const lab=el("span");const dot=el("span","gw-dot");
  btn.append(av,lab,dot);document.body.append(btn);

  let panel=null,msgs,chips,inp,send,sample=null,mode="recorded",busy=false,history=[];
  const state={log:[]};
  A.state=state;

  async function connect(){
    try{if(window.claude&&typeof window.claude.use==="function")sample=await window.claude.use("sample");}catch(e){sample=null;}
    if(sample){const lim=await sample.limits().catch(()=>null);if(lim&&!lim.tools)sample=null;}
    mode=sample?"live":"recorded";if(panel)setMode();
  }
  function setMode(){
    const rec=mode!=="live";inp.disabled=rec;send.disabled=rec;inp.placeholder=rec?u("phRec"):u("ph");
    panel.querySelector(".gw-mode").textContent=rec?u("rec"):u("live");
  }
  const scroll=()=>{msgs.scrollTop=msgs.scrollHeight;};
  let typingEl=null;
  function typing(on){
    if(on&&!typingEl){typingEl=el("div","gw-typing");typingEl.innerHTML="<i></i><i></i><i></i>";msgs.append(typingEl);panel.querySelector(".gw-head small").textContent=u("typing");scroll();}
    if(!on&&typingEl){typingEl.remove();typingEl=null;panel.querySelector(".gw-head small").textContent=A.role[lang()]+" · "+u("online");}
  }
  const put=n=>{typingEl?msgs.insertBefore(n,typingEl):msgs.append(n);scroll();return n;};
  const ui={
    pill:t=>{if(cur){sealed=lastText.length;cur=null;}put(el("div","gw-tool",t));},
    card:(k,v)=>{const c=el("div","gw-card");c.append(el("span",null,k),el("b",null,v));put(c);},
    lang
  };
  A.ui=ui;
  const bubble=(t,who)=>put(el("div","gw-b "+who,t));

  function open(){
    if(panel){panel.hidden=false;btn.hidden=true;return;}
    panel=el("div","gw-panel");panel.setAttribute("role","dialog");panel.setAttribute("aria-label",A.name);
    panel.innerHTML='<div class="gw-head"><span class="gw-av"></span><span class="gw-g"><b></b><small></small></span><button class="gw-r" type="button"></button><button class="gw-x" type="button">×</button></div><div class="gw-msgs" aria-live="polite"></div><div class="gw-chips"></div><form class="gw-form" autocomplete="off"><input maxlength="400" aria-label="Message"><button type="submit" aria-label="Send">→</button></form>';
    panel.querySelector(".gw-av").textContent=A.initials;panel.querySelector(".gw-head b").textContent=A.name;
    msgs=panel.querySelector(".gw-msgs");chips=panel.querySelector(".gw-chips");inp=panel.querySelector("input");send=panel.querySelector(".gw-form button");
    panel.querySelector(".gw-x").onclick=()=>{panel.hidden=true;btn.hidden=false;};
    panel.querySelector(".gw-r").onclick=reset;
    panel.querySelector("form").onsubmit=e=>{e.preventDefault();const v=inp.value.trim();if(!v)return;inp.value="";ask(v);};
    document.body.append(panel);btn.hidden=true;reset();
  }
  function reset(){
    if(busy)return;history=[];msgs.textContent="";
    msgs.append(el("div","gw-mode"));
    panel.querySelector(".gw-r").textContent=u("reset");panel.querySelector(".gw-x").setAttribute("aria-label",u("close"));
    panel.querySelector(".gw-head small").textContent=A.role[lang()]+" · "+u("online");
    bubble(A.greet[lang()],"bot");renderChips();setMode();
  }
  function renderChips(){
    chips.textContent="";
    A.demos.forEach(d=>{const b=el("button",null,d.label[lang()]);b.type="button";
      b.onclick=()=>mode==="live"?ask(d.label[lang()]):play(d.steps(lang()));chips.append(b);});
  }
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  async function play(steps){
    if(busy)return;busy=true;
    for(const s of steps){
      if(s.u){await wait(300);bubble(s.u,"me");await wait(450);typing(true);await wait(850);}
      if(s.tool){const t=A.tools.find(x=>x.name===s.tool);const r=await t.execute(s.args,ui);if(s.after)s.after(r);await wait(600);}
      if(s.b){await wait(350);typing(false);bubble(typeof s.b==="function"?s.b():s.b,"bot");await wait(650);}
    }
    typing(false);busy=false;
  }
  let cur=null,sealed=0,lastText="";
  async function ask(text){
    if(busy||mode!=="live")return;busy=true;send.disabled=true;
    bubble(text,"me");history.push({role:"user",content:text});typing(true);cur=null;sealed=0;lastText="";
    const input=history.map((m,i)=>i===0?{role:"user",content:A.brief(lang(),state)+"\n\n---\nCustomer's message:\n"+m.content}:m);
    const tools=A.tools.map(t=>({name:t.name,description:t.description,inputSchema:t.inputSchema,execute:a=>t.execute(a,ui)}));
    try{
      const res=await sample(input,{tools,cache:false,modelTier:"quick",onText:({text})=>{
        lastText=text;const seg=text.slice(sealed).replace(/\*\*(.+?)\*\*/g,"$1").trim();if(!seg)return;
        if(!cur){typing(false);cur=bubble("","bot");}cur.textContent=seg;scroll();}});
      typing(false);if(!cur)bubble(res.text.slice(sealed).trim()||"…","bot");
      history.push({role:"assistant",content:res.text.trim()||"…"});
    }catch(e){
      typing(false);history.pop();
      if(e&&["not_granted","sampling_disabled","capability_disabled","tools_unavailable","not_declared"].includes(e.code)){sample=null;mode="recorded";setMode();}
      else if(!e||e.code!=="cancelled")bubble(u("err"),"bot");
    }finally{busy=false;if(mode==="live")send.disabled=false;}
  }
  function label(){lab.textContent=u("open");if(panel&&!busy)reset();}
  btn.onclick=open;
  new MutationObserver(label).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  label();connect();
})();
