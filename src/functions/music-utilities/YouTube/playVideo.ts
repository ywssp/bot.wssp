import { container } from '@sapphire/framework';
const { client } = container;

import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior
} from '@discordjs/voice';
import {
  MessageEmbed,
  MessageOptions,
  TextBasedChannel,
  VoiceBasedChannel
} from 'discord.js';
import { getGuildMusicData } from '../getGuildMusicData';
import { SimpleVideoInfo } from '../../../interfaces/SimpleVideoInfo';
import ytdl from 'ytdl-core';
import { ColorPalette } from '../../../settings/ColorPalette';
import { formatVideoEmbed } from './formatVideoEmbed';
import { getPlayingType } from '../getPlayingType';
import { getAudioPlayer } from '../getAudioPlayer';
import { disconnectRadioWebsocket } from '../LISTEN.moe/disconnectWebsocket';
import { connectVoiceChannel } from '../connectVoiceChannel';
import { unsubscribeVoiceConnection } from '../unsubscribeVoiceConnection';
import { Duration } from 'luxon';

function createNowPlayingMessage(
  video: SimpleVideoInfo,
  style: 'full' | 'minimal',
  nextVideo?: SimpleVideoInfo
): MessageOptions {
  if (style === 'full') {
    const baseEmbed = new MessageEmbed()
      .setColor(ColorPalette.info)
      .setTitle('Now Playing');

    const embed = formatVideoEmbed(baseEmbed, video);

    if (nextVideo) {
      embed.addFields([
        {
          name: `\u200B`,
          value: '\u200B'
        },
        {
          name: 'Next Video',
          value: `[${nextVideo.title}](${nextVideo.url}) by [${nextVideo.channel.name}](${nextVideo.channel.url})`
        }
      ]);
    }

    return { embeds: [embed] };
  }

  let text = `Now Playing\n${video.title} - <${video.url}> | ${
    typeof video.duration === 'string'
      ? video.duration
      : video.duration.toFormat('m:ss')
  } | By ${video.channel.name}`;

  if (nextVideo) {
    text += `\n\nNext Video\n${nextVideo.title} - <${nextVideo.url}>\nBy ${nextVideo.channel.name}`;
  }

  return { content: text };
}

export function play(guildId: string, voiceChannel: VoiceBasedChannel) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const guildMusicData = getGuildMusicData(guildId)!;

  const youtubeData = guildMusicData.youtubeData;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const textUpdateChannel = client.channels.cache.get(
    guildMusicData.textUpdateChannelId
  ) as TextBasedChannel;

  const voiceConnection = connectVoiceChannel(voiceChannel);

  let audioPlayer: AudioPlayer;

  const playingType = getPlayingType(guildId);

  if (playingType === 'radio') {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    audioPlayer = getAudioPlayer(guildId)!;
    audioPlayer.removeAllListeners().stop();
    disconnectRadioWebsocket(guildId);
    textUpdateChannel.send(
      'Disconnecting from the radio to play a YouTube video...'
    );
  } else {
    audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    });
  }

  audioPlayer.on('error', (error) => {
    const resourceMetadata = error.resource.metadata as SimpleVideoInfo;
    const seek = Duration.fromMillis(error.resource.playbackDuration).toFormat(
      'm:ss'
    );

    container.logger.error(
      `An error occurred while playing ${resourceMetadata.title} | ${resourceMetadata.url} in the ${seek} mark\n${error.stack}`
    );

    const baseEmbed = new MessageEmbed()
      .setColor(ColorPalette.error)
      .setTitle('Playback Error');

    const embed = formatVideoEmbed(baseEmbed, resourceMetadata);

    embed.addFields({
      name: 'Error',
      value: `${error.name}: ${error.message}`
    });

    textUpdateChannel.send({ embeds: [embed] });
  });

  audioPlayer.on(AudioPlayerStatus.Idle, () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (youtubeData.loop.type === 'queue') {
      youtubeData.videoList.push(youtubeData.currentVideo());
    }

    if (youtubeData.loop.type !== 'track') {
      youtubeData.videoListIndex++;
    }

    if (youtubeData.videoList.length === youtubeData.videoListIndex) {
      audioPlayer.stop();
      unsubscribeVoiceConnection(guildId);
      voiceConnection.destroy();
      return;
    }

    const currentVideo = youtubeData.currentVideo();

    const audioResource = createAudioResource(
      ytdl(currentVideo.url, {
        quality: 'highestaudio'
      }),
      {
        metadata: currentVideo
      }
    );

    audioPlayer.play(audioResource);

    if (guildMusicData.musicAnnounceStyle !== 'none') {
      const message = createNowPlayingMessage(
        currentVideo,
        guildMusicData.musicAnnounceStyle,
        youtubeData.videoList[youtubeData.videoListIndex + 1]
      );

      textUpdateChannel.send(message);
    }
  });

  voiceConnection.subscribe(audioPlayer);

  const currentVideo = youtubeData.currentVideo();
  const createdResource = createAudioResource(
    ytdl(currentVideo.url, {
      quality: 'highestaudio'
    }),
    {
      metadata: currentVideo
    }
  );

  audioPlayer.play(createdResource);

  if (guildMusicData.musicAnnounceStyle !== 'none') {
    const message = createNowPlayingMessage(
      currentVideo,
      guildMusicData.musicAnnounceStyle,
      youtubeData.videoList[youtubeData.videoListIndex + 1]
    );

    textUpdateChannel.send(message);
  }
}
