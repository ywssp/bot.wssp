'use strict';
const { Command } = require('discord-akairo');
const createEmbed = require('../../Functions/EmbedCreator.js');
const musicCheck = require('../../Functions/MusicCheck.js');

class RemoveCommand extends Command {
  constructor() {
    super('remove', {
      aliases: ['remove'],
      category: 'Music',
      channel: 'guild',
    });
  }

  *args() {
    const songNumber = yield {
      type: 'integer',
      prompt: {
        start: (message) =>
          createEmbed(message, 'query', {
            title: 'Remove track',
            description: 'Enter the number of the song you want to remove',
            authorBool: true,
          }),
      },
    };
    return { songNumber };
  }

  exec(message, args) {
    if (
      musicCheck(message, {
        queue: true,
        songNumber: args.songNumber,
      })
    ) { return false; }

    const removedSong = message.guild.musicData.queue.splice(
      args.songNumber - 1,
      1
    )[0];
    return createEmbed(message, 'error', {
      title: 'Removed song:',
      descFalse: true,
      fields: [
        {
          name: 'Title',
          value: removedSong.title,
        },
        {
          name: 'Length',
          value: removedSong.duration,
        },
        {
          name: 'URL',
          value: removedSong.url,
        },
        {
          name: 'Requester',
          value: removedSong.requester,
        },
      ],
      thumbnail: removedSong.thumbnail,
      authorBool: true,
      send: 'channel',
    });
  }
}

module.exports = RemoveCommand;
