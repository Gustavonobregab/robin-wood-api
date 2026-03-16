import type { AudioOperationHandler } from '../types';
import { runFFmpeg } from '../ffmpeg';

export const compress: AudioOperationHandler<'compress'> = {
  type: 'compress',

  async process(inputPath, outputPath, params) {
    await runFFmpeg(inputPath, outputPath, [
      `acompressor=threshold=${params.threshold}dB:ratio=${params.ratio}:attack=${params.attack}:release=${params.release}`,
    ]);
  },
};
