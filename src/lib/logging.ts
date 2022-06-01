import { EventEmitter2 } from 'eventemitter2';
/*
 * EventEmitter2 is an implementation of the EventEmitter module found in Node.js.
 * In addition to having a better benchmark performance than EventEmitter and being
 * browser-compatible, it also extends the interface of EventEmitter with many
 * additional non-breaking features.
 *
 * This has been added as EventEmitter in Node.JS is not available in the browser.
 * https://www.npmjs.com/package/eventemitter2
 */
import { Platform, Plugin } from 'obsidian';

/**
 * All possible log levels
 * @public
 */
export interface ILogLevel {
    1: 'trace';
    2: 'debug';
    3: 'info';
    4: 'warn';
    5: 'error';
}

/**
 * Log level IDs (1 - 5)
 * @public
 */
export type TLogLevelId = keyof ILogLevel;

/**
 * Log level names (trace - error)
 * @public
 */
export type TLogLevelName = ILogLevel[TLogLevelId];

export class LogManager extends EventEmitter2 {
    private options: LogOptions = {
        minLevels: {
            '': 'info',
        },
    };

    // Prevent the console logger from being added twice
    private consoleLoggerRegistered: boolean = false;

    public configure(options: LogOptions): LogManager {
        this.options = Object.assign({}, this.options, options);
        return this;
    }

    public getLogger(module: string): Logger {
        let minLevel = 'none';
        let match = '';

        for (const key in this.options.minLevels) {
            if (module.startsWith(key) && key.length >= match.length) {
                minLevel = this.options.minLevels[key];
                match = key;
            }
        }

        return new Logger(this, module, minLevel);
    }

    public onLogEntry(listener: (logEntry: LogEntry) => void): LogManager {
        this.on('log', listener);
        return this;
    }

    public registerConsoleLogger(): LogManager {
        if (this.consoleLoggerRegistered) return this;

        this.onLogEntry((logEntry) => {
            const msg = `[${logEntry.module}] ${logEntry.message}`;
            switch (logEntry.level) {
                case 'trace':
                    console.trace(msg);
                    break;
                case 'debug':
                    console.debug(msg);
                    break;
                case 'info':
                    console.info(msg);
                    break;
                case 'warn':
                    console.warn(msg);
                    break;
                case 'error':
                    console.error(msg);
                    break;
                default:
                    console.log(`{${logEntry.level}} ${msg}`);
            }
        });

        this.consoleLoggerRegistered = true;
        return this;
    }
}

export interface LogEntry {
    level: string;
    module: string;
    location?: string;
    message: string;
}

export interface LogOptions {
    minLevels: { [module: string]: string };
}

export const logging = new LogManager();

export class Logger {
    private logManager: EventEmitter2;
    private minLevel: number;
    private module: string;
    private readonly levels: { [key: string]: number } = {
        trace: 1,
        debug: 2,
        info: 3,
        warn: 4,
        error: 5,
    };

    constructor(logManager: EventEmitter2, module: string, minLevel: string) {
        this.logManager = logManager;
        this.module = module;
        this.minLevel = this.levelToInt(minLevel);
    }

    /**
     * Converts a string level (trace/debug/info/warn/error) into a number
     *
     * @param minLevel
     */
    private levelToInt(minLevel: string): number {
        if (minLevel.toLowerCase() in this.levels) return this.levels[minLevel.toLowerCase()];
        else return 99;
    }

    /**
     * Central logging method.
     * @param logLevel
     * @param message
     */
    public log(logLevel: string, message: string): void {
        const level = this.levelToInt(logLevel);
        if (level < this.minLevel) return;

        const logEntry: LogEntry = { level: logLevel, module: this.module, message };

        // Obtain the line/file through a thoroughly hacky method
        // This creates a new stack trace and pulls the caller from it.  If the caller
        // if .trace()
        const error = new Error('');
        if (error.stack) {
            const cla = error.stack.split('\n');
            let idx = 1;
            while (idx < cla.length && cla[idx].includes('at Logger.Object.')) idx++;
            if (idx < cla.length) {
                logEntry.location = cla[idx].slice(cla[idx].indexOf('at ') + 3, cla[idx].length);
            }
        }

        this.logManager.emit('log', logEntry);
    }

    public trace(message: string): void {
        this.log('trace', message);
    }
    public debug(message: string): void {
        this.log('debug', message);
    }
    public info(message: string): void {
        this.log('info', message);
    }
    public warn(message: string): void {
        this.log('warn', message);
    }
    public error(message: string): void {
        this.log('error', message);
    }
}

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
