'use strict';
const { Command } = require('discord-akairo');
const musicCheck = require('../../Functions/MusicCheck.js');

class ClearCommand extends Command {
  constructor() {
    super('clear', {
      aliases: ['clear'],
      category: 'Music',
      channel: 'guild',
    });
  }

  exec(message) {
    if (musicCheck(message)) { return false; }

    message.guild.musicData.queue.length = 0;

    return message.react('🧹');
  }
}

module.exports = ClearCommand;
