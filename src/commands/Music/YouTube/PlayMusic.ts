import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed, GuildMember } from 'discord.js';

import ytdl from 'ytdl-core';
import { validateID } from 'ytpl';
import ytsr from 'ytsr';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';
import { SimpleYTVideoInfo } from '../../../interfaces/SimpleYTVideoInfo';
import { formatVideoEmbed } from '../../../functions/music-utilities/YouTube/formatVideoEmbed';
import { playVideo } from '../../../functions/music-utilities/YouTube/playVideo';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getPlayingType } from '../../../functions/music-utilities/getPlayingType';

export class PlayMusicCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'play',
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
      guildId: interaction.guildId as string,
      create: true,
      interaction
    }).youtubeData;

    const linkOrQuery = interaction.options.getString('link-or-query');

    if (linkOrQuery === null) {
      interaction.reply('No link or query provided.');
      return;
    }

    if (validateID(linkOrQuery)) {
      interaction.reply({
        content: 'Playlist detected. Use the `addplaylist` command instead.',
        ephemeral: true
      });
      return;
    }

    interaction.deferReply();

    let video: SimpleYTVideoInfo;

    if (ytdl.validateURL(linkOrQuery)) {
      video = new SimpleYTVideoInfo(
        await ytdl.getInfo(linkOrQuery),
        interaction.user
      );
    } else {
      const searchResults = await ytsr(linkOrQuery, { limit: 10 });

      if (!searchResults.items.some((item) => item.type === 'video')) {
        interaction.editReply({
          content: '❓ | No videos found.'
        });

        return;
      }

      const foundVideo = searchResults.items.find(
        (item) => item.type === 'video'
      ) as ytsr.Video;

      video = new SimpleYTVideoInfo(
        await ytdl.getInfo(foundVideo.url),
        interaction.user
      );
    }

    guildMusicData.videoList.push(video);

    const baseEmbed = new MessageEmbed()
      .setColor(ColorPalette.success)
      .setTitle('Added video to queue');

    const embed = formatVideoEmbed(baseEmbed, video);

    interaction.editReply({ content: null, embeds: [embed] });

    if (getPlayingType(interaction.guildId as string) === 'youtube') {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

    playVideo(interaction.guildId as string, voiceChannel);
    return;
  }
}
