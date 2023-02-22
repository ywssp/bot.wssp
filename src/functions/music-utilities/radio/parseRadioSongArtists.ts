import {
  basicInfo,
  RadioSongInfo
} from '../../../interfaces/Music/Radio/RadioSongInfo';
import { createRadioHyperlink } from './createRadioHyperlink';

export function parseRadioSongArtists(song: RadioSongInfo): string[] {
  if (song.characters === undefined) {
    return song.artists.map((artist) =>
      createRadioHyperlink(artist, 'artists')
    );
  }

  const pairedArtists: Array<{
    artist: RadioSongInfo['artists'][number];
    character: basicInfo | null;
  }> = [];

  for (const artist of song.artists) {
    const correspondingCharacter = song.characters.find((character) =>
      artist.characters.some((ac) => ac.id === character.id)
    );

    pairedArtists.push({
      artist,
      character: correspondingCharacter ?? null
    });
  }

  return pairedArtists.map(({ artist, character }) => {
    const artistText = createRadioHyperlink(artist, 'artists');

    if (character) {
      const characterText = createRadioHyperlink(character, 'characters');

      return `${characterText} | CV: ${artistText}`;
    }

    return artistText;
  });
}
