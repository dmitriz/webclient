/**
 * Router
 *
 * Location in realtime database:
 * /routers/{routerId}
 *
 * Read access to all
 */
export interface DatabaseRouter {
    domain: string;
    port: number,
    slotAvailable: number
}
