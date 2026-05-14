import React from 'react';

type Props = {
  mode: 'daily' | 'infinite' | 'one_life' | 'artist';
  onChange: (mode: Props['mode']) => void;
};

export default function ModeSelector({ mode, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[
        { id: 'daily', label: 'Diario' },
        { id: 'infinite', label: 'Infinito' },
        { id: 'one_life', label: '1 Vida' },
        { id: 'artist', label: 'Artista' },
      ].map((item) => {
        const active = mode === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id as Props['mode'])}
            className={`mode-chip min-h-11 rounded-full px-3 py-2 text-xs font-semibold tracking-wide transition-all duration-300 hover:-translate-y-0.5 sm:min-h-0 ${active ? 'mode-chip-active' : ''}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
