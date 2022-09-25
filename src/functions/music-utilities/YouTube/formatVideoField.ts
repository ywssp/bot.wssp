import { SimpleVideoInfo } from '../../../interfaces/SimpleVideoInfo';

export function formatVideoField(video: SimpleVideoInfo, prefix?: string) {
  return {
    name: `${prefix ? prefix + ' ' : ''}${video.title}`,
    value: `[Link](${video.url}) | ${
      typeof video.duration === 'string'
        ? video.duration
        : video.duration.toFormat('m:ss')
    } | By [${video.channel.name}](${video.channel.url})`
  };
}
