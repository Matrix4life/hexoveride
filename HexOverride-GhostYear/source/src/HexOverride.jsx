import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C, CREW, MISSIONS, STORY, ENDINGS, resolveEnding } from './campaign.js';

// ═══════════════════════════════════════════════════════════════
// HEXOVERRIDE: GHOST YEAR
// Hand-authored branching campaign. School by day, breaches by night.
// Real attack chains, a crew that talks back, a mentor who turns.
// Beat the story → unlock endless free-play. Save/load via localStorage.
// ═══════════════════════════════════════════════════════════════

const SAVE_KEY = 'hexoverride_ghostyear_save_v1';

const blankState = () => ({
  screen:'title',          // title | chat | terminal | ending | sandbox
  operator:'',
  beat:'intro',            // current STORY node
  flags:{},                // story booleans
  stats:{ rep:0, heat:0, doubt:0, money:0, missionsDone:0 },
  endingKey:null,
  beaten:false,            // campaign finished at least once
});

export default function HexOverride(){
  const [s, setS] = useState(blankState);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => { setHasSave(!!localStorage.getItem(SAVE_KEY)); }, []);

  const save = useCallback((state) => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); setHasSave(true); }
    catch(e){ /* storage full / blocked — fail quietly */ }
  }, []);
  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if(raw) setS(JSON.parse(raw));
    } catch(e){}
  }, []);
  const wipe = useCallback(() => {
    localStorage.removeItem(SAVE_KEY); setHasSave(false); setS(blankState());
  }, []);

  const update = useCallback((patch, doSave=true) => {
    setS(prev => { const next = { ...prev, ...patch }; if(doSave) save(next); return next; });
  }, [save]);

  if(s.screen==='title')
    return <Title hasSave={hasSave} onNew={()=>update({ screen:'name' })} onContinue={load} onWipe={wipe} beaten={s.beaten} onSandbox={()=>update({screen:'sandbox'})} />;

  if(s.screen==='name')
    return <NameEntry onSubmit={name => update({ operator:name, screen:'chat', beat:'intro' })} />;

  if(s.screen==='ending')
    return <Ending ek={s.endingKey} state={s} onTitle={()=>update({ screen:'title' })}
                   onSandbox={()=>update({ screen:'sandbox' })} />;

  if(s.screen==='sandbox')
    return <Sandbox operator={s.operator} onExit={()=>update({ screen:'title' })} />;

  if(s.screen==='terminal')
    return <MissionTerminal state={s} update={update} save={save} />;

  // default: chat / story
  return <Chat state={s} update={update} save={save} />;
}

// ── TITLE ──────────────────────────────────────────────────────
function Title({ hasSave, onNew, onContinue, onWipe, beaten, onSandbox }){
  return (
    <Shell center>
      <div style={{ textAlign:'center', maxWidth:560 }}>
        <Glitch>HEXOVERRIDE</Glitch>
        <div style={{ color:C.dim, letterSpacing:6, fontSize:13, marginTop:-6, marginBottom:30 }}>GHOST YEAR</div>
        <p style={{ color:C.dim, fontSize:13, lineHeight:1.7, marginBottom:28 }}>
          You're sixteen. You're good with computers in a way that scares the adults who notice.<br/>
          Someone in a basement group chat just noticed. School by day. Breaches by night.<br/>
          Every job is real. Every choice sticks. Heat is forever.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
          <Btn color={C.green} onClick={onNew} wide>{hasSave ? 'New Game (overwrites save)' : 'New Game'}</Btn>
          {hasSave && <Btn color={C.cyan} onClick={onContinue} wide>Continue</Btn>}
          {beaten && <Btn color={C.purple} onClick={onSandbox} wide>Free Play (post-game)</Btn>}
          {hasSave && <button onClick={onWipe} style={{ ...textBtn, color:C.danger }}>delete save</button>}
        </div>
      </div>
    </Shell>
  );
}

function NameEntry({ onSubmit }){
  const [v,setV]=useState(''); const ref=useRef(null);
  useEffect(()=>{ref.current?.focus();},[]);
  return (
    <Shell center>
      <form onSubmit={e=>{e.preventDefault(); if(v.trim()) onSubmit(v.trim().slice(0,16));}} style={{ textAlign:'center' }}>
        <div style={{ color:C.cyan, marginBottom:14 }}>What do they call you online?</div>
        <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center' }}>
          <span style={{ color:C.green }}>handle:~$</span>
          <input ref={ref} value={v} onChange={e=>setV(e.target.value)} spellCheck={false}
                 style={inputStyle} placeholder="pick a handle" />
        </div>
        <div style={{ color:C.dim, fontSize:12, marginTop:18 }}>press enter</div>
      </form>
    </Shell>
  );
}

// ── CHAT / STORY ENGINE ────────────────────────────────────────
function Chat({ state, update, save }){
  const beat = STORY[state.beat];
  const [shown, setShown] = useState(0);      // how many lines revealed
  const [done, setDone] = useState(false);
  const [pendingResult, setPendingResult] = useState(null); // result lines after a choice
  const endRef = useRef(null);

  // reset reveal when beat changes
  useEffect(() => { setShown(0); setDone(false); setPendingResult(null); }, [state.beat]);

  // an ending beat resolves immediately to the ending screen
  useEffect(() => {
    if(beat.ending){
      const ek = resolveEnding(state.flags, state.stats);
      const t = setTimeout(() => update({ screen:'ending', endingKey:ek, beaten:true }), 700);
      return () => clearTimeout(t);
    }
  }, [state.beat]);

  // typewriter-ish reveal of chat lines
  useEffect(() => {
    const lines = pendingResult || beat.lines;
    if(shown >= lines.length){ setDone(true); return; }
    const t = setTimeout(() => setShown(n => n+1), 480);
    return () => clearTimeout(t);
  }, [shown, beat, pendingResult]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [shown]);

  function applyChoice(ch){
    const stats = { ...state.stats };
    if(ch.rep) stats.rep += ch.rep;
    if(ch.heat) stats.heat = Math.min(100, stats.heat + ch.heat);
    if(ch.doubt) stats.doubt += ch.doubt;
    const flags = { ...state.flags, [ch.flag]: true };
    update({ stats, flags }, true);
    // show result lines, then advance to the route/next
    setPendingResult(ch.result || []);
    setShown(0); setDone(false);
    chRef.current = ch;
  }
  const chRef = useRef(null);

  function advance(){
    // if we just showed a choice's result, route onward
    if(pendingResult){
      const ch = chRef.current;
      const target = ch?.route || beat.next;
      if(target){ update({ beat:target }); }
      return;
    }
    if(beat.mission){ update({ screen:'terminal' }); return; }
    if(beat.choices){ return; /* wait for click */ }
    if(beat.next){ update({ beat:beat.next }); return; }
    if(beat.ending){ resolveAndEnd(); }
  }

  function resolveAndEnd(){
    const ek = resolveEnding(state.flags, state.stats);
    update({ screen:'ending', endingKey:ek, beaten:true });
  }

  const lines = pendingResult || beat.lines;
  const visible = lines.slice(0, shown);
  const showChoices = done && beat.choices && !pendingResult;
  const showContinue = done && !showChoices &&
    (pendingResult || beat.next || beat.mission || beat.ending);

  return (
    <Shell>
      <ChatHeader state={state} />
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 0' }}>
        {visible.map((ln,i) => <Bubble key={i} who={ln[0]} text={ln[1]} />)}
        {showChoices && (
          <div style={{ display:'flex', flexDirection:'column', gap:8, margin:'16px 0 6px' }}>
            {beat.choices.map((ch,i) => (
              <button key={i} onClick={()=>applyChoice(ch)} style={choiceBtn}>{ch.label}</button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding:'10px 16px', borderTop:`1px solid ${C.border}`, background:C.dark, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ color:C.dim, fontSize:12 }}>auto-saved</span>
        {showContinue
          ? <Btn color={C.cyan} onClick={advance}>{beat.mission && !pendingResult ? '▶ open terminal' : 'continue'}</Btn>
          : !showChoices && <span style={{ color:C.dim, fontSize:12 }}>…</span>}
      </div>
    </Shell>
  );
}

function Bubble({ who, text }){
  const m = CREW[who] || { name:who, color:C.text };
  const isSys = who==='SYSTEM';
  if(isSys) return <div style={{ color:C.dim, fontSize:12, textAlign:'center', margin:'10px 0', letterSpacing:1 }}>{text}</div>;
  return (
    <div style={{ marginBottom:10 }}>
      <span style={{ color:m.color, fontWeight:700, fontSize:13 }}>{m.name}</span>
      <div style={{ color:C.text, fontSize:14, marginTop:2, lineHeight:1.5,
                    background:C.panel, borderLeft:`2px solid ${m.color}`, padding:'7px 12px', borderRadius:'0 6px 6px 0' }}>
        {text}
      </div>
    </div>
  );
}

// ── MISSION TERMINAL ───────────────────────────────────────────
function MissionTerminal({ state, update, save }){
  const beat = STORY[state.beat];
  const mission = MISSIONS[beat.mission];
  const [log, setLog] = useState([]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState(0);
  const [trace, setTrace] = useState(0);
  const [started, setStarted] = useState(false);
  const [reveal, setReveal] = useState(null);
  const endRef = useRef(null); const inRef = useRef(null);

  const push = useCallback((who,text) => setLog(l => [...l,{who,text,id:Math.random()}]), []);

  useEffect(()=>{ inRef.current?.focus(); },[started]);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[log]);

  // intro
  useEffect(() => {
    let i=0;
    const t = setInterval(() => {
      if(i>=mission.intro.length){ clearInterval(t);
        push('SYSTEM',`── ${mission.title} // target: ${mission.host.name} (${mission.host.ip}) ──`);
        push('SYSTEM','Type "start" to begin. "hint" if you\'re stuck. "help" for context.');
        return; }
      push(mission.intro[i][0], mission.intro[i][1]); i++;
    }, 500);
    return ()=>clearInterval(t);
  }, []);

  function finishMission(revealKey){
    const stats = { ...state.stats, missionsDone: state.stats.missionsDone+1 };
    update({ stats }, true);
    // revealKey routes to a story beat (choice or done node)
    setTimeout(() => update({ screen:'chat', beat: revealKey }), 900);
  }

  function run(raw){
    const cmd = raw.trim(); if(!cmd) return;
    push('you', cmd);
    const c = cmd.toLowerCase();

    if(c==='help'){ push('SYSTEM', mission.intro.map(x=>x[1]).join('  ·  ')); return; }
    if(c==='hint'){ push('SYSTEM','HINT → '+ (mission.steps[step]?.hint || 'You\'re basically done. Finish the last command.')); return; }
    if(c==='start' && !started){ setStarted(true); push('SYSTEM','Terminal live. '+mission.steps[0].hint); return; }
    if(!started){ push('SYSTEM','Type "start" first.'); return; }

    const cur = mission.steps[step];
    if(!cur){ push('SYSTEM','Mission complete. Stand by…'); return; }

    if(cur.do.test(c)){
      cur.out.forEach(o => push(o[0], o[1]));
      if(cur.trace){ setTrace(t => Math.min(100, t+cur.trace)); push('SYSTEM',`⚠ trace +${cur.trace}%`); }
      const nextStep = step+1;
      setStep(nextStep);
      if(cur.reveal){
        push('SYSTEM','✓ objective complete.');
        finishMission(cur.reveal);
      } else if(nextStep < mission.steps.length){
        setTimeout(()=>push('SYSTEM','→ next: '+mission.steps[nextStep].hint), 300);
      }
    } else {
      push('SYSTEM','Command rejected or wrong for this step. Type "hint".');
    }
  }

  return (
    <Shell>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:`1px solid ${C.border}`, background:C.panel }}>
        <span style={{ color:C.cyan, fontWeight:700 }}>TERMINAL</span>
        <span style={{ color:C.dim, fontSize:12 }}>{mission.title}</span>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ color:C.dim, fontSize:11 }}>TRACE</span>
          <div style={{ width:90, height:6, background:'#1c1c24', borderRadius:3, overflow:'hidden' }}>
            <div style={{ width:`${trace}%`, height:'100%', background: trace>60?C.danger:C.warn, transition:'width .3s' }}/>
          </div>
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px 0' }}>
        {log.map(l => <TermLine key={l.id} who={l.who} text={l.text} />)}
        <div ref={endRef}/>
      </div>
      <form onSubmit={e=>{e.preventDefault(); run(input); setInput('');}}
            style={{ display:'flex', gap:8, alignItems:'center', padding:'10px 16px', borderTop:`1px solid ${C.border}`, background:C.dark }}>
        <span style={{ color:C.green, fontWeight:700 }}>{state.operator}@hex<span style={{color:C.dim}}>:~$</span></span>
        <input ref={inRef} value={input} onChange={e=>setInput(e.target.value)} spellCheck={false} autoComplete="off" style={inputStyle}/>
      </form>
    </Shell>
  );
}

function TermLine({ who, text }){
  if(who==='you') return <div style={{ color:C.cyan }}>&gt; {text}</div>;
  const m = CREW[who];
  if(m && who!=='SYSTEM') return <div><span style={{color:m.color,fontWeight:700}}>{m.name}: </span><span style={{color:C.text}}>{text}</span></div>;
  return <div style={{ color: text.startsWith('⚠')?C.danger : text.startsWith('[+]')||text.startsWith('✓')?C.green : C.dim, whiteSpace:'pre-wrap' }}>{text}</div>;
}

// ── ENDING ─────────────────────────────────────────────────────
function Ending({ ek, state, onTitle, onSandbox }){
  const e = ENDINGS[ek] || ENDINGS.collected;
  const [shown,setShown]=useState(0);
  useEffect(()=>{ if(shown<e.lines.length){ const t=setTimeout(()=>setShown(n=>n+1),900); return ()=>clearTimeout(t);} },[shown,e]);
  const done = shown>=e.lines.length;
  return (
    <Shell center>
      <div style={{ textAlign:'center', maxWidth:600 }}>
        <div style={{ color:e.color, fontSize:32, fontWeight:800, letterSpacing:4, marginBottom:24 }}>{e.title}</div>
        {e.lines.slice(0,shown).map((l,i)=><p key={i} style={{ color:C.text, lineHeight:1.7, marginBottom:10 }}>{l}</p>)}
        {done && (
          <div style={{ marginTop:24 }}>
            <div style={{ color:C.dim, fontSize:12, marginBottom:18 }}>
              rep {state.stats.rep} · heat {state.stats.heat} · doubt {state.stats.doubt} · jobs {state.stats.missionsDone}
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              <Btn color={C.purple} onClick={onSandbox}>enter free play</Btn>
              <Btn color={C.dim} onClick={onTitle}>title screen</Btn>
            </div>
            <div style={{ color:C.dim, fontSize:12, marginTop:16 }}>
              Other endings exist. Different choices, different doors.
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

// ── POST-GAME SANDBOX (endless, generated, no clock) ───────────
function Sandbox({ operator, onExit }){
  const [log,setLog]=useState([]); const [input,setInput]=useState('');
  const [wallet,setWallet]=useState(0); const [target,setTarget]=useState(null);
  const inRef=useRef(null); const endRef=useRef(null);
  const push=(t,c=C.text)=>setLog(l=>[...l,{t,c,id:Math.random()}]);
  useEffect(()=>{ inRef.current?.focus();
    push('FREE PLAY — the campaign\'s over, the crew scattered, but the work never stops.',C.purple);
    push('Generated targets, no clock, no story. Type "help".',C.dim);
  },[]);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[log]);

  const mk=()=>{ const tier=['easy','easy','medium','hard'][Math.floor(Math.random()*4)];
    const val={easy:[800,4000],medium:[6000,20000],hard:[30000,90000]}[tier];
    return { ip:`${r(11,223)}.${r(0,255)}.${r(0,255)}.${r(1,254)}`,
      org:pick(['DataCorp','NodeSys','GridBank','VaultNet','CoreLogic','PylonAI']),
      tier, val:r(val[0],val[1]), breached:false }; };

  function run(raw){
    const cmd=raw.trim(); if(!cmd) return; push('> '+cmd,C.cyan);
    const [c,...a]=cmd.toLowerCase().split(/\s+/);
    if(c==='help'){ push('nmap · connect <ip> · exploit · exfil · wallet · exit',C.text); return; }
    if(c==='wallet'){ push('Balance: ₿'+wallet.toLocaleString(),C.warn); return; }
    if(c==='exit' && a.length===0){ onExit(); return; }
    if(c==='nmap'){ const t=mk(); setTarget(t);
      push(`[+] ${t.ip}  ${t.org}  [${t.tier.toUpperCase()}]  est ₿${t.val.toLocaleString()}`,C.green);
      push('  connect '+t.ip+' to breach it',C.dim); return; }
    if(c==='connect'){ if(!target) return push('nmap first.',C.danger);
      push('Connected to '+target.ip+'. Run "exploit".',C.green); return; }
    if(c==='exploit'){ if(!target) return push('Nothing connected.',C.danger);
      setTarget(t=>({...t,breached:true})); push('[✓] Shell acquired. "exfil" to loot.',C.green); return; }
    if(c==='exfil'){ if(!target?.breached) return push('Breach first.',C.danger);
      setWallet(w=>w+target.val); push(`[✓] +₿${target.val.toLocaleString()}`,C.warn);
      setTarget(null); return; }
    push('Unknown command. "help".',C.danger);
  }
  return (
    <Shell>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:`1px solid ${C.border}`, background:C.panel }}>
        <span style={{ color:C.purple, fontWeight:700 }}>FREE PLAY</span>
        <span style={{ color:C.warn, marginLeft:'auto' }}>₿{wallet.toLocaleString()}</span>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px 0' }}>
        {log.map(l=><div key={l.id} style={{color:l.c,whiteSpace:'pre-wrap'}}>{l.t}</div>)}
        <div ref={endRef}/>
      </div>
      <form onSubmit={e=>{e.preventDefault(); run(input); setInput('');}}
            style={{ display:'flex', gap:8, padding:'10px 16px', borderTop:`1px solid ${C.border}`, background:C.dark }}>
        <span style={{ color:C.green, fontWeight:700 }}>{operator}@free<span style={{color:C.dim}}>:~$</span></span>
        <input ref={inRef} value={input} onChange={e=>setInput(e.target.value)} spellCheck={false} style={inputStyle}/>
      </form>
    </Shell>
  );
}

// ── shared bits ────────────────────────────────────────────────
function ChatHeader({ state }){
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:`1px solid ${C.border}`, background:C.panel, flexWrap:'wrap' }}>
      <span style={{ color:C.cyan, fontWeight:700, letterSpacing:1 }}>the basement</span>
      <span style={{ color:C.green, fontSize:12 }}>REP {state.stats.rep}</span>
      <span style={{ color: state.stats.heat>60?C.danger:C.warn, fontSize:12 }}>HEAT {state.stats.heat}</span>
      <span style={{ color:C.purple, fontSize:12 }}>DOUBT {state.stats.doubt}</span>
      <span style={{ marginLeft:'auto', color:C.dim, fontSize:12 }}>{state.operator}</span>
    </div>
  );
}
function Shell({ children, center }){
  return (
    <div style={{ fontFamily:'"JetBrains Mono","SF Mono",Menlo,Consolas,monospace',
      background:C.bg, color:C.text, height:'100vh', maxHeight:'100vh', display:'flex',
      flexDirection:'column', fontSize:14, lineHeight:1.55, overflow:'hidden',
      ...(center?{justifyContent:'center',alignItems:'center',padding:24}:{}) }}>
      {children}
    </div>
  );
}
function Glitch({ children }){
  return <div style={{ color:C.cyan, fontSize:38, fontWeight:800, letterSpacing:6,
    textShadow:`2px 0 ${C.danger}, -2px 0 ${C.purple}` }}>{children}</div>;
}
function Btn({ children, color, onClick, wide }){
  return <button onClick={onClick} style={{ background:'transparent', border:`1px solid ${color}`, color,
    padding:'9px 18px', borderRadius:6, cursor:'pointer', fontFamily:'inherit', fontSize:14,
    width: wide?260:'auto' }}>{children}</button>;
}
const textBtn = { background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12, textDecoration:'underline' };
const inputStyle = { flex:1, background:'transparent', border:'none', outline:'none', color:C.text, fontFamily:'inherit', fontSize:14, minWidth:120 };
const choiceBtn = { textAlign:'left', background:C.panel, border:`1px solid ${C.border}`, color:C.text,
  padding:'11px 14px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:13.5, lineHeight:1.4 };

const r=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[Math.floor(Math.random()*a.length)];
