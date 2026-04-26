import { useState, useMemo, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://sawyhyylryjwglkggpjz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhd3loeXlscnlqd2dsa2dncGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODE5NjAsImV4cCI6MjA5MjY1Nzk2MH0.rRHDUP75KxqSI93JiJxuwAcyJyAiCd5oxNTE-SUzf6M";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

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
const ADMIN_PIN = "4433";

const mkT=(dist,h,m,s,date)=>{ const time=tocs(h,m,s,0); return{id:uid(),distance:dist,time,date,vdot:calcVDOT(DIST[dist],cs2sec(time)),category:"m_elem4",event_no:null,event_name:null}; };
const SEED=[
  {id:1,name:"田中 健",category:"m_30s",official:true,trials:[mkT("マラソン",3,12,0,"2023-04-15"),mkT("マラソン",2,58,0,"2024-11-03")]},
  {id:2,name:"佐藤 美咲",category:"f_20s",official:true,trials:[mkT("ハーフマラソン",1,35,0,"2023-09-17"),mkT("ハーフマラソン",1,28,30,"2024-10-14")]},
  {id:3,name:"鈴木 拓也",category:"m_hs",official:true,trials:[mkT("5000m",0,19,30,"2023-05-20"),mkT("5000m",0,17,45,"2024-09-08")]},
  {id:4,name:"山田 花子",category:"f_40s",official:true,trials:[mkT("10000m",0,44,10,"2023-07-01"),mkT("10000m",0,41,20,"2024-08-18")]},
  {id:5,name:"伊藤 誠",category:"m_50s",official:true,trials:[mkT("マラソン",3,48,0,"2023-03-12"),mkT("マラソン",3,25,0,"2024-10-06")]},
  {id:6,name:"中村 蒼",category:"m_jhs2",official:true,trials:[mkT("3000m",0,10,20,"2024-05-12"),mkT("3000m",0,9,45,"2024-10-08")]},
  {id:7,name:"松本 葵",category:"f_univ",official:true,trials:[mkT("5000m",0,16,30,"2023-09-02"),mkT("5000m",0,15,55,"2024-03-17")]},
  {id:8,name:"高橋 浩一",category:"m_60s",official:true,trials:[mkT("マラソン",4,10,0,"2023-06-04"),mkT("マラソン",3,58,30,"2024-04-14")]},
];
const enrich = (m) => {
  if(!m.trials.length) return {...m,vdot:0,bestTrial:null};
  const best=m.trials.reduce((a,b)=>b.vdot>a.vdot?b:a,m.trials[0]);
  return {...m,vdot:best.vdot,bestTrial:best};
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
            <div style={{display:"flex",gap:4,flexWrap:"nowrap",overflowX:"auto"}}>
              {row.groups.map((g,gi)=>[
                gi>0&&<div key={'sep'+gi} style={{width:8,flexShrink:0}}/>,
                ...CATS.filter(c=>c.g===g).map(c=>(
                  <button key={c.id} onClick={()=>onChange(c.id)}
                    style={{padding:"5px 6px",border:`1px solid ${value===c.id?c.c:"#2e2e2e"}`,borderRadius:4,cursor:"pointer",fontFamily:"Noto Sans JP,sans-serif",fontSize:10,fontWeight:600,background:value===c.id?`${c.c}18`:"#1a1a1a",color:value===c.id?c.c:"#555",whiteSpace:"nowrap",flexShrink:0}}>
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
        {[{v:true,l:"公式",desc:"ランキングに反映"},{v:false,l:"非公式",desc:"TTのみ掲載"}].map(opt=>(
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

function TTPage({ttData,onOpenMember}){
  const [selTT,setSelTT]=useState(ttData.length>0?ttData[0].event_no:null);
  const [selDist,setSelDist]=useState(null);
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
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
        {ttData.map(tt=>(
          <button key={tt.event_no} onClick={()=>setSelTT(tt.event_no)} style={{padding:"8px 16px",borderRadius:20,border:`1px solid ${selTT===tt.event_no?"#ff4d00":"#252525"}`,background:selTT===tt.event_no?"rgba(255,77,0,.12)":"#141414",color:selTT===tt.event_no?"#ff6b35":"#555",fontFamily:"Noto Sans JP,sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
            {tt.event_name}
          </button>
        ))}
      </div>
      {selTTData&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #252525"}}>
            <div style={{width:3,height:32,background:"#ff4d00",borderRadius:2,flexShrink:0}}/>
            <div>
              <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:"#ff4d00",fontStyle:"italic"}}>{selTTData.event_name}</div>
              <div style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{selTTData.trials.length}件の記録</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
            {availDists.map(d=>(<button key={d} className={`dist-pill ${selDist===d?"sel":""}`} onClick={()=>setSelDist(d)}>{d}</button>))}
          </div>
          {ranking.length===0&&<Empty label="この種目の記録がありません"/>}
          {ranking.map((row,i)=>{ const cat=CMAP[row.memberCategory||row.category]; const c=vc(row.vdot); return (
            <div key={row.memberId} className={`dr fu ${i===0?"gold":i===1?"silver":i===2?"bronze":""}`} style={{animationDelay:`${i*30}ms`}} onClick={()=>onOpenMember(row.memberId)}>
              <div style={{flexShrink:0,width:32,textAlign:"center"}}>
                {i<3?<span style={{fontSize:20}}>{["🥇","🥈","🥉"][i]}</span>:<span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:16,color:"#444"}}>{i+1}</span>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                  <span style={{fontWeight:700,fontSize:18,fontFamily:"Noto Sans JP,sans-serif",letterSpacing:"-.01em"}}>{row.memberName}</span>
                  {cat&&<span className="cp" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`}}>{cat.s}</span>}
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
    </div>
  );
}

const CSS=`
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
.tr{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:8px;background:#1a1a1a;border:1px solid #252525;margin-bottom:7px;transition:border-color .2s,transform .25s;}
.tr:hover{border-color:#333;transform:translateX(4px);}
.tr.pb{border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.04);}
.cr{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:8px;background:#1a1a1a;border:1px solid #252525;margin-bottom:7px;cursor:pointer;transition:border-color .2s,transform .25s;}
.cr:hover{border-color:#333;transform:translateX(3px);}
.cr.t1{border-color:rgba(245,158,11,.35);background:rgba(245,158,11,.04);}
.rc{background:#1a1a1a;border:1px solid #252525;border-radius:8px;padding:13px 15px;transition:border-color .2s,transform .2s;}
.rc:hover{border-color:#333;transform:translateY(-2px);}
.pc{background:#1a1a1a;border:1px solid #252525;border-radius:8px;padding:13px 15px;transition:border-color .2s,transform .2s;}
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
.ov{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:flex-end;justify-content:center;z-index:300;backdrop-filter:blur(8px);}
.mo{background:#141414;border:1px solid #2e2e2e;border-radius:12px 12px 0 0;padding:26px 22px 38px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;animation:mi .3s cubic-bezier(.34,1.4,.64,1) both;}
.sh{background:rgba(13,13,13,.95);border-bottom:1px solid #252525;backdrop-filter:blur(12px);position:sticky;top:0;z-index:50;}
.dist-pill{display:inline-flex;align-items:center;padding:7px 14px;border-radius:20px;border:1px solid #252525;background:#141414;cursor:pointer;font-family:'Noto Sans JP',sans-serif;font-size:13px;font-weight:600;color:#555;transition:all .2s;white-space:nowrap;}
.dist-pill:hover{border-color:#444;color:#aaa;}
.dist-pill.sel{background:rgba(255,77,0,.12);border-color:#ff4d00;color:#ff6b35;}
.dr{display:flex;align-items:center;gap:10px;padding:13px 16px;border-radius:8px;background:#1a1a1a;border:1px solid #252525;margin-bottom:7px;cursor:pointer;transition:border-color .2s,transform .25s;}
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
    setLoading(true);
    const [{data:mRows},{data:tRows}]=await Promise.all([
      sb.from("members").select("*"),
      sb.from("trials").select("*").order("date",{ascending:true})
    ]);
    const built=(mRows||[]).map(m=>enrich({
      id:m.id,name:m.name,category:m.category,official:m.official!==false,
      trials:(tRows||[]).filter(t=>t.member_id===m.id).map(t=>({
        id:t.id,distance:t.distance,time:t.time,date:t.date,
        vdot:parseFloat(t.vdot),category:t.category||m.category,
        event_no:t.event_no||null,event_name:t.event_name||null,
        official:t.official!==false
      }))
    }));
    setMembers(built);
    setLoading(false);
  }

  const [mForm,setMF]=useState({name:"",category:"m_elem4",distance:"1000m",h:"",m:"",s:"",cs:"",date:today(),event_no:"",event_name_input:"",official:true});
  const [tForm,setTF]=useState({distance:"1000m",h:"",m:"",s:"",cs:"",date:today(),category:"",event_no:"",event_name_input:"",official:true});

  const sorted=useMemo(()=>[...members].filter(m=>m.official!==false).sort((a,b)=>b.vdot-a.vdot).map((m,i)=>({...m,rank:i+1})),[members]);
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
      members.filter(m=>m.official!==false).forEach(m=>{
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
    sorted.filter(m=>m.official!==false).forEach(m=>{
      const catTrials=m.trials.filter(t=>t.category===selCat);
      if(!catTrials.length)return;
      const best=catTrials.reduce((a,b)=>b.vdot>a.vdot?b:a,catTrials[0]);
      rows.push({...m,catVdot:best.vdot,catBestTrial:best});
    });
    return rows.sort((a,b)=>b.catVdot-a.catVdot);
  },[sorted,selCat]);
  const catRecs=useMemo(()=>{const map={};members.filter(m=>m.official!==false).forEach(m=>m.trials.filter(t=>t.category===selCat).forEach(t=>{if(!map[t.distance]||t.vdot>map[t.distance].vdot)map[t.distance]={...t,memberName:m.name};}));return map;},[members,selCat]);
  const ttData=useMemo(()=>{
    const map={};
    members.forEach(m=>{
      m.trials.filter(t=>t.event_no).forEach(t=>{
        const no=t.event_no;
        if(!map[no])map[no]={event_no:no,event_name:t.event_name||`第${no}回TT`,trials:[],date:t.date};
        map[no].trials.push({...t,memberName:m.name,memberCategory:m.category||t.category,memberId:m.id});
        if(t.date>map[no].date)map[no].date=t.date;
      });
    });
    return Object.values(map).sort((a,b)=>b.event_no-a.event_no);
  },[members]);
  const distRanking=useMemo(()=>{
    const rows=[];
    members.filter(m=>m.official!==false).forEach(m=>{
      const ts=m.trials.filter(t=>t.distance===selDist);
      if(!ts.length)return;
      const best=ts.reduce((a,b)=>b.vdot>a.vdot?b:a,ts[0]);
      rows.push({memberId:m.id,name:m.name,category:m.category,time:best.time,vdot:best.vdot,date:best.date});
    });
    return rows.sort((a,b)=>a.time-b.time);
  },[members,selDist]);
  const avg=members.length?(members.reduce((a,b)=>a+b.vdot,0)/members.length).toFixed(1):"—";
  const max=members.length?Math.max(...members.map(m=>m.vdot)).toFixed(1):"—";
  const selCO=CMAP[selCat];


  function openM(id){setActiveId(id);setPage("member");}
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
    const time=tocs(tForm.h,tForm.m,tForm.s,tForm.cs);if(time===0)return;
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
  function reset(){setShowReset(false);}

  if(loading)return(
    <div style={{minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0d0d0d"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:32,color:"#ff4d00",fontStyle:"italic",marginBottom:8}}>VAMOS RC</div>
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
          onCancelEdit={()=>setEditTrial(null)}/>
      )}

      {page==="ranking"&&(
        <div>
          <header className="sh">
            <div style={{maxWidth:760,margin:"0 auto",padding:"0 16px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:58}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,fontStyle:"italic",color:"#fff"}}>VAMOS<span style={{color:"#ff4d00"}}>RC</span></div>
                <div style={{display:"flex",gap:7}}>
                  <button className="bg" style={{fontSize:11,padding:"6px 11px"}} onClick={()=>requirePin(()=>setShowReset(true))}>リセット</button>
                  <button className="ba rp-host" style={{fontSize:12,padding:"7px 14px"}} onClick={()=>requirePin(()=>setShowAddM(true))}>＋ 追加</button>
                </div>
              </div>
            </div>
            <div style={{maxWidth:760,margin:"0 auto",padding:"0 16px"}}>
              <div className="tab-bar">
                <button className={`ti ${mainTab==="events"?"on":""}`} onClick={()=>setMainTab("events")}>種目別</button>
                <button className={`ti ${mainTab==="categories"?"on":""}`} onClick={()=>setMainTab("categories")}>カテゴリー別</button>
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
                {distRanking.map((row,i)=>{ const cat=CMAP[row.category]; const c=vc(row.vdot); const cls=i===0?"gold":i===1?"silver":i===2?"bronze":""; return (
                  <div key={row.memberId} className={`dr fu ${cls}`} style={{animationDelay:`${i*30}ms`}} onClick={()=>openM(row.memberId)}>
                    <div style={{flexShrink:0,width:32,textAlign:"center"}}>
                      {i<3?<span style={{fontSize:20}}>{["🥇","🥈","🥉"][i]}</span>:<span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:16,color:"#444"}}>{i+1}</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                        <span style={{fontWeight:700,fontSize:18,fontFamily:"Noto Sans JP,sans-serif",letterSpacing:"-.01em"}}>{row.name}</span>
                        {cat&&<span className="cp" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`}}>{cat.s}</span>}
                      </div>
                      <div style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{fmtD(row.date)}</div>
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
                  <button className={`ti ${catTab==="records"?"on":""}`} onClick={()=>setCatTab("records")}>カテゴリー記録</button>
                </div>
                <div className="card" style={{borderRadius:"0 0 8px 8px",padding:"14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:12,borderBottom:"1px solid #252525"}}>
                    <div style={{width:4,height:32,background:selCO.c,borderRadius:2,flexShrink:0}}/>
                    <div>
                      <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:20,color:selCO.c,fontStyle:"italic"}}>{selCO.l}</div>
                      <div style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{catMs.length}名 · {Object.keys(catRecs).length}種目記録あり</div>
                    </div>
                  </div>
                  {catTab==="ranking"&&(
                    <div>
                      {catMs.length===0&&<Empty label="このカテゴリーにメンバーがいません"/>}
                      {catMs.map((m,i)=>(
                        <div key={m.id} className={`cr fu ${i===0?"t1":""}`} style={{animationDelay:`${i*32}ms`}} onClick={()=>openM(m.id)}>
                          <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:15,width:26,textAlign:"center",flexShrink:0,color:i===0?"#f59e0b":i===1?"#9ca3af":i===2?"#cd7c32":"#444"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:18,marginBottom:2,fontFamily:"Noto Sans JP,sans-serif",letterSpacing:"-.01em"}}>{m.name}</div>
                            <div style={{fontSize:11,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{m.catBestTrial?.distance}&nbsp;<span style={{color:"#888"}}>{m.catBestTrial?fmtT(m.catBestTrial.time):""}</span></div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:26,color:vc(m.catVdot),fontStyle:"italic"}}>{m.catVdot.toFixed(1)}</div>
                            <div style={{fontSize:9,color:"#444",fontFamily:"Noto Sans JP,sans-serif"}}>VDOT</div>
                          </div>
                          <span style={{color:"#333",fontSize:15,flexShrink:0}}>›</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {catTab==="records"&&(
                    <div>
                      {Object.keys(catRecs).length===0&&<Empty label="記録がありません"/>}
                      {DK.filter(d=>catRecs[d]).map((dist,i)=>{ const rec=catRecs[dist],c=vc(rec.vdot); return (
                        <div key={dist} className="rc fu" style={{animationDelay:`${i*32}ms`,marginBottom:8}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                            <div><div style={{fontSize:9,color:"#555",marginBottom:3,fontFamily:"Noto Sans JP,sans-serif"}}>{dist}</div><div style={{fontWeight:700,fontSize:16,fontFamily:"Noto Sans JP,sans-serif"}}>{rec.memberName}</div></div>
                            <div style={{textAlign:"right"}}><div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:c,fontStyle:"italic"}}>{rec.vdot.toFixed(1)}</div><div style={{fontSize:9,color:"#444",fontFamily:"Noto Sans JP,sans-serif"}}>VDOT</div></div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:18,color:"#ddd",fontStyle:"italic"}}>{fmtT(rec.time)}</div>
                            <div style={{fontSize:11,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{fmtD(rec.date)}</div>
                          </div>
                        </div>
                      );})}
                    </div>
                  )}
                </div>
              </div>
            )}

            {mainTab==="tt"&&(
              <TTPage ttData={ttData} onOpenMember={openM}/>
            )}

            {mainTab==="ranking"&&(
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {sorted.map((m,idx)=>(<MCard key={m.id} m={m} idx={idx} onClick={()=>openM(m.id)}/>))}
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
            {[{v:true,l:"公式メンバー",desc:"ランキングに掲載"},{v:false,l:"非公式メンバー",desc:"TTのみ掲載"}].map(opt=>(
              <button key={String(opt.v)} onClick={()=>setMF(f=>({...f,official:opt.v}))}
                style={{flex:1,padding:"10px 8px",border:`1px solid ${mForm.official===opt.v?(opt.v?"#ff4d00":"#6366f1"):"#2e2e2e"}`,borderRadius:6,cursor:"pointer",background:mForm.official===opt.v?(opt.v?"rgba(255,77,0,.12)":"rgba(99,102,241,.12)"):"#141414",transition:"all .2s"}}>
                <div style={{fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,fontSize:12,color:mForm.official===opt.v?(opt.v?"#ff4d00":"#818cf8"):"#555",marginBottom:2}}>{opt.l}</div>
                <div style={{fontFamily:"Noto Sans JP,sans-serif",fontSize:9,color:mForm.official===opt.v?"#666":"#444"}}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </FF>
        <FF label="カテゴリー"><CatSel value={mForm.category} onChange={v=>setMF(f=>({...f,category:v}))}/></FF>
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
        <FF label="カテゴリー（変更可）"><CatSel value={tForm.category||am?.category||"m_elem4"} onChange={v=>setTF(f=>({...f,category:v}))}/></FF>
        <FF label="種目"><select className="inp" value={tForm.distance} onChange={e=>setTF(f=>({...f,distance:e.target.value}))}>{DK.map(d=>(<option key={d}>{d}</option>))}</select></FF>
        <FF label="タイム"><TI vals={tForm} onChange={(k,v)=>setTF(f=>({...f,[k]:v}))}/></FF>
        <FF label="日付"><input className="inp" type="date" value={tForm.date} onChange={e=>setTF(f=>({...f,date:e.target.value}))}/></FF>
        <VP distance={tForm.distance} h={tForm.h} m={tForm.m} s={tForm.s} cs={tForm.cs}/>
        <OfficialToggle value={tForm.official!==false} onChange={v=>setTF(f=>({...f,official:v}))}/>
        <div style={{display:"flex",gap:8}}><button className="bg" style={{flex:1}} onClick={()=>setShowAddT(false)}>キャンセル</button><button className="ba" style={{flex:2}} onClick={addTrial}>記録する</button></div>
      </Modal>}

      {showReset&&<Modal onClose={()=>setShowReset(false)} title="データをリセット">
        <div style={{fontSize:13,color:"#777",lineHeight:1.7,marginBottom:16,fontFamily:"Noto Sans JP,sans-serif"}}>全データが削除されサンプルデータに戻ります。</div>
        <div style={{display:"flex",gap:8}}><button className="bg" style={{flex:1}} onClick={()=>setShowReset(false)}>キャンセル</button><button style={{flex:1,background:"#ef4444",color:"#fff",border:"none",borderRadius:4,fontSize:13,fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,cursor:"pointer",padding:"9px"}} onClick={reset}>リセット</button></div>
      </Modal>}

      {showPin&&<PinModal onSuccess={()=>{setShowPin(false);if(pinCb){pinCb();setPinCb(null);}}} onClose={()=>{setShowPin(false);setPinCb(null);}}/>}
    </div>
  );
}

function MemberPage({member,onBack,onAddTrial,onDelTrial,onDelMember,requirePin,catRankMap,onEditTrial,editTrial,eForm,setEF,onSaveTrial,onCancelEdit}){
  const [tab,setTab]=useState("history");
  const [addR,renderR]=useRipple();
  const color=vc(member.vdot),rank=vrl(member.vdot),paces=getTP(member.vdot);
  const cat=member.bestTrial?.category?CMAP[member.bestTrial.category]:CMAP[member.category];
  const chrono=[...member.trials].sort((a,b)=>a.date.localeCompare(b.date));
  const display=[...member.trials].sort((a,b)=>b.date.localeCompare(a.date));
  const pbV=member.trials.length?Math.max(...member.trials.map(t=>t.vdot)):0;
  const pbT=member.trials.find(t=>t.vdot===pbV);
  const paceItems=[{l:"イージー走",v:paces.easy,c:"#22c55e"},{l:"マラソンペース",v:paces.marathon,c:"#3b82f6"},{l:"閾値ペース",v:paces.threshold,c:"#f97316"},{l:"インターバル",v:paces.interval,c:"#ec4899"},{l:"レペティション",v:paces.rep,c:"#a855f7"}];

  return (
    <div>
      <header className="sh">
        <div style={{maxWidth:760,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,height:58}}>
            <button onClick={onBack} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:26,lineHeight:1,padding:"0 4px"}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="#666"}>‹</button>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                <span style={{fontWeight:700,fontSize:20,fontFamily:"Noto Sans JP,sans-serif",letterSpacing:"-.01em"}}>{member.name}</span>
                {member.official===false&&<span style={{fontSize:9,fontFamily:"Noto Sans JP,sans-serif",color:"#6366f1",border:"1px solid #6366f128",background:"rgba(99,102,241,.08)",padding:"2px 5px",borderRadius:3}}>非公式</span>}
                {cat&&<span className="cp" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`}}>{cat.s}</span>}
              </div>
              <div style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{member.official===false?"非公式メンバー":member.rank?`#${member.rank}位 · ${rank}`:rank}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:32,color,lineHeight:1,fontStyle:"italic"}}><AnimatedNum v={member.vdot}/></div>
              <div style={{fontSize:9,color:"#444",fontFamily:"Noto Sans JP,sans-serif"}}>VDOT</div>
            </div>
          </div>
          <div className="tab-bar">
            <button className={`ti ${tab==="history"?"on":""}`} onClick={()=>setTab("history")}>記録履歴</button>
            <button className={`ti ${tab==="paces"?"on":""}`} onClick={()=>setTab("paces")}>トレーニングペース</button>
          </div>
        </div>
      </header>
      <main style={{maxWidth:760,margin:"0 auto",padding:"18px 14px"}}>
        {tab==="history"&&(
          <div className="pi">
            {pbT&&(
              <div className="card" style={{padding:"18px 20px",marginBottom:14,border:"1px solid rgba(245,158,11,.35)",background:"rgba(245,158,11,.04)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:15}}>🏆</span><div style={{fontSize:11,color:"#f59e0b",fontWeight:700,fontFamily:"Noto Sans JP,sans-serif"}}>自己ベスト（PB）</div></div>
                <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:10,color:"#666",marginBottom:4,fontFamily:"Noto Sans JP,sans-serif"}}>{pbT.distance}{pbT.event_name&&` (${pbT.event_name})`}</div>
                    <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:38,color:"#f0f0f0",lineHeight:1,fontStyle:"italic"}}>{fmtT(pbT.time)}</div>
                    <div style={{fontSize:10,color:"#666",marginTop:4,fontFamily:"Noto Sans JP,sans-serif"}}>{fmtD(pbT.date)}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:48,color,lineHeight:1,fontStyle:"italic"}}><AnimatedNum v={pbV}/></div>
                    <div style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>VDOT</div>
                  </div>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:9,marginBottom:14}}>
              <div className="card" style={{flex:1,padding:"12px 14px"}}>
                <div style={{fontSize:9,color:"#555",marginBottom:5,fontFamily:"Noto Sans JP,sans-serif"}}>記録回数</div>
                <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22,color:"#ddd",marginTop:3,fontStyle:"italic"}}>{member.trials.length}回</div>
              </div>
            </div>
            {chrono.length>=2&&(
              <div className="card" style={{padding:"18px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}><div style={{width:3,height:13,background:"#ff4d00",borderRadius:2}}/><span style={{fontSize:11,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>VDOT・タイム推移</span></div>
                <Chart trials={chrono} color={color}/>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
              <button className="ba rp-host" style={{fontSize:12,padding:"8px 16px"}} onClick={e=>{addR(e);requirePin(onAddTrial);}}>{renderR()}＋ タイムを記録</button>
            </div>
            {display.map((t,i)=>{ const isPB=t.vdot===pbV,tc=vc(t.vdot); return (
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
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}><span style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{t.distance}</span>{t.official===false&&<span style={{fontSize:8,color:"#6366f1",border:"1px solid #6366f128",background:"rgba(99,102,241,.08)",padding:"1px 4px",borderRadius:2,fontFamily:"Noto Sans JP,sans-serif"}}>非公式</span>}</div>
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
                    <FF label="カテゴリー"><CatSel value={eForm.category||member.category} onChange={v=>setEF(f=>({...f,category:v}))}/></FF>
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
            <div className="card" style={{padding:"20px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:9,color:"#555",marginBottom:5,fontFamily:"Noto Sans JP,sans-serif"}}>現在のVDOT</div>
                <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:50,color,lineHeight:1,fontStyle:"italic"}}><AnimatedNum v={member.vdot}/></div>
              </div>
              <div style={{background:`${color}12`,border:`1px solid ${color}30`,borderRadius:4,padding:"9px 16px"}}>
                <div style={{fontSize:13,color,fontWeight:700,fontFamily:"Noto Sans JP,sans-serif"}}>{rank}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
              {paceItems.map((p,i)=>(
                <div key={p.l} className="pc fu" style={{animationDelay:`${i*38}ms`}}>
                  <div style={{fontSize:9,color:"#555",marginBottom:5,fontFamily:"Noto Sans JP,sans-serif"}}>{p.l}</div>
                  <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:20,color:p.c,marginBottom:3,fontStyle:"italic"}}>{p.v}<span style={{fontSize:11,color:"#444",fontStyle:"normal"}}>/km</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MCard({m,idx,onClick}){
  const [addR,renderR]=useRipple();
  const color=vc(m.vdot);
  const cat=m.bestTrial?.category?CMAP[m.bestTrial.category]:CMAP[m.category];
  const bw=Math.min(100,Math.max(3,((m.vdot-20)/65)*100));
  return (
    <div className="mc rp-host fu" style={{padding:"14px 16px",animationDelay:`${idx*35}ms`}} onClick={e=>{addR(e);onClick();}}>
      {renderR()}
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:28,flexShrink:0,textAlign:"center",fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:13,color:"#3a3a3a"}}>{m.rank}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
            <span style={{fontWeight:700,fontSize:20,fontFamily:"Noto Sans JP,sans-serif",letterSpacing:"-.01em"}}>{m.name}</span>
            {m.official===false&&<span style={{fontSize:9,fontFamily:"Noto Sans JP,sans-serif",color:"#6366f1",border:"1px solid #6366f128",background:"rgba(99,102,241,.08)",padding:"2px 5px",borderRadius:3}}>非公式</span>}
            {cat&&<span className="cp" style={{background:`${cat.c}15`,color:cat.c,border:`1px solid ${cat.c}28`}}>{cat.s}</span>}
          </div>
          {m.bestTrial&&(
            <div style={{display:"flex",alignItems:"baseline",gap:5,marginBottom:2}}>
              <span style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,fontSize:14,color:"#aaa"}}>{fmtT(m.bestTrial.time)}</span>
              <span style={{fontSize:10,color:"#555",fontFamily:"Noto Sans JP,sans-serif"}}>{m.bestTrial.distance}</span>
            </div>
          )}
          <div style={{fontSize:9,color:"#333",fontFamily:"Noto Sans JP,sans-serif"}}>{m.trials.length}件の記録</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:24,color,lineHeight:1,fontStyle:"italic"}}>{m.vdot.toFixed(1)}</div>
          <div style={{fontSize:9,color:"#444",fontFamily:"Noto Sans JP,sans-serif"}}>VDOT</div>
        </div>
        <span style={{color:"#333",fontSize:16,flexShrink:0}}>›</span>
      </div>
      <div className="bb"><div className="bf" style={{width:`${bw}%`,background:`linear-gradient(90deg,${color}88,${color})`}}/></div>
    </div>
  );
}

export default App;
