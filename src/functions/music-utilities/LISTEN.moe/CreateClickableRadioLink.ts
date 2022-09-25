import { RadioSongInfo } from '../../../interfaces/RadioSongInfo';

export function createClickableRadioLink(
  basicInfo:
    | RadioSongInfo['artists'][number]
    | Exclude<RadioSongInfo['characters'], undefined>[number]
    | RadioSongInfo['albums'][number],
  directory: 'artists' | 'albums' | 'characters'
) {
  basicInfo;
  let text = basicInfo.name;

  if (typeof basicInfo.nameRomaji === 'string') {
    text += ` (${basicInfo.nameRomaji})`;
  }

  const url = `https://listen.moe/${directory}/${basicInfo.id}`;

  return `[${text}](${url})`;
}
