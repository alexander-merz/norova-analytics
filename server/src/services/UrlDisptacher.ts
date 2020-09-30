import url from 'url';

export class UrlDispatcher {
    constructor() {}
    public static dispatch(uri: string): { endpoint: string, method: string, query: string | null } {
        const queryIndex = uri.indexOf('?') > 0 ? uri.indexOf('?') : uri.length;
        return {
            endpoint: uri.slice(0, uri.lastIndexOf('/')),
            method: uri.slice(uri.lastIndexOf('/') + 1, queryIndex),
            query: url.parse(uri).query
        };
    }
}
