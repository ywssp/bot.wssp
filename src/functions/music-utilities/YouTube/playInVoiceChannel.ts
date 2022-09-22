import { container } from '@sapphire/framework';
const { client } = container;

import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior
} from '@discordjs/voice';
import { MessageEmbed, TextBasedChannel, VoiceBasedChannel } from 'discord.js';
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

function createNowPlayingMessage(
  video: SimpleVideoInfo,
  style: 'full' | 'minimal',
  nextVideo?: SimpleVideoInfo
): MessageEmbed | string {
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

    return embed;
  }

  let text = `Now Playing\n${video.title} - <${video.url}> | ${
    typeof video.duration === 'string'
      ? video.duration
      : video.duration.toFormat('m:ss')
  } | By ${video.channel.name}`;

  if (nextVideo) {
    text += `\n\nNext Video\n${nextVideo.title} - <${nextVideo.url}>\nBy ${nextVideo.channel.name}`;
  }

  return text;
}

export function play(guildId: string, voiceChannel: VoiceBasedChannel) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const guildMusicData = getGuildMusicData(guildId)!;

  const youtubeData = guildMusicData.youtubeData;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const textUpdateChannel = client.channels.cache.get(
    guildMusicData.textUpdateChannelId
  ) as TextBasedChannel;

  const playingType = getPlayingType(guildId);

  if (playingType === 'radio') {
    textUpdateChannel.send(
      'Disconnecting from the radio to play a YouTube video...'
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const audioPlayer = getAudioPlayer(guildId)!;
    audioPlayer.removeAllListeners();
    audioPlayer.stop();
    unsubscribeVoiceConnection(guildId);
    disconnectRadioWebsocket(guildId);
  }

  const voiceConnection = connectVoiceChannel(voiceChannel);

  const audioPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }
  });

  console.log('Created AudioPlayer for youtube');

  audioPlayer.on('error', (error) => {
    const resourceMetadata = error.resource.metadata as SimpleVideoInfo;
    container.logger.error(
      `An error occurred while playing ${resourceMetadata.title} | ${resourceMetadata.url}\n${error.stack}`
    );

    const baseEmbed = new MessageEmbed()
      .setColor(ColorPalette.error)
      .setTitle('Playback Error');

    const embed = formatVideoEmbed(baseEmbed, resourceMetadata);

    embed.addField('Error', `${error.name}: ${error.message}`);

    textUpdateChannel.send({ embeds: [embed] });
  });

  audioPlayer.on(AudioPlayerStatus.Idle, () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const localGuildMusicData = container.guildMusicDataMap.get(
      guildId as string
    )!;
    const localYoutubeData = localGuildMusicData.youtubeData;

    if (localYoutubeData.loop.type === 'queue') {
      localYoutubeData.videoList.push(localYoutubeData.currentVideo());
    }

    if (localYoutubeData.loop.type !== 'track') {
      localYoutubeData.videoListIndex++;
    }

    if (localYoutubeData.videoList.length === localYoutubeData.videoListIndex) {
      audioPlayer.stop();
      unsubscribeVoiceConnection(guildId);
      voiceConnection.destroy();
      return;
    }

    const currentVideo = localYoutubeData.currentVideo();

    const audioResource = createAudioResource(
      ytdl(currentVideo.url, {
        quality: 'highestaudio'
      }),
      {
        metadata: currentVideo
      }
    );

    audioPlayer.play(audioResource);

    const localTextUpdateChannel = client.channels.cache.get(
      guildMusicData.textUpdateChannelId
    ) as TextBasedChannel;

    if (localGuildMusicData.musicAnnounceStyle !== 'none') {
      const message = createNowPlayingMessage(
        currentVideo,
        localGuildMusicData.musicAnnounceStyle,
        localYoutubeData.videoList[localYoutubeData.videoListIndex + 1]
      );

      if (typeof message === 'string') {
        localTextUpdateChannel.send(message);
      } else {
        localTextUpdateChannel.send({ embeds: [message] });
      }
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

    if (typeof message === 'string') {
      textUpdateChannel.send(message);
    } else {
      textUpdateChannel.send({ embeds: [message] });
    }
  }
}
