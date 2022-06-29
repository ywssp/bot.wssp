'use strict';
module.exports = {
  createSongObj(video, voiceChannel, msg) {
    return {
      title: video.title,
      channelName: video.author.name,
      durationObj: module.exports.secondsToObj(+video.lengthSeconds),
      durationString:
        video.isLive && video.isLiveContent
          ? '🔴 Live Stream'
          : module.exports.formatDuration(
              module.exports.secondsToObj(+video.lengthSeconds)
            ),
      durationMS: +video.lengthSeconds * 1000,
      thumbnail: video.thumbnails[video.thumbnails.length - 1].url,
      url: video.video_url,
      id: video.videoId,
      requester: msg.author.tag,
      voiceChannel
    };
  },
  formatDuration({ hours, minutes, seconds }) {
    return `${hours ? `${hours}:` : ''}${minutes || '00'}:${seconds
      .toString()
      .padStart(2, '0')}`;
  },
  secondsToObj(lengthSeconds) {
    return {
      hours: Math.floor(lengthSeconds / 3600),
      minutes: Math.floor((lengthSeconds % 3600) / 60),
      seconds: lengthSeconds % 60
    };
  }
};
