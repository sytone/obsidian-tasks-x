import moment from 'moment';
import { ILogObject, Logger, TLogLevelName, TTransportLogger } from 'tslog';
import 'reflect-metadata';

export function logCallDetails(loggerName?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            log('debug', loggerName, `${typeof target}:${propertyKey} called with ${args.length} arguments`);
            return originalMethod.apply(this, args);
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

export function log(logLevel: TLogLevelName, loggerChildName?: string, ...logArguments: unknown[]) {
    const logger: Logger = new Logger({ name: 'Tasks X', minLevel: 'silly' });
    let finalLogger: Logger = logger;
    if (loggerChildName) {
        finalLogger = logger.getChildLogger({ name: loggerChildName });
    }
    finalLogger.attachTransport(new DebugConsoleTransport(), 'silly');
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
    const bold = 'font-weight: bold;';
    // const lightGrey = 'background: #ebebeb;';

    let logLevel: string = whiteWithBlackText;

    switch (logObject.logLevel.toUpperCase()) {
        case 'DEBUG':
            logLevel = blackWithYellowText;
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