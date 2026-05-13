import { NextResponse } from 'next/server';
import { ARTISTS } from '@/data/artist';
import { FALLBACK_SONGS } from '@/data/fallbackPool';

interface DeezerSong {
  id: number;
  title: string;
  preview: string;
  artist: {
    name: string;
  };
  album: {
    cover_medium: string;
    release_date: string;
  };
}

// Función para generar un número "aleatorio" pero fijo según la fecha (Seed)
// Si le pasas la misma fecha, siempre devuelve el mismo número.
function getSeededIndex(seed: string, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convertir a 32bit integer
  }
  return Math.abs(hash) % max;
}

// Simple in-memory cache for the daily response (keyed by date)
const gameCache = new Map<string, { expires: number; payload: any }>();

export async function GET() {
  try {
    // 1. OBTENER FECHA ACTUAL (Zona Horaria Argentina)
    const now = new Date();
    const argentinaTime = new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now); 
    // argentinaTime será algo como "18/02/2026"

    // 2. SELECCIONAR ARTISTA BASADO EN LA FECHA
    // Usamos la fecha como semilla para elegir el índice del array
    const artistIndex = getSeededIndex(argentinaTime, ARTISTS.length);
    const dailyArtist = ARTISTS[artistIndex];

    // If we already have a cached payload for today, return it
    const cached = gameCache.get(argentinaTime);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(cached.payload);
    }

    if (!dailyArtist) {
      return NextResponse.json({ error: "Error seleccionando artista diario" }, { status: 500 });
    }

    // 3. BUSCAR EN DEEZER
    // Usamos la lógica de contexto que ya teníamos (Cumbia/Cuarteto)
    const searchContext = dailyArtist.genre.toLowerCase().includes("cuarteto") 
      ? "cuarteto" 
      : "cumbia";

    const query = `artist:"${dailyArtist.name}" ${searchContext}`;
    
    // IMPORTANTE: Agregamos cache para no reventar a Deezer si entran muchos usuarios
    // revalidate: 3600 significa que Next.js guarda la respuesta de Deezer por 1 hora.
    // Intentar obtener resultados desde Deezer con reintentos sencillos
    let validSongs: DeezerSong[] = [];
    try {
      const deezerResponse = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}`, { next: { revalidate: 3600 } });
      const data = await deezerResponse.json();
      validSongs = data.data?.filter((s: DeezerSong) => s.preview) || [];

      if (validSongs.length === 0) {
        const fallbackRes = await fetch(`https://api.deezer.com/search?q=artist:"${encodeURIComponent(dailyArtist.name)}"`, { next: { revalidate: 3600 } });
        const fallbackData = await fallbackRes.json();
        validSongs = fallbackData.data?.filter((s: DeezerSong) => s.preview) || [];
      }
    } catch (err) {
      // Deezer request failed — we'll fallback below
      console.error('Deezer error:', err);
    }

    let payload: any;

    if (validSongs.length === 0) {
      // Fallback a pool local si Deezer no devolvió previews
      const fallbackIndex = getSeededIndex(argentinaTime + dailyArtist.name, FALLBACK_SONGS.length);
      const fallbackSong = FALLBACK_SONGS[fallbackIndex];

      payload = {
        gameData: {
          previewUrl: fallbackSong.previewUrl || '',
          deezerId: fallbackSong.deezerId || 0,
          date: argentinaTime,
        },
        solution: {
          title: fallbackSong.title,
          artist: fallbackSong.artist,
          albumCover: fallbackSong.albumCover || '',
          albumYear: fallbackSong.albumYear || '',
          genre: dailyArtist.genre,
          formationYear: dailyArtist.formationYear,
        },
        _note: 'fallback'
      };

      // Cache breve
      gameCache.set(argentinaTime, { expires: Date.now() + 1000 * 60 * 60, payload });
      return NextResponse.json(payload);
    }

    // 4. SELECCIONAR CANCIÓN (TAMBIÉN BASADO EN LA FECHA)
    const songIndex = getSeededIndex(argentinaTime + dailyArtist.name, validSongs.length);
    const song = validSongs[songIndex];

    payload = {
      gameData: {
        previewUrl: song.preview,
        deezerId: song.id,
        date: argentinaTime,
      },
      solution: {
        title: song.title,
        artist: song.artist.name,
        albumCover: song.album.cover_medium,
        albumYear: song.album.release_date,
        genre: dailyArtist.genre,
        formationYear: dailyArtist.formationYear,
      }
    };

    // Cache la respuesta del día por 1 hora
    gameCache.set(argentinaTime, { expires: Date.now() + 1000 * 60 * 60, payload });

    return NextResponse.json(payload);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}