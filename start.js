'use strict';
require('dotenv').config();
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Server Ok!');
});
server.listen(3000);

const {
  AkairoClient,
  CommandHandler,
  ListenerHandler,
} = require('discord-akairo');
const { Structures } = require('discord.js');
const createEmbed = require('./Functions/EmbedCreator.js');

Structures.extend('Guild', (Guild) => {
  class MusicGuild extends Guild {
    constructor(client, data) {
      super(client, data);
      this.musicData = {
        isPlaying: false,
        loop: 'off',
        queue: [],
        songDispatcher: null,
        volume: 0.8,
      };
    }
  }
  return MusicGuild;
});

class Client extends AkairoClient {
  constructor() {
    super(
      {
        ownerID: process.env.OWNER.split(/ +/),
      },
      {
        disableEveryone: true,
        presence: {
          activity: {
            name: 'Loading...',
            type: 'WATCHING',
          },
        },
      }
    );

    this.commandHandler = new CommandHandler(this, {
      directory: './Commands/',
      defaultCooldown: 1000,
      prefix: process.env.PREFIX.split(/|/),
      argumentDefaults: {
        retries: 2,
        modifyStart: (embed) => embed.description += 'Type `cancel` to cancel the command',
        timeout: (message) =>
          createEmbed(message, 'error', {
            description: 'The prompt time ran out',
            authorBool: true,
          }),
        ended: (message) =>
          createEmbed(message, 'error', {
            description: 'Too many retries, the command was cancelled',
            authorBool: true,
          }),
        cancel: (message) =>
          createEmbed(message, 'error', {
            description: 'The command was cancelled',
            authorBool: true,
          }),
      },
    });

    this.listenerHandler = new ListenerHandler(this, {
      directory: './Listeners/',
    });

    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.listenerHandler.loadAll();
    this.commandHandler.loadAll();
  }
}

const client = new Client();
client.login(process.env.TOKEN);
