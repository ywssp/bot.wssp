'use strict';
const { Command, Argument } = require('discord-akairo');
const createEmbed = require('../../Functions/EmbedCreator.js');
const musicCheck = require('../../Functions/MusicCheck.js');

class VolumeCommand extends Command {
  constructor() {
    super('volume', {
      aliases: ['volume', 'vol'],
      category: 'Music',
      channel: 'guild',
    });
  }

  *args() {
    const volume = yield {
      type: Argument.range('integer', 0, 100, true),
      prompt: {
        start: (message) =>
          createEmbed(message, 'query', {
            title: 'Volume',
            description: `Enter volume to set from 0-100\nCurrent volume: ${
              message.guild.musicData.volume * 50
            }`,
            authorBool: true,
          }),
        retry: (message) =>
          createEmbed(message, 'error', {
            description: 'The number you entered is not within range!',
            authorBool: true,
          }),
      },
    };

    return { volume };
  }

  exec(message, args) {
    if (musicCheck(message)) {
      return false;
    }

    const volume = args.volume / 50;
    let volumeIndex = Math.ceil((volume * 5) - 1);
    volumeIndex = volumeIndex < 0 ? 0 : volumeIndex;
    const volumeArray = ['│', '│', '│', '│', '│', '│', '│', '│', '│', '│'];
    volumeArray[volumeIndex] = `┿ ${args.volume}`;

    message.guild.musicData.volume = volume;
    message.guild.musicData.songDispatcher.setVolume(volume);
    const { musicData } = message.guild;
    return createEmbed(message, 'success', {
      title: 'Done!',
      description: 'Changed the volume!',
      fields: [
        {
          name: 'Volume',
          value: volumeArray.reverse().join('\n'),
        },
      ],
      authorBool: true,
      footer: `Paused: ${
        musicData.songDispatcher.paused ? '✅' : '❌'
      } |  Looped: ${musicData.loop ? musicData.loop : '❌'} | Volume: ${
        musicData.volume * 50
      }`,
      send: 'channel',
    });
  }
}

module.exports = VolumeCommand;
