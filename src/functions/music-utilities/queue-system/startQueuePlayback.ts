'use strict';

import { container } from '@sapphire/framework';

import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior
} from '@discordjs/voice';
import { EmbedBuilder, hideLinkEmbed, hyperlink, inlineCode } from 'discord.js';
import { getGuildMusicData } from '../guildMusicDataManager';
import {
  QueuedAdaptedTrackInfo,
  QueuedTrackInfo,
  TrackInfo
} from '../../../interfaces/Music/Queue System/TrackInfo';
import * as playdl from 'play-dl';
import ytdl from '@distube/ytdl-core';
import { ColorPalette } from '../../../settings/ColorPalette';

import { createFancyEmbedFromTrack } from './createFancyEmbedFromTrack';
import { getPlayingType } from '../getPlayingType';
import { disconnectGuildFromRadioWebsocket } from '../radio/disconnectGuildFromRadioWebsocket';
import { connectToVoiceChannel } from '../connectToVoiceChannel';
import { Duration } from 'luxon';
import { GuildMusicData } from '../../../interfaces/Music/GuildMusicData/GuildMusicData';
import { MusicResourceMetadata } from '../../../interfaces/Music/MusicResourceMetadata';
import { disposeAudioPlayer } from '../disposeAudioPlayer';
import { getTrackNamings } from './getTrackNamings';
import _ from 'lodash';
import { createSimpleEmbedFromTrack } from './createSimpleEmbedFromTrack';

function sendNowPlayingMessage(guildMusicData: GuildMusicData) {
  const currentTrack = guildMusicData.queueSystemData.currentTrack();
  const nextTrack = guildMusicData.queueSystemData.getQueue().shift();

  const announceStyle = guildMusicData.musicAnnounceStyle;

  if (announceStyle === 'none') {
    return;
  }

  let message: Parameters<GuildMusicData['sendUpdateMessage']>[0];

  if (announceStyle === 'embed_fancy') {
    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.Info)
      .setTitle('Now Playing');

    const embed = createFancyEmbedFromTrack(baseEmbed, currentTrack).addFields([
      {
        name: 'Added By',
        value: currentTrack.addedBy
      }
    ]);

    if (nextTrack !== undefined) {
      let nextString = '';

      let nextTrackIdentifier = _.capitalize(
        getTrackNamings(nextTrack).trackIdentifier
      );

      if (guildMusicData.queueSystemData.shuffle) {
        nextString = `🔀 | The next track will be randomly picked from the queue.`;
        nextTrackIdentifier = 'Track';
      } else {
        // Creates a string with a hyperlink to the next track, and a hyperlink to the next track's uploader.        / /
        // If the uploader doesn't have a URL, it will just use the uploader's name.
        // Example: [Next Track Title](<Track URL>) by [Uploader Name](<Optional Uploader URL>)

        const uploaderString = nextTrack.getArtistHyperlinks();

        nextString = `${hyperlink(
          nextTrack.title,
          nextTrack.url
        )} by ${uploaderString}`;
      }

      embed.addFields([
        {
          name: `\u200B`,
          value: '\u200B'
        },
        {
          name: `Next ${nextTrackIdentifier}`,
          value: nextString
        }
      ]);
    } else {
      embed.setFooter({
        text: 'The bot will leave 5 minutes after the queue is empty.'
      });
    }

    message = { embeds: [embed] };
  } else if (announceStyle === 'embed_simple') {
    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.Info)
      .setTitle('Now Playing');

    const embed = createSimpleEmbedFromTrack(baseEmbed, currentTrack);
    embed.setDescription(
      embed.data.description + `\nAdded By: ${currentTrack.addedBy}`
    );

    if (nextTrack !== undefined) {
      let nextString = '';

      let nextTrackIdentifier = _.capitalize(
        getTrackNamings(nextTrack).trackIdentifier
      );

      if (guildMusicData.queueSystemData.shuffle) {
        nextString = `🔀 Shuffled`;
        nextTrackIdentifier = 'Track';
      } else {
        // Creates a string with a hyperlink to the next track, and a hyperlink to the next track's uploader.
        // If the uploader doesn't have a URL, it will just use the uploader's name.
        // Example: [Next Track Title](<Track URL>) by [Uploader Name](<Optional Uploader URL>)

        const uploaderString = nextTrack.getArtistHyperlinks();

        nextString = `${hyperlink(
          nextTrack.title,
          nextTrack.url
        )} by ${uploaderString}`;
      }

      embed.setDescription(
        embed.data.description + `\nNext ${nextTrackIdentifier}: ${nextString}`
      );
    } else {
      embed.setFooter({
        text: 'The bot will leave 5 minutes after the queue is empty.'
      });
    }

    message = { embeds: [embed] };
  } else {
    const uploaderString = currentTrack.getArtistHyperlinks();

    let text = `Now Playing:\n${hyperlink(
      currentTrack.title,
      hideLinkEmbed(currentTrack.url)
    )} | By ${uploaderString} | ${
      typeof currentTrack.duration === 'string'
        ? currentTrack.duration
        : currentTrack.duration.toFormat('m:ss')
    } | Added by ${inlineCode(currentTrack.addedBy)}`;

    if (nextTrack) {
      if (guildMusicData.queueSystemData.shuffle) {
        text += '\n🔀 | The next track will be randomly picked from the queue.';
      } else {
        const nextTrackIdentifier = _.capitalize(
          getTrackNamings(nextTrack).trackIdentifier
        );

        const nextUploaderString = nextTrack.getArtistHyperlinks();

        text += `\n\nNext ${nextTrackIdentifier}:\n${hyperlink(
          nextTrack.title,
          hideLinkEmbed(nextTrack.url)
        )} | By ${nextUploaderString}`;
      }
    } else {
      text += '\n\nThe bot will leave 5 minutes after the queue is empty.';
    }

    message = text;
  }

  guildMusicData.sendUpdateMessage(message);
}

async function playTrack(
  track: QueuedTrackInfo | QueuedAdaptedTrackInfo,
  audioPlayer: AudioPlayer,
  musicData: GuildMusicData
) {
  const metadata: MusicResourceMetadata = {
    type: 'queued_track',
    data: track
  };

  let audioTrack: TrackInfo;

  if (track instanceof QueuedAdaptedTrackInfo) {
    audioTrack = track.matchedTrack;
  } else {
    audioTrack = track;
  }

  let resource: AudioResource;
  if (
    audioTrack.source === 'youtube' ||
    audioTrack.source === 'youtube_music'
  ) {
    const streamedTrack = ytdl(audioTrack.url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 62,
      liveBuffer: 1 << 62,
      dlChunkSize: 0
    });

    streamedTrack.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      streamedTrack.destroy();
      audioPlayer.stop();
    });

    resource = createAudioResource(streamedTrack, {
      metadata
    });
  } else {
    const streamedTrack = await playdl.stream(audioTrack.url, {
      quality: 2,
      discordPlayerCompatibility: false
    });

    streamedTrack.stream.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      audioPlayer.stop();
    });

    resource = createAudioResource(streamedTrack.stream, {
      inputType: streamedTrack.type,
      metadata
    });
  }

  audioPlayer.play(resource);

  const trackSkipped = musicData.queueSystemData.skipped;
  const isLoopingByTrack = musicData.queueSystemData.loop.type === 'track';

  // Do not send the now playing message if the track has looped successfully
  // This will only run when the loop type isn't 'track', or
  // When the loop type is 'track' and the track was skipped
  if (!(!trackSkipped && isLoopingByTrack)) {
    musicData.queueSystemData.skipped = false;

    sendNowPlayingMessage(musicData);
  }
}

export function startQueuePlayback(guildId: string) {
  const playingType = getPlayingType(guildId);

  // If the bot is already playing a track from the queue, do not start queue playback
  if (playingType === 'queued_track') {
    return;
  }

  const guildMusicData = getGuildMusicData(guildId);

  if (guildMusicData === undefined) {
    throw new Error(`No guild music data exists for guild ${guildId}`);
  }

  if (guildMusicData.leaveTimeout !== null) {
    clearTimeout(guildMusicData.leaveTimeout);
    guildMusicData.leaveTimeout = null;
  }

  const queueData = guildMusicData.queueSystemData;

  const voiceConnection = connectToVoiceChannel(
    guildMusicData.getVoiceChannel()
  );

  disposeAudioPlayer(guildId);
  let audioPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }
  });

  // Handles the switch of the source of the audio player
  if (playingType === 'radio') {
    const currentTrackIdentifier = getTrackNamings(
      queueData.currentTrack()
    ).fullIdentifier;

    guildMusicData.sendUpdateMessage(
      `Disconnecting from the radio to play a ${currentTrackIdentifier}...`
    );

    // Disconnects the guild from the radio websocket
    disconnectGuildFromRadioWebsocket(guildId);
  }

  audioPlayer = audioPlayer.on('error', (error) => {
    const resourceMetadata = (error.resource.metadata as MusicResourceMetadata)
      .data as QueuedTrackInfo;

    const erroredTrackTimestamp = Duration.fromMillis(
      error.resource.playbackDuration
    ).toFormat('m:ss');

    container.logger.error(
      `An error occurred while playing ${resourceMetadata.title} | ${resourceMetadata.url} in the ${erroredTrackTimestamp} mark\n${error.stack}`
    );

    const localMusicData = getGuildMusicData(guildId);

    if (localMusicData === undefined) {
      return;
    }

    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.Error)
      .setTitle('Playback Error');

    const embed = createFancyEmbedFromTrack(baseEmbed, resourceMetadata);

    if (resourceMetadata.duration !== 'Live Stream') {
      embed.spliceFields(2, 1, {
        name: 'Timestamp of Error',
        value: `${erroredTrackTimestamp} / ${resourceMetadata.duration.toFormat(
          'm:ss'
        )}`
      });
    }

    embed.addFields({
      name: 'Error',
      value: `${error.name}: ${error.message}`
    });

    localMusicData.sendUpdateMessage({ embeds: [embed] });
  });

  voiceConnection.subscribe(audioPlayer);

  queueData.playing = true;
  playTrack(queueData.currentTrack(), audioPlayer, guildMusicData);

  audioPlayer.on(AudioPlayerStatus.Idle, () => {
    const localMusicData = getGuildMusicData(guildId);

    if (localMusicData === undefined) {
      return;
    }

    const localQueueData = localMusicData.queueSystemData;

    if (localQueueData.loop.type === 'queue') {
      localQueueData.trackList.push(localQueueData.currentTrack());
    }

    if (localQueueData.loop.type !== 'track') {
      localQueueData.trackListIndex++;
    }

    const isQueueEmpty =
      localQueueData.trackList.length === localQueueData.trackListIndex;

    const isVCEmpty =
      localMusicData
        .getVoiceChannel()
        .members.filter((member) => !member.user.bot).size === 0;

    // If the queue is empty or the voice channel is empty, start a timeout to leave the voice channel
    // Only start the timeout if it hasn't been started yet
    if ((isVCEmpty || isQueueEmpty) && localMusicData.leaveTimeout === null) {
      const embed = new EmbedBuilder().setColor(ColorPalette.Info);

      if (isQueueEmpty) {
        embed.setTitle('Queue Empty');
        embed.setDescription(
          'No more tracks in the queue. Leaving in 5 minutes...'
        );
      } else {
        embed.setTitle('No Users in Voice Channel');
        embed.setDescription(
          'No users are inside the voice channel. Leaving in 5 minutes...'
        );
      }

      localMusicData.sendUpdateMessage({ embeds: [embed] });

      localMusicData.leaveTimeout = setTimeout(() => {
        const futureMusicData = getGuildMusicData(guildId);

        const futureQueueEmpty =
          futureMusicData?.queueSystemData.trackList.length ===
          futureMusicData?.queueSystemData.trackListIndex;

        const futureVCEmpty =
          futureMusicData === undefined ||
          futureMusicData
            .getVoiceChannel()
            .members.filter((member) => !member.user.bot).size === 0;

        const timeoutEmbed = new EmbedBuilder().setColor(ColorPalette.Error);

        if (futureQueueEmpty) {
          timeoutEmbed.setTitle('Queue Empty');
          timeoutEmbed.setDescription(
            'No more tracks in the queue. Stopping...'
          );
        } else if (futureVCEmpty) {
          timeoutEmbed.setTitle('No Users in Voice Channel');
          timeoutEmbed.setDescription(
            'No users are inside the voice channel. Stopping...'
          );
        }

        futureMusicData?.sendUpdateMessage({ embeds: [timeoutEmbed] });

        if (futureQueueEmpty || futureVCEmpty) {
          localQueueData.playing = false;
          disposeAudioPlayer(guildId);
          voiceConnection.destroy();
        }
      }, 5 * 60 * 1000);
    }

    // Do not continue if the queue is empty
    if (isQueueEmpty) {
      return;
    }

    if (localQueueData.shuffle && localQueueData.loop.type !== 'track') {
      const randomIndex = Math.floor(
        Math.random() * localQueueData.getQueue().length
      );

      const selectedVideo = localQueueData.trackList.splice(randomIndex, 1)[0];

      localQueueData.trackList.splice(
        localQueueData.trackListIndex,
        0,
        selectedVideo
      );
    }

    playTrack(localQueueData.currentTrack(), audioPlayer, localMusicData);
  });
}
