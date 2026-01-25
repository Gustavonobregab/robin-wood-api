// src/modules/audio/audio.service.ts

import {
  AUDIO_PRESETS,
  type StealAudioInput,
  type AudioPreset,
  type AudioOperation
} from './audio.model';
import { ApiError } from '../../lib/api-error';
import { AudioPipeline } from './audio.pipeline';
import { usersService } from '../users/users.service';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';

export class AudioService {
  
  async stealAudio(userId: string, input: StealAudioInput) {
    const { preset, operations: customOps, file } = input;

    // 1. Validação
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

    // 2. Definir Operações (Tipagem Forte baseada no Model)
    const operationsToRun = (preset
      ? AUDIO_PRESETS[preset as AudioPreset].operations
      : customOps!) as AudioOperation[];

    // 3. Decodificar Arquivo (MP3/WAV -> Raw Float32 PCM)
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    const rawPcmData = await this.decodeToRaw(originalBuffer);

    // 4. Iniciar Pipeline
    const pipeline = new AudioPipeline(rawPcmData);

    // 5. Executar Operações (Mapeamento Model -> Pipeline)
    for (const op of operationsToRun) {
      switch (op.type) {
        
        case 'trim-silence': {
          // Lógica: Converter 'aggressiveness' (0.0 - 1.0) para Threshold DB (-60dB a -20dB)
          // 0.0 => -60dB (Só remove silêncio absoluto)
          // 1.0 => -20dB (Remove ruídos de fundo também)
          const aggressiveness = op.params?.aggressiveness ?? 0.5;
          const thresholdDb = -60 + (aggressiveness * 40);
          
          pipeline.removeSilence(
            thresholdDb,
            op.params?.minSilenceDuration // Pipeline aceita ms direto
          );
          break;
        }

        case 'normalize': {
          // 1. Normaliza o pico para 0dB (padrão do pipeline)
          pipeline.normalize();
          
          // 2. Se houver targetLevel (ex: -14dB), reduzimos o volume
          const target = op.params?.targetLevel ?? 0;
          if (target < 0) {
            // Converter dB para ganho linear: 10^(dB/20)
            const gain = Math.pow(10, target / 20);
            pipeline.volume(gain);
          }
          break;
        }

        case 'compress': {
          // TODO: Implementar DSP Compressor real no Pipeline.
          // Por enquanto, aplicamos um ganho simples (Makeup Gain) baseado no threshold
          // para simular o efeito de "aumentar o som" que a compressão traz.
          const threshold = op.params?.threshold ?? -20;
          // Ganho conservador: recupera metade do threshold em volume
          const makeupGainDb = Math.abs(threshold) / 2; 
          const linearGain = Math.pow(10, makeupGainDb / 20);
          
          pipeline.volume(linearGain);
          break;
        }
      }
    }

    // 6. Finalizar Processamento
    const result = await pipeline.execute();

    // 7. Codificar de volta para WAV
    const outputWavBuffer = await this.encodeToWav(result.data as Buffer);

    // 8. Billing
    try {
      await usersService.incrementFreeTierUsage(userId, 1);
    } catch (e) {
      console.error('Billing error:', e);
    }

    return {
      file: outputWavBuffer,
      filename: `processed_${Date.now()}.wav`,
      metrics: result.metrics,
      details: result.details
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

  // Helper para listar operações disponíveis e seus schemas
  // (Útil para frontend gerar formulários dinâmicos)
  listOperations() {
    // Como AUDIO_OPERATIONS é um objeto 'as const', precisamos tipar o retorno
    return Object.entries(import('./audio.model').then(m => m.AUDIO_OPERATIONS) || {}).map(([id, op]: any) => ({
      id,
      name: op.name,
      description: op.description,
      params: op.params,
    }));
  }

  // ==========================================
  // HELPERS (FFMPEG)
  // ==========================================

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