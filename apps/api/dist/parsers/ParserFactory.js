export class ParserFactory {
    parsers = [];
    register(parser) {
        this.parsers.push(parser);
    }
    getParser(source) {
        const parser = this.parsers.find(p => p.canHandle(source));
        if (!parser) {
            throw new Error(`No parser found for source: ${source}`);
        }
        return parser;
    }
}
