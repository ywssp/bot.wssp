'use strict';
const { Command } = require('discord-akairo');
const createEmbed = require('../../Functions/EmbedCreator.js');
const musicCheck = require('../../Functions/MusicCheck.js');

class LoopCommand extends Command {
  constructor() {
    super('loop', {
      aliases: ['loop', 'repeat'],
      category: 'Music',
      channel: 'guild',
    });
  }

  *args() {
    const loopType = yield {
      type: /^(track)|(queue)|(off)$/,
      prompt: {
        start: (msg) =>
          createEmbed(msg, 'query', {
            title: 'Loop',
            description: `Enter the type of loop that you want\n\`track\`, \`queue\`, \`off\`\nCurrent: ${msg.guild.musicData.loop}`,
            authorBool: true,
          }),
      },
    };

    return { loopType };
  }

  exec(message, args) {
    if (musicCheck(message)) { return false; }

    message.guild.musicData.loop = args.loopType.match[0];

    return message.react('🔂');
  }
}

module.exports = LoopCommand;
