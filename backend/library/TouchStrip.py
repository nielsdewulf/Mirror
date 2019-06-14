from threading import Thread
from library import Mcp3008


class TouchStrip(Thread):
    def __init__(self, callback1, callback2, conn):
        Thread.__init__(self)
        self.daemon = True
        self.conn = conn
        self.sensor_id = self.conn.get_data('select * from sensor where sensor =\"touchstrip\"')
        if not self.sensor_id:
            self.sensor_id = self.conn.set_data('insert into sensor values (NULL,\'touchstrip\')')
        else:
            self.sensor_id = self.sensor_id[0]['idsensor']
        self.mcp = Mcp3008.Mcp()
        self.mcp.open()
        self.position = 0
        # self.socket = socket
        self.callback_choosing = callback1
        self.callback_reading = callback2
        self.touching = False
        self.last_action = False
        self.last_send = 0
        self.position_array = []
        self.sums = 0
        self.send_input = 0
        self.starting_pos = 0
        self.last_avg = 0
        self.avg = 0
        self.start()

    def run(self):
        while True:
            self.position = int(self.mcp.read_channel(0) / 1024 * 100)

            self.position_array.append(self.position)
            if len(self.position_array) > 12:
                self.sums = 0
                self.max = 0
                self.starting_pos = self.position_array[len(self.position_array) - 12]
                for pos in self.position_array[-12:]:
                    self.sums += pos
                    self.max = abs(pos - self.starting_pos) if abs(pos - self.starting_pos) > self.max else self.max
                self.avg = int(self.sums / 12)
                self.send_input = self.max <= 2
                if self.position and self.send_input:

                    if self.last_avg is not self.avg:
                        if self.last_action is not True:
                            print('CHOOSING')
                            self.callback_choosing(True)
                            self.last_action = True
                        self.callback_reading(self.avg)
                        Thread(
                            target=self.save_touchstrip).start()
                        print("Current position {}".format(self.avg))
                else:
                    if self.last_avg is not self.avg:
                        if self.last_action is not False:
                            print('--------NOT CHOOSING')
                            self.callback_choosing(False)
                            self.last_action = False
                self.last_avg = self.avg
                # time.sleep(.005)

    def save_touchstrip(self):
        self.conn.set_data('insert into history values (NULL,%s,UTC_TIMESTAMP,%s,NULL)',
                           [self.sensor_id, self.avg])
