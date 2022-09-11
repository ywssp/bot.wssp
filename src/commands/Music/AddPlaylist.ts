import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import type { GuildMember } from 'discord.js';
import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';
import { play } from '../../functions/music-utilities/playInVoiceChannel';
import { createVideoObject } from '../../functions/music-utilities/createVideoObject';
import { ColorPalette } from '../../settings/ColorPalette';

export class AddPlaylistCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'addplaylist',
      aliases: [],
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
            .setChoices(
              {
                name: 'Shuffle',
                value: 'shuffle'
              },
              {
                name: 'Reverse',
                value: 'reverse'
              }
            )
        )
    );
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildMusicData = getGuildMusicData({
      create: true,
      guildId: interaction.guildId as string,
      textChannelId: interaction.channelId
    });

    const link = interaction.options.getString('link');

    if (link === null) {
      interaction.reply({
        content: '❓ | No link or query provided.',
        ephemeral: true
      });
      return;
    }

    if (!ytpl.validateID(link)) {
      interaction.reply({
        content: '❓ | Invalid playlist link.',
        ephemeral: true
      });
      return;
    }

    interaction.reply('Processing playlist...');

    const playlist = await ytpl(link, {
      limit: Infinity
    });

    const processedVideos = await Promise.allSettled(
      playlist.items.map((video) => ytdl.getBasicInfo(video.url))
    );

    const videos = (
      processedVideos.filter(
        (result) => result.status === 'fulfilled'
      ) as PromiseFulfilledResult<ytdl.videoInfo>[]
    ).map((result) => createVideoObject(result.value, interaction.user));

    if (videos.length === 0) {
      interaction.editReply({
        content: '❌ | No videos were found in the playlist.'
      });
      return;
    }

    const isPlaying = guildMusicData.isPlaying();

    const loop = interaction.options.getBoolean('loop') ?? false;
    if (loop) {
      guildMusicData.loop = {
        type: 'queue',
        emoji: '🔁'
      };
    }

    const modifier = interaction.options.getString('modifier');

    switch (modifier) {
      case 'shuffle':
        videos.sort(() => Math.random() - 0.5);
        break;
      case 'reverse':
        videos.reverse();
        break;
      default:
        break;
    }

    const embed = new MessageEmbed()
      .setColor(ColorPalette.success)
      .setTitle('Playlist Added to queue')
      .addFields([
        {
          name: 'Playlist',
          value: `[${playlist.title}](${playlist.url})`
        },
        {
          name: 'Author',
          value: `[${playlist.author.name}](${playlist.author.url})`
        },
        {
          name: 'Length',
          value: `${videos.length}/${playlist.items.length} playable videos`
        }
      ]);

    if (playlist.bestThumbnail.url !== null) {
      embed.setThumbnail(playlist.bestThumbnail.url);
    }

    interaction.editReply({
      content: null,
      embeds: [embed]
    });

    guildMusicData.videoList.push(...videos);

    if (isPlaying && interaction.guild?.me?.voice.channel) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

    play(interaction.guildId as string, voiceChannel);
    return;
  }
}
