import { NextResponse } from 'next/server';
import { ARTISTS } from '@/data/artist'; // Importamos tu lista oficial
import { matchesArtistName } from '@/data/artistMatch';

// Simple in-memory rate limiter and cache (for demo / small traffic).
// For production en Vercel, usar Vercel Edge Config / KV or Redis.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 min
const RATE_LIMIT_MAX = 30; // requests per window per IP
const rateMap = globalThis.__cumbiadle_search_rate__ ?? new Map<string, { count: number; expires: number }>();
globalThis.__cumbiadle_search_rate__ = rateMap;

const queryCache = globalThis.__cumbiadle_search_cache__ ?? new Map<string, { data: { id: number; title: string; artist: string; cover: string }[]; expires: number }>();
globalThis.__cumbiadle_search_cache__ = queryCache;

interface DeezerTrack {
  id: number;
  title: string;
  artist: {
    name: string;
  };
  album: {
    cover_small: string;
  };
}

interface DeezerResponse {
  data: DeezerTrack[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  // Rate limiting by IP (best-effort). Use X-Forwarded-For or fallback to 'unknown'
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const entry = rateMap.get(ip) || { count: 0, expires: Date.now() + RATE_LIMIT_WINDOW_MS };
  if (entry.expires < Date.now()) {
    entry.count = 0;
    entry.expires = Date.now() + RATE_LIMIT_WINDOW_MS;
  }
  entry.count += 1;
  rateMap.set(ip, entry);
  if (entry.count > RATE_LIMIT_MAX) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  // Query cache (short TTL)
  const cacheEntry = queryCache.get(query.toLowerCase());
  if (cacheEntry && cacheEntry.expires > Date.now()) {
    return NextResponse.json(cacheEntry.data);
  }

  try {
    // 1. Pedimos MÁS resultados a Deezer (limit=15 o 20)
    // Pedimos más porque al filtrar seguramente descartemos varios.
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=20`);
    const data = await res.json() as DeezerResponse;
    if (!data || !Array.isArray(data.data)) return NextResponse.json([]);

    // 2. FILTRADO STRICTO (La Magia)
    const filteredTracks = data.data.filter((track: DeezerTrack) => {
      return ARTISTS.some((localArtist) => matchesArtistName(track.artist.name, localArtist));
    });

    // 3. Formateamos para el frontend (Solo los primeros 5 que pasaron el filtro)
    const tracks = filteredTracks.slice(0, 5).map((t: DeezerTrack) => ({
      id: t.id,
      title: t.title,
      artist: t.artist.name,
      cover: t.album.cover_small
    }));

    // Cache results for 30s
    queryCache.set(query.toLowerCase(), { data: tracks, expires: Date.now() + 30 * 1000 });

    return NextResponse.json(tracks);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error buscando" }, { status: 500 });
  }
}