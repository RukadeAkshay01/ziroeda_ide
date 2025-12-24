/**
 * Interface for I2C/TWI Peripheral Simulation
 */
export interface I2CDevice {
    /**
     * Called when the master attempts to connect to a slave address.
     * @param addr The 7-bit address.
     * @param write True if master wants to write, False if read.
     * @returns True if the device acknowledges (ACK), False otherwise (NACK).
     */
    connect(addr: number, write: boolean): boolean;

    /**
     * Called when a Start condition is detected (including Repeated Start).
     */
    start(): void;

    /**
     * Called when the master writes a byte to the slave.
     * @param byte The byte value (0-255).
     * @returns True for ACK, False for NACK.
     */
    writeByte(byte: number): boolean;

    /**
     * Called when the master reads a byte from the slave.
     * @param ack True if the master ACKed the previous byte (meaning it wants more), False for NACK (last byte).
     * @returns The byte value to send to master.
     */
    readByte(ack: boolean): number;
}
