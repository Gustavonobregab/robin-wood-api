// src/lib/pipeline.ts

export interface Operation {
  name: string;
  params: any;
}

export interface PipelineResult<TData, TDetails> {
  data: TData;
  metrics: {
    [key: string]: any; // Permite métricas flexíveis (bytes, caracteres, porcentagem)
  };
  details: TDetails;
  operations: string[];
}

export abstract class Pipeline<TData, TResult> {
  protected ops: Operation[] = [];

  constructor(
    public readonly type: string,
    protected initialData: TData,
    initialOps: Operation[] = [],
    protected executor: (data: TData, ops: Operation[]) => Promise<TResult>
  ) {
    this.ops = [...initialOps];
  }

  // Adiciona uma operação à fila e retorna uma nova instância (Imutabilidade/Builder)
  protected add(name: string, params: any): Pipeline<TData, TResult> {
    this.ops.push({ name, params });
    return this;
  }

  // Método público para disparar o processamento
  public async execute(): Promise<TResult> {
    return this.executor(this.initialData, this.ops);
  }
}