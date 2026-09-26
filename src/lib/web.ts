/* ============================================================================
   Web mode — the live preview
   ----------------------------------------------------------------------------
   Her HTML (with any <style> and <script> in it) is rendered in a sandboxed
   iframe: scripts run, but the page cannot reach this app, its storage or
   its cookies (no allow-same-origin). A small script injected first forwards
   console output and uncaught errors to the parent over postMessage, tagged
   with a per-render channel id so a stale frame can never write into a new
   run's console.

   The same relay answers Learn mode's page checks. A check is a few lines of
   plain steps — `h1 text == Hello`, `click button`, `#out text == Clicked` —
   run inside the page after it loads, and reported back the same way. Each
   check gets a freshly loaded page of its own.
   ========================================================================== */

export interface WebLog {
  level: 'log' | 'warn' | 'error'
  text: string
}

export interface DomResult {
  pass: boolean
  /** The step that failed, and what the page actually had. */
  detail?: string
}

/** The script that runs inside the preview: console relay, and the checker. */
function injected(channel: string, checks: string[][] | null): string {
  const cfg = JSON.stringify({ channel, checks })
  // Kept dependency-free and ES2017: it runs in whatever the frame gives it.
  return `<script>(function(){
var CFG=${cfg.replace(/</g, '\\u003c')};
function post(m){m.channel=CFG.channel;try{parent.postMessage(m,'*')}catch(e){}}
function show(v){if(typeof v==='string')return v;try{return JSON.stringify(v)}catch(e){return String(v)}}
['log','info','warn','error'].forEach(function(k){var o=console[k];console[k]=function(){var a=[].slice.call(arguments).map(show).join(' ');post({type:'console',level:k==='info'?'log':k,text:a});o&&o.apply(console,arguments)}});
window.addEventListener('error',function(e){post({type:'console',level:'error',text:(e.message||'Error')+(e.lineno?' (line '+e.lineno+')':'')})});
if(!CFG.checks)return;
function norm(s){return String(s==null?'':s).replace(/\\s+/g,' ').trim()}
function cmp(op,a,b){var x=Number(a),y=Number(b);switch(op){case '==':return a===b;case '!=':return a!==b;case 'contains':return a.indexOf(b)>=0;case '>=':return x>=y;case '<=':return x<=y;case '>':return x>y;case '<':return x<y}return false}
var KEYS=['exists','missing','count','text','value','attr','style','class'];
function step(line){
  var t=line.trim(); if(!t) return null;
  var m=/^click\\s+(.+)$/.exec(t); if(m){var el=document.querySelector(m[1]); if(!el) return 'nothing matches '+m[1]+' to click'; el.click(); return null}
  m=/^type\\s+(\\S+)\\s+(.*)$/.exec(t); if(m){var inp=document.querySelector(m[1]); if(!inp) return 'nothing matches '+m[1]+' to type into'; inp.value=m[2]; inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true})); return null}
  var words=t.split(/\\s+/), k=-1; for(var i=1;i<words.length;i++){if(KEYS.indexOf(words[i])>=0){k=i;break}}
  if(k<0) return 'the check "'+t+'" could not be read';
  var sel=words.slice(0,k).join(' '), key=words[k], rest=words.slice(k+1);
  var all; try{all=document.querySelectorAll(sel)}catch(e){return 'bad selector '+sel}
  var el=all[0];
  if(key==='exists') return all.length?null:'there is no '+sel+' on the page';
  if(key==='missing') return all.length?sel+' should not be on the page':null;
  if(key==='count'){var op=rest[0],n=rest[1]; return cmp(op,String(all.length),n)?null:'expected '+sel+' count '+op+' '+n+', found '+all.length}
  if(!el) return 'there is no '+sel+' on the page';
  var actual, op2, want;
  if(key==='text'||key==='value'){actual=norm(key==='text'?el.textContent:el.value); op2=rest[0]; want=norm(rest.slice(1).join(' '))}
  else if(key==='attr'){actual=el.getAttribute(rest[0]); if(actual===null) return sel+' has no '+rest[0]+' attribute'; actual=norm(actual); op2=rest[1]; want=norm(rest.slice(2).join(' '))}
  else if(key==='style'){actual=norm(getComputedStyle(el).getPropertyValue(rest[0])); op2=rest[1]; want=norm(rest.slice(2).join(' '))}
  else if(key==='class'){return el.classList.contains(rest[0])?null:sel+' does not have the class '+rest[0]}
  return cmp(op2,actual,want)?null:sel+' '+key+(key==='attr'||key==='style'?' '+rest[0]:'')+': expected '+(op2==='contains'?'to contain ':'')+JSON.stringify(want)+', found '+JSON.stringify(actual);
}
function runChecks(){
  var results=CFG.checks.map(function(lines){for(var i=0;i<lines.length;i++){var err;try{err=step(lines[i])}catch(e){err=String(e&&e.message||e)}if(err)return{pass:false,detail:err}}return{pass:true}});
  post({type:'checks',results:results});
}
window.addEventListener('load',function(){setTimeout(runChecks,60)});
})();</script>`
}

/** The page the preview renders: the relay first, then her HTML. */
export function buildPage(html: string, channel: string, checks: string[][] | null = null): string {
  const script = injected(channel, checks)
  // Put the relay before anything of hers so it sees her first console.log.
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}${script}`)
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => `${m}<head>${script}</head>`)
  return `<!doctype html><html><head><meta charset="utf-8">${script}</head><body>${html}</body></html>`
}

let seq = 0
export function newChannel(): string {
  seq += 1
  return `web-${Date.now().toString(36)}-${seq}`
}

/**
 * Renders the page in a hidden frame and runs one check inside it; resolves
 * with what it logged and what the check found (null if it never reported).
 */
function checkInFrame(html: string, steps: string[] | null, timeoutMs: number): Promise<{ logs: WebLog[]; result: DomResult | null }> {
  const channel = newChannel()
  return new Promise((resolve) => {
    const frame = document.createElement('iframe')
    frame.setAttribute('sandbox', 'allow-scripts allow-modals')
    frame.setAttribute('aria-hidden', 'true')
    frame.tabIndex = -1
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;height:600px;border:0;visibility:hidden'
    const logs: WebLog[] = []
    const done = (result: DomResult | null) => {
      window.removeEventListener('message', onMessage)
      clearTimeout(timer)
      frame.remove()
      resolve({ logs, result })
    }
    const onMessage = (e: MessageEvent) => {
      const m = e.data as { channel?: string; type?: string; level?: WebLog['level']; text?: string; results?: DomResult[] }
      if (!m || m.channel !== channel || e.source !== frame.contentWindow) return
      if (m.type === 'console') logs.push({ level: m.level ?? 'log', text: m.text ?? '' })
      if (m.type === 'checks') done(m.results?.[0] ?? { pass: true })
    }
    const timer = setTimeout(() => done(null), timeoutMs)
    window.addEventListener('message', onMessage)
    frame.srcdoc = buildPage(html, channel, [steps ?? []])
    document.body.appendChild(frame)
  })
}

/**
 * Runs each check in a page of its own, so one check's clicks never leak
 * into the next, and returns what the page logged (once) and what each check
 * found. A page that never finished loading fails its check. Browser-only.
 */
export async function runWebChecks(html: string, checks: string[][], timeoutMs = 6000): Promise<{ logs: WebLog[]; results: DomResult[] | null; ms: number }> {
  const started = Date.now()
  const runs = await Promise.all((checks.length ? checks : [null]).map((c) => checkInFrame(html, c, timeoutMs)))
  const stalled: DomResult = { pass: false, detail: 'The page did not finish loading in time, so this was not checked.' }
  return {
    logs: runs[0]!.logs,
    results: checks.length ? runs.map((r) => r.result ?? stalled) : [],
    ms: Date.now() - started,
  }
}
