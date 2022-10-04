import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';
import { formatVideoField } from '../../../functions/music-utilities/YouTube/formatVideoField';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getAudioPlayer } from '../../../functions/music-utilities/getAudioPlayer';

export class SkipVideoCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'skip',
      description: 'Skips an amount of videos.',
      runIn: 'GUILD_ANY',
      preconditions: ['InVoiceChannel', 'IsPlaying', 'IsPlayingYoutube']
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
    const guildYoutubeData = getGuildMusicData(
      interaction.guildId as string
    )?.youtubeData;

    if (typeof guildYoutubeData === 'undefined') {
      interaction.reply('The queue is empty.');
      return;
    }

    const audioPlayer = getAudioPlayer(interaction.guildId as string);

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
        guildYoutubeData.videoList.length - guildYoutubeData.videoListIndex
    ) {
      interaction.reply({
        content: `⛔ | Invalid number. The number must be between \`1-${
          guildYoutubeData.getQueue().length
        }\`.`,
        ephemeral: true
      });
      return;
    }

    const skippedVideos = guildYoutubeData.videoList.slice(
      guildYoutubeData.videoListIndex,
      guildYoutubeData.videoListIndex + skipNumber
    );

    const embed = new MessageEmbed()
      .setColor(ColorPalette.error)
      .setTitle(`Skipped ${skippedVideos.length} videos`)
      .setFields(
        skippedVideos.slice(0, 9).map((video) => formatVideoField(video))
      );

    if (skippedVideos.length > 8) {
      embed.addFields({
        name: '\u200b',
        value: `And ${skippedVideos.length - 9} more videos.`
      });
    }

    guildYoutubeData.modifyIndex(skipNumber);

    audioPlayer.stop();
    interaction.reply({ embeds: [embed] });
    return;
  }
}
