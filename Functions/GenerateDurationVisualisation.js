'use strict';
const { formatDuration } = require('./MusicFunctions.js');

module.exports = (message, video) => {
  const passedTimeMS = message.guild.musicData.songDispatcher.streamTime;
  const passedTime = formatDuration({
    seconds: Math.floor((passedTimeMS / 1000) % 60),
    minutes: Math.floor((passedTimeMS / 60000) % 60),
    hours: Math.floor((passedTimeMS / 3600000) % 24),
  });
  const totalTimeMS = video.durationMS;
  const totalTime = video.duration;

  const playBackBarLocation = Math.round((passedTimeMS / totalTimeMS) * 10);
  let playBack = '';
  for (let i = 0; i <= 20; i++) {
    playBack += i === playBackBarLocation * 2 ? '●' : '—';
  }

  return `${passedTime} | ${totalTime}\n${playBack}`;
};
