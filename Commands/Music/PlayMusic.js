'use strict';
const { Command } = require('discord-akairo');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');
const createEmbed = require('../../Functions/EmbedCreator.js');
const musicCheck = require('../../Functions/MusicCheck.js');
const { createSongObj } = require('../../Functions/MusicFunctions.js');
const playSong = require('../../Functions/PlaySong.js');

class PlayCommand extends Command {
  constructor() {
    super('play', {
      aliases: ['play', 'add', 'search'],
      category: 'Music',
      channel: 'guild'
    });
  }

  async *args(message) {
    const search = yield {
      match: 'content',
      prompt: {
        start: (msg) =>
          createEmbed(msg, {
            preset: 'query',
            title: 'Search',
            description:
              'Enter a search term or a YouTube link. Use the `--current` or `-c` flag to add the current song'
          })
      }
    };

    // If the '--current' flag is present, get the video id of the song currently playing
    if (/^(-c)|(--current)$/.test(search)) {
      if (typeof message.guild.musicData.nowPlaying === 'undefined') {
        createEmbed(message, {
          preset: 'error',
          description: 'No song is playing right now!',
          send: 'channel'
        });
        return { error: true };
      }
      return { video: message.guild.musicData.nowPlaying.id };
      // If the term is a playlist link, get all video ids of the playlist
    } else if (ytpl.validateID(search)) {
      const playlist = await ytpl(search).catch(() => {
        createEmbed(message, {
          preset: 'error',
          description: 'The playlist cannot be found!',
          send: 'channel'
        });
        return { error: true };
      });

      return { playlist };
      // If the term is a video link, get the video id
    } else if (ytdl.validateURL(search)) {
      let videoID;

      try {
        videoID = ytdl.getURLVideoID(search);
      } catch (e) {
        createEmbed(message, {
          preset: 'error',
          description: 'An error occured while parsing the Video ID.',
          send: 'channel'
        });
        return { error: true };
      }

      return { video: videoID };
    }

    const videosFetched = await ytsr(search, {
      limit: 10
    });

    if (!videosFetched.items.some((item) => item.type === 'video')) {
      if (!videosFetched.items.some((item) => item.type === 'playlist')) {
        createEmbed(message, {
          preset: 'error',
          description: 'No videos/playlists were found while searching.',
          send: 'channel'
        });
        return { error: true };
      }

      const playlist = await ytpl(
        videosFetched.items.find((item) => item.type === 'playlist').id
      ).catch(() => {
        createEmbed(message, {
          preset: 'error',
          description: 'An error occurred while parsing the playlist.',
          send: 'channel'
        });
        return { error: true };
      });

      return { playlist };
    }

    return {
      video: videosFetched.items.find((item) => item.type === 'video').id
    };
  }

  async exec(message, args) {
    // Exit immediately if an error occurred during the search
    if (args.error) {
      return false;
    }

    const voiceChannel = message.member.voice.channel;

    if (
      musicCheck(message, {
        sameVC: false,
        playing: false
      })
    ) {
      return false;
    }

    if (args.video !== undefined) {
      let video;
      try {
        video = await ytdl.getBasicInfo(args.video);
        video = video.videoDetails;
      } catch (e) {
        console.error(e);
        return createEmbed(message, {
          preset: 'error',
          descShort: 'getting the video info.',
          authorBool: true,
          send: 'channel'
        });
      }

      const songObj = createSongObj(video, voiceChannel, message);

      message.guild.musicData.queue.push(songObj);

      if (!message.guild.musicData.isPlaying) {
        message.guild.musicData.isPlaying = true;
        playSong(message);
      } else {
        createEmbed(message, {
          preset: 'success',
          title: 'New song added to queue',
          fields: [
            {
              name: 'Title',
              value: songObj.title
            },
            {
              name: 'Channel',
              value: songObj.channelName
            },
            {
              name: 'Length',
              value: songObj.durationString
            },
            {
              name: 'URL',
              value: songObj.url
            },
            {
              name: 'Requester',
              value: songObj.requester
            }
          ],
          thumbnail: songObj.thumbnail,
          authorBool: true,
          send: 'channel'
        });
      }
    } else {
      const playlistData = args.playlist;
      const processingStatus = await message.channel.send(
        'Processing playlist...'
      );
      let videoCount = 0;
      for (const vid of args.playlist.items) {
        if (vid.isPlayable) {
          const video = await ytdl.getBasicInfo(vid.id);
          message.guild.musicData.queue.push(
            createSongObj(video.videoDetails, voiceChannel, message)
          );
          videoCount++;
        }
      }
      await processingStatus.delete();
      if (!message.guild.musicData.isPlaying) {
        message.guild.musicData.isPlaying = true;
        playSong(message);
      } else {
        createEmbed(message, {
          preset: 'success',
          title: 'New playlist added to queue',
          fields: [
            {
              name: 'Title',
              value: playlistData.title
            },
            {
              name: 'Channel',
              value: playlistData.author.name
            },
            {
              name: 'No. of videos',
              value: videoCount
            },
            {
              name: 'URL',
              value: playlistData.url
            }
          ],
          thumbnail: playlistData.bestThumbnail.url,
          authorBool: true,
          send: 'channel'
        });
      }
    }

    return 0;
  }
}

module.exports = PlayCommand;
