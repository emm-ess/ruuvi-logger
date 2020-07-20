declare module 'node-ruuvitag' {
    import {EventEmitter} from 'events'

    type EventEmitterHelper<Events extends Record<string, unknown>> = Omit<
        EventEmitter,
        'on'
    > & {
        on: <EventName extends keyof Events>(
            eventName: EventName,
            listener: (value: Events[EventName]) => void,
        ) => void
    }

    type RuuviEvents = {
        found: RuuviTag
        warning: string
    }

    export type Ruuvi = EventEmitterHelper<RuuviEvents> & {
        scanning: boolean
        listenerAttached: boolean
        start: VoidFunction
        stop: VoidFunction
        findTags: () => Promise<RuuviTag[]>
    }

    type RuuviTagEvents = {
        updated: RuuviTagReading
    }

    export type RuuviTag = EventEmitterHelper<RuuviTagEvents> & {
        id: string
        address: string
        addressType: string
        connectable: boolean
    }

    export type RuuviTagReading = {
        dataFormat: 5
        rssi: number
        /** float */
        temperature: number
        /** float */
        humidity: number
        /** int */
        pressure: number
        /** int */
        accelerationX: number
        /** int */
        accelerationY: number
        /** int */
        accelerationZ: number
        /** int */
        battery: number
        /** in data format 5 */
        txPower: number
        /** in data format 5 */
        movementCounter: number
        /** in data format 5 */
        measurementSequenceNumber: number
        /** in data format 5 */
        mac: string
    }

    const ruuvi: Ruuvi
    export default ruuvi
}
