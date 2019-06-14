import signal


# Class that handles SIGINT and SIGTERM Systemd Service commands
class OSSignals:
    kill_now = False

    def __init__(self, toshutdown):
        self.r = toshutdown
        signal.signal(signal.SIGINT, self.exit_gracefully)
        signal.signal(signal.SIGTERM, self.exit_gracefully)

    def exit_gracefully(self, signum, frame):
        self.kill_now = True
        self.r.stop()
