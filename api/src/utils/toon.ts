export function encode(data: any, indent: number = 2, compact: boolean = false): string {
  if (compact) {
    return JSON.stringify(data);
  }
  
  return JSON.stringify(data, null, indent);
}

export function decode(data: string): any {
  return JSON.parse(data);
}
