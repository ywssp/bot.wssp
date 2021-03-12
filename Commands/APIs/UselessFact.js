'use strict';
const { Command } = require('discord-akairo');
const fetch = require('node-fetch');
const createEmbed = require('../../Functions/EmbedCreator.js');

class FactCommand extends Command {
  constructor() {
    super('fact', {
      aliases: ['fact'],
      category: 'APIs',
    });
  }

  async exec(message) {
    const fact = await fetch(
      'https://uselessfacts.jsph.pl/random.json?language=en'
    ).then((resp) => resp.json());

    createEmbed(message, 'default', {
      title: fact.text,
      description: `Source: [${fact.source}](${fact.source_url})\nLink: [uselessfacts.jsph.pl](${fact.permalink})`,
      authorBool: true,
      send: 'channel',
    });
  }
}

module.exports = FactCommand;
