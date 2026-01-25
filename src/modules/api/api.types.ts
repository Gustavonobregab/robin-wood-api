import type { ProcessAudioData } from '../audio/audio.types';
import type { ProcessTextData } from '../text/text.types';

export type ApiProcessAudioData = {
  data: ProcessAudioData;
  metadata: {};
};

export type ApiProcessTextData = {
  data: ProcessTextData;
  metadata: {};
};