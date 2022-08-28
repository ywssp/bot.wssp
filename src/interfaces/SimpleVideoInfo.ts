import { Duration } from 'luxon';

export interface SimpleVideoInfo {
  title: string;
  duration: 'Live Stream' | Duration;
  url: string;
  id: string;
  channel: {
    name: string;
    url: string;
  };
  thumbnail: string | undefined;
  requester: string;
}
