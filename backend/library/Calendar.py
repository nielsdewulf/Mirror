from threading import Thread
from library import GoogleCalendar, GoogleToken
from icalevents.icalevents import events
import pickle
from datetime import datetime
import pytz
import time


class Calendar(Thread):
    def __init__(self, conn, gcalendar):
        Thread.__init__(self)
        self.daemon = True
        self.conn = conn
        self.gcalendar = gcalendar
        self.last_cached = 0
        self.cache = {}
        self.start()

    def run(self):
        while True:
            if time.time() - self.last_cached > 900:
                print('Getting cached userdata')
                self.last_cached = time.time()
                for usr in self.get_users():
                    self.cache[str(usr['id'])] = self.get_calendar(usr)

    def get_data_from_user(self, id):
        if str(id) in self.cache.keys():
            return self.cache[str(id)]
        else:
            return []

    def get_users(self):
        data = self.conn.get_data(
            'select u.iduser,u.name,t.timelimit,u.idcalendar,case c.idgcalendar when NULL then FALSE else True end as "google" from user as u left join calendar as c on c.idcalendar = u.idcalendar join timelimit as t on t.idtimelimit = u.idtimelimit')
        user_list = []
        # print(data)
        for user in data:
            user_d = {}
            if user['idcalendar']:
                calendar = self.conn.get_data('select * from calendarURL where idcalendar = %s', [user['idcalendar']])
                user_d.update(calendar={'calendarURL': calendar, 'google': user['google']})
            user_d.update(name=user['name'])
            user_d.update(id=user['iduser'])
            user_d.update(timelimit=user['timelimit'])

            user_list.append(user_d)
        return user_list

    def load_calendar(self, id):
        for usr in self.get_users():
            if usr['id'] == id:
                self.cache[str(usr['id'])] = self.get_calendar(usr)
                break

    def get_calendar(self, userd):

        date = datetime.utcnow().replace(tzinfo=pytz.utc)

        today_beginning = datetime.combine(date.today(),
                                           datetime.strptime("00:00:00", "%H:%M:%S").time()).replace(tzinfo=pytz.utc)
        today_end = (datetime.combine(date.today(), datetime.strptime("23:59:59", "%H:%M:%S").time())).replace(
            tzinfo=pytz.utc)

        data = []
        if 'calendar' in userd.keys():
            if len(userd['calendar']['calendarURL']) is not 0:
                for cale in userd['calendar']['calendarURL']:
                    cal = cale['url']
                    print(cal)
                    try:
                        ev = events(
                            cal, start=today_beginning,
                            end=today_end)
                        for event in ev:
                            if len(data) < 10 and event.start.date() == datetime.now().date():
                                full_day = False
                                if event.start.time() == event.end.time():
                                    full_day = True
                                data.append({'summary': event.summary, 'start': event.start.isoformat() + 'Z',
                                             'end': event.end.isoformat() + 'Z', 'fullDay': full_day})
                    except ValueError:
                        print('SKIPPED URL {}'.format(cal))
            if self.gcalendar and self.conn.get_data(
                    'select g.session,g.idgcalendar from user as u join calendar as c on u.idcalendar = c.idcalendar join gcalendar as g on g.idgcalendar = c.idgcalendar where iduser=%s',
                    [userd['id']]):
                print('USER HAS GOOGLE')

                session = self.conn.get_data(
                    'select g.session,g.idgcalendar from user as u join calendar as c on u.idcalendar = c.idcalendar join gcalendar as g on g.idgcalendar = c.idgcalendar where iduser=%s',
                    [userd['id']])
                # print(session)
                creds = pickle.loads(session[0]['session'])
                ref = GoogleToken.GoogleToken.refresh_if_needed(creds)
                if ref:
                    pick = pickle.dumps(ref)
                    # print('Refreshing')
                    self.conn.set_data('update gcalendar set session=%s where idgcalendar=%s',
                                       [pick, session[0]['idgcalendar']])
                cal = GoogleCalendar.GoogleCalendar()
                cal.setup_calendar(creds)
                print(cal.get_recent_events())
                for event in cal.get_recent_events():
                    full_day = False

                    if 'date' in event['start'].keys():
                        full_day = True
                        start = datetime.strptime(event['start']['date'], '%Y-%m-%d').isoformat() + 'Z'
                    else:
                        start = datetime.strptime(event['start']['dateTime'],
                                                  "%Y-%m-%dT%H:%M:%SZ").isoformat() + 'Z'

                    if 'date' in event['end'].keys():
                        end = datetime.strptime(event['end']['date'], '%Y-%m-%d').isoformat() + 'Z'
                    else:
                        end = datetime.strptime(event['end']['dateTime'], "%Y-%m-%dT%H:%M:%SZ").isoformat() + 'Z'

                    data.append(
                        {'summary': event['summary'], 'start': start, 'end': end, 'fullDay': full_day,
                         'google': True})

        return data

    # return jsonify(cal.get_recent_events())
