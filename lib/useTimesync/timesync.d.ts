interface Timesync {
    destroy: () => void;
    now: () => number;
    on: (event: string, callback: (v: any) => void) => Object;
    off: (event: string, callback?: (v: any) => void) => Object;
    sync: () => void;
    send: (to: string, data: any, timeout: number) => Promise<void>;
    receive: (from: string, data: any) => void;
}

interface TimesyncOptions {
    delay?: number; // Default 1000
    interval?: number | null;   // Default 360000
    now?: () => number; // Default Date.now
    peers?: string[] | string;  // Default []
    repeat?: number;    // Default 5
    server?: string;    // Default undefined
    timeout?: number;   // Default 10000
}

declare module "timesync" {
    function create(param: TimesyncOptions): Timesync;
}
