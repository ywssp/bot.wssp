import { hyperlink } from 'discord.js';
import type { basicInfo } from '../../../interfaces/RadioSongInfo';

export function createClickableRadioLink(
  info: basicInfo,
  directory: 'artists' | 'albums' | 'characters'
) {
  let text = info.name;

  if (info.nameRomaji !== null) {
    text += ` (${info.nameRomaji})`;
  }

  const url = `https://listen.moe/${directory}/${info.id}`;

  return hyperlink(text, url);
}
