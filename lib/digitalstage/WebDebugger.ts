import * as Sentry from "@sentry/browser";
import {Severity} from "@sentry/types/dist/severity";
import {IDebugger} from "./base";

export class WebDebugger implements IDebugger {
    debug(msg: string, object?: object | string) {
        if ("production" !== process.env.NODE_ENV) {
            if (object) {
                if (typeof object === "string") {
                    console.log("[" + object + "] " + msg);
                } else {
                    console.log("[" + object.constructor.name + "] " + msg);
                }
            } else {
                console.log(msg);
            }
        } else {
            //Sentry.captureMessage(object ? "[" + object.constructor.name + "]" + msg : "" + msg, Severity.Debug);
        }
    }

    warn(msg: string, object?: object | string) {
        if ("production" !== process.env.NODE_ENV) {
            if (object) {
                if (typeof object === "string") {
                    console.warn("[" + object + "] " + msg);
                } else {
                    console.warn("[" + object.constructor.name + "] " + msg);
                }
            } else {
                console.warn(msg);
            }
        } else {
            Sentry.captureMessage(object ? "[" + object.constructor.name + "]" + msg : "" + msg, Severity.Warning);
        }
    }


    handleError(error: Error, object?: object | string) {
        if ("production" !== process.env.NODE_ENV) {
            if (object) {
                if (typeof object === "string") {
                    console.error("[" + object + "] " + error.message);
                } else {
                    console.error("[" + object.constructor.name + "] " + error.message);
                }
            } else {
                console.error(error.message, error);
            }
        } else {
            Sentry.captureException(error);
        }
    }
}
