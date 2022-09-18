import { ChatInputCommand, Command } from '@sapphire/framework';

import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';

export class SetLoopCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'loop',
      aliases: [],
      description: 'Sets the loop mode of the music player.',
      runIn: 'GUILD_ANY'
    });
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('mode')
            .setDescription('The loop mode to set.')
            .setRequired(true)
            .setChoices(
              { name: 'Off', value: 'off' },
              { name: 'Track', value: 'track' },
              { name: 'Queue', value: 'queue' }
            )
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildMusicData = getGuildMusicData({
      create: false,
      guildId: interaction.guildId as string
    });

    if (typeof guildMusicData === 'undefined') {
      interaction.reply({
        content: 'There is no video playing.',
        ephemeral: true
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const mode = interaction.options.getString('mode')!;

    switch (mode) {
      case 'queue':
        guildMusicData.loop = {
          type: 'queue',
          emoji: '🔁'
        };
        break;
      case 'track':
        guildMusicData.loop = {
          type: 'track',
          emoji: '🔂'
        };
        break;

      default:
        guildMusicData.loop = {
          type: 'off',
          emoji: '➡️'
        };
        break;
    }

    interaction.reply(
      `${guildMusicData.loop.emoji} | Loop mode set to \`${mode}\`.`
    );
    return;
  }
}
