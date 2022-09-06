import {
  getVoiceConnection,
  VoiceConnectionReadyState
} from '@discordjs/voice';
import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import { capitalize } from 'lodash';
import { Duration } from 'luxon';
import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';

export class NowPlayingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'nowplaying',
      aliases: [],
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
    const guildMusicData = getGuildMusicData({
      create: false,
      guildId: interaction.guildId as string
    });

    if (typeof guildMusicData === 'undefined' || !guildMusicData.isPlaying()) {
      interaction.reply({
        content: 'There is no video playing.',
        ephemeral: true
      });
      return;
    }

    const currentVideo = guildMusicData.currentVideo();
    const voiceConnection = getVoiceConnection(interaction.guildId as string);

    if (voiceConnection === undefined) {
      interaction.reply({
        content: 'There is no video playing.',
        ephemeral: true
      });
      return;
    }

    const audioPlayer = (voiceConnection.state as VoiceConnectionReadyState)
      .subscription?.player;

    if (
      audioPlayer === undefined ||
      (audioPlayer.state.status !== 'playing' &&
        audioPlayer.state.status !== 'paused')
    ) {
      interaction.reply({
        content: 'There is no video playing.',
        ephemeral: true
      });
      return;
    }

    let durationVisual = '';
    if (typeof currentVideo.duration !== 'string') {
      const passedTime = Duration.fromMillis(
        audioPlayer.state.resource.playbackDuration
      );

      const totalTime = currentVideo.duration;

      const playBackBarLocation = Math.round(
        (passedTime.toMillis() / totalTime.toMillis()) * 10
      );

      let seekbar = '';
      for (let i = 0; i <= 20; i++) {
        seekbar += i === playBackBarLocation * 2 ? '●' : '─';
      }
      durationVisual = `${passedTime.toFormat('m:ss')} | ${totalTime.toFormat(
        'm:ss'
      )}\n${seekbar}`;
    } else {
      durationVisual = '🔴 Live Stream';
    }

    const embed = new MessageEmbed()
      .setColor('#5e81ac')
      .setTitle('Now Playing')
      .addFields(
        {
          name: 'Title',
          value: `[${currentVideo.title}](${currentVideo.url})`
        },
        {
          name: 'Channel',
          value: `[${currentVideo.channel.name}](${currentVideo.channel.url})`
        },
        {
          name: 'Duration',
          value: durationVisual
        },
        {
          name: '\u200b',
          value: '\u200b'
        },
        {
          name: 'Requested By',
          value: currentVideo.requester
        }
      );

    const playingEmoji = audioPlayer.state.status === 'playing' ? '▶️' : '⏸';

    embed.setFooter({
      text: `${playingEmoji} ${capitalize(audioPlayer.state.status)} | ${
        guildMusicData.loop.emoji
      } ${capitalize(guildMusicData.loop.type)}`
    });

    if (currentVideo.thumbnail) {
      embed.setThumbnail(currentVideo.thumbnail);
    }

    interaction.reply({ embeds: [embed] });
    return;
  }
}
