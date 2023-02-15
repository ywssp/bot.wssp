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
  EmbedBuilder,
  BaseMessageOptions,
  TextBasedChannel,
  VoiceBasedChannel,
  hyperlink
} from 'discord.js';
import { getGuildMusicData } from '../guildMusicDataManager';
import { QueuedTrack } from '../../../interfaces/YTVideoInfo';
import * as playdl from 'play-dl';
import { ColorPalette } from '../../../settings/ColorPalette';
import { formatVideoEmbed } from './formatVideoEmbed';
import { getPlayingType } from '../getPlayingType';
import { getAudioPlayer } from '../getAudioPlayer';
import { disconnectGuildFromRadioWebsocket } from '../LISTEN.moe/disconnectGuildFromWebsocket';
import { connectVoiceChannel } from '../connectVoiceChannel';
import { unsubscribeVCFromAudioPlayer } from '../unsubscribeVCFromAudioPlayer';
import { Duration } from 'luxon';
import { GuildMusicData } from '../../../interfaces/GuildMusicData/GuildMusicData';
import { MusicResourceMetadata } from '../../../interfaces/MusicResourceMetadata';

function createNowPlayingMessage(
  guildMusicData: GuildMusicData
): BaseMessageOptions {
  const video = guildMusicData.youtubeData.currentVideo();
  const nextVideo = guildMusicData.youtubeData.videoList[
    guildMusicData.youtubeData.videoListIndex + 1
  ] as QueuedTrack | undefined;

  if (guildMusicData.musicAnnounceStyle === 'full') {
    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.info)
      .setTitle('Now Playing');

    const embed = formatVideoEmbed(baseEmbed.data, video);

    if (nextVideo) {
      let nextString = '';
      if (guildMusicData.youtubeData.shuffle) {
        nextString = '🔀 | The next song is a random song from the queue.';
      } else {
        const channelString =
          nextVideo.uploader.url !== undefined
            ? hyperlink(nextVideo.uploader.name, nextVideo.uploader.url)
            : nextVideo.uploader.name;

        nextString = `${hyperlink(
          nextVideo.title,
          nextVideo.url
        )} by ${channelString}`;
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
  } | By ${video.uploader.name}`;

  if (nextVideo) {
    if (guildMusicData.youtubeData.shuffle) {
      text += '\n🔀 | The next song is a random song from the queue.';
    } else {
      text += `\n\nNext Video\n${nextVideo.title} - <${nextVideo.url}>\nBy ${nextVideo.uploader.name}`;
    }
  }

  return { content: text };
}

async function playVideo(
  video: QueuedTrack,
  audioPlayer: AudioPlayer,
  musicData: GuildMusicData
) {
  const streamedVideo = await playdl.stream(video.url);

  // Set type as MusicResourceMetadata with property type of 'youtube'
  const metadata: MusicResourceMetadata = {
    type: 'youtube',
    data: video
  };

  const resource = createAudioResource(streamedVideo.stream, {
    inputType: streamedVideo.type,
    metadata
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

  const textUpdateChannel = client.channels.cache.get(
    guildMusicData.textUpdateChannelId
  ) as TextBasedChannel;

  const voiceConnection = connectVoiceChannel(voiceChannel);

  let audioPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }
  });

  const playingType = getPlayingType(guildId);

  if (playingType === 'youtube') {
    return;
  } else if (playingType === 'radio') {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const oldAudioPlayer = getAudioPlayer(guildId)!;
    oldAudioPlayer.removeAllListeners().stop();
    unsubscribeVCFromAudioPlayer(guildId);
    disconnectGuildFromRadioWebsocket(guildId);
    textUpdateChannel.send(
      'Disconnecting from the radio to play a YouTube video...'
    );
  }

  audioPlayer = audioPlayer.on('error', (error) => {
    const resourceMetadata = error.resource.metadata as QueuedTrack;
    const seek = Duration.fromMillis(error.resource.playbackDuration).toFormat(
      'm:ss'
    );

    container.logger.error(
      `An error occurred while playing ${resourceMetadata.title} | ${resourceMetadata.url} in the ${seek} mark\n${error.stack}`
    );

    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.error)
      .setTitle('Playback Error');

    const embed = formatVideoEmbed(baseEmbed.data, resourceMetadata);

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

  voiceConnection.subscribe(audioPlayer);

  playVideo(youtubeData.currentVideo(), audioPlayer, guildMusicData);

  audioPlayer.on(AudioPlayerStatus.Idle, () => {
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
      unsubscribeVCFromAudioPlayer(guildId);
      voiceConnection.destroy();
      return;
    }

    if (youtubeData.videoList.length === youtubeData.videoListIndex) {
      textUpdateChannel.send('No more videos in the queue. Stopping...');
      audioPlayer.stop();
      unsubscribeVCFromAudioPlayer(guildId);
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
}
