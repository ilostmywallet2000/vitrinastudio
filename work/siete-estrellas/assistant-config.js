/* Las 7 Estrellas: banquet manager. Their money is in celebrations, so the assistant quotes
   set menus on the spot and hands a warm lead (date, headcount, menu, total) to the manager. */
(function(){
  const S=Slots;
  const day=[[780,990],[1200,1440]];
  const H={0:day,1:day,2:day,3:day,4:day,5:day,6:day};
  const cal=S.make(H,{lastStart:75,busy:(date,min,d)=>d.getDay()===6&&min>=1260&&min<=1320||S.hash(date+min)%8===0});
  const MENUS={classic:39,festive:55,grand:75};
  const L={es:0,en:1,ru:2,ca:3},tr=(l,a)=>a[L[l]];
  window.ASSISTANT={
    name:"Las 7 Estrellas",initials:"7",
    role:{es:"reservas y banquetes",en:"tables and banquets",ru:"брони и банкеты",ca:"reserves i banquets"},
    theme:{bg:"#15111F",fg:"#F4EEE3",accent:"#E8553E",onAccent:"#FFFFFF",bubble:"#FFFFFF",me:"#F6D9C9",chat:"#EFEAF2"},
    greet:{es:"¡Hola! Bienvenido a Las 7 Estrellas ✨ Reservo mesas y preparo banquetes: dime cuántos sois y qué celebráis.",en:"Hello and welcome to Las 7 Estrellas ✨ I book tables and plan banquets. Tell me how many you are and what you're celebrating.",ru:"Здравствуйте! Добро пожаловать в «7 звёзд» ✨ Бронирую столы и организую банкеты. Сколько вас и что празднуем?",ca:"Hola! Benvingut a Las 7 Estrellas ✨ Reservo taules i preparo banquets: digues-me quants sou i què celebreu."},
    tools:[
      {name:"check_table",description:"Check a free table for up to 9 people. Call before offering any time.",
       inputSchema:{type:"object",properties:{date:{type:"string"},time:{type:"string"},people:{type:"integer"}},required:["date","time","people"]},
       async execute(a,ui){const m=S.toMin(a.time),p=+a.people||2,st=p>=10?"banquet":cal.status(a.date,m),d=S.dateOf(a.date);
         ui.pill("· "+(d?S.nice(d,ui.lang()):a.date)+" · "+(isNaN(m)?a.time:S.fmt(m))+" · "+p+" → "+st);
         return {status:st,available:st==="free",alternatives_same_day:st==="free"?[]:cal.alternatives(a.date,m)};}},
      {name:"book_table",description:"Book a regular table once the guest agreed to a free slot and gave a name.",
       inputSchema:{type:"object",properties:{name:{type:"string"},date:{type:"string"},time:{type:"string"},people:{type:"integer"}},required:["name","date","time","people"]},
       async execute(a,ui){const m=S.toMin(a.time),st=cal.status(a.date,m);if(st!=="free")return {ok:false,status:st,alternatives_same_day:cal.alternatives(a.date,m)};
         cal.take(a.date,m);const ref=S.ref("7M");ui.card(tr(ui.lang(),["Mesa reservada","Table booked","Стол забронирован","Taula reservada"])+" · "+ref,S.nice(S.dateOf(a.date),ui.lang())+" · "+S.fmt(m)+" · "+a.people+" · "+a.name);
         return {ok:true,ref};}},
      {name:"quote_banquet",description:"Price a banquet for 10 to 80 guests. menu is classic (€39), festive (€55) or grand (€75, includes exclusive room and 3h open bar).",
       inputSchema:{type:"object",properties:{people:{type:"integer"},menu:{type:"string",enum:["classic","festive","grand"]}},required:["people","menu"]},
       async execute(a,ui){const p=Math.max(10,Math.min(80,+a.people||10)),per=MENUS[a.menu]||55,total=p*per,deposit=Math.round(total*.2);
         ui.pill("· "+p+" × "+per+" € = "+total.toLocaleString("es-ES")+" €");
         return {people:p,menu:a.menu,per_person:per,total_eur:total,deposit_eur:deposit,deposit_rule:"20% to hold the date, rest on the day",grand_requires_min:a.menu==="grand"?40:undefined};}},
      {name:"banquet_request",description:"Send the banquet to the manager once you have name, date, headcount and menu.",
       inputSchema:{type:"object",properties:{name:{type:"string"},date:{type:"string"},people:{type:"integer"},menu:{type:"string"},occasion:{type:"string"},total_eur:{type:"number"}},required:["name","people","menu"]},
       async execute(a,ui){ui.card(tr(ui.lang(),["Banquete para confirmar","Banquet to confirm","Банкет на подтверждение","Banquet per confirmar"]),a.name+" · "+a.people+" · "+a.menu+(a.total_eur?" · "+a.total_eur.toLocaleString("es-ES")+" €":"")+(a.date?" · "+a.date:""));
         return {ok:true,follow_up:"The manager calls within 24 hours to confirm and send the deposit link"};}}
    ],
    brief:()=>`You are the reservations and banquet assistant of Las 7 Estrellas, a Russian restaurant at the Eixample, Barcelona. Known for an upside-down Eiffel Tower hanging from the ceiling, Russian food plus a few Spanish classics.
Reply in the guest's language, 1–3 short sentences, festive and warm, no markdown, at most one emoji.
Regular tables (up to 9): call check_table, then book_table with a name. From 10 guests it's a banquet: suggest the best-fitting menu, call quote_banquet to give the exact total and 20% deposit, then collect name, date and occasion and call banquet_request. Grand banquet needs at least 40 guests. Never ask for phone or email. Write nothing before a tool call.
${S.calendar()}
Hours: every day 13:00–16:30 and 20:00–00:00.
Signature dishes: borsch €8, pelmeni €12, shashlik €17, chicken Kiev €16, golubtsy €14, blini with red caviar €15, Napoleon cake €6.50.
Banquet menus: Classic €39 (6 zakuski, choice of main, dessert and tea), Festive €55 (10 zakuski, red caviar, shashlik for the table, Napoleon and house vodka), Grand €75 (exclusive room, full menu, 3-hour open bar, celebration cake; 40–80 guests).`,
    demos:[
      {label:{es:"Boda de 45 personas en junio",en:"Wedding for 45 in June",ru:"Свадьба на 45 человек в июне",ca:"Casament de 45 persones al juny"},
       steps:l=>{let q={};return [
        {u:tr(l,["Hola, queremos celebrar nuestra boda con 45 invitados en junio. ¿Qué opciones hay?","Hi, we'd like to hold our wedding dinner for 45 guests in June. What are the options?","Здравствуйте, хотим отметить свадьбу, 45 гостей, в июне. Какие есть варианты?","Hola, volem celebrar el nostre casament amb 45 convidats al juny. Quines opcions hi ha?"])},
        {tool:"quote_banquet",args:{people:45,menu:"grand"},after:r=>q=r},
        {b:()=>tr(l,[`¡Enhorabuena! 💍 Para 45 os encaja el Gran banquete: sala en exclusiva, menú completo, barra libre 3 h y tarta. Son 75 € por persona, ${q.total_eur.toLocaleString("es-ES")} € en total, y se reserva la fecha con un 20% (${q.deposit_eur.toLocaleString("es-ES")} €). ¿Qué día y a qué nombre?`,
                      `Congratulations! 💍 For 45 guests the Grand banquet fits best: the room to yourselves, full menu, 3-hour open bar and cake. It's €75 per person, €${q.total_eur.toLocaleString("en-GB")} in total, and 20% (€${q.deposit_eur.toLocaleString("en-GB")}) holds the date. Which day, and whose name?`,
                      `Поздравляем! 💍 Для 45 гостей лучше всего «Большой банкет»: зал только для вас, полное меню, бар 3 часа и торт. 75 € с человека, всего ${q.total_eur.toLocaleString("ru-RU")} €, дату держим с предоплатой 20% (${q.deposit_eur.toLocaleString("ru-RU")} €). Какой день и на чьё имя?`,`Enhorabona! 💍 Per a 45 us encaixa el Gran banquet: sala en exclusiva, menú complet, barra lliure 3 h i pastís. Són 75 € per persona, ${q.total_eur.toLocaleString("ca-ES")} € en total, i la data es reserva amb un 20 % (${q.deposit_eur.toLocaleString("ca-ES")} €). Quin dia i a quin nom?`])},
        {u:tr(l,["Sábado 13 de junio, a nombre de Laura y Pau","Saturday 13 June, under Emma and Josh","Суббота, 13 июня, на имя Дарья и Максим","Dissabte 13 de juny, a nom de la Laura i en Pau"])},
        {tool:"banquet_request",args:{name:tr(l,["Laura y Pau","Emma & Josh","Дарья и Максим","Laura i Pau"]),date:"13/06",people:45,menu:"grand",occasion:tr(l,["boda","wedding","свадьба","casament"]),total_eur:3375}},
        {b:tr(l,["Apuntado, Laura y Pau. El encargado os llama en menos de 24 h para confirmar y enviaros el enlace de la señal. ¡Qué ilusión!","Done, Emma and Josh. Our manager will call within 24 hours to confirm and send the deposit link. Can't wait!","Записала, Дарья и Максим. Менеджер позвонит в течение 24 часов, подтвердит дату и пришлёт ссылку на предоплату. Ждём вас!","Apuntat, Laura i Pau. L'encarregat us truca en menys de 24 h per confirmar-ho i enviar-vos l'enllaç de la paga i senyal. Quina il·lusió!"])}];}},
      {label:{es:"Mesa para 4 el sábado",en:"Table for 4 on Saturday",ru:"Стол на 4 в субботу",ca:"Taula per a 4 dissabte"},
       steps:l=>{const d=S.nextDay(6),date=S.iso(d),m=cal.nearestFree(date,1290),t=S.fmt(m),dd=S.weekday(d,l);let ref="";return [
        {u:tr(l,["Mesa para 4 el sábado sobre las 21:30","Table for 4 on Saturday around 9:30pm","Стол на четверых в субботу около 21:30","Taula per a 4 dissabte cap a les 21:30"])},
        {tool:"check_table",args:{date,time:"21:30",people:4}},
        {b:()=>m===1290?tr(l,[`¡Hay sitio! El ${dd} a las 21:30 para 4. ¿A qué nombre?`,`We have room! ${dd} at 21:30 for 4. What name?`,`Есть место! В ${dd} в 21:30 на четверых. На какое имя?`,`Hi ha lloc! El ${dd} a les 21:30 per a 4. A quin nom?`]):tr(l,[`El ${dd} a las 21:30 estamos llenos, pero a las ${t} tengo mesa para 4. ¿Os va bien? ¿A qué nombre?`,`${dd} at 21:30 is full, but I have a table for 4 at ${t}. Does that work? What name?`,`В ${dd} на 21:30 всё занято, но есть стол на четверых в ${t}. Подойдёт? На какое имя?`,`El ${dd} a les 21:30 som plens, però a les ${t} tinc taula per a 4. Us va bé? A quin nom?`])},
        {u:tr(l,["Perfecto, Andrés","Great, it's Sophie","Отлично, Сергей","Perfecte, Andreu"])},
        {tool:"book_table",args:{name:tr(l,["Andrés","Sophie","Сергей","Andreu"]),date,time:t,people:4},after:r=>ref=r.ref},
        {b:()=>tr(l,[`Reservado, Andrés: ${dd} a las ${t}, 4 personas, ref. ${ref}. ¡Os esperamos bajo la torre! 🗼`,`Booked, Sophie: ${dd} at ${t}, 4 people, ref ${ref}. See you under the tower! 🗼`,`Забронировано, Сергей: ${dd}, ${t}, 4 гостя, номер ${ref}. Ждём вас под башней! 🗼`,`Reservat, Andreu: ${dd} a les ${t}, 4 persones, ref. ${ref}. Us esperem sota la torre! 🗼`])}];}},
      {label:{es:"¿Qué es la kotleta po-kievski?",en:"What is chicken Kiev?",ru:"Что заказать к водке?",ca:"Què és la kotleta po-kievski?"},
       steps:l=>[{u:tr(l,["¿Qué es la kotleta po-kievski?","What exactly is chicken Kiev?","Что посоветуете под водку?","Què és la kotleta po-kievski?"])},
         {b:tr(l,["Es una pechuga de pollo empanada con mantequilla de hierbas dentro: al cortarla se derrite, así que ¡cuidado! 16 €, y va genial con puré.","It's breaded chicken breast with herb butter inside that melts out when you cut it, so careful! €16, and great with mash.","Классика: соленья, сельдь, блины с икрой (15 €) и, конечно, пельмени (12 €). А на горячее — шашлык с аджикой (17 €).","És un pit de pollastre arrebossat amb mantega d'herbes a dins: en tallar-lo es fon, així que compte! 16 €, i va de meravella amb puré."])}]},
      {label:{es:"Cumpleaños de 25 personas",en:"Birthday for 25 people",ru:"День рождения, 25 человек",ca:"Aniversari de 25 persones"},
       steps:l=>{let q={};return [{u:tr(l,["Cumpleaños de 25 personas, ¿cuánto sale?","Birthday for 25 people, how much would it be?","День рождения на 25 человек, сколько выйдет?","Aniversari de 25 persones, quant surt?"])},
         {tool:"quote_banquet",args:{people:25,menu:"festive"},after:r=>q=r},
         {b:()=>tr(l,[`Con el menú Festivo (10 zakuski, caviar rojo, shashlik, Napoleón y vodka) son 55 € por persona: ${q.total_eur.toLocaleString("es-ES")} € para 25 🎂 ¿Qué día lo celebráis?`,`With the Festive menu (10 zakuski, red caviar, shashlik, Napoleon and vodka) it's €55 per person: €${q.total_eur.toLocaleString("en-GB")} for 25 🎂 Which day are you celebrating?`,`С праздничным меню (10 закусок, икра, шашлык, «Наполеон» и водка) — 55 € с человека, ${q.total_eur.toLocaleString("ru-RU")} € на 25 гостей 🎂 На какой день?`,`Amb el menú Festiu (10 zakuski, caviar vermell, shashlik, Napoleó i vodka) són 55 € per persona: ${q.total_eur.toLocaleString("ca-ES")} € per a 25 🎂 Quin dia ho celebreu?`])}];}}
    ]
  };
})();
