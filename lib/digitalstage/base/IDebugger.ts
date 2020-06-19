export interface IDebugger {
    debug(message: string, object?: object | string): void;
    warn(message: string, object?: object | string): void;
    handleError(message: Error, object?: object | string): void;
}
