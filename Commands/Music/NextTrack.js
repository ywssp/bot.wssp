'use strict';
const { Command } = require('discord-akairo');
const musicCheck = require('../../Functions/MusicCheck.js');

class NextCommand extends Command {
  constructor() {
    super('next', {
      aliases: ['next', 'skip'],
      category: 'Music',
      channel: 'guild',
    });
  }

  *args() {
    const songNumber = yield {
      type: 'number',
      default: 1,
    };

    return { songNumber };
  }

  exec(message, args) {
    if (
      musicCheck(message, {
        queue: args.songNumber > 1,
        songNumber: args.songNumber,
      })
    ) { return false; }

    message.guild.musicData.queue.splice(0, args.songNumber - 1);
    message.guild.musicData.songDispatcher.resume();
    message.guild.musicData.songDispatcher.end();

    return message.react('⏭');
  }
}

module.exports = NextCommand;
