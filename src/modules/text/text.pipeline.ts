import { Pipeline, Operation } from '../../pipeline';
import { PipelineResult, TextDetails, calculateMetrics, TextOperation } from './text.types';
import { 
    SHORTEN_MAP_EN, 
    SHORTEN_MAP_PT, 
    PHRASE_REDUCER_EN, 
    PHRASE_REDUCER_PT 
} from './text.dictionaries';
import { encode as toonEncode } from '../../utils/toon';

export type TextData = string;
export type TextResult = PipelineResult<string, TextDetails>;

// ==========================================
// 🚀 ENGINE DE OTIMIZAÇÃO (MASTER REGEX)
// ==========================================
// Compilado apenas uma vez na inicialização do módulo para performance máxima.

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function compileMasterRegex(map: Record<string, string>): { regex: RegExp, replacer: (m: string) => string } {
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    if (keys.length === 0) {
        return { regex: /$^/, replacer: (m) => m };
    }
    const pattern = `\\b(${keys.map(escapeRegExp).join('|')})\\b`;
    const regex = new RegExp(pattern, 'gi'); 
    
    const replacer = (match: string) => {
        const lower = match.toLowerCase();
        return map[lower] || match;
    };

    return { regex, replacer };
}

// Compilação dos Motores (EN/PT)
const ENGINE_EN = {
    phrases: compileMasterRegex(PHRASE_REDUCER_EN),
    words: compileMasterRegex(SHORTEN_MAP_EN)
};

const ENGINE_PT = {
    phrases: compileMasterRegex(PHRASE_REDUCER_PT),
    words: compileMasterRegex(SHORTEN_MAP_PT)
};


// ==========================================
// CLASSE PIPELINE
// ==========================================

export class TextPipeline extends Pipeline<TextData, TextResult> {
    private originalSize: number;

    constructor(data: TextData, ops: Operation[] = []) {
        super('text', data, ops, (d, o) => this.exec(d, o));
        this.originalSize = data.length;
    }

    // --- OPERAÇÕES ---

    trim(): TextPipeline {
        const pipeline = this.add('trim', {}) as TextPipeline;
        pipeline.originalSize = this.originalSize;
        return pipeline;
    }

    shorten(lang: 'EN' | 'PT' = 'EN'): TextPipeline {
        const pipeline = this.add('shorten', { lang }) as TextPipeline;
        pipeline.originalSize = this.originalSize;
        return pipeline;
    }

    minify(): TextPipeline {
        const pipeline = this.add('minify', {}) as TextPipeline;
        pipeline.originalSize = this.originalSize;
        return pipeline;
    }

    compress(algo: 'gzip' | 'brotli' = 'gzip'): TextPipeline {
        const pipeline = this.add('compress', { algo }) as TextPipeline;
        pipeline.originalSize = this.originalSize;
        return pipeline;
    }

    jsonToToon(): TextPipeline {
        const pipeline = this.add('json-to-toon', {}) as TextPipeline;
        pipeline.originalSize = this.originalSize;
        return pipeline;
    }

    // --- ROTEAMENTO ---

    apply(op: TextOperation): TextPipeline {
        switch (op.type) {
            case 'trim':
                return this.trim();
            case 'shorten':
                return this.shorten(op.params?.lang ?? 'EN');
            case 'minify':
                return this.minify();
            case 'compress':
                return this.compress(op.params?.algo ?? 'gzip');
            case 'json-to-toon':
                return this.jsonToToon();
            default:
                return this; 
        }
    }

    // --- EXECUÇÃO ---

    private async exec(data: TextData, ops: Operation[]): Promise<TextResult> {
        let result = data;
        const appliedOps: string[] = [];

        for (const { name, params } of ops) {
            result = await TextPipeline.run(result, name, params);
            appliedOps.push(name);
        }

        const finalSize = result.length;

        return {
            data: result,
            metrics: calculateMetrics(this.originalSize, finalSize),
            details: {
                charCount: finalSize,
                originalCharCount: this.originalSize
            },
            operations: appliedOps
        };
    }

    private static async run(data: TextData, op: string, params: any): Promise<TextData> {
        switch (op) {
            case 'trim':
                return runTrim(data);
            case 'shorten':
                return runShorten(data, params.lang);
            case 'minify':
                return runMinify(data);
            case 'compress':
                return runCompress(data, params.algo);
            case 'json-to-toon':
                return runJsonToToon(data);
            default:
                return data;
        }
    }
}

// ==========================================
// FUNÇÕES DE LÓGICA PURA
// ==========================================

async function runTrim(data: TextData): Promise<TextData> {
    return data
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.:;!?])/g, '$1') // Cola a pontuação
        .trim();
}

async function runShorten(data: TextData, lang: 'EN' | 'PT'): Promise<TextData> {
    const engine = lang === 'PT' ? ENGINE_PT : ENGINE_EN;
    let result = data;

    // FASE 1: Redução Semântica de Frases (Semantic De-Bloat)
    // Ex: "in order to" -> "to" / "venho por meio desta" -> "informo"
    result = result.replace(engine.phrases.regex, engine.phrases.replacer);

    // FASE 2: Abreviação de Palavras (Dictionary Swap)
    // Ex: "because" -> "bc" / "você" -> "vc"
    result = result.replace(engine.words.regex, engine.words.replacer);

    return result;
}

async function runMinify(data: TextData): Promise<TextData> {
    // Minify pode ser mais agressivo no futuro
    return runTrim(data);
}

async function runCompress(data: TextData, algo: string): Promise<TextData> {
    // Simulação de compressão lógica (Placeholder para compressão real se necessário)
    return data;
}

function findJsonBlocks(text: string): { start: number; end: number; json: string }[] {
    const blocks: { start: number; end: number; json: string }[] = [];
    let i = 0;
    while (i < text.length) {
        if (text[i] === '{' || text[i] === '[') {
            const startChar = text[i];
            const endChar = startChar === '{' ? '}' : ']';
            let depth = 1;
            let j = i + 1;
            let inString = false;
            let escape = false;
            while (j < text.length && depth > 0) {
                const char = text[j];
                if (escape) escape = false;
                else if (char === '\\') escape = true;
                else if (char === '"') inString = !inString;
                else if (!inString) {
                    if (char === startChar) depth++;
                    else if (char === endChar) depth--;
                }
                j++;
            }
            if (depth === 0) {
                const jsonCandidate = text.slice(i, j);
                try {
                    JSON.parse(jsonCandidate);
                    blocks.push({ start: i, end: j, json: jsonCandidate });
                    i = j;
                    continue;
                } catch { }
            }
        }
        i++;
    }
    return blocks;
}

async function runJsonToToon(data: TextData): Promise<TextData> {
    const jsonBlocks = findJsonBlocks(data);
    if (jsonBlocks.length === 0) return data;
    
    let result = data;
    // Processa do fim para o início para não perder os índices
    for (let i = jsonBlocks.length - 1; i >= 0; i--) {
        const block = jsonBlocks[i];
        try {
            const parsed = JSON.parse(block.json);
            const toon = toonEncode(parsed, 2, false); 
            result = result.slice(0, block.start) + toon + result.slice(block.end);
        } catch { }
    }
    return result;
}