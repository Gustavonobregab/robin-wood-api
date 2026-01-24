import {
  AudioModel,
  AUDIO_PRESETS,
  AUDIO_OPERATIONS,
  type Audio,
  type StealAudioInput,
} from './audio.model';
import { ApiError } from '../../lib/api-error';

export class AudioService {
  //TODO: REMOVE ANY FROM PROMISE, RETURN PROPER TYPE 
  async stealAudio(userId: string, input: StealAudioInput): Promise<any> {
    const file = input.file;

    let operations = input.operations || [];

    if (input.preset && AUDIO_PRESETS[input.preset]) {
      operations = [...AUDIO_PRESETS[input.preset].operations];
    }

    return "Mock"
  }

  listPresets() {
    return Object.entries(AUDIO_PRESETS).map(([id, preset]) => ({
      id,
      name: preset.name,
      description: preset.description,
      operations: preset.operations.map(op => op.type),
    }));
  }

  listOperations() {
    return Object.entries(AUDIO_OPERATIONS).map(([id, op]) => ({
      id,
      name: op.name,
      description: op.description,
      params: op.params,
    }));
  }

  async getById(userId: string, id: string): Promise<Audio> {
    const audio = await AudioModel.findOne({ _id: id, userId });
    
    if (!audio) {
      throw new ApiError('AUDIO_NOT_FOUND', 'Audio not found', 404);
    }
    return audio;
  }

}

export const audioService = new AudioService();
