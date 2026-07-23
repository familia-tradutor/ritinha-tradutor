"use client"
import Historico, { salvarNoHistorico } from "@/components/Historico";
import { useRef, useState } from 'react'
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
function compressImage(file: File): Promise<string> {
  return new Promise((res) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const max = 1200
      let w = img.width, h = img.height
      if(w>h && w>max){ h=h*max/w; w=max } else if(h>max){ w=w*max/h; h=max }
      canvas.width=w; canvas.height=h
      canvas.getContext('2d')!.drawImage(img,0,0,w,h)
      res(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = URL.createObjectURL(file)
  })
}
export default function Page(){
  const recRef = useRef<any>(null)
  const [from, setFrom] = useState('pt')
  const [to, setTo] = useState('en')
  const [origem, setOrigem] = useState('')
  const [traduzido, setTraduzido] = useState('')
  const [listening, setListening] = useState<string|null>(null)
  const [isActive, setIsActive] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraImage, setCameraImage] = useState<string|null>(null)
  const [ocrOriginal, setOcrOriginal] = useState("")
  const [ocrTranslated, setOcrTranslated] = useState("")
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [interim, setInterim] = useState('')
  const doTranslate=async(text:string, f:string, t:string)=>{
    if(!text.trim()) return
    const clean = text.trim().slice(0, 380)
    setOrigem(clean); setInterim('Traduzindo...')
    try{
      const r=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text: clean, from:f, to:t})})
      const d=await r.json(); setTraduzido(d.translated||clean); salvarNoHistorico(clean, d.translated||clean); setInterim('')
      const utter=new SpeechSynthesisUtterance(d.translated||clean); utter.lang=LANGS.find(l=>l.code===t)?.speech||'en-US'; speechSynthesis.speak(utter)
    }catch{ setTraduzido(clean); salvarNoHistorico(clean, clean); setInterim('') }
  }
  const swap=()=>{ const f=from; const t=to; setFrom(t); setTo(f); setOrigem(traduzido); setTraduzido(origem) }
  const startContinuous=(code:string)=>{
    if(isActive){ stopContinuous(); return }
    setListening(code); setIsActive(true); setOrigem(''); setTraduzido(''); setInterim('Ouvindo...')
    const Rec=(window as any).webkitSpeechRecognition||(window as any).SpeechRecognition
    if(!Rec){ setTimeout(()=>{ doTranslate(code==='pt'?'Boa noite acabei de chegar':'Good evening', code, code===from?to:from); setIsActive(false); setListening(null) },1000); return }
    const rec=new Rec(); rec.lang=LANGS.find(l=>l.code===code)?.speech||'pt-BR'; rec.continuous=true; rec.interimResults=true; rec.maxAlternatives=1
    rec.onresult=(e:any)=>{ const lastIdx=e.results.length-1; const lastText=e.results[lastIdx][0].transcript.trim().slice(0,380); setOrigem(lastText); setInterim(lastText||'Ouvindo...') }
    rec.onend=()=>{ if(isActive && recRef.current){ try{ rec.start() }catch{} } }; rec.onerror=()=>{}; recRef.current=rec; try{ rec.start() }catch{}
  }
  const stopContinuous=()=>{
    setIsActive(false); setListening(null)
    if(recRef.current){ try{ recRef.current.onend=null; recRef.current.stop() }catch{}; recRef.current=null }
    const txt=origem||interim
    if(txt &&!txt.startsWith('Ouvindo') &&!txt.startsWith('Traduzindo')){ const al=listening||from; doTranslate(txt, al, al===from?to:from) }
  }
 const copiarAtual = () => traduzido && navigator.clipboard.writeText(traduzido)
 const compartilharAtual = () => { const txt = `Ritinha: ${origem} -> ${traduzido}`; if(navigator.share) navigator.share({title:"Ritinha", text:txt}); else window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank") }

  const fromLabel=LANGS.find(l=>l.code===from)?.label||from; const toLabel=LANGS.find(l=>l.code===to)?.label||to
  const fromFlag=LANGS.find(l=>l.code===from)?.flag||'🏳'; const toFlag=LANGS.find(l=>l.code===to)?.flag||'🏳'
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setCameraLoading(true); setOcrOriginal(""); setOcrTranslated("")
    try{
      const compressed = await compressImage(file)
      setCameraImage(compressed)
      const ocrRes = await fetch('/api/ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: compressed }) })
      const ocrData = await ocrRes.json()
      if(!ocrRes.ok) throw new Error(ocrData.error || 'Falha OCR')
      const extracted = ocrData.extracted || ''
      if (!extracted) { alert('Nenhum texto encontrado, tente com mais luz'); setCameraLoading(false); return }
      setOcrOriginal(extracted)
      const transRes = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: extracted.slice(0,380), from: 'auto', to: from }) })
      const transData = await transRes.json()
      setOcrTranslated(transData.translated || extracted)
      salvarNoHistorico(extracted, transData.translated || extracted)
    }catch(err:any){ alert('Erro OCR: '+(err.message||'')); console.error(err) }
    setCameraLoading(false)
  }
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-center px-3 py-2.5 bg-[#0a0a0a] border-b border-[#1e1e1e] z-20 gap-2">
        <div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-[#FFD700] flex items-center justify-center text-black font-black text-sm">R</div><div className="font-bold">Ritinha Tradutor</div></div>
        <div className="flex items-center gap-1">
          <select value={from} onChange={e=>setFrom(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded-full px-2.5 py-1.5 text-xs">{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}</select>
          <button onClick={swap} className="w-7 h-7 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[#D4AF37]">↔</button>
          <select value={to} onChange={e=>setTo(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded-full px-2.5 py-1.5 text-xs">{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}</select>
        </div>
      </header>
      <div className="flex-1 relative bg-[#050507] flex items-center justify-center">
        {cameraImage && (
          <div className="fixed bottom-4 left-4 right-4 z-50 bg-black/90 backdrop-blur border border-yellow-500/30 rounded-2xl p-4 max-h- overflow-auto">
            <div className="flex justify-center items-center mb-3"><h3 className="text-yellow-400 font-bold">Foto escaneada</h3><button onClick={()=>{setCameraImage(null); setOcrOriginal(""); setOcrTranslated("")}} className="text-white/60">✕</button></div>
            <img src={cameraImage} className="w-full h-32 object-contain rounded-lg mb-3 bg-white/10" />
            {ocrOriginal && (<><p className="text-xs text-white/50 mb-1">ORIGINAL:</p><p className="bg-white/10 p-3 rounded-lg text-white text-sm mb-3 whitespace-pre-wrap">{ocrOriginal}</p><p className="text-xs text-yellow-400/70 mb-1">TRADUZIDO:</p><p className="bg-yellow-500/20 p-3 rounded-lg text-white text-sm whitespace-pre-wrap border border-yellow-500/30">{ocrTranslated || 'Traduzindo...'}</p></>)}
          </div>
        )}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} className="hidden" />
        <button onClick={() => cameraInputRef.current?.click()} disabled={cameraLoading} className="fixed bottom-28 right-4 z-[70] bg-zinc-900 border border-yellow-500/30 text-yellow-200 text-xs px-3 py-2 rounded-full shadow-xl">{cameraLoading? 'LENDO...' : 'SCAN'}</button>
        
        <div className="relative z-10 w-full max-w-md px-4"><div className="bg-black/75 backdrop-blur border border-[#D4AF37]/20 rounded-2xl p-4 min-h-">{isActive? (<div><div className="flex items-center gap-2 text-red-400 text-xs animate-pulse mb-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span> GRAVANDO</div><div className="text-white/90">{interim||origem||'Ouvindo...'}</div></div>) : origem || traduzido? (<div className="space-y-3">{origem && <div><div className="text-xs tracking-widest text-white/40 mb-1">{fromFlag} {fromLabel} DISSE:</div><div className="text-white font-medium">{origem}</div></div>}{traduzido && <div><div className="text-xs tracking-widest text-[#D4AF37]/60 mb-1">{toFlag} {toLabel} TRADUÇÃO:</div><div className="text-[#FFD700] font-bold text-lg">{traduzido}</div></div>}</div>) : (<div className="text-center text-white/30 text-sm py-8"><div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"><img src="/globo-passaporte1.png?v=24" alt="R" className="w- h- md:w- md:h- object-contain opacity-100 animate-[spin_80s_linear_infinite]" /></div>Toque no microfone</div>)}</div></div>
      </div>
      <div className="bg-[#0f0f10] border-t border-[#222] p-3 pb-5 z-20"><div className="max-w-md mx-auto">{!isActive? (<div className="grid grid-cols-[1fr_48px_1fr] gap-2 items-center"><button onClick={()=>startContinuous(from)} className="h-20 rounded-2xl bg-[#FFD700] text-black font-black flex flex-col items-center justify-center gap-0.5 active:scale-95"><span>MIC</span><span className="text-sm">{fromFlag} {fromLabel}</span></button><button onClick={swap} className="h-12 w-12 rounded-full bg-[#1e1e1e] border border-[#333] text-[#D4AF37] mx-auto">↔</button><button onClick={()=>startContinuous(to)} className="h-20 rounded-2xl bg-[#1a1a1f] border border-[#D4AF37]/30 text-[#D4AF37] font-black flex flex-col items-center justify-center gap-0.5 active:scale-95"><span>MIC</span><span className="text-sm">{toFlag} {toLabel}</span></button></div>) : (<button onClick={stopContinuous} className="w-full h-20 rounded-2xl bg-red-600 text-white font-black flex items-center justify-center gap-3 animate-pulse active:scale-95">PARAR E TRADUZIR</button>)}</div></div>
      <Historico />
    </div>
  )
}
