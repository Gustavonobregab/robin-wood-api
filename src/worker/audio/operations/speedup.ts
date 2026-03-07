import type { AudioOperationHandler } from '../types';
import { runFFmpeg } from '../ffmpeg';

export const speedup: AudioOperationHandler<'speedup'> = {
  type: 'speedup',

  async process(inputPath, outputPath, params) {
    const filters = params.rate > 2.0
      ? [`atempo=2.0`, `atempo=${params.rate / 2.0}`]
      : [`atempo=${params.rate}`];

    await runFFmpeg(inputPath, outputPath, filters);
  },
};
