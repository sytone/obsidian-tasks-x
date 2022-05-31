import moment from 'moment';
import { ILogObject, Logger, TLogLevelName, TTransportLogger } from 'tslog';
import 'reflect-metadata';

import { Platform, Plugin } from 'obsidian';

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

/**
 * Writes TSLog Pretty Print messages to the vscode debug console. It requires the logger during construction to import
 * its pretty print preferences
 *
 * @class DebugConsoleTransport
 * @implements {TTransportLogger<(ILogObject) => void>}
 */
class DebugConsoleTransport implements TTransportLogger<(logObject: ILogObject) => void> {
    silly = this.log;
    debug = this.log;
    trace = this.log;
    info = this.log;
    warn = this.log;
    error = this.log;
    fatal = this.log;
    // private readonly debugConsoleOutput = new DebugConsoleOutput();
    constructor() {}
    log(logObject: ILogObject): void {
        logToDebugConsole(logObject);
        // this.logger.printPrettyLog(this.debugConsoleOutput, logObject);
    }
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
            `${target?.constructor?.name}:${propertyKey}`,
            `called with ${args.length} arguments. Took: ${endTime.getTime() - startTime.getTime()}ms`,
            // JSON.stringify(args),
        );
        return result;
    };

    return descriptor;
};

export function logCallDetails(loggerName?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            const startTime = new Date(Date.now());
            const result = await originalMethod.apply(this, args);
            const endTime = new Date(Date.now());
            const elapsed = endTime.getTime() - startTime.getTime();

            log(
                'silly',
                loggerName,
                `${typeof target}:${propertyKey} called with ${args.length} arguments. Took: ${elapsed}ms`,
                JSON.stringify(args),
            );
            return result;
        };
        return descriptor;
    };
}

// export function loggingAliases<T extends { new (...args: any[]): {} }>(loggerName: string) {
//     return (target: T) => {
//         Reflect.defineMetadata('TasksLoggerName', loggerName, target);
//         return class extends target {};
//     };
// }

export function loggingAliases(loggerName: string) {
    return (constructor: Function) => {
        Reflect.defineMetadata('TasksLoggerName', loggerName, constructor);
    };
}

const logger: Logger = new Logger({ name: 'Tasks X', minLevel: 'silly' });
logger.attachTransport(new DebugConsoleTransport(), 'silly');

export function log(logLevel: TLogLevelName, loggerChildName?: string, ...logArguments: unknown[]) {
    let finalLogger: Logger = logger;
    if (loggerChildName !== undefined) {
        finalLogger = logger.getChildLogger({ name: loggerChildName });
    }
    //finalLogger.attachTransport(new DebugConsoleTransport(), 'silly');
    switch (logLevel) {
        case 'silly':
            finalLogger.silly(logArguments);
            break;
        case 'trace':
            finalLogger.trace(logArguments);
            break;
        case 'debug':
            finalLogger.debug(logArguments);
            break;
        case 'info':
            finalLogger.info(logArguments);
            break;
        case 'warn':
            finalLogger.warn(logArguments);
            break;
        case 'error':
            finalLogger.error(logArguments);
            break;
        case 'fatal':
            finalLogger.fatal(logArguments);
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

function logToDebugConsole(logObject: ILogObject) {
    const blackWithYellowText = 'background: #222; color: #bada55;';
    const whiteWithBlackText = 'background: #fff; color: #000;';
    const whiteWithPurpleText = 'background: #ccc; color: #663399;';
    const bold = 'font-weight: bold;';
    // const lightGrey = 'background: #ebebeb;';

    let logLevel: string = whiteWithBlackText;

    switch (logObject.logLevel.toUpperCase()) {
        case 'DEBUG':
            logLevel = blackWithYellowText;
            break;
        case 'SILLY':
            logLevel = whiteWithPurpleText;
            break;
    }
    console.log(
        `%c[${moment().format('YYYYMMDD hh:mm:ss')}]%c[${logObject.logLevel.toUpperCase()}]%c[${
            logObject.loggerName
        }] ${logObject.argumentsArray.join(',')}`,
        bold,
        logLevel,
        whiteWithBlackText,
    );
    // transportLogs.push(logObject);
}
