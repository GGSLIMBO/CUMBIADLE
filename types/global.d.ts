// Shared global types for in-memory fallbacks used in development
interface RateEntry { count: number; expires: number }
interface CachedTrack { id: number; title: string; artist: string; cover: string }
interface CachedQuery { data: CachedTrack[]; expires: number }
interface GameSolution {
  title: string;
  artist: string;
  albumCover: string;
  albumYear: string;
  genre: string;
  formationYear?: number | null;
}
interface GamePayload {
  gameData: { previewUrl: string; deezerId: number; date: string };
  solution: GameSolution;
  _note?: string;
}

type GameMode = 'daily' | 'infinite' | 'one_life' | 'artist';

interface GamePayloadExtended extends GamePayload {
  mode?: GameMode;
  maxAttempts?: number;
  fullPreviewAllowed?: boolean;
  modeMeta?: { artistId?: number; artistName?: string };
}

declare global {
  var __cumbiadle_search_rate__: Map<string, RateEntry> | undefined;
  var __cumbiadle_search_cache__: Map<string, CachedQuery> | undefined;
  var __cumbiadle_game_cache__: Map<string, { expires: number; payload: GamePayloadExtended }> | undefined;
}

export {};
