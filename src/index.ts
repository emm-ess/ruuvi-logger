import fs from 'fs'
import path from 'path'
import type {ISingleHostConfig} from 'influx'
import {RuuviLogger} from './RuuviLogger'
import Influx, {InfluxDB} from 'influx'
import Logger from './lib/Logger'
import RuuviServer from './RuuviServer'

import {SCHEMA} from './const'

type Config = {
    tags: Record<string, string>
    influx: Omit<ISingleHostConfig, 'schema'>
}

async function createDatabase(config: Omit<ISingleHostConfig, 'schema'>): Promise<InfluxDB> {
    const DEFAULT_INFLUX_OPTIONS: Influx.ISingleHostConfig = {
        database: 'ruuvi_readings',
        schema: [SCHEMA],
    }

    const options = Object.assign({}, DEFAULT_INFLUX_OPTIONS, config)
    const dbName = options.database as string
    const influx = new InfluxDB(options)

    const dbNames = await influx.getDatabaseNames()
    if (!dbNames.includes(dbName)) {
        await influx.createDatabase(dbName)
        Logger.info('database created')
    }
    return influx
}

async function main() {
    const filePath = path.resolve(__dirname, '../config/config.json')
    const fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'})
    const config = JSON.parse(fileContent) as Config
    const configTags = config.tags
    const allowedTags = Object.values(configTags)
    const sensors = Object.entries(configTags).map(([name, id]) => ({name, id}))

    const influx = await createDatabase(config.influx)
    const logger = new RuuviLogger({allowedTags, influx})
    const server = new RuuviServer({sensors, influx})
    logger.start()
    server.start()
}

main()
