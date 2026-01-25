import { audioService } from '../audio/audio.service';
import { textService } from '../text/text.service';
import { imageService } from '../image/image.service';
import { videoService } from '../video/video.service';
import type { ProcessAudioData } from '../audio/audio.types';
import type { ProcessTextData } from '../text/text.types';
import type { StealImageInput } from '../image/image.model';
import type { StealVideoInput } from '../video/video.model';
interface UsageContext {
  apiKeyId?: string;
}

export class ApiService {
  async processAudio(userId: string, data: ProcessAudioData, context?: UsageContext) {
    return audioService.stealAudio(userId, data, context);
  }

  listAudioPresets() {
    return audioService.listPresets();
  }

  listAudioOperations() {
    return audioService.listOperations();
  }

  async processText(userId: string, data: ProcessTextData, context?: UsageContext) {
    return textService.stealText(userId, data, context);
  }

  listTextPresets() {
    return textService.listPresets();
  }

  listTextOperations() {
    return textService.listOperations();
  }

  async processImage(userId: string, data: StealImageInput) {
    return imageService.stealImage(userId, data);
  }

  listImagePresets() {
    return imageService.listPresets();
  }

  listImageOperations() {
    return imageService.listOperations();
  }

  async processVideo(userId: string, data: StealVideoInput) {
    return videoService.stealVideo(userId, data);
  }

  listVideoPresets() {
    return videoService.listPresets();
  }

  listVideoOperations() {
    return videoService.listOperations();
  }
}

export const apiService = new ApiService();
