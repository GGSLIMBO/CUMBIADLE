"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Music, AlertCircle, Disc, Trophy, Frown, Flame, BarChart3, X, RotateCcw } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import ModeSelector from '@/components/ModeSelector';
import ArtistSelector from '@/components/ArtistSelector';
import ThemeToggle from '@/components/ThemeToggle';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [attempts, setAttempts] = useState(0); 
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [guesses, setGuesses] = useState<Track[]>([]);
  const [mode, setMode] = useState<'daily'|'infinite'|'one_life'|'artist'>('daily');
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [maxAttempts, setMaxAttempts] = useState<number>(6);
  const [fullPreviewAllowed, setFullPreviewAllowed] = useState<boolean>(false);
  const [showResultPanel, setShowResultPanel] = useState(false);
  const [roundNonce, setRoundNonce] = useState(0);
  
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

  const previewFull = fullPreviewAllowed;

  const getStateKey = (currentMode: 'daily'|'infinite'|'one_life'|'artist', currentArtistId: number | null, currentRoundNonce: number) => {
    if (currentMode === 'infinite' || currentMode === 'artist') {
      return `cumbiadleState:${currentMode}:${currentRoundNonce}`;
    }

    return `cumbiadleState:${currentMode}:${currentArtistId ?? ''}`;
  };

  // --- 1. CARGA INICIAL Y RECUPERACIÓN DE DATOS ---
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setErrorMsg(null);
    setShowResultPanel(false);
    setGameData(null);
    setSolution(null);
    setAttempts(0);
    setGuesses([]);
    setGameStatus('playing');
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
    }

    if (mode === 'artist' && !selectedArtistId) {
      setMaxAttempts(6);
      setFullPreviewAllowed(false);
      setLoading(false);
      return () => controller.abort();
    }

    (async () => {
      try {
        const params = new URLSearchParams();
        if (mode && mode !== 'daily') params.set('mode', mode);
        if (mode === 'artist' && selectedArtistId) params.set('artist', String(selectedArtistId));
        const res = await fetch(`/api/game?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        if (!data || data.error) {
          setErrorMsg(data?.error || 'Error cargando partida');
          setLoading(false);
          return;
        }
        setGameData(data.gameData);
        setSolution(data.solution);
        setMaxAttempts(data.maxAttempts ?? 6);
        setFullPreviewAllowed(!!data.fullPreviewAllowed);

        // A. Cargar Estadísticas Generales (Rachas)
        const savedStats = localStorage.getItem("cumbiadleStats");
        if (savedStats) {
            setStats(JSON.parse(savedStats));
        }

        // B. Cargar Estado por modo (clave compuesta)
        const stateKey = getStateKey(mode, selectedArtistId, roundNonce);
        const savedGameState = localStorage.getItem(stateKey);
        if (savedGameState) {
            const parsedState = JSON.parse(savedGameState);
            if (parsedState.date === data.gameData.date) {
                setGuesses(parsedState.guesses);
                setAttempts(parsedState.attempts);
                setGameStatus(parsedState.gameStatus);
            setShowResultPanel(parsedState.gameStatus !== 'playing');
            } else {
                localStorage.removeItem(stateKey);
            }
        }
        setLoading(false);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error("Error cargando:", err);
        setErrorMsg('No se pudo cargar la partida. Usando fallback si está disponible.');
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [mode, selectedArtistId, roundNonce]);
  // --- 2. GUARDAR ESTADO PROGRESIVO (Para que no pierda intentos al recargar) ---
  useEffect(() => {
    if (gameData?.date) {
      const stateKey = getStateKey(mode, selectedArtistId, roundNonce);
      const stateToSave = { date: gameData.date, guesses, attempts, gameStatus, showResultPanel, roundNonce };
      localStorage.setItem(stateKey, JSON.stringify(stateToSave));
    }
  }, [guesses, attempts, gameStatus, gameData, mode, selectedArtistId, showResultPanel, roundNonce]);

  const resetForMode = (nextMode: 'daily'|'infinite'|'one_life'|'artist') => {
    setMode(nextMode);
    setSelectedArtistId(null);
    setShowResultPanel(false);
    setRoundNonce(0);
    setGameStatus('playing');
    setAttempts(0);
    setGuesses([]);
    setGameData(null);
    setSolution(null);
    setMaxAttempts(6);
    setFullPreviewAllowed(false);
  };

  const openMode = (nextMode: 'daily'|'infinite'|'one_life'|'artist') => {
    setShowResultPanel(false);
    resetForMode(nextMode);
  };

  const nextInfiniteSong = () => {
    if (mode !== 'infinite' && mode !== 'artist') return;
    const currentStateKey = getStateKey(mode, selectedArtistId, roundNonce);
    localStorage.removeItem(currentStateKey);
    setShowResultPanel(false);
    setGameStatus('playing');
    setAttempts(0);
    setGuesses([]);
    setGameData(null);
    setSolution(null);
    setMaxAttempts(6);
    setFullPreviewAllowed(false);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
    }
    setRoundNonce((value) => value + 1);
  };

  const handlePlay = () => {
    if (!audioRef.current || !gameData) return;
    const durationToPlay = unlockTimes[attempts] ?? unlockTimes[unlockTimes.length - 1] ?? 16;
    audioRef.current.currentTime = 0;
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
    if (!previewFull) {
      setTimeout(() => {
        audioRef.current?.pause();
        setIsPlaying(false);
      }, durationToPlay * 1000);
    } else {
      // let the audio play fully; stop when it ends
      audioRef.current.onended = () => setIsPlaying(false);
    }
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

    const max = maxAttempts ?? 6;
    if (isIdMatch || isTitleMatch) {
      setGameStatus("won");
      setShowResultPanel(true);
      updateStats("won");
    } else {
      if (attempts < max - 1) {
        setAttempts(attempts + 1);
      } else {
        setGameStatus("lost");
        setAttempts(max);
        setShowResultPanel(true);
        updateStats("lost");
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
        return name
          .split(' ')
          .map((word) => word.length ? word[0] + word.slice(1).replace(/[a-zA-Z0-9áéíóúñÑ]/g, '_') : '')
          .join(' ');
    }
    return name.replace(/[a-zA-Z0-9áéíóúñÑ]/g, '_');
  };

  const isCoverBlurred = gameStatus === "playing" && attempts < 5;
  const waitingForArtist = mode === 'artist' && !selectedArtistId;
  const resultModeButtons = [
    { mode: 'daily' as const, label: 'Diario' },
    { mode: 'infinite' as const, label: 'Infinito' },
    { mode: 'one_life' as const, label: '1 Vida' },
    { mode: 'artist' as const, label: 'Artista' },
  ].filter((item) => item.mode !== mode);

  if (loading) return (
    <div className="app-shell min-h-screen flex flex-col items-center justify-center gap-5 px-4 sm:px-6" style={{ color: "var(--foreground)" }}>
        <div className="glass-panel flex w-full max-w-sm flex-col items-center gap-4 rounded-[2rem] px-6 py-9 text-center sm:max-w-md sm:px-8">
          <div className="accent-gradient h-16 w-16 animate-spin rounded-[1.5rem] opacity-90 [animation-duration:1.6s]"></div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--muted)]">Cargando el escenario</p>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Metiéndole cumbia...</h2>
        </div>
    </div>
  );

  if (waitingForArtist) {
    return (
      <main className="app-shell min-h-screen w-full px-4 py-5 sm:px-6" style={{ color: "var(--foreground)" }}>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          <div className="glass-panel flex flex-col gap-5 rounded-[2rem] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="accent-gradient-text text-sm font-bold uppercase tracking-[0.45em]">Cumbiadle</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Modo Artista infinito</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-strong sm:text-base">Elegí un artista para entrar en una ronda infinita con canciones del mismo catálogo y una UI más clara.</p>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <ThemeToggle />
              <div className="flex items-center gap-2 rounded-full px-4 py-2 mode-chip">
                <Flame size={18} className={`${stats.currentStreak > 0 ? "text-[color:var(--accent)]" : "text-[color:var(--muted)]"}`} />
                <span className="font-semibold">{stats.currentStreak}</span>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-2xl glass-panel rounded-[2rem] p-5 sm:p-8">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Elegí un artista</h2>
            <p className="mt-2 text-sm text-muted-strong">El catálogo se filtra por artista y cada ronda será nueva hasta que te canses.</p>
            <div className="mt-5">
              <ArtistSelector selected={selectedArtistId} onSelect={(id) => setSelectedArtistId(id)} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen w-full px-4 py-5 sm:px-6" style={{ color: "var(--foreground)" }}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="glass-panel flex flex-col gap-5 rounded-[2rem] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="space-y-4">
            <div>
              <div className="accent-gradient-text text-sm font-bold uppercase tracking-[0.45em]">Cumbiadle</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Tu cumbia, cuando y donde quieras.</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-strong sm:text-base">
                Elegí un modo, buscá canciones con una interfaz más clara y alterná entre tema claro y oscuro.
              </p>
            </div>
            <ModeSelector mode={mode} onChange={resetForMode} />
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-full px-4 py-2 mode-chip">
              <Flame size={18} className={`${stats.currentStreak > 0 ? "text-[color:var(--accent)]" : "text-[color:var(--muted)]"}`} />
              <span className="font-semibold">{stats.currentStreak}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">racha</span>
            </div>
          </div>
        </header>

      {/* --- TARJETA PRINCIPAL --- */}
      <div className="glass-panel relative overflow-hidden rounded-[2rem] transition-all duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)] opacity-60" />
        
        {/* PARTE SUPERIOR */}
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex-shrink-0">
                <button 
                    onClick={handlePlay} 
                    disabled={isPlaying || gameStatus !== "playing" || !gameData?.previewUrl} 
                    className="group flex h-14 w-14 items-center justify-center rounded-[1.3rem] border transition-all duration-300 hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 sm:h-16 sm:w-16"
                    style={{
                      background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-3) 100%)",
                      borderColor: "var(--border)",
                      boxShadow: "var(--shadow)",
                    }}
                >
                  {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" className="ml-1 group-hover:animate-pulse" />}
                </button>
            </div>

            {/* Banner de error si hubo problemas cargando la partida */}
            {errorMsg && (
              <div className="absolute left-4 right-4 top-4">
                <div className="rounded-2xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm text-red-200 backdrop-blur-md">
                  {errorMsg}
                </div>
              </div>
            )}

            <div className="flex flex-col overflow-hidden justify-center sm:ml-2">
                <div className="text-xs font-bold uppercase tracking-[0.45em] text-[color:var(--muted)]">
                    {mode === 'daily' ? 'Partida diaria' : mode === 'infinite' ? 'Modo infinito' : mode === 'one_life' ? '1 vida' : 'Artista custom'}
                </div>
                <div className="mt-1 truncate text-lg font-black tracking-tight sm:text-2xl">
                    {solution && getDisplayArtistName(solution.artist)}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="mode-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]">
                        <div className={`h-2.5 w-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-[color:var(--accent)]'}`}></div>
                        {unlockTimes[attempts] || 16} segs
                    </div>
                    <div className="surface-soft inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-strong)]">
                      {previewFull ? 'preview completo' : 'preview escalonado'}
                    </div>
                </div>
            </div>

            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[1.5rem] border shadow-xl sm:h-24 sm:w-24 sm:ml-2" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
                {solution?.albumCover ? (
                    <img 
                        src={solution.albumCover} 
                        alt="Cover" 
                        draggable="false" 
                        onContextMenu={(e) => e.preventDefault()} 
                        className={`h-full w-full object-cover transition-all duration-700 select-none pointer-events-none 
                          ${isCoverBlurred ? "blur-[10px] scale-110 opacity-80" : "blur-0 scale-100 opacity-100"}
                        `}
                    />
                ) : (
                      <div className="flex h-full w-full items-center justify-center"><Disc className="text-[color:var(--muted)]"/></div>
                )}
            </div>
        </div>

        {/* BARRAS DE PROGRESO */}
                <div className="flex gap-1.5 px-5 pb-2 sm:px-7">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 
                      ${i < attempts ? "bg-[color:var(--accent)]/85" : i === attempts ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-y-125" : "bg-white/10"}
                `} 
            />
          ))}
        </div>
        
        {gameData && <audio ref={audioRef} src={gameData.previewUrl} />}

        {/* PISTAS */}
        <div className="relative border-t p-4 sm:p-5" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--surface) 75%, transparent)" }}>
          <div className={`flex items-center gap-3 rounded-2xl p-3 text-sm transition-all duration-500 ${attempts >= 2 ? "opacity-100 translate-x-0" : "opacity-55 translate-x-1"}`}>
            <div className={`rounded-xl p-2 ${attempts >= 2 ? "bg-emerald-500/15 text-emerald-500" : "bg-white/5 text-[color:var(--muted)]"}`}><Music size={14}/></div>
            <span className={attempts >= 2 ? "font-medium text-[color:var(--foreground)]" : "text-[color:var(--muted)]"}>
                    {attempts >= 2 ? `Género: ${solution?.genre}` : "Pista de Género (Intento 3)"}
                </span>
            </div>

          <div className={`flex items-center gap-3 rounded-2xl p-3 text-sm transition-all duration-500 ${attempts >= 3 ? "opacity-100 translate-x-0" : "opacity-55 translate-x-1"}`}>
            <div className={`rounded-xl p-2 ${attempts >= 3 ? "bg-amber-500/15 text-amber-500" : "bg-white/5 text-[color:var(--muted)]"}`}><AlertCircle size={14}/></div>
            <span className={attempts >= 3 ? "font-medium text-[color:var(--foreground)]" : "text-[color:var(--muted)]"}>
                    {attempts >= 3 ? `Debut: ${solution?.formationYear}` : "Pista de Año (Intento 4)"}
                </span>
            </div>
        </div>
        
        {/* MENSAJE DE ÚLTIMA CHANCE */}
        {attempts === 5 && gameStatus === "playing" && (
             <div className="absolute left-0 top-0 w-full rounded-t-[2rem] bg-red-500/90 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-white animate-pulse">
                ¡Última Oportunidad!
            </div>
        )}
      </div>

      {/* --- ZONA DE ACCIÓN --- */}
      <div className="relative z-20 mt-5 w-full max-w-md">
          {gameStatus === "playing" ? (
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                {mode === 'artist' && (
                  <div className="mb-4">
                    <ArtistSelector selected={selectedArtistId} onSelect={(id) => setSelectedArtistId(id)} />
                  </div>
                )}
                <SearchBar onGuess={handleGuess} disabled={false} />
              <button 
                onClick={handleSkip} 
                className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl border px-4 py-3 text-xs font-bold uppercase tracking-[0.28em] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/5 sm:tracking-[0.35em]"
                style={{ borderColor: "var(--border)", color: "var(--muted-strong)" }}
              >
                No la sé, Saltar (+Segundos)
              </button>
            </div>
          ) : (
            // Botón para compartir o esperar mañana
             <div className="flex gap-2">
                 <button 
                    onClick={() => window.location.reload()} // Esto en el futuro podría ser "Compartir"
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-4 font-black transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01]"
                    style={{ background: "var(--surface-strong)", color: "var(--foreground)", boxShadow: "var(--shadow)" }}
                >
                    MAÑANA OTRO TEMA ⏳
                </button>
             </div>
          )}
      </div>

      {/* LISTA DE ERRORES */}
      <div className="mt-5 w-full max-w-md space-y-2 pb-10">
        {guesses.map((g, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border p-3 text-sm animate-in fade-in slide-in-from-bottom-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="h-full w-1 rounded-full bg-[color:var(--accent)]"></div>
                {g.title === "OMITIDO" ? 
                    <span className="font-mono text-[color:var(--muted)]">⏭️ SALTO</span> : 
                    <span className="line-clamp-1" style={{ color: "var(--foreground)" }}><span className="font-bold" style={{ color: "var(--accent)" }}>✕</span> {g.title} <span className="mx-1 text-xs" style={{ color: "var(--muted)" }}>•</span> {g.artist}</span>
                }
            </div>
        ))}
      </div>

      {/* MODAL DE RESULTADO FINAL + ESTADÍSTICAS */}
      {showResultPanel && gameStatus !== "playing" && solution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-xl animate-in fade-in duration-300 sm:p-4">
            <div className="glass-panel-strong w-full max-w-lg animate-in zoom-in-95 duration-300 rounded-[2rem] p-1">
              <div className="relative flex flex-col items-center rounded-[1.75rem] p-6 text-center sm:p-8" style={{ background: "var(--surface-strong)" }}>
                    <button
                      onClick={() => setShowResultPanel(false)}
                      className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                      aria-label="Cerrar panel de resultado"
                    >
                      <X size={18} />
                    </button>
                    
                    {gameStatus === "won" ? (
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-500/15 text-emerald-500 animate-bounce">
                            <Trophy size={32} />
                        </div>
                    ) : (
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-red-500/15 text-red-500">
                            <Frown size={32} />
                        </div>
                    )}

                    <h2 className={`mb-1 text-3xl font-black ${gameStatus === "won" ? "text-emerald-500" : "text-red-500"}`}>
                        {gameStatus === "won" ? "¡CORRECTO!" : "PERDISTE"}
                    </h2>
                    
                    {/* MINI ESTADÍSTICAS EN EL MODAL */}
                    <div className="my-5 grid w-full grid-cols-2 gap-3 sm:flex sm:justify-center">
                      <div className="surface-soft flex flex-col items-center rounded-2xl p-3">
                            <span className="text-2xl font-bold">{stats.currentStreak}</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Racha</span>
                        </div>
                       <div className="surface-soft flex flex-col items-center rounded-2xl p-3">
                            <span className="text-2xl font-bold">{stats.maxStreak}</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Max</span>
                        </div>
                    </div>

                    <div className="relative group mt-2">
                      <img src={solution.albumCover} className="mb-6 h-44 w-44 rounded-[1.75rem] object-cover shadow-2xl rotate-1 transition-transform duration-500 group-hover:rotate-0 sm:h-56 sm:w-56" style={{ border: "1px solid var(--border)" }} />
                        <div className="absolute -bottom-3 -right-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-3))" }}>
                            {solution.formationYear}
                        </div>
                    </div>
                    
                    <h3 className="mb-1 line-clamp-1 text-2xl font-black">{solution.title}</h3>
                    <p className="mb-8 text-lg font-medium" style={{ color: "var(--accent)" }}>{solution.artist}</p>
                    
                    <button 
                        onClick={() => window.location.reload()} 
                        className="w-full rounded-2xl px-4 py-3.5 font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                        style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-3) 100%)", boxShadow: "var(--shadow)" }}
                    >
                        Volver para ver resultados
                    </button>

                    {(mode === 'infinite' || mode === 'artist') && (
                      <button
                        onClick={nextInfiniteSong}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 font-bold transition-all duration-300 hover:-translate-y-0.5"
                        style={{ background: "var(--surface-soft)", borderColor: "var(--border)" }}
                      >
                        <RotateCcw size={16} />
                        Otra canción
                      </button>
                    )}

                    <div className="mt-4 w-full">
                      <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">Probar otro modo</div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {resultModeButtons.map((item) => (
                          <button
                            key={item.mode}
                            onClick={() => openMode(item.mode)}
                            className="min-h-12 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                            style={{ background: "var(--surface-soft)", borderColor: "var(--border)" }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                </div>
            </div>
        </div>
      )}
      </div>
    </main>
  );
}