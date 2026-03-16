import type { AudioOperationHandler } from '../types';
import { runFFmpeg } from '../ffmpeg';

export const normalize: AudioOperationHandler<'normalize'> = {
  type: 'normalize',

  async process(inputPath, outputPath, params) {
    const filter = params.peakNormalize
      ? `volume=${params.targetLevel}dB`
      : `loudnorm=I=${params.targetLevel}:TP=-1.5:LRA=11`;

    await runFFmpeg(inputPath, outputPath, [filter]);
  },
};
