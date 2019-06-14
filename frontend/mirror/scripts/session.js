let inSession = false;
let hasLimit = 0;
let hasSound = 0;
let overtime = false;
let sessionStart;
let sessionInterval;
let loading = false;
let user;
let userID;
let togglecolor = false;
const startSession = function (id, name, alerttime, sound) {
    console.error('LOADING SESSION');
    getCalendar(id);
    userID = id;
    user = name;
    hasSound = sound;
    hasLimit = alerttime;
};
const sessionReady = function () {
    console.error('STARTING SESSION');
    latestMotion = new Date();
    sessionStart = new Date();
    inSession = true;
    document.querySelector('.js-user').innerHTML = user;
    document.querySelector('.js-session__time').innerHTML = '';
    document.querySelector('.js-options').style.display = 'none';
    document.querySelector('.js-session').style.display = 'block';
    socket.emit('user',{user:userID, status:1});

    sessionTimer();
}
const endSession = function (reason) {
    console.error(`ENDING SESSION ${reason}`);
    inSession = false;
    overtime = false;
    socket.emit('alarm', {speaker: false});
    document.querySelector('body').style.background = 'black';
    document.querySelector('.js-calendar').innerHTML = '';

    document.querySelector('.js-options').style.display = 'flex';
    document.querySelector('.js-session').style.display = 'none';
    socket.emit('user',{user:userID, status:0});
    clearInterval(sessionInterval)
};
const sessionTimer = function () {
    sessionInterval = setInterval(function () {
        let fromNow = new Date(Math.abs(new Date() - sessionStart));
        console.log(hasLimit);
        if (hasLimit > 0) {
            fromNow = new Date(Math.abs(new Date().setHours(0, hasLimit, 0) - new Date().setHours(fromNow.getUTCHours(), fromNow.getUTCMinutes(), fromNow.getUTCSeconds())));
            if (fromNow.getUTCHours() === 0 && fromNow.getUTCMinutes() === 0 && fromNow.getUTCSeconds() === 0) {
                overtime = true;
            }
            if (overtime) {
                if (togglecolor) {
                    document.body.style.background = 'black';
                } else {
                    document.body.style.background = 'red';
                }
                togglecolor = !togglecolor;

            }

        }
        {
            let fr = new Date(Math.abs(new Date().getTime() - latestMotion.getTime()));
            if (!overtime) {
                if (fr.getTime() > 120000) {
                    endSession('Inactivity');
                }
            } else {
                if (fr.getTime() > 60000) {
                    endSession('Inactivity');
                }
            }
        }
        if (fromNow.getUTCHours() === 0) {
            if (fromNow.getMinutes() === 0) {
                document.querySelector('.js-session__time').innerHTML = `${fromNow.getSeconds()} second${fromNow.getSeconds() !== 1 ? 's' : ''} ${overtime ? 'overtime' : hasLimit > 0 ? 'left' : ''}`;
            } else {
                document.querySelector('.js-session__time').innerHTML = `${fromNow.getMinutes()} minute${fromNow.getMinutes() !== 1 ? 's' : ''} ${fromNow.getSeconds()} second${fromNow.getSeconds() !== 1 ? 's' : ''} ${overtime ? 'overtime' : hasLimit > 0 ? 'left' : ''}`;
            }
        } else {
            document.querySelector('.js-session__time').innerHTML = `${fromNow.getUTCHours()} hour${fromNow.getUTCHours() !== 1 ? 's' : ''} ${fromNow.getMinutes()} minute${fromNow.getMinutes() !== 1 ? 's' : ''} ${fromNow.getSeconds()} second${fromNow.getSeconds() !== 1 ? 's' : ''} ${overtime ? 'overtime' : hasLimit > 0 ? 'left' : ''}`;
        }
    }, 1000)
}