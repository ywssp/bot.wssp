'use strict';

import { RadioData } from './RadioData';
import { QueueSystemData } from './QueueSystemData';
import { container } from '@sapphire/framework';
import { SendableChannels, VoiceBasedChannel } from 'discord.js';

export class GuildMusicData {
  textUpdateChannelId: string;
  voiceChannelId: string;
  musicAnnounceStyle: 'embed_fancy' | 'embed_simple' | 'text_simple' | 'none';
  queueSystemData: QueueSystemData;
  radioData: RadioData;
  leaveTimeout: NodeJS.Timeout | null = null;

  constructor(
    voiceChannel: VoiceBasedChannel,
    textUpdateChannel: SendableChannels
  ) {
    this.textUpdateChannelId = textUpdateChannel.id;
    this.voiceChannelId = voiceChannel.id;
    this.musicAnnounceStyle = 'embed_simple';
    this.queueSystemData = new QueueSystemData();
    this.radioData = new RadioData();
  }

  getTextUpdateChannel() {
    return container.client.channels.cache.get(
      this.textUpdateChannelId
    ) as SendableChannels;
  }

  setTextUpdateChannel(channel: SendableChannels) {
    this.textUpdateChannelId = channel.id;
  }

  sendUpdateMessage(message: Parameters<SendableChannels['send']>[0]) {
    const textUpdateChannel = this.getTextUpdateChannel();

    if (textUpdateChannel === undefined) {
      throw new Error(
        `Cannot find text update channel with id ${this.textUpdateChannelId}`
      );
    }

    textUpdateChannel.send(message);
  }

  setVoiceChannel(channel: VoiceBasedChannel) {
    this.voiceChannelId = channel.id;
  }

  getVoiceChannel() {
    return container.client.channels.cache.get(
      this.voiceChannelId
    ) as VoiceBasedChannel;
  }
}
