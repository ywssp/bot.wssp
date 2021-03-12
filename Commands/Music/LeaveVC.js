'use strict';
const { Command } = require('discord-akairo');
const musicCheck = require('../../Functions/MusicCheck.js');

class LeaveCommand extends Command {
  constructor() {
    super('leave', {
      aliases: ['leave', 'disconnect', 'dc'],
      category: 'Music',
      channel: 'guild',
    });
  }

  exec(message) {
    if (musicCheck(message)) { return false; }

    message.guild.musicData.queue.length = 0;
    message.guild.musicData.loop = 'off';
    message.guild.musicData.songDispatcher.end();

    return message.react('🛑');
  }
}

module.exports = LeaveCommand;
