'use strict';
const { Command } = require('discord-akairo');
const createEmbed = require('../../Functions/EmbedCreator.js');

class TestCommand extends Command {
  constructor() {
    super('test', {
      aliases: ['test', 'ping', 'pong', 'foo'],
      category: 'Testing'
    });
  }

  async exec(message) {
    const sent = await message.channel.send('Loading...');
    const timeDiff =
      (sent.editedAt || sent.createdAt) -
      (message.editedAt || message.createdAt);
    sent.delete();

    return createEmbed(message, {
      preset: 'default',
      authorBool: true,
      description: `Started at ${message.client.readyAt.toString()}\n\n🔂 Round-trip time: ${timeDiff} ms\n💓 Heartbeat: ${
        this.client.ws.ping
      } ms`,
      send: 'channel'
    });
  }
}

module.exports = TestCommand;
