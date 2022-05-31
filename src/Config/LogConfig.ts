import { Platform, Plugin } from 'obsidian';
import { TLogLevelName, logging } from '../lib/logging';

const logger = logging.getLogger('core.module-name');

// Later on
logger.info('This is my log message');

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

    descriptor.value = function (...args: any[]) {
        const startTime = new Date(Date.now());
        const result = originalMethod.apply(this, args);
        const endTime = new Date(Date.now());
        log(
            'silly',
            `${target?.constructor?.name}:${propertyKey}:called with ${args.length} arguments. Took: ${
                endTime.getTime() - startTime.getTime()
            }ms`,
            // JSON.stringify(args),
        );
        return result;
    };

    return descriptor;
};

export function logCallDetails() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            const startTime = new Date(Date.now());
            const result = await originalMethod.apply(this, args);
            const endTime = new Date(Date.now());
            const elapsed = endTime.getTime() - startTime.getTime();

            log(
                'silly',
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
    const finalLogger = logger;
    //finalLogger.attachTransport(new DebugConsoleTransport(), 'silly');
    switch (logLevel) {
        case 'silly':
            finalLogger.trace(message);
            break;
        case 'trace':
            finalLogger.trace(message);
            break;
        case 'debug':
            finalLogger.debug(message);
            break;
        case 'info':
            finalLogger.info(message);
            break;
        case 'warn':
            finalLogger.warn(message);
            break;
        case 'error':
            finalLogger.error(message);
            break;
        case 'fatal':
            finalLogger.error(message);
            break;
        default:
            break;
    }
}

// class DebugConsoleOutput implements IStd {
//     write(message: string) {
//         console.log(message);
//     }
// }

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
