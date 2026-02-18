"use client";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

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

  // Efecto "Debounce": Espera a que dejes de escribir para buscar (ahorra peticiones)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        const res = await fetch(`/api/search?q=${query}`);
        const data = await res.json();
        setResults(data);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 500); // Espera 500ms

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative w-full max-w-md mt-6 z-50">
      {/* INPUT */}
      <div className="relative">
        <input
          type="text"
          placeholder={disabled ? "Juego terminado" : "Buscar canción o artista..."}
          className="w-full p-4 pl-12 rounded-lg bg-neutral-800 text-white border border-neutral-600 focus:border-green-500 outline-none placeholder-gray-500 disabled:opacity-50"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
        />
        <Search className="absolute left-4 top-4 text-gray-400" size={20} />
      </div>

      {/* LISTA DE RESULTADOS */}
      {results.length > 0 && !disabled && (
        <ul className="absolute w-full bg-neutral-800 border border-neutral-700 rounded-lg mt-2 shadow-2xl max-h-60 overflow-y-auto z-50">
          {results.map((track) => (
            <li 
              key={track.id}
              onClick={() => {
                onGuess(track);
                setQuery(""); // Limpiar input
                setResults([]); // Cerrar lista
              }}
              className="p-3 hover:bg-neutral-700 cursor-pointer flex items-center gap-3 transition-colors border-b border-neutral-700 last:border-0"
            >
              <img src={track.cover} alt="cover" className="w-10 h-10 rounded" />
              <div className="text-left">
                <p className="font-bold text-sm text-white">{track.title}</p>
                <p className="text-xs text-gray-400">{track.artist}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}