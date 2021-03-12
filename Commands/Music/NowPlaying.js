'use strict';
const { Command } = require('discord-akairo');
const createEmbed = require('../../Functions/EmbedCreator.js');
const musicCheck = require('../../Functions/MusicCheck.js');
const visualiseDuration = require('../../Functions/GenerateDurationVisualisation');

class NowPlayingCommand extends Command {
  constructor() {
    super('np', {
      aliases: ['np', 'playing', 'nowplaying'],
      category: 'Music',
      channel: 'guild',
    });
  }

  exec(message) {
    if (
      musicCheck(message, {
        vc: false,
        sameVC: false,
      })
    ) { return false; }

    const playing = message.guild.musicData.nowPlaying;
    const { musicData } = message.guild;
    const duration =
      playing.duration !== '🔴 Live Stream'
        ? visualiseDuration(message, playing)
        : playing.duration;

    return createEmbed(message, 'default', {
      title: 'Now Playing',
      thumbnail: playing.thumbnail,
      fields: [
        {
          name: 'Title',
          value: playing.title,
        },
        {
          name: 'Channel',
          value: playing.channelName,
        },
        {
          name: 'Length',
          value: duration,
        },
        {
          name: 'URL',
          value: playing.url,
        },
        {
          name: 'Requester',
          value: playing.requester,
        },
      ],
      footer: `Paused: ${
        musicData.songDispatcher.paused ? '✅' : '❌'
      } |  Looped: ${musicData.loop ? musicData.loop : '❌'} | Volume: ${
        musicData.volume * 50
      }`,
      send: 'channel',
    });
  }
}

module.exports = NowPlayingCommand;
