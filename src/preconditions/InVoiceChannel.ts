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

    const voiceState = member.voice;

    if (!voiceState.channel || voiceState.channel.type !== 'GUILD_VOICE') {
      return this.error({ message: 'The user is not inside a voice channel!' });
    }

    if (!voiceState.channel.joinable) {
      return this.error({ message: 'Cannot join the voice channel!' });
    }

    if (!voiceState.channel.speakable) {
      return this.error({
        message: 'Cannot play music inside the voice channel!'
      });
    }

    return this.ok();
  }
}
