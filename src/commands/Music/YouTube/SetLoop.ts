import { ChatInputCommand, Command } from '@sapphire/framework';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';

export class SetLoopCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'loop',
      aliases: [],
      description: 'Sets the loop mode of the music player.',
      runIn: 'GUILD_ANY',
      preconditions: ['InVoiceChannel', 'HasGuildMusicData', 'IsPlayingYoutube']
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const guildMusicData = getGuildMusicData(
      interaction.guildId as string
    )!.youtubeData;

    const mode = interaction.options.getString('mode') as
      | 'off'
      | 'track'
      | 'queue';

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
