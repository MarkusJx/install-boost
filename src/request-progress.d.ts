declare module 'request-progress' {
    import { Request } from 'request';
    import * as stream from 'stream';
    import * as http from 'http';
    import * as net from 'net';

    interface Progress extends Request {
        on(event: string, listener: (...args: any[]) => void): this;
        on(
            event: 'progress',
            listener: (state: Record<string, any>) => void
        ): void;
        on(event: 'request', listener: (req: http.ClientRequest) => void): this;
        on(event: 'response', listener: (resp: Response) => void): this;
        on(event: 'data', listener: (data: Buffer | string) => void): this;
        on(event: 'error', listener: (e: Error) => void): this;
        on(
            event: 'complete',
            listener: (resp: Response, body?: string | Buffer) => void
        ): this;
        on(event: 'pipe', listener: (src: stream.Readable) => void): this;
        on(event: 'socket', listener: (src: net.Socket) => void): this;
    }

    function progress(request: Request): Progress;
    export = progress;
}
