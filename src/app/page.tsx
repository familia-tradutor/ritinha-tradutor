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
  const [from,setFrom]=useState('pt')
  const [to,setTo]=useState('en')
  const [origem,setOrigem]=useState('')
  const [traduzido,setTraduzido]=useState('')
  const [interim,setInterim]=useState('')
  const [listening,setListening]=useState<string|null>(null)
  const [isActive,setIsActive]=useState(false)
  const recRef=useRef<any>(null)

  const doTranslate=async(text:string, f:string, t:string)=>{
    if(!text.trim()) return
    try{
      const r=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text, from:f, to:t})})
      const j=await r.json()
      setTraduzido(j.translated||j.translation||'')
      if(j.translated){
        const u=new SpeechSynthesisUtterance(j.translated)
        const langObj=LANGS.find(l=>l.code===t)
        u.lang=langObj?.speech||'en-US'
        speechSynthesis.speak(u)
      }
    }catch(e){ console.error(e) }
  }

  const startContinuous=(code:string)=>{
    if(isActive){ stopContinuous(); return }
    setListening(code); setIsActive(true); setOrigem(''); setTraduzido(''); setInterim('Ouvindo... fale tudo, só para quando clicar em PARAR')
    const Rec=(window as any).webkitSpeechRecognition||(window as any).SpeechRecognition
    if(!Rec){
      setTimeout(()=>{ const fake=code==='pt'?'Boa noite acabei de chegar do Brasil e estou cansado aonde posso encontrar um hotel para descansar':'Good evening I just arrived from Brazil and I am tired where can I find a hotel to rest'; doTranslate(fake, code, code===from?to:from); setIsActive(false); setListening(null) },1000)
      return
    }
    const rec=new Rec()
    const langObj=LANGS.find(l=>l.code===code)
    rec.lang=langObj?.speech||'pt-BR'
    rec.continuous=true
    rec.interimResults=true
    rec.maxAlternatives=1
    let finalTranscript=''
    rec.onresult=(e:any)=>{
      let interimTrans=''
      for(let i=e.resultIndex; i<e.results.length; i++){
        const t=e.results[i][0].transcript
        if(e.results[i].isFinal){ finalTranscript+=t+' ' }else{ interimTrans+=t }
      }
      const full=(finalTranscript+interimTrans).trim()
      setInterim(full||'Ouvindo...')
      setOrigem(full)
    }
    rec.onend=()=>{ if(isActive && recRef.current){ try{ rec.start() }catch{} } }
    recRef.current=rec
    try{ rec.start() }catch{}
  }

  const stopContinuous=()=>{
    setIsActive(false); setListening(null)
    if(recRef.current){ try{ recRef.current.onend=null; recRef.current.stop() }catch{}; recRef.current=null }
    const textToTranslate=origem||interim
    if(textToTranslate && textToTranslate!=='Ouvindo... fale tudo, só para quando clicar em PARAR'){
      const activeLang=listening||from
      const target=activeLang===from?to:from
      doTranslate(textToTranslate, activeLang, target)
    }
  }

  const swap=()=>{ const f=from; setFrom(to); setTo(f); setOrigem(traduzido); setTraduzido(origem) }
  const fromLabel=LANGS.find(l=>l.code===from)?.label||from
  const toLabel=LANGS.find(l=>l.code===to)?.label||to
  const fromFlag=LANGS.find(l=>l.code===from)?.flag||'🏳'
  const toFlag=LANGS.find(l=>l.code===to)?.flag||'🏳'

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-3 py-2.5 bg-[#0a0a0a] border-b border-[#1e1e1e] z-20 gap-2">
        <div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-[#FFD700] flex items-center justify-center text-black font-black text-sm">R</div><div className="font-bold">Ritinha Tradutor</div></div>
        <div className="flex items-center gap-1">
          <select value={from} onChange={e=>setFrom(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded-full px-2.5 py-1.5 text-xs"><option>PT Brasil</option>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}</select>
          <button onClick={swap} className="w-7 h-7 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[#D4AF37]">↔</button>
          <select value={to} onChange={e=>setTo(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded-full px-2.5 py-1.5 text-xs">{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}</select>
        </div>
      </header>

      <div className="flex-1 relative bg-[#050507] flex items-center justify-center overflow-hidden">
        {/* IMAGEM NO LUGAR DO GLOBO AMARELO */}
        <img src="/globo-passaporte.png" alt="Ritinha" className="absolute w- h- object-contain opacity-90 drop-shadow-[0_0_40px_rgba(255,215,0,0.5)]" />

        <div className="relative z-10 w-full max-w-2xl px-4">
          <div className="bg-black/75 backdrop-blur border border-[#D4AF37]/20 rounded-2xl p-4 min-h-">
            {isActive? (
              <div>
                <div className="flex items-center gap-2 text-red-400 text-xs animate-pulse mb-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span> GRAVANDO - FALE TUDO, SÓ PARA QUANDO CLICAR EM PARAR</div>
                <div className="text-white/90 leading-relaxed">{interim||origem||'Ouvindo...'}</div>
              </div>
            ) : origem || traduzido? (
              <div className="space-y-3">
                {origem && <div><div className="text-xs tracking-widest text-white/40 mb-1">{fromFlag} {fromLabel} DISSE:</div><div className="text-white font-medium">{origem}</div></div>}
                {traduzido && <div><div className="text-xs tracking-widest text-[#D4AF37]/60 mb-1">{toFlag} {toLabel} TRADUÇÃO:</div><div className="text-[#FFD700] font-bold text-lg">{traduzido}</div></div>}
              </div>
            ) : (
              <div className="text-center text-white/30 text-sm py-8">Toque no microfone, fale a frase inteira sem pressa, depois clique em PARAR</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0f0f10] border-t border-[#222] p-3 pb-5 z-20">
        <div className="max-w-2xl mx-auto">
          {!isActive? (
            <div className="grid grid-cols-[1fr_48px_1fr] gap-2 items-center">
              <button onClick={()=>startContinuous(from)} className="h- rounded-2xl bg-[#FFD700] text-black font-black flex flex-col items-center justify-center gap-0.5 shadow-[0_0_20px_rgba(255,215,0,0.35)] active:scale-95"><span className="text-sm">🎤 MIC</span><span className="text-sm">{fromFlag} {fromLabel}</span><span className="text-xs opacity-70">TOQUE E FALE</span></button>
              <button onClick={swap} className="h-12 w-12 rounded-full bg-[#1e1e1e] border border-[#333] text-[#D4AF37] mx-auto">↔</button>
              <button onClick={()=>startContinuous(to)} className="h- rounded-2xl bg-[#1a1a1f] border border-[#D4AF37]/30 text-[#D4AF37] font-black flex flex-col items-center justify-center gap-0.5 active:scale-95"><span className="text-sm">🎤 MIC</span><span className="text-sm">{toFlag} {toLabel}</span><span className="text-xs opacity-70">TAP TO TALK</span></button>
            </div>
          ) : (
            <button onClick={stopContinuous} className="w-full h- rounded-2xl bg-red-600 text-white font-black flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,0,0,0.5)] animate-pulse active:scale-95">
              <span className="w-4 h-4 bg-white rounded-sm"></span> PARAR E TRADUZIR - {LANGS.find(l=>l.code===listening)?.flag} {LANGS.find(l=>l.code===listening)?.label}
            </button>
          )}
          <div className="flex justify-between mt-3 text-xs text-white/20"><span>{fromFlag} {from} → {toFlag} {to} • modo conversa contínuo</span><button onClick={()=>{setOrigem(''); setTraduzido(''); setInterim('')}} className="text-white/30">Limpar</button></div>
        </div>
      </div>
    </div>
  )
}
