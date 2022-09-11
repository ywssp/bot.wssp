import {
  getVoiceConnection,
  VoiceConnectionReadyState
} from '@discordjs/voice';
import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';
import { ColorPalette } from '../../settings/ColorPalette';

export class SkipVideoCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'skip',
      aliases: [],
      description: 'Skips an amount of videos.',
      runIn: 'GUILD_ANY',
      preconditions: ['InVoiceChannel', 'IsPlaying']
    });
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addIntegerOption((option) =>
          option
            .setName('number')
            .setDescription('The number of videos to skip. Defaults to `1`')
            .setRequired(false)
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildMusicData = getGuildMusicData({
      create: false,
      guildId: interaction.guildId as string
    });

    if (typeof guildMusicData === 'undefined') {
      interaction.reply('The queue is empty.');
      return;
    }

    // This command can only be run inside a guild.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const voiceConnection = getVoiceConnection(interaction.guildId!)!;

    const audioPlayer = (voiceConnection.state as VoiceConnectionReadyState)
      .subscription?.player;

    if (audioPlayer === undefined) {
      interaction.reply({
        content: '❓ | There is no video playing.',
        ephemeral: true
      });
      return;
    }

    const skipNumber = interaction.options.getInteger('number') ?? 1;

    if (
      skipNumber < 1 ||
      skipNumber >=
        guildMusicData.videoList.length - guildMusicData.videoListIndex
    ) {
      interaction.reply({ content: '⛔ | Invalid number.', ephemeral: true });
      return;
    }

    const skippedVideos = guildMusicData.videoList.slice(
      guildMusicData.videoListIndex,
      guildMusicData.videoListIndex + skipNumber
    );

    const embed = new MessageEmbed()
      .setColor(ColorPalette.error)
      .setTitle('Skipped the following videos:')
      .setFields(
        skippedVideos.map((video) => ({
          name: video.title,
          value: `[Link](${video.url}) | ${
            typeof video.duration === 'string'
              ? video.duration
              : video.duration.toFormat('m:ss')
          } | By [${video.channel.name}](${video.channel.url})`
        }))
      );

    guildMusicData.videoListIndex += skipNumber;

    if (guildMusicData.loop.type !== 'track') {
      guildMusicData.videoListIndex--;
    }

    audioPlayer.stop();
    interaction.reply({ embeds: [embed] });
    return;
  }
}