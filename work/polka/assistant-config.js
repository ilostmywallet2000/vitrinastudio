/* Polka: shop assistant. The shop's daily question is "do you have X?", so the assistant answers
   stock questions, explains products to Spanish customers, and puts pickup orders aside. */
(function(){
  const S=Slots;
  const EXTRA=[["Caja Novy God","Набор «Новогодний»",35],["Caja Merienda","Набор к чаю",25],["Caja Ereván","Набор «Ереван»",40]];
  const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  const SYN={"творог":"tvorog","cottage":"tvorog","requeson":"tvorog","pelmeni":"pelmeni","пельмени":"pelmeni","dumpling":"pelmeni","гречка":"grechka","buckwheat":"grechka","alforfon":"grechka","сгущ":"sgushchenka","condensed":"sgushchenka","condensada":"sgushchenka","квас":"kvas","kvass":"kvas","кефир":"kefir","сметана":"smetana","sour cream":"smetana","шпрот":"shprot","sprat":"shprot","лаваш":"lavash","алёнка":"alionka","аленка":"alionka","пряник":"pryaniki","боржоми":"borjomi","коньяк":"ararat","brandy":"ararat","cognac":"ararat","варени":"vareniki"};
  const L={es:0,en:1,ru:2},tr=(l,a)=>a[L[l]];
  function find(q){let k=norm(q);for(const [a,b] of Object.entries(SYN))if(k.includes(norm(a)))k=b;
    return (typeof P!=="undefined"?P:[]).filter(p=>norm(p[1]+" "+p[2]).includes(k)||norm(p[1]).split(" ").some(w=>w.length>3&&k.includes(w)));}
  const H={1:[[600,1230]],2:[[600,1230]],3:[[600,1230]],4:[[600,1230]],5:[[600,1230]],6:[[600,1230]],0:[]};
  const cal=S.make(H,{lastStart:15,step:30});
  window.ASSISTANT={
    name:"Polka",initials:"PO",
    role:{es:"tienda",en:"shop",ru:"магазин"},
    theme:{bg:"#14213D",fg:"#FFFFFF",accent:"#D33A2C",onAccent:"#FFFFFF",bubble:"#FFFFFF",me:"#FCE3C2",chat:"#F2F0EA"},
    greet:{es:"¡Hola! Soy el asistente de Polka. Pregúntame si tenemos algo, qué es un producto o encarga y recoge sin colas.",
           en:"Hi! I'm Polka's assistant. Ask me if something's in stock, what a product is, or order ahead and skip the queue.",
           ru:"Здравствуйте! Я ассистент магазина «Полка». Подскажу, что есть в наличии, и отложу заказ, чтобы вы забрали без очереди."},
    tools:[
      {name:"check_stock",description:"Look up a product in the shop's stock. Use for any 'do you have…' question. Query in any language.",
       inputSchema:{type:"object",properties:{query:{type:"string"}},required:["query"]},
       async execute(a,ui){const r=find(a.query);ui.pill("· "+a.query+" → "+(r.length?r.map(p=>p[1]).join(", "):"—"));
         return r.length?{found:r.map(p=>({name_es:p[1],name_ru:p[2],origin:p[3],price_eur:p[4],stock:p[5]==="lo"?"low, a few left":p[5]==="fr"?"in stock, frozen":"in stock"}))}:{found:[],note:"Not in the list: offer to ask the owner, who orders weekly"};}},
      {name:"reserve_pickup",description:"Put an order aside for pickup. Needs a name, the items with quantity and a pickup day/time within opening hours.",
       inputSchema:{type:"object",properties:{name:{type:"string"},items:{type:"array",items:{type:"object",properties:{item:{type:"string"},qty:{type:"integer"}}}},date:{type:"string",description:"YYYY-MM-DD"},time:{type:"string",description:"HH:MM"}},required:["name","items","date","time"]},
       async execute(a,ui){const m=S.toMin(a.time),st=cal.status(a.date,m);if(st!=="free"&&st!=="full")return {ok:false,status:st,note:"Open Mon–Sat 10:00–20:30"};
         let total=0;const lines=(a.items||[]).map(x=>{const p=find(x.item)[0]||EXTRA.find(e=>norm(e[0]+" "+e[1]).includes(norm(x.item)))||null;const q=Math.max(1,+x.qty||1);const pr=p?(p.length>5?p[4]:p[2]):0;total+=pr*q;return {item:p?(p[1]||p[0]):x.item,qty:q,price_eur:pr};});
         const ref=S.ref("TR"),d=S.dateOf(a.date);
         ui.card(tr(ui.lang(),["Pedido apartado","Order put aside","Заказ отложен"])+" · "+ref,lines.map(x=>x.qty+"× "+x.item).join(", ")+" · "+total.toFixed(2).replace(".",",")+" € · "+S.nice(d,ui.lang())+" "+S.fmt(m)+" · "+a.name);
         return {ok:true,ref,total_eur:+total.toFixed(2),lines,pay:"in store, card, cash or Bizum",kept_until:"closing time the next day"};}}
    ],
    brief:()=>`You are the shop assistant of Polka Delicatessen, a Russian, Ukrainian, Armenian and Georgian grocery in the Raval, Barcelona (near Liceu, L3). It also sells books, magazines, frozen food and gift boxes.
Reply in the customer's language, 1–3 short sentences, friendly and practical, no markdown, at most one emoji. Spanish customers often don't know the products: explain in one plain line with a familiar comparison.
For any "do you have…" question call check_stock first; never claim stock from memory. If not found, say the owner orders weekly and offer to note the request. To put an order aside you need a name, items with quantities and a pickup day and time; call reserve_pickup and give the reference and total. Payment is in store. Never ask for phone or email. Write nothing before a tool call.
${S.calendar()}
Hours: Monday–Saturday 10:00–20:30, Sunday closed.
Gift boxes: Novy God €35 (red caviar, sprats, Alionka chocolate, mandarins, sparkling wine), Tea-time €25 (pryaniki, zefir, halva, condensed milk, tea), Yerevan €40 (Ararat brandy, lavash, basturma, sujuk, walnut sweets).`,
    demos:[
      {label:{es:"¿Tenéis tvorog?",en:"Do you have tvorog?",ru:"Есть творог?"},
       steps:l=>[{u:tr(l,["Hola, ¿tenéis tvorog?","Hi, do you have tvorog?","Здравствуйте, творог есть?"])},{tool:"check_stock",args:{query:"tvorog"}},
         {b:tr(l,["¡Sí! Tvorog ruso al 9%, 3,90 €. Es como un requesón más seco y ácido, perfecto para syrniki. ¿Te lo aparto?","Yes! Russian tvorog 9%, €3.90. It's like a drier, tangier cottage cheese, perfect for syrniki. Shall I put one aside?","Да! Творог 9%, 3,90 €. Отложить для вас?"])}]},
      {label:{es:"Encargar pelmeni para hoy",en:"Order pelmeni for pickup",ru:"Отложить пельмени и сметану"},
       steps:l=>{const d=S.nextDay(new Date().getDay()===6?1:(new Date().getDay()+1)%7),date=S.iso(d);let r={};return [
        {u:tr(l,["Quiero 2 kg de pelmeni y una smetana, paso mañana a las 18:00. Soy Carla","I'd like 2 kg of pelmeni and a smetana, I'll come tomorrow at 6pm. I'm Ben","Отложите 2 кг пельменей и сметану, заберу завтра в 18:00. Меня зовут Наталья"])},
        {tool:"check_stock",args:{query:"pelmeni"}},
        {tool:"reserve_pickup",args:{name:tr(l,["Carla","Ben","Наталья"]),items:[{item:"pelmeni",qty:2},{item:"smetana",qty:1}],date,time:"18:00"},after:x=>r=x},
        {b:()=>tr(l,[`¡Apartado, Carla! 2 kg de pelmeni y una smetana, ${r.total_eur.toFixed(2).replace(".",",")} €. Ref. ${r.ref}, lo pagas al recoger.`,`All set, Ben! 2 kg of pelmeni and a smetana, €${r.total_eur.toFixed(2)}. Ref ${r.ref}, pay when you collect.`,`Отложили, Наталья! 2 кг пельменей и сметана, ${r.total_eur.toFixed(2).replace(".",",")} €. Номер ${r.ref}, оплата при получении.`])}];}},
      {label:{es:"Regalo para Año Nuevo",en:"A New Year gift",ru:"Подарок на Новый год"},
       steps:l=>[{u:tr(l,["Busco un regalo de Año Nuevo para una amiga rusa","I'm looking for a New Year gift for a Russian friend","Ищу подарок на Новый год маме"])},
         {b:tr(l,["La Caja Novy God (35 €) es justo eso: caviar rojo, shprot, chocolate Alionka, mandarinas y champán soviético. Le va a recordar a casa 🎄 ¿Te la preparo?","The Novy God box (€35) is exactly that: red caviar, sprats, Alionka chocolate, mandarins and Soviet-style sparkling wine. It'll remind her of home 🎄 Shall I make one up?","Набор «Новогодний» за 35 €: красная икра, шпроты, «Алёнка», мандарины и шампанское 🎄 Собрать для вас?"])}]},
      {label:{es:"¿Qué es el kvas?",en:"What is kvass?",ru:"Есть Боржоми?"},
       steps:l=>l==="ru"?[{u:"Боржоми есть?"},{tool:"check_stock",args:{query:"боржоми"}},{b:"Есть, 1,95 € за бутылку. Отложить сколько нужно?"}]
        :[{u:tr(l,["¿Qué es el kvas?","What is kvass?",""])},{tool:"check_stock",args:{query:"kvas"}},
         {b:tr(l,["Una bebida de pan de centeno fermentado: suave, un poco dulce, casi sin alcohol, como una cerveza de malta. La botella de 1,5 l está a 2,50 €.","A drink made from fermented rye bread: light, a little sweet and almost alcohol-free, like a malt soda. The 1.5 l bottle is €2.50.",""])}]}
    ]
  };
})();
