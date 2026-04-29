export interface FallbackSong {
  previewUrl?: string;
  deezerId?: number;
  title: string;
  artist: string;
  albumCover?: string;
  albumYear?: string;
}

// Pool local de respaldo. Idealmente mantener algunos items con previews públicos
export const FALLBACK_SONGS: FallbackSong[] = [
  { title: 'La Cumbia de la Noche', artist: 'Artista Fallback 1', deezerId: 0, previewUrl: '' },
  { title: 'Baila Cumbia', artist: 'Artista Fallback 2', deezerId: 0, previewUrl: '' },
  { title: 'Tema Viejo', artist: 'Artista Fallback 3', deezerId: 0, previewUrl: '' },
  { title: 'Clásico de Cumbia', artist: 'Artista Fallback 4', deezerId: 0, previewUrl: '' },
  { title: 'Ritmo y Corazón', artist: 'Artista Fallback 5', deezerId: 0, previewUrl: '' }
];

export default FALLBACK_SONGS;
