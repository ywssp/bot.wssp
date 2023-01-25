import { RadioStationNames, RadioStations } from '../AvailableRadioStations';

export class RadioData {
  station: RadioStationNames | 'none';
  url: RadioStations[RadioStationNames]['url'] | 'none';

  constructor() {
    this.station = 'none';
    this.url = 'none';
  }
}
