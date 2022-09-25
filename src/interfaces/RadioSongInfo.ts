interface basicInfo {
  id: number;
  name: string;
  nameRomaji: string | null;
  image: string | null;
}

export interface RadioSongInfo {
  type: 'radio';
  id: number;
  title: string;
  artists: (basicInfo & { characters: { id: number }[] })[];
  characters: basicInfo[] | undefined;
  albums: basicInfo[];
  duration: number;
}
