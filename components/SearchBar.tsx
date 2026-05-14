"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

type Track = {
  id: number;
  title: string;
  artist: string;
  cover: string;
};

// Recibimos una función "onGuess" que se ejecuta cuando el usuario elige una canción
export default function SearchBar({ onGuess, disabled }: { onGuess: (t: Track) => void, disabled: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  // Efecto "Debounce": Espera a que dejes de escribir para buscar (ahorra peticiones)
  useEffect(() => {
    const delay = 500;
    const timer = setTimeout(() => {
      (async () => {
        if (query.length < 2) {
          setResults([]);
          return;
        }

        // Abort previous request
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
          if (!res.ok) {
            setResults([]);
            setIsSearching(false);
            return;
          }
          const data = await res.json();
          setResults(data);
        } catch (err: any) {
          if (err.name === 'AbortError') return; // ignore aborted
          console.error('Search error', err);
        } finally {
          setIsSearching(false);
        }
      })();
    }, delay);

    return () => {
      clearTimeout(timer);
      // Do not abort here to allow in-flight fetch to finish when unmounting is not intended
    };
  }, [query]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return (
    <div className="relative w-full max-w-md z-50">
      {/* INPUT */}
      <div className="relative">
        <input
          type="text"
          placeholder={disabled ? "Juego terminado" : "Buscar canción o artista..."}
          className="w-full rounded-2xl border px-4 py-4 pl-12 text-sm outline-none transition-all duration-300 placeholder:text-[color:var(--muted)] disabled:opacity-50"
          style={{
            background: "var(--surface-strong)",
            color: "var(--foreground)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
        />
        <Search className="absolute left-4 top-4 text-[color:var(--muted)]" size={18} />
        {isSearching && (
          <Loader2 className="absolute right-4 top-4 animate-spin text-[color:var(--muted)]" size={18} />
        )}
      </div>

      {/* LISTA DE RESULTADOS */}
      {results.length > 0 && !disabled && (
        <ul className="absolute mt-3 w-full overflow-y-auto rounded-3xl border z-50 max-h-72"
          style={{
            background: "var(--surface-strong)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          {results.map((track) => (
            <li 
              key={track.id}
              onClick={() => {
                onGuess(track);
                setQuery(""); // Limpiar input
                setResults([]); // Cerrar lista
              }}
              className="flex cursor-pointer items-center gap-3 border-b px-4 py-3 transition-colors last:border-0 hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: "var(--border)" }}
            >
              <img src={track.cover} alt="cover" className="h-11 w-11 rounded-xl object-cover shadow-sm" />
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{track.title}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{track.artist}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}