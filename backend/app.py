from flask import Flask, jsonify, redirect, request
from library import GoogleToken, Database, DNS, TouchStrip, Alarm, Motionsensor, Calendar, Weather, OSSignals
from flask_cors import CORS
import requests
import configparser
import pickle
from flask_socketio import SocketIO
from flask_talisman import Talisman
from threading import Lock
import os
import json
import logging

rootpath = os.path.dirname(os.path.realpath(__file__))

log = logging.basicConfig(level=logging.DEBUG, filename='{}/log.txt'.format(rootpath))
# Load Config
async_mode = 'gevent'

config = configparser.ConfigParser(allow_no_value=True)
path = os.path.abspath("{}/resources/config.ini".format(rootpath))
# raise ValueError(os.getcwd() + ' PATH:' + path)

print(path)
config.read(path)

app = Flask(__name__)
CORS(app)
Talisman(app)

app.config['SECRET_KEY'] = 'Secret!'

dns = DNS.DNS(config.getboolean('googlecalendar', 'enable'),
              config.get('cloudflare', 'email'),
              config.get('cloudflare', 'key'),
              config.get('domain', 'domain'),
              config.get('domain', 'subdomain'))


def get_ip():
    locip = ""
    protocol = ""
    if config.getboolean('googlecalendar', 'enable'):
        if config.get('domain', 'subdomain'):
            locip = '{}.{}'.format(dns.subdomain, dns.domain)
            protocol = "https"
        else:
            locip = '{}'.format(dns.domain)
            protocol = "https"

    else:
        locip = dns.local_ip
        protocol = "http"

    fi = open(file='/var/www/html/connection', mode='w+')
    js = json.dumps({"domain": locip, "protocol": protocol})
    fi.write(js)
    fi.close()


get_ip()

socketio = SocketIO(app, async_mode=async_mode, logging=True, ping_interval=10)
sign = OSSignals.OSSignals(socketio)

# conn = Database.Database(app, 'funergydev', '7kMr!TjS#7tW', 'project', '10.8.0.1')
conn = Database.Database(app, 'mirror', 'mirror', 'mirror')
motion = Motionsensor.Motionsensor(26, socketio, conn)
last_touchstrip_action = 0
speaker = Alarm.Alarm(rootpath)

thread = None
thread_lock = Lock()

touch_pos = 0
touch_choosing = False
touch_update = False

cal = Calendar.Calendar(conn, config.getboolean('googlecalendar', 'enable'))
weather = Weather.Weather(conn, config.get('darksky', 'key'),socketio)


def background_thread():
    global touch_pos, touch_choosing, touch_update
    while True:
        socketio.sleep(.03)

        if touch_update:
            socketio.emit("read", {"data": touch_pos})
            socketio.emit("choosing", {"data": touch_choosing})
            touch_update = False


def send_touchstrip(pos):
    global touch_pos, touch_update
    touch_pos = pos
    touch_update = True
    # conn.set_data()
    # with app.app_context():
    #     socketio.emit("read", {"data": pos})


def send_choosing(choosing):
    global touch_choosing, touch_update
    touch_choosing = choosing
    touch_update = True


touchstrip = TouchStrip.TouchStrip(send_choosing, send_touchstrip, conn)


@socketio.on('connect')
def test_connect():
    # print('client connected===========================================')
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(background_thread)

    # if config.getboolean('googlecalendar', 'enable'):
    #     if config.get('domain', 'subdomain'):
    #         socketio.emit('ip', {'data': '{}.{}'.format(dns.subdomain, dns.domain)})
    #     else:
    #         socketio.emit('ip', {'data': '{}'.format(dns.domain)})
    # else:
    #     socketio.emit('ip', {'data': dns.local_ip})


@socketio.on('user')
def user_session_update(data):
    # print(data)
    conn.set_data('insert into history values (NULL,NULL,UTC_TIMESTAMP,%s,%s)', [data['status'], data['user']])
    if not data['status']:
        data = conn.get_data(
            'select h.* , u.name from history as h join user as u on u.iduser = h.iduser where h.iduser is not NULL order by h.datetime desc limit 20')
        ids_process = []
        for usr in data:
            endpos = data.index(usr)
            for usre in data[endpos + 1:]:
                if (usre['iduser'] is usr['iduser'] and usre['value'] == 1) and (
                        usr['idhistoriek'] not in ids_process and usr['value'] == 0):
                    ids_process.append(usr['idhistoriek'])
                    ids_process.append(usre['idhistoriek'])
                    motioncount = conn.get_data(
                        'select count(*) as count from history where idsensor = %s and datetime between %s and %s',
                        [motion.sensor_id, usr['datetime'], usre['datetime']])
                    if motioncount:
                        motioncount = motioncount[0]['count']
                    socketio.emit('userUpdate', {'name': usr['name'], 'iduser': usr["iduser"],
                                                     "start": str(usre['datetime'].isoformat() + 'Z'),
                                                     "stop": str(usr['datetime'].isoformat() + 'Z'), "motioncount": motioncount})
                    break
            break



# @socketio.on('reading')
# def reading(data):
#     global last_touchstrip_action
#     if data['data'] is not 0:
#         if last_touchstrip_action is not True:
#             socketio.emit("choosing", {"data": True})
#             last_touchstrip_action = True
#         socketio.emit("read", {"data": int(data['data'])})
#         print(data['data'])
#     else:
#         if last_touchstrip_action is not False:
#             socketio.emit("choosing", {"data": False})
#             last_touchstrip_action = False


@socketio.on('alarm')
def alarm(data):
    if data['speaker']:
        speaker.on = True
        # print('DOING OVERTIME {}'.format(data['speaker']))
    else:
        speaker.on = False
        # print('NOT DOING OVERTIME {}'.format(data['speaker']))


@app.route('/api/v1/ip')
def ipconfig():
    if config.getboolean('googlecalendar', 'enable'):
        if config.get('domain', 'subdomain'):
            return jsonify(domain='{}.{}'.format(dns.subdomain, dns.domain),
                           ip='{}'.format(dns.local_ip)), 200
        else:
            return jsonify(domain='{}'.format(dns.domain)), 200

    else:
        return jsonify(ip=dns.local_ip), 200


@app.route('/api/v1/monitor')
def monitor_settings():
    return jsonify(unit=config.get('screen', 'unit'), left=config.get('screen', 'push-left'),
                   right=config.get('screen', 'push-right')), 200


@app.route('/api/v1/temperature')
def temperature():
    return jsonify(weather.cache), 200


@app.route('/api/v1/temperature/history')
def temperature_history():
    return jsonify(weather.get_history()), 200


@app.route('/api/v1/settings/timezone', methods=['GET'])
def settings_timezone():
    return jsonify(timezone=weather.get_timezone()), 200


@app.route('/api/v1/settings/testspeaker', methods=['GET'])
def settings_test_speaker():
    speaker.test_speaker()
    return jsonify(status='OK'), 200


@app.route('/api/v1/settings/setup', methods=['GET', 'POST'])
def settings_setup():
    if request.method == 'GET':
        set = conn.get_data('select * from settings where name = "setup"')
        if set:
            return jsonify(setup=False if (set[0]['value'] == "0") else True), 200
        else:
            conn.set_data('insert into settings values (NULL,"setup",FALSE)')
            return jsonify(setup=False), 201
    elif request.method == 'POST':
        data = request.get_json()
        set = conn.get_data('select * from settings where name = "setup"')
        if set:
            conn.set_data('update settings set value = %s where name = "setup"', [data['setup']])
            return jsonify(setup=data['setup']), 200
        else:
            conn.set_data('insert into settings values (NULL,"setup",%s)', [data['setup']])
            return jsonify(setup=data['setup']), 201


@app.route('/api/v1/settings/location', methods=['GET', 'POST'])
def settings_location():
    if request.method == 'GET':
        loc = conn.get_data('select * from settings where name IN ("longitude","latitude")')
        if loc:
            long, lat = 0, 0
            for val in loc:
                if val['name'] == 'longitude':
                    long = val['value']
                if val['name'] == 'latitude':
                    lat = val['value']
        else:
            lat, long = 50.824683, 3.249550
            conn.set_data('insert into settings values (NULL,"longitude",%s)', [long])
            conn.set_data('insert into settings values (NULL,"latitude",%s)', [lat])

        return jsonify(long=long, lat=lat), 200
    if request.method == 'POST':
        data = request.get_json()
        long = data['long']
        lat = data['lat']
        conn.set_data('update settings set value = %s where name = "longitude"', [long])
        conn.set_data('update settings set value = %s where name = "latitude"', [lat])
        weather.last_cached = 0
        socketio.emit('refresh')
        return jsonify(long=long, lat=lat), 200


@app.route('/api/v1/user/session')
def user_session():
    data = conn.get_data(
        'select h.* , u.name from history as h join user as u on u.iduser = h.iduser where h.iduser is not NULL order by h.datetime desc limit 20')[
           ::-1]
    processed = {}
    ids_process = []
    for usr in data:
        startpos = data.index(usr)
        for usre in data[startpos + 1:]:
            if (usre['iduser'] is usr['iduser'] and usre['value'] == 0) and (
                    usr['idhistoriek'] not in ids_process and usr['value'] == 1):
                ids_process.append(usr['idhistoriek'])
                ids_process.append(usre['idhistoriek'])
                motioncount = conn.get_data(
                    'select count(*) as count from history where idsensor = %s and datetime between %s and %s',
                    [motion.sensor_id, usr['datetime'], usre['datetime']])
                if motioncount:
                    motioncount = motioncount[0]['count']
                processed[usr['idhistoriek']] = {'name': usr['name'], 'iduser': usr["iduser"],
                                                 "start": usr['datetime'].isoformat() + 'Z',
                                                 "stop": usre['datetime'].isoformat() + 'Z', "motioncount": motioncount}
                break

    for key, usr in processed.items():
        if 'stop' not in usr.keys():
            processed.pop(usr)

    return jsonify(list(processed.values())), 200


@app.route('/api/v1/user/<user>', methods=['GET', 'PUT', 'DELETE'])
def user_get(user):
    if request.method == 'GET':
        data = conn.get_data(
            'select u.iduser,u.name,t.timelimit,u.idcalendar,u.sound,(case when c.idgcalendar IS NULL then FALSE else TRUE end) as "google" from user as u left join calendar as c on c.idcalendar = u.idcalendar join timelimit as t on t.idtimelimit = u.idtimelimit where u.iduser = %s',
            [user])
        user_list = []
        # print(data)
        for user in data:
            user_d = {}
            if user['idcalendar']:
                calendar = conn.get_data('select * from calendarURL where idcalendar = %s', [user['idcalendar']])
                user_d.update(calendar={'calendarURL': calendar, 'google': user['google']})
            user_d.update(name=user['name'])
            user_d.update(id=user['iduser'])
            user_d.update(timelimit=user['timelimit'])
            user_d.update(sound=user['sound'])

            user_list.append(user_d)
        return jsonify(user_list), 200
    elif request.method == 'PUT':
        user = int(user)
        data = request.get_json()
        for setting, value in data.items():
            if setting == 'name':
                conn.set_data('update user set name = %s where iduser = %s', [value, user])
            if setting == 'timelimit':
                tmid = conn.get_data('select idtimelimit from timelimit where timelimit=%s', [value])
                if not tmid:
                    tmid = conn.set_data('insert into timelimit values (NULL,%s)', [value])
                else:
                    tmid = tmid[0]['idtimelimit']
                conn.set_data('update user set idtimelimit = %s where iduser=%s', [tmid, user])
            if setting == 'sound':
                conn.set_data('update user set sound = %s where iduser=%s', [value, user])
            if setting == 'idgcalendar':
                if conn.get_data('select session from gcalendar where idgcalendar = %s', [value]):
                    idc = int(conn.get_data(
                        'select idcalendar from user where iduser=%s',
                        [user])[0]['idcalendar'])
                    conn.set_data('update calendar set idgcalendar=%s where idcalendar=%s', [value, idc])
            if setting == 'calendars':
                idc = int(conn.get_data('select idcalendar from user where iduser=%s', [user])[0]['idcalendar'])
                conn.set_data('delete from calendarURL where idcalendar = %s', [idc])
                for cals in value:
                    conn.set_data('insert into calendarURL values (NULL,%s,%s)', [cals, idc])

        global cal
        cal.last_cached = 0
        socketio.emit('refresh')
        return jsonify(status='OK'), 201
    elif request.method == 'DELETE':
        idc = int(conn.get_data('select idcalendar from user where iduser=%s', [user])[0]['idcalendar'])
        conn.set_data('update user set idcalendar = NULL where iduser=%s', [user])
        conn.set_data('delete from calendarURL where idcalendar = %s', [idc])
        conn.set_data('update calendar set idgcalendar = NULL where idcalendar=%s', [idc])
        conn.set_data('delete from calendar where idcalendar = %s', [idc])
        conn.set_data('delete from history where iduser=%s', [user])
        conn.set_data('delete from user where iduser = %s', [user])

        if not conn.get_data('select * from user where iduser = %s', [user]):
            socketio.emit('refresh')
            return jsonify(status='OK'), 200
        else:
            return jsonify(status='ERROR', error='User could not be deleted'), 500


@app.route('/api/v1/user/', methods=['GET', 'POST'])
def user_create():
    if request.method == 'GET':
        data = conn.get_data(
            'select u.iduser,u.name,t.timelimit,u.idcalendar,u.sound,(case when c.idgcalendar IS NULL then FALSE else TRUE end) as "google" from user as u left join calendar as c on c.idcalendar = u.idcalendar join timelimit as t on t.idtimelimit = u.idtimelimit')
        user_list = []
        # print(data)
        for user in data:
            user_d = {}
            if user['idcalendar']:
                calendar = conn.get_data('select * from calendarURL where idcalendar = %s', [user['idcalendar']])
                user_d.update(calendar={'calendarURL': calendar, 'google': user['google']})
            user_d.update(name=user['name'])
            user_d.update(id=user['iduser'])
            user_d.update(timelimit=user['timelimit'])
            user_d.update(sound=user['sound'])

            user_list.append(user_d)
        return jsonify(user_list), 200
    elif request.method == 'POST':
        data = request.get_json()
        name = data['name']
        idgcalendar = data['idgcalendar'] if 'idgcalendar' in data.keys() else None
        timelimit = data['timelimit']
        sound = data['sound']
        calendars = data['calendars'] if 'calendars' in data.keys() else None

        tmid = conn.get_data('select idtimelimit from timelimit where timelimit=%s', [timelimit])
        if not tmid:
            tmid = conn.set_data('insert into timelimit values (NULL,%s)', [timelimit])
        else:
            tmid = tmid[0]['idtimelimit']

        id = conn.set_data('insert into user values (NULL,%s,NULL,%s,%s)', [name, tmid, sound])

        # if idgcalendar or calendars:
        if idgcalendar:
            if conn.get_data('select session from gcalendar where idgcalendar = %s', [idgcalendar]):
                idc = conn.set_data(
                    'insert into calendar values (NULL,%s)', [idgcalendar])
            else:
                idc = conn.set_data(
                    'insert into calendar values (NULL,NULL)')
            if calendars:
                for cals in calendars:
                    conn.set_data('insert into calendarURL values (NULL,%s,%s)', [cals.strip(), idc])

        else:
            idc = conn.set_data(
                'insert into calendar values (NULL,NULL)')
            for cals in calendars:
                conn.set_data('insert into calendarURL values (NULL,%s,%s)', [cals, idc])

        conn.set_data('update user set idcalendar = %s where iduser=%s', [idc, id])
        cal.last_cached = 0
        socketio.emit('refresh')

        return jsonify(id=id), 201


@app.route('/api/v1/calendar/<uid>')
def calendar(uid):
    return jsonify(cal.get_data_from_user(uid))


@app.route('/api/v1/setup/calendar/response', methods=['GET'])
def response_calendar():
    tokens = GoogleToken.GoogleToken(config.get('domain', 'subdomain'), config.get('domain', 'domain'), rootpath)
    token = tokens.finish_coupling(request.url)
    state = request.args.get('state')
    pick = pickle.dumps(token)
    print('state::::::::::::::' + state)

    conn.set_data('update gcalendar set session = %s where idgcalendar = %s', [pick, state])
    # session = conn.get_data(
    #     'select u.iduser,u.name,g.session,g.idgcalendar from user as u join calendar as c on u.idcalendar = c.idcalendar join gcalendar as g on g.idgcalendar = c.idgcalendar where c.idgcalendar=%s',
    #     [state])
    # print(session)

    # id = conn.get_data(
    #     'select u.iduser from gcalendar as g join calendar as c on c.idgcalendar = g.idgcalendar join user as u on u.idcalendar = c.idcalendar where g.idgcalendar = %s',
    #     [state])
    # cred = pickle.loads(conn.get_data('select session from gCalendarSessions where sessionid=%s', ses_id)[0]['session'])
    global cal
    cal.last_cached = 0

    if config.getboolean('googlecalendar', 'enable'):
        if config.get('domain', 'subdomain'):
            return redirect('https://{}.{}/static/close.html'.format(dns.subdomain, dns.domain), code=303)
        else:
            return redirect('https://{}/static/close.html'.format(dns.domain), code=303)

    else:
        return redirect('http://{}/static/close.html'.format(dns.local_ip), code=303)


@app.route('/api/v1/setup/calendar/disconnect/<user>')
def disconnect_calendar(user):
    idc = conn.get_data(
        'select idcalendar from user where iduser=%s',
        [user])
    conn.set_data(
        'update calendar set idgcalendar = NULL where idcalendar = %s',
        [idc[0]['idcalendar']])
    return jsonify(status='disconnected')


@app.route('/api/v1/setup/calendar/')
def setup_calendar():
    token = GoogleToken.GoogleToken(config.get('domain', 'subdomain'), config.get('domain', 'domain'), rootpath)
    state = token.get_state()
    uri = token.get_URI(state)[0]
    # print('state::::::::::::::' + state)
    conn.set_data('insert into gcalendar values (%s,NULL)',
                  [state])
    # return redirect(uri[0], code=301)
    return jsonify(state=state, uri=uri)


@app.route('/api/v1/setup/calendar/<user>')
def setup_calendar_user(user):
    token = GoogleToken.GoogleToken(config.get('domain', 'subdomain'), config.get('domain', 'domain'), rootpath)
    state = token.get_state()
    uri = token.get_URI(state)[0]
    print('state::::::::::::::' + state)
    conn.set_data('insert into gcalendar values (%s,NULL)',
                  [state])

    idc = conn.get_data(
        'select idcalendar from user where iduser=%s',
        [user])
    if idc:
        conn.set_data(
            'update calendar set idgcalendar = %s where idcalendar = %s',
            [state, idc[0]['idcalendar']])
    else:
        idc = conn.set_data(
            'insert into calendar values (NULL,%s)',
            [state])
        conn.set_data('update user set idcalendar=%s where iduser=%s', [idc, int(user)])
        # conn.set_data(
        #     'update calendar set idgcalendar = %s where idcalendar = (select idCalendar from user where iduser=%s)',
        #     [state, user])
    # return redirect(uri[0], code=303)
    return jsonify(state=state, uri=uri)


@app.before_request
def before_request():
    if request.url.startswith('http://'):
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=303)


if __name__ == '__main__':
    # server = pywsgi.WSGIServer(("", 5000), app,
    #                            handler_class=WebSocketHandler,
    #                            keyfile='./resources/certs/privkey.pem',
    #                            certfile='./resources/certs/cert.pem')
    # server.serve_forever()
    if config.getboolean('googlecalendar', 'enable'):
        socketio.run(app=app, host='0.0.0.0', port=5000, debug=False,
                     keyfile='{}/resources/certs/privkey.pem'.format(rootpath),
                     certfile='{}/resources/certs/cert.pem'.format(rootpath))

    else:
        socketio.run(app=app, host='0.0.0.0', port=5000, debug=False)

    socketio.emit('refresh')

    # app.run(host='0.0.0.0', port=5000, debug=False,
    #         ssl_context=('./resources/certs/cert.pem', './resources/certs/privkey.pem'),threaded=True)
