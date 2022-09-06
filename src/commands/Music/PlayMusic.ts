import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import ytdl from 'ytdl-core';
import ytsr from 'ytsr';
import { SimpleVideoInfo } from '../../interfaces/SimpleVideoInfo';
import type { GuildMember } from 'discord.js';
import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';
import { play } from '../../functions/music-utilities/playInVoiceChannel';
import { createVideoObject } from '../../functions/music-utilities/createVideoObject';

export class PlayMusicCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'play',
      aliases: [],
      description: 'Plays a video from YouTube.',
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
            .setName('link-or-query')
            .setDescription('The link of the YouTube video, or a search query.')
            .setRequired(true)
        )
    );
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildMusicData = getGuildMusicData({
      create: true,
      guildId: interaction.guildId as string,
      textChannelId: interaction.channelId
    });

    const linkOrQuery = interaction.options.getString('link-or-query');

    if (linkOrQuery === null) {
      interaction.reply('No link or query provided.');
      return;
    }

    let video: SimpleVideoInfo;

    if (ytdl.validateURL(linkOrQuery)) {
      video = createVideoObject(
        await ytdl.getInfo(linkOrQuery),
        interaction.user
      );
    } else {
      const searchResults = await ytsr(linkOrQuery, { limit: 10 });

      if (!searchResults.items.some((item) => item.type === 'video')) {
        interaction.reply({
          content: '❓ | No videos found.',
          ephemeral: true
        });

        return;
      }

      const foundVideo = searchResults.items.find(
        (item) => item.type === 'video'
      ) as ytsr.Video;

      video = createVideoObject(
        await ytdl.getInfo(foundVideo.url),
        interaction.user
      );
    }

    const isPlaying = guildMusicData.isPlaying();

    guildMusicData.videoList.push(video);

    const replyEmbed = new MessageEmbed()
      .setColor('#a3be8c')
      .setTitle('Added video to queue')
      .setDescription(`[${video.title}](${video.url})`)
      .addFields([
        {
          name: 'Channel',
          value: `[${video.channel.name}](${video.channel.url})`
        },
        {
          name: 'Length',
          value:
            typeof video.duration === 'string'
              ? video.duration
              : video.duration.toFormat('m:ss')
        }
      ]);

    if (video.thumbnail) {
      replyEmbed.setThumbnail(video.thumbnail);
    }

    interaction.reply({ embeds: [replyEmbed] });

    if (isPlaying && interaction.guild?.me?.voice.channel) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

    play(interaction.guildId as string, voiceChannel);
    return;
  }
}
