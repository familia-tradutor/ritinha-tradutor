'use client';
import { useState } from 'react';

export default function Home() {
  const [original, setOriginal] = useState('');
  const [traduzido, setTraduzido] = useState('');
  const [targetLang, setTargetLang] = useState('EN-US');
  const [ouvindo, setOuvindo] = useState(false);

  const falar = (texto: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
  };

  const iniciarEscuta = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta microfone. Use Chrome no Android.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;

    recognition.onstart = () => setOuvindo(true);
    recognition.onend = () => setOuvindo(false);
    recognition.onresult = async (event: any) => {
      const texto = event.results[0][0].transcript;
      setOriginal(texto);

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texto, targetLang }),
      });
      const data = await res.json();
      setTraduzido(data.translatedText);
    };
    recognition.start();
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 flex flex-col gap-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mt-4">Família Tradutor</h1>

      <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="bg-zinc-800 p-3 rounded-lg">
        <option value="EN-US">Inglês</option>
        <option value="ES">Espanhol</option>
        <option value="FR">Francês</option>
        <option value="IT">Italiano</option>
        <option value="DE">Alemão</option>
      </select>

      <button onClick={iniciarEscuta} className={`p-6 rounded-full font-bold text-xl ${ouvindo? 'bg-red-600' : 'bg-green-600'}`}>
        {ouvindo? 'OUVINDO...' : 'FALAR EM PORTUGUÊS'}
      </button>

      <div className="bg-zinc-900 p-4 rounded-lg min-h-">
        <p className="text-zinc-400 text-sm">Você disse:</p>
        <p className="text-lg">{original}</p>
      </div>

      <div className="bg-zinc-900 p-4 rounded-lg min-h-">
        <p className="text-zinc-400 text-sm">Tradução ({targetLang}):</p>
        <p className="text-lg font-bold">{traduzido}</p>
      </div>

      {traduzido && (
        <button onClick={() => falar(traduzido, targetLang)} className="bg-blue-600 p-4 rounded-lg font-bold">
          OUVIR TRADUÇÃO
        </button>
      )}
    </main>
  );
}
