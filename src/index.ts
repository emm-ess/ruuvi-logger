import fs from 'fs'
import path from 'path'
import type {ISingleHostConfig} from 'influx'
import {RuuviLogger} from './RuuviLogger'

type Config = {
    tags: Record<string, string>
    influx: Omit<ISingleHostConfig, 'schema'>
}

async function main() {
    const filePath = path.resolve(__dirname, '../config/config.json')
    const fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'})
    const config = JSON.parse(fileContent) as Config
    const loggerConfig = {
        tags: Object.values(config.tags),
        influx: config.influx,
    }
    const logger = new RuuviLogger(loggerConfig)
    logger.start()
}

main()
