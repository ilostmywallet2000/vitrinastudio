/* Shared calendar helpers for the assistants: opening hours, free-slot checks, dates. */
window.Slots=(function(){
  const pad=n=>String(n).padStart(2,"0");
  const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  const toMin=s=>{const m=/^(\d{1,2})[:.h]?(\d{2})?/.exec(String(s||"").trim());return m?(+m[1])*60+(+(m[2]||0)):NaN;};
  const fmt=m=>pad(Math.floor(m/60))+":"+pad(m%60);
  const dateOf=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||"").trim());return m?new Date(+m[1],+m[2]-1,+m[3],12):null;};
  const LOC={es:"es-ES",en:"en-GB",ru:"ru-RU"};
  const RU_ACC=["воскресенье","понедельник","вторник","среду","четверг","пятницу","субботу"];
  const weekday=(d,l)=>l==="ru"?RU_ACC[d.getDay()]:d.toLocaleDateString(LOC[l]||"en-GB",{weekday:"long"});
  const nice=(d,l)=>d.toLocaleDateString(LOC[l]||"en-GB",{weekday:"short",day:"numeric",month:"short"});
  const nextDay=(dow)=>{const d=new Date();d.setHours(12,0,0,0);for(let i=1;i<9;i++){const x=new Date(d);x.setDate(d.getDate()+i);if(x.getDay()===dow)return x;}return d;};
  function calendar(){const now=new Date(),out=[];for(let i=0;i<14;i++){const d=new Date(now);d.setDate(now.getDate()+i);out.push(iso(d)+" "+weekday(d,"en")+(i===0?" (today)":i===1?" (tomorrow)":""));}
    return "Current local time "+pad(now.getHours())+":"+pad(now.getMinutes())+". Next 14 days: "+out.join(", ")+".";}
  /* hours: {dow:[[startMin,endMin],...]}, lastStart: minutes before close that the last slot may start,
     busy(date,min) -> true when taken (deterministic so demos repeat), taken: [{date,min}] */
  function make(hours,{lastStart=60,step=30,busy=()=>false}={}){
    const taken=[];
    function status(date,min){
      const d=dateOf(date);if(!d||isNaN(min))return "invalid";
      const now=new Date(),today=dateOf(iso(now));
      if(d<today)return "past";if((d-today)/864e5>60)return "too_far";
      const w=hours[d.getDay()]||[];if(!w.length)return "closed_day";
      if(!w.some(([s,e])=>min>=s&&min<=e-lastStart))return "outside_hours";
      if(iso(d)===iso(now)&&min<now.getHours()*60+now.getMinutes()+30)return "past";
      if(busy(date,min,d)||taken.some(t=>t.date===date&&t.min===min))return "full";
      return "free";
    }
    function alternatives(date,min){const d=dateOf(date);if(!d)return[];const out=[];
      for(const [s,e] of hours[d.getDay()]||[])for(let m=s;m<=e-lastStart;m+=step)if(status(date,m)==="free")out.push(m);
      return out.sort((a,b)=>Math.abs(a-min)-Math.abs(b-min)).slice(0,3).sort((a,b)=>a-b).map(fmt);}
    function nearestFree(date,want){return status(date,want)==="free"?want:(alternatives(date,want).map(toMin)[0]??want);}
    return {status,alternatives,nearestFree,take:(date,min)=>taken.push({date,min})};
  }
  const hash=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%997;return h;};
  const ref=p=>p+"-"+(1000+Math.floor(Math.random()*9000));
  return {pad,iso,toMin,fmt,dateOf,weekday,nice,nextDay,calendar,make,hash,ref};
})();
