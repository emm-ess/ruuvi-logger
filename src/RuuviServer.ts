import path from 'path'
import express from 'express'
import type {InfluxDB, INanoDate} from 'influx'
import type {Request, Response} from 'express'

import {MEASUREMENT} from './const'

type InfluxRuuviEntry = {
    time: INanoDate
    battery: number
    humidity: number
    pressure: number
    temperature: number
    sensor: string
}

type Reading = {
    time: Date
    battery: number
    humidity: number
    pressure: number
    temperature: number
    sensor: string
}


type ErrorResponse = {
    error: Error
}
type MultiResponse<T> = {
    result: Array<T>
}
export type TagsResponse = {
    firstSeen: Date
    lastSeen: Date
    sensor: string
    name?: string
}

// export type PeriodRequest = {}
// export type PeriodResponse = {}

type RuuviServerOptions = {
    sensors: Array<{
        name: string,
        id: string,
    }>,
    influx: InfluxDB,
}

export default class RuuviServer {
    private readonly app = express()
    private readonly influx: InfluxDB
    private readonly sensors: RuuviServerOptions['sensors']

    constructor({sensors, influx}: RuuviServerOptions) {
        this.sensors = sensors
        this.influx = influx
        // for static files
        this.app.use(express.static(path.join(__dirname, 'public')))
        this.buildGetEndpoints({
            'tags/': this.handleTags.bind(this),
            'tags/:tagId': this.handleTag.bind(this),
            'last/': this.handleLastReadings.bind(this),
            'last/:tagId': this.handleLastReading.bind(this),
        })
    }

    public start(): void {
        const port = 8080
        this.app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
    }

    private buildGetEndpoints(endpoints: {[path: string]: (req: Request<any>, res: Response<any>) => Promise<void> | void}) {
        Object.entries(endpoints).forEach(([path, func]) => {
            const wrapperFunc = async (req: Request, res: Response) => {
                try {
                    await func(req, res)
                }
                catch (error) {
                    console.error(error)
                    res.status(500)
                }
            }
            this.app.get(`/api/${path}`, wrapperFunc)
        })
    }

    private getWhereClause({params: {tagId}}: Request<{tagId: string}>): string {
        return tagId
            ? `WHERE "sensor"='${tagId}'`
            : ''
    }

    private async handleTags(req: Request, res: Response<ErrorResponse | MultiResponse<TagsResponse>>): Promise<void> {
        const first = await this.influx.query<InfluxRuuviEntry>(`SELECT * FROM ${MEASUREMENT} GROUP BY * ORDER BY ASC LIMIT 1`)
        const last = await this.influx.query<InfluxRuuviEntry>(`SELECT * FROM ${MEASUREMENT} GROUP BY * ORDER BY DESC LIMIT 1`)
        const result = first.map(({time, sensor}) => {
            const name = this.sensors.find(({id}) => id === sensor)?.name
            const result: TagsResponse = {
                firstSeen: time,
                lastSeen: (last.find((reading) => reading.sensor === sensor) as InfluxRuuviEntry).time,
                sensor,
            }
            name && (result.name = name)
            return result
        })
        res.json({result})
    }

    private async handleTag(req: Request<{tagId: string}>, res: Response<ErrorResponse | TagsResponse>): Promise<void> {
        const where = this.getWhereClause(req)
        const first = await this.influx.query<InfluxRuuviEntry>(`SELECT * FROM ${MEASUREMENT} ${where} GROUP BY * ORDER BY ASC LIMIT 1`)
        const last = await this.influx.query<InfluxRuuviEntry>(`SELECT * FROM ${MEASUREMENT} ${where} GROUP BY * ORDER BY DESC LIMIT 1`)

        if (first.length !== 1 || last.length !== 1) {
            res.status(500)
            return
        }
        const sensor = first[0].sensor
        const name = this.sensors.find(({id}) => id === sensor)?.name
        const result: TagsResponse = {
            firstSeen: first[0].time,
            lastSeen: last[0].time,
            sensor,
        }
        name && (result.name = name)
        res.json(result)
    }

    private async handleLastReadings(req: Request, res: Response<ErrorResponse | MultiResponse<Reading>>): Promise<void> {
        const result = await this.influx.query<InfluxRuuviEntry>(`SELECT * FROM ${MEASUREMENT} GROUP BY * ORDER BY DESC LIMIT 1`)
        res.json({result})
    }

    private async handleLastReading(req: Request<{tagId: string}>, res: Response<ErrorResponse | Reading>): Promise<void> {
        const where = this.getWhereClause(req)
        const result = await this.influx.query<InfluxRuuviEntry>(`SELECT * FROM ${MEASUREMENT} ${where} GROUP BY * ORDER BY DESC LIMIT 1`)

        if (result.length !== 1) {
            res.status(500)
            return
        }

        res.json(result[0])
    }
}
