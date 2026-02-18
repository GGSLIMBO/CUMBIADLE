import { NextResponse } from 'next/server';
import { ARTISTS } from '@/data/artist'; // Importamos tu lista oficial

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

  try {
    // 1. Pedimos MÁS resultados a Deezer (limit=15 o 20)
    // Pedimos más porque al filtrar seguramente descartemos varios.
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=20`);
    const data = await res.json() as DeezerResponse;
    
    if (!data.data) return NextResponse.json([]);

    // 2. FILTRADO STRICTO (La Magia)
    const filteredTracks = data.data.filter((track: DeezerTrack) => {
      const deezerArtistName = track.artist.name.toLowerCase();

      // Revisamos si el artista de Deezer coincide con alguno de NUESTRA lista
      return ARTISTS.some((localArtist) => {
        const localName = localArtist.name.toLowerCase();
        
        // Lógica de coincidencia:
        // 1. Coincidencia exacta (ej: "damas gratis" === "damas gratis")
        // 2. O si Deezer incluye el nombre (ej: "damas gratis & l-gante" incluye "damas gratis")
        return deezerArtistName === localName || deezerArtistName.includes(localName);
      });
    });

    // 3. Formateamos para el frontend (Solo los primeros 5 que pasaron el filtro)
    const tracks = filteredTracks.slice(0, 5).map((t: DeezerTrack) => ({
      id: t.id,
      title: t.title,
      artist: t.artist.name,
      cover: t.album.cover_small
    }));

    return NextResponse.json(tracks);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error buscando" }, { status: 500 });
  }
}