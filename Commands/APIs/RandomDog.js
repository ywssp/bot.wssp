'use strict';
const { Command } = require('discord-akairo');
const fetch = require('node-fetch');
const createEmbed = require('../../Functions/EmbedCreator.js');

class DogCommand extends Command {
  constructor() {
    super('dog', {
      aliases: ['dog'],
      category: 'APIs',
    });
  }

  async exec(message) {
    const dog = await fetch('https://dog.ceo/api/breeds/image/random')
      .then((resp) => resp.json())
      .then((resp) => resp.message)
      .catch((err) => console.log(err));

    createEmbed(message, 'default', {
      title: 'A random dog to cheer you up!',
      image: dog,
      footer: 'This command uses https://dog.ceo/api/breeds/image/random',
      authorBool: true,
      send: 'channel',
    });
  }
}

module.exports = DogCommand;
