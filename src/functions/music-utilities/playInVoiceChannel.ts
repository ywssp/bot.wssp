import { container } from '@sapphire/framework';
const { client } = container;

import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior
} from '@discordjs/voice';
import { MessageEmbed, TextBasedChannel, VoiceBasedChannel } from 'discord.js';
import { getGuildMusicData } from './getGuildMusicData';
import { SimpleVideoInfo } from '../../interfaces/SimpleVideoInfo';
import ytdl from 'ytdl-core';

function createNowPlayingMessage(
  video: SimpleVideoInfo,
  style: 'full' | 'minimal',
  nextVideo?: SimpleVideoInfo
): MessageEmbed | string {
  if (style === 'full') {
    const embed = new MessageEmbed()
      .setColor('#b48ead')
      .setTitle('Now Playing')
      .setDescription(`[${video.title}](${video.url})`)
      .setFields([
        {
          name: 'Channel',
          value: `[${video.channel.name}](${video.channel.url})`
        },
        {
          name: 'Duration',
          value:
            typeof video.duration === 'string'
              ? video.duration
              : video.duration.toFormat('m:ss')
        },
        {
          name: 'Requester',
          value: video.requester
        }
      ]);

    if (video.thumbnail) {
      embed.setThumbnail(video.thumbnail);
    }

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
  const guildMusicData = getGuildMusicData({
    create: false,
    guildId
  })!;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const textUpdateChannel = client.channels.cache.get(
    guildMusicData.textUpdateChannelId
  ) as TextBasedChannel;

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator
  });

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }
  });

  player.on('error', (error) => {
    console.log(`An error "${error.name}" occurred: ${error.message}`);
    const resourceMetadata = error.resource.metadata as SimpleVideoInfo;

    const embed = new MessageEmbed()
      .setColor('#bf616a')
      .setTitle('Playback Error')
      .setDescription('An error occurred while playing the following video:')
      .setFields([
        {
          name: 'Title',
          value: `[${resourceMetadata.title}](${resourceMetadata.url})`
        },
        {
          name: 'Channel',
          value: `[${resourceMetadata.channel.name}](${resourceMetadata.channel.url})`
        },
        {
          name: 'Duration',
          value:
            typeof resourceMetadata.duration === 'string'
              ? resourceMetadata.duration
              : resourceMetadata.duration.toFormat('m:ss')
        },
        {
          name: '\u200B',
          value: '\u200B'
        },
        {
          name: 'Error',
          value: `${error.name}: ${error.message}`
        }
      ]);

    textUpdateChannel.send({ embeds: [embed] });
  });

  player.on(AudioPlayerStatus.Idle, () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const localGuildMusicData = container.guildMusicDataMap.get(
      guildId as string
    )!;

    if (localGuildMusicData.loop.type === 'queue') {
      localGuildMusicData.videoList.push(
        localGuildMusicData.videoList[localGuildMusicData.videoListIndex]
      );
    }

    if (localGuildMusicData.loop.type !== 'track') {
      localGuildMusicData.videoListIndex++;
    }

    if (
      localGuildMusicData.videoList.length ===
      localGuildMusicData.videoListIndex
    ) {
      player.stop();
      connection.destroy();
      return;
    }

    const currentVideo =
      localGuildMusicData.videoList[localGuildMusicData.videoListIndex];

    const audioResource = createAudioResource(
      ytdl(currentVideo.url, {
        quality: 'highestaudio'
      }),
      {
        metadata: currentVideo
      }
    );

    player.play(audioResource);

    const localTextUpdateChannel = client.channels.cache.get(
      guildMusicData.textUpdateChannelId
    ) as TextBasedChannel;

    if (localGuildMusicData.musicAnnounceStyle !== 'none') {
      const message = createNowPlayingMessage(
        currentVideo,
        localGuildMusicData.musicAnnounceStyle,
        localGuildMusicData.videoList[localGuildMusicData.videoListIndex + 1]
      );

      if (typeof message === 'string') {
        localTextUpdateChannel.send(message);
      } else {
        localTextUpdateChannel.send({ embeds: [message] });
      }
    }
  });

  const currentVideo = guildMusicData.currentVideo();

  connection.subscribe(player);

  const createdResource = createAudioResource(
    ytdl(guildMusicData.videoList[guildMusicData.videoListIndex].url, {
      quality: 'highestaudio'
    }),
    {
      metadata: currentVideo
    }
  );

  player.play(createdResource);

  if (guildMusicData.musicAnnounceStyle !== 'none') {
    const message = createNowPlayingMessage(
      currentVideo,
      guildMusicData.musicAnnounceStyle,
      guildMusicData.videoList[guildMusicData.videoListIndex + 1]
    );

    if (typeof message === 'string') {
      textUpdateChannel.send(message);
    } else {
      textUpdateChannel.send({ embeds: [message] });
    }
  }
}
