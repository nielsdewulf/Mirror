from RPi import GPIO
import threading


class Motionsensor:
    def __init__(self, pin, socket, conn):
        self.conn = conn
        self.socket = socket
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
        self.motion = False
        self.sensor_id = self.conn.get_data('select * from sensor where sensor =\"motionsensor\"')
        if not self.sensor_id:
            self.sensor_id = self.conn.set_data('insert into sensor values (NULL,\'motionsensor\')')
        else:
            self.sensor_id = self.sensor_id[0]['idsensor']
        GPIO.add_event_detect(pin, GPIO.RISING, self.motion_detect)

    def motion_detect(self, pin):
        self.socket.emit('motion')

        threading.Thread(target=self.save_motion).start()
        print('Motion {}'.format(GPIO.input(pin)))

    def save_motion(self):
        self.conn.set_data('insert into history values (NULL,%s,UTC_TIMESTAMP,%s,NULL)',
                           [self.sensor_id, 1])
