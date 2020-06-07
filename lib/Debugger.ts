import * as Sentry from "@sentry/browser";
import {Severity} from "@sentry/types/dist/severity";

export const debug = function (msg, object?: object) {
    if ("production" !== process.env.NODE_ENV) {
        if (object)
            console.log("[" + object.constructor.name + "] " + msg);
        else
            console.log(msg);
    } else {
        //Sentry.captureMessage(object ? "[" + object.constructor.name + "]" + msg : "" + msg, Severity.Debug);
    }
}

export const warn = function (msg, object?: object) {
    if ("production" !== process.env.NODE_ENV) {
        if (object)
            console.warn("[" + object.constructor.name + "] " + msg);
        else
            console.warn(msg);
    } else {
        Sentry.captureMessage(object ? "[" + object.constructor.name + "]" + msg : "" + msg, Severity.Warning);
    }
}


export const handleError = function(error: Error, object?: object) {
    if ("production" !== process.env.NODE_ENV) {
        if (object)
            console.error("[" + object.constructor.name + "] " + error.message);
        else
            console.error(error.message);
    } else {
        Sentry.captureException(error);
    }
}
