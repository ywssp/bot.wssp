import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

import { capitalize } from 'lodash';
import { DateTime, Duration } from 'luxon';

import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';
import { GuildMusicData } from '../../interfaces/GuildMusicData/GuildMusicData';
import { formatVideoEmbed } from '../../functions/music-utilities/YouTube/formatVideoEmbed';
import { getAudioPlayer } from '../../functions/music-utilities/getAudioPlayer';
import { getPlayingType } from '../../functions/music-utilities/getPlayingType';
import { formatSongEmbed } from '../../functions/music-utilities/LISTEN.moe/formatRadioSongEmbed';
import { RadioWebsocketUpdate } from '../../interfaces/RadioWebsocketUpdate';

import { ColorPalette } from '../../settings/ColorPalette';
export class NowPlayingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'nowplaying',
      description: 'Displays the details of the currently playing video.',
      runIn: 'GUILD_ANY',
      preconditions: ['IsPlaying']
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

    if (typeof guildMusicData === 'undefined') {
      interaction.reply({
        content: 'There is no video playing.',
        ephemeral: true
      });
      return;
    }

    const playType = getPlayingType(interaction.guildId as string);

    if (playType === 'youtube') {
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
    const youtubeData = guildMusicData.youtubeData;
    const currentVideo = youtubeData.currentVideo();
    const audioPlayer = getAudioPlayer(interaction.guildId as string);

    if (audioPlayer === undefined) {
      return {
        content: 'There is no video playing.',
        ephemeral: true
      };
    }

    if (
      audioPlayer === undefined ||
      (audioPlayer.state.status !== 'playing' &&
        audioPlayer.state.status !== 'paused')
    ) {
      return {
        content: '❓ | There is no video playing.',
        ephemeral: true
      };
    }

    let durationVisual = '';
    if (typeof currentVideo.duration !== 'string') {
      const passedTime = Duration.fromMillis(
        audioPlayer.state.resource.playbackDuration
      );

      const totalTime = currentVideo.duration;

      durationVisual = this.getDurationVisual(passedTime, totalTime);
    } else {
      durationVisual = '🔴 Live Stream';
    }

    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.info)
      .setTitle('Now Playing');

    const embed = formatVideoEmbed(baseEmbed.data, currentVideo);

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

    if (currentVideo.thumbnail) {
      embed.setThumbnail(currentVideo.thumbnail);
    }

    return { embeds: [embed] };
  }

  public getRadioEmbed(guildMusicData: GuildMusicData) {
    const radioData = guildMusicData.radioData;
    const currentSong = radioData.currentSong;

    if (currentSong === undefined) {
      return {
        content: 'There is no song playing.',
        ephemeral: true
      };
    }

    const embed = formatSongEmbed(currentSong);
    embed.setFooter({
      text: `${radioData.station === 'jpop' ? '🇯🇵 J-Pop' : '🇰🇷 K-Pop'} Station`
    });

    const startTime = DateTime.fromISO(
      (radioData.lastUpdate as Exclude<RadioWebsocketUpdate, { op: 0 }>)?.d
        .startTime
    );
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
