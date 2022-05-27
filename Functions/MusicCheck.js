'use strict';
const createEmbed = require('./EmbedCreator.js');

module.exports = (
  message,
  {
    vc = true,
    sameVC = true,
    playing = true,
    queue = false,
    songNumber = false
  } = {}
) => {
  const checks = {
    vc: vc && !message.member.voice.channel,
    sameVC:
      sameVC && message.member.voice.channel !== message.guild.me.voice.channel,
    playing: playing && !message.guild.musicData.songDispatcher,
    queue: queue && message.guild.musicData.queue.length < 1,
    songNumber:
      typeof songNumber === 'number' &&
      (songNumber < 1 ||
        songNumber >
          (message.guild.musicData.queue.length
            ? message.guild.musicData.queue.length
            : 1))
  };
  const embedData = {
    preset: 'error',
    authorBool: true,
    send: 'channel'
  };

  if (checks.vc) {
    embedData.description = "You aren't inside a voice channel!";
  }
  if (checks.sameVC) {
    embedData.description = "You aren't inside the music voice channel!";
  }
  if (checks.playing) {
    embedData.description = 'There is no song playing!';
  }
  if (checks.queue) {
    embedData.description = 'There are no songs in the queue!';
  }
  if (checks.songNumber) {
    embedData.description = "That isn't a valid song number!";
  }
  if (embedData.description) {
    createEmbed(message, embedData);
    return true;
  }
  return false;
};
