// src/modules/audio/audio.pipeline.ts

import { Pipeline, Operation } from '../../lib/pipeline';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';
import { AudioData, AudioResult, AudioDetails, calculateMetrics } from './audio.types';

const DEFAULT_SAMPLE_RATE = 44100;

export class AudioPipeline extends Pipeline<AudioData, AudioResult> {
    private originalSize: number;
    private originalDuration: number;

    constructor(data: AudioData, ops: Operation[] = []) {
        // 1. SECURITY: Validate input format
        // Garante que não estamos recebendo WAV/MP3 com cabeçalho, apenas RAW PCM
        AudioPipeline.validateInput(data);
        
        // 2. Setup Pipeline
        super('audio', data, ops, (d, o) => this.exec(d, o));
        
        this.originalSize = getByteLength(data);
        // Float32 = 4 bytes por amostra
        this.originalDuration = this.originalSize / 4 / DEFAULT_SAMPLE_RATE; 
    }

    // --- Fluent API Methods ---

    speedup(rate: number): AudioPipeline {
        if (rate < 0.25 || rate > 100) throw new Error('Speed rate must be between 0.25 and 100');
        
        const pipeline = this.add('speedup', { rate }) as AudioPipeline;
        // Preserva métricas originais para cálculo final
        pipeline.originalSize = this.originalSize;
        pipeline.originalDuration = this.originalDuration;
        return pipeline;
    }

    normalize(): AudioPipeline {
        const pipeline = this.add('normalize', {}) as AudioPipeline;
        pipeline.originalSize = this.originalSize;
        pipeline.originalDuration = this.originalDuration;
        return pipeline;
    }

    removeSilence(thresholdDb = -40, minDurationMs = 100): AudioPipeline {
        const pipeline = this.add('removeSilence', { thresholdDb, minDurationMs }) as AudioPipeline;
        pipeline.originalSize = this.originalSize;
        pipeline.originalDuration = this.originalDuration;
        return pipeline;
    }

    volume(level: number): AudioPipeline {
        if (level < 0 || level > 2) throw new Error('Volume level must be between 0 and 2');
        
        const pipeline = this.add('volume', { level }) as AudioPipeline;
        pipeline.originalSize = this.originalSize;
        pipeline.originalDuration = this.originalDuration;
        return pipeline;
    }

    // --- Validation Logic ---
    private static validateInput(data: AudioData): void {
        let buffer: Buffer;

        if (Buffer.isBuffer(data)) {
            buffer = data;
        } else if (data instanceof Uint8Array) {
            buffer = Buffer.from(data);
        } else if (data instanceof ArrayBuffer) {
            buffer = Buffer.from(data);
        } else {
            return; // Tipo desconhecido
        }

        if (buffer.length < 12) return;

        // Verifica headers comuns para impedir envio de arquivos codificados
        // O pipeline espera RAW PCM (sem header)
        const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
        const isWave = buffer.toString('ascii', 8, 12) === 'WAVE';
        if (isRiff && isWave) {
            throw new Error("[RobinWood] Error: Raw WAV file detected. Please decode to Float32 PCM first.");
        }

        const isFtyp = buffer.toString('ascii', 4, 8) === 'ftyp';
        if (isFtyp) {
            throw new Error("[RobinWood] Error: MP4/AAC detected. Please decode audio first.");
        }

        const isId3 = buffer.toString('ascii', 0, 3) === 'ID3';
        if (isId3) {
            throw new Error("[RobinWood] Error: MP3 detected. Please decode audio first.");
        }
    }

    // --- Execution Logic ---
    private async exec(data: AudioData, ops: Operation[]): Promise<AudioResult> {
        let result = data;
        const appliedOps: string[] = [];

        for (const { name, params } of ops) {
            result = await AudioPipeline.run(result, name, params);
            appliedOps.push(name);
        }

        const float32 = toFloat32Array(result);
        const finalSize = getByteLength(result);
        const finalDuration = float32.length / DEFAULT_SAMPLE_RATE;
        const silenceRemoved = Math.max(0, this.originalDuration - finalDuration);

        return {
            data: result,
            metrics: calculateMetrics(this.originalSize, finalSize), // Usa o helper do types.ts
            details: {
                duration: Math.round(finalDuration * 100) / 100,
                sampleRate: DEFAULT_SAMPLE_RATE,
                originalDuration: Math.round(this.originalDuration * 100) / 100,
                silenceRemoved: Math.round(silenceRemoved * 100) / 100
            },
            operations: appliedOps
        };
    }

    private static async run(data: AudioData, op: string, params: any): Promise<AudioData> {
        switch (op) {
            case 'speedup':
                return speedupWithFFmpeg(data, params.rate);
            case 'normalize':
                return normalize(data);
            case 'removeSilence':
                return removeSilence(data, params.thresholdDb, params.minDurationMs);
            case 'volume':
                return volume(data, params.level);
            default:
                throw new Error(`Unknown operation: ${op}`);
        }
    }
}

// ========== Helpers ==========

function getByteLength(data: AudioData): number {
    if (Buffer.isBuffer(data)) return data.length;
    if (data instanceof ArrayBuffer) return data.byteLength;
    if (data instanceof Uint8Array) return data.byteLength;
    return 0;
}

function toFloat32Array(data: AudioData): Float32Array {
    if (Buffer.isBuffer(data)) {
        return new Float32Array(data.buffer, data.byteOffset, data.length / 4);
    }
    if (data instanceof ArrayBuffer) {
        return new Float32Array(data);
    }
    if (data instanceof Uint8Array) {
        return new Float32Array(data.buffer, data.byteOffset, data.length / 4);
    }
    throw new Error('Unsupported audio data type');
}

function toBuffer(data: Float32Array): Buffer {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
}

function dbToAmplitude(db: number): number {
    const clampedDb = Math.max(-60, Math.min(0, db));
    return Math.pow(10, clampedDb / 20);
}

// ========== Operations ==========

/**
 * Usa FFmpeg para mudar velocidade (tempo) mantendo o Pitch.
 * Requer input RAW F32LE e retorna RAW F32LE.
 */
async function speedupWithFFmpeg(data: AudioData, rate: number): Promise<AudioData> {
    return new Promise((resolve, reject) => {
        // 1. Preparar Input Stream
        let buffer: Buffer;
        if (Buffer.isBuffer(data)) {
            buffer = data;
        } else if (data instanceof Uint8Array) {
            buffer = Buffer.from(data);
        } else if (data instanceof ArrayBuffer) {
            buffer = Buffer.from(data);
        } else {
            return reject(new Error("Invalid data type for FFmpeg processing"));
        }

        const inputStream = new Readable();
        inputStream.push(buffer);
        inputStream.push(null);

        // 2. Preparar Output Stream
        const outputStream = new PassThrough();
        const chunks: Buffer[] = [];
        outputStream.on('data', (chunk) => chunks.push(chunk));
        
        // 3. Construir Filtros atempo (FFmpeg limita cada atempo entre 0.5 e 2.0)
        const filters: string[] = [];
        let remainingRate = rate;
        while (remainingRate > 2.0) {
            filters.push('atempo=2.0');
            remainingRate /= 2.0;
        }
        while (remainingRate < 0.5) {
            filters.push('atempo=0.5');
            remainingRate /= 0.5;
        }
        if (remainingRate !== 1.0) {
            filters.push(`atempo=${remainingRate}`);
        }

        // 4. Executar FFmpeg
        ffmpeg(inputStream)
            .inputFormat('f32le')
            .audioFrequency(DEFAULT_SAMPLE_RATE)
            .audioChannels(1)
            .audioFilters(filters)
            .format('f32le')
            .audioCodec('pcm_f32le')
            .on('error', (err) => {
                 if (err.message.includes('Output stream closed')) return;
                 reject(err);
            })
            .on('end', () => {
                const resultBuffer = Buffer.concat(chunks);
                resolve(resultBuffer);
            })
            .pipe(outputStream, { end: true });
    });
}

async function normalize(data: AudioData): Promise<AudioData> {
    const audioData = toFloat32Array(data);
    let peak = 0;
    
    // Encontrar pico
    for (let i = 0; i < audioData.length; i++) {
        peak = Math.max(peak, Math.abs(audioData[i]));
    }
    
    if (peak === 0) return data;

    // Aplicar ganho
    const normalized = new Float32Array(audioData.length);
    const scale = 1.0 / peak;

    for (let i = 0; i < audioData.length; i++) {
        normalized[i] = audioData[i] * scale;
    }
    return toBuffer(normalized);
}

async function removeSilence(
    data: AudioData,
    thresholdDb: number,
    minDurationMs: number
): Promise<AudioData> {
    const audioData = toFloat32Array(data);
    const sampleRate = DEFAULT_SAMPLE_RATE;
    const threshold = dbToAmplitude(thresholdDb);
    const minSamples = Math.floor((minDurationMs / 1000) * sampleRate);

    const silentRanges: Array<{ start: number; end: number }> = [];
    let startSilence = -1;
    let silenceCount = 0;

    // Detectar silêncio
    for (let i = 0; i < audioData.length; i++) {
        const amplitude = Math.abs(audioData[i]);
        if (amplitude < threshold) {
            silenceCount++;
            if (startSilence === -1) startSilence = i;
        } else {
            if (startSilence !== -1 && silenceCount >= minSamples) {
                silentRanges.push({ start: startSilence, end: i });
            }
            startSilence = -1;
            silenceCount = 0;
        }
    }

    // Caso termine em silêncio
    if (startSilence !== -1 && silenceCount >= minSamples) {
        silentRanges.push({ start: startSilence, end: audioData.length });
    }

    if (silentRanges.length === 0) return data;

    // Calcular novo tamanho
    let totalSamples = audioData.length;
    for (const range of silentRanges) {
        totalSamples -= range.end - range.start;
    }

    // Criar novo array sem silêncio
    const newAudio = new Float32Array(totalSamples);
    let newIndex = 0;
    let lastEnd = 0;

    for (const range of silentRanges) {
        const samplesToCopy = range.start - lastEnd;
        newAudio.set(audioData.slice(lastEnd, range.start), newIndex);
        newIndex += samplesToCopy;
        lastEnd = range.end;
    }

    if (lastEnd < audioData.length) {
        newAudio.set(audioData.slice(lastEnd), newIndex);
    }
    return toBuffer(newAudio);
}

async function volume(data: AudioData, level: number): Promise<AudioData> {
    const audioData = toFloat32Array(data);
    const adjusted = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
        adjusted[i] = audioData[i] * level;
    }
    return toBuffer(adjusted);
}