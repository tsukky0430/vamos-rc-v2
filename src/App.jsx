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
  const ss=`${String(s).padStart(2,"0")}.${String(c).padStart(2,"0")}`;
  return h>0?`${h}:${String(m).padStart(2,"0")}:${ss}`:`${m}:${ss}`;
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
          <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#gl)"/>
          {shown.map((t,i)=>{ const x=cx(i),y=cy(t.vdot); return (
            <g key={t.id}>
              <circle cx={x} cy={y} r="4" fill={color} stroke="#0d0d0d" strokeWidth="2" filter="url(#gl)"/>
              <text x={x} y={y-11} textAnchor="middle" fill={color} fontSize="10" fontFamily="Barlow Condensed,sans-serif" fontWeight="700">{t.vdot.toFixed(1)}</text>
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

function TTPage({ttData,onOpenMember,requirePin}){
  const [selTT,setSelTT]=useState(ttData.length>0?ttData[0].event_no:null);
  const [selDist,setSelDist]=useState(null);
  const [ttInfo,setTTInfo]=useState({});
  const [editTT,setEditTT]=useState(null);
  const [editForm,setEditForm]=useState({weather:"",temp:"",humidity:"",startTime:""});
  const selTTData=ttData.find(t=>t.event_no===selTT)||null;
  const availDists=useMemo(()=>{ if(!selTTData)return []; return DK.filter(d=>selTTData.trials.some(t=>t.distance===d)); },[selTTData]);
  useEffect(()=>{ if(availDists.length>0&&(!selDist||!availDists.includes(selDist)))setSelDist(availDists[0]); },[availDists]);
  const ranking=useMemo(()=>{
    if(!selTTData||!selDist)return [];
    const map={};
    selTTData.trials.filter(t=>t.distance===selDist).forEach(t=>{ if(!map[t.memberId]||t.vdot>map[t.memberId].vdot)map[t.memberId]=t; });
    return Object.values(map).sort((a,b)=>a.time-b.time);
  },[selTTData,selDist]);

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
                    {i.startTime&&<span>{i.startTime}</span>}
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
              <div style={{flexShrink:0,width:32,textAlign:"center"}}>
                {rd.isMedal?<span style={{fontSize:20}}>{rd.medal}</span>:<span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:16,color:"#444"}}>{rd.medal}</span>}
              </div>
              <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"nowrap",minWidth:0}}>
                  <span style={{fontWeight:700,fontSize:18,fontFamily:"Noto Sans JP,sans-serif",letterSpacing:"-.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{row.memberName}</span>
                  {cat&&<span className="cp" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`,flexShrink:0}}>{cat.s}</span>}
                  {row.memberOfficial===false&&<span style={{fontSize:9,fontFamily:"Noto Sans JP,sans-serif",color:"#6366f1",border:"1px solid #6366f128",background:"rgba(99,102,241,.08)",padding:"2px 5px",borderRadius:3,flexShrink:0}}>オープン参加</span>}
                </div>
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
                <button className="ba" style={{flex:2}} onClick={()=>{setTTInfo({...ttInfo,[editTT]:{...editForm}});setEditTT(null);}}>保存</button>
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

@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,700;0,800;0,900;1,700&family=Noto+Sans+JP:wght@400;500;700&display=swap');
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
.dr{display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:6px;background:#1a1a1a;border:1px solid #252525;margin-bottom:5px;cursor:pointer;transition:border-color .2s,transform .25s;}
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
  const [searchQ,setSearchQ]=useState("");
  const [catTab,setCatTab]=useState("ranking");
  const [selCat,setSelCat]=useState("m_elem4");
  const [selDist,setSelDist]=useState("1000m");
  const [showAddM,setShowAddM]=useState(false);
  const [showAddT,setShowAddT]=useState(false);
  const [editTrial,setEditTrial]=useState(null);
  const [eForm,setEF]=useState({distance:"1000m",h:"",m:"",s:"",cs:"",date:today(),category:"",event_no:"",event_name_input:"",official:true});
  const [showReset,setShowReset]=useState(false);
  const [showPin,setShowPin]=useState(false);
  const [pinUnlocked,setPinUnlocked]=useState(false);
  const [pinCb,setPinCb]=useState(null);
  const [flash,setFlash]=useState(0);
  useEffect(()=>{ loadData(); },[flash]);
  async function loadData(){
    const {data:ms} = await sb.from("members").select("*");
    const {data:ts} = await sb.from("trials").select("*");
    if(!ms||!ts){setMembers([]);setLoading(false);return;}
    const memberMap = {};
    ms.forEach(m=>{memberMap[m.id]={...m,official:m.official!==false,trials:[]};});
    ts.forEach(t=>{
      if(memberMap[t.member_id]){
        memberMap[t.member_id].trials.push({
          id:t.id,
          distance:t.distance,
          time:t.time,
          date:t.date,
          vdot:Number(t.vdot),
          category:t.category,
          event_no:t.event_no,
          event_name:t.event_name,
          official:t.official!==false
        });
      }
    });
    setMembers(Object.values(memberMap).map(enrich));
    setLoading(false);
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
  async function reset(){
    await sb.from("trials").delete().neq("id","00000000-0000-0000-0000-000000000000");
    await sb.from("members").delete().neq("id","00000000-0000-0000-0000-000000000000");
    setShowReset(false);setFlash(n=>n+1);
  }

  if(loading)return(
    <div style={{minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0d0d0d"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:32,color:"#ff4d00",fontStyle:"italic",lineHeight:1.1}}>VAMOS RC</div><div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:48,color:"#ffe066",fontStyle:"italic",marginBottom:8,letterSpacing:"-0.02em"}}>RESULT</div>
        <div style={{fontSize:11,color:"#444",fontFamily:"Noto Sans JP,sans-serif"}}>読み込み中...</div>
      </div>
    </div>
  );
  return (
    <div style={{minHeight:"100vh",background:"#0d0d0d",color:"#f0f0f0"}}>
      <style>{CSS}</style>
      {flash>0&&<Toast key={flash}/>}

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
                <img src="data:image/png;base64,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8skntTx58mR4DvV+1KhRQ/cbpjiTFStWaLVr187wPDr5kSFwiMPX11f3y4TOnDnj1Bcz2XW0adPG6bcDzaz4+HjtmWeeyfDYuMpRsWJF7euvv5bCigM6cuSI9vrrrzvlGlopsDzYMWDAAC0mJkb9EkLTtPDwcK1fv36ayWTK8Ljl9PHcc8/J8/QAtmzZotWqVSvD46j3w2KxaE2aNNGWLl0qu6o4idTUVG3lypVa+/btNU9PzwzPqd6OfPnyaePGjZPZlk5q/PjxWt68eTM8r056ZAgc5tBbI73befzxxzM8Lno/vvzyS/Vh0p29e/dqISEhGR4bZz8KFy6sffzxx9qFCxfUb1k4mD179mi9e/d22OUStzukwHL/xzfffKN+anEbo0aNytUiyzPPPKP+lcR9SEhI0J544okMj6dej3Llyml///237meOOyubzabNnz9fK126dIbnVi9Hr169ZMaVC4iMjNRefvnlDM+vsx1GHNjq1avVSHdatmypRronjwns2LGDsLAwNXZq7dq1Y926dQwdOpRChQqpw8LBVK1ald9++41///2XMmXKqMPCSRkMBj7++GNee+01dUjcxgcffMC8efPIly+fOpTtPvzwQ6ZNm6bG4j54enry448/8tJLL6lDumI0GnnzzTfZuXMnPXv2xGAwqKcIJ2AwGOjYsSN79+5l6NChuLm5qae4LB8fH3788Uf++OMP3N3d1WHhZAoUKMD333/P4sWLKVWqlDrsNBy6wLJ27VrCw8PVWFcaNGigRrrm6+tL+fLl1Vh31q5dq0ZOy9vbm++++44lS5Y49S9TverQoQPbtm2jT58+6pBwQl988QVDhw5VY3EXHTp04IcffsDf318dyjYvvfQSI0aMUGPxAPz9/Rk7diyPPfaYOqQL9erVY8uWLYwZMwZvb291WDghT09PRo0axdq1a2ncuLE67HLKly/P7NmzGThwICaTSR0WTqx9+/YsWLCArl27qkNOwaELLPv372f//v1qrCshISHUrl1bjXWrdu3aeHl5qbGuXLt2jfXr16uxU2rTpg379+/nlVdeUYeEE/H392fKlCksXbqU4sWLq8PCCVgsFr799lveeecddUjch169ejF16lQsFos6lOW6devG999/L7MNsoCnpydTp05lwIAB6pDLCggIYNiwYaxatYo6derIz5GLMRgM1K9f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Nm2iffv2XLt2TR3KEnoosACkpaWRkJCAp6enNAt0UEOGDGH06NG3ZHPnzqVr1663ZMLxnDhxgjZt2nDq1Cl1KNt169aN2bNnq7EQ2apbt27MnTtXjbPMzz//zPPPP6/GLi81NZX169eza9cuzp07R3h4OKdPnyYqKopr165x8eJF9UMysFgsFC5cGH9/f3x8fPDy8iIoKIj69evToEEDatSooX6IbsydO5dnn302V66hTMBwNXR0fn5+un4T4u3tze7du9m2bZs65FJee+013Tf7mzx5MqtWrVJjhzFhwgQqVKigxkI8lKJFixIfH59tM7YeeeSRXGncl9OMRiPu7u7SE8mBVaxYkb1793L69Gnc3d1p0aIFw4YNy9BDRziegIAATp8+zZYtW9ShbFWnTh3++usv3felEzmvY8eOLFq0iIiICHUo0/LkycP48eN103sqKSmJw4cP89tvvzFixAh+/PFH5s6dy9atWzlw4ADnz58nKioqwwzHO7HZbMTExHDx4kXOnj3LyZMn2bt3LytWrGDp0qUsWrSIy5cvYzQa8fX11dVuguXLl2f16tWcPHlSHcp2TjmDpUKFCsydO1fXS0dmzJhBr1691NhlWCwW9u3bp+vnGKBZs2asW7dOjR1Cjx49+Pvvv6Uh2U2sVitpaWlcunSJM2fOEBcXh81muzFuMpnw8/OjWLFiBAQEYDabb7vri54lJycTEhJyX3duHpReZrAI53D27Fm2bduGl5cXlSpVolixYuopwkFt2bKFBg0aqHG2CQkJYfr06Tn6NYW42c6dO+natSvnzp1ThzLlk08+4X//+58au5zY2FhCQ0P59ddfWbduXY7viuvp6UmrVq3o1asXjz76KHnz5lVPcUlTp06lb9++apztnLLA4ubmxqRJk3j66afVId04e/Ys5cqVIzExUR1yCUWKFCEsLEzXF58nT56kdu3aDtlrx2w2c/jwYentkF4Q2LJlC+vXr2f9+vXs37+f8PBwSJ9JcHMBStM0bDYbBoOB0qVLU716dZo1a0aLFi0oX768FKvSffvtt7z22mtqnGlSYBFCZIXU1FQKFSrElStX1KEs5+Hhwbhx43jhhRfUISFy1M8//8zgwYNJTk5Whx6Km5sbYWFhLt3c1mazsXHjRkaMGMGaNWuwWq3qKTmuadOmDBw4kJ49e7r8TNfIyEi6dOmS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pEmT0Lp162duC20IZ86cQZs2bTiDhYiISCacwUJEREQWISMjA/v27UN+fr5YMggbGxu0bt0aO3fuxLVr17B06VL07t0bSqVSPBQtWrTAzz//jMjISAQHB8PX11fW5kp+fj727dvH5goREZGMOIOFiIiILIa3tzfWrFmDmjVriiVZ5eTkQKPRQKFQwMHBAdbW1uIhsoqJiUHXrl2hUqnEEhERERkIZ7AQERGRxQgLC8OuXbug1WrFkqwcHBygVCpRtmzZEm+u5Ofn459//mFzhYiISGacwUJEREQWpW7duvj777/RqFEjsWSWTp06BV9fX94eREREJDPOYCEiIiKLEh0djUWLFiE1NVUsmZ379+8jKCiIzRUiIqISwAYLERERWZxFixZh8+bNJX6rUEnKzc1FUFAQli9fLpaIiIhIBrxFiIiIiCySUqnE2rVr0aFDhxJfF0VuWq0Wf/31FwYOHCiWiIiISCZssBAREZHFUiqV2LhxI9q1aweFQiGWTZIkSdi/fz+6d+/OW4OIiIhKEG8RIiIiIouVkZGBHj16mM3tQlqtFrt27WJzhYiIqBSwwUJEREQW7WGTZeHChcjJyRHLJkOtVuPPP/9Enz592FwhIiIqBdYAfhBDIiIiIkuze/du3LhxA40aNYKrq6tJ3TKUnJyMH374AePHj4darRbLREREVAK4BgsRERHRY5RKJWbPno2ePXvC2dlZLBsVjUaDgwcPYtKkSQgLCxPLREREVILYYCEiIiJ6Cm9vb3zzzTfo0KEDHB0dxXKpkiQJKpUKv/76K5YtWyaWiYiIqBSwwUJERET0HF5eXhg9ejS6dOmCihUrluqtQ2q1GufOncNvv/2GVatWiWUiIiIqRWywEBERERVSt27d0L9/f/zvf/8rsWaLVqvFrVu3sGvXLixYsAAqlUo8hIiIiIwAGyxERERExdCiRQt07doVr7/+Oho2bAgXFxeUKVNGPKzINBoN7t27hwsXLmD//v3Yvn07mypEREQmgA0WIiIiIgPx8vJC48aNUb9+fVSrVg2urq6oXr26eNgjOTk5iI2NRU5ODk6dOoXo6GiEhoaKhxEREZEJYIOFiIiIiIiIiEhPVmJARERERERERERFwwYLEREREREREZGe2GAhIiIiIiIiItITGyxERERERERERHpig4WIiIiIiIiISE9ssBARERERERER6YkNFiIiIiIiIiIiPbHBQkRERERERESkJzZYiIiIiIiIiIj09H9iY6IOU+vZZwAAAABJRU5ErkJggg==" style={{height:36,objectFit:"contain"}} alt="VAMOS RC"/>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                  <button style={{fontSize:11,padding:"6px 10px",display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.12)",color:"#fff",border:"1px solid rgba(255,255,255,.3)",borderRadius:4,fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,cursor:"pointer"}} onClick={()=>setShowSearch(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                    <span>検索</span>
                  </button>
                  <button className="bg" style={{fontSize:11,padding:"6px 11px"}} onClick={()=>requirePin(()=>setShowReset(true))}>リセット</button>
                  <button className="ba rp-host" style={{fontSize:12,padding:"7px 14px"}} onClick={()=>requirePin(()=>setShowAddM(true))}>＋ 追加</button>
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
                      {rd.isMedal?<span style={{fontSize:20}}>{rd.medal}</span>:<span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:16,color:"#444"}}>{rd.medal}</span>}
                    </div>
                    <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"nowrap",minWidth:0}}>
                        <span style={{fontWeight:700,fontSize:18,fontFamily:"Noto Sans JP,sans-serif",letterSpacing:"-.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{row.name}</span>
                        {cat&&<span className="cp" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`,flexShrink:0}}>{cat.s}</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}><span style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{fmtD(row.date)}</span>{row.event_name&&<span style={{fontSize:9,color:"#ff4d00",fontFamily:"Noto Sans JP,sans-serif"}}>{row.event_name}</span>}</div>
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
                              <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"nowrap",minWidth:0}}>
                                  <span style={{fontWeight:700,fontSize:14,fontFamily:"Noto Sans JP,sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{row.memberName}</span>
                                  {row.event_name&&<span style={{fontSize:9,color:"#ff4d00",fontFamily:"Noto Sans JP,sans-serif",flexShrink:0}}>{row.event_name}</span>}
                                  {row.memberOfficial===false&&<span style={{fontSize:8,color:"#6366f1",border:"1px solid #6366f128",background:"rgba(99,102,241,.08)",padding:"1px 4px",borderRadius:2,fontFamily:"Noto Sans JP,sans-serif",flexShrink:0}}>オープン</span>}
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
                          <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"nowrap",minWidth:0}}>
                              <span style={{fontWeight:700,fontSize:15,fontFamily:"Noto Sans JP,sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{m.name}</span>
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
              <TTPage ttData={ttData} onOpenMember={openM} requirePin={requirePin}/>
            )}

            {mainTab==="ranking"&&(
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
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
                            <span style={{fontWeight:700,fontSize:14,fontFamily:"Noto Sans JP,sans-serif"}}>{m.name}</span>
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
                            <span style={{fontWeight:700,fontSize:13,fontFamily:"Noto Sans JP,sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0,flexShrink:1}}>{t.memberName}</span>
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

      {showReset&&<Modal onClose={()=>setShowReset(false)} title="データをリセット">
        <div style={{fontSize:13,color:"#777",lineHeight:1.7,marginBottom:16,fontFamily:"Noto Sans JP,sans-serif"}}>全データが削除されサンプルデータに戻ります。</div>
        <div style={{display:"flex",gap:8}}><button className="bg" style={{flex:1}} onClick={()=>setShowReset(false)}>キャンセル</button><button style={{flex:1,background:"#ef4444",color:"#fff",border:"none",borderRadius:4,fontSize:13,fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,cursor:"pointer",padding:"9px"}} onClick={reset}>リセット</button></div>
      </Modal>}

      {showPin&&<PinModal onSuccess={()=>{setShowPin(false);if(pinCb){pinCb();setPinCb(null);}}} onClose={()=>{setShowPin(false);setPinCb(null);}}/>}
    </div>
  );
}

function MemberPage({member,onBack,onAddTrial,onDelTrial,onDelMember,requirePin,catRankMap,onEditTrial,editTrial,eForm,setEF,onSaveTrial,onCancelEdit,onRenameMember}){
  const [tab,setTab]=useState("history");
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
          <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:12,paddingBottom:14}}>
            <button onClick={onBack} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:30,lineHeight:1,padding:"0 4px",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="#666"}>‹</button>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"nowrap",minWidth:0}}>
                <span onContextMenu={e=>{e.preventDefault();setRenameInput(member.name);setShowRenameModal(true);}} onTouchStart={e=>{const timer=setTimeout(()=>{setRenameInput(member.name);setShowRenameModal(true);},600);e.currentTarget._lp=timer;}} onTouchEnd={e=>clearTimeout(e.currentTarget._lp)} onTouchMove={e=>clearTimeout(e.currentTarget._lp)} style={{fontWeight:700,fontSize:30,fontFamily:"Noto Sans JP,sans-serif",letterSpacing:"-.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0,color:"#fff",cursor:"pointer",userSelect:"none",WebkitUserSelect:"none",WebkitTouchCallout:"none"}} title="長押しで名前を編集">{member.name}</span>
                {cat&&<span className="cp" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`,flexShrink:0,fontSize:11,padding:"2px 7px"}}>{cat.s}</span>}
                {member.currentOfficial===false&&<span style={{fontSize:9,fontFamily:"Noto Sans JP,sans-serif",color:"#6366f1",border:"1px solid #6366f128",background:"rgba(99,102,241,.08)",padding:"2px 5px",borderRadius:3,flexShrink:0}}>オープン参加</span>}
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
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
              <button className="ba rp-host" style={{fontSize:12,padding:"8px 16px"}} onClick={e=>{addR(e);requirePin(onAddTrial);}}>{renderR()}＋ タイムを記録</button>
            </div>
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
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}><span style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{t.distance}</span>{t.official===false&&<span style={{fontSize:8,color:"#6366f1",border:"1px solid #6366f128",background:"rgba(99,102,241,.08)",padding:"1px 4px",borderRadius:2,fontFamily:"Noto Sans JP,sans-serif"}}>オープン参加</span>}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:19,color:"#e0e0e0",fontStyle:"italic"}}>{fmtT(t.time)}</div>
                    {isPB&&<span style={{fontSize:10,fontWeight:700,background:"rgba(245,158,11,.12)",color:"#f59e0b",border:"1px solid rgba(245,158,11,.25)",borderRadius:3,padding:"2px 6px",fontFamily:"Noto Sans JP,sans-serif",flexShrink:0}}>PB</span>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginRight:6}}>
                  <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:tc,fontStyle:"italic"}}>{t.vdot.toFixed(1)}</div>
                  <div style={{fontSize:9,color:"#444",fontFamily:"Noto Sans JP,sans-serif"}}>VDOT</div>
                </div>
                <button className="bd" onClick={()=>onDelTrial(t.id)}>✕</button>
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
                      <button style={{flex:2,background:"#6366f1",color:"#fff",border:"none",borderRadius:4,fontSize:13,fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,cursor:"pointer",padding:"9px"}} onClick={onSaveTrial}>保存する</button>
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
                <div key={p.l} className="pc fu" style={{animationDelay:`${i*38}ms`,display:"flex",alignItems:"center",gap:10,padding:"7px 12px"}}>
                  <div style={{flexShrink:0,minWidth:130,display:"flex",flexDirection:"column",justifyContent:"center"}}>
                    <div style={{fontSize:12,color:"#fbbf24",marginBottom:1,fontFamily:"Noto Sans JP,sans-serif",fontWeight:400}}>{p.l}</div>
                    <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:18,color:p.c,fontStyle:"italic",lineHeight:1}}>{p.v}<span style={{fontSize:10,color:"#444",fontStyle:"normal"}}>/km</span></div>
                  </div>
                  <div style={{flex:1,fontSize:10,color:"#888",fontFamily:"Noto Sans JP,sans-serif",lineHeight:1.5,borderLeft:`1px solid ${p.c}28`,paddingLeft:10}}>{p.d}</div>
                </div>
              ))}
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
      <div style={{flexShrink:0,width:32,textAlign:"center"}}>
        {rd.isMedal?<span style={{fontSize:20}}>{rd.medal}</span>:<span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:16,color:"#444"}}>{rd.medal}</span>}
      </div>
      <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"nowrap",minWidth:0}}>
          <span style={{fontWeight:700,fontSize:18,fontFamily:"Noto Sans JP,sans-serif",letterSpacing:"-.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{m.name}</span>
          {cat&&<span className="cp" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`,flexShrink:0}}>{cat.s}</span>}
          {m.currentOfficial===false&&<span style={{fontSize:9,fontFamily:"Noto Sans JP,sans-serif",color:"#6366f1",border:"1px solid #6366f128",background:"rgba(99,102,241,.08)",padding:"2px 5px",borderRadius:3,flexShrink:0}}>オープン参加</span>}
        </div>
        {m.bestTrial&&(
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span style={{fontSize:10,color:"#888",fontFamily:"Noto Sans JP,sans-serif"}}>{m.bestTrial.distance} {fmtT(m.bestTrial.time)}</span>
            {m.bestTrial.event_name&&<span style={{fontSize:9,color:"#ff4d00",fontFamily:"Noto Sans JP,sans-serif"}}>{m.bestTrial.event_name}</span>}
          </div>
        )}
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:24,color:"#e0e0e0",lineHeight:1,fontStyle:"italic"}}>{m.vdot.toFixed(1)}</div>
        <div style={{fontSize:10,color:vc(m.vdot),fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,marginTop:2}}>VDOT</div>
      </div>
      <span style={{color:"#333",fontSize:15,flexShrink:0}}>›</span>
    </div>
  );
}

export default App;
