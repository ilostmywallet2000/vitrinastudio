/* Tono: booking concierge. A salon loses hours to "how much / how long / any slot Thursday?"
   on the phone. The assistant knows each service's duration, books slots that fit, and sends
   big colour changes to a consultation instead of promising results. */
(function(){
  const S=Slots;
  const H={2:[[600,1200]],3:[[600,1200]],4:[[600,1200]],5:[[600,1200]],6:[[540,900]],0:[],1:[]};
  const DUR={root:90,balayage:180,highlights:150,toner:45,womens_cut:60,mens_cut:40,kids_cut:30,curly_cut:75,updo:60,makeup:60,bridal:240};
  const PRICE={root:55,balayage:140,highlights:110,toner:40,womens_cut:45,mens_cut:25,kids_cut:18,curly_cut:55,updo:60,makeup:65,bridal:320};
  const booked=[];
  const L={es:0,en:1,ru:2,ca:3},tr=(l,a)=>a[L[l]];
  function fits(date,start,dur){const d=S.dateOf(date);if(!d||isNaN(start))return "invalid";const w=H[d.getDay()]||[];if(!w.length)return "closed_day";
    if(!w.some(([s,e])=>start>=s&&start+dur<=e))return "outside_hours";
    const now=new Date();if(d<S.dateOf(S.iso(now)))return "past";
    if(S.hash(date+start)%5===0||booked.some(b=>b.date===date&&start<b.start+b.dur&&b.start<start+dur))return "taken";return "free";}
  function alts(date,want,dur){const d=S.dateOf(date);const out=[];for(const [s,e] of H[d?.getDay()]||[])for(let m=s;m+dur<=e;m+=30)if(fits(date,m,dur)==="free")out.push(m);
    return out.sort((a,b)=>Math.abs(a-want)-Math.abs(b-want)).slice(0,3).sort((a,b)=>a-b).map(S.fmt);}
  const nearest=(date,want,dur)=>fits(date,want,dur)==="free"?want:S.toMin(alts(date,want,dur)[0]||S.fmt(want));
  window.ASSISTANT={
    name:"Tono Atelier",initials:"TO",
    role:{es:"citas",en:"appointments",ru:"запись",ca:"cites"},
    theme:{bg:"#0F0F0F",fg:"#F4F2EE",accent:"#B5562B",onAccent:"#FFFFFF",bubble:"#FFFFFF",me:"#EADFD6",chat:"#F4F2EE"},
    greet:{es:"Hola, soy el asistente de Tono. Te digo precios y tiempos, y te busco cita. ¿Qué te quieres hacer?",en:"Hi, I'm Tono's assistant. I can tell you prices and timings and find you an appointment. What would you like done?",ru:"Здравствуйте! Я ассистент салона Tono. Подскажу цены и длительность и запишу вас. Что хотите сделать?",ca:"Hola, soc l'assistent de Tono. Et dic preus i temps, i et busco cita. Què et vols fer?"},
    tools:[
      {name:"check_slot",description:"Check if a service fits at a given date and time. service is one of: "+Object.keys(DUR).join(", "),
       inputSchema:{type:"object",properties:{service:{type:"string",enum:Object.keys(DUR)},date:{type:"string"},time:{type:"string"}},required:["service","date","time"]},
       async execute(a,ui){const dur=DUR[a.service]||60,m=S.toMin(a.time),st=fits(a.date,m,dur),d=S.dateOf(a.date);
         ui.pill("· "+a.service+" "+dur+" min · "+(d?S.nice(d,ui.lang()):a.date)+" "+(isNaN(m)?a.time:S.fmt(m))+" → "+st);
         return {status:st,available:st==="free",duration_min:dur,price_from_eur:PRICE[a.service],alternatives_same_day:st==="free"?[]:alts(a.date,m,dur)};}},
      {name:"book_appointment",description:"Book once the client agreed to a free slot and gave a name.",
       inputSchema:{type:"object",properties:{name:{type:"string"},service:{type:"string",enum:Object.keys(DUR)},date:{type:"string"},time:{type:"string"},notes:{type:"string"}},required:["name","service","date","time"]},
       async execute(a,ui){const dur=DUR[a.service]||60,m=S.toMin(a.time);if(fits(a.date,m,dur)!=="free")return {ok:false,alternatives_same_day:alts(a.date,m,dur)};
         booked.push({date:a.date,start:m,dur});const ref=S.ref("SK");
         ui.card(tr(ui.lang(),["Cita confirmada","Appointment booked","Запись подтверждена","Cita confirmada"])+" · "+ref,S.nice(S.dateOf(a.date),ui.lang())+" · "+S.fmt(m)+"–"+S.fmt(m+dur)+" · "+a.service+" · "+a.name);
         return {ok:true,ref,ends:S.fmt(m+dur),reminder:"WhatsApp reminder 24 h before; rebooking nudge after 6 weeks"};}},
      {name:"colour_consult",description:"Request a free 15-minute colour consultation for big changes (dark to blonde, colour removal, bridal). Needs a name, current and wanted colour.",
       inputSchema:{type:"object",properties:{name:{type:"string"},current:{type:"string"},wanted:{type:"string"}},required:["name","current","wanted"]},
       async execute(a,ui){ui.card(tr(ui.lang(),["Consulta de color","Colour consultation","Консультация по цвету","Consulta de color"]),a.name+" · "+a.current+" → "+a.wanted);
         return {ok:true,next:"The colourist replies on WhatsApp within the day and asks for a photo in daylight"};}}
    ],
    brief:()=>`You are the booking assistant of Tono Atelier, a colour-focused hair studio in the Eixample, Barcelona, open since 2016, known for colour, bespoke cuts and event make-up. The team speaks Spanish, Russian and English.
Reply in the client's language, 1–3 short sentences, calm and stylish, no markdown, at most one emoji.
Services (duration, starting price): root colour 1h30 €55, balayage 3h €140, fine highlights 2h30 €110, toner and gloss 45min €40, women's cut and blow-dry 1h €45, men's cut 40min €25, children's cut 30min €18, curly dry cut 1h15 €55, updo 1h €60, event make-up 1h €65, bridal trial + day €320. Prices depend on length and thickness.
Always call check_slot before offering a time, then book_appointment with a name. Big changes (dark to blonde, removing box dye, bridal) can't be promised in one session: suggest colour_consult. Never ask for phone or email. Write nothing before a tool call.
${S.calendar()}
Hours: Tue–Fri 10:00–20:00, Sat 9:00–15:00, Sun and Mon closed.`,
    demos:[
      {label:{es:"Balayage el jueves por la tarde",en:"Balayage on Thursday afternoon",ru:"Балаяж в четверг после обеда",ca:"Balayage dijous a la tarda"},
       steps:l=>{const d=S.nextDay(4),date=S.iso(d),m=nearest(date,960,180),t=S.fmt(m),day=S.weekday(d,l);let r={};return [
        {u:tr(l,["¿Tenéis hueco para un balayage el jueves por la tarde?","Any space for a balayage on Thursday afternoon?","Можно на балаяж в четверг после обеда?","Teniu forat per a un balayage dijous a la tarda?"])},
        {tool:"check_slot",args:{service:"balayage",date,time:"16:00"}},
        {b:()=>m===960?tr(l,[`Sí: el ${day} a las 16:00, son unas 3 horas y desde 140 €. ¿A qué nombre?`,`Yes: ${day} at 16:00. It takes about 3 hours, from €140. What name?`,`Да: в ${day} в 16:00, около 3 часов, от 140 €. На какое имя?`,`Sí: el ${day} a les 16:00, són unes 3 hores i des de 140 €. A quin nom?`])
                        :tr(l,[`A las 16:00 no cabe, pero el ${day} a las ${t} sí (unas 3 h, desde 140 €). ¿Te va bien? ¿A qué nombre?`,`16:00 won't fit, but ${day} at ${t} does (about 3 h, from €140). Does that work? What name?`,`В 16:00 не помещается, но в ${day} в ${t} можно (около 3 ч, от 140 €). Подойдёт? На какое имя?`,`A les 16:00 no hi cap, però el ${day} a les ${t} sí (unes 3 h, des de 140 €). Et va bé? A quin nom?`])},
        {u:tr(l,["Perfecto, Núria","Perfect, it's Hannah","Отлично, Екатерина","Perfecte, Núria"])},
        {tool:"book_appointment",args:{name:tr(l,["Núria","Hannah","Екатерина","Núria"]),service:"balayage",date,time:t},after:x=>r=x},
        {b:()=>tr(l,[`Listo, Núria: balayage el ${day} de ${t} a ${r.ends}. Te escribimos un recordatorio el día antes ✨`,`Done, Hannah: balayage on ${day}, ${t} to ${r.ends}. We'll send a reminder the day before ✨`,`Готово, Екатерина: балаяж в ${day} с ${t} до ${r.ends}. Напомним за день ✨`,`Llest, Núria: balayage el ${day} de ${t} a ${r.ends}. T'escriurem un recordatori el dia abans ✨`])}];}},
      {label:{es:"¿Cuánto cuesta un corte de hombre?",en:"How much is a men's cut?",ru:"Сколько стоит мужская стрижка?",ca:"Quant costa un tall d'home?"},
       steps:l=>[{u:tr(l,["¿Cuánto cuesta un corte de hombre?","How much is a men's cut?","Сколько стоит мужская стрижка?","Quant costa un tall d'home?"])},
         {b:tr(l,["25 €, unos 40 minutos. ¿Quieres que te busque hueco esta semana?","€25 and about 40 minutes. Want me to find you a slot this week?","25 €, около 40 минут. Подобрать время на этой неделе?","25 €, uns 40 minuts. Vols que et busqui forat aquesta setmana?"])}]},
      {label:{es:"De moreno a rubio, ¿se puede?",en:"Dark to blonde, possible?",ru:"Из брюнетки в блонд?",ca:"De morena a rossa, es pot?"},
       steps:l=>[{u:tr(l,["Tengo el pelo negro teñido y quiero rubio ceniza. ¿Se puede en un día?","My hair is dyed black and I want ash blonde. Can it be done in one day?","У меня волосы окрашены в чёрный, хочу пепельный блонд. Можно за один раз?","Tinc els cabells negres tenyits i vull ros cendra. Es pot fer en un dia?"])},
         {b:tr(l,["Con tinte negro encima, lo honesto es hacerlo en 2 sesiones para no romper el pelo. Te propongo una consulta gratis de 15 min con nuestro equipo de color. ¿Tu nombre?","Over black box dye, the honest answer is 2 sessions so your hair stays healthy. Let me set up a free 15-minute consultation with our colourist. Your name?","Если волосы окрашены в чёрный, честно — нужно 2 сеанса, чтобы не испортить волосы. Предлагаю бесплатную консультацию колориста на 15 минут. Как вас зовут?","Amb tint negre a sobre, el més honest és fer-ho en 2 sessions per no trencar els cabells. Et proposo una consulta gratuïta de 15 min amb el nostre equip de color. El teu nom?"])},
         {u:tr(l,["Marina","Lucy","Алина","Marina"])},
         {tool:"colour_consult",args:{name:tr(l,["Marina","Lucy","Алина","Marina"]),current:tr(l,["negro teñido","black box dye","чёрный, окрашенный","negre tenyit"]),wanted:tr(l,["rubio ceniza","ash blonde","пепельный блонд","ros cendra"])}},
         {b:tr(l,["Hecho, Marina. Nuestro equipo de color te escribe hoy por WhatsApp y te pedirá una foto con luz natural.","Done, Lucy. The colourist will message you on WhatsApp today and ask for a photo in daylight.","Готово, Алина. Колорист напишет вам в WhatsApp сегодня и попросит фото при дневном свете.","Fet, Marina. El nostre equip de color t'escriu avui per WhatsApp i et demanarà una foto amb llum natural."])}]},
      {label:{es:"Novia en junio",en:"Bride in June",ru:"Свадебная причёска",ca:"Núvia al juny"},
       steps:l=>[{u:tr(l,["Me caso en junio, ¿hacéis peinado y maquillaje?","I'm getting married in June, do you do hair and make-up?","У меня свадьба в июне, делаете причёску и макияж?","Em caso al juny, feu pentinat i maquillatge?"])},
         {b:tr(l,["¡Enhorabuena! El paquete novia incluye prueba y el día (peinado + maquillaje), desde 320 €. Lo ideal es la prueba 4–6 semanas antes. ¿Te reservo una consulta para verlo juntas?","Congratulations! The bridal package covers a trial and the day itself (hair and make-up), from €320. The trial is best 4–6 weeks before. Shall I book a consultation to plan it?","Поздравляем! Свадебный пакет: репетиция и сам день (причёска + макияж), от 320 €. Репетицию лучше за 4–6 недель. Записать на консультацию?","Enhorabona! El paquet núvia inclou la prova i el dia (pentinat + maquillatge), des de 320 €. L'ideal és fer la prova 4–6 setmanes abans. Et reservo una consulta per veure-ho juntes?"])}]}
    ]
  };
})();
