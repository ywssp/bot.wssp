'use strict';
module.exports = {
  unescapeHTML(str) {
    return str.replace(
      /&amp;|&lt;|&gt;|&#39;|&quot;/g,
      (tag) =>
        ({
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
          '&#39;': '\'',
          '&quot;': '"',
        }[tag] || tag)
    );
  },
  createSongObj(video, voiceChannel, msg) {
    return {
      title: video.title,
      channelName: video.channel.title,
      duration:
        video.duration === '00:00'
          ? '🔴 Live Stream'
          : module.exports.formatDuration(video.duration),
      durationMS: video.durationSeconds * 1000,
      thumbnail: video.thumbnails.high.url,
      url: `https://www.youtube.com/watch?v=${video.raw.id}`,
      id: video.raw.id,
      requester: msg.author.tag,
      voiceChannel,
    };
  },
  formatDuration({ hours, minutes, seconds }) {
    return `${hours ? `${hours}:` : ''}${minutes || '00'}:${
      seconds < 10 ? `0${seconds}` : seconds || '00'
    }`;
  },
};
