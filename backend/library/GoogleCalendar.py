from __future__ import print_function
from datetime import datetime, date
from googleapiclient.discovery import build


class GoogleCalendar:

    def __init__(self):
        self.service = 0

    def setup_calendar(self, creds):
        # creds = GoogleToken.GoogleToken().get_credentials()
        self.service = build('calendar', 'v3', credentials=creds)

    def get_recent_events(self, maxi=5):
        if self.service is not 0:
            # old = datetime.utcnow().isoformat() + 'Z'
            today_beginning = datetime.combine(date.today(),
                                               datetime.strptime("00:00:00", "%H:%M:%S").time()).isoformat() + 'Z'
            today_end = (datetime.combine(date.today(),
                                          datetime.strptime("23:59:59", "%H:%M:%S").time())).isoformat() + 'Z'
            events_result = self.service.events().list(calendarId='primary', timeMin=today_beginning, timeMax=today_end,
                                                       maxResults=maxi, singleEvents=True,
                                                       orderBy='startTime', timeZone='UTC').execute()
            events = events_result.get('items', [])

            return events
