'use strict';
const { Command } = require('discord-akairo');
const musicCheck = require('../../Functions/MusicCheck.js');

class HideCommand extends Command {
  constructor() {
    super('hidenext', {
      aliases: ['hidenext', 'shownext'],
      category: 'Music',
      channel: 'guild'
    });
  }

  exec(message) {
    if (musicCheck(message)) {
      return false;
    }

    if (message.guild.musicData.hideNextSongs) {
      message.guild.musicData.hideNextSongs = false;
      return message.react('🔔');
    }

    message.guild.musicData.hideNextSongs = true;
    return message.react('🔕');
  }
}

module.exports = HideCommand;
