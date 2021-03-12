'use strict';
const { Command } = require('discord-akairo');
const createEmbed = require('../../Functions/EmbedCreator.js');

class TestCommand extends Command {
  constructor() {
    super('test', {
      aliases: ['test', 'ping', 'pong', 'foo'],
      category: 'Testing',
    });
  }

  async exec(message) {
    const phrases = [
      'Bot works. Continue using commands',
      'Present',
      'Status: Online',
      'Mic Test'
    ];
    const sent = await message.channel.send('Loading...');
    const timeDiff =
      (sent.editedAt || sent.createdAt) -
      (message.editedAt || message.createdAt);
    sent.delete();
    const num = Math.floor(Math.random() * phrases.length);
    return createEmbed(message, 'default', {
      authorBool: true,
      description: `${phrases[num]}\n\n\n🔂 Round-trip time: ${timeDiff} ms\n💓 Heartbeat: ${this.client.ws.ping} ms`,
      send: 'channel',
    });
  }
}

module.exports = TestCommand;
