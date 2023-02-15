import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder, inlineCode } from 'discord.js';

import { getGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';
import { createEmbedFieldFromTrack } from '../../../functions/music-utilities/queue-system/createEmbedFieldFromTrack';
import { createPagedEmbed } from '../../../functions/createPagedEmbed';

import { ColorPalette } from '../../../settings/ColorPalette';

export class DisplayQueueCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'queue',
      description: 'Displays the music queue of the server.',
      runIn: 'GUILD_ANY',
      preconditions: ['HasGuildMusicData']
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

    if (
      guildMusicData === undefined ||
      guildMusicData.queueSystemData.getQueue().length === 0
    ) {
      interaction.reply('❓ | The queue is empty.');
      return;
    }

    const guildYoutubeData = guildMusicData.queueSystemData;
    const queue = guildYoutubeData.getQueue();

    const queueFields = queue.map((track, index) =>
      createEmbedFieldFromTrack(track, `${index + 1}. `)
    );

    let description = null;

    if (guildYoutubeData.shuffle) {
      description =
        '🔀 | The queue is shuffled. Songs will be played in a random order.';
    }

    if (guildYoutubeData.loop.type === 'track') {
      if (description === null) {
        description = '';
      } else {
        description += '\n';
      }

      const currentTrack = guildYoutubeData.currentTrack();
      description += `🔂 | ${inlineCode(currentTrack.title)} by ${inlineCode(
        currentTrack.uploader.name
      )} is looping.`;
    }

    const embed = new EmbedBuilder()
      .setColor(ColorPalette.Default)
      .setTitle('Queue')
      .setDescription(description);

    createPagedEmbed(interaction, queueFields, embed);
    return;
  }
}
