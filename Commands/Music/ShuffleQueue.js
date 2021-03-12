'use strict';
const { Command } = require('discord-akairo');
const musicCheck = require('../../Functions/MusicCheck.js');

class ShuffleCommand extends Command {
  constructor() {
    super('shuffle', {
      aliases: ['shuffle'],
      category: 'Music',
      channel: 'guild',
    });
  }

  exec(message) {
    if (
      musicCheck(message, {
        queue: true,
      })
    ) { return false; }

    const shuffle = ([...arr]) => {
      let m = arr.length;
      while (m) {
        const i = Math.floor(Math.random() * m--);
        [arr[m], arr[i]] = [arr[i], arr[m]];
      }
      return arr;
    };
    message.guild.musicData.queue = shuffle(message.guild.musicData.queue);

    return message.react('🔀');
  }
}

module.exports = ShuffleCommand;
