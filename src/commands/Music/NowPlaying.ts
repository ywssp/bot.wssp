import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

import { capitalize } from 'lodash';
import { DateTime, Duration } from 'luxon';

import { getGuildMusicData } from '../../functions/music-utilities/guildMusicDataManager';
import { GuildMusicData } from '../../interfaces/GuildMusicData/GuildMusicData';
import { createEmbedFromTrack } from '../../functions/music-utilities/queue-system/createEmbedFromTrack';
import { getAudioPlayer } from '../../functions/music-utilities/getAudioPlayer';
import { getPlayingType } from '../../functions/music-utilities/getPlayingType';
import { createRadioSongEmbed } from '../../functions/music-utilities/radio/createEmbedFromRadioSong';

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
        content: 'There is nothing playing.',
        ephemeral: true
      });
      return;
    }

    if (playType === 'queued_track') {
      interaction.reply(this.getYoutubeEmbed(interaction, guildMusicData));
    } else if (playType === 'radio') {
      interaction.reply(this.getRadioEmbed(guildMusicData));
    }

    return;
  }

  public getYoutubeEmbed(
    interaction: ChatInputCommand.Interaction,
    guildMusicData: GuildMusicData
  ) {
    const youtubeData = guildMusicData.queueSystemData;
    const currentTrack = youtubeData.currentTrack();
    const audioPlayer = getAudioPlayer(interaction.guildId as string);

    if (
      audioPlayer === undefined ||
      (audioPlayer.state.status !== 'playing' &&
        audioPlayer.state.status !== 'paused')
    ) {
      return {
        content: '❓ | There is no track playing.',
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

    const embed = createEmbedFromTrack(baseEmbed, currentTrack);

    embed.spliceFields(2, 1, {
      name: 'Duration',
      value: durationVisual
    });

    const playingEmoji = audioPlayer.state.status === 'playing' ? '▶️' : '⏸';

    embed.setFooter({
      text: `${playingEmoji} ${capitalize(audioPlayer.state.status)} | ${
        youtubeData.loop.emoji
      } ${capitalize(youtubeData.loop.type)}`
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
        content: 'There is no song playing.',
        ephemeral: true
      };
    }

    const currentSong = lastUpdate.song;

    const embed = createRadioSongEmbed(currentSong);
    embed.setFooter({
      text: `${radioData.station === 'jpop' ? '🇯🇵 J-Pop' : '🇰🇷 K-Pop'} Station`
    });

    const startTime = DateTime.fromISO(lastUpdate.startTime);
    const currentTime = DateTime.now();

    const passedTime = currentTime.diff(startTime);

    const totalTime = Duration.fromObject({
      seconds: currentSong.duration
    });

    const durationVisual = this.getDurationVisual(passedTime, totalTime);

    embed.spliceFields(-1, 1, {
      name: 'Duration',
      value: durationVisual
    });

    return { embeds: [embed] };
  }

  public getDurationVisual(passedTime: Duration, totalTime: Duration) {
    const playBackBarLocation = Math.round(
      (passedTime.toMillis() / totalTime.toMillis()) * 10
    );

    const seekbarArr = Array(20).fill('─');
    seekbarArr[playBackBarLocation * 2] = '●';
    const seekbar = seekbarArr.join('');

    return `${passedTime.toFormat('m:ss')} | ${totalTime.toFormat(
      'm:ss'
    )}\n${seekbar}`;
  }
}
