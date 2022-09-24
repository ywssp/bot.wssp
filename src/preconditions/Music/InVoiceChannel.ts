import { ChatInputCommand, Precondition } from '@sapphire/framework';
import type { GuildMember, Message } from 'discord.js';

export class InVoiceChannelPrecondition extends Precondition {
  public override messageRun(message: Message) {
    return this.check(message.member);
  }

  public override chatInputRun(interaction: ChatInputCommand.Interaction) {
    return this.check(interaction.member as GuildMember);
  }

  private check(member: GuildMember | null) {
    if (member === null) {
      return this.error({ message: 'Failed to get VoiceState data!' });
    }

    const memberVoiceChannel = member.voice.channel;

    if (!memberVoiceChannel || memberVoiceChannel.type !== 'GUILD_VOICE') {
      return this.error({ message: 'The user is not inside a voice channel!' });
    }

    if (!memberVoiceChannel.joinable) {
      return this.error({ message: 'Cannot join the voice channel!' });
    }

    if (!memberVoiceChannel.speakable) {
      return this.error({
        message: 'Cannot play music inside the voice channel!'
      });
    }

    if (
      member.guild.me?.voice.channel === undefined ||
      member.guild.me?.voice.channel === null
    ) {
      this.ok();
    }

    const clientVoiceChannel = member.guild.me?.voice.channel;

    if (memberVoiceChannel.id !== clientVoiceChannel?.id) {
      this.error({
        message: 'The user is not inside the same voice channel as the bot!'
      });
    }

    return this.ok();
  }
}
