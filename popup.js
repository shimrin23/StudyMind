const $ = (id) => document.getElementById(id);
let state, showingWeek = false, ticker;
const pad = (n) => String(n).padStart(2, "0");
const formatTime = (ms) => { const s = Math.floor(ms / 1000); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`; };
const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
function elapsed() { return state.focusActive ? Date.now() - state.focusStartedAt : 0; }
function renderTimer() { $("timer").textContent = formatTime(elapsed()); }
function sumStats(days) { let sum={focusMs:0,studyVideos:0,blocked:0}; days.forEach(d=>{const x=state.stats?.days?.[d]; if(x) Object.keys(sum).forEach(k=>sum[k]+=x[k]||0);}); return sum; }
function renderStats() { const dates=[]; for(let i=0;i<(showingWeek?7:1);i++){const d=new Date();d.setDate(d.getDate()-i);dates.push(dayKey(d));} const s=sumStats(dates); if(state.focusActive && dates.includes(dayKey()))s.focusMs += Date.now()-state.focusStartedAt; $("focus-stat").textContent = s.focusMs >= 3600000 ? `${(s.focusMs/3600000).toFixed(1)}h` : `${Math.floor(s.focusMs/60000)}m`; $("videos-stat").textContent=s.studyVideos; $("blocked-stat").textContent=s.blocked; $("period").textContent=showingWeek?"This week":"Today"; $("week-toggle").textContent=showingWeek?"View today":"View this week"; }
function render() { const active=state.focusActive; $("status-dot").style.background=active?"var(--green)":"#75809c"; $("status-text").textContent=active?"Focus Mode active":"Focus Mode off"; $("toggle").textContent=active?"Stop Focus Mode":"Start Focus Mode"; $("toggle").classList.toggle("stop",active); renderTimer();renderStats(); }
async function save(){ await chrome.storage.local.set(state); }
$("toggle").onclick=async()=>{ if(state.focusActive){ const duration=Date.now()-state.focusStartedAt; state.accumulatedMs=0; state.focusActive=false; state.focusStartedAt=null; await chrome.runtime.sendMessage({type:"focus-stopped",durationMs:duration}); } else {state.focusActive=true;state.focusStartedAt=Date.now();} await save();render(); };
$("week-toggle").onclick=()=>{showingWeek=!showingWeek;renderStats();};
(async()=>{state=await chrome.storage.local.get({focusActive:false,focusStartedAt:null,accumulatedMs:0,stats:{days:{}}});render();ticker=setInterval(()=>{renderTimer();renderStats();},1000);})();
