
import {
  AUDIO_PRESETS,
  type StealAudioInput,
  type AudioPreset,
  AUDIO_OPERATIONS,
  type AudioOperation,
} from './audio.types';
import { ApiError } from '../../utils/api-error';
import { AudioPipeline } from './audio.pipeline';
import { usageService } from '../usage/usage.service';
import { generateIdempotencyKey, hashInput } from '../../utils/idempotency';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';

export class AudioService {
  async stealAudio(
    userId: string,
    input: StealAudioInput,
    context?: { apiKeyId?: string }
  ) {
    const startTime = Date.now();
    const { preset, operations: customOps, file } = input;

    if (!file) {
      throw new ApiError('AUDIO_INVALID_INPUT', 'File is required', 400);
    }

    if (!preset && (!customOps || customOps.length === 0)) {
      throw new ApiError(
        'AUDIO_INVALID_INPUT',
        'Either preset or operations must be provided',
        400,
      );
    }

    const operationsToRun = (preset
      ? AUDIO_PRESETS[preset as AudioPreset].operations
      : customOps!) as AudioOperation[];

    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    const rawPcmData = await this.decodeToRaw(originalBuffer);

    let pipeline = new AudioPipeline(rawPcmData);

    for (const op of operationsToRun) {
      pipeline = pipeline.apply(op);
    }

    const result = await pipeline.execute();

    const outputWavBuffer = await this.encodeToWav(result.data as Buffer);

    const operationNames = operationsToRun.map(op => op.type);
    
    const inputHash = hashInput({
      userId,
      pipelineType: 'audio',
      operations: operationNames,
      inputSize: originalBuffer.length,
    });

    try {
      await usageService.record({
        idempotencyKey: generateIdempotencyKey(userId, 'audio', inputHash),
        userId,
        apiKeyId: context?.apiKeyId,
        pipelineType: 'audio',
        operations: operationNames,
        inputBytes: originalBuffer.length,
        outputBytes: outputWavBuffer.length,
        processingMs: Date.now() - startTime,
      });
    } catch (e) {
      console.error('Usage recording error:', e);
    }

    return {
      file: outputWavBuffer,
      filename: `processed_${Date.now()}.wav`,
      metrics: result.metrics,
      details: result.details,
    };
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
    return Object.entries(AUDIO_OPERATIONS).map(([id, op]: any) => ({
      id,
      name: op.name,
      description: op.description,
      params: op.params,
    }));
  }

  private decodeToRaw(inputBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(inputBuffer);
      inputStream.push(null);

      const chunks: Buffer[] = [];
      const outputStream = new PassThrough();
      outputStream.on('data', (c) => chunks.push(c));

      ffmpeg(inputStream)
        .noVideo()
        .audioChannels(1)
        .audioFrequency(44100)
        .format('f32le')
        .audioCodec('pcm_f32le')
        .on('error', (err) => {
          if (err.message.includes('Output stream closed')) return;
          reject(new ApiError('PROCESSING_ERROR', `Decode failed: ${err.message}`, 500));
        })
        .on('end', () => resolve(Buffer.concat(chunks)))
        .pipe(outputStream);
    });
  }

  private encodeToWav(rawPcmBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(rawPcmBuffer);
      inputStream.push(null);

      const chunks: Buffer[] = [];
      const outputStream = new PassThrough();
      outputStream.on('data', (c) => chunks.push(c));

      ffmpeg(inputStream)
        .inputFormat('f32le')
        .inputOptions(['-ar 44100', '-ac 1'])
        .toFormat('wav')
        .on('error', (err) => reject(new ApiError('PROCESSING_ERROR', `Encode failed: ${err.message}`, 500)))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .pipe(outputStream);
    });
  }
}

export const audioService = new AudioService();