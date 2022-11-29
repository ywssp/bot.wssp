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
import { SimpleYTVideoInfo } from '../../../interfaces/SimpleYTVideoInfo';
import * as playdl from 'play-dl';
import { ColorPalette } from '../../../settings/ColorPalette';
import { formatVideoEmbed } from './formatVideoEmbed';
import { getPlayingType } from '../getPlayingType';
import { getAudioPlayer } from '../getAudioPlayer';
import { disconnectRadioWebsocket } from '../LISTEN.moe/disconnectWebsocket';
import { connectVoiceChannel } from '../connectVoiceChannel';
import { unsubscribeVoiceConnection } from '../unsubscribeVoiceConnection';
import { Duration } from 'luxon';
import { GuildMusicData } from '../../../interfaces/GuildMusicData/GuildMusicData';

function createNowPlayingMessage(
  guildMusicData: GuildMusicData
): MessageOptions {
  const video = guildMusicData.youtubeData.currentVideo();
  const nextVideo = guildMusicData.youtubeData.videoList[
    guildMusicData.youtubeData.videoListIndex + 1
  ] as SimpleYTVideoInfo | undefined;

  if (guildMusicData.musicAnnounceStyle === 'full') {
    const baseEmbed = new MessageEmbed()
      .setColor(ColorPalette.info)
      .setTitle('Now Playing');

    const embed = formatVideoEmbed(baseEmbed, video);

    if (nextVideo) {
      let nextString = '';
      if (guildMusicData.youtubeData.shuffle) {
        nextString = '🔀 | The next song is a random song from the queue.';
      } else {
        nextString = `[${nextVideo.title}](${nextVideo.url}) by [${nextVideo.channel.name}](${nextVideo.channel.url})`;
      }

      embed.addFields([
        {
          name: `\u200B`,
          value: '\u200B'
        },
        {
          name: 'Next',
          value: nextString
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
    if (guildMusicData.youtubeData.shuffle) {
      text += '\n🔀 | The next song is a random song from the queue.';
    } else {
      text += `\n\nNext Video\n${nextVideo.title} - <${nextVideo.url}>\nBy ${nextVideo.channel.name}`;
    }
  }

  return { content: text };
}

async function playVideo(
  video: SimpleYTVideoInfo,
  audioPlayer: AudioPlayer,
  musicData: GuildMusicData
) {
  const streamedVideo = await playdl.stream(video.url);

  const resource = createAudioResource(streamedVideo.stream, {
    inputType: streamedVideo.type,
    metadata: video
  });

  audioPlayer.play(resource);

  if (
    !musicData.youtubeData.skipped &&
    musicData.youtubeData.loop.type === 'track'
  ) {
    return;
  }

  musicData.youtubeData.skipped = false;

  if (musicData.musicAnnounceStyle !== 'none') {
    const message = createNowPlayingMessage(musicData);

    const announceChannel = client.channels.cache.get(
      musicData.textUpdateChannelId
    ) as TextBasedChannel;

    announceChannel.send(message);
  }
}

export function startQueuePlayback(
  guildId: string,
  voiceChannel: VoiceBasedChannel
) {
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
  } else if (playingType === 'youtube') {
    return;
  } else {
    audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    });
  }

  audioPlayer.on('error', (error) => {
    const resourceMetadata = error.resource.metadata as SimpleYTVideoInfo;
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

    if (resourceMetadata.duration !== 'Live Stream') {
      embed.spliceFields(2, 1, {
        name: 'Duration',
        value: `${seek} / ${resourceMetadata.duration.toFormat('m:ss')}`
      });
    }

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

    if (voiceChannel.members.filter((member) => !member.user.bot).size === 0) {
      textUpdateChannel.send(
        'No users are inside the voice channel. Stopping...'
      );
      audioPlayer.stop();
      unsubscribeVoiceConnection(guildId);
      voiceConnection.destroy();
      return;
    }

    if (youtubeData.videoList.length === youtubeData.videoListIndex) {
      textUpdateChannel.send('No more videos in the queue. Stopping...');
      audioPlayer.stop();
      unsubscribeVoiceConnection(guildId);
      voiceConnection.destroy();
      return;
    }

    if (youtubeData.shuffle && youtubeData.loop.type !== 'track') {
      const randomIndex = Math.floor(
        Math.random() * youtubeData.getQueue().length
      );

      const selectedVideo = youtubeData.videoList.splice(randomIndex, 1)[0];

      youtubeData.videoList.splice(
        youtubeData.videoListIndex,
        0,
        selectedVideo
      );
    }

    playVideo(youtubeData.currentVideo(), audioPlayer, guildMusicData);
  });

  voiceConnection.subscribe(audioPlayer);

  playVideo(youtubeData.currentVideo(), audioPlayer, guildMusicData);
}
