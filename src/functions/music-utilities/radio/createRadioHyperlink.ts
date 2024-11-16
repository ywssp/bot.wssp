'use strict';

import { hyperlink } from 'discord.js';

import type { basicInfo } from '../../../interfaces/Music/Radio/RadioSongInfo';

export function createRadioHyperlink(
  info: basicInfo,
  directory: 'artists' | 'albums' | 'characters'
) {
  let text = info.name;

  if (info.nameRomaji !== null && info.nameRomaji !== info.name) {
    text += ` (${info.nameRomaji})`;
  }

  const url = `https://listen.moe/${directory}/${info.id}`;

  return hyperlink(text, url);
}
