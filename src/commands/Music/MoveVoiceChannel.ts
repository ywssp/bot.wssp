import { ChatInputCommand, Command } from '@sapphire/framework';
import { GuildMember, VoiceChannel } from 'discord.js';
import { ChannelType } from 'discord-api-types/v10';

import {
  DiscordGatewayAdapterCreator,
  joinVoiceChannel
} from '@discordjs/voice';
import { getGuildMusicData } from '../../functions/music-utilities/guildMusicDataManager';

export class MoveVCCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'move',
      description: 'Moves song playback to another Voice Channel',
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
        .addChannelOption((option) =>
          option
            .setName('voice-channel')
            .setDescription('The voice channel that the bot will move to.')
            .addChannelTypes(ChannelType.GuildVoice as 2)
            .setRequired(false)
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    let voiceChannel = interaction.options.getChannel(
      'voice-channel'
    ) as VoiceChannel;

    if (voiceChannel === null) {
      voiceChannel = (interaction.member as GuildMember).voice
        .channel as VoiceChannel;
    }

    if (voiceChannel === interaction.guild?.members.me?.voice.channel) {
      interaction.reply({
        content: 'I am already in that voice channel!',
        ephemeral: true
      });
      return;
    }

    interaction.deferReply();

    const attemptedConnection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild
        .voiceAdapterCreator as DiscordGatewayAdapterCreator
    });

    const errorHandler = (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      interaction.editReply({
        content: `There was an error connecting to the voice channel: ${errorMessage}`
      });
    };

    attemptedConnection.once('error', errorHandler);

    attemptedConnection.once('ready', () => {
      const guildMusicData = getGuildMusicData(interaction.guildId as string);

      guildMusicData?.setVoiceChannel(voiceChannel);

      interaction.editReply({
        content: `✅ | Successfully moved to \`🔊 ${voiceChannel.name}\``
      });

      attemptedConnection.removeListener('error', errorHandler);
    });
  }
}
