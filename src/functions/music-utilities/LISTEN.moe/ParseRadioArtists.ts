import { RadioSongInfo } from '../../../interfaces/RadioSongInfo';
import { createClickableRadioLink } from './CreateClickableRadioLink';

export function parseArtists(song: RadioSongInfo) {
  const characterPairs: {
    character: Exclude<RadioSongInfo['characters'], undefined>[number] | null;
    artist: RadioSongInfo['artists'][number];
  }[] = [];

  for (const artist of song.artists) {
    const character = song.characters?.find(
      (artistCharacter) =>
        artist.characters.findIndex((c) => c.id === artistCharacter.id) !== -1
    );

    if (character) {
      characterPairs.push({ character, artist });
    } else {
      characterPairs.push({ character: null, artist });
    }
  }

  const formattedPairs = characterPairs.map(({ character, artist }) => {
    const artistText = createClickableRadioLink(artist, 'artists');

    if (character) {
      const characterText = createClickableRadioLink(character, 'characters');

      return `${characterText} | CV: ${artistText}`;
    }

    return artistText;
  });

  return formattedPairs;
}
