/**
 * Analiza un buffer de audio para detectar picos rítmicos y calcular el BPM aproximado.
 * Utiliza un filtro de paso bajo (Low-pass) para aislar el bombo y mejorar la precisión.
 */
export async function detectBPM(buffer: AudioBuffer): Promise<number> {
  const offlineContext = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  // 1. Crear cadena de procesamiento digital (DSP)
  const source = offlineContext.createBufferSource();
  source.buffer = buffer;

  // Filtro de paso bajo para aislar el "kick" (bombo)
  const lowpass = offlineContext.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 150; // Cortamos todo por encima de 150Hz
  lowpass.Q.value = 1;

  source.connect(lowpass);
  lowpass.connect(offlineContext.destination);

  source.start(0);
  const renderedBuffer = await offlineContext.startRendering();
  
  // 2. Analizar el buffer filtrado
  const data = renderedBuffer.getChannelData(0);
  const sampleRate = renderedBuffer.sampleRate;
  
  // Agrupamos en bloques para reducir ruido
  const blockSize = Math.round(sampleRate * 0.02); // 20ms
  const peaks: { position: number, volume: number }[] = [];
  
  // Cálculo de umbral adaptativo
  let totalEnergy = 0;
  for (let i = 0; i < data.length; i += blockSize) {
      let max = 0;
      for (let j = 0; j < blockSize && (i + j) < data.length; j++) {
          const vol = Math.abs(data[i + j]);
          if (vol > max) max = vol;
      }
      totalEnergy += max;
  }
  const avgEnergy = totalEnergy / (data.length / blockSize);
  const threshold = avgEnergy * 1.5; // El pico debe ser 1.5x mayor que el promedio

  for (let i = 0; i < data.length; i += blockSize) {
    let max = 0;
    for (let j = 0; j < blockSize && (i + j) < data.length; j++) {
      const vol = Math.abs(data[i + j]);
      if (vol > max) max = vol;
    }
    if (max > threshold) { 
       peaks.push({ position: i / sampleRate, volume: max });
    }
  }

  // 3. Calcular intervalos entre picos
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const interval = peaks[i].position - peaks[i - 1].position;
    // Rango humano (40 - 200 BPM)
    if (interval > 0.3 && interval < 1.5) {
      intervals.push(interval);
    }
  }

  if (intervals.length === 0) return 128;

  // 4. Histograma de intervalos
  const counts: { [key: string]: number } = {};
  intervals.forEach(int => {
    const rounded = Math.round(int * 50) / 50; // Mayor resolución (0.02s)
    counts[rounded] = (counts[rounded] || 0) + 1;
  });

  let bestInterval = 0.5;
  let maxCount = 0;
  for (const int in counts) {
    if (counts[int] > maxCount) {
      maxCount = counts[int];
      bestInterval = parseFloat(int);
    }
  }

  const detectedBPM = Math.round(60 / bestInterval);
  
  // Corrección de duplicados (half/double detection)
  if (detectedBPM < 70) return detectedBPM * 2;
  if (detectedBPM > 180) return detectedBPM / 2;
  
  return detectedBPM;
}
