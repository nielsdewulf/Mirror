from threading import Thread
import pygame


class Alarm(Thread):
    def __init__(self, root):
        Thread.__init__(self)
        self.daemon = True
        pygame.init()
        # path = os.path.abspath("resources/sound/")
        self.player = pygame.mixer.Sound('{}/resources/sound/louder219244__zyrytsounds__alarm-clock-short.wav'.format(root))
        self.on = False
        self.player.set_volume(10)
        self._isplaying = False
        self.start()

    def run(self):
        while True:
            if self.on and not self._isplaying:
                self.player.play(loops=-1)
                self._isplaying = True
            elif not self.on and self._isplaying:
                self.player.stop()
                self._isplaying = False

    def test_speaker(self):
        self.player.play()
