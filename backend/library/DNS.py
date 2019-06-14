import requests
from subprocess import Popen
import subprocess


class DNS:
    def __init__(self, enable, email, key, domain, subdomain=""):
        self.subdomain = subdomain
        self.domain = domain
        self.email = email
        self.key = key
        cmd = "ip -4 addr show wlan0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'"
        ps = Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        output = ps.communicate()
        # filters = check_output(
        #     ['grep', '-oP', "\'(?<=inet\s)\d+(\.\d+){3}\'", "<<<", "\'" + ips.decode('ascii') + "\'"])
        # ip = filters.decode('ascii')
        self.local_ip = output[0].decode('ascii')[0:-1]
        # self.local_ip = ni.ifaddresses(ni.interfaces()[6])[2][0]['addr']  # DEVELOPMENT IP CAVIATS FOR WINDOWS
        if email and key and domain:
            self.update_dns_record()
        print(self.local_ip)

    def get_dns(self):
        zones = requests.get('https://api.cloudflare.com/client/v4/zones',
                             headers={"X-Auth-Email": self.email,
                                      "X-Auth-Key": self.key,
                                      "Content-Type": "application/json"})
        for zone in zones.json()['result']:
            dom = self.domain

            if zone['name'] == dom:
                self.zoneid = zone['id']
                break

        status = requests.get(
            'https://api.cloudflare.com/client/v4/zones/{}/dns_records'.format(self.zoneid),
            headers={"X-Auth-Email": self.email,
                     "X-Auth-Key": self.key,
                     "Content-Type": "application/json"})

        if not status.json()['result']:
            raise ValueError('Incorrect Cloudflare credentials')

        subdomain = 0
        for d in status.json()['result']:
            if d['name'] == "{}.{}".format(self.subdomain, self.domain):
                subdomain = d
                break

        if subdomain:
            self.recordid = subdomain['id']
            return True
        else:
            return self.create_dns_record()

    def create_dns_record(self):
        status = requests.post(
            'https://api.cloudflare.com/client/v4/zones/{}/dns_records/'.format(self.zoneid),
            json={"type": "A", "name": "{}".format(self.subdomain), "content": "{}".format(self.local_ip),
                  "ttl": 1, "priority": 10,
                  "proxied": False},
            headers={"X-Auth-Email": self.email,
                     "X-Auth-Key": self.key,
                     "Content-Type": "application/json"})
        data = status.json()['result']
        self.recordid = data['id']

        return True

    def update_dns_record(self):  # UPDATING LOCAL IP TO DNS RECORD FOR EASINESS
        self.get_dns()

        requests.put(
            'https://api.cloudflare.com/client/v4/zones/{0}/dns_records/{1}'.format(self.zoneid,
                                                                                    self.recordid),
            json={"type": "A", "name": "{}".format(self.subdomain), "content": "{}".format(self.local_ip),
                  "ttl": 1, "priority": 10,
                  "proxied": False},
            headers={"X-Auth-Email": self.email,
                     "X-Auth-Key": self.key,
                     "Content-Type": "application/json"})
