import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed, GuildMember } from 'discord.js';

import {
  createAudioPlayer,
  NoSubscriberBehavior,
  createAudioResource,
  AudioPlayerStatus,
  AudioPlayerPlayingState,
  AudioResource,
  getVoiceConnection,
  StreamType
} from '@discordjs/voice';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';
import { setupRadioWebsocket } from '../../../functions/music-utilities/LISTEN.moe/setupWebsocket';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getPlayingType } from '../../../functions/music-utilities/getPlayingType';
import { getAudioPlayer } from '../../../functions/music-utilities/getAudioPlayer';
import { disconnectRadioWebsocket } from '../../../functions/music-utilities/LISTEN.moe/disconnectWebsocket';
import { connectVoiceChannel } from '../../../functions/music-utilities/connectVoiceChannel';
import { unsubscribeVoiceConnection } from '../../../functions/music-utilities/unsubscribeVoiceConnection';

export class JoinRadioCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'radio',
      aliases: [],
      description: 'Joins a LISTEN.moe radio channel.',
      runIn: ['GUILD_TEXT'],
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
        .addStringOption((option) =>
          option
            .setName('channel')
            .setDescription('The radio channel to join.')
            .setRequired(true)
            .addChoices(
              {
                name: 'J-Pop',
                value: 'jpop'
              },
              {
                name: 'K-Pop',
                value: 'kpop'
              }
            )
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildMusicData = getGuildMusicData({
      guildId: interaction.guildId as string,
      create: true,
      interaction
    });

    const channel = interaction.options.getString('channel') as 'jpop' | 'kpop';

    const resourceUrl = `https://listen.moe${
      channel === 'kpop' ? '/kpop' : ''
    }/opus`;

    const playingType = getPlayingType(interaction.guildId as string);

    if (playingType !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const audioPlayer = getAudioPlayer(interaction.guildId as string)!;

      if (playingType === 'radio') {
        if (
          ((
            (audioPlayer?.state as AudioPlayerPlayingState)
              .resource as AudioResource<{ url: string }>
          ).metadata?.url as string) === resourceUrl
        ) {
          interaction.reply('Already playing that radio channel!');
          return;
        }

        interaction.channel?.send('Switching radio channels...');

        guildMusicData.radioData?.websocket?.connection.close();
        clearTimeout(guildMusicData.radioData?.websocket?.heartbeat);
      } else {
        interaction.channel?.send('Switching to radio...');
      }

      audioPlayer.removeAllListeners().stop();
      unsubscribeVoiceConnection(interaction.guildId as string);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

    const voiceConnection = connectVoiceChannel(voiceChannel);

    const audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    });

    console.log('Created AudioPlayer for radio.');

    audioPlayer.on('error', (error) => {
      this.container.logger.error(error);

      const embed = new MessageEmbed()
        .setColor(ColorPalette.error)
        .setTitle('Playback Error')
        .setDescription(
          'An error occurred while playing music.\nDisconnecting from the voice channel.'
        );

      voiceConnection.destroy();
      disconnectRadioWebsocket(interaction.guildId as string);
      interaction.channel?.send({
        embeds: [embed]
      });
    });

    audioPlayer.on(AudioPlayerStatus.Idle, () => {
      const radioStream = createAudioResource(resourceUrl, {
        inputType: StreamType.OggOpus,
        metadata: {
          title: 'LISTEN.moe Radio',
          url: resourceUrl,
          type: 'radio'
        }
      });

      audioPlayer.play(radioStream);
    });

    voiceConnection.subscribe(audioPlayer);

    const radioStream = createAudioResource(resourceUrl, {
      metadata: {
        type: 'radio',
        title: 'LISTEN.moe Radio',
        url: resourceUrl
      }
    });

    audioPlayer.play(radioStream);

    setupRadioWebsocket(interaction.guildId as string, channel);

    const embed = new MessageEmbed()
      .setColor(ColorPalette.success)
      .setTitle('Connected')
      .setDescription(
        `Connected to the LISTEN.moe ${
          channel === 'kpop' ? 'K-Pop' : 'J-Pop'
        } radio channel.`
      );

    interaction.reply({
      embeds: [embed]
    });
  }
}