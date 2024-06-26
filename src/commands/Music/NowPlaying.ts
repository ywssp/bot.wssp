import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

import { capitalize } from 'lodash';
import { DateTime, Duration } from 'luxon';

import { getGuildMusicData } from '../../functions/music-utilities/guildMusicDataManager';
import { GuildMusicData } from '../../interfaces/Music/GuildMusicData/GuildMusicData';
import { createFancyEmbedFromTrack } from '../../functions/music-utilities/queue-system/createFancyEmbedFromTrack';
import { getAudioPlayer } from '../../functions/music-utilities/getAudioPlayer';
import { getPlayingType } from '../../functions/music-utilities/getPlayingType';
import { createFancyRadioSongEmbed } from '../../functions/music-utilities/radio/createFancyEmbedFromRadioSong';

import { ColorPalette } from '../../settings/ColorPalette';
export class NowPlayingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'nowplaying',
      description: 'Displays the details of the currently playing track.',
      runIn: 'GUILD_ANY'
    });
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildMusicData = getGuildMusicData(interaction.guildId as string);
    const playType = getPlayingType(interaction.guildId as string);

    if (playType === undefined || guildMusicData === undefined) {
      interaction.reply({
        content: '❓ | Nothing is playing.',
        ephemeral: true
      });
      return;
    }

    if (playType === 'queued_track') {
      interaction.reply(this.getTrackEmbed(interaction, guildMusicData));
    } else if (playType === 'radio') {
      interaction.reply(this.getRadioEmbed(guildMusicData));
    }

    return;
  }

  public getTrackEmbed(
    interaction: ChatInputCommand.Interaction,
    guildMusicData: GuildMusicData
  ) {
    const queueData = guildMusicData.queueSystemData;
    const currentTrack = queueData.currentTrack();
    const audioPlayer = getAudioPlayer(interaction.guildId as string);

    if (
      audioPlayer === undefined ||
      (audioPlayer.state.status !== 'playing' &&
        audioPlayer.state.status !== 'paused')
    ) {
      return {
        content: '❓ | Nothing is playing.',
        ephemeral: true
      };
    }

    let durationVisual = '';
    if (typeof currentTrack.duration !== 'string') {
      const passedTime = Duration.fromMillis(
        audioPlayer.state.resource.playbackDuration
      );

      const totalTime = currentTrack.duration;

      durationVisual = this.getDurationVisual(passedTime, totalTime);
    } else {
      durationVisual = '🔴 Live Stream';
    }

    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.Info)
      .setTitle('Now Playing');

    const embed = createFancyEmbedFromTrack(baseEmbed, currentTrack);
    embed.spliceFields(-1, 1, {
      name: 'Length',
      value: durationVisual
    });

    embed.addFields({
      name: 'Added By',
      value: currentTrack.addedBy
    });

    const playingEmoji = audioPlayer.state.status === 'playing' ? '▶️' : '⏸';

    embed.setFooter({
      text: `${playingEmoji} ${capitalize(audioPlayer.state.status)} | ${
        queueData.loop.emoji
      } Looping ${capitalize(queueData.loop.type)}`
    });

    if (currentTrack.thumbnail) {
      embed.setThumbnail(currentTrack.thumbnail);
    }

    return { embeds: [embed] };
  }

  public getRadioEmbed(guildMusicData: GuildMusicData) {
    const radioData = guildMusicData.radioData;
    const lastUpdate =
      this.container.radioWebsockets[
        radioData.station as Exclude<typeof radioData.station, 'none'>
      ].lastUpdate;

    if (lastUpdate === null) {
      return {
        content: 'There is no track playing.',
        ephemeral: true
      };
    }

    const currentSong = lastUpdate.song;

    const embed = createFancyRadioSongEmbed(currentSong);
    embed.setFooter({
      text: `${radioData.station === 'jpop' ? '🇯🇵 J-Pop' : '🇰🇷 K-Pop'} Station`
    });

    let startTime = DateTime.fromISO(lastUpdate.startTime);
    if (
      lastUpdate.localStartTime !== undefined &&
      lastUpdate.localStartTime !== null
    ) {
      startTime = lastUpdate.localStartTime;
    }

    const currentTime = DateTime.now();

    const passedTime = currentTime.diff(startTime);

    const totalTime = Duration.fromObject({
      seconds: currentSong.duration
    });

    if (currentSong.duration === 0) {
      embed.spliceFields(-1, 1, {
        name: 'Time Passed',
        value: passedTime.toFormat('m:ss')
      });
    } else {
      const durationVisual = this.getDurationVisual(passedTime, totalTime);

      embed.spliceFields(-1, 1, {
        name: 'Estimated Length',
        value: durationVisual
      });
    }

    return { embeds: [embed] };
  }

  public getDurationVisual(passedTime: Duration, totalTime: Duration) {
    const remainingTime = totalTime.minus(passedTime);
    const playBackBarLocation = Math.round(
      (passedTime.toMillis() / totalTime.toMillis()) * 10
    );

    const seekbarArr = Array(20).fill('─');
    seekbarArr[playBackBarLocation * 2] = '●';
    const seekbar = seekbarArr.join('');

    return `${passedTime.toFormat('m:ss')} | ${totalTime.toFormat(
      'm:ss'
    )} (-${remainingTime.toFormat('m:ss')})\n${seekbar}`;
  }
}
