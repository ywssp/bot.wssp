'use strict';

export const radioStations = {
  jpop: {
    name: 'J-Pop',
    url: 'https://listen.moe/stream',
    websocketUrl: 'wss://listen.moe/gateway_v2'
  },
  kpop: {
    name: 'K-Pop',
    url: 'https://listen.moe/kpop/stream',
    websocketUrl: 'wss://listen.moe/kpop/gateway_v2'
  }
} as const;

export type RadioStations = typeof radioStations;

export type RadioStationNames = keyof typeof radioStations;
