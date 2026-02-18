"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Music, AlertCircle, Disc, Trophy, Frown, Flame, BarChart3 } from "lucide-react";
import SearchBar from "@/components/SearchBar";

// --- TIPOS ---
type GameData = { previewUrl: string; deezerId: number; date: string; }; // Agregamos date
type Solution = { title: string; artist: string; genre: string; formationYear: number; albumCover: string; };
type Track = { id: number; title: string; artist: string; };

// Tipo para las estadísticas guardadas
type UserStats = {
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null;
  gamesPlayed: number;
  gamesWon: number;
  winPercentage: number;
};

export default function Home() {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [attempts, setAttempts] = useState(0); 
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [guesses, setGuesses] = useState<Track[]>([]);
  
  // Estado para las Estadísticas
  const [stats, setStats] = useState<UserStats>({
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: null,
    gamesPlayed: 0,
    gamesWon: 0,
    winPercentage: 0
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockTimes = [1, 2, 4, 7, 11, 16];

  // --- 1. CARGA INICIAL Y RECUPERACIÓN DE DATOS ---
  useEffect(() => {
    fetch("/api/game")
      .then((res) => res.json())
      .then((data) => {
        setGameData(data.gameData);
        setSolution(data.solution);

        // A. Cargar Estadísticas Generales (Rachas)
        const savedStats = localStorage.getItem("cumbiadleStats");
        if (savedStats) {
            setStats(JSON.parse(savedStats));
        }

        // B. Cargar Estado de la Partida DE HOY (si ya jugó y recargó)
        const savedGameState = localStorage.getItem("cumbiadleState");
        if (savedGameState) {
            const parsedState = JSON.parse(savedGameState);
            // Si la partida guardada coincide con la fecha del servidor (HOY)
            if (parsedState.date === data.gameData.date) {
                setGuesses(parsedState.guesses);
                setAttempts(parsedState.attempts);
                setGameStatus(parsedState.gameStatus);
            } else {
                // Es una partida vieja, la borramos para empezar limpio
                localStorage.removeItem("cumbiadleState");
            }
        }
        setLoading(false);
      })
      .catch((err) => console.error("Error cargando:", err));
  }, []);

  // --- 2. GUARDAR ESTADO PROGRESIVO (Para que no pierda intentos al recargar) ---
  useEffect(() => {
    if (gameData?.date) {
        const stateToSave = {
            date: gameData.date,
            guesses,
            attempts,
            gameStatus
        };
        localStorage.setItem("cumbiadleState", JSON.stringify(stateToSave));
    }
  }, [guesses, attempts, gameStatus, gameData]);

  const handlePlay = () => {
    if (!audioRef.current || !gameData) return;
    const durationToPlay = unlockTimes[attempts];
    audioRef.current.currentTime = 0;
    audioRef.current.volume = 0.5;
    audioRef.current.play();
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.pause();
      setIsPlaying(false);
    }, durationToPlay * 1000);
  };

  // --- 3. LÓGICA DE ACTUALIZAR ESTADÍSTICAS AL TERMINAR ---
  const updateStats = (result: "won" | "lost") => {
    if (!gameData) return;

    setStats((prevStats) => {
        const newStats = { ...prevStats };
        const today = gameData.date; // Fecha que viene del server

        // Si ya jugó hoy (evitar doble contabilidad por error), no hacemos nada
        if (newStats.lastPlayedDate === today) return newStats;

        newStats.gamesPlayed += 1;
        newStats.lastPlayedDate = today;

        if (result === "won") {
            newStats.gamesWon += 1;
            newStats.currentStreak += 1;
            if (newStats.currentStreak > newStats.maxStreak) {
                newStats.maxStreak = newStats.currentStreak;
            }
        } else {
            newStats.currentStreak = 0; // Perdió, la racha vuelve a 0
        }

        newStats.winPercentage = Math.round((newStats.gamesWon / newStats.gamesPlayed) * 100);
        
        // Guardar en LocalStorage
        localStorage.setItem("cumbiadleStats", JSON.stringify(newStats));
        return newStats;
    });
  };

  // --- LÓGICA DE INTENTOS ---
  const cleanTitle = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split('(')[0].split('[')[0].split('-')[0].replace(/[^a-z0-9]/g, "");

  const handleGuess = (track: Track) => {
    if (!gameData || gameStatus !== "playing" || !solution) return;
    
    const newGuesses = [...guesses, track];
    setGuesses(newGuesses);

    const isIdMatch = track.id === gameData.deezerId;
    const isTitleMatch = cleanTitle(track.title) === cleanTitle(solution.title);

    if (isIdMatch || isTitleMatch) {
      setGameStatus("won");
      updateStats("won"); // <--- ACTUALIZAR RACHA
    } else {
      if (attempts < 5) {
        setAttempts(attempts + 1);
      } else {
        setGameStatus("lost");
        setAttempts(6);
        updateStats("lost"); // <--- ACTUALIZAR RACHA
      }
    }
  };

  const handleSkip = () => {
    if (gameStatus !== "playing") return;
    const skippedTrack = { id: 0, title: "OMITIDO", artist: "-" };
    handleGuess(skippedTrack);
  };

  // --- UI HELPERS ---
  const getDisplayArtistName = (name: string | undefined) => {
    if (!name) return "";
    if (gameStatus !== "playing") return name;
    if (attempts === 5) {
        return name.split(' ').map(word => 
            word[0] + word.slice(1).replace(/[a-zA-Z0-9áéíóúñÑ]/g, '_')
        ).join(' ');
    }
    return name.replace(/[a-zA-Z0-9áéíóúñÑ]/g, '_');
  };

  const isCoverBlurred = gameStatus === "playing" && attempts < 5;

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse tracking-widest uppercase text-sm font-bold">Metiendole Cumbia...</p>
    </div>
  );

  return (
    <main className="min-h-screen w-full bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center py-6 px-4">
      
      {/* HEADER CON RACHA Y LOGO */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 px-2">
         {/* Logo a la izquierda */}
         <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 tracking-tight drop-shadow-lg">
                Cumbiadle
            </h1>
         </div>

         {/* Racha a la derecha */}
         <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
            <Flame size={20} className={`${stats.currentStreak > 0 ? "text-orange-500 fill-orange-500 animate-pulse" : "text-gray-500"}`} />
            <span className="font-bold text-lg">{stats.currentStreak}</span>
         </div>
      </div>
      
      {/* --- TARJETA PRINCIPAL --- */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden transition-all duration-500 hover:shadow-pink-500/20">
        
        {/* PARTE SUPERIOR */}
        <div className="flex items-center justify-between p-6">
            <div className="flex-shrink-0">
                <button 
                    onClick={handlePlay} 
                    disabled={isPlaying || gameStatus !== "playing"} 
                    className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale shadow-lg shadow-pink-500/40 border border-white/20 group"
                >
                  {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" className="ml-1 group-hover:animate-pulse" />}
                </button>
            </div>

            <div className="flex flex-col ml-5 flex-grow overflow-hidden justify-center">
                <div className="text-xl font-mono font-bold text-white/90 tracking-[0.15em] truncate drop-shadow-md">
                    {solution && getDisplayArtistName(solution.artist)}
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <div className="bg-black/40 px-3 py-1 rounded-full text-xs font-bold text-pink-300 border border-white/5 flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-ping' : 'bg-pink-500'}`}></div>
                        {unlockTimes[attempts] || 16} SEGS
                    </div>
                </div>
            </div>

            <div className="ml-4 flex-shrink-0 relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white/10 shadow-lg bg-black/50">
                {solution?.albumCover ? (
                    <img 
                        src={solution.albumCover} 
                        alt="Cover" 
                        draggable="false" 
                        onContextMenu={(e) => e.preventDefault()} 
                        className={`w-full h-full object-cover transition-all duration-700 select-none pointer-events-none 
                            ${isCoverBlurred ? "blur-[8px] scale-110 opacity-80" : "blur-0 scale-100 opacity-100"}
                        `}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"><Disc className="text-white/20"/></div>
                )}
            </div>
        </div>

        {/* BARRAS DE PROGRESO */}
        <div className="flex gap-1.5 px-6 mb-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 
                    ${i < attempts ? "bg-red-500/80" : i === attempts ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-y-125" : "bg-white/10"}
                `} 
            />
          ))}
        </div>
        
        {gameData && <audio ref={audioRef} src={gameData.previewUrl} />}

        {/* PISTAS */}
        <div className="bg-black/20 p-4 border-t border-white/5 backdrop-blur-md space-y-2">
            <div className={`flex items-center gap-3 text-sm transition-all duration-500 ${attempts >= 2 ? "opacity-100 translate-x-0" : "opacity-40 translate-x-2"}`}>
                <div className={`p-1.5 rounded-lg ${attempts >= 2 ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/20"}`}><Music size={14}/></div>
                <span className={attempts >= 2 ? "text-green-200 font-medium" : "text-white/30"}>
                    {attempts >= 2 ? `Género: ${solution?.genre}` : "Pista de Género (Intento 3)"}
                </span>
            </div>

            <div className={`flex items-center gap-3 text-sm transition-all duration-500 ${attempts >= 3 ? "opacity-100 translate-x-0" : "opacity-40 translate-x-2"}`}>
                <div className={`p-1.5 rounded-lg ${attempts >= 3 ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5 text-white/20"}`}><AlertCircle size={14}/></div>
                <span className={attempts >= 3 ? "text-yellow-200 font-medium" : "text-white/30"}>
                    {attempts >= 3 ? `Debut: ${solution?.formationYear}` : "Pista de Año (Intento 4)"}
                </span>
            </div>
        </div>
        
        {/* MENSAJE DE ÚLTIMA CHANCE */}
        {attempts === 5 && gameStatus === "playing" && (
             <div className="absolute top-0 left-0 w-full bg-red-600/90 text-white text-[10px] font-bold text-center py-1 tracking-widest uppercase animate-pulse">
                ¡Última Oportunidad!
            </div>
        )}
      </div>

      {/* --- ZONA DE ACCIÓN --- */}
      <div className="w-full max-w-md mt-6 relative z-20">
          {gameStatus === "playing" ? (
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
              <SearchBar onGuess={handleGuess} disabled={false} />
              <button 
                onClick={handleSkip} 
                className="w-full mt-3 py-3 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors border border-transparent hover:border-white/10 rounded-lg hover:bg-white/5"
              >
                No la sé, Saltar (+Segundos)
              </button>
            </div>
          ) : (
            // Botón para compartir o esperar mañana
             <div className="flex gap-2">
                 <button 
                    onClick={() => window.location.reload()} // Esto en el futuro podría ser "Compartir"
                    className="flex-1 py-4 bg-white text-purple-900 font-black rounded-xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                    MAÑANA OTRO TEMA ⏳
                </button>
             </div>
          )}
      </div>

      {/* LISTA DE ERRORES */}
      <div className="w-full max-w-md mt-6 space-y-2 pb-10">
        {guesses.map((g, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 text-white/70 text-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="w-1 h-full bg-red-500 rounded-full"></div>
                {g.title === "OMITIDO" ? 
                    <span className="opacity-50 font-mono">⏭️ SALTO</span> : 
                    <span className="line-clamp-1"><span className="text-red-400 font-bold">✕</span> {g.title} <span className="text-white/30 text-xs mx-1">•</span> {g.artist}</span>
                }
            </div>
        ))}
      </div>

      {/* MODAL DE RESULTADO FINAL + ESTADÍSTICAS */}
      {gameStatus !== "playing" && solution && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-1 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300 border border-white/10">
                <div className="bg-slate-900 rounded-[22px] p-8 text-center flex flex-col items-center">
                    
                    {gameStatus === "won" ? (
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 text-green-400 animate-bounce">
                            <Trophy size={32} />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-400">
                            <Frown size={32} />
                        </div>
                    )}

                    <h2 className={`text-3xl font-extrabold mb-1 ${gameStatus === "won" ? "text-green-400" : "text-red-400"}`}>
                        {gameStatus === "won" ? "¡CORRECTO!" : "PERDISTE"}
                    </h2>
                    
                    {/* MINI ESTADÍSTICAS EN EL MODAL */}
                    <div className="flex gap-4 my-4 w-full justify-center">
                        <div className="bg-white/5 p-2 rounded-lg flex flex-col items-center w-20">
                            <span className="text-2xl font-bold text-white">{stats.currentStreak}</span>
                            <span className="text-[10px] text-white/50 uppercase">Racha</span>
                        </div>
                         <div className="bg-white/5 p-2 rounded-lg flex flex-col items-center w-20">
                            <span className="text-2xl font-bold text-white">{stats.maxStreak}</span>
                            <span className="text-[10px] text-white/50 uppercase">Max</span>
                        </div>
                    </div>

                    <div className="relative group mt-2">
                        <img src={solution.albumCover} className="w-48 h-48 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.6)] mb-6 border border-white/10 rotate-1 group-hover:rotate-0 transition-transform duration-500" />
                        <div className="absolute -bottom-3 -right-3 bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            {solution.formationYear}
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{solution.title}</h3>
                    <p className="text-lg text-pink-400 font-medium mb-8">{solution.artist}</p>
                    
                    <button 
                        onClick={() => window.location.reload()} 
                        className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        Volver para ver resultados
                    </button>
                </div>
            </div>
        </div>
      )}
    </main>
  );
}