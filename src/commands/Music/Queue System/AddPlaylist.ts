import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder, GuildMember, hyperlink } from 'discord.js';

import play, {
  SoundCloudPlaylist,
  SoundCloudTrack,
  YouTubePlayList
} from 'play-dl';

import { createGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';
import { QueuedTrackInfo } from '../../../interfaces/Music/Queue System/TrackInfo';
import { startQueuePlayback } from '../../../functions/music-utilities/queue-system/startQueuePlayback';

import { ColorPalette } from '../../../settings/ColorPalette';
import { Duration } from 'luxon';
import {
  SoundCloudTrackNaming,
  YouTubeVideoNaming
} from '../../../settings/TrackNaming';

export class AddPlaylistCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'addplaylist',
      description:
        'Adds the contents of a YouTube or SoundCloud playlist to the queue.',
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
            .setName('link')
            .setDescription('The link of a YouTube or SoundCloud playlist.')
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName('loop')
            .setDescription('Whether to loop the playlist.')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('modifier')
            .setDescription('The modifier to use when adding the playlist.')
            .setRequired(false)
            .setChoices({
              name: 'Reverse',
              value: 'reverse'
            })
        )
    );
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    if (interaction.channel === null) {
      interaction.reply({
        content: '❓ | Cannot find channel.',
        ephemeral: true
      });
      return;
    }

    const voiceChannel = (interaction.member as GuildMember).voice.channel;

    if (voiceChannel === null) {
      interaction.reply({
        content: '❓ | Cannot find voice channel.',
        ephemeral: true
      });
      return;
    }

    const guildQueueData = createGuildMusicData(
      interaction.guildId as string,
      voiceChannel,
      interaction.channel
    ).queueSystemData;

    const link = interaction.options.getString('link') as string;

    const linkType = await play.validate(link);

    if (linkType !== 'yt_playlist' && linkType !== 'so_playlist') {
      interaction.reply({
        content: '❓ | Invalid playlist link.',
        ephemeral: true
      });
      return;
    }

    const source = linkType === 'yt_playlist' ? 'YouTube' : 'SoundCloud';
    const namings =
      source === 'YouTube' ? YouTubeVideoNaming : SoundCloudTrackNaming;

    interaction.reply(`Processing ${namings.source} Playlist...`);

    let playlistMetadata: {
      title: string;
      url: string | undefined;
      channel: {
        name: string;
        url: string | undefined;
      };
      thumbnail: string | undefined;
      playlistLength: number | undefined;
    };

    let tracks: QueuedTrackInfo[];
    let playlistDuration: Duration | 'Unknown / Live' = Duration.fromMillis(0);

    if (source === 'YouTube') {
      let playlist: YouTubePlayList;
      try {
        playlist = await play.playlist_info(link, {
          incomplete: true
        });
      } catch (error) {
        interaction.editReply({
          content: `❌ | An error occurred while getting the ${source} playlist info.`
        });
        console.error(error);
        return;
      }

      const foundTracks = await (
        await playlist.all_videos()
      ).filter((video) => !video.private);

      tracks = foundTracks.map((video) => {
        const track = new QueuedTrackInfo(video, interaction.user);

        if (playlistDuration !== 'Unknown / Live') {
          if (track.duration === 'Live Stream') {
            playlistDuration = 'Unknown / Live';
          } else {
            playlistDuration = playlistDuration.plus(track.duration);
          }
        }

        return track;
      });

      playlistMetadata = {
        title: playlist.title ?? 'Unknown',
        url: playlist.url,
        channel: {
          name: playlist.channel?.name ?? 'Unknown',
          url: playlist.channel?.url
        },
        thumbnail: playlist.thumbnail?.url,
        playlistLength: playlist.videoCount
      };
    } else {
      let playlist: SoundCloudPlaylist;

      try {
        playlist = (await play.soundcloud(link)) as SoundCloudPlaylist;
      } catch (error) {
        interaction.editReply({
          content: `❌ | An error occurred while getting the ${source} playlist info.`
        });
        console.error(error);
        return;
      }

      let foundTracks: SoundCloudTrack[];

      try {
        foundTracks = await playlist.all_tracks();
      } catch (error) {
        interaction.editReply({
          content: `❌ | An error occurred while getting the ${namings.trackIdentifier}s of the playlist.`
        });
        console.error(error);
        return;
      }

      tracks = foundTracks.map(
        (track) => new QueuedTrackInfo(track, interaction.user)
      );

      playlistDuration = Duration.fromMillis(playlist.durationInMs);

      playlistMetadata = {
        title: playlist.name,
        url: undefined,
        channel: {
          name: playlist.user.name,
          url: playlist.user.url
        },
        thumbnail: undefined,
        playlistLength: playlist.total_tracks
      };
    }

    if (tracks.length === 0) {
      interaction.editReply({
        content: `❌ | No ${namings.trackIdentifier}s were found in the playlist.`
      });
      return;
    }

    if (interaction.options.getBoolean('loop')) {
      guildQueueData.setLoopType('queue');
    }

    switch (interaction.options.getString('modifier') as 'reverse' | null) {
      case 'reverse':
        tracks.reverse();
        break;
      default:
        break;
    }

    const embed = new EmbedBuilder()
      .setColor(ColorPalette.Success)
      .setTitle(`${source} Playlist Added to Queue`)
      .addFields([
        {
          name: 'Playlist Name',
          value: playlistMetadata.url
            ? hyperlink(playlistMetadata.title, playlistMetadata.url)
            : playlistMetadata.title
        },
        {
          name: 'Author',
          value: playlistMetadata.channel.url
            ? hyperlink(
                playlistMetadata.channel.name,
                playlistMetadata.channel.url
              )
            : playlistMetadata.channel.name
        },
        {
          name: 'Length',
          value: `${
            playlistMetadata.playlistLength !== undefined &&
            tracks.length === playlistMetadata.playlistLength
              ? ''
              : `${tracks.length}/${playlistMetadata.playlistLength} playable ${namings.trackIdentifier}s | `
          }Duration: ${playlistDuration.normalize().toFormat('hh:mm:ss')}`
        }
      ]);

    if (playlistMetadata.thumbnail !== undefined) {
      embed.setThumbnail(playlistMetadata.thumbnail);
    }

    interaction.editReply({
      content: null,
      embeds: [embed]
    });

    guildQueueData.trackList.push(...tracks);

    startQueuePlayback(interaction.guildId as string);
  }
}
