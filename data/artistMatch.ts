import type { Artist } from '@/data/artist';

export function normalizeArtistName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function matchesArtistName(candidateName: string, artist: Artist): boolean {
  const candidate = normalizeArtistName(candidateName);
  const names = [artist.name, ...(artist.aliases ?? [])]
    .map(normalizeArtistName)
    .filter(Boolean);

  if (names.includes(candidate)) {
    return true;
  }

  const canonical = normalizeArtistName(artist.name);
  const isSingleWordArtist = canonical.split(' ').length === 1;

  if (isSingleWordArtist) {
    return false;
  }

  const separators = [' ', ' &', ' x', ' feat', ' ft', ' con', ' y', ' /', ' +'];
  return names.some((name) => separators.some((separator) => candidate.startsWith(`${name}${separator}`)));
}

export function getArtistSearchTerms(artist: Artist): string[] {
  return Array.from(new Set([artist.name, ...(artist.aliases ?? [])].map((value) => value.trim()).filter(Boolean)));
}

export function findArtistByNameOrAlias(value: string, artists: Artist[]): Artist | undefined {
  const normalizedValue = normalizeArtistName(value);
  return artists.find((artist) => {
    const names = [artist.name, ...(artist.aliases ?? [])].map(normalizeArtistName);
    return names.includes(normalizedValue);
  });
}
