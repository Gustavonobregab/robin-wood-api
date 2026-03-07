import type { TextOperationHandler } from '../types';

const DICTIONARIES: Record<string, Record<string, string>> = {
  EN: {
    'because': 'bc',
    'before': 'b4',
    'between': 'btw',
    'could': 'cld',
    'would': 'wld',
    'should': 'shld',
    'through': 'thru',
    'without': 'w/o',
    'with': 'w/',
    'about': 'abt',
    'people': 'ppl',
    'something': 'sth',
    'information': 'info',
    'development': 'dev',
    'environment': 'env',
    'application': 'app',
    'configuration': 'config',
    'function': 'fn',
    'message': 'msg',
    'number': 'num',
    'string': 'str',
    'value': 'val',
    'return': 'ret',
    'response': 'res',
    'request': 'req',
  },
  PT: {
    'porque': 'pq',
    'também': 'tb',
    'quando': 'qdo',
    'quantidade': 'qtd',
    'obrigado': 'obg',
    'exemplo': 'ex',
    'necessário': 'nec',
    'desenvolvimento': 'dev',
    'configuração': 'config',
    'aplicação': 'app',
    'função': 'fn',
    'mensagem': 'msg',
    'número': 'num',
    'valor': 'val',
    'resposta': 'res',
    'requisição': 'req',
  },
};

export const shorten: TextOperationHandler<'shorten'> = {
  type: 'shorten',

  async process(input, params) {
    const dict = DICTIONARIES[params.lang] ?? DICTIONARIES['EN'];
    let result = input;

    // Sort by length descending to replace longer matches first
    const entries = Object.entries(dict).sort((a, b) => b[0].length - a[0].length);

    for (const [word, replacement] of entries) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      result = result.replace(regex, replacement);
    }

    return result;
  },
};
