import { TLogLevelName, logging } from '../lib/logging';

/**
 * This decleration will log the time taken to run the function it is attached to.
 *
 * @export
 * @return {*}
 */
export const logCall = (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const logger = logging.getLogger('taskssql.perf');
    descriptor.value = function (...args: any[]) {
        const startTime = new Date(Date.now());
        const result = originalMethod.apply(this, args);
        const endTime = new Date(Date.now());
        logger.debug(
            `${target?.constructor?.name}:${propertyKey}:called with ${args.length} arguments. Took: ${
                endTime.getTime() - startTime.getTime()
            }ms`,
        );
        return result;
    };

    return descriptor;
};

export function logCallDetails() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const logger = logging.getLogger('taskssql');

        descriptor.value = async function (...args: any[]) {
            const startTime = new Date(Date.now());
            const result = await originalMethod.apply(this, args);
            const endTime = new Date(Date.now());
            const elapsed = endTime.getTime() - startTime.getTime();

            logger.debug(
                `${typeof target}:${propertyKey} called with ${
                    args.length
                } arguments. Took: ${elapsed}ms ${JSON.stringify(args)}`,
            );
            return result;
        };
        return descriptor;
    };
}

// Global log function for the plugin.
export function log(logLevel: TLogLevelName, message: string) {
    const logger = logging.getLogger('taskssql');

    switch (logLevel) {
        case 'trace':
            logger.trace(message);
            break;
        case 'debug':
            logger.debug(message);
            break;
        case 'info':
            logger.info(message);
            break;
        case 'warn':
            logger.warn(message);
            break;
        case 'error':
            logger.error(message);
            break;
        default:
            break;
    }
}
