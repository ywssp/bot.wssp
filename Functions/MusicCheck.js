'use strict';
const createEmbed = require('./EmbedCreator.js');

module.exports = (
  message,
  {
    vc = true,
    sameVC = true,
    playing = true,
    queue = false,
    songNumber = false,
  } = {}
) => {
  const checks = {
    vc: !message.member.voice.channel && vc,
    sameVC:
      message.member.voice.channel !== message.guild.me.voice.channel && sameVC,
    playing: !message.guild.musicData.songDispatcher && playing,
    queue: message.guild.musicData.queue.length < 1 && queue,
    songNumber:
      (songNumber < 1 ||
        songNumber >
          (message.guild.musicData.queue.length
            ? message.guild.musicData.queue.length
            : 1)) &&
      songNumber !== false,
  };
  const embedData = {
    authorBool: true,
    send: 'channel',
  };

  if (checks.vc) { embedData.description = 'You aren\'t inside a voice channel!'; }
  if (checks.sameVC) {
    embedData.description = 'You aren\'t inside the music voice channel!';
  }
  if (checks.playing) { embedData.description = 'There is no song playing!'; }
  if (checks.queue) { embedData.description = 'There are no songs in the queue!'; }
  if (checks.songNumber) { embedData.description = 'That isn\'t a valid song number!'; }
  if (embedData.description) {
    createEmbed(message, 'error', embedData);
    return true;
  }
  return false;
};
