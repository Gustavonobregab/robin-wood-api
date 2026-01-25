
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
import { unlink } from 'node:fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

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

    const outputWavBuffer = await this.encodeToMp3(result.data as Buffer);

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
      filename: `processed_${Date.now()}.mp3`,
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

  private async decodeToRaw(inputBuffer: Buffer): Promise<Buffer> {
    // Cria um caminho temporário único
    const tempInputPath = join(tmpdir(), `robin_input_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    
    // 1. Escreve o buffer no disco (para permitir que o FFmpeg faça 'seek' no M4A)
    await Bun.write(tempInputPath, inputBuffer);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const outputStream = new PassThrough();
      
      outputStream.on('data', (c) => chunks.push(c));

      ffmpeg(tempInputPath) // <--- LÊ DO ARQUIVO, NÃO DO STREAM
        .noVideo()
        .audioChannels(1)
        .audioFrequency(44100)
        .format('f32le')
        .audioCodec('pcm_f32le')
        .on('error', async (err) => {
          // Limpa o arquivo em caso de erro
          await unlink(tempInputPath).catch(() => {}); 
          console.error('FFmpeg Decode Error:', err);
          reject(new ApiError('PROCESSING_ERROR', `Decode failed: ${err.message}`, 500));
        })
        .on('end', async () => {
            // Limpa o arquivo após sucesso
            await unlink(tempInputPath).catch(() => {});
            const result = Buffer.concat(chunks);
            resolve(result);
        })
        .pipe(outputStream);
    });
  }

  // Substitua o antigo encodeToWav por este:
  private encodeToMp3(rawPcmBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(rawPcmBuffer);
      inputStream.push(null);

      const chunks: Buffer[] = [];
      const outputStream = new PassThrough();
      outputStream.on('data', (c) => chunks.push(c));

      ffmpeg(inputStream)
        .inputFormat('f32le')
        .inputOptions(['-ar 44100', '-ac 1']) // Lê o RAW PCM
        .toFormat('mp3')                      // Converte para MP3
        .audioBitrate('128k')                 // 128kbps (Bom balanço tamanho/qualidade)
        .on('error', (err) => reject(new ApiError('PROCESSING_ERROR', `Encode failed: ${err.message}`, 500)))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .pipe(outputStream);
    });
  }
}

export const audioService = new AudioService();