import { NextResponse } from 'next/server';
import { ARTISTS } from '@/data/artist';
import { FALLBACK_SONGS } from '@/data/fallbackPool';
import { findArtistByNameOrAlias, getArtistSearchTerms, matchesArtistName } from '@/data/artistMatch';

interface DeezerSong {
  id: number;
  title: string;
  preview: string;
  artist: { name: string };
  album: { cover_medium: string; release_date: string };
}

interface GameResponse {
  gameData: { previewUrl: string; deezerId: number; date: string };
  solution: {
    title: string;
    artist: string;
    albumCover: string;
    albumYear: string;
    genre: string;
    formationYear?: number | null;
  };
  _note?: string;
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = (url.searchParams.get('mode') || 'daily') as ('daily'|'infinite'|'one_life'|'artist');
    const artistParam = url.searchParams.get('artist') || undefined;

    // Use a stable ISO date (YYYY-MM-DD) in Argentina timezone as seed
    const argentinaTime = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

    // Build cache key including mode and artist if present
    const cacheKey = mode === 'daily' ? `daily:${argentinaTime}` : mode === 'artist' && artistParam ? `artist:${artistParam}` : `${mode}:${argentinaTime}`;
    const cached = gameCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(cached.payload);
    }

    // Helper to fetch songs for an artist name
    const fetchSongsForArtist = async (artistName: string) => {
      const artistProfile = findArtistByNameOrAlias(artistName, ARTISTS) ?? ARTISTS.find((artist) => artist.name === artistName) ?? null;
      const searchContext = artistProfile?.genre.toLowerCase().includes('cuarteto') ? 'cuarteto' : 'cumbia';
      const searchTerms = artistProfile ? getArtistSearchTerms(artistProfile) : [artistName];

      try {
        const resultsById = new Map<number, DeezerSong>();

        for (const term of searchTerms) {
          const query = `artist:"${term}" ${searchContext}`;
          const deezerResponse = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=20`, { next: { revalidate: 3600 } });
          const data = await deezerResponse.json();
          const tracks = data.data?.filter((s: DeezerSong) => s.preview) || [];
          for (const track of tracks) {
            if (!artistProfile || matchesArtistName(track.artist.name, artistProfile)) {
              resultsById.set(track.id, track);
            }
          }
        }

        let songs = Array.from(resultsById.values());
        if (songs.length === 0) {
          const fallbackRes = await fetch(`https://api.deezer.com/search?q=artist:"${encodeURIComponent(artistName)}"`, { next: { revalidate: 3600 } });
          const fallbackData = await fallbackRes.json();
          songs = fallbackData.data?.filter((s: DeezerSong) => s.preview && (!artistProfile || matchesArtistName(s.artist.name, artistProfile))) || [];
        }

        return songs;
      } catch (err) {
        console.error('Deezer error:', err);
        return [] as DeezerSong[];
      }
    };

    let selectedArtist = null as (typeof ARTISTS[number]) | null;
    let validSongs: DeezerSong[] = [];
    let payload: any = null;

    if (mode === 'daily') {
      const artistIndex = getSeededIndex(argentinaTime, ARTISTS.length);
      selectedArtist = ARTISTS[artistIndex];
      validSongs = await fetchSongsForArtist(selectedArtist.name);
      if (validSongs.length === 0) {
        const fallbackIndex = getSeededIndex(argentinaTime + selectedArtist.name, FALLBACK_SONGS.length);
        const fallbackSong = FALLBACK_SONGS[fallbackIndex];
        payload = {
          gameData: { previewUrl: fallbackSong.previewUrl || '', deezerId: fallbackSong.deezerId || 0, date: argentinaTime },
          solution: { title: fallbackSong.title, artist: fallbackSong.artist, albumCover: fallbackSong.albumCover || '', albumYear: fallbackSong.albumYear || '', genre: selectedArtist.genre, formationYear: selectedArtist.formationYear },
          _note: 'fallback',
          mode: 'daily',
          maxAttempts: 6,
          fullPreviewAllowed: false,
          modeMeta: { artistId: selectedArtist.id, artistName: selectedArtist.name }
        };
        gameCache.set(cacheKey, { expires: Date.now() + 1000 * 60 * 60, payload });
        return NextResponse.json(payload);
      }
      const songIndex = getSeededIndex(argentinaTime + selectedArtist.name, validSongs.length);
      const song = validSongs[songIndex];
      payload = {
        gameData: { previewUrl: song.preview, deezerId: song.id, date: argentinaTime },
        solution: { title: song.title, artist: song.artist.name, albumCover: song.album.cover_medium, albumYear: song.album.release_date, genre: selectedArtist.genre, formationYear: selectedArtist.formationYear },
        mode: 'daily',
        maxAttempts: 6,
        fullPreviewAllowed: false,
        modeMeta: { artistId: selectedArtist.id, artistName: selectedArtist.name }
      };
      gameCache.set(cacheKey, { expires: Date.now() + 1000 * 60 * 60, payload });
      return NextResponse.json(payload);
    }

    // artist mode requires artistParam
    if (mode === 'artist') {
      if (!artistParam) return NextResponse.json({ error: 'artist param required' }, { status: 400 });
      // Try to find by id or name
      const byId = Number.isFinite(Number(artistParam)) ? ARTISTS.find(a => a.id === Number(artistParam)) : null;
      const byName = findArtistByNameOrAlias(artistParam, ARTISTS) || null;
      selectedArtist = byId || byName;
      if (!selectedArtist) return NextResponse.json({ error: 'artist not found' }, { status: 404 });
      validSongs = await fetchSongsForArtist(selectedArtist.name);
      if (validSongs.length === 0) {
        // fallback
        const fallbackIndex = getSeededIndex(selectedArtist.name, FALLBACK_SONGS.length);
        const fallbackSong = FALLBACK_SONGS[fallbackIndex];
        payload = {
          gameData: { previewUrl: fallbackSong.previewUrl || '', deezerId: fallbackSong.deezerId || 0, date: argentinaTime },
          solution: { title: fallbackSong.title, artist: fallbackSong.artist, albumCover: fallbackSong.albumCover || '', albumYear: fallbackSong.albumYear || '', genre: selectedArtist.genre, formationYear: selectedArtist.formationYear },
          _note: 'fallback',
          mode: 'artist',
          maxAttempts: 6,
          fullPreviewAllowed: false,
          modeMeta: { artistId: selectedArtist.id, artistName: selectedArtist.name }
        };
        gameCache.set(cacheKey, { expires: Date.now() + 1000 * 30, payload });
        return NextResponse.json(payload);
      }
      const song = validSongs[Math.floor(Math.random() * validSongs.length)];
      payload = {
        gameData: { previewUrl: song.preview, deezerId: song.id, date: argentinaTime },
        solution: { title: song.title, artist: song.artist.name, albumCover: song.album.cover_medium, albumYear: song.album.release_date, genre: selectedArtist.genre, formationYear: selectedArtist.formationYear },
        mode: 'artist',
        maxAttempts: 6,
        fullPreviewAllowed: false,
        modeMeta: { artistId: selectedArtist.id, artistName: selectedArtist.name }
      };
      gameCache.set(cacheKey, { expires: Date.now() + 1000 * 60 * 5, payload });
      return NextResponse.json(payload);
    }

    // infinite and one_life modes - pick a random artist and song
    const randomArtist = ARTISTS[Math.floor(Math.random() * ARTISTS.length)];
    validSongs = await fetchSongsForArtist(randomArtist.name);
    if (validSongs.length === 0) {
      // fallback to local pool random
      const fallbackSong = FALLBACK_SONGS[Math.floor(Math.random() * FALLBACK_SONGS.length)];
      payload = {
        gameData: { previewUrl: fallbackSong.previewUrl || '', deezerId: fallbackSong.deezerId || 0, date: argentinaTime },
        solution: { title: fallbackSong.title, artist: fallbackSong.artist, albumCover: fallbackSong.albumCover || '', albumYear: fallbackSong.albumYear || '', genre: randomArtist.genre, formationYear: randomArtist.formationYear },
        mode,
        maxAttempts: mode === 'one_life' ? 1 : 6,
        fullPreviewAllowed: mode === 'one_life',
        modeMeta: { artistId: randomArtist.id, artistName: randomArtist.name }
      };
      gameCache.set(cacheKey, { expires: Date.now() + 1000 * 30, payload });
      return NextResponse.json(payload);
    }

    const randomSong = validSongs[Math.floor(Math.random() * validSongs.length)];
    payload = {
      gameData: { previewUrl: randomSong.preview, deezerId: randomSong.id, date: argentinaTime },
      solution: { title: randomSong.title, artist: randomSong.artist.name, albumCover: randomSong.album.cover_medium, albumYear: randomSong.album.release_date, genre: randomArtist.genre, formationYear: randomArtist.formationYear },
      mode,
      maxAttempts: mode === 'one_life' ? 1 : 6,
      fullPreviewAllowed: mode === 'one_life',
      modeMeta: { artistId: randomArtist.id, artistName: randomArtist.name }
    };
    // short cache for non-daily modes
    gameCache.set(cacheKey, { expires: Date.now() + 1000 * 30, payload });
    return NextResponse.json(payload);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}