import { Duration } from 'luxon';
import { RadioWebsocketUpdateData } from '../../../interfaces/Music/Radio/RadioWebsocketUpdate';
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

  if (guildMusicData.musicAnnounceStyle === 'full') {
    const embed = createRadioSongEmbed(data.song);

    guildMusicData.sendUpdateMessage({ embeds: [embed] });
  } else if (guildMusicData.musicAnnounceStyle === 'minimal') {
    const artistNames = data.song.artists
      .map((artist) => artist.name)
      .join(', ');

    const formattedDuration = Duration.fromObject({
      seconds: data.song.duration
    }).toFormat('mm:ss');

    guildMusicData.sendUpdateMessage(
      `Now playing: ${data.song.title} by ${artistNames} | ${formattedDuration}`
    );
  }
}
