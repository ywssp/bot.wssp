import { ChatInputCommand, Command } from '@sapphire/framework';
import {
  channelLink,
  channelMention,
  TextBasedChannel,
  TextChannel
} from 'discord.js';

import { getGuildMusicData } from '../../functions/music-utilities/guildMusicDataManager';

export class MusicAnnounceSettingsCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'music-announce',
      description: 'Changes the music announce settings.',
      runIn: 'GUILD_ANY',
      preconditions: ['InVoiceChannel']
    });
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((subcommand) =>
          subcommand
            .setName('channel')
            .setDescription('Sets the channel that the bot will announce in.')
            .addChannelOption((option) =>
              option
                .setName('channel')
                .setDescription(
                  'The channel that the bot will announce in. Defaults to the current channel.'
                )
                .setRequired(false)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('style')
            .setDescription('Sets the style of the announcements.')
            .addStringOption((option) =>
              option
                .setName('style')
                .setDescription('The style of the announcements.')
                .setRequired(true)
                .addChoices(
                  { name: 'Full | Embed', value: 'full' },
                  { name: 'Minimal | Text only', value: 'minimal' },
                  { name: 'None', value: 'none' }
                )
            )
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildMusicData = getGuildMusicData(interaction.guildId as string);

    if (guildMusicData === undefined) {
      interaction.reply({
        content: '❓ | There is nothing playing.',
        ephemeral: true
      });
      return;
    }

    if (interaction.options.getSubcommand() === 'channel') {
      const channel =
        (interaction.options.getChannel('channel') as TextBasedChannel) ??
        (interaction.channel as TextBasedChannel);

      const currentChannel = guildMusicData.getTextUpdateChannel();

      if (channel === currentChannel) {
        interaction.reply({
          content: '❓ | That is already the current announce channel.',
          ephemeral: true
        });
        return;
      }

      guildMusicData.setTextUpdateChannel(channel);

      interaction.reply(
        `✅ | Music announcements will now be sent to ${channelMention(
          channel.id
        )}.`
      );

      guildMusicData.sendUpdateMessage(
        'ℹ️ | Music announcements will now be sent to this channel.'
      );
    }
    if (interaction.options.getSubcommand() === 'style') {
      guildMusicData.musicAnnounceStyle = interaction.options.getString(
        'style'
      ) as 'full' | 'minimal' | 'none';

      interaction.reply(
        `✅ | Set the music announce style to \`${guildMusicData.musicAnnounceStyle}\`.`
      );
    }

    return;
  }
}
