type TetrioRank =
  | 'x'
  | 'u'
  | 'ss'
  | 's+'
  | 's'
  | 's-'
  | 'a+'
  | 'a'
  | 'a-'
  | 'b+'
  | 'b'
  | 'b-'
  | 'c+'
  | 'c'
  | 'c-'
  | 'd+'
  | 'd'
  | 'z';

export type RecordEndContext = {
  seed: number;
  lines: number;
  level_lines: number;
  level_lines_needed: number;
  inputs: number;
  holds: number;
  time: {
    start: number;
    zero: boolean;
    locked: boolean;
    prev: number;
    frameoffset: number;
  };
  score: number;
  zenlevel: number;
  zenprogress: number;
  level: number;
  combo: number;
  currentcombopower: number;
  topcombo: number;
  btb: number;
  topbtb: number;
  tspins: number;
  piecesplaced: number;
  clears: {
    singles: number;
    doubles: number;
    triples: number;
    quads: number;
    realtspins: number;
    minitspins: number;
    minitspinsingles: number;
    tspinsingles: number;
    minitspindoubles: number;
    tspindoules: number;
    tspintriples: number;
    tspinquads: number;
    allclear: number;
  };
  garbage: {
    sent: number;
    recieved: number;
    attack: number;
    cleared: number;
  };
  kills: number;
  finesse: {
    combo: number;
    faults: number;
    perfectpieces: number;
  };
  finalTime: number;
  gametype: string;
};

type TetrioRecord = {
  _id: string;
  stream: string;
  replayid: string;
  user: {
    _id: string;
    username: string;
  };
  ts: string;
  ismulti: boolean;
  endcontext: RecordEndContext | RecordEndContext[];
};

interface FailedAPIResponse {
  success: false;
  error: string;
}

interface SuccessfulAPIResponse<T> {
  success: true;
  cache: {
    status: 'hit' | 'miss' | 'awaited';
    cached_at: number;
    cached_until: number;
  };
  data: T;
}

export type TetrioUserInfo = {
  user: {
    _id: string;
    username: string;
    role: 'anon' | 'user' | 'bot' | 'mod' | 'admin' | 'banned';
    ts?: string;
    botmaster?: string;
    badges: {
      id: string;
      label: string;
      ts?: string;
    }[];
    xp: number;
    gamesplayed: number;
    gameswon: number;
    gametime: number;
    country?: string;
    badstanding?: boolean;
    supporter?: boolean;
    supporter_tier: 0 | 1 | 2 | 3 | 4;
    verified: boolean;
    league: {
      gamesplayed: number;
      gameswon: number;
      rating: number;
      rank: TetrioRank;
      bestrank: TetrioRank;
      standing: number;
      standing_local: number;
      next_rank: TetrioRank | null;
      prev_rank: TetrioRank | null;
      next_at: number;
      prev_at: number;
      percentile: number;
      percentile_rank: TetrioRank;
      glicko?: number;
      rd?: number;
      apm?: number;
      pps?: number;
      vs?: number;
      decaying: boolean;
    };
    avatar_revision?: string;
    banner_revision?: string;
    bio?: string;
    friend_count: number;
  };
};

export type TetrioUserRecords = {
  records: {
    '40l': {
      record: TetrioRecord | null;
      rank: number | null;
    };
    blitz: {
      record: TetrioRecord | null;
      rank: number | null;
    };
  };
  zen: {
    level: number;
    score: number;
  };
};

export type TetrioUserInfoAPIResponse =
  | SuccessfulAPIResponse<TetrioUserInfo>
  | FailedAPIResponse;

export type TetrioUserRecordsAPIResponse =
  | SuccessfulAPIResponse<TetrioUserRecords>
  | FailedAPIResponse;
