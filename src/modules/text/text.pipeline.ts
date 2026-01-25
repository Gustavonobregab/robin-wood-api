// src/modules/text/text.pipeline.ts

import { Pipeline, Operation } from '../../lib/pipeline';
import { PipelineResult, TextDetails, calculateMetrics } from './text.types';

// Importa a função de formatação do utilitário que criamos em src/lib/toon.ts
import { encode as toonEncode } from '../../lib/toon';

// ==========================================
// TYPES
// ==========================================

export type TextData = string;
export type TextResult = PipelineResult<string, TextDetails>;

// ==========================================
// CLASS
// ==========================================

export class TextPipeline extends Pipeline<TextData, TextResult> {
    private originalSize: number;

    constructor(data: TextData, ops: Operation[] = []) {
        // Passamos a função exec ligada ao contexto this
        super('text', data, ops, (d, o) => this.exec(d, o));
        this.originalSize = data.length;
    }

    /**
     * Operação 'syntax':
     * Realiza limpeza, normalização de espaços e validações.
     * Mapeado para o tipo 'syntax' do model.
     */
    syntax(params: { language?: string; strict?: boolean } = {}): TextPipeline {
        this.add('syntax', params);
        return this;
    }

    /**
     * Operação 'json-to-toon':
     * Converte JSON para o formato TOON (ou customizado).
     * Mapeado para o tipo 'json-to-toon' do model.
     */
    jsonToToon(params: { indent?: number; compact?: boolean } = {}): TextPipeline {
        // Importante: O nome da operação aqui ('json-to-toon') DEVE ser idêntico ao do text.model.ts
        this.add('json-to-toon', params); 
        return this;
    }

    // Função interna que orquestra a execução sequencial
    private async exec(data: TextData, ops: Operation[]): Promise<TextResult> {
        let result = data;
        const appliedOps: string[] = [];

        for (const { name, params } of ops) {
            // Executa cada passo sequencialmente
            result = await TextPipeline.run(result, name, params);
            appliedOps.push(name);
        }

        const finalSize = result.length;

        // Retorna o objeto rico com dados e métricas
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

    // O "Switch" central que decide qual função auxiliar chamar
    private static async run(data: TextData, op: string, params: any): Promise<TextData> {
        switch (op) {
            case 'syntax':
                return runSyntax(data, params.strict);
            
            case 'json-to-toon':
                return runJsonToToon(data, params);
            
            default:
                // Fallback: Se a operação não for reconhecida, retorna o dado intacto.
                // Isso evita quebras se o backend receber uma operação nova que ainda não foi implementada aqui.
                return data;
        }
    }
}

// ==========================================
// FUNÇÕES AUXILIARES (Lógica Pura)
// ==========================================

async function runSyntax(data: TextData, strict: boolean = false): Promise<TextData> {
    // 1. Normalização básica (Trim e colapso de espaços)
    // Transforma quebras de linha e tabs em espaço simples e remove duplicatas
    let processed = data
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // 2. Lógica 'Strict' (Opcional)
    if (strict) {
        // Exemplo: Se o texto ficar vazio após o trim, lança erro em modo estrito
        if (processed.length === 0 && data.length > 0) {
            throw new Error("Syntax Error: Content became empty after processing.");
        }
    }
    
    return processed;
}

async function runJsonToToon(data: TextData, params: any): Promise<TextData> {
    try {
        // Tenta fazer o parse do JSON. Se o texto não for JSON válido, cai no catch.
        const parsed = JSON.parse(data);
        
        // Aplica os defaults definidos no model caso não venham preenchidos
        const indent = params.indent ?? 2;
        const compact = params.compact ?? false;
        
        // Chama a função real importada de src/lib/toon.ts
        return toonEncode(parsed, indent, compact);

    } catch (e) {
        // Se o input não for um JSON válido, ignoramos essa etapa e retornamos o texto original.
        return data; 
    }
}