import WebSocket from 'ws';
import { RadioSongInfo } from '../RadioSongInfo';
import { RadioWebsocketUpdate } from '../RadioWebsocketUpdate';

export class RadioData {
  channel: 'jpop' | 'kpop' | 'none';
  websocket: {
    connection: WebSocket;
    heartbeat: NodeJS.Timeout;
  } | null;
  lastUpdate: RadioWebsocketUpdate | null;
  currentSong: RadioSongInfo | undefined;

  constructor() {
    this.channel = 'none';
    this.websocket = null;
    this.lastUpdate = null;
    this.currentSong = undefined;
  }
}
