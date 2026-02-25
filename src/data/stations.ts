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
    id: 'ibiza-global-radio',
    name: 'Ibiza Global Radio',
    streamUrl: 'https://listenssl.ibizaglobalradio.com:8026/;',
    genre: 'Electronic / House',
    country: 'Ibiza',
    imageUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300&h=200&fit=crop'
  },
  {
    id: 'soma-groovesalad',
    name: 'Groove Salad',
    streamUrl: 'https://ice1.somafm.com/groovesalad-256-mp3',
    genre: 'Downtempo',
    country: 'USA',
    imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673f?w=300&h=200&fit=crop'
  },
  {
    id: 'soma-defcon',
    name: 'Def Con Radio',
    streamUrl: 'https://ice1.somafm.com/defcon-256-mp3',
    genre: 'Hacking / Electronic',
    country: 'USA',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300&h=200&fit=crop'
  },
  {
    id: 'soma-vaporwaves',
    name: 'Vaporwaves',
    streamUrl: 'https://ice1.somafm.com/vaporwaves-128-mp3',
    genre: 'Vaporwave',
    country: 'Internet',
    imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=200&fit=crop'
  },
  {
    id: 'nightwave-plaza',
    name: 'Nightwave Plaza',
    streamUrl: 'https://radio.plaza.one/mp3',
    genre: 'Vaporwave / A E S T H E T I C',
    country: 'Online',
    imageUrl: 'https://images.unsplash.com/photo-1614145121029-83a9f7968944?w=300&h=200&fit=crop'
  },
  {
    id: 'nts-1',
    name: 'NTS Radio 1',
    streamUrl: 'https://stream-relay-geo.ntslive.co.uk/stream',
    genre: 'Eclectic',
    country: 'UK',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=200&fit=crop'
  },
  {
    id: 'cafe-del-mar',
    name: 'Café del Mar',
    streamUrl: 'https://streamer.radio.co/sb748f24ad/listen',
    genre: 'Chillout',
    country: 'Ibiza',
    imageUrl: 'https://images.unsplash.com/photo-1514525253361-b83a859b127e?w=300&h=200&fit=crop'
  },
  {
    id: 'blue-marlin-ibiza',
    name: 'Blue Marlin Ibiza',
    streamUrl: 'https://ibizasonica.streaming-pro.com:8001/bluemarlin',
    genre: 'Deep House / Beach Club',
    country: 'Ibiza',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=200&fit=crop'
  }
];
