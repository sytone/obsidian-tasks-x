import { Platform, Plugin } from 'obsidian';
import { TLogLevelName, logging } from '../lib/logging';

// Call this method inside your plugin's `onLoad` function
export function monkeyPatchConsole(plugin: Plugin) {
    if (!Platform.isMobile) {
        return;
    }

    const logFile = `${plugin.manifest.dir}/tasks-sql-logs.txt`;
    const logs: string[] = [];
    const logMessages =
        (prefix: string) =>
        (...messages: unknown[]) => {
            logs.push(`\n[${prefix}]`);
            for (const message of messages) {
                logs.push(String(message));
            }
            plugin.app.vault.adapter.write(logFile, logs.join(' '));
        };

    console.debug = logMessages('debug');
    console.error = logMessages('error');
    console.info = logMessages('info');
    console.log = logMessages('log');
    console.warn = logMessages('warn');
}

// export const logCall = (category: string) => (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
export const logCall = (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const logger = logging.getLogger('taskssql');
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

// Setup the logger for the plugin.
export function log(logLevel: TLogLevelName, message: string) {
    const logger = logging.getLogger('taskssql');

    switch (logLevel) {
        case 'silly':
            logger.debug(message);
            break;
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
        case 'fatal':
            logger.error(message);
            break;
        default:
            break;
    }
}

// function logToDebugConsole(logObject: ILogObject) {
//     const blackWithYellowText = 'background: #222; color: #bada55;';
//     const whiteWithBlackText = 'background: #fff; color: #000;';
//     const whiteWithPurpleText = 'background: #ccc; color: #663399;';
//     const bold = 'font-weight: bold;';
//     // const lightGrey = 'background: #ebebeb;';

//     let logLevel: string = whiteWithBlackText;

//     switch (logObject.logLevel.toUpperCase()) {
//         case 'DEBUG':
//             logLevel = blackWithYellowText;
//             break;
//         case 'SILLY':
//             logLevel = whiteWithPurpleText;
//             break;
//     }
//     console.log(
//         `%c[${moment().format('YYYYMMDD hh:mm:ss')}]%c[${logObject.logLevel.toUpperCase()}]%c[${
//             logObject.loggerName
//         }] ${logObject.argumentsArray.join(',')}`,
//         bold,
//         logLevel,
//         whiteWithBlackText,
//     );
//     // transportLogs.push(logObject);
// }
