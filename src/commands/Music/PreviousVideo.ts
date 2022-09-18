import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';

import {
  getVoiceConnection,
  VoiceConnectionReadyState
} from '@discordjs/voice';

import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';
import { formatVideoField } from '../../functions/music-utilities/formatVideoField';

import { ColorPalette } from '../../settings/ColorPalette';

export class PreviousVideoCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'previous',
      aliases: [],
      description: 'Plays a video from the music history.',
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
            .setDescription('The number of videos to skip. Defaults to 1')
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

    if (skipNumber < 1 || skipNumber > guildMusicData.videoListIndex) {
      interaction.reply({ content: '⛔ | Invalid number.', ephemeral: true });
      return;
    }

    const skippedVideos = guildMusicData.videoList.slice(
      guildMusicData.videoListIndex - skipNumber + 1,
      guildMusicData.videoListIndex + 1
    );

    const embed = new MessageEmbed()
      .setColor(ColorPalette.error)
      .setTitle(`Skipped ${skippedVideos.length} videos`)
      .setFields(
        skippedVideos.slice(0, 9).map((video) => formatVideoField(video))
      );

    if (skippedVideos.length > 8) {
      embed.addField('\u200b', `And ${skippedVideos.length - 9} more videos.`);
    }

    guildMusicData.videoListIndex -= skipNumber;

    if (guildMusicData.loop.type !== 'track') {
      guildMusicData.videoListIndex--;
    }

    audioPlayer.stop();
    interaction.reply({ embeds: [embed] });
    return;
  }
}
