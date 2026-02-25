import jsmediatags from 'jsmediatags';

export interface TrackMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  artwork?: string; // Base64 data URL
  duration?: number;
}

export const extractMetadata = (audioUrl: string): Promise<TrackMetadata> => {
  return new Promise((resolve) => {
    jsmediatags.read(audioUrl, {
      onSuccess: (tag) => {
        const tags = tag.tags;
        let artwork: string | undefined;

        // Extract album artwork
        if (tags.picture) {
          const { data, format } = tags.picture;
          const base64String = data.reduce((acc: string, byte: number) => acc + String.fromCharCode(byte), '');
          artwork = `data:${format};base64,${btoa(base64String)}`;
        }

        resolve({
          title: tags.title,
          artist: tags.artist,
          album: tags.album,
          year: tags.year,
          artwork,
        });
      },
      onError: (error) => {
        console.warn('Failed to extract metadata:', error);
        resolve({}); // Return empty metadata on error
      },
    });
  });
};

// Helper to get duration from audio element
export const getAudioDuration = (audioUrl: string): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio(audioUrl);
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.addEventListener('error', () => {
      resolve(0);
    });
  });
};
