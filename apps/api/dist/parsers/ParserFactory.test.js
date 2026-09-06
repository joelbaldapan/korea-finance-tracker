import { describe, it, expect } from 'vitest';
import { ParserFactory } from './ParserFactory.js';
import { MariBankParser } from './MariBankParser.js';
describe('ParserFactory', () => {
    it('should return registered parser', () => {
        const factory = new ParserFactory();
        factory.register(new MariBankParser());
        const parser = factory.getParser('maribank');
        expect(parser).toBeInstanceOf(MariBankParser);
    });
    it('should throw if no parser found', () => {
        const factory = new ParserFactory();
        expect(() => factory.getParser('unknown')).toThrow('No parser found for source: unknown');
    });
});
