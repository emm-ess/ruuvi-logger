import Influx, {FieldType} from 'influx'

export const MEASUREMENT = 'climate'
export const SCHEMA: Influx.ISchemaOptions = {
    measurement: MEASUREMENT,
    fields: {
        temperature: FieldType.FLOAT,
        humidity: FieldType.FLOAT,
        pressure: FieldType.INTEGER,
        battery: FieldType.INTEGER,
    },
    tags: ['sensor'],
}
