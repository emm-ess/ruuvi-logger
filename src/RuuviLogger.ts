import ruuvi, {RuuviTag, RuuviTagReading} from 'node-ruuvitag'
import {InfluxDB, FieldType} from 'influx'
import type Influx from 'influx'

export type RuuviLoggerOptions = {
    tags: string[]
    influx: Omit<Influx.ISingleHostConfig, 'schema'>
}

const MEASUREMENT = 'climate'
const SCHEMA: Influx.ISchemaOptions = {
    measurement: MEASUREMENT,
    fields: {
        temperature: FieldType.FLOAT,
        humidity: FieldType.FLOAT,
        pressure: FieldType.INTEGER,
        battery: FieldType.INTEGER,
    },
    tags: ['sensor'],
}

const DEFAULT_INFLUX_OPTIONS: Omit<Influx.ISingleHostConfig, 'schema'> = {
    database: 'ruuvi_readings',
}

export class RuuviLogger {
    private options: RuuviLoggerOptions
    private influx: InfluxDB

    constructor(options: RuuviLoggerOptions) {
        this.options = RuuviLogger.parseOptions(options)
        this.influx = new InfluxDB({
            ...options.influx,
            schema: [SCHEMA],
        })

        ruuvi.on('found', this.onTag.bind(this))
        ruuvi.on('warning', (message) => {
            console.error(new Error(message))
        })
    }

    private static parseOptions(
        options: RuuviLoggerOptions,
    ): RuuviLoggerOptions {
        const parsed = Object.assign(
            {
                tags: [],
                influx: {},
            },
            options,
        )
        Object.assign(parsed.influx, DEFAULT_INFLUX_OPTIONS, options.influx)
        return parsed
    }

    private async createDatabase(): Promise<void> {
        const dbName = this.options.influx.database as string
        const dbNames = await this.influx.getDatabaseNames()
        if (!dbNames.includes(dbName)) {
            await this.influx.createDatabase(dbName)
        }
    }

    public async start(): Promise<void> {
        await this.createDatabase()
        ruuvi.start()
    }

    private onTag(tag: RuuviTag): void {
        const {tags} = this.options
        if (!tags.length || tags.includes(tag.address)) {
            tag.on('updated', this.getReadingHandler(tag))
        }
    }

    private getReadingHandler({
        id,
    }: RuuviTag): (reading: RuuviTagReading) => void {
        return ({
            temperature,
            humidity,
            pressure,
            battery,
        }: RuuviTagReading) => {
            this.influx.writeMeasurement(MEASUREMENT, [
                {
                    tags: {sensor: id},
                    fields: {temperature, humidity, pressure, battery},
                },
            ])
        }
    }
}
