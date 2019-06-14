from __future__ import print_function
import os.path
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request


class GoogleToken:
    SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

    def __init__(self, subdomain, domain, root):
        self.creds = None
        path = "{}/resources/credentials/".format(root)

        self.flow = InstalledAppFlow.from_client_secrets_file(
            '{}/credentials.json'.format(path), self.SCOPES)
        self.flow.redirect_uri = "https://{}.{}:5000/api/v1/setup/calendar/response".format(subdomain, domain)

    #
    # def get_credentials(self):
    #     creds = None
    #     if os.path.exists('./resources/tokens/token.pickle'):
    #         with open('./resources/tokens/token.pickle', 'rb') as token:
    #             creds = pickle.load(token)
    #     if not creds or not creds.valid:
    #         if creds and creds.expired and creds.refresh_token:
    #             creds.refresh(Request())
    #         else:
    #             flow = InstalledAppFlow.from_client_secrets_file(
    #                 './resources/credentials/credentials.json', self.SCOPES)
    #             creds = flow.run_console()
    #         with open('./resources/tokens/token.pickle', 'wb') as token:
    #             pickle.dump(creds, token)
    #     return creds

    @staticmethod
    def refresh_if_needed(creds):
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
                return creds
        return False

    def get_URI(self, state):
        return self.flow.authorization_url(prompt='consent', state=state)

    def get_state(self):
        return self.flow.oauth2session.state()

    def finish_coupling(self, response):
        self.flow.fetch_token(authorization_response=response)
        self.creds = self.flow.credentials

        return self.creds
