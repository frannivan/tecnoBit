export interface RadioStation {
  id: string;
  name: string;
  streamUrl: string;
  genre: string;
  country: string;
  imageUrl?: string;
  noCors?: boolean;
  playlistItemId?: string; // Reference to unique playlist entry
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
    imageUrl: 'images/groove_salad.png'
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
    id: 'soma-lush',
    name: 'Lush',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    genre: 'Sensual / Hypnotic Downtempo',
    country: 'USA',
    imageUrl: 'images/lush.png'
  },
  {
    id: 'soma-synphaera',
    name: 'Synphaera',
    streamUrl: 'https://ice1.somafm.com/synphaera-128-mp3',
    genre: 'Space Ambient',
    country: 'USA',
    imageUrl: 'images/synphaera.png'
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
    imageUrl: 'images/nightwave_plaza.png'
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
    imageUrl: 'images/cafe_del_mar.png'
  },
  {
    id: 'blue-marlin-ibiza',
    name: 'Blue Marlin Ibiza',
    streamUrl: 'https://ibizasonica.streaming-pro.com:8001/bluemarlin',
    genre: 'Deep House / Beach Club',
    country: 'Ibiza',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=200&fit=crop'
  },
  {
    id: 'beat-1009',
    name: 'Beat 100.9 FM',
    streamUrl: 'https://tecnobit.club/proxy/beat/',
    genre: 'Electronic / Pop',
    country: 'Mexico',
    imageUrl: 'images/beat_1009.png'
  },
  {
    id: 'sunshine-live-techno',
    name: 'Sunshine Live - Techno',
    streamUrl: 'https://stream.sunshine-live.de/techno/mp3-128',
    genre: 'Techno',
    country: 'Germany',
    imageUrl: 'images/sunshine_live.png'
  },
  {
    id: 'lofi-girl',
    name: 'Lofi Girl',
    streamUrl: 'https://play.streamafrica.net/lofiradio',
    genre: 'Lofi / Study',
    country: 'France',
    imageUrl: 'images/lofi_girl.png'
  },
  {
    id: 'chillhop-radio',
    name: 'Chillhop Radio',
    streamUrl: 'https://fluxfm.streamabc.net/flx-chillhop-mp3-128-8581707?sABC=60111f18%230%232pqsn68sqo31sso4snrqs9ssnoqqon27%23&aw_0_1st.playerid=&amsparams=playerid:;skey:1611734808', 
    genre: 'Lofi / Hip Hop',
    country: 'Netherlands',
    imageUrl: 'images/chillhop_radio.png'
  }
];
