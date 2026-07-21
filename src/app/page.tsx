"use client"
import { useEffect, useRef, useState } from 'react'

const LANGS = [
  { code:'pt', label:'PT Brasil', flag:'🇧🇷', speech:'pt-BR' },
  { code:'en', label:'US Inglês', flag:'🇺🇸', speech:'en-US' },
  { code:'es', label:'ES Espanhol', flag:'🇪🇸', speech:'es-ES' },
  { code:'it', label:'IT Italiano', flag:'🇮🇹', speech:'it-IT' },
  { code:'fr', label:'FR Francês', flag:'🇫🇷', speech:'fr-FR' },
  { code:'es-AR', label:'AR Argentina', flag:'🇦🇷', speech:'es-AR' },
  { code:'es-CL', label:'CL Chile', flag:'🇨🇱', speech:'es-CL' },
  { code:'es-CO', label:'CO Colômbia', flag:'🇨🇴', speech:'es-CO' },
  { code:'es-PE', label:'PE Peru', flag:'🇵🇪', speech:'es-PE' },
  { code:'es-VE', label:'VE Venezuela', flag:'🇻🇪', speech:'es-VE' },
  { code:'es-UY', label:'UY Uruguai', flag:'🇺🇾', speech:'es-UY' },
  { code:'es-PY', label:'PY Paraguai', flag:'🇵🇾', speech:'es-PY' },
  { code:'es-BO', label:'BO Bolívia', flag:'🇧🇴', speech:'es-BO' },
  { code:'es-EC', label:'EC Equador', flag:'🇪🇨', speech:'es-EC' },
]

export default function Page(){
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const recRef = useRef<any>(null)
  const [from, setFrom] = useState('pt')
  const [to, setTo] = useState('en')
  const [origem, setOrigem] = useState('')
  const [traduzido, setTraduzido] = useState('')
  const [listening, setListening] = useState<string|null>(null)
  const [isActive, setIsActive] = useState(false)
  const [interim, setInterim] = useState('')

  useEffect(()=>{
    const c=canvasRef.current!; const ctx=c.getContext('2d')!
    let W=0,H=0,raf=0
    const resize=()=>{const r=c.getBoundingClientRect();W=r.width;H=r.height;c.width=W*2;c.height=H*2;ctx.setTransform(2,0,0,2,0,0)}
    resize(); addEventListener('resize',resize)
    const particles=Array.from({length:500},()=>({lat:(Math.random()-0.5)*Math.PI, lon:Math.random()*Math.PI*2, r:Math.random()*60+150}))
    let rot=0
    const draw=()=>{
      ctx.clearRect(0,0,W,H)
      const cx=W/2, cy=H/2-10
      const R=Math.min(W,H)*0.26
      ctx.strokeStyle='rgba(212,175,55,0.28)'; ctx.lineWidth=1
      ;[1.5,1.8,2.1].forEach((m,i)=>{ctx.beginPath(); ctx.ellipse(cx,cy,R*m,R*m*0.4,rot*0.3+i,0,Math.PI*2); ctx.stroke()})
      ctx.strokeStyle='rgba(0,180,255,0.15)'; ctx.beginPath(); ctx.ellipse(cx,cy,R*2,R*2*0.38,-rot*0.4,0,Math.PI*2); ctx.stroke()
      const grad=ctx.createRadialGradient(cx-R*0.2,cy-R*0.2,0,cx,cy,R)
      grad.addColorStop(0,'#fff7a0'); grad.addColorStop(0.4,'#FFD700'); grad.addColorStop(1,'#8a6d00')
      ctx.fillStyle=grad; ctx.shadowBlur=isActive?35:22; ctx.shadowColor=isActive?'#ff4444':'#FFD700'; ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0
      particles.forEach(p=>{
        const x=Math.cos(p.lat)*Math.cos(p.lon+rot)*p.r, y=Math.sin(p.lat)*p.r*0.45
        ctx.fillStyle=`rgba(255,215,0,${0.3+Math.random()*0.5})`; ctx.beginPath(); ctx.arc(cx+x, cy+y, 1.2,0,Math.PI*2); ctx.fill()
      })
      rot+=isActive?0.008:0.004; raf=requestAnimationFrame(draw)
    }
    draw(); return()=>{cancelAnimationFrame(raf); removeEventListener('resize',resize)}
  },[isActive])

  const doTranslate=async(text:string, f:string, t:string)=>{
    if(!text.trim()) return
    setOrigem(text)
    setInterim('Traduzindo...')
    try{
      const r=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text, from:f, to:t})})
      const d=await r.json()
      const out=d.translated||text
      setTraduzido(out)
      setInterim('')
      const utter=new SpeechSynthesisUtterance(out)
      utter.lang=LANGS.find(l=>l.code===t)?.speech||'en-US'
      speechSynthesis.speak(utter)
    }catch{
      setTraduzido(text)
    }
  }

  const swap=()=>{
    const f=from; const t=to; setFrom(t); setTo(f)
    setOrigem(traduzido); setTraduzido(origem)
  }

  const startContinuous=(code:string)=>{
    if(isActive){ stopContinuous(); return }
    setListening(code); setIsActive(true); setOrigem(''); setTraduzido(''); setInterim('Ouvindo... fale tudo, só para quando clicar em PARAR')
    const Rec=(window as any).webkitSpeechRecognition||(window as any).SpeechRecognition
    if(!Rec){
      // fallback
      setTimeout(()=>{ const fake=code==='pt'?'Boa noite acabei de chegar do Brasil e estou cansado aonde posso encontrar um hotel para descansar':'Good evening I just arrived from Brazil and I am tired where can I find a hotel to rest'; doTranslate(fake, code, code===from?to:from); setIsActive(false); setListening(null) },1000)
      return
    }
    const rec=new Rec()
    const langObj=LANGS.find(l=>l.code===code)
    rec.lang=langObj?.speech||'pt-BR'
    rec.continuous=true // NÃO PARA SOZINHO
    rec.interimResults=true
    rec.maxAlternatives=1
    let finalTranscript=''

    rec.onresult=(e:any)=>{
      let interimTrans=''
      for(let i=e.resultIndex; i<e.results.length; i++){
        const t=e.results[i][0].transcript
        if(e.results[i].isFinal){
          finalTranscript+=t+' '
        }else{
          interimTrans+=t
        }
      }
      // Mostra o que está falando em tempo real sem atropelar
      const full = (finalTranscript + interimTrans).trim()
      setInterim(full||'Ouvindo...')
      setOrigem(full)
    }

    rec.onend=()=>{
      // Se ainda está ativo, reinicia sozinho para não parar
      if(isActive && recRef.current){
        try{ rec.start() }catch{}
      }
    }
    rec.onerror=()=>{ /* ignora erros de rede */ }
    recRef.current=rec
    try{ rec.start() }catch{}
  }

  const stopContinuous=()=>{
    setIsActive(false)
    setListening(null)
    if(recRef.current){
      try{ recRef.current.onend=null; recRef.current.stop() }catch{}
      recRef.current=null
    }
    // Só agora traduz, depois que você clicou PARAR
    const textToTranslate = origem || interim
    if(textToTranslate && textToTranslate!=='Ouvindo... fale tudo, só para quando clicar em PARAR'){
      const activeLang = listening||from
      const target = activeLang===from?to:from
      doTranslate(textToTranslate, activeLang, target)
    }
  }

  const fromLabel=LANGS.find(l=>l.code===from)?.label||from
  const toLabel=LANGS.find(l=>l.code===to)?.label||to
  const fromFlag=LANGS.find(l=>l.code===from)?.flag||'🏳️'
  const toFlag=LANGS.find(l=>l.code===to)?.flag||'🏳️'

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-3 py-2.5 bg-[#0a0a0a] border-b border-[#1e1e1e] z-20 gap-2">
        <div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-[#FFD700] flex items-center justify-center text-black font-black text-sm">F</div><div className="font-bold text-">Familia Tradutor</div></div>
        <div className="flex items-center gap-1">
          <select value={from} onChange={e=>setFrom(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded-full px-2.5 py-1.5 text-xs max-w-">{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}</select>
          <button onClick={swap} className="w-7 h-7 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[#D4AF37]">↔</button>
          <select value={to} onChange={e=>setTo(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded-full px-2.5 py-1.5 text-xs max-w-">{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}</select>
        </div>
      </header>

      <div className="flex-1 relative bg-[#050507] flex items-center justify-center">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 w-full max-w- px-4">
          <div className="bg-black/75 backdrop-blur border border-[#D4AF37]/20 rounded-2xl p-4 min-h-">
            {isActive? (
              <div>
                <div className="flex items-center gap-2 text-red-400 text-xs animate-pulse mb-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span> GRAVANDO - FALE TUDO, SÓ PARA QUANDO CLICAR EM PARAR</div>
                <div className="text-white/90 text- leading-relaxed">{interim||origem||'Ouvindo...'}</div>
              </div>
            ) : origem || traduzido? (
              <div className="space-y-3">
                {origem && <div><div className="text- tracking-widest text-white/40 mb-1">{fromFlag} {fromLabel} DISSE:</div><div className="text-white font-medium">{origem}</div></div>}
                {traduzido && <div><div className="text- tracking-widest text-[#D4AF37]/60 mb-1">{toFlag} {toLabel} TRADUÇÃO:</div><div className="text-[#FFD700] font-bold text-lg">{traduzido}</div></div>}
              </div>
            ) : (
              <div className="text-center text-white/30 text-sm py-8">Toque no microfone, fale a frase inteira sem pressa, depois clique em PARAR</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0f0f10] border-t border-[#222] p-3 pb-5 z-20">
        <div className="max-w- mx-auto">
          {!isActive? (
            <div className="grid grid-cols-[1fr_48px_1fr] gap-2 items-center">
              <button onClick={()=>startContinuous(from)} className="h- rounded-2xl bg-[#FFD700] text-black font-black flex flex-col items-center justify-center gap-0.5 shadow-[0_0_20px_rgba(255,215,0,0.35)] active:scale-95"><span className="text-">🎤 MIC</span><span className="text-">{fromFlag} {fromLabel}</span><span className="text- opacity-70">TOQUE E FALE</span></button>
              <button onClick={swap} className="h- w- rounded-full bg-[#1e1e1e] border border-[#333] text-[#D4AF37] mx-auto">↔</button>
              <button onClick={()=>startContinuous(to)} className="h- rounded-2xl bg-[#1a1a1f] border border-[#D4AF37]/30 text-[#D4AF37] font-black flex flex-col items-center justify-center gap-0.5 active:scale-95"><span className="text-">🎤 MIC</span><span className="text-">{toFlag} {toLabel}</span><span className="text- opacity-70">TAP TO TALK</span></button>
            </div>
          ) : (
            <button onClick={stopContinuous} className="w-full h- rounded-2xl bg-red-600 text-white font-black flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,0,0,0.5)] animate-pulse active:scale-95">
              <span className="w-4 h-4 bg-white rounded-sm"></span> PARAR E TRADUZIR - {LANGS.find(l=>l.code===listening)?.flag} {LANGS.find(l=>l.code===listening)?.label}
            </button>
          )}
          <div className="flex justify-between mt-3 text- text-white/20"><span>{fromFlag} {from} → {toFlag} {to} • modo conversa contínuo</span><button onClick={()=>{setOrigem(''); setTraduzido(''); setInterim('')}} className="text-white/30">Limpar</button></div>
        </div>
      </div>
    </div>
  )
}
