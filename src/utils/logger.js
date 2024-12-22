import fs from 'fs';
import path from 'path';
import { format } from 'util';

class Logger {
    constructor() {
        this.logsDir = path.join(process.cwd(), 'logs');
        this.logFile = path.join(this.logsDir, 'app.log');
        this.errorFile = path.join(this.logsDir, 'error.log');
        this.initializeLogDirectory();
    }

    initializeLogDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedMessage = args.length ? format(message, ...args) : message;
        return `[${timestamp}] [${level}]: ${formattedMessage}`;
    }

    writeToFile(filePath, message) {
        fs.appendFileSync(filePath, message + '\n');
    }

    info(message, ...args) {
        const formattedMessage = this.formatMessage('INFO', message, ...args);
        console.log(formattedMessage);
        this.writeToFile(this.logFile, formattedMessage);
    }

    error(message, ...args) {
        const formattedMessage = this.formatMessage('ERROR', message, ...args);
        console.error(formattedMessage);
        this.writeToFile(this.errorFile, formattedMessage);
        this.writeToFile(this.logFile, formattedMessage);
    }

    warn(message, ...args) {
        const formattedMessage = this.formatMessage('WARN', message, ...args);
        console.warn(formattedMessage);
        this.writeToFile(this.logFile, formattedMessage);
    }

    debug(message, ...args) {
        if (process.env.NODE_ENV === 'development') {
            const formattedMessage = this.formatMessage('DEBUG', message, ...args);
            console.debug(formattedMessage);
            this.writeToFile(this.logFile, formattedMessage);
        }
    }
}

export const logger = new Logger();