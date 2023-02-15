import { ChatInputCommand, Command } from '@sapphire/framework';
import {
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  MessageComponentInteraction,
  EmbedBuilder,
  ButtonStyle,
  ComponentType,
  hyperlink
} from 'discord.js';

import play, { YouTubeVideo } from 'play-dl';

import { getPlayingType } from '../../../functions/music-utilities/getPlayingType';

import { createGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';
import {
  getTrackFromCache,
  TrackCacheResult
} from '../../../functions/music-utilities/queue-system/getTrackFromCache';
import { createEmbedFromTrack } from '../../../functions/music-utilities/queue-system/createEmbedFromTrack';
import { startQueuePlayback } from '../../../functions/music-utilities/queue-system/startQueuePlayback';
import { QueuedTrackInfo } from '../../../interfaces/TrackInfo';

import { ColorPalette } from '../../../settings/ColorPalette';

export class SearchVideosCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'search',
      description: 'Searches for multiple videos on YouTube.',
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
            .setName('query')
            .setDescription('The search query.')
            .setRequired(true)
            .setMinLength(3)
        )
    );
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildYoutubeData = createGuildMusicData(
      interaction.guildId as string,
      interaction.channelId
    ).queueSystemData;

    const query = interaction.options.getString('query', true);

    if (query.length < 3) {
      interaction.reply({
        content: 'The query must be at least 3 characters long.',
        ephemeral: true
      });
      return;
    }

    interaction.deferReply();

    let searchResults: YouTubeVideo[];

    try {
      searchResults = await play.search(query, {
        limit: 5,
        source: {
          youtube: 'video'
        }
      });
    } catch (error) {
      interaction.editReply({
        content: '❌ | An error occurred while searching for videos.'
      });
      return;
    }

    const buttonRows = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        [1, 2, 3, 4, 5].map((number) =>
          new ButtonBuilder()
            .setCustomId(number.toString())
            .setLabel(number.toString())
            .setStyle(ButtonStyle.Secondary)
        )
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🛑')
      )
    ];

    const selectionEmbed = new EmbedBuilder()
      .setColor(ColorPalette.selection)
      .setTitle('Select a video')
      .addFields(
        searchResults.map((item, index) => {
          let formattedChannel = '';
          if (item.channel) {
            const channelName = item.channel.name ?? 'Unknown';
            if (item.channel.url) {
              formattedChannel = hyperlink(channelName, item.channel.url);
            } else {
              formattedChannel = channelName;
            }
          }

          return {
            name: `${index + 1}. ${item.title}`,
            value: `${hyperlink('Link', item.url)} ${
              formattedChannel ? `| ${formattedChannel}` : ''
            } | ${item.live ? 'Live Stream' : item.durationRaw}`
          };
        })
      );

    const selectionMessage = await interaction.channel?.send({
      embeds: [selectionEmbed],
      components: buttonRows
    });

    if (selectionMessage === undefined) {
      interaction.editReply('🚫 | Failed to send selection message.');
      return;
    }

    let collected;

    try {
      collected = await selectionMessage.awaitMessageComponent({
        filter: (i: MessageComponentInteraction) => {
          i.deferUpdate();
          return i.user.id === interaction.user.id;
        },
        time: 15000,
        componentType: ComponentType.Button
      });
    } catch (e) {
      interaction.editReply('🛑 | No track selected.');
      selectionMessage.delete();
      return;
    }

    selectionMessage.delete();

    if (collected.customId === 'cancel') {
      selectionMessage.delete();
      interaction.editReply({
        content: '🛑 | Selection cancelled.'
      });
      return;
    }

    const videoIndex = parseInt(collected.customId) - 1;

    let trackCacheResult: TrackCacheResult;

    try {
      trackCacheResult = await getTrackFromCache(
        searchResults[videoIndex].id ??
          play.extractID(searchResults[videoIndex].url)
      );
    } catch (error) {
      interaction.editReply({
        content: '❌ | An error occurred while fetching the track.'
      });
      return;
    }

    const track = trackCacheResult.data;
    const cacheStatus = trackCacheResult.cacheData;

    const queuedTrack = new QueuedTrackInfo(track, interaction.user);
    guildYoutubeData.trackList.push(queuedTrack);

    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.success)
      .setTitle('Added track to queue')
      .setFooter({
        text: `Cache ${
          cacheStatus.status
        }, cached on ${cacheStatus.cachedAt.toLocaleString()}`
      });

    const replyEmbed = createEmbedFromTrack(baseEmbed, queuedTrack);

    if (track.thumbnail) {
      replyEmbed.setThumbnail(track.thumbnail);
    }

    interaction.editReply({ embeds: [replyEmbed] });

    if (getPlayingType(interaction.guildId as string) !== 'queued_track') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

      startQueuePlayback(interaction.guildId as string, voiceChannel);
    }
  }
}
