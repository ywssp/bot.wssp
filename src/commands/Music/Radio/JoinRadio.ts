import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder, GuildMember } from 'discord.js';

import {
  createAudioPlayer,
  NoSubscriberBehavior,
  createAudioResource,
  AudioPlayerStatus,
  AudioPlayerPlayingState,
  AudioResource
} from '@discordjs/voice';

import {
  createGuildMusicData,
  getGuildMusicData
} from '../../../functions/music-utilities/guildMusicDataManager';
import { createRadioWebsocketConnection } from '../../../functions/music-utilities/radio/setupRadioWebsocket';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getPlayingType } from '../../../functions/music-utilities/getPlayingType';
import { getAudioPlayer } from '../../../functions/music-utilities/getAudioPlayer';
import { disconnectGuildFromRadioWebsocket } from '../../../functions/music-utilities/radio/disconnectGuildFromRadioWebsocket';
import { connectToVoiceChannel } from '../../../functions/music-utilities/connectToVoiceChannel';
import internal from 'stream';
import {
  RadioStationNames,
  RadioStations
} from '../../../interfaces/Music/Radio/AvailableRadioStations';
import { sendRadioUpdate } from '../../../functions/music-utilities/radio/sendRadioUpdate';
import { RadioWebsocketUpdateData } from '../../../interfaces/Music/Radio/RadioWebsocketUpdate';
import { disposeAudioPlayer } from '../../../functions/music-utilities/disposeAudioPlayer';
import { MusicResourceMetadata } from '../../../interfaces/Music/MusicResourceMetadata';

export class JoinRadioCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'radio',
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
            .setDescription('The radio station to join.')
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

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    if (interaction.channel === null) {
      interaction.reply({
        content: 'Cannot find channel.',
        ephemeral: true
      });
      return;
    }

    const voiceChannel = (interaction.member as GuildMember).voice.channel;

    if (voiceChannel === null) {
      interaction.reply({
        content: 'Cannot find voice channel.',
        ephemeral: true
      });
      return;
    }

    const guildMusicData = createGuildMusicData(
      interaction.guildId as string,
      voiceChannel,
      interaction.channel
    );

    const station = interaction.options.getString('channel') as 'jpop' | 'kpop';

    let stationURL: RadioStations[RadioStationNames]['url'];

    switch (station) {
      case 'jpop':
        stationURL = 'https://listen.moe/stream';
        break;
      case 'kpop':
        stationURL = 'https://listen.moe/kpop/stream';
        break;
      default:
        stationURL = 'https://listen.moe/stream';
        break;
    }

    const voiceConnection = connectToVoiceChannel(voiceChannel);

    const audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    });

    const playingType = getPlayingType(interaction.guildId as string);

    if (playingType !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const oldAudioPlayer = getAudioPlayer(interaction.guildId as string)!;

      if (playingType === 'radio') {
        const currentAudioResource = (
          oldAudioPlayer.state as AudioPlayerPlayingState
        ).resource as AudioResource<
          Extract<MusicResourceMetadata, { type: 'radio' }>
        >;

        const currentStationURL = currentAudioResource.metadata.data.url;

        if (currentStationURL === stationURL) {
          interaction.reply('Already playing from that radio station!');
          return;
        }

        interaction.channel?.send('Switching radio stations...');
      } else {
        if (guildMusicData.queueSystemData.loop.type !== 'track') {
          guildMusicData.queueSystemData.modifyIndex(2);
        }

        interaction.channel?.send('Switching to radio...');
      }

      disposeAudioPlayer(interaction.guildId as string);
    }

    interaction.deferReply();

    audioPlayer.on('error', (error) => {
      this.container.logger.error(error);

      disposeAudioPlayer(interaction.guildId as string);
      voiceConnection.destroy();

      disconnectGuildFromRadioWebsocket(interaction.guildId as string);

      const localMusicData = getGuildMusicData(interaction.guildId as string);

      if (localMusicData === undefined) {
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(ColorPalette.Error)
        .setTitle('Playback Error')
        .setDescription(
          'An error occurred while playing from the radio.\nDisconnecting from the voice channel.'
        );

      guildMusicData.sendUpdateMessage({
        embeds: [embed]
      });
    });

    audioPlayer.on(AudioPlayerStatus.Idle, async () => {
      const radioStationResource = await this.createRadioStationResource(
        stationURL
      );

      if (radioStationResource === null) {
        disposeAudioPlayer(interaction.guildId as string);

        voiceConnection.destroy();

        const localMusicData = getGuildMusicData(interaction.guildId as string);

        if (localMusicData === undefined) {
          return;
        }

        const embed = new EmbedBuilder()
          .setColor(ColorPalette.Error)
          .setTitle('Playback Error')
          .setDescription(
            'An error occurred while getting the radio stream.\nDisconnecting from the voice channel.'
          );

        guildMusicData.sendUpdateMessage({
          embeds: [embed]
        });
        return;
      }

      audioPlayer.play(radioStationResource);
    });

    voiceConnection.subscribe(audioPlayer);

    const radioStationResource = await this.createRadioStationResource(
      stationURL
    );

    if (radioStationResource === null) {
      disposeAudioPlayer(interaction.guildId as string);

      voiceConnection.destroy();

      const embed = new EmbedBuilder()
        .setColor(ColorPalette.Error)
        .setTitle('Playback Error')
        .setDescription(
          'An error occurred while getting the radio stream.\nDisconnecting from the voice channel.'
        );

      guildMusicData.sendUpdateMessage({
        embeds: [embed]
      });
      return;
    }

    audioPlayer.play(radioStationResource);

    const radioData = guildMusicData.radioData;

    radioData.station = station;
    radioData.url = stationURL;

    this.container.radioWebsockets[station].guildIdSet.add(
      interaction.guildId as string
    );

    if (this.container.radioWebsockets[station].connection === null) {
      createRadioWebsocketConnection(station);
    } else {
      sendRadioUpdate(
        interaction.guildId as string,
        this.container.radioWebsockets[station]
          .lastUpdate as RadioWebsocketUpdateData
      );
    }

    const embed = new EmbedBuilder()
      .setColor(ColorPalette.Success)
      .setTitle('Connected')
      .setDescription(
        `Connected to the LISTEN.moe ${
          station === 'kpop' ? 'K-Pop' : 'J-Pop'
        } radio station.`
      );

    interaction.editReply({
      embeds: [embed]
    });
  }

  private async createRadioStationResource(stationURL: string) {
    const radioStream = (await fetch(stationURL)).body;

    if (radioStream === null) {
      return null;
    }

    return createAudioResource(radioStream as unknown as internal.Readable, {
      metadata: {
        type: 'radio',
        data: {
          title: 'LISTEN.moe Radio',
          url: stationURL
        }
      }
    });
  }
}
