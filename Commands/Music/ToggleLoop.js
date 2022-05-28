'use strict';
const { Command } = require('discord-akairo');
const createEmbed = require('../../Functions/EmbedCreator.js');
const musicCheck = require('../../Functions/MusicCheck.js');

class LoopCommand extends Command {
  constructor() {
    super('loop', {
      aliases: ['loop', 'repeat'],
      category: 'Music',
      channel: 'guild'
    });
  }

  *args() {
    const loopType = yield {
      type: /^(track)|(queue)|(off)$/i,
      prompt: {
        start: (msg) =>
          createEmbed(msg, {
            preset: 'query',
            title: 'Loop',
            description: `Enter the type of loop that you want\n\`track\`, \`queue\`, \`off\`\nCurrent: ${msg.guild.musicData.loop.setting}`,
            authorBool: true
          })
      }
    };

    return { loopType };
  }

  exec(message, args) {
    if (musicCheck(message)) {
      return false;
    }

    message.guild.musicData.loop.setting = args.loopType.match[0].toLowerCase();

    if (message.guild.musicData.loop.setting === 'off') {
      message.guild.musicData.loop.setting = '➡️';
      message.react('➡️');
    } else if (message.guild.musicData.loop.setting === 'track') {
      message.guild.musicData.loop = '🔂';
      message.react('🔂');
    } else if (message.guild.musicData.loop.setting === 'queue') {
      message.guild.musicData.loop = '🔁';
      message.react('🔁');
    }

    return true;
  }
}

module.exports = LoopCommand;
