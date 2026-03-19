import ffmpeg from 'fluent-ffmpeg';

export interface AudioProbeResult {
  durationMs: number;
  format: string;
  sampleRate: number;
  channels: number;
}

export function probeAudio(filePath: string): Promise<AudioProbeResult> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const stream = metadata.streams.find(s => s.codec_type === 'audio');
      if (!stream) return reject(new Error('No audio stream found'));

      resolve({
        durationMs: Math.round((metadata.format.duration || 0) * 1000),
        format: metadata.format.format_name?.split(',')[0] || 'unknown',
        sampleRate: stream.sample_rate ? Number(stream.sample_rate) : 0,
        channels: stream.channels || 0,
      });
    });
  });
}
