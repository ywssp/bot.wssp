import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed, GuildMember } from 'discord.js';

import ytdl from 'ytdl-core';
import { validateID } from 'ytpl';
import ytsr from 'ytsr';

import { SimpleVideoInfo } from '../../../interfaces/SimpleVideoInfo';
import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';
import { createVideoObject } from '../../../functions/music-utilities/YouTube/createVideoObject';
import { formatVideoEmbed } from '../../../functions/music-utilities/YouTube/formatVideoEmbed';
import { play } from '../../../functions/music-utilities/YouTube/playInVoiceChannel';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getPlayingType } from '../../../functions/music-utilities/getPlayingType';

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

    guildMusicData.videoList.push(video);

    const baseEmbed = new MessageEmbed()
      .setColor(ColorPalette.success)
      .setTitle('Added video to queue');

    const embed = formatVideoEmbed(baseEmbed, video);

    if (video.thumbnail) {
      embed.setThumbnail(video.thumbnail);
    }

    interaction.reply({ embeds: [embed] });

    if (getPlayingType(interaction.guildId as string) === 'youtube') {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

    play(interaction.guildId as string, voiceChannel);
    return;
  }
}
