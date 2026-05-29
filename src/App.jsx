import { useState, useMemo, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://sawyhyylryjwglkggpjz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhd3loeXlscnlqd2dsa2dncGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODE5NjAsImV4cCI6MjA5MjY1Nzk2MH0.rRHDUP75KxqSI93JiJxuwAcyJyAiCd5oxNTE-SUzf6M"
);


function calcVDOT(distM, timeSec) {
  const v = distM / (timeSec / 60);
  const pct = 0.8 + 0.1894393*Math.exp(-0.012778*(timeSec/60)) + 0.2989558*Math.exp(-0.1932605*(timeSec/60));
  return Math.round(((-4.6 + 0.182258*v + 0.000104*v*v)/pct)*10)/10;
}
function getTP(vdot) {
  const vMax = 29.54 + 5.000663*vdot - 0.007546*vdot*vdot;
  const spk = (p) => Math.round(60000/(vMax*p));
  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  return { easy:`${fmt(spk(0.65))}〜${fmt(spk(0.74))}`, marathon:fmt(spk(0.82)), threshold:fmt(spk(0.85)), interval:fmt(spk(0.975)), rep:fmt(spk(1.1)) };
}
const CATS = [
  {id:"m_elem4",l:"小4男子",s:"小4男",c:"#7dd3fc",g:"小学生（男子）"},{id:"m_elem5",l:"小5男子",s:"小5男",c:"#7dd3fc",g:"小学生（男子）"},{id:"m_elem6",l:"小6男子",s:"小6男",c:"#7dd3fc",g:"小学生（男子）"},
  {id:"m_jhs1",l:"中1男子",s:"中1男",c:"#7dd3fc",g:"中学生（男子）"},{id:"m_jhs2",l:"中2男子",s:"中2男",c:"#7dd3fc",g:"中学生（男子）"},{id:"m_jhs3",l:"中3男子",s:"中3男",c:"#7dd3fc",g:"中学生（男子）"},
  {id:"m_hs",l:"高校男子",s:"高校男",c:"#2563eb",g:"高校生（男子）"},{id:"m_univ",l:"大学男子",s:"大学男",c:"#2563eb",g:"大学生（男子）"},
  {id:"m_20s",l:"20代男子",s:"20代男",c:"#2563eb",g:"マスターズ（男子）"},{id:"m_30s",l:"30代男子",s:"30代男",c:"#2563eb",g:"マスターズ（男子）"},{id:"m_40s",l:"40代男子",s:"40代男",c:"#2563eb",g:"マスターズ（男子）"},{id:"m_50s",l:"50代男子",s:"50代男",c:"#2563eb",g:"マスターズ（男子）"},{id:"m_60s",l:"60代男子",s:"60代男",c:"#2563eb",g:"マスターズ（男子）"},{id:"m_70s",l:"70代以上男子",s:"70代以上男",c:"#2563eb",g:"マスターズ（男子）"},
  {id:"f_elem4",l:"小4女子",s:"小4女",c:"#f9a8d4",g:"小学生（女子）"},{id:"f_elem5",l:"小5女子",s:"小5女",c:"#f9a8d4",g:"小学生（女子）"},{id:"f_elem6",l:"小6女子",s:"小6女",c:"#f9a8d4",g:"小学生（女子）"},
  {id:"f_jhs1",l:"中1女子",s:"中1女",c:"#f9a8d4",g:"中学生（女子）"},{id:"f_jhs2",l:"中2女子",s:"中2女",c:"#f9a8d4",g:"中学生（女子）"},{id:"f_jhs3",l:"中3女子",s:"中3女",c:"#f9a8d4",g:"中学生（女子）"},
  {id:"f_hs",l:"高校女子",s:"高校女",c:"#dc2626",g:"高校生（女子）"},{id:"f_univ",l:"大学女子",s:"大学女",c:"#dc2626",g:"大学生（女子）"},
  {id:"f_20s",l:"20代女子",s:"20代女",c:"#dc2626",g:"マスターズ（女子）"},{id:"f_30s",l:"30代女子",s:"30代女",c:"#dc2626",g:"マスターズ（女子）"},{id:"f_40s",l:"40代女子",s:"40代女",c:"#dc2626",g:"マスターズ（女子）"},{id:"f_50s",l:"50代女子",s:"50代女",c:"#dc2626",g:"マスターズ（女子）"},{id:"f_60s",l:"60代女子",s:"60代女",c:"#dc2626",g:"マスターズ（女子）"},{id:"f_70s",l:"70代以上女子",s:"70代以上女",c:"#dc2626",g:"マスターズ（女子）"},
];
const CMAP = Object.fromEntries(CATS.map(c=>[c.id,c]));
const CGROUPS = ["小学生（男子）","中学生（男子）","高校生（男子）","大学生（男子）","マスターズ（男子）","小学生（女子）","中学生（女子）","高校生（女子）","大学生（女子）","マスターズ（女子）"];
const DIST = {"1000m":1000,"1500m":1500,"2000m":2000,"3000m":3000,"5000m":5000,"10000m":10000,"ハーフマラソン":21097.5,"マラソン":42195};
const DK = Object.keys(DIST);
const cs2sec = (cs) => cs/100;
const tocs = (h,m,s,cs) => (parseInt(h||0)*3600+parseInt(m||0)*60+parseInt(s||0))*100+parseInt(cs||0);
const fmtT = (cs) => {
  const tot=Math.floor(cs/100),h=Math.floor(tot/3600),m=Math.floor((tot%3600)/60),s=tot%60,c=cs%100;
  // 1時間以上 (マラソン・ハーフマラソンなど) は 1/100秒を省略
  if(h>0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  const ss=`${String(s).padStart(2,"0")}.${String(c).padStart(2,"0")}`;
  return `${m}:${ss}`;
};
const fmtD = (iso) => { const d=new Date(iso); return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`; };
const uid = () => Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().slice(0,10);
const vc = (v) => { if(v>=65)return"#ef4444"; if(v>=55)return"#f97316"; if(v>=45)return"#f59e0b"; if(v>=35)return"#22c55e"; return"#3b82f6"; };
const vrl = (v) => { if(v>=75)return"エリート"; if(v>=65)return"上級"; if(v>=55)return"中上級"; if(v>=45)return"中級"; if(v>=35)return"初中級"; return"ビギナー"; };
// ランキングのタイ判定: 配列とindex、比較用キー(時間/VDOT等)を渡すと、同値なら前と同じ順位を返す
const getRank = (arr,i,getKey) => {
  if(i===0)return 1;
  const cur=getKey(arr[i]),prev=getKey(arr[i-1]);
  if(cur===prev){
    let j=i-1;
    while(j>0&&getKey(arr[j])===getKey(arr[j-1]))j--;
    return getRank(arr,j,getKey);
  }
  return i+1;
};
// メダル付きランク表示用
const rankDisplay = (rank) => {
  if(rank===1)return{medal:"🥇",isMedal:true};
  if(rank===2)return{medal:"🥈",isMedal:true};
  if(rank===3)return{medal:"🥉",isMedal:true};
  return{medal:String(rank),isMedal:false};
};
const ADMIN_PIN = "4433";

const mkT=(dist,h,m,s,date,cat,evt_no,evt_name)=>{ const time=tocs(h,m,s,0); return{id:uid(),distance:dist,time,date,vdot:calcVDOT(DIST[dist],cs2sec(time)),category:cat||"m_elem4",event_no:evt_no||null,event_name:evt_name||(evt_no?`第${evt_no}回TT`:null)}; };
const SEED=[
  {id:1,name:"田中 健",category:"m_30s",official:true,trials:[mkT("マラソン",3,12,0,"2023-04-15","m_30s",null,"東京マラソン2023"),mkT("マラソン",2,58,0,"2024-11-03","m_30s",null,"東京マラソン2024")]},
  {id:2,name:"佐藤 美咲",category:"f_20s",official:true,trials:[mkT("ハーフマラソン",1,35,0,"2023-09-17","f_20s",null,"湘南国際マラソン"),mkT("ハーフマラソン",1,28,30,"2024-10-14","f_20s",5)]},
  {id:3,name:"鈴木 拓也",category:"m_hs",official:true,trials:[mkT("5000m",0,19,30,"2023-05-20","m_hs",3),mkT("5000m",0,17,45,"2024-09-08","m_hs",null,"県高校総体")]},
  {id:4,name:"山田 花子",category:"f_40s",official:true,trials:[mkT("10000m",0,44,10,"2023-07-01","f_40s",null,"夏季記録会"),mkT("10000m",0,41,20,"2024-08-18","f_40s",4)]},
  {id:5,name:"伊藤 誠",category:"m_50s",official:true,trials:[mkT("マラソン",3,48,0,"2023-03-12","m_50s",null,"つくばマラソン"),mkT("マラソン",3,25,0,"2024-10-06","m_50s",null,"大阪マラソン")]},
  {id:6,name:"中村 蒼",category:"m_jhs2",official:true,trials:[mkT("3000m",0,10,20,"2024-05-12","m_jhs2",2),mkT("3000m",0,9,45,"2024-10-08","m_jhs2",null,"中学県大会")]},
  {id:7,name:"松本 葵",category:"f_univ",official:true,trials:[mkT("5000m",0,16,30,"2023-09-02","f_univ",null,"関東インカレ"),mkT("5000m",0,15,55,"2024-03-17","f_univ",6)]},
  {id:8,name:"高橋 浩一",category:"m_60s",official:true,trials:[mkT("マラソン",4,10,0,"2023-06-04","m_60s",null,"北海道マラソン"),mkT("マラソン",3,58,30,"2024-04-14","m_60s",null,"いわきサンシャインマラソン")]},
  {id:9,name:"木村 翔",category:"m_hs",official:false,trials:[mkT("1000m",0,2,58,"2024-06-15","m_hs",7),mkT("5000m",0,16,20,"2024-09-20","m_hs",null,"高校オープン記録会")]},
];
const enrich = (m) => {
  if(!m.trials.length) return {...m,vdot:0,bestTrial:null,currentCategory:m.category,currentOfficial:m.official};
  const best=m.trials.reduce((a,b)=>b.vdot>a.vdot?b:a,m.trials[0]);
  // 最新の記録（日付が一番新しいもの）からカテゴリーとofficialを取得
  const latest=m.trials.reduce((a,b)=>a.date>b.date?a:b,m.trials[0]);
  return {...m,vdot:best.vdot,bestTrial:best,currentCategory:latest.category||m.category,currentOfficial:latest.official!==false};
};

function useRipple(){
  const [rs,setRs]=useState([]);
  const add=(e)=>{ const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX||r.left+r.width/2)-r.left,y=(e.clientY||r.top+r.height/2)-r.top,id=Date.now(); setRs(p=>[...p,{id,x,y}]); setTimeout(()=>setRs(p=>p.filter(rr=>rr.id!==id)),700); };
  const render=()=>rs.map(r=><span key={r.id} className="rp" style={{left:r.x,top:r.y}}/>);
  return [add,render];
}

function AnimatedNum({v,d=1}){
  const [disp,setDisp]=useState(0);
  const raf=useRef(),st=useRef(),from=useRef(0);
  useEffect(()=>{
    const tgt=parseFloat(v),sv=from.current;
    from.current=tgt; st.current=null; cancelAnimationFrame(raf.current);
    const step=(ts)=>{ if(!st.current)st.current=ts; const p=Math.min((ts-st.current)/800,1); setDisp(sv+(tgt-sv)*(1-Math.pow(1-p,4))); if(p<1)raf.current=requestAnimationFrame(step); };
    raf.current=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(raf.current);
  },[v]);
  return (<span>{disp.toFixed(d)}</span>);
}

function Chart({trials,color}){
  const RANGES=[{l:"1M",days:30},{l:"6M",days:182},{l:"1Y",days:365},{l:"全体",days:Infinity}];
  const [range,setRange]=useState(2); // デフォルト：1Y
  const now=new Date();
  const filtered=useMemo(()=>{
    const days=RANGES[range].days;
    if(days===Infinity)return trials;
    const cutoff=new Date(now);cutoff.setDate(cutoff.getDate()-days);
    const cutStr=cutoff.toISOString().slice(0,10);
    return trials.filter(t=>t.date>=cutStr);
  },[trials,range]);

  if(trials.length<2) return null;
  const shown=filtered.length>=2?filtered:trials.slice(-2);

  const W=Math.max(280,shown.length*86),CH=66,PT=26,PB=56,TOT=PT+CH+PB;
  const vs=shown.map(t=>t.vdot),minV=Math.min(...vs)-1.5,maxV=Math.max(...vs)+1.5;
  const cx=(i)=>26+(shown.length>1?i/(shown.length-1):0.5)*(W-52);
  const cy=(vv)=>PT+CH-((vv-minV)/(maxV-minV))*CH;
  const line=shown.map((t,i)=>cx(i)+","+cy(t.vdot)).join(" ");
  const area="M"+cx(0)+","+cy(shown[0].vdot)+" "+shown.map((t,i)=>"L"+cx(i)+","+cy(t.vdot)).join(" ")+" L"+cx(shown.length-1)+","+String(PT+CH)+" L"+cx(0)+","+String(PT+CH)+" Z";

  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:12,justifyContent:"flex-end"}}>
        {RANGES.map((r,i)=>(
          <button key={r.l} onClick={()=>setRange(i)}
            style={{padding:"4px 10px",borderRadius:12,border:`1px solid ${range===i?color:"#2a2a2a"}`,background:range===i?`${color}18`:"transparent",color:range===i?color:"#444",fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",transition:"all .2s"}}>
            {r.l}
          </button>
        ))}
      </div>
      {filtered.length<2&&(
        <div style={{textAlign:"center",padding:"20px 0",fontSize:11,color:"#444",fontFamily:"Noto Sans JP,sans-serif"}}>この期間の記録が1件以下のため全体表示</div>
      )}
      <div style={{overflowX:"auto"}}>
        <svg width={W} height={TOT} viewBox={"0 0 "+W+" "+TOT} style={{display:"block",overflow:"visible"}}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.22"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient>
            <filter id="gl"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <path d={area} fill="url(#cg)"/>
          {shown.slice(0,-1).map((t,i)=>{const x1=cx(i),y1=cy(t.vdot),x2=cx(i+1),y2=cy(shown[i+1].vdot);const segGradId=`sg${i}`;return(
            <g key={"seg"+i}>
              <defs><linearGradient id={segGradId} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={vc(t.vdot)}/><stop offset="100%" stopColor={vc(shown[i+1].vdot)}/></linearGradient></defs>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${segGradId})`} strokeWidth="2.5" strokeLinecap="round" filter="url(#gl)"/>
            </g>
          );})}
          {shown.map((t,i)=>{ const x=cx(i),y=cy(t.vdot); const pc=vc(t.vdot); return (
            <g key={t.id}>
              <circle cx={x} cy={y} r="4" fill={pc} stroke="#0d0d0d" strokeWidth="2" filter="url(#gl)"/>
              <text x={x} y={y-11} textAnchor="middle" fill={pc} fontSize="10" fontFamily="Barlow Condensed,sans-serif" fontWeight="700">{t.vdot.toFixed(1)}</text>
              <text x={x} y={PT+CH+19} textAnchor="middle" fill="#ccc" fontSize="10" fontFamily="Barlow Condensed,sans-serif" fontWeight="600">{fmtT(t.time)}</text>
              <text x={x} y={PT+CH+31} textAnchor="middle" fill="#555" fontSize="8" fontFamily="sans-serif">{t.distance.replace("ハーフマラソン","HM").replace("マラソン","フル")}</text>
              <text x={x} y={PT+CH+44} textAnchor="middle" fill="#444" fontSize="8" fontFamily="Barlow Condensed,sans-serif">{fmtD(t.date).slice(5)}</text>
            </g>
          );})}
        </svg>
      </div>
    </div>
  );
}

function CatSel({value,onChange}){
  const [gTab,setGTab]=useState(value&&value.startsWith("f_")?"女子":"男子");
  // 行定義：[ラベル, グループ名]
  const rows=[
    {label:"小・中学生",groups:[`小学生（${gTab}）`,`中学生（${gTab}）`]},
    {label:"高校・大学",groups:[`高校生（${gTab}）`,`大学生（${gTab}）`]},
    {label:"マスターズ",groups:[`マスターズ（${gTab}）`]},
  ];
  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {["男子","女子"].map(g=>(
          <button key={g} onClick={()=>setGTab(g)} style={{flex:1,padding:"7px",border:"none",borderRadius:4,cursor:"pointer",fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,fontSize:13,background:gTab===g?"#ff4d00":"#1a1a1a",color:gTab===g?"#fff":"#555"}}>
            {g}
          </button>
        ))}
      </div>
      {rows.map(row=>{
        const cats=CATS.filter(c=>row.groups.includes(c.g));
        if(!cats.length)return null;
        return (
          <div key={row.label} style={{marginBottom:6}}>
            <div style={{fontSize:8,color:"#444",marginBottom:4,fontFamily:"Noto Sans JP,sans-serif"}}>{row.label}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6, 1fr)",gap:3}}>
              {row.groups.map((g,gi)=>[
                ...CATS.filter(c=>c.g===g).map(c=>(
                  <button key={c.id} onClick={()=>onChange(c.id)}
                    style={{minWidth:0,padding:"5px 2px",border:`1px solid ${value===c.id?c.c:"#2e2e2e"}`,borderRadius:4,cursor:"pointer",fontFamily:"Noto Sans JP,sans-serif",fontSize:9,fontWeight:600,background:value===c.id?`${c.c}18`:"#1a1a1a",color:value===c.id?c.c:"#555",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {c.s}
                  </button>
                ))
              ])}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TI({vals,onChange}){
  const fields=[{key:"h",lbl:"時間",ph:"0",sep:null},{key:"m",lbl:"分",ph:"00",sep:":"},{key:"s",lbl:"秒",ph:"00",sep:":"},{key:"cs",lbl:"1/100",ph:"00",sep:"."}];
  return (
    <div style={{display:"flex",gap:5,alignItems:"flex-start"}}>
      {fields.map(({key,lbl,ph,sep})=>(
        <div key={key} style={{display:"contents"}}>
          {sep&&<span style={{color:"#3a3a3a",fontSize:20,lineHeight:1,marginTop:11,flexShrink:0}}>{sep}</span>}
          <div style={{flex:key==="h"?0.8:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <input className="tb" placeholder={ph} maxLength={2} value={vals[key]||""} onChange={e=>onChange(key,e.target.value.replace(/\D/g,""))}/>
            <span style={{fontSize:9,color:"#444",fontFamily:"Noto Sans JP,sans-serif"}}>{lbl}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function VP({distance,h,m,s,cs}){
  const time=tocs(h,m,s,cs); if(!time) return null;
  const vv=calcVDOT(DIST[distance],cs2sec(time)),color=vc(vv);
  return (
    <div style={{background:`${color}0d`,border:`1px solid ${color}25`,borderRadius:6,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div><div style={{fontSize:9,color:"#555",marginBottom:2,fontFamily:"Noto Sans JP,sans-serif"}}>推定VDOT</div><div style={{fontSize:11,color:"#777",fontFamily:"Noto Sans JP,sans-serif"}}>{vrl(vv)}</div></div>
      <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:34,color,lineHeight:1,fontStyle:"italic"}}>{vv.toFixed(1)}</div>
    </div>
  );
}

function FF({label,children}){return (<div><div style={{fontSize:11,color:"#555",marginBottom:7,fontWeight:500,fontFamily:"Noto Sans JP,sans-serif"}}>{label}</div>{children}</div>);}
function OfficialToggle({value,onChange}){
  return (
    <FF label="記録の区分">
      <div style={{display:"flex",gap:8}}>
        {[{v:true,l:"公式",desc:"ランキングに反映"},{v:false,l:"オープン参加",desc:"TT・オープン参加のみ"}].map(opt=>(
          <button key={String(opt.v)} onClick={()=>onChange(opt.v)}
            style={{flex:1,padding:"9px 8px",border:`1px solid ${value===opt.v?(opt.v?"#ff4d00":"#6366f1"):"#2e2e2e"}`,borderRadius:6,cursor:"pointer",background:value===opt.v?(opt.v?"rgba(255,77,0,.12)":"rgba(99,102,241,.12)"):"#141414",transition:"all .2s"}}>
            <div style={{fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,fontSize:12,color:value===opt.v?(opt.v?"#ff4d00":"#818cf8"):"#555",marginBottom:2}}>{opt.l}</div>
            <div style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:9,color:value===opt.v?"#666":"#444"}}>{opt.desc}</div>
          </button>
        ))}
      </div>
    </FF>
  );
}


function Modal({onClose,title,children}){
  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mo">
        <div style={{marginBottom:20}}><div style={{width:26,height:3,background:"#ff4d00",borderRadius:2,marginBottom:8}}/><div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:21,color:"#fff",fontStyle:"italic"}}>{title}</div></div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>{children}</div>
      </div>
    </div>
  );
}

function PinModal({onSuccess,onClose}){
  const [input,setInput]=useState("");
  const [err,setErr]=useState(false);
  const [shake,setShake]=useState(false);
  function hit(d){
    if(input.length>=6)return;
    const next=input+d; setInput(next); setErr(false);
    if(next.length>=ADMIN_PIN.length){
      setTimeout(()=>{ if(next===ADMIN_PIN){onSuccess();} else{setShake(true);setErr(true);setTimeout(()=>{setShake(false);setInput("");},600);} },80);
    }
  }
  function del(){setInput(p=>p.slice(0,-1));setErr(false);}
  const dots=Array.from({length:ADMIN_PIN.length},(_,i)=>input.length>i);
  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mo" style={{maxWidth:320,textAlign:"center",paddingBottom:32}}>
        <div style={{marginBottom:24}}>
          <div style={{width:26,height:3,background:"#ff4d00",borderRadius:2,margin:"0 auto 10px"}}/>
          <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:"#fff",fontStyle:"italic"}}>管理者PIN</div>
          <div style={{fontSize:12,color:"#555",fontFamily:"Noto Sans JP,sans-serif",marginTop:6}}>PINコードを入力してください</div>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:28,animation:shake?"shake .5s ease":"none"}}>
          {dots.map((filled,i)=>(
            <div key={i} style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${err?"#ef4444":filled?"#ff4d00":"#333"}`,background:filled?(err?"#ef4444":"#ff4d00"):"transparent"}}/>
          ))}
        </div>
        {err&&<div style={{fontSize:11,color:"#ef4444",fontFamily:"Noto Sans JP,sans-serif",marginBottom:16,marginTop:-16}}>PINが違います</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:240,margin:"0 auto"}}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k,i)=>(
            <button key={i} onClick={()=>k==="⌫"?del():k!==""?hit(k):null}
              style={{height:56,borderRadius:8,border:"1px solid #2e2e2e",background:k===""?"transparent":"#1a1a1a",color:k==="⌫"?"#888":"#f0f0f0",fontSize:k==="⌫"?20:22,fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,cursor:k===""?"default":"pointer",opacity:k===""?0:1}}>
              {k}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{marginTop:18,background:"#1a1a1a",border:"1px solid #333",borderRadius:8,color:"#999",fontFamily:"Noto Sans JP,sans-serif",fontSize:14,fontWeight:600,cursor:"pointer",padding:"12px 0",width:"100%"}}>キャンセル</button>
      </div>
    </div>
  );
}

function Empty({label}){return (<div style={{textAlign:"center",padding:"52px 20px",color:"#333"}}><div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:44,color:"#1a1a1a",marginBottom:10}}>—</div><div style={{fontSize:12,fontFamily:"Noto Sans JP,sans-serif"}}>{label}</div></div>);}
function Toast(){const [v,setV]=useState(1);useEffect(()=>{const t=setTimeout(()=>setV(0),1600);return()=>clearTimeout(t);},[]);return (<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1e1e1e",border:"1px solid #2e2e2e",borderRadius:20,padding:"8px 18px",fontFamily:"Noto Sans JP,sans-serif",fontSize:13,fontWeight:600,color:"#aaa",zIndex:999,whiteSpace:"nowrap",opacity:v,transition:"opacity .4s"}}>✓ 保存しました</div>);}

const WEATHERS=[
  {v:"sunny",e:"☀️",l:"晴れ"},
  {v:"cloudy",e:"☁️",l:"曇り"},
  {v:"rainy",e:"🌧️",l:"雨"},
  {v:"snowy",e:"❄️",l:"雪"},
  {v:"windy",e:"💨",l:"風"},
];

function TTPage({ttData,members,onOpenMember,requirePin,ttInfo,onSaveTTInfo}){
  const [selTT,setSelTT]=useState(ttData.length>0?ttData[0].event_no:null);
  const [selDist,setSelDist]=useState(null);
  const [editTT,setEditTT]=useState(null);
  const [editForm,setEditForm]=useState({weather:"",temp:"",humidity:"",startTime:""});
  const selTTData=ttData.find(t=>t.event_no===selTT)||null;
  const availDists=useMemo(()=>{ if(!selTTData)return []; return DK.filter(d=>selTTData.trials.some(t=>t.distance===d)); },[selTTData]);
  useEffect(()=>{ if(availDists.length>0&&(!selDist||!availDists.includes(selDist)))setSelDist(availDists[0]); },[availDists]);
  const ranking=useMemo(()=>{
    if(!selTTData||!selDist)return [];
    const map={};
    selTTData.trials.filter(t=>t.distance===selDist).forEach(t=>{ if(!map[t.memberId]||t.vdot>map[t.memberId].vdot)map[t.memberId]=t; });
    // 各メンバーごとに、このTTの記録が「その種目のPB(自己ベスト)」かを判定
    const rows = Object.values(map);
    rows.forEach(row=>{
      const member = members?.find(m=>m.id===row.memberId);
      if(!member){row.isPB=false;return;}
      // そのメンバーの該当種目の全記録から、最速タイムを取得
      const allTrials = member.trials.filter(t=>t.distance===selDist);
      if(!allTrials.length){row.isPB=false;return;}
      const bestTime = Math.min(...allTrials.map(t=>t.time));
      // このTTのタイムが全記録中で最速 = PB
      row.isPB = row.time===bestTime;
    });
    return rows.sort((a,b)=>a.time-b.time);
  },[selTTData,selDist,members]);

  if(ttData.length===0)return (<div style={{textAlign:"center",padding:"52px 20px",color:"#333"}}><div style={{fontSize:40,marginBottom:12}}>🏁</div><div style={{fontSize:13,fontFamily:"Noto Sans JP,sans-serif",lineHeight:1.8}}>TT記録がありません<br/>記録追加時に「第○回TT」番号を入力してください</div></div>);
  return (
    <div className="pi">
      <div className="tt-grid" style={{display:"grid",gap:5,marginBottom:16}}>
        {ttData.map(tt=>(
          <button key={tt.event_no} onClick={()=>setSelTT(tt.event_no)} style={{padding:"5px 4px",borderRadius:4,border:`1px solid ${selTT===tt.event_no?"#ff4d00":"#252525"}`,background:selTT===tt.event_no?"rgba(255,77,0,.12)":"#141414",color:selTT===tt.event_no?"#ff6b35":"#777",fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:13,fontStyle:"italic",cursor:"pointer",whiteSpace:"nowrap",textAlign:"center"}} title={tt.event_name}>
            {tt.event_no?`#${tt.event_no}`:tt.event_name}
          </button>
        ))}
      </div>
      {selTTData&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #252525"}}>
            <div style={{width:3,height:32,background:"#ff4d00",borderRadius:2,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:"#ff4d00",fontStyle:"italic"}}>{selTTData.event_name}</span>
                {(()=>{const i=ttInfo[selTTData.event_no];if(!i)return null;const w=WEATHERS.find(x=>x.v===i.weather);return(
                  <span style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:13,color:"#aaa",fontFamily:"Noto Sans JP,sans-serif",fontWeight:500}}>
                    {w&&<span style={{fontSize:18}}>{w.e}</span>}
                    {i.temp&&<span>{i.temp}℃</span>}
                    {i.humidity&&<span>湿度{i.humidity}%</span>}
                    {i.startTime&&<span>{(()=>{const s=String(i.startTime);if(/^\d{1,2}:\d{2}/.test(s))return s.slice(0,5);try{const d=new Date(s);if(!isNaN(d.getTime()))return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");}catch(e){}return s;})()}</span>}
                  </span>
                );})()}
              </div>
              <div style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{selTTData.trials.length}件の記録</div>
            </div>
            <button onClick={()=>requirePin(()=>{const i=ttInfo[selTTData.event_no]||{};setEditForm({weather:i.weather||"",temp:i.temp||"",humidity:i.humidity||"",startTime:i.startTime||""});setEditTT(selTTData.event_no);})} style={{flexShrink:0,padding:"5px 10px",borderRadius:4,border:"1px solid #252525",background:"#141414",color:"#777",fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:13,fontStyle:"italic",cursor:"pointer",whiteSpace:"nowrap"}}>EDIT</button>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
            {availDists.map(d=>(<button key={d} className={`dist-pill ${selDist===d?"sel":""}`} onClick={()=>setSelDist(d)}>{d}</button>))}
          </div>
          {ranking.length===0&&<Empty label="この種目の記録がありません"/>}
          {ranking.map((row,i)=>{ const cat=CMAP[row.category||row.memberCategory]; const c=vc(row.vdot); const rk=getRank(ranking,i,r=>r.time); const rd=rankDisplay(rk); return (
            <div key={row.memberId} className={`dr fu ${rk===1?"gold":rk===2?"silver":rk===3?"bronze":""}`} style={{animationDelay:`${i*30}ms`}} onClick={()=>onOpenMember(row.memberId)}>
              <div style={{flexShrink:0,width:26,textAlign:"center"}}>
                {rd.isMedal?<span style={{fontSize:17}}>{rd.medal}</span>:<span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:14,color:"#444"}}>{rd.medal}</span>}
              </div>
              <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:6}}>
                <span className="nm" style={{fontSize:17,letterSpacing:"-.01em",whiteSpace:"nowrap",textAlign:"left",color:"#fff"}}>{row.memberName}</span>
                <div style={{flex:1}}/>
                {row.memberOfficial===false&&<span className="vbadge" style={{color:"#fbbf24",border:"1px solid rgba(251,191,36,.3)",background:"rgba(251,191,36,.08)"}}>オープン</span>}
                {cat&&<span className="vbadge" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`}}>{cat.s}</span>}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:24,color:"#e0e0e0",lineHeight:1,fontStyle:"italic"}}>{fmtT(row.time)}</div>
                <div style={{fontSize:10,color:c,fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,marginTop:2}}>VDOT {row.vdot.toFixed(1)}</div>
              </div>
              <span style={{color:"#333",fontSize:15,flexShrink:0}}>›</span>
            </div>
          );})}
        </div>
      )}
      {editTT!==null&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setEditTT(null)}>
          <div className="mo">
            <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:18,color:"#fff",fontStyle:"italic",marginBottom:14}}>TT詳細情報 <span style={{fontSize:11,color:"#888",fontWeight:400,fontStyle:"normal",fontFamily:"Noto Sans JP,sans-serif",marginLeft:6}}>{ttData.find(t=>t.event_no===editTT)?.event_name}</span></div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <div style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:11,color:"#888",marginBottom:6}}>天気</div>
                <div style={{display:"flex",gap:5,flexWrap:"nowrap"}}>
                  {WEATHERS.map(w=>(
                    <button key={w.v} onClick={()=>setEditForm(f=>({...f,weather:f.weather===w.v?"":w.v}))} style={{flex:1,minWidth:0,padding:"6px 2px",border:`1px solid ${editForm.weather===w.v?"#ff4d00":"#2e2e2e"}`,borderRadius:5,background:editForm.weather===w.v?"rgba(255,77,0,.12)":"#141414",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <span style={{fontSize:16}}>{w.e}</span>
                      <span style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:9,color:editForm.weather===w.v?"#ff6b35":"#777"}}>{w.l}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:11,color:"#888",marginBottom:5}}>気温(℃)</div>
                  <input className="inp" type="number" placeholder="22" value={editForm.temp} onChange={e=>setEditForm(f=>({...f,temp:e.target.value}))}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:11,color:"#888",marginBottom:5}}>湿度(%)</div>
                  <input className="inp" type="number" placeholder="65" value={editForm.humidity} onChange={e=>setEditForm(f=>({...f,humidity:e.target.value}))}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:11,color:"#888",marginBottom:5}}>スタート</div>
                  <input className="inp" type="time" value={editForm.startTime} onChange={e=>setEditForm(f=>({...f,startTime:e.target.value}))}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button className="bg" style={{flex:1}} onClick={()=>setEditTT(null)}>キャンセル</button>
                <button className="ba" style={{flex:2}} onClick={()=>{onSaveTTInfo(editTT,editForm);setEditTT(null);}}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS=`
.tt-grid{grid-template-columns:repeat(5,1fr);}
@media(min-width:640px){.tt-grid{grid-template-columns:repeat(10,1fr);}}

@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,700;0,800;0,900;1,700&family=Noto+Sans+JP:wght@400;500;700;900&display=swap');
.vbadge{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;writing-mode:vertical-rl;font-family:'Noto Sans JP',sans-serif;font-size:9px;font-weight:600;padding:3px 2px;border-radius:3px;line-height:1.1;letter-spacing:0;flex-shrink:0;text-orientation:upright;}
.nm{font-family:'Noto Sans JP',sans-serif;font-weight:900;-webkit-text-stroke:0.5px currentColor;text-shadow:0 0 1px currentColor;}
*{box-sizing:border-box;margin:0;padding:0;}body{background:#0d0d0d;}
.vn{font-family:'Barlow Condensed',sans-serif;font-weight:900;letter-spacing:-.02em;line-height:1;font-style:italic;}
.card{background:#141414;border:1px solid #252525;border-radius:8px;position:relative;overflow:hidden;}
.mc{background:#141414;border:1px solid #252525;border-radius:8px;cursor:pointer;position:relative;overflow:hidden;transition:border-color .25s,transform .3s cubic-bezier(.34,1.56,.64,1);-webkit-tap-highlight-color:transparent;}
.mc:hover{border-color:#333;transform:translateY(-3px) scale(1.007);}
.mc:active{transform:translateY(-1px);transition-duration:.08s;}
.rp-host{position:relative;overflow:hidden;}
@keyframes rp{from{transform:scale(0);opacity:.4}to{transform:scale(4);opacity:0}}
.rp{position:absolute;border-radius:50%;background:rgba(255,255,255,.14);width:80px;height:80px;margin-left:-40px;margin-top:-40px;animation:rp .6s ease-out forwards;pointer-events:none;}
@keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fu .3s cubic-bezier(.25,1,.5,1) both;}
@keyframes pi{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
.pi{animation:pi .26s cubic-bezier(.25,1,.5,1) both;}
@keyframes mi{from{opacity:0;transform:translateY(28px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
.tab-bar{display:flex;border-bottom:1px solid #252525;overflow-x:auto;scrollbar-width:none;}
.tab-bar::-webkit-scrollbar{display:none;}
.ti{background:none;border:none;cursor:pointer;font-family:'Noto Sans JP',sans-serif;font-size:13px;font-weight:700;color:#444;padding:11px 14px;position:relative;transition:color .2s;white-space:nowrap;flex-shrink:0;}
.ti.on{color:#f0f0f0;}.ti.on::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:#ff4d00;}
.ti:not(.on):hover{color:#888;}
.bb{height:3px;background:#1e1e1e;border-radius:2px;overflow:hidden;margin-top:10px;}
.bf{height:100%;border-radius:2px;transition:width 1s cubic-bezier(.25,1,.5,1);}
.tr{display:flex;align-items:center;gap:10px;padding:7px 12px;border-radius:6px;background:#1a1a1a;border:1px solid #252525;margin-bottom:5px;transition:border-color .2s,transform .25s;}
.tr:hover{border-color:#333;transform:translateX(4px);}
.tr.pb{border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.04);}
.cr{display:flex;align-items:center;gap:10px;padding:7px 12px;border-radius:6px;background:#1a1a1a;border:1px solid #252525;margin-bottom:5px;cursor:pointer;transition:border-color .2s,transform .25s;}
.cr:hover{border-color:#333;transform:translateX(3px);}
.cr.t1{border-color:rgba(245,158,11,.35);background:rgba(245,158,11,.04);}
.rc{background:#1a1a1a;border:1px solid #252525;border-radius:6px;padding:8px 12px;transition:border-color .2s,transform .2s;}
.rc:hover{border-color:#333;transform:translateY(-2px);}
.pc{background:#1a1a1a;border:1px solid #252525;border-radius:6px;padding:7px 12px;transition:border-color .2s,transform .2s;}
.pc:hover{border-color:#333;transform:translateY(-2px);}
.ba{background:#ff4d00;color:#fff;border:none;border-radius:4px;padding:9px 18px;font-size:13px;font-family:'Noto Sans JP',sans-serif;font-weight:700;cursor:pointer;transition:background .2s,transform .2s;}
.ba:hover{background:#ff6b35;transform:translateY(-2px);}
.bg{background:transparent;color:#777;border:1px solid #2e2e2e;border-radius:4px;padding:9px 18px;font-size:13px;font-family:'Noto Sans JP',sans-serif;font-weight:600;cursor:pointer;transition:all .2s;}
.bg:hover{border-color:#555;color:#ddd;}
.bd{background:transparent;color:#ef4444;border:1px solid rgba(239,68,68,.2);border-radius:4px;padding:5px 10px;font-size:11px;font-family:'Noto Sans JP',sans-serif;font-weight:600;cursor:pointer;transition:all .2s;}
.bd:hover{background:rgba(239,68,68,.1);}
.cp{font-family:'Noto Sans JP',sans-serif;font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;}
.inp{background:#0a0a0a;border:1px solid #2a2a2a;border-radius:4px;color:#f0f0f0;padding:10px 12px;font-size:14px;font-family:'Noto Sans JP',sans-serif;width:100%;outline:none;transition:border-color .2s;}
.inp:focus{border-color:#ff4d00;box-shadow:0 0 0 3px rgba(255,77,0,.12);}select.inp option{background:#141414;}
.tb{background:#0a0a0a;border:1px solid #2a2a2a;border-radius:4px;color:#f0f0f0;padding:10px 5px;font-size:20px;font-family:'Barlow Condensed',sans-serif;font-weight:600;text-align:center;outline:none;width:100%;transition:border-color .2s;}
.tb:focus{border-color:#ff4d00;box-shadow:0 0 0 3px rgba(255,77,0,.12);}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:300;backdrop-filter:blur(8px);padding:20px;}
.mo{background:#141414;border:1px solid #2e2e2e;border-radius:12px;padding:22px 20px;width:100%;max-width:460px;max-height:85vh;overflow-y:auto;animation:mi .3s cubic-bezier(.34,1.4,.64,1) both;}
.sh{background:rgba(13,13,13,.95);border-bottom:1px solid #252525;backdrop-filter:blur(12px);position:sticky;top:0;z-index:50;}
.dist-pill{display:inline-flex;align-items:center;padding:7px 14px;border-radius:20px;border:1px solid #252525;background:#141414;cursor:pointer;font-family:'Noto Sans JP',sans-serif;font-size:13px;font-weight:600;color:#555;transition:all .2s;white-space:nowrap;}
.dist-pill:hover{border-color:#444;color:#aaa;}
.dist-pill.sel{background:rgba(255,77,0,.12);border-color:#ff4d00;color:#ff6b35;}
.dr{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:5px;background:#1a1a1a;border:1px solid #252525;margin-bottom:3px;cursor:pointer;transition:border-color .2s,transform .25s;}
.dr:hover{border-color:#333;transform:translateX(3px);}
.dr.gold{border-color:rgba(245,158,11,.45);background:rgba(245,158,11,.05);}
.dr.silver{border-color:rgba(192,192,192,.3);background:rgba(192,192,192,.03);}
.dr.bronze{border-color:rgba(205,124,50,.35);background:rgba(205,124,50,.04);}
::-webkit-scrollbar{width:2px;}::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px;}
`;

function App(){
  const [members,setMembers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState("ranking");
  const [activeId,setActiveId]=useState(null);
  const [mainTab,setMainTab]=useState("events");
  const [showSearch,setShowSearch]=useState(false);
  const [showVisits,setShowVisits]=useState(false);
  const [visitData,setVisitData]=useState({today:0,total:0,recent:[]});
  const [searchQ,setSearchQ]=useState("");
  const [catTab,setCatTab]=useState("ranking");
  const [selCat,setSelCat]=useState("m_elem4");
  const [selDist,setSelDist]=useState("1000m");
  const [showAddM,setShowAddM]=useState(false);
  const [showAddT,setShowAddT]=useState(false);
  const [editTrial,setEditTrial]=useState(null);
  const [eForm,setEF]=useState({distance:"1000m",h:"",m:"",s:"",cs:"",date:today(),category:"",event_no:"",event_name_input:"",official:true});
  const [showPin,setShowPin]=useState(false);
  const [pinUnlocked,setPinUnlocked]=useState(false);
  const [pinCb,setPinCb]=useState(null);
  const [ttInfo,setTTInfo]=useState({});
  const [flash,setFlash]=useState(0);
  useEffect(()=>{ loadData(); recordVisit(); loadTTInfo(); },[flash]);
  async function loadData(){
    const {data:ms} = await sb.from("members").select("*");
    const {data:ts} = await sb.from("trials").select("*");
    if(!ms||!ts){setMembers([]);setLoading(false);return;}
    const memberMap = {};
    ms.forEach(m=>{memberMap[m.id]={...m,official:m.official!==false,trials:[]};});
    ts.forEach(t=>{
      if(memberMap[t.member_id]){
        memberMap[t.member_id].trials.push({
          id:t.id,distance:t.distance,time:t.time,date:t.date,vdot:Number(t.vdot),
          category:t.category,event_no:t.event_no,event_name:t.event_name,official:t.official!==false
        });
      }
    });
    setMembers(Object.values(memberMap).map(enrich));
    setLoading(false);
  }
  async function loadTTInfo(){
    try {
      const {data} = await sb.from("tt_info").select("*");
      if(data){
        const map = {};
        data.forEach(t => {
          map[t.event_no] = {
            weather: t.weather || "",
            temp: t.temp != null ? String(t.temp) : "",
            humidity: t.humidity != null ? String(t.humidity) : "",
            startTime: t.start_time || ""
          };
        });
        setTTInfo(map);
      }
    } catch(e) { console.warn("tt_info load failed",e); }
  }
  async function saveTTInfo(eventNo, form){
    try {
      await sb.from("tt_info").upsert({
        event_no: eventNo,
        weather: form.weather || null,
        temp: form.temp ? parseInt(form.temp) : null,
        humidity: form.humidity ? parseInt(form.humidity) : null,
        start_time: form.startTime || null
      }, {onConflict: "event_no"});
      setTTInfo(prev => ({...prev, [eventNo]: {...form}}));
    } catch(e) { console.warn("tt_info save failed",e); alert("保存に失敗: "+e.message); }
  }
  async function recordVisit(){
    if(sessionStorage.getItem("visited_today")===today())return;
    sessionStorage.setItem("visited_today",today());
    try { await sb.rpc("increment_visit",{p_date:today()}); } catch(e) { console.warn(e); }
  }
  async function loadVisits(){
    const {data} = await sb.from("visits").select("*").order("date",{ascending:false}).limit(30);
    if(!data){setVisitData({today:0,total:0,recent:[]});return;}
    const t = today();
    const todayRow = data.find(v=>v.date===t);
    const total = data.reduce((a,b)=>a+(b.count||0),0);
    setVisitData({today:todayRow?todayRow.count:0,total,recent:data});
  }

  const [mForm,setMF]=useState({name:"",category:"m_elem4",distance:"1000m",h:"",m:"",s:"",cs:"",date:today(),event_no:"",event_name_input:"",official:true});
  const [tForm,setTF]=useState({distance:"1000m",h:"",m:"",s:"",cs:"",date:today(),category:"",event_no:"",event_name_input:"",official:true});

  const sorted=useMemo(()=>[...members].sort((a,b)=>b.vdot-a.vdot).map((m,i)=>({...m,rank:i+1})),[members]);
  const am=useMemo(()=>{
    const m=members.find(m=>m.id===activeId);
    if(!m)return null;
    const rank=sorted.findIndex(s=>s.id===activeId)+1;
    return {...m,rank:rank>0?rank:null};
  },[members,sorted,activeId]);

  // 選手の各記録がカテゴリー内で何位かを計算
  const catRankMap=useMemo(()=>{
    if(!am) return {};
    const map={};
    // カテゴリー×種目ごとに選手のベスト記録のIDを特定し、それのみを判定
    const bestByKey={};
    am.trials.forEach(t=>{
      const key=(t.category||am.category)+"__"+t.distance;
      if(!bestByKey[key]||t.time<bestByKey[key].time) bestByKey[key]=t;
    });
    Object.values(bestByKey).forEach(bestT=>{
      const cat=bestT.category||am.category;
      const dist=bestT.distance;
      const rivals=[];
      members.forEach(m=>{
        const ts=m.trials.filter(tt=>tt.distance===dist&&(tt.category||m.category)===cat&&tt.official!==false);
        if(!ts.length)return;
        const best=ts.reduce((a,b)=>a.time<b.time?a:b);
        rivals.push({memberId:m.id,time:best.time});
      });
      rivals.sort((a,b)=>a.time-b.time);
      const rank=rivals.findIndex(r=>r.memberId===am.id)+1;
      if(rank>=1&&rank<=3) map[bestT.id]={rank,medal:["🥇","🥈","🥉"][rank-1]};
    });
    return map;
  },[am,members]);
  const catMs=useMemo(()=>{
    const rows=[];
    members.forEach(m=>{
      const catTrials=m.trials.filter(t=>t.category===selCat&&t.official!==false);
      if(!catTrials.length)return;
      const best=catTrials.reduce((a,b)=>b.vdot>a.vdot?b:a,catTrials[0]);
      rows.push({...m,catVdot:best.vdot,catBestTrial:best});
    });
    return rows.sort((a,b)=>b.catVdot-a.catVdot);
  },[sorted,selCat]);
  const catRecs=useMemo(()=>{const map={};members.forEach(m=>m.trials.filter(t=>t.category===selCat&&t.official!==false).forEach(t=>{if(!map[t.distance]||t.vdot>map[t.distance].vdot)map[t.distance]={...t,memberName:m.name};}));return map;},[members,selCat]);
  // 種目ごとの選択カテゴリーTop3
  const catTopByDist=useMemo(()=>{
    const map={};
    members.forEach(m=>{
      m.trials.filter(t=>t.category===selCat&&t.official!==false).forEach(t=>{
        const d=t.distance;
        if(!map[d])map[d]=[];
        const existingIdx=map[d].findIndex(r=>r.memberId===m.id);
        if(existingIdx>=0){
          if(t.time<map[d][existingIdx].time){
            map[d][existingIdx]={memberId:m.id,memberName:m.name,memberOfficial:true,...t};
          }
        }else{
          map[d].push({memberId:m.id,memberName:m.name,memberOfficial:true,...t});
        }
      });
    });
    Object.keys(map).forEach(d=>{
      map[d].sort((a,b)=>a.time-b.time);
      map[d]=map[d].slice(0,3);
    });
    return map;
  },[members,selCat]);
  const ttData=useMemo(()=>{
    const map={};
    members.forEach(m=>{
      m.trials.filter(t=>t.event_no).forEach(t=>{
        const no=t.event_no;
        if(!map[no])map[no]={event_no:no,event_name:t.event_name||`第${no}回TT`,trials:[],date:t.date};
        map[no].trials.push({...t,memberName:m.name,memberCategory:t.category||m.category,memberId:m.id,memberOfficial:m.official!==false});
        if(t.date>map[no].date)map[no].date=t.date;
      });
    });
    return Object.values(map).sort((a,b)=>b.event_no-a.event_no);
  },[members]);
  const distRanking=useMemo(()=>{
    const rows=[];
    members.forEach(m=>{
      const ts=m.trials.filter(t=>t.distance===selDist&&t.official!==false);
      if(!ts.length)return;
      const best=ts.reduce((a,b)=>b.vdot>a.vdot?b:a,ts[0]);
      rows.push({memberId:m.id,name:m.name,category:best.category||m.category,time:best.time,vdot:best.vdot,date:best.date,event_name:best.event_name,official:true});
    });
    return rows.sort((a,b)=>a.time-b.time);
  },[members,selDist]);
  const avg=members.length?(members.reduce((a,b)=>a+b.vdot,0)/members.length).toFixed(1):"—";
  const max=members.length?Math.max(...members.map(m=>m.vdot)).toFixed(1):"—";
  const selCO=CMAP[selCat];


  const searchResults=useMemo(()=>{
    if(!searchQ.trim())return null;
    const q=searchQ.toLowerCase();
    const memberHits=[],trialHits=[];
    members.forEach(m=>{
      if(m.name.toLowerCase().includes(q)) memberHits.push(m);
      m.trials.forEach(t=>{
        const dist=t.distance.toLowerCase();
        const evt=(t.event_name||"").toLowerCase();
        const cat=CMAP[t.category||m.category];
        const catL=(cat?cat.l:"").toLowerCase();
        const catS=(cat?cat.s:"").toLowerCase();
        if(dist.includes(q)||evt.includes(q)||catL.includes(q)||catS.includes(q)){
          trialHits.push({...t,memberName:m.name,memberId:m.id,memberOfficial:m.official!==false});
        }
      });
    });
    return {members:memberHits,trials:trialHits};
  },[searchQ,members]);

  function openM(id){setActiveId(id);setPage("member");setShowSearch(false);setSearchQ("");}
  function goBack(){setPage("ranking");setActiveId(null);}
  function requirePin(cb){setPinCb(()=>cb);setShowPin(true);}

  async function addMember(){
    const time=tocs(mForm.h,mForm.m,mForm.s,mForm.cs);
    if(!mForm.name.trim()||time===0)return;
    const vdot=calcVDOT(DIST[mForm.distance],cs2sec(time));
    const eno=mForm.event_no?parseInt(mForm.event_no):null;
    const enm=eno?`第${eno}回TT`:mForm.event_name_input.trim()||null;
    const {data:m}=await sb.from("members").insert({name:mForm.name.trim(),category:mForm.category,official:mForm.official!==false}).select().single();
    if(m)await sb.from("trials").insert({member_id:m.id,distance:mForm.distance,time,date:mForm.date,vdot,category:mForm.category,event_no:eno,event_name:enm,official:mForm.official!==false});
    setMF({name:"",category:"m_elem4",distance:"1000m",h:"",m:"",s:"",cs:"",date:today(),event_no:"",event_name_input:"",official:true});setShowAddM(false);setFlash(n=>n+1);
  }
  async function addTrial(){
    const time=tocs(tForm.h,tForm.m,tForm.s,tForm.cs); if(time===0)return;
    const cat=tForm.category||am?.category||"m_elem4";
    const vdot=calcVDOT(DIST[tForm.distance],cs2sec(time));
    const eno=tForm.event_no?parseInt(tForm.event_no):null;
    const enm=eno?`第${eno}回TT`:tForm.event_name_input.trim()||null;
    await sb.from("trials").insert({member_id:activeId,distance:tForm.distance,time,date:tForm.date||today(),vdot,category:cat,event_no:eno,event_name:enm,official:tForm.official!==false});
    setTF({distance:"1000m",h:"",m:"",s:"",cs:"",date:today(),category:"",event_no:"",event_name_input:"",official:true});setShowAddT(false);setFlash(n=>n+1);
  }
  async function delTrial(tid){await sb.from("trials").delete().eq("id",tid);setFlash(n=>n+1);}
  function openEdit(t){
    const [hh,mm,ss,cc]=[Math.floor(t.time/360000),Math.floor((t.time%360000)/6000),Math.floor((t.time%6000)/100),t.time%100];
    setEF({distance:t.distance,h:hh>0?String(hh):"",m:String(mm),s:String(ss).padStart(2,"0"),cs:String(cc).padStart(2,"0"),date:t.date,category:t.category||"",event_no:t.event_no?String(t.event_no):"",event_name_input:t.event_name&&!t.event_no?t.event_name:"",official:t.official!==false});
    setEditTrial(t);
  }
  async function saveTrial(){
    const time=tocs(eForm.h,eForm.m,eForm.s,eForm.cs);if(time===0)return;
    const cat=eForm.category||am?.category||"m_elem4";
    const eno=eForm.event_no?parseInt(eForm.event_no):null;
    const enm=eno?`第${eno}回TT`:eForm.event_name_input.trim()||null;
    const vdot=calcVDOT(DIST[eForm.distance],cs2sec(time));
    await sb.from("trials").update({distance:eForm.distance,time,date:eForm.date,vdot,category:cat,event_no:eno,event_name:enm,official:eForm.official!==false}).eq("id",editTrial.id);
    setEditTrial(null);setFlash(n=>n+1);
  }
  async function delMember(id){
    await sb.from("trials").delete().eq("member_id",id);
    await sb.from("members").delete().eq("id",id);
    goBack();setFlash(n=>n+1);
  }
  async function renameMember(id,newName){
    if(!newName||!newName.trim())return;
    await sb.from("members").update({name:newName.trim()}).eq("id",id);
    setFlash(n=>n+1);
  }

  if(loading)return(
    <div style={{minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0d0d0d"}}>
      <div style={{textAlign:"center"}}>
        <div style={{transform:"scale(1.5)",marginBottom:18}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,fontStyle:"italic",color:"#fff"}}>VAMOS<span style={{color:"#ff4d00"}}>RC</span></div></div>
        <div style={{fontSize:11,color:"#444",fontFamily:"Noto Sans JP,sans-serif"}}>読み込み中...</div>
      </div>
    </div>
  );
  return (
    <div style={{minHeight:"100vh",background:"#0d0d0d",color:"#f0f0f0"}}>
      <style>{CSS}</style>
      {page==="member"&&am&&(
        <MemberPage member={am} onBack={goBack}
          onAddTrial={()=>{setTF({distance:"1000m",h:"",m:"",s:"",cs:"",date:today(),category:am.category,event_no:""});setShowAddT(true);}}
          onDelTrial={(tid)=>requirePin(()=>delTrial(tid))}
          onDelMember={()=>requirePin(()=>delMember(am.id))}
          requirePin={requirePin}
          catRankMap={catRankMap}
          onEditTrial={(t)=>requirePin(()=>openEdit(t))}
          editTrial={editTrial}
          eForm={eForm} setEF={setEF}
          onSaveTrial={()=>{requirePin(saveTrial);}}
          onCancelEdit={()=>setEditTrial(null)}
          onRenameMember={(newName)=>requirePin(()=>renameMember(am.id,newName))}/>
      )}

      {page==="ranking"&&(
        <div>
          <header className="sh">
            <div style={{maxWidth:760,margin:"0 auto",padding:"0 16px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:58}}>
                <div onContextMenu={e=>{e.preventDefault();loadVisits();setShowVisits(true);}} onTouchStart={e=>{const timer=setTimeout(()=>{loadVisits();setShowVisits(true);},700);e.currentTarget._lp=timer;}} onTouchEnd={e=>clearTimeout(e.currentTarget._lp)} onTouchMove={e=>clearTimeout(e.currentTarget._lp)} style={{cursor:"pointer",userSelect:"none",WebkitUserSelect:"none",WebkitTouchCallout:"none"}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,fontStyle:"italic",color:"#fff"}}>VAMOS<span style={{color:"#ff4d00"}}>RC</span></div></div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                  <button style={{fontSize:11,padding:"6px 10px",display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.12)",color:"#fff",border:"1px solid rgba(255,255,255,.3)",borderRadius:4,fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,cursor:"pointer"}} onClick={()=>setShowSearch(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                    <span>検索</span>
                  </button>
                </div>
              </div>
            </div>
            <div style={{maxWidth:760,margin:"0 auto",padding:"0 16px"}}>
              <div className="tab-bar">
                <button className={`ti ${mainTab==="events"?"on":""}`} onClick={()=>setMainTab("events")}>種目別</button>
                <button className={`ti ${mainTab==="categories"?"on":""}`} onClick={()=>setMainTab("categories")}>年代別</button>
                <button className={`ti ${mainTab==="tt"?"on":""}`} onClick={()=>setMainTab("tt")}>TT別</button>
                <button className={`ti ${mainTab==="ranking"?"on":""}`} onClick={()=>setMainTab("ranking")}>VDOTランキング</button>
              </div>
            </div>
          </header>

          <main style={{maxWidth:760,margin:"0 auto",padding:"18px 14px"}}>
            {mainTab==="events"&&(
              <div className="pi">
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
                  {DK.map(d=>(<button key={d} className={`dist-pill ${selDist===d?"sel":""}`} onClick={()=>setSelDist(d)}>{d}</button>))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #252525"}}>
                  <div style={{width:3,height:32,background:"#ff4d00",borderRadius:2,flexShrink:0}}/>
                  <div>
                    <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:"#ff4d00",fontStyle:"italic"}}>{selDist}</div>
                    <div style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{distRanking.length}名が記録あり · タイム順</div>
                  </div>
                </div>
                {distRanking.length===0&&<Empty label="この種目の記録がありません"/>}
                {distRanking.map((row,i)=>{ const cat=CMAP[row.category]; const c=vc(row.vdot); const rk=getRank(distRanking,i,r=>r.time); const rd=rankDisplay(rk); const cls=rk===1?"gold":rk===2?"silver":rk===3?"bronze":""; return (
                  <div key={row.memberId} className={`dr fu ${cls}`} style={{animationDelay:`${i*30}ms`}} onClick={()=>openM(row.memberId)}>
                    <div style={{flexShrink:0,width:32,textAlign:"center"}}>
                      {rd.isMedal?<span style={{fontSize:17}}>{rd.medal}</span>:<span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:14,color:"#444"}}>{rd.medal}</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:1,flexWrap:"nowrap"}}>
                        <span className="nm" style={{fontSize:15,letterSpacing:"-.01em",whiteSpace:"nowrap",textAlign:"left",color:"#fff"}}>{row.name}</span>
                        <div style={{flex:1}}/>
                        {cat&&<span className="vbadge" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`}}>{cat.s}</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}><span style={{fontSize:9,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{fmtD(row.date)}</span>{row.event_name&&<span style={{fontSize:9,color:"#ff4d00",fontFamily:"Noto Sans JP,sans-serif"}}>{row.event_name}</span>}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:20,color:"#e0e0e0",lineHeight:1,fontStyle:"italic"}}>{fmtT(row.time)}</div>
                      <div style={{fontSize:9,color:c,fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,marginTop:1}}>VDOT {row.vdot.toFixed(1)}</div>
                    </div>
                    <span style={{color:"#333",fontSize:15,flexShrink:0}}>›</span>
                  </div>
                );})}
              </div>
            )}

            {mainTab==="categories"&&(
              <div className="pi">
                <div className="card" style={{padding:"16px 18px",marginBottom:14}}><CatSel value={selCat} onChange={setSelCat}/></div>
                <div className="tab-bar" style={{borderRadius:"8px 8px 0 0",background:"#141414",border:"1px solid #252525",borderBottom:"none",padding:"0 4px"}}>
                  <button className={`ti ${catTab==="ranking"?"on":""}`} onClick={()=>setCatTab("ranking")}>ランキング</button>
                  <button className={`ti ${catTab==="vdot"?"on":""}`} onClick={()=>setCatTab("vdot")}>VDOTランキング</button>
                </div>
                <div className="card" style={{borderRadius:"0 0 8px 8px",padding:"14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:12,borderBottom:"1px solid #252525"}}>
                    <div style={{width:4,height:32,background:selCO.c,borderRadius:2,flexShrink:0}}/>
                    <div>
                      <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:20,color:selCO.c,fontStyle:"italic"}}>{selCO.l}</div>
                      <div style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{catMs.length}名が記録あり</div>
                    </div>
                  </div>
                  {catTab==="ranking"&&(
                    <div>
                      {Object.keys(catTopByDist).length===0&&<Empty label="この年代にメンバーがいません"/>}
                      {DK.filter(d=>catTopByDist[d]&&catTopByDist[d].length>0).map((dist,di)=>(
                        <div key={dist} style={{marginBottom:di===DK.filter(d=>catTopByDist[d]&&catTopByDist[d].length>0).length-1?0:18}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${selCO.c}28`}}>
                            <div style={{width:3,height:14,background:selCO.c,borderRadius:2}}/>
                            <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:16,color:selCO.c,fontStyle:"italic"}}>{dist}</div>
                            <div style={{fontSize:9,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{catTopByDist[dist].length}名</div>
                          </div>
                          {catTopByDist[dist].map((row,i)=>{const rk=getRank(catTopByDist[dist],i,r=>r.time);const rd=rankDisplay(rk);return(
                            <div key={row.memberId} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",background:rk===1?"rgba(245,158,11,.05)":"#141414",border:`1px solid ${rk===1?"rgba(245,158,11,.2)":"#252525"}`,borderRadius:6,marginBottom:4,cursor:"pointer"}} onClick={()=>openM(row.memberId)}>
                              <div style={{width:24,textAlign:"center",flexShrink:0,fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:14,color:rk===1?"#f59e0b":rk===2?"#9ca3af":rk===3?"#cd7c32":"#444"}}>{rd.medal}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"nowrap"}}>
                                  <span className="nm" style={{fontSize:14,whiteSpace:"nowrap",textAlign:"left",color:"#fff"}}>{row.memberName}</span>
                                  <div style={{flex:1}}/>
                                  {row.event_name&&<span style={{fontSize:9,color:"#ff4d00",fontFamily:"Noto Sans JP,sans-serif",flexShrink:0}}>{row.event_name}</span>}
                                  {row.memberOfficial===false&&<span className="vbadge" style={{color:"#fbbf24",border:"1px solid rgba(251,191,36,.3)",background:"rgba(251,191,36,.08)"}}>オープン</span>}
                                </div>
                                <div style={{fontSize:9,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{fmtD(row.date)}</div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:20,color:"#e0e0e0",lineHeight:1,fontStyle:"italic"}}>{fmtT(row.time)}</div>
                                <div style={{fontSize:9,color:vc(row.vdot),fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,marginTop:2}}>VDOT {row.vdot.toFixed(1)}</div>
                              </div>
                            </div>
                          );})}
                        </div>
                      ))}
                    </div>
                  )}
                  {catTab==="vdot"&&(
                    <div>
                      {(()=>{const officials=catMs.filter(m=>m.official!==false);return officials.length===0?<Empty label="この年代に公式メンバーがいません"/>:officials.map((m,i)=>{const c=vc(m.catVdot);const rk=getRank(officials,i,x=>-x.catVdot);const rd=rankDisplay(rk);return(
                        <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 12px",background:rk===1?"rgba(245,158,11,.05)":"#141414",border:`1px solid ${rk===1?"rgba(245,158,11,.2)":"#252525"}`,borderRadius:6,marginBottom:5,cursor:"pointer"}} onClick={()=>openM(m.id)}>
                          <div style={{width:28,textAlign:"center",flexShrink:0,fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:rk<=3?16:14,color:rk===1?"#f59e0b":rk===2?"#9ca3af":rk===3?"#cd7c32":"#444"}}>{rd.medal}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"nowrap"}}>
                              <span className="nm" style={{fontSize:15,whiteSpace:"nowrap",textAlign:"left",color:"#fff"}}>{m.name}</span>
                              <div style={{flex:1}}/>
                            </div>
                            <div style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{m.catBestTrial?.distance} · {m.catBestTrial?fmtT(m.catBestTrial.time):""}{m.catBestTrial?.event_name&&<span style={{color:"#ff4d00",marginLeft:6}}>{m.catBestTrial.event_name}</span>}</div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:24,color:c,fontStyle:"italic",lineHeight:1}}>{m.catVdot.toFixed(1)}</div>
                            <div style={{fontSize:9,color:"#444",fontFamily:"Noto Sans JP,sans-serif",marginTop:2}}>VDOT</div>
                          </div>
                        </div>
                      );});})()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {mainTab==="tt"&&(
              <TTPage ttData={ttData} members={members} onOpenMember={openM} requirePin={requirePin} ttInfo={ttInfo} onSaveTTInfo={saveTTInfo}/>
            )}

            {mainTab==="ranking"&&(
              <div>
                {sorted.map((m,idx)=>(<MCard key={m.id} m={m} idx={idx} allMembers={sorted} onClick={()=>openM(m.id)}/>))}
                {!members.length&&<Empty label="メンバーがいません"/>}
              </div>
            )}
          </main>
        </div>
      )}

      {showAddM&&<Modal onClose={()=>setShowAddM(false)} title="メンバーを追加">
        <FF label="名前"><input className="inp" placeholder="例：田中 健" value={mForm.name} onChange={e=>setMF(f=>({...f,name:e.target.value}))}/></FF>
        <FF label="メンバー区分">
          <div style={{display:"flex",gap:8}}>
            {[{v:true,l:"公式メンバー",desc:"ランキングに掲載"},{v:false,l:"オープン参加メンバー",desc:"TT・オープン参加のみ"}].map(opt=>(
              <button key={String(opt.v)} onClick={()=>setMF(f=>({...f,official:opt.v}))}
                style={{flex:1,padding:"10px 8px",border:`1px solid ${mForm.official===opt.v?(opt.v?"#ff4d00":"#6366f1"):"#2e2e2e"}`,borderRadius:6,cursor:"pointer",background:mForm.official===opt.v?(opt.v?"rgba(255,77,0,.12)":"rgba(99,102,241,.12)"):"#141414",transition:"all .2s"}}>
                <div style={{fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,fontSize:12,color:mForm.official===opt.v?(opt.v?"#ff4d00":"#818cf8"):"#555",marginBottom:2}}>{opt.l}</div>
                <div style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:9,color:mForm.official===opt.v?"#666":"#444"}}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </FF>
        <FF label="年代"><CatSel value={mForm.category} onChange={v=>setMF(f=>({...f,category:v}))}/></FF>
        <FF label="種目"><select className="inp" value={mForm.distance} onChange={e=>setMF(f=>({...f,distance:e.target.value}))}>{DK.map(d=>(<option key={d}>{d}</option>))}</select></FF>
        <FF label="タイム"><TI vals={mForm} onChange={(k,v)=>setMF(f=>({...f,[k]:v}))}/></FF>
        <FF label="イベント・大会名（任意）">
          <input className="inp" placeholder="例：春季記録会、東京マラソン" value={mForm.event_name_input||""} onChange={e=>setMF(f=>({...f,event_name_input:e.target.value,event_no:""}))}/>
        </FF>
        <FF label="タイムトライアルの場合は回数を入力">
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:13,color:"#aaa",whiteSpace:"nowrap"}}>第</span>
            <input className="inp" type="number" min="1" placeholder="3" value={mForm.event_no||""} onChange={e=>setMF(f=>({...f,event_no:e.target.value,event_name_input:""}))} style={{width:90,textAlign:"center"}}/>
            <span style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:13,color:"#aaa",whiteSpace:"nowrap"}}>回TT</span>
            {mForm.event_no&&<span style={{fontSize:11,color:"#ff4d00",fontFamily:"Noto Sans JP,sans-serif",fontWeight:700}}>第{mForm.event_no}回TT</span>}
          </div>
        </FF>
        <FF label="日付"><input className="inp" type="date" value={mForm.date} onChange={e=>setMF(f=>({...f,date:e.target.value}))}/></FF>
        <VP distance={mForm.distance} h={mForm.h} m={mForm.m} s={mForm.s} cs={mForm.cs}/>
        <div style={{display:"flex",gap:8}}><button className="bg" style={{flex:1}} onClick={()=>setShowAddM(false)}>キャンセル</button><button className="ba" style={{flex:2}} onClick={addMember}>追加する</button></div>
      </Modal>}

      {showAddT&&<Modal onClose={()=>setShowAddT(false)} title="タイムを記録">
        <FF label="イベント・大会名（任意）">
          <input className="inp" placeholder="例：春季記録会、東京マラソン" value={tForm.event_name_input||""} onChange={e=>setTF(f=>({...f,event_name_input:e.target.value,event_no:""}))}/>
        </FF>
        <FF label="タイムトライアルの場合は回数を入力">
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:13,color:"#aaa",whiteSpace:"nowrap"}}>第</span>
            <input className="inp" type="number" min="1" placeholder="3" value={tForm.event_no||""} onChange={e=>setTF(f=>({...f,event_no:e.target.value,event_name_input:""}))} style={{width:90,textAlign:"center"}}/>
            <span style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:13,color:"#aaa",whiteSpace:"nowrap"}}>回TT</span>
            {tForm.event_no&&<span style={{fontSize:11,color:"#ff4d00",fontFamily:"Noto Sans JP,sans-serif",fontWeight:700}}>第{tForm.event_no}回TT</span>}
          </div>
        </FF>
        <FF label="年代（変更可）"><CatSel value={tForm.category||am?.category||"m_elem4"} onChange={v=>setTF(f=>({...f,category:v}))}/></FF>
        <FF label="種目"><select className="inp" value={tForm.distance} onChange={e=>setTF(f=>({...f,distance:e.target.value}))}>{DK.map(d=>(<option key={d}>{d}</option>))}</select></FF>
        <FF label="タイム"><TI vals={tForm} onChange={(k,v)=>setTF(f=>({...f,[k]:v}))}/></FF>
        <FF label="日付"><input className="inp" type="date" value={tForm.date} onChange={e=>setTF(f=>({...f,date:e.target.value}))}/></FF>
        <VP distance={tForm.distance} h={tForm.h} m={tForm.m} s={tForm.s} cs={tForm.cs}/>
        <OfficialToggle value={tForm.official!==false} onChange={v=>setTF(f=>({...f,official:v}))}/>
        <div style={{display:"flex",gap:8}}><button className="bg" style={{flex:1}} onClick={()=>setShowAddT(false)}>キャンセル</button><button className="ba" style={{flex:2}} onClick={addTrial}>記録する</button></div>
      </Modal>}

      {showVisits&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowVisits(false)}>
          <div className="mo">
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <span style={{fontSize:18}}>📊</span>
              <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:20,color:"#fff",fontStyle:"italic"}}>訪問数</div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              <div style={{flex:1,background:"#0f0f0f",border:"1px solid #252525",borderRadius:6,padding:"12px 14px"}}>
                <div style={{fontSize:10,color:"#666",fontFamily:"Noto Sans JP,sans-serif",marginBottom:5}}>今日の訪問</div>
                <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:32,color:"#ff4d00",fontStyle:"italic",lineHeight:1}}>{visitData.today}</div>
              </div>
              <div style={{flex:1,background:"#0f0f0f",border:"1px solid #252525",borderRadius:6,padding:"12px 14px"}}>
                <div style={{fontSize:10,color:"#666",fontFamily:"Noto Sans JP,sans-serif",marginBottom:5}}>累計訪問</div>
                <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:32,color:"#aaa",fontStyle:"italic",lineHeight:1}}>{visitData.total}</div>
              </div>
            </div>
            {visitData.recent.length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#666",fontFamily:"Noto Sans JP,sans-serif",marginBottom:8}}>直近の記録</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {visitData.recent.slice(0,7).map((v,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 10px",background:"#141414",borderRadius:4,border:"1px solid #252525"}}>
                      <span style={{fontSize:11,color:"#888",fontFamily:"Noto Sans JP,sans-serif"}}>{fmtD(v.date)}</span>
                      <span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:14,color:"#aaa",fontStyle:"italic"}}>{v.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="bg" style={{width:"100%"}} onClick={()=>setShowVisits(false)}>閉じる</button>
          </div>
        </div>
      )}

      {showSearch&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowSearch(false)}>
          <div className="mo" style={{maxWidth:520,maxHeight:"80vh",overflowY:"auto",padding:"22px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4d00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:"#fff",fontStyle:"italic"}}>SEARCH</div>
            </div>
            <input className="inp" placeholder="名前、種目、イベント名、年代で検索…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} autoFocus style={{marginBottom:14,fontSize:14}}/>
            {searchResults&&(
              <div>
                {searchResults.members.length===0&&searchResults.trials.length===0&&(
                  <div style={{padding:"20px 0",textAlign:"center",color:"#555",fontSize:12,fontFamily:"Noto Sans JP,sans-serif"}}>該当する結果はありません</div>
                )}
                {searchResults.members.length>0&&(
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:10,color:"#666",fontFamily:"Noto Sans JP,sans-serif",marginBottom:8,letterSpacing:"0.05em"}}>メンバー（{searchResults.members.length}件）</div>
                    {searchResults.members.map(m=>{const cat=CMAP[m.category];return(
                      <div key={m.id} onClick={()=>openM(m.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#141414",border:"1px solid #252525",borderRadius:6,cursor:"pointer",marginBottom:6}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                            <span className="nm" style={{fontSize:14,color:"#fff"}}>{m.name}</span>
                            {cat&&<span className="cp" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`}}>{cat.s}</span>}
                            {m.currentOfficial===false&&<span style={{fontSize:8,color:"#6366f1",border:"1px solid #6366f128",background:"rgba(99,102,241,.08)",padding:"1px 4px",borderRadius:2,fontFamily:"Noto Sans JP,sans-serif"}}>オープン</span>}
                          </div>
                          <div style={{fontSize:9,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{m.trials.length}件の記録 · VDOT {m.vdot.toFixed(1)}</div>
                        </div>
                        <span style={{color:"#444",fontSize:14}}>›</span>
                      </div>
                    );})}
                  </div>
                )}
                {searchResults.trials.length>0&&(
                  <div>
                    <div style={{fontSize:10,color:"#666",fontFamily:"Noto Sans JP,sans-serif",marginBottom:8,letterSpacing:"0.05em"}}>記録（{searchResults.trials.length}件）</div>
                    {searchResults.trials.slice(0,30).map(t=>{const cat=CMAP[t.category];return(
                      <div key={t.id} onClick={()=>openM(t.memberId)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#141414",border:"1px solid #252525",borderRadius:6,cursor:"pointer",marginBottom:6}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"nowrap",minWidth:0}}>
                            <span className="nm" style={{fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0,flexShrink:1,color:"#fff"}}>{t.memberName}</span>
                            <span style={{fontSize:10,color:"#888",fontFamily:"Noto Sans JP,sans-serif",flexShrink:0}}>{t.distance}</span>
                            {t.event_name&&<span style={{fontSize:9,color:"#ff4d00",fontFamily:"Noto Sans JP,sans-serif",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{t.event_name}</span>}
                            {cat&&<span className="cp" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`,flexShrink:0}}>{cat.s}</span>}
                          </div>
                          <div style={{fontSize:9,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{fmtT(t.time)} · VDOT {t.vdot.toFixed(1)} · {fmtD(t.date)}</div>
                        </div>
                        <span style={{color:"#444",fontSize:14}}>›</span>
                      </div>
                    );})}
                    {searchResults.trials.length>30&&<div style={{fontSize:10,color:"#555",textAlign:"center",padding:"6px 0",fontFamily:"Noto Sans JP,sans-serif"}}>+ {searchResults.trials.length-30} 件の記録</div>}
                  </div>
                )}
              </div>
            )}
            <button className="bg" style={{width:"100%",marginTop:14}} onClick={()=>{setShowSearch(false);setSearchQ("");}}>閉じる</button>
          </div>
        </div>
      )}

      {showPin&&<PinModal onSuccess={()=>{setShowPin(false);if(pinCb){pinCb();setPinCb(null);}}} onClose={()=>{setShowPin(false);setPinCb(null);}}/>}
    </div>
  );
}

function MemberPage({member,onBack,onAddTrial,onDelTrial,onDelMember,requirePin,catRankMap,onEditTrial,editTrial,eForm,setEF,onSaveTrial,onCancelEdit,onRenameMember}){
  const [tab,setTab]=useState("history");
  const [openPrinciple,setOpenPrinciple]=useState(null);
  const [showRenameModal,setShowRenameModal]=useState(false);
  const [renameInput,setRenameInput]=useState(member.name);
  const [goals,setGoals]=useState([]);
  const [showAddGoal,setShowAddGoal]=useState(false);
  const [editGoalIdx,setEditGoalIdx]=useState(-1);
  const [goalForm,setGoalForm]=useState({name:"",date:"",distance:"5000m",h:"",m:"",s:"",cs:""});
  const [addR,renderR]=useRipple();
  const color=vc(member.vdot),rank=vrl(member.vdot),paces=getTP(member.vdot);
  const cat=CMAP[member.currentCategory||member.category];
  const chrono=[...member.trials].sort((a,b)=>a.date.localeCompare(b.date));
  const display=[...member.trials].sort((a,b)=>{const d=b.date.localeCompare(a.date);return d!==0?d:String(b.id).localeCompare(String(a.id));});
  const pbV=member.trials.length?Math.max(...member.trials.map(t=>t.vdot)):0;
  const pbT=member.trials.find(t=>t.vdot===pbV);
  // 種目ごとのPBマップ
  const pbByDist=useMemo(()=>{
    const map={};
    member.trials.forEach(t=>{
      if(!map[t.distance]||t.time<map[t.distance].time) map[t.distance]=t;
    });
    return map;
  },[member.trials]);
  const pbTrialIds=new Set(Object.values(pbByDist).map(t=>t.id));
  const paceItems=[{l:"E (イージー走)",v:paces.easy,c:"#22c55e",d:"会話できる楽なペース。ゆったり長時間走り、有酸素能力と回復力を高める。週の走行の大部分を占める基礎ペース。"},{l:"M (マラソンペース)",v:paces.marathon,c:"#3b82f6",d:"フルマラソンを走り切る目標ペース。脂肪燃焼効率を高め、長距離レースに必要な持久力を養う。"},{l:"T (閾値ペース)",v:paces.threshold,c:"#f97316",d:"乳酸が溜まり始める手前のキツめのペース。20〜40分の継続がLT値(乳酸性作業閾値)を引き上げレース中盤から後半の粘り強さを高める。"},{l:"I (インターバル)",v:paces.interval,c:"#ec4899",d:"3〜5分の高強度走と休息を繰り返す。最大酸素摂取量(VO2max)を高め、レース後半のスピード持久力を強化。"},{l:"R (レペティション)",v:paces.rep,c:"#a855f7",d:"短い距離(200〜600m)を高速で。十分な休息を挟む。ランニングエコノミーとスピード、神経筋系の効率性を改善。"}];

  return (
    <div>
      <header className="sh">
        <div style={{maxWidth:760,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:16,paddingBottom:18}}>
            <button onClick={onBack} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:30,lineHeight:1,padding:"0 4px",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="#666"}>‹</button>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"nowrap",minWidth:0}}>
                <span onContextMenu={e=>{e.preventDefault();setRenameInput(member.name);setShowRenameModal(true);}} onTouchStart={e=>{const timer=setTimeout(()=>{setRenameInput(member.name);setShowRenameModal(true);},600);e.currentTarget._lp=timer;}} onTouchEnd={e=>clearTimeout(e.currentTarget._lp)} onTouchMove={e=>clearTimeout(e.currentTarget._lp)} className="nm" style={{fontSize:30,letterSpacing:"-.01em",whiteSpace:"nowrap",color:"#fff",cursor:"pointer",userSelect:"none",WebkitUserSelect:"none",WebkitTouchCallout:"none",lineHeight:1.3,padding:"4px 0",display:"inline-block",textAlign:"left"}} title="長押しで名前を編集">{member.name}</span>
                <div style={{flex:1}}/>
                {member.currentOfficial===false&&<span style={{fontSize:10,fontFamily:"Noto Sans JP,sans-serif",fontWeight:600,color:"#fbbf24",border:"1px solid rgba(251,191,36,.3)",background:"rgba(251,191,36,.08)",padding:"2px 6px",borderRadius:3,flexShrink:0}}>オープン</span>}
                {cat&&<span className="cp" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`,flexShrink:0,fontSize:11,padding:"2px 7px"}}>{cat.s}</span>}
              </div>
              <div style={{display:"flex",alignItems:"baseline",gap:14}}>
                <div style={{display:"flex",alignItems:"baseline",gap:5}}>
                  <span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:34,color,lineHeight:1,fontStyle:"italic"}}><AnimatedNum v={member.vdot}/></span>
                  <span style={{fontSize:10,color:"#666",fontFamily:"Noto Sans JP,sans-serif"}}>VDOT</span>
                </div>
                <div style={{height:18,width:1,background:"#2a2a2a"}}/>
                <div style={{display:"flex",alignItems:"baseline",gap:5}}>
                  <span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:"#aaa",lineHeight:1,fontStyle:"italic"}}>{member.trials.length}</span>
                  <span style={{fontSize:10,color:"#666",fontFamily:"Noto Sans JP,sans-serif"}}>記録</span>
                </div>
                {member.currentOfficial!==false&&member.rank&&(
                  <>
                    <div style={{height:18,width:1,background:"#2a2a2a"}}/>
                    <div style={{display:"flex",alignItems:"baseline",gap:5}}>
                      <span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:"#aaa",lineHeight:1,fontStyle:"italic"}}>#{member.rank}</span>
                      <span style={{fontSize:10,color:"#666",fontFamily:"Noto Sans JP,sans-serif"}}>位</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="tab-bar">
            <button className={`ti ${tab==="history"?"on":""}`} onClick={()=>setTab("history")}>記録履歴</button>
            <button className={`ti ${tab==="paces"?"on":""}`} onClick={()=>setTab("paces")}>トレーニングペース</button>
            <button className={`ti ${tab==="goals"?"on":""}`} onClick={()=>setTab("goals")}>目標</button>
          </div>
        </div>
      </header>
      <main style={{maxWidth:760,margin:"0 auto",padding:"18px 14px"}}>
        {tab==="history"&&(
          <div className="pi">
            {Object.keys(pbByDist).length>0&&(
              <div className="card" style={{padding:"18px 20px",marginBottom:14,border:"1px solid rgba(245,158,11,.35)",background:"rgba(245,158,11,.04)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><span style={{fontSize:15}}>🏆</span><div style={{fontSize:11,color:"#f59e0b",fontWeight:700,fontFamily:"Noto Sans JP,sans-serif"}}>種目別自己ベスト</div></div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {DK.filter(d=>pbByDist[d]).map(d=>{const t=pbByDist[d];const c=vc(t.vdot);return(
                    <div key={d} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}><span style={{fontSize:10,color:"#666",fontFamily:"Noto Sans JP,sans-serif"}}>{d}</span>{t.event_name&&<span style={{fontSize:9,color:"#ff4d00",fontFamily:"Noto Sans JP,sans-serif"}}>{t.event_name}</span>}</div>
                        <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:24,color:"#f0f0f0",lineHeight:1,fontStyle:"italic"}}>{fmtT(t.time)}</div>
                        <div style={{fontSize:9,color:"#555",fontFamily:"Noto Sans JP,sans-serif",marginTop:2}}>{fmtD(t.date)}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:20,color:c,fontStyle:"italic"}}>{t.vdot.toFixed(1)}</div>
                        <div style={{fontSize:9,color:"#444",fontFamily:"Noto Sans JP,sans-serif"}}>VDOT</div>
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            )}
            {chrono.length>=2&&(
              <div className="card" style={{padding:"18px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}><div style={{width:3,height:13,background:"#ff4d00",borderRadius:2}}/><span style={{fontSize:11,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>VDOT・タイム推移</span></div>
                <Chart trials={chrono} color={color}/>
              </div>
            )}
            {display.map((t,i)=>{ const isPB=pbTrialIds.has(t.id),tc=vc(t.vdot); return (
              <div key={t.id} className={`tr fu ${isPB?"pb":""}`} style={{animationDelay:`${i*28}ms`,cursor:"pointer"}} onContextMenu={e=>{e.preventDefault();onEditTrial(t);}} onTouchStart={e=>{const timer=setTimeout(()=>onEditTrial(t),600);e.currentTarget._lp=timer;}} onTouchEnd={e=>{clearTimeout(e.currentTarget._lp);}} onTouchMove={e=>{clearTimeout(e.currentTarget._lp);}}>
                <div style={{flexShrink:0,minWidth:72}}>
                  <div style={{fontSize:11,color:"#888",fontFamily:"Noto Sans JP,sans-serif"}}>{fmtD(t.date)}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2,flexWrap:"wrap"}}>
                    {t.event_name&&<span style={{fontSize:9,color:"#ff4d00",fontFamily:"Noto Sans JP,sans-serif"}}>{t.event_name}</span>}
                    {!t.event_name&&t.id===display[0].id&&<span style={{fontSize:9,color:"#ff4d00",fontFamily:"Noto Sans JP,sans-serif"}}>最新</span>}
                    {t.category&&CMAP[t.category]&&<span className="cp" style={{fontSize:9,background:`${CMAP[t.category].c}15`,color:CMAP[t.category].c,border:`1px solid ${CMAP[t.category].c}28`}}>{CMAP[t.category].s}</span>}
                    {catRankMap&&catRankMap[t.id]&&<span style={{fontSize:10}}>{catRankMap[t.id].medal}</span>}
                  </div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}><span style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{t.distance}</span>{t.official===false&&<span style={{fontSize:8,color:"#fbbf24",border:"1px solid rgba(251,191,36,.3)",background:"rgba(251,191,36,.08)",padding:"1px 4px",borderRadius:2,fontFamily:"Noto Sans JP,sans-serif",fontWeight:600}}>オープン参加</span>}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:19,color:"#e0e0e0",fontStyle:"italic"}}>{fmtT(t.time)}</div>
                    {isPB&&<span style={{fontSize:10,fontWeight:700,background:"rgba(245,158,11,.12)",color:"#f59e0b",border:"1px solid rgba(245,158,11,.25)",borderRadius:3,padding:"2px 6px",fontFamily:"Noto Sans JP,sans-serif",flexShrink:0}}>PB</span>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginRight:6}}>
                  <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:tc,fontStyle:"italic"}}>{t.vdot.toFixed(1)}</div>
                  <div style={{fontSize:9,color:"#444",fontFamily:"Noto Sans JP,sans-serif"}}>VDOT</div>
                </div>
              </div>
            );})}
            {!member.trials.length&&<Empty label="まだ記録がありません"/>}
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:28}}><button className="bd" onClick={onDelMember}>メンバーを削除</button></div>
            {showRenameModal&&(
              <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowRenameModal(false)}>
                <div className="mo">
                  <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:18,color:"#fff",fontStyle:"italic",marginBottom:14}}>名前を編集</div>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div>
                      <div style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:11,color:"#888",marginBottom:6}}>新しい名前</div>
                      <input className="inp" placeholder="例: 田中 健" value={renameInput} onChange={e=>setRenameInput(e.target.value)} autoFocus/>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="bg" style={{flex:1}} onClick={()=>setShowRenameModal(false)}>キャンセル</button>
                      <button className="ba" style={{flex:2}} onClick={()=>{if(renameInput.trim()){onRenameMember(renameInput.trim());setShowRenameModal(false);}}}>更新する</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {editTrial&&(
              <div className="ov" onClick={e=>e.target===e.currentTarget&&onCancelEdit()}>
                <div className="mo">
                  <div style={{marginBottom:20}}><div style={{width:26,height:3,background:"#6366f1",borderRadius:2,marginBottom:8}}/><div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:21,color:"#fff",fontStyle:"italic"}}>記録を編集</div></div>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <FF label="イベント・大会名（任意）">
                      <input className="inp" placeholder="例：春季記録会、東京マラソン" value={eForm.event_name_input||""} onChange={e=>setEF(f=>({...f,event_name_input:e.target.value,event_no:""}))}/>
                    </FF>
                    <FF label="タイムトライアルの場合は回数">
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:13,color:"#aaa",whiteSpace:"nowrap"}}>第</span>
                        <input className="inp" type="number" min="1" placeholder="3" value={eForm.event_no||""} onChange={e=>setEF(f=>({...f,event_no:e.target.value,event_name_input:""}))} style={{width:90,textAlign:"center"}}/>
                        <span style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:13,color:"#aaa",whiteSpace:"nowrap"}}>回TT</span>
                        {eForm.event_no&&<span style={{fontSize:11,color:"#6366f1",fontFamily:"Noto Sans JP,sans-serif",fontWeight:700}}>第{eForm.event_no}回TT</span>}
                      </div>
                    </FF>
                    <FF label="年代"><CatSel value={eForm.category||member.category} onChange={v=>setEF(f=>({...f,category:v}))}/></FF>
                    <FF label="種目"><select className="inp" value={eForm.distance} onChange={e=>setEF(f=>({...f,distance:e.target.value}))}>{DK.map(d=>(<option key={d}>{d}</option>))}</select></FF>
                    <FF label="タイム"><TI vals={eForm} onChange={(k,v)=>setEF(f=>({...f,[k]:v}))}/></FF>
                    <FF label="日付"><input className="inp" type="date" value={eForm.date} onChange={e=>setEF(f=>({...f,date:e.target.value}))}/></FF>
                    <VP distance={eForm.distance} h={eForm.h} m={eForm.m} s={eForm.s} cs={eForm.cs}/>
                    <OfficialToggle value={eForm.official!==false} onChange={v=>setEF(f=>({...f,official:v}))}/>
                    <div style={{display:"flex",gap:8}}>
                      <button className="bg" style={{flex:1}} onClick={onCancelEdit}>キャンセル</button>
                      <button style={{flex:1,background:"transparent",color:"#ef4444",border:"1px solid rgba(239,68,68,.3)",borderRadius:4,fontSize:13,fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,cursor:"pointer",padding:"9px"}} onClick={()=>{if(confirm("この記録を削除しますか？")){onDelTrial(editTrial.id);onCancelEdit();}}}>削除</button>
                      <button style={{flex:1.5,background:"#6366f1",color:"#fff",border:"none",borderRadius:4,fontSize:13,fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,cursor:"pointer",padding:"9px"}} onClick={onSaveTrial}>保存</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {tab==="paces"&&(
          <div className="pi">
            <div className="card" style={{padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                <div style={{fontSize:9,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>現在のVDOT</div>
                <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:30,color,lineHeight:1,fontStyle:"italic"}}><AnimatedNum v={member.vdot}/></div>
              </div>
              <div style={{background:`${color}12`,border:`1px solid ${color}30`,borderRadius:4,padding:"4px 10px"}}>
                <div style={{fontSize:11,color,fontWeight:700,fontFamily:"Noto Sans JP,sans-serif"}}>{rank}</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {paceItems.map((p,i)=>(
                <div key={p.l} className="pc fu" style={{animationDelay:`${i*38}ms`,display:"flex",alignItems:"center",gap:10,padding:"7px 12px",height:74}}>
                  <div style={{flexShrink:0,minWidth:130,display:"flex",flexDirection:"column",justifyContent:"center"}}>
                    <div style={{fontSize:12,color:"#fbbf24",marginBottom:1,fontFamily:"Noto Sans JP,sans-serif",fontWeight:400}}>{p.l}</div>
                    <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:18,color:p.c,fontStyle:"italic",lineHeight:1}}>{p.v}<span style={{fontSize:10,color:"#444",fontStyle:"normal"}}>/km</span></div>
                  </div>
                  <div style={{flex:1,fontSize:10,color:"#888",fontFamily:"Noto Sans JP,sans-serif",lineHeight:1.5,borderLeft:`1px solid ${p.c}28`,paddingLeft:10,alignSelf:"stretch",display:"flex",alignItems:"center",overflow:"hidden"}}>{p.d}</div>
                </div>
              ))}
            </div>

            <div style={{marginTop:24,paddingTop:18,borderTop:"1px solid #1f1f1f"}}>
              <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:18,color:"#fff",fontStyle:"italic",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:3,height:16,background:"#ff4d00",borderRadius:2}}/>
                <span>トレーニングの原理原則</span>
              </div>

              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:"#888",fontFamily:"Noto Sans JP,sans-serif",fontWeight:600,marginBottom:6,letterSpacing:".05em"}}>📘 3原理</div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {[
                    {k:"p1",t:"過負荷の原理（オーバーロード）",d:"日常生活以上の負荷をかけることで、身体は初めて適応し能力が向上する。慣れた強度のままでは成長は止まる。"},
                    {k:"p2",t:"特異性の原理",d:"鍛えた能力しか伸びない。スピードを伸ばしたいならスピード系、持久力を伸ばしたいなら持久系の刺激を。目的に合った練習が結果を生む。"},
                    {k:"p3",t:"可逆性の原理",d:"鍛えた能力は使わなければ失われる。約2週間で低下が始まり、4〜6週間で大きく後退する。継続することが最も重要。"},
                  ].map((it,idx)=>{const isOpen=openPrinciple===it.k;return(
                    <div key={it.k} style={{background:"#141414",border:`1px solid ${isOpen?"#ff4d00":"#252525"}`,borderRadius:6,overflow:"hidden",transition:"border-color .2s"}}>
                      <button onClick={()=>setOpenPrinciple(isOpen?null:it.k)} style={{width:"100%",background:"none",border:"none",padding:"9px 12px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left"}}>
                        <span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:16,color:isOpen?"#ff4d00":"#666",fontStyle:"italic",lineHeight:1,flexShrink:0,minWidth:18}}>{idx+1}</span>
                        <span style={{fontSize:12,fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,color:isOpen?"#fff":"#aaa",flex:1}}>{it.t}</span>
                        <span style={{fontSize:11,color:isOpen?"#ff4d00":"#444",transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                      </button>
                      {isOpen&&<div style={{padding:"4px 14px 12px 40px",fontSize:11,color:"#888",fontFamily:"Noto Sans JP,sans-serif",lineHeight:1.7}}>{it.d}</div>}
                    </div>
                  );})}
                </div>
              </div>

              <div>
                <div style={{fontSize:11,color:"#888",fontFamily:"Noto Sans JP,sans-serif",fontWeight:600,marginBottom:6,letterSpacing:".05em"}}>📗 5原則</div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {[
                    {k:"r1",t:"漸進性の原則",d:"負荷は少しずつ上げる。急に強度や量を増やすと故障や燃え尽きの原因に。一歩ずつ着実に積み上げる。"},
                    {k:"r2",t:"全面性の原則",d:"一つの能力だけでなく、筋力・持久力・柔軟性・調整力など全身をバランスよく鍛える。偏りは伸び悩みと故障を生む。"},
                    {k:"r3",t:"個別性の原則",d:"他人と同じ練習が自分に合うとは限らない。年齢・経験・体力・体格によって最適なメニューは異なる。自分の身体と対話しながら進める。"},
                    {k:"r4",t:"意識性の原則",d:"「なぜこの練習をやるのか」を理解して取り組むほど効果は大きくなる。目的を持った1時間は、漫然とした3時間に勝る。"},
                    {k:"r5",t:"反復性の原則",d:"トレーニングは続けてこそ効果が出る。一度の追い込みより、適切な強度の繰り返しが本物の力を作る。継続は才能を超える。"},
                  ].map((it,idx)=>{const isOpen=openPrinciple===it.k;return(
                    <div key={it.k} style={{background:"#141414",border:`1px solid ${isOpen?"#ff4d00":"#252525"}`,borderRadius:6,overflow:"hidden",transition:"border-color .2s"}}>
                      <button onClick={()=>setOpenPrinciple(isOpen?null:it.k)} style={{width:"100%",background:"none",border:"none",padding:"9px 12px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left"}}>
                        <span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:16,color:isOpen?"#ff4d00":"#666",fontStyle:"italic",lineHeight:1,flexShrink:0,minWidth:18}}>{idx+1}</span>
                        <span style={{fontSize:12,fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,color:isOpen?"#fff":"#aaa",flex:1}}>{it.t}</span>
                        <span style={{fontSize:11,color:isOpen?"#ff4d00":"#444",transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                      </button>
                      {isOpen&&<div style={{padding:"4px 14px 12px 40px",fontSize:11,color:"#888",fontFamily:"Noto Sans JP,sans-serif",lineHeight:1.7}}>{it.d}</div>}
                    </div>
                  );})}
                </div>
              </div>
            </div>

          </div>
        )}

        {tab==="goals"&&(
          <div className="pi">
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
              <button className="ba" style={{fontSize:12,padding:"7px 14px"}} onClick={()=>{setGoalForm({name:"",date:"",distance:"5000m",h:"",m:"",s:"",cs:""});setEditGoalIdx(-1);setShowAddGoal(true);}}>＋ 目標を追加</button>
            </div>
            {goals.length===0&&<Empty label="目標がまだ設定されていません"/>}
            {goals.map((g,i)=>{
              const time=tocs(g.h,g.m,g.s,g.cs||0);
              const targetVdot=calcVDOT(DIST[g.distance],cs2sec(time));
              const gapNum=targetVdot-member.vdot;
              const gap=gapNum.toFixed(1);
              const today_d=new Date();today_d.setHours(0,0,0,0);
              const target_d=new Date(g.date);target_d.setHours(0,0,0,0);
              const days=Math.ceil((target_d-today_d)/(24*60*60*1000));
              const passed=days<0;
              const c=vc(targetVdot);
              const gapColor=gapNum>0.05?"#ef4444":gapNum<-0.05?"#22c55e":"#aaa";
              return (
                <div key={i} className="card fu" style={{padding:"16px 18px",marginBottom:12,animationDelay:`${i*40}ms`}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12,gap:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,fontSize:15,color:"#fff",marginBottom:3}}>{g.name||"無題の目標"}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",fontSize:11,color:"#888",fontFamily:"Noto Sans JP,sans-serif"}}>
                        <span>{fmtD(g.date)}</span>
                        <span style={{color:"#444"}}>·</span>
                        <span>{g.distance}</span>
                        <span style={{color:"#444"}}>·</span>
                        <span>目標 {fmtT(time)}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={()=>{setGoalForm({name:g.name,date:g.date,distance:g.distance,h:g.h,m:g.m,s:g.s,cs:g.cs||""});setEditGoalIdx(i);setShowAddGoal(true);}} style={{background:"transparent",border:"1px solid #252525",borderRadius:4,color:"#888",fontFamily:"Noto Sans JP,sans-serif",fontWeight:600,fontSize:11,padding:"4px 10px",cursor:"pointer"}}>編集</button>
                      <button onClick={()=>setGoals(goals.filter((_,j)=>j!==i))} style={{background:"transparent",border:"1px solid #2e2e2e",borderRadius:4,color:"#666",fontSize:11,padding:"4px 8px",cursor:"pointer",fontFamily:"Noto Sans JP,sans-serif"}}>削除</button>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,paddingTop:12,borderTop:"1px solid #252525"}}>
                    <div>
                      <div style={{fontSize:9,color:"#555",fontFamily:"Noto Sans JP,sans-serif",marginBottom:4}}>残り日数</div>
                      <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:passed?"#666":days<=30?"#ef4444":days<=90?"#f59e0b":"#3b82f6",fontStyle:"italic",lineHeight:1}}>{passed?"終了":days===0?"今日":`${days}`}<span style={{fontSize:11,marginLeft:3,color:"#444"}}>{passed||days===0?"":"日"}</span></div>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"#555",fontFamily:"Noto Sans JP,sans-serif",marginBottom:4}}>必要VDOT</div>
                      <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:c,fontStyle:"italic",lineHeight:1}}>{targetVdot.toFixed(1)}</div>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"#555",fontFamily:"Noto Sans JP,sans-serif",marginBottom:4}}>ギャップ</div>
                      <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:gapColor,fontStyle:"italic",lineHeight:1}}>{gapNum>=0?`+${gap}`:gap}</div>
                    </div>
                  </div>
                  <div style={{marginTop:10,padding:"8px 10px",background:gapNum>0.05?"rgba(239,68,68,.06)":"rgba(34,197,94,.06)",border:`1px solid ${gapNum>0.05?"rgba(239,68,68,.2)":"rgba(34,197,94,.2)"}`,borderRadius:6,fontSize:10,color:gapNum>0.05?"#fca5a5":"#86efac",fontFamily:"Noto Sans JP,sans-serif",lineHeight:1.5}}>
                    {passed?"目標日が過ぎています":gapNum>0.05?`目標達成にはVDOT を +${gap} 上げる必要があります`:gapNum<-0.05?`現在のVDOTは目標を ${Math.abs(gapNum).toFixed(1)} 上回っています ✓`:`現在のVDOTは目標と一致しています`}
                  </div>
                  {!passed&&gapNum>0.05&&(()=>{
                    const curP=getTP(member.vdot);
                    const tgtP=getTP(targetVdot);
                    const items=[
                      {l:"E (イージー走)",c:curP.easy,t:tgtP.easy,col:"#22c55e"},
                      {l:"M (マラソン)",c:curP.marathon,t:tgtP.marathon,col:"#3b82f6"},
                      {l:"T (閾値)",c:curP.threshold,t:tgtP.threshold,col:"#f97316"},
                      {l:"I (インターバル)",c:curP.interval,t:tgtP.interval,col:"#ec4899"},
                      {l:"R (レペティション)",c:curP.rep,t:tgtP.rep,col:"#a855f7"},
                    ];
                    return (
                      <div style={{marginTop:10,padding:"12px 14px",background:"#0f0f0f",border:"1px solid #252525",borderRadius:6}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,paddingBottom:6,borderBottom:"1px solid #252525"}}>
                          <div style={{fontSize:10,color:"#888",fontFamily:"Noto Sans JP,sans-serif",fontWeight:600}}>トレーニングペース比較</div>
                          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:9,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>
                            <span>現在</span>
                            <span style={{color:"#444"}}>→</span>
                            <span style={{color:"#aaa"}}>目標</span>
                          </div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {items.map(it=>(
                            <div key={it.l} style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{flex:"0 0 95px",fontSize:10,color:it.col,fontFamily:"Noto Sans JP,sans-serif",fontWeight:500}}>{it.l}</div>
                              <div style={{flex:1,display:"flex",alignItems:"center",gap:6,fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,fontStyle:"italic"}}>
                                <span style={{flex:1,textAlign:"right",fontSize:13,color:"#777"}}>{it.c}</span>
                                <span style={{color:"#444",fontSize:11}}>→</span>
                                <span style={{flex:1,fontSize:13,color:"#e0e0e0"}}>{it.t}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            {showAddGoal&&(
              <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowAddGoal(false)}>
                <div className="mo">
                  <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:18,color:"#fff",fontStyle:"italic",marginBottom:12}}>{editGoalIdx>=0?"目標を編集":"目標を追加"}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div>
                      <div style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:11,color:"#888",marginBottom:4}}>試合名・大会名</div>
                      <input className="inp" placeholder="例: 東京マラソン2026" value={goalForm.name} onChange={e=>setGoalForm(f=>({...f,name:e.target.value}))}/>
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:11,color:"#888",marginBottom:4}}>開催日</div>
                        <input className="inp" type="date" value={goalForm.date} onChange={e=>setGoalForm(f=>({...f,date:e.target.value}))}/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:11,color:"#888",marginBottom:4}}>種目</div>
                        <select className="inp" value={goalForm.distance} onChange={e=>setGoalForm(f=>({...f,distance:e.target.value}))}>{DK.map(d=>(<option key={d}>{d}</option>))}</select>
                      </div>
                    </div>
                    <div>
                      <div style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:11,color:"#888",marginBottom:4}}>目標タイム (時:分:秒.1/100秒)</div>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <input className="inp" type="number" placeholder="時" value={goalForm.h} onChange={e=>setGoalForm(f=>({...f,h:e.target.value}))} style={{flex:1,textAlign:"center",minWidth:0}}/>
                        <span style={{color:"#666"}}>:</span>
                        <input className="inp" type="number" placeholder="分" value={goalForm.m} onChange={e=>setGoalForm(f=>({...f,m:e.target.value}))} style={{flex:1,textAlign:"center",minWidth:0}}/>
                        <span style={{color:"#666"}}>:</span>
                        <input className="inp" type="number" placeholder="秒" value={goalForm.s} onChange={e=>setGoalForm(f=>({...f,s:e.target.value}))} style={{flex:1,textAlign:"center",minWidth:0}}/>
                        <span style={{color:"#666"}}>.</span>
                        <input className="inp" type="number" placeholder="00" max="99" value={goalForm.cs} onChange={e=>setGoalForm(f=>({...f,cs:e.target.value}))} style={{flex:1,textAlign:"center",minWidth:0}}/>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,marginTop:4}}>
                      <button className="bg" style={{flex:1}} onClick={()=>{setShowAddGoal(false);setEditGoalIdx(-1);}}>キャンセル</button>
                      <button className="ba" style={{flex:2}} onClick={()=>{
                        if(!goalForm.date||(!goalForm.h&&!goalForm.m&&!goalForm.s&&!goalForm.cs))return;
                        if(editGoalIdx>=0){
                          const newGoals=[...goals];newGoals[editGoalIdx]={...goalForm};
                          setGoals(newGoals.sort((a,b)=>a.date.localeCompare(b.date)));
                        }else{
                          setGoals([...goals,{...goalForm}].sort((a,b)=>a.date.localeCompare(b.date)));
                        }
                        setShowAddGoal(false);setEditGoalIdx(-1);
                      }}>{editGoalIdx>=0?"更新する":"追加する"}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function MCard({m,idx,onClick,allMembers}){
  const cat=CMAP[m.currentCategory||m.category];
  const i=idx;
  const rk=allMembers?getRank(allMembers,i,x=>-x.vdot):i+1;
  const rd=rankDisplay(rk);
  return (
    <div className={`dr fu ${rk===1?"gold":rk===2?"silver":rk===3?"bronze":""}`} style={{animationDelay:`${i*30}ms`}} onClick={onClick}>
      <div style={{flexShrink:0,width:26,textAlign:"center"}}>
        {rd.isMedal?<span style={{fontSize:17}}>{rd.medal}</span>:<span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:14,color:"#444"}}>{rd.medal}</span>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:1,flexWrap:"nowrap"}}>
          <span className="nm" style={{fontSize:15,letterSpacing:"-.01em",whiteSpace:"nowrap",textAlign:"left",color:"#fff"}}>{m.name}</span>
          <div style={{flex:1}}/>
          {m.currentOfficial===false&&<span className="vbadge" style={{color:"#fbbf24",border:"1px solid rgba(251,191,36,.3)",background:"rgba(251,191,36,.08)"}}>オープン</span>}
          {cat&&<span className="vbadge" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`}}>{cat.s}</span>}
        </div>
        {m.bestTrial&&(
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
            <span style={{fontSize:9,color:"#888",fontFamily:"Noto Sans JP,sans-serif"}}>{m.bestTrial.distance} {fmtT(m.bestTrial.time)}</span>
            {m.bestTrial.event_name&&<span style={{fontSize:9,color:"#ff4d00",fontFamily:"Noto Sans JP,sans-serif"}}>{m.bestTrial.event_name}</span>}
          </div>
        )}
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:20,color:"#e0e0e0",lineHeight:1,fontStyle:"italic"}}>{m.vdot.toFixed(1)}</div>
        <div style={{fontSize:9,color:vc(m.vdot),fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,marginTop:1}}>VDOT</div>
      </div>
      <span style={{color:"#333",fontSize:15,flexShrink:0}}>›</span>
    </div>
  );
}

export default App;
