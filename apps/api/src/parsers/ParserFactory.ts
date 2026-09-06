import type { ITransactionParser } from '../interfaces/index.js';

export class ParserFactory {
  private parsers: ITransactionParser[] = [];

  register(parser: ITransactionParser) {
    this.parsers.push(parser);
  }

  getParser(source: string): ITransactionParser {
    const parser = this.parsers.find(p => p.canHandle(source));
    if (!parser) {
      throw new Error(`No parser found for source: ${source}`);
    }
    return parser;
  }
}
