import ruuvi, {RuuviTag, RuuviTagReading} from 'node-ruuvitag'
import type {InfluxDB} from 'influx'

import Logger from './lib/Logger'
import {MEASUREMENT} from './const'

export type RuuviLoggerOptions = {
    allowedTags?: string[]
    influx: InfluxDB
}

export class RuuviLogger {
    private influx: InfluxDB

    private allowedTags?: string[]
    public tags: RuuviTag[] = []

    constructor({allowedTags, influx}: RuuviLoggerOptions) {
        this.allowedTags = allowedTags
        this.influx = influx

        ruuvi.on('found', this.onTag.bind(this))
        ruuvi.on('warning', (message) => {
            console.error(new Error(message))
            Logger.error(message)
        })
    }



    public async start(): Promise<void> {
        ruuvi.start()
        Logger.info('started')
    }

    private onTag(tag: RuuviTag): void {
        const {allowedTags} = this
        Logger.log(`found tag ${tag.id}`)
        if (!(allowedTags?.length) || allowedTags.includes(tag.id)) {
            tag.on('updated', this.getReadingHandler(tag))
            this.tags.push(tag)
            Logger.info(`subscribed to tag ${tag.id}`)
        }
    }

    private getReadingHandler({
        id,
    }: RuuviTag): (reading: RuuviTagReading) => Promise<void> {
        return async ({
            temperature,
            humidity,
            pressure,
            battery,
        }: RuuviTagReading) => {
            Logger.log(`got reading ${id}`)
            await this.influx.writeMeasurement(MEASUREMENT, [
                {
                    tags: {sensor: id},
                    fields: {temperature, humidity, pressure, battery},
                },
            ])
        }
    }
}
