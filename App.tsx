
import React, { useState, useEffect } from 'react';
import { CardType, GameStatus, GameTheme } from './types';
import { generateGameTheme } from './services/geminiService';
import { playSound } from './services/soundService';
import Card from './components/Card';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [theme, setTheme] = useState<GameTheme | null>(null);
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [matches, setMatches] = useState(0);
  const [userPrompt, setUserPrompt] = useState("");
  const [highScore, setHighScore] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [loadingStep, setLoadingStep] = useState("Brainstorming...");

  useEffect(() => {
    if (theme) {
      const savedScore = localStorage.getItem(`high-score-${theme.name}`);
      setHighScore(savedScore ? parseInt(savedScore, 10) : null);
    }
  }, [theme]);

  const preloadImages = async (urls: string[]): Promise<void> => {
    setLoadingStep("Preloading visuals...");
    const promises = urls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = resolve; // Continue even if one fails
      });
    });
    await Promise.all(promises);
  };

  const initializeGame = async (prompt?: string) => {
    setStatus(GameStatus.LOADING);
    setLoadingStep("Gemini is thinking...");
    setFlippedIds([]);
    setAttempts(0);
    setMatches(0);
    setIsNewRecord(false);

    try {
      const newTheme = await generateGameTheme(prompt);
      setTheme(newTheme);

      const imageUrls: string[] = [];
      const gameCards: CardType[] = [];
      const salt = Math.floor(Math.random() * 9999);

      newTheme.items.forEach((item, index) => {
        const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(item + salt)}/400/400`;
        imageUrls.push(imageUrl);
        
        const cardBase = { label: item, content: imageUrl, isFlipped: false, isMatched: false };
        gameCards.push({ ...cardBase, id: index * 2 }, { ...cardBase, id: index * 2 + 1 });
      });

      // Crucial: Wait for images to be ready before showing grid
      await preloadImages(imageUrls);

      setCards([...gameCards].sort(() => Math.random() - 0.5));
      setStatus(GameStatus.PLAYING);
    } catch (error) {
      console.error("Initialization error", error);
      setStatus(GameStatus.IDLE);
      alert("Failed to start game. Please try a different theme.");
    }
  };

  const handleCardClick = (id: number) => {
    if (flippedIds.length === 2) return;
    playSound('flip');
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    setFlippedIds(prev => [...prev, id]);
  };

  useEffect(() => {
    if (flippedIds.length === 2) {
      setAttempts(prev => prev + 1);
      const [id1, id2] = flippedIds;
      const c1 = cards.find(c => c.id === id1);
      const c2 = cards.find(c => c.id === id2);

      if (c1 && c2 && c1.label === c2.label) {
        setTimeout(() => {
          playSound('match');
          setCards(prev => prev.map(c => 
            (c.id === id1 || c.id === id2) ? { ...c, isMatched: true, isFlipped: false } : c
          ));
          setMatches(prev => {
            const next = prev + 1;
            if (next === 8) handleWin();
            return next;
          });
          setFlippedIds([]);
        }, 500);
      } else {
        setTimeout(() => {
          playSound('mismatch');
          setCards(prev => prev.map(c => (c.id === id1 || c.id === id2) ? { ...c, isFlipped: false } : c));
          setFlippedIds([]);
        }, 1000);
      }
    }
  }, [flippedIds]);

  const handleWin = () => {
    playSound('win');
    setStatus(GameStatus.WON);
    if (theme) {
      const currentBest = localStorage.getItem(`high-score-${theme.name}`);
      const best = currentBest ? parseInt(currentBest, 10) : Infinity;
      
      setTimeout(() => {
        setAttempts(finalAttempts => {
           if (finalAttempts < best) {
            localStorage.setItem(`high-score-${theme.name}`, finalAttempts.toString());
            setHighScore(finalAttempts);
            setIsNewRecord(true);
          }
          return finalAttempts;
        });
      }, 100);
    }
  };

  const shareResults = () => {
    if (!theme) return;
    const text = `🧠 AI Memory Master\nTheme: ${theme.emoji} ${theme.name}\nResult: ${attempts} attempts! 🏆\n\nPlay here: ${window.location.href}`;
    navigator.clipboard.writeText(text).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 relative overflow-hidden">
      {status === GameStatus.WON && [...Array(20)].map((_, i) => (
        <div 
          key={i} 
          className="confetti" 
          style={{ 
            left: `${Math.random() * 100}%`, 
            animationDelay: `${Math.random() * 3}s`,
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 4)]
          }}
        />
      ))}

      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bounce flex items-center gap-3">
          <i className="fas fa-check-circle text-xl"></i>
          <span className="font-bold">Results copied! Go share your victory.</span>
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-br from-indigo-400 via-emerald-400 to-sky-400 bg-clip-text text-transparent mb-4 drop-shadow-sm">
          AI MEMORY MASTER
        </h1>
        <p className="text-slate-400 text-lg font-medium opacity-80">Infinite memory challenges powered by Gemini AI.</p>
      </div>

      {status === GameStatus.IDLE && (
        <div className="flex flex-col items-center space-y-6 bg-slate-800/50 backdrop-blur-sm p-10 rounded-[2.5rem] shadow-2xl border border-slate-700/50 transition-all hover:border-indigo-500/30">
          <div className="text-7xl animate-pulse">🧠</div>
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Create Your World</h2>
            <p className="text-slate-400 text-sm">Input any theme and Gemini will build a custom game set for you.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); initializeGame(userPrompt); }} className="w-full max-w-md space-y-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cyberpunk, Ancient Rome, Cute Puppies..."
                className="w-full bg-slate-900/80 border-2 border-slate-700 rounded-2xl px-5 py-4 text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="group w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-900/20 active:scale-95">
              <i className="fas fa-magic group-hover:rotate-12 transition-transform"></i> GENERATE DECK
            </button>
            <button type="button" onClick={() => initializeGame()} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-2xl transition-all border border-slate-700 active:scale-95">
              SURPRISE ME
            </button>
          </form>
        </div>
      )}

      {status === GameStatus.LOADING && (
        <div className="flex flex-col items-center justify-center py-24 space-y-8">
          <div className="relative">
             <div className="w-24 h-24 border-8 border-slate-800 rounded-full"></div>
             <div className="absolute inset-0 w-24 h-24 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-white tracking-widest uppercase">{loadingStep}</p>
            <p className="text-slate-500 text-sm mt-2">Personalizing your experience...</p>
          </div>
        </div>
      )}

      {(status === GameStatus.PLAYING || status === GameStatus.WON) && theme && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-wrap items-center justify-between gap-6 bg-slate-800/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-indigo-500/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-700">
                {theme.emoji}
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">{theme.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    {highScore ? `Record: ${highScore} Attempts` : 'New Discovery'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-10">
              <div className="text-center">
                <p className="text-3xl font-black text-indigo-400 tabular-nums">{attempts}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Tries</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-400 tabular-nums">{matches}<span className="text-slate-600">/8</span></p>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Pairs</p>
              </div>
            </div>

            <button onClick={() => setStatus(GameStatus.IDLE)} className="bg-slate-700/50 hover:bg-slate-600 px-5 py-2.5 rounded-xl text-xs font-black transition-all border border-slate-600/50 active:scale-95">
              RESET
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 md:gap-6">
            {cards.map(card => (
              <Card key={card.id} card={card} onClick={handleCardClick} disabled={flippedIds.length === 2} />
            ))}
          </div>

          {status === GameStatus.WON && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
              <div className="bg-slate-900 border-2 border-white/10 p-10 rounded-[3rem] text-center max-w-md shadow-[0_0_100px_rgba(79,70,229,0.3)] animate-in fade-in zoom-in-95 duration-500">
                <div className="relative inline-block mb-6">
                  <div className="text-8xl animate-bounce">🏆</div>
                  {isNewRecord && (
                    <div className="absolute -top-4 -right-8 bg-yellow-400 text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg rotate-12 uppercase tracking-tighter">
                      Personal Best!
                    </div>
                  )}
                </div>
                <h2 className="text-4xl font-black text-white mb-3">CONQUERED!</h2>
                <p className="text-slate-400 mb-8 font-medium">
                  The <span className="text-indigo-400 underline decoration-indigo-500/50">{theme.name}</span> world was mastered in <strong>{attempts}</strong> attempts.
                </p>
                <div className="flex flex-col gap-4">
                  <button onClick={shareResults} className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 hover:bg-indigo-50 active:scale-95">
                    <i className="fas fa-share-alt"></i> PUBLISH RESULTS
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => initializeGame(userPrompt)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95">
                      REPLAY
                    </button>
                    <button onClick={() => setStatus(GameStatus.IDLE)} className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95">
                      NEW THEME
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-20 text-center space-y-4">
        <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all">
           <i className="fab fa-google text-2xl"></i>
           <i className="fas fa-brain text-2xl"></i>
           <i className="fas fa-microchip text-2xl"></i>
        </div>
        <p className="text-slate-600 text-xs font-bold uppercase tracking-[0.2em]">Deployment V1.0.4 • Stable Build</p>
      </div>
    </div>
  );
};

export default App;
