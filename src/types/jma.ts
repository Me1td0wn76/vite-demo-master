export interface JMAForecast {
  publishingOffice: string;
  reportDatetime: string;
  headlineText?: string; // 天気概況
  timeSeries: JMATimeSeries[];
}

export interface JMATimeSeries {
  timeDefines: string[];
  areas: JMAAreaWeather[];
}

export interface JMAAreaWeather {
  area: { name: string; code: string };
  weathers?: string[];
  winds?: string[];
  waves?: string[];
  temps?: (number | null)[];
  pops?: (string | null)[];
}
