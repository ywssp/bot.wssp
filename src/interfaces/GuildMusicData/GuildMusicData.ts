import { RadioData } from './RadioData';
import { YouTubeData } from './YouTubeData';

export class GuildMusicData {
  textUpdateChannelId: string;
  musicAnnounceStyle: 'full' | 'minimal' | 'none';
  youtubeData: YouTubeData;
  radioData: RadioData;

  constructor(textUpdateChannelId: string) {
    this.textUpdateChannelId = textUpdateChannelId;
    this.musicAnnounceStyle = 'full';
    this.youtubeData = new YouTubeData();
    this.radioData = new RadioData();
  }
}
