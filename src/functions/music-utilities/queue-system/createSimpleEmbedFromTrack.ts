import { EmbedBuilder, hyperlink } from 'discord.js';
import { TrackInfo } from '../../../interfaces/Music/Queue System/TrackInfo';

/**
 * Creates an embed from a track.
 * @param baseEmbed The base embed to add the fields to. Do not set a description for this embed, as it will be overwritten.
 * @param track The track to create the embed from.
 * @returns The embed.
 */
export function createSimpleEmbedFromTrack(
  baseEmbed: EmbedBuilder,
  track: TrackInfo
) {
  const embed = baseEmbed.setDescription(
    `${hyperlink(track.title, track.url)}\nBy ${
      track.uploader.url !== undefined
        ? hyperlink(track.uploader.name, track.uploader.url)
        : track.uploader.name
    }\n\nLength: ${
      typeof track.duration === 'string'
        ? track.duration
        : track.duration.toFormat('m:ss')
    }`
  );

  if (track.thumbnail) {
    embed.setThumbnail(track.thumbnail);
  }

  return embed;
}
