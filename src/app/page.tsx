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
    setOrigem(clean)
    setInterim('Traduzindo...')
    try{
      const r=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text: clean, from:f, to:t})})
      const d=await r.json()
      const out=d.translated||clean
      setTraduzido(out)
      setInterim('')
      const utter=new SpeechSynthesisUtterance(out)
      utter.lang=LANGS.find(l=>l.code===t)?.speech||'en-US'
      speechSynthesis.speak(utter)
    }catch{
      setTraduzido(clean)
      setInterim('')
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
      setTimeout(()=>{ const fake=code==='pt'?'Boa noite acabei de chegar do Brasil e estou cansado':'Good evening I just arrived'; doTranslate(fake, code, code===from?to:from); setIsActive(false); setListening(null) },1000)
      return
    }
    const rec=new Rec()
    const langObj=LANGS.find(l=>l.code===code)
    rec.lang=langObj?.speech||'pt-BR'
    rec.continuous=true
    rec.interimResults=true
    rec.maxAlternatives=1

    rec.onresult=(e:any)=>{
      let finalText = ''
      let interimText = ''
      for(let i=0; i<e.results.length; i++){
        const t=e.results[i][0].transcript
        if(e.results[i].isFinal){
          finalText += t + ' '
        } else {
          interimText += t + ' '
        }
      }
      const full = (finalText + interimText).trim().slice(0, 380)
      setOrigem(full)
      setInterim(full || 'Ouvindo...')
    }

    rec.onend=()=>{
      if(isActive && recRef.current){
        try{ rec.start() }catch{}
      }
    }
    rec.onerror=()=>{}
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
    const textToTranslate = origem || interim
    if(textToTranslate &&!textToTranslate.startsWith('Ouvindo') &&!textToTranslate.startsWith('Traduzindo')){
      const activeLang = listening||from
      const target = activeLang===from?to:from
      doTranslate(textToTranslate, activeLang, target)
    }
  }

  const fromLabel=LANGS.find(l=>l.code===from)?.label||from
  const toLabel=LANGS.find(l=>l.code===to)?.label||to
  const fromFlag=LANGS.find(l=>l.code===from)?.flag||'🏳'
  const toFlag=LANGS.find(l=>l.code===to)?.flag||'🏳'

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCameraLoading(true)
    setOcrOriginal("")
    setOcrTranslated("")
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        setCameraImage(base64)
        const ocrRes = await fetch('/api/ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64 }) })
        const ocrData = await ocrRes.json()
        const extracted = ocrData.extracted || ''
        if (!extracted) { alert('Nenhum texto encontrado'); setCameraLoading(false); return }
        setOcrOriginal(extracted)
        const transRes = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: extracted.slice(0,380), from:'auto', to:'pt' }) })
        const transData = await transRes.json()
        setOcrTranslated(transData.translated || transData.translation || extracted)
        setCameraLoading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error(err)
      setCameraLoading(false)
    }
  }

 return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-3 py-2.5 bg-[#0a0a0a] border-b border-[#1e1e1e] z-20 gap-2">
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
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-yellow-400 font-bold">Foto escaneada</h3>
              <button onClick={()=>{setCameraImage(null); setOcrOriginal(""); setOcrTranslated("")}} className="text-white/60 hover:text-white">✕</button>
            </div>
            <img src={cameraImage} className="w-full h-32 object-contain rounded-lg mb-3 bg-white/10" />
            {ocrOriginal && (
              <>
                <p className="text-xs text-white/50 mb-1">ORIGINAL:</p>
                <p className="bg-white/10 p-3 rounded-lg text-white text-sm mb-3 whitespace-pre-wrap">{ocrOriginal}</p>
                <p className="text-xs text-yellow-400/70 mb-1">TRADUZIDO (PT):</p>
                <p className="bg-yellow-500/20 p-3 rounded-lg text-white text-sm whitespace-pre-wrap border border-yellow-500/30">{ocrTranslated || 'Traduzindo...'}</p>
              </>
            )}
          </div>
        )}

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} className="hidden" />
        <button onClick={() => cameraInputRef.current?.click()} disabled={cameraLoading} className="fixed bottom-28 right-4 z-[70] bg-zinc-900 border border-yellow-500/30 text-yellow-200 text-xs px-3 py-2 rounded-full shadow-xl">
          {cameraLoading? '⏳' : '📷 SCAN'}
        </button>

        <img src="/globo-passaporte.png" alt="Ritinha" className={`absolute w- h- object-contain transition-all duration-700 ${isActive? "scale-110 animate-pulse drop-shadow-[0_0_60px_rgba(255,60,60,0.8)] brightness-110" : "animate-[spin_60s_linear_infinite] opacity-90 drop-shadow-[0_0_30px_rgba(255,215,0,0.4)]"}`} />
        <div className="relative z-10 w-full max-w- px-4">
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
        <div className="max-w- mx-auto">
          {!isActive? (
            <div className="grid grid-cols-[1fr_48px_1fr] gap-2 items-center">
              <button onClick={()=>startContinuous(from)} className="h- rounded-2xl bg-[#FFD700] text-black font-black flex flex-col items-center justify-center gap-0.5 shadow-[0_0_20px_rgba(255,215,0,0.35)] active:scale-95"><span>🎤 MIC</span><span className="text-sm">{fromFlag} {fromLabel}</span><span className="text- opacity-70">TOQUE E FALE</span></button>
              <button onClick={swap} className="h-12 w-12 rounded-full bg-[#1e1e1e] border border-[#333] text-[#D4AF37] mx-auto">↔</button>
              <button onClick={()=>startContinuous(to)} className="h- rounded-2xl bg-[#1a1a1f] border border-[#D4AF37]/30 text-[#D4AF37] font-black flex flex-col items-center justify-center gap-0.5 active:scale-95"><span>🎤 MIC</span><span className="text-sm">{toFlag} {toLabel}</span><span className="text- opacity-70">TAP TO TALK</span></button>
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
