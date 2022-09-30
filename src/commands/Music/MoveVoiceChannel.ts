import { ChatInputCommand, Command } from '@sapphire/framework';
import { GuildMember, VoiceChannel } from 'discord.js';
import { ChannelType } from 'discord-api-types/v10';

import {
  DiscordGatewayAdapterCreator,
  joinVoiceChannel
} from '@discordjs/voice';

export class MoveVCCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'move',
      aliases: [],
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
            .addChannelTypes(ChannelType.GuildVoice)
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

    if (voiceChannel === interaction.guild?.me?.voice.channel) {
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

    attemptedConnection.once('error', (error) => {
      interaction.editReply({
        content: `There was an error connecting to the voice channel: ${error.message}`
      });
    });

    attemptedConnection.once('ready', () => {
      interaction.editReply({
        content: `✅ | Successfully moved to \`🔊 ${voiceChannel.name}\``
      });

      attemptedConnection.removeListener('error', (error) => {
        interaction.editReply({
          content: `There was an error connecting to the voice channel: ${error.message}`
        });
      });
    });
  }
}
