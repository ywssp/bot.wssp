import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder, GuildMember, hyperlink } from 'discord.js';

import play, { YouTubePlayList } from 'play-dl';

import { createGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';
import { QueuedTrack } from '../../../interfaces/YTVideoInfo';
import { startQueuePlayback } from '../../../functions/music-utilities/YouTube/startQueuePlayback';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getPlayingType } from '../../../functions/music-utilities/getPlayingType';

export class AddPlaylistCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'addplaylist',
      description: 'Adds the contents of a YouTube playlist to the queue.',
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
            .setDescription('The link of the YouTube playlist.')
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
    const guildYoutubeData = createGuildMusicData(
      interaction.guildId as string,
      interaction.channelId
    ).youtubeData;

    const link = interaction.options.getString('link') as string;

    console.log(`Checking if ${link} is a playlist...`);

    if ((await play.validate(link)) !== 'yt_playlist') {
      interaction.reply({
        content: '❓ | Invalid playlist link.',
        ephemeral: true
      });
      return;
    }

    interaction.reply('Processing playlist...');

    console.log(`Getting playlist info for ${link}...`);

    let playlist: YouTubePlayList;

    try {
      playlist = await play.playlist_info(link, {
        incomplete: true
      });
    } catch (error) {
      interaction.editReply({
        content: '❌ | An error occurred while getting the playlist info.'
      });
      console.error(error);
      return;
    }

    const foundVideos = await (
      await playlist.all_videos()
    ).filter((video) => !video.private);

    if (foundVideos.length === 0) {
      interaction.editReply({
        content: '❌ | No videos were found in the playlist.'
      });
      return;
    }

    const videos = foundVideos.map(
      (video) => new QueuedTrack(video, interaction.user)
    );

    if (interaction.options.getBoolean('loop')) {
      guildYoutubeData.setLoopType('queue');
    }

    switch (interaction.options.getString('modifier') as 'reverse' | null) {
      case 'reverse':
        videos.reverse();
        break;
      default:
        break;
    }

    const relevantData = {
      title: playlist.title ?? 'Unknown',
      url: playlist.url,
      channel: {
        name: playlist.channel?.name ?? 'Unknown',
        url: playlist.channel?.url
      },
      playlistLength: playlist.videoCount ?? 'Unknown'
    };

    const embed = new EmbedBuilder()
      .setColor(ColorPalette.success)
      .setTitle('Playlist Added to queue')
      .addFields([
        {
          name: 'Playlist',
          value: relevantData.url
            ? hyperlink(relevantData.title, relevantData.url)
            : relevantData.title
        },
        {
          name: 'Author',
          value: relevantData.channel.url
            ? hyperlink(relevantData.channel.name, relevantData.channel.url)
            : relevantData.channel.name
        },
        {
          name: 'Length',
          value: `${videos.length}/${relevantData.playlistLength} playable videos`
        }
      ]);

    if (playlist.thumbnail !== undefined) {
      embed.setThumbnail(playlist.thumbnail.url);
    }

    interaction.editReply({
      content: null,
      embeds: [embed]
    });

    guildYoutubeData.videoList.push(...videos);

    if (getPlayingType(interaction.guildId as string) !== 'youtube') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

      startQueuePlayback(interaction.guildId as string, voiceChannel);
    }
  }
}
