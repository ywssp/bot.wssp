'use strict';
const { Command } = require('discord-akairo');
const createEmbed = require('../../Functions/EmbedCreator.js');

class AvatarCommand extends Command {
  constructor() {
    super('avatar', {
      aliases: ['avatar'],
      category: 'Other',
    });
  }

  *args(message) {
    const user = yield {
      type: 'user',
      default: message.member,
    };
    return { user };
  }

  exec(message, args) {
    return createEmbed(message, {
      preset: 'default',
      authorBool: true,
      description: `Here's ${args.user.username}'s avatar`,
      image: args.user.displayAvatarURL(),
      send: 'channel',
    });
  }
}

module.exports = AvatarCommand;
