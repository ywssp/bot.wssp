'use strict';
const { Command } = require('discord-akairo');
const createEmbed = require('../../Functions/EmbedCreator.js');

class ServerInfoCommand extends Command {
  constructor() {
    super('serverinfo', {
      aliases: ['serverinfo'],
      category: 'Other',
    });
  }

  exec(message) {
    const guild = message.guild;
    return createEmbed(message, {
      preset: 'default',
      authorBool: true,
      thumbnail: message.guild.iconURL(),
      fields: [
        { name: 'Name', value: guild.name, inline: true },
        { name: 'Owner', value: guild.owner.user.tag, inline: true },
        { name: 'Date Created', value: guild.createdAt.toUTCString(), inline: true },
        { name: 'No. Of Members', value: guild.memberCount, inline: true },
        { name: 'Region', value: guild.region, inline: true },
        { name: 'Server Boosts', value: `Tier ${guild.premiumTier}(${guild.premiumSubscriptionCount} Boosts)`, inline: true },
      ],
      send: 'channel',
    });
  }
}

module.exports = ServerInfoCommand;
