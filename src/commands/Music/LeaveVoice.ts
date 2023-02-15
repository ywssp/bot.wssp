import { ChatInputCommand, Command } from '@sapphire/framework';

import { getVoiceConnection } from '@discordjs/voice';

import { getGuildMusicData } from '../../functions/music-utilities/guildMusicDataManager';
import { GuildMusicData } from '../../interfaces/GuildMusicData/GuildMusicData';
import { getAudioPlayer } from '../../functions/music-utilities/getAudioPlayer';
import { getPlayingType } from '../../functions/music-utilities/getPlayingType';
import { disconnectGuildFromRadioWebsocket } from '../../functions/music-utilities/radio/disconnectGuildFromRadioWebsocket';
import { unsubscribeVCFromAudioPlayer } from '../../functions/music-utilities/unsubscribeVCFromAudioPlayer';

export class LeaveVCCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'leave',
      description: 'Leaves the voice channel.',
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
        .addStringOption((option) =>
          option
            .setName('clear')
            .setDescription('What to clear after leaving the voice channel.')
            .setRequired(false)
            .addChoices(
              { name: 'Queue - Clears the queue', value: 'queue' },
              { name: 'Data - Clears all of the data', value: 'data' }
            )
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const voiceConnection = getVoiceConnection(interaction.guildId as string);
    const audioPlayer = getAudioPlayer(interaction.guildId as string);

    if (voiceConnection === undefined || audioPlayer === undefined) {
      interaction.reply('There is nothing playing!');
      return;
    }

    const guildMusicData = getGuildMusicData(
      interaction.guildId as string
    ) as GuildMusicData;

    const playingType = getPlayingType(interaction.guildId as string);

    if (playingType === 'radio') {
      disconnectGuildFromRadioWebsocket(interaction.guildId as string);
    } else if (playingType === 'queued_track') {
      const youtubeData = guildMusicData.queueSystemData;

      if (youtubeData.loop.type !== 'track') {
        youtubeData.modifyIndex(2);
      }
    }

    switch (interaction.options.getString('clear') as 'queue' | 'data' | null) {
      case 'queue':
        if (guildMusicData.queueSystemData !== undefined) {
          guildMusicData.queueSystemData.trackList.splice(
            guildMusicData.queueSystemData.trackListIndex,
            guildMusicData.queueSystemData.trackList.length -
              guildMusicData.queueSystemData.trackListIndex
          );
        }
        break;
      case 'data':
        this.container.guildMusicDataMap.delete(interaction.guildId as string);
        break;
      default:
        break;
    }

    const voiceChannelName = interaction.guild?.members.me?.voice.channel?.name;

    audioPlayer.removeAllListeners();
    audioPlayer.stop();
    unsubscribeVCFromAudioPlayer(interaction.guildId as string);
    voiceConnection.destroy();
    interaction.reply(`🛑 | Left the voice channel \`${voiceChannelName}\``);
    return;
  }
}
