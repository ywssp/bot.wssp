import { container } from '@sapphire/framework';
import { TextChannel } from 'discord.js';
import { Duration } from 'luxon';
import { RadioWebsocketUpdateData } from '../../../interfaces/RadioWebsocketUpdate';
import { getGuildMusicData } from '../guildMusicDataManager';
import { createRadioSongEmbed } from './createEmbedFromRadioSong';

export function sendRadioUpdate(
  guildId: string,
  data: RadioWebsocketUpdateData
) {
  const guildMusicData = getGuildMusicData(guildId);

  if (guildMusicData === undefined) {
    console.log(
      `Guild ${guildId} does not have music data! Removing from radio websocket!`
    );
    throw Error('Guild does not have music data!');
  }

  const textUpdateChannel = container.client.channels.cache.get(
    guildMusicData.textUpdateChannelId
  ) as TextChannel;

  if (guildMusicData.musicAnnounceStyle === 'full') {
    const embed = createRadioSongEmbed(data.song);

    textUpdateChannel.send({ embeds: [embed] });
  } else if (guildMusicData.musicAnnounceStyle === 'minimal') {
    const artistNames = data.song.artists
      .map((artist) => artist.name)
      .join(', ');

    const formattedDuration = Duration.fromObject({
      seconds: data.song.duration
    }).toFormat('mm:ss');

    textUpdateChannel.send(
      `Now playing: ${data.song.title} by ${artistNames} | ${formattedDuration}`
    );
  }
}
