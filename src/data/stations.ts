export interface RadioStation {
  id: string;
  name: string;
  streamUrl: string;
  genre: string;
  country: string;
  imageUrl?: string;
}

export const stations: RadioStation[] = [
  {
    id: 'ibiza-live',
    name: 'Ibiza Live Radio',
    streamUrl: 'https://streams.ibizaliveradio.com:8000/ibizaliveradio',
    genre: 'Electronic',
    country: 'Spain',
    imageUrl: 'https://www.ibizaliveradio.com/images/logo.png' // Placeholder/Example
  },
  {
    id: 'ibiza-global',
    name: 'Ibiza Global Radio',
    streamUrl: 'https://ibizaglobalradio.streaming-pro.com:8024/ibizaglobalradio.mp3',
    genre: 'Electronic',
    country: 'Spain'
  },
  {
    id: 'somafm-groovesalad',
    name: 'SomaFM: Groove Salad',
    streamUrl: 'https://ices1.somafm.com/groovesalad-128-mp3',
    genre: 'Ambient / Downtempo',
    country: 'USA'
  },
  {
    id: 'nts-1',
    name: 'NTS Radio 1',
    streamUrl: 'https://stream-relay-geo.ntslive.co.uk/stream',
    genre: 'Eclectic',
    country: 'UK'
  },
  {
    id: 'radio-ibero',
    name: 'Ibero 90.9',
    streamUrl: 'https://s2.mexside.net/8002/stream', // Verify this URL, often changes
    genre: 'Alternative',
    country: 'Mexico'
  },
  {
    id: 'radio-shock',
    name: 'Radio Shock Patagonia',
    streamUrl: 'https://streaming.radioshock.cl/8000/stream', // Placeholder logic, assuming standard icecast
    genre: 'Electronic / Rock',
    country: 'Chile'
  },
  {
    id: 'reggae-141',
    name: 'Rastafari Radio',
    streamUrl: 'http://dreamsiteradiocp.com:8054/stream',
    genre: 'Reggae',
    country: 'Global'
  }
];
