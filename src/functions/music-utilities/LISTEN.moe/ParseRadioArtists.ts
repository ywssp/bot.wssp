import { basicInfo, RadioSongInfo } from '../../../interfaces/RadioSongInfo';
import { createClickableRadioLink } from './CreateClickableRadioLink';

export function parseArtists(song: RadioSongInfo): string[] {
  if (song.characters === undefined) {
    return song.artists.map((artist) =>
      createClickableRadioLink(artist, 'artists')
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
    const artistText = createClickableRadioLink(artist, 'artists');

    if (character) {
      const characterText = createClickableRadioLink(character, 'characters');

      return `${characterText} | CV: ${artistText}`;
    }

    return artistText;
  });
}
