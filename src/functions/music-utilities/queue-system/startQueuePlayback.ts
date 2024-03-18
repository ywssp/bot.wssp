import { container } from '@sapphire/framework';

import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior
} from '@discordjs/voice';
import { EmbedBuilder, hyperlink } from 'discord.js';
import { getGuildMusicData } from '../guildMusicDataManager';
import { QueuedTrackInfo } from '../../../interfaces/Music/Queue System/TrackInfo';
import * as playdl from 'play-dl';
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

        const uploaderString =
          nextTrack.uploader.url !== undefined
            ? hyperlink(nextTrack.uploader.name, nextTrack.uploader.url)
            : nextTrack.uploader.name;

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
    }

    message = { embeds: [embed] };
  } else if (announceStyle === 'embed_simple') {
    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.Info)
      .setTitle('Now Playing');

    const embed = createSimpleEmbedFromTrack(baseEmbed, currentTrack);
    embed.setDescription(
      embed.data.description + `\nRequested By: ${currentTrack.addedBy}`
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

        const uploaderString =
          nextTrack.uploader.url !== undefined
            ? hyperlink(nextTrack.uploader.name, nextTrack.uploader.url)
            : nextTrack.uploader.name;

        nextString = `${hyperlink(
          nextTrack.title,
          nextTrack.url
        )} by ${uploaderString}`;
      }

      embed.setDescription(
        embed.data.description + `\nNext ${nextTrackIdentifier}: ${nextString}`
      );
    }

    message = { embeds: [embed] };
  } else {
    let text = `Now Playing\n${currentTrack.title} - <${currentTrack.url}> | ${
      typeof currentTrack.duration === 'string'
        ? currentTrack.duration
        : currentTrack.duration.toFormat('m:ss')
    } | By ${currentTrack.uploader.name}`;

    if (nextTrack) {
      if (guildMusicData.queueSystemData.shuffle) {
        text += '\n🔀 | The next track will be randomly picked from the queue.';
      } else {
        const nextTrackIdentifier = _.capitalize(
          getTrackNamings(nextTrack).trackIdentifier
        );
        text += `\n\nNext ${nextTrackIdentifier}\n${nextTrack.title} - <${nextTrack.url}>\nBy ${nextTrack.uploader.name}`;
      }
    }

    message = text;
  }

  guildMusicData.sendUpdateMessage(message);
}

async function playTrack(
  track: QueuedTrackInfo,
  audioPlayer: AudioPlayer,
  musicData: GuildMusicData
) {
  const streamedTrack = await playdl.stream(track.url);

  streamedTrack.stream.on('error', (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    audioPlayer.stop();
  });

  // Set type as MusicResourceMetadata with property type of 'youtube'
  const metadata: MusicResourceMetadata = {
    type: 'queued_track',
    data: track
  };

  const resource = createAudioResource(streamedTrack.stream, {
    inputType: streamedTrack.type,
    metadata
  });

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

  const queueData = guildMusicData.queueSystemData;

  const voiceConnection = connectToVoiceChannel(
    guildMusicData.getVoiceChannel()
  );

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

    // Removes the old audio player used for radio playback
    disposeAudioPlayer(guildId);

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

    const isVCEmpty =
      localMusicData
        .getVoiceChannel()
        .members.filter((member) => !member.user.bot).size === 0;

    const isQueueEmpty =
      localQueueData.trackList.length === localQueueData.trackListIndex;

    const ifStopping = isVCEmpty || isQueueEmpty;

    if (isVCEmpty) {
      localMusicData.sendUpdateMessage(
        'No users are inside the voice channel. Stopping...'
      );
    }

    if (isQueueEmpty) {
      localMusicData.sendUpdateMessage(
        'No more tracks in the queue. Stopping...'
      );
    }

    if (ifStopping) {
      localQueueData.playing = false;
      disposeAudioPlayer(guildId);
      voiceConnection.destroy();
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
