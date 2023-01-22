import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getAudioPlayer } from '../../../functions/music-utilities/getAudioPlayer';
import { createMultiVideoEmbed } from '../../../functions/music-utilities/YouTube/createMultivideoEmbed';

export class PreviousVideoCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'previous',
      description: 'Plays a video from the music history.',
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
            .setDescription('The number of videos to skip. Defaults to 1')
            .setRequired(false)
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildYoutubeData = getGuildMusicData(
      interaction.guildId as string
    )?.youtubeData;

    if (
      guildYoutubeData === undefined ||
      guildYoutubeData.getHistory().length === 0
    ) {
      interaction.reply('❓ | The video history is empty.');
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

    if (skipNumber < 1 || skipNumber > guildYoutubeData.videoListIndex) {
      interaction.reply({
        content: `⛔ | Invalid number. The number must be between \`1-${guildYoutubeData.videoListIndex}\`.`,
        ephemeral: true
      });
      return;
    }

    const skippedVideos = guildYoutubeData.videoList.slice(
      guildYoutubeData.videoListIndex - skipNumber + 1,
      guildYoutubeData.videoListIndex + 1
    );

    const embed = new EmbedBuilder()
      .setColor(ColorPalette.error)
      .setTitle(
        `Skipped ${skippedVideos.length} video${
          skippedVideos.length > 1 ? 's' : ''
        } from the queue`
      );

    guildYoutubeData.modifyIndex(-skipNumber);
    guildYoutubeData.skipped = true;

    audioPlayer.stop();
    interaction.reply({
      embeds: [createMultiVideoEmbed(embed, skippedVideos)]
    });
    return;
  }
}
