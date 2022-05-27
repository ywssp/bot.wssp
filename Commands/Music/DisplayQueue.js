'use strict';
const { Command } = require('discord-akairo');
const _ = require('lodash');
const createEmbed = require('../../Functions/EmbedCreator.js');
const musicCheck = require('../../Functions/MusicCheck.js');

class QueueCommand extends Command {
  constructor() {
    super('queue', {
      aliases: ['queue'],
      category: 'Music',
      channel: 'guild'
    });
  }

  exec(message) {
    if (
      musicCheck(message, {
        vc: false,
        sameVC: false,
        queue: true
      })
    ) {
      return false;
    }

    const songDataset = message.guild.musicData.queue.map((song, index) => ({
      name: `${index + 1}. ${song.title}`,
      value: `Channel: ${song.channelName}\nLength: ${song.durationString}\nRequested by: ${song.requester}`
    }));
    const splitDatabase = _.chunk(songDataset, 10);
    const { musicData } = message.guild;

    return splitDatabase.forEach((data) =>
      createEmbed(message, {
        preset: 'default',
        title: 'Queue',
        fields: data,
        footer: `${musicData.songDispatcher.paused ? '⏸️' : '▶️'} | ${
          musicData.loop.emoji
        } | 🔊 ${message.guild.musicData.volume * 50}`,
        send: 'channel'
      })
    );
  }
}

module.exports = QueueCommand;
