import { ChatInputCommand, Command } from '@sapphire/framework';

import { getVoiceConnection } from '@discordjs/voice';

import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';
import { GuildMusicData } from '../../interfaces/GuildMusicData/GuildMusicData';
import { getAudioPlayer } from '../../functions/music-utilities/getAudioPlayer';
import { getPlayingType } from '../../functions/music-utilities/getPlayingType';
import { disconnectRadioWebsocket } from '../../functions/music-utilities/LISTEN.moe/disconnectWebsocket';
import { unsubscribeVoiceConnection } from '../../functions/music-utilities/unsubscribeVoiceConnection';

export class LeaveVCCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'leave',
      aliases: [],
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
      interaction.reply('There is no video playing!');
      return;
    }

    const guildMusicData = getGuildMusicData(
      interaction.guildId as string
    ) as GuildMusicData;

    if (getPlayingType(interaction.guildId as string) === 'radio') {
      disconnectRadioWebsocket(interaction.guildId as string);
    }

    switch (interaction.options.getString('clear') as 'queue' | 'data' | null) {
      case 'queue':
        if (guildMusicData.youtubeData !== undefined) {
          guildMusicData.youtubeData.videoList.splice(
            guildMusicData.youtubeData.videoListIndex,
            guildMusicData.youtubeData.videoList.length -
              guildMusicData.youtubeData.videoListIndex
          );
        }
        break;
      case 'data':
        this.container.guildMusicDataMap.delete(interaction.guildId as string);
        break;
      default:
        break;
    }

    const voiceChannelName = interaction.guild?.me?.voice.channel?.name;

    audioPlayer.removeAllListeners();
    audioPlayer.stop();
    unsubscribeVoiceConnection(interaction.guildId as string);
    voiceConnection.destroy();
    interaction.reply(`🛑 | Left the voice channel \`${voiceChannelName}\``);
    return;
  }
}
