import {types} from "../../base";

/**
 * Extended version of the database router, necessary for client interactions
 */
export interface MediasoupRouter extends types.DatabaseRouter {
    id: string;
}
