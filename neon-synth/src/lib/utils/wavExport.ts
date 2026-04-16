/**
 * WAV Export Utility - Convert AudioBuffer to WAV file
 * Supports 16-bit and 24-bit PCM encoding at 44.1 kHz stereo
 */

export interface WavExportOptions {
  bitDepth: 16 | 24;
  sampleRate?: number;
}

export function audioBufferToWav(buffer: AudioBuffer, options: WavExportOptions = { bitDepth: 16 }): Blob {
  const sampleRate = options.sampleRate || buffer.sampleRate;
  const channels = buffer.numberOfChannels;
  const numSamples = buffer.length;
  const bytesPerSample = options.bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  
  const dataLength = numSamples * blockAlign;
  const bufferLength = 44 + dataLength; // WAV header is 44 bytes
  
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);
  
  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true); // File size - 8
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, channels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, options.bitDepth, true); // BitsPerSample
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true); // Subchunk2Size (data size)
  
  // Write audio data
  let offset = 44;
  const channelData = new Float32Array(channels);
  
  for (let i = 0; i < numSamples; i++) {
    // Interleave channels
    for (let ch = 0; ch < channels; ch++) {
      const channelBuffer = buffer.getChannelData(ch);
      let sample = channelBuffer[i];
      
      // Clamp to [-1, 1]
      sample = Math.max(-1, Math.min(1, sample));
      
      // Convert to integer
      if (options.bitDepth === 16) {
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      } else {
        // 24-bit
        const int24 = sample < 0 ? sample * 0x800000 : sample * 0x7FFFFF;
        view.setInt8(offset, int24 & 0xFF);
        view.setInt8(offset + 1, (int24 >> 8) & 0xFF);
        view.setInt8(offset + 2, (int24 >> 16) & 0xFF);
      }
      
      offset += bytesPerSample;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function downloadWav(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
