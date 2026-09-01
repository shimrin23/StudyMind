let config = { focusActive:false };
let notifiedVideos = new Set(), lastBlocked = 0, scanTimer;
const educationalWords = /tutorial|course|lecture|learn|lesson|explained|guide|introduction|beginner|class|training|education|university|problem|exam|programming|algorithm|how to|basics/i;
const blockedWords = /music|song|trailer|prank|reaction|gaming|meme|celebrity|movie|episode|shorts|vlog|comedy|dance/i;
const ignoredSearchWords = new Set(['a','an','and','for','how','in','is','of','the','to','what','with']);

function textOf(card) { return Array.from(card.querySelectorAll('#video-title, #title, yt-formatted-string, a')).map(x=>x.textContent).join(' ').replace(/\s+/g,' ').trim(); }
function isShort(card, text) { return /shorts/i.test(text) || !!card.closest('ytd-reel-shelf-renderer') || !!card.querySelector('a[href*="/shorts/"]'); }
function searchTerms() {
  const query = new URLSearchParams(location.search).get('search_query') || '';
  return query.toLowerCase().match(/[\p{L}\p{N}+#.-]+/gu)?.filter(word => word.length > 1 && !ignoredSearchWords.has(word)) || [];
}
function isStudy(text) {
  const title = text.toLowerCase();
  const terms = searchTerms();
  const relatesToSearch = !terms.length || terms.every(term => title.includes(term));
  return relatesToSearch && educationalWords.test(title) && !blockedWords.test(title);
}
function cards() { return document.querySelectorAll('ytd-rich-item-renderer,ytd-video-renderer,ytd-compact-video-renderer,ytd-grid-video-renderer'); }
function showBanner() { let b=document.querySelector('.studymind-banner');if(!b){b=document.createElement('div');b.className='studymind-banner';document.documentElement.append(b);}const terms=searchTerms();b.innerHTML=terms.length?`<b>StudyMind is on</b><br>Showing educational results for "${terms.join(' ')}".`:'<b>StudyMind is on</b><br>Only educational videos are shown.'; }
function scan() { if(!config.focusActive) return; let blocked=0, allowed=0; cards().forEach(card=>{const title=textOf(card); if(!title)return; const ok=!isShort(card,title)&&isStudy(title);card.classList.toggle('studymind-hidden',!ok);if(ok){allowed++;const id=card.querySelector('a[href*="watch"]')?.href||title;if(!notifiedVideos.has(id)){notifiedVideos.add(id);chrome.runtime.sendMessage({type:'video-allowed'});}}else blocked++;}); if(blocked && blocked!==lastBlocked){lastBlocked=blocked;chrome.runtime.sendMessage({type:'content-blocked',count:1});} const results=document.querySelector('ytd-rich-grid-renderer #contents'); if(results && !allowed && cards().length) { let empty=document.querySelector('.studymind-empty');if(!empty){empty=document.createElement('div');empty.className='studymind-empty';empty.textContent='StudyMind is hiding unrelated videos. Search for an educational video.';results.prepend(empty);}} else document.querySelector('.studymind-empty')?.remove(); }
function skipAds() {
  if (!config.focusActive) return;
  document.querySelectorAll('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-container button').forEach(button => button.click());
}
function apply(){document.documentElement.classList.toggle('studymind-active',config.focusActive); if(config.focusActive){showBanner();scan();skipAds();}else{document.querySelector('.studymind-banner')?.remove();document.querySelector('.studymind-empty')?.remove();cards().forEach(c=>c.classList.remove('studymind-hidden'));}}
async function load(){config=await chrome.storage.local.get({focusActive:false});apply();}
chrome.storage.onChanged.addListener(load); chrome.runtime.onMessage.addListener((m)=>{if(m.type==='studymind-refresh')load();});
new MutationObserver(()=>{clearTimeout(scanTimer);scanTimer=setTimeout(()=>{scan();skipAds();},180);}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('yt-navigate-finish',()=>setTimeout(()=>{showBanner();scan();},500));load();
