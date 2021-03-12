'use strict';
const { Command } = require('discord-akairo');
const fetch = require('node-fetch');
const createEmbed = require('../../Functions/EmbedCreator.js');

class CatCommand extends Command {
  constructor() {
    super('cat', {
      aliases: ['cat'],
      category: 'APIs',
    });
  }

  async exec(message) {
    const cat = await fetch('https://aws.random.cat/meow')
      .then((resp) => resp.json())
      .then((resp) => resp.file)
      .catch((err) => console.log(err));

    return createEmbed(message, 'default', {
      title: 'A random cat to cheer you up!',
      image: cat,
      footer: 'This command uses https://awl.random.cat/meow',
      authorBool: true,
      send: 'channel',
    });
  }
}

module.exports = CatCommand;
