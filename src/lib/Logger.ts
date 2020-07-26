import fs from 'fs'
import path from 'path'

const LOG_FILE = path.resolve(__dirname, '../../log.txt')

;(() => {
    if (!fs.existsSync(LOG_FILE)) {
        fs.writeFileSync(LOG_FILE, '', {encoding: 'utf-8'})
    }
})()

function writeMsg(msg: string): void {
    fs.appendFileSync(LOG_FILE, `${msg}\n`, {encoding: 'utf-8'})
}

export const enum LogLevel {
    log,
    info,
    warn,
    error,
}

let logLevel = LogLevel.log

export default {
    set logLevel(level: LogLevel) {
        logLevel = level
    },
    get logLevel(): LogLevel {
        return logLevel
    },
    log(msg: string): void {
        logLevel <= LogLevel.log && writeMsg(msg)
    },
    info(msg: string): void {
        logLevel <= LogLevel.info && writeMsg(msg)
    },
    warn(msg: string): void {
        logLevel <= LogLevel.warn && writeMsg(msg)
    },
    error(msg: string): void {
        logLevel <= LogLevel.error && writeMsg(msg)
    },
}
