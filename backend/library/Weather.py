from threading import Thread
import threading
import time
import requests
import glob


class Weather(Thread):
    def __init__(self, conn, key, socket):
        Thread.__init__(self)
        self.socket = socket
        self.daemon = True
        self.conn = conn
        self.last_cached = 0
        self.last_cached_inside = 0
        self.darkskykey = key
        self.cache = {}
        self.timezone = ''
        self.sensor_id = self.conn.get_data('select * from sensor where sensor =\"temperatuur\"')
        self.lat, self.long = 50.824683, 3.249550
        self.get_location()
        self.start()

    def run(self):
        if not self.sensor_id:
            self.sensor_id = self.conn.set_data('insert into sensor values (NULL,\'temperatuur\')')
        else:
            self.sensor_id = self.sensor_id[0]['idsensor']
        while True:
            if time.time() - self.last_cached_inside > 30:
                self.load_inside()
                self.last_cached_inside = time.time()

            if time.time() - self.last_cached > 450:
                print('Getting cached weather')
                self.last_cached = time.time()
                self.load_weather()

    def get_weather(self):
        return self.cache

    def load_inside(self):
        base_dir = "/sys/bus/w1/devices/w1_bus_master1/"
        path = glob.glob(base_dir + '28*')[0]
        file = open('{}/w1_slave'.format(path))
        result = float(file.readlines()[1].split("t=")[-1]) / 1000
        if result > 50:
            file.close()
            file = open('{}/w1_slave'.format(path))
            result = float(file.readlines()[1].split("t=")[-1]) / 1000

        self.socket.emit('tempUpdate', {'temp': result})
        self.cache['inside_temperature'] = result
        threading.Thread(
            target=self.save_weather).start()

    def load_weather(self):
        data = requests.get(
            'https://api.darksky.net/forecast/{}/{},{}?units=auto&exclude=[minutely,alerts,flags]'.format(
                self.darkskykey, self.lat, self.long)).json()
        print('Saving Temp')

        self.cache['weather'] = data
        threading.Thread(
            target=self.save_weather).start()

    def save_weather(self):
        self.conn.set_data('insert into history values (NULL,%s,UTC_TIMESTAMP,%s,NULL)',
                           [self.sensor_id, self.cache['inside_temperature']])

    def get_history(self):
        return self.conn.get_data(
            'select * from history where idsensor = %s and datetime > (UTC_TIMESTAMP - interval 24 hour)',
            [self.sensor_id])

    def get_timezone(self):
        return self.cache['weather']['timezone']

    def get_location(self):
        loc = self.conn.get_data('select * from settings where name IN ("longitude","latitude")')
        if loc:
            long, lat = 0, 0
            for val in loc:
                if val['name'] == 'longitude':
                    long = val['value']
                if val['name'] == 'latitude':
                    lat = val['value']

            self.long = long
            self.lat = lat
        else:
            lat, long = 50.824683, 3.249550
            self.conn.set_data('insert into settings values (NULL,"longitude",%s)', [long])
            self.conn.set_data('insert into settings values (NULL,"latitude",%s)', [lat])
