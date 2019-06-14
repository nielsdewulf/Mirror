import spidev


class Mcp:

    def __init__(self, bus=0, device=0):
        self.bus = bus
        self.device = device
        self.spi = spidev.SpiDev()

    def open(self):
        self.spi.open(self.bus, self.device)
        self.spi.max_speed_hz = 10 ** 5

    def read_channel(self, ch):
        ch_map = {0: 0b000, 1: 0b001, 2: 0b010, 3: 0b011, 4: 0b100, 5: 0b101, 6: 0b110, 7: 0b111}
        byte_in = (ch_map[ch] << 4) | 1 << 7
        bytes_read = self.spi.xfer2([1, byte_in, 0])
        full = (bytes_read[1] & 0b11) << 8 | bytes_read[2]
        return full

    def close_bus(self):
        self.spi.close()
