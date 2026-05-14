"use client";
import { useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { ARTISTS } from '@/data/artist';

type Props = {
  selected?: number | null;
  onSelect: (artistId: number) => void;
};

export default function ArtistSelector({ selected = null, onSelect }: Props) {
  const [q, setQ] = useState('');
  const list = ARTISTS.filter(a => a.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar artista..."
          className="w-full rounded-2xl border px-4 py-4 pl-11 text-sm outline-none transition-all duration-300 placeholder:text-[color:var(--muted)]"
          style={{
            background: "var(--surface-strong)",
            color: "var(--foreground)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
        />
        <Search className="absolute left-4 top-4 text-[color:var(--muted)]" size={18} />
      </div>
      {q.length > 0 && (
        <ul className="mt-3 max-h-56 overflow-y-auto rounded-3xl border p-2"
          style={{
            background: "var(--surface-strong)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          {list.map(a => (
            <li
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={`flex min-h-12 cursor-pointer items-center justify-between rounded-2xl px-3 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${selected === a.id ? 'ring-1 ring-[color:var(--accent)]' : ''}`}
            >
              <div>
                <div className="font-semibold" style={{ color: "var(--foreground)" }}>{a.name}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{a.genre}</div>
              </div>
              {selected === a.id ? <CheckCircle2 size={18} className="text-[color:var(--accent)]" /> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
