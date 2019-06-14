let uriUser = urlPrefix + `/api/v1/user/`;
let socket;
let choosing = false;
let currentValue = 0;
let interval;
let currentOption = -1;
let progressBar;
let currentTimeout;
let users = {};
let latestRefresh = new Date();
let latestMotion = new Date();
const chooseOption = function () {
    // alert('OPTION');
    let element = document.querySelector('.box');
    if (element) {
        element.parentNode.removeChild(element);
    }
    let currOptionID = document.querySelectorAll('.js-option')[currentOption].getAttribute('data-userid');
    console.log(`Chosen: ${users[currOptionID].name} with id ${users[currOptionID].id}`);
    startSession(currOptionID, users[currOptionID].name, users[currOptionID].timelimit, users[currOptionID].sound)
}
const getUsers = function () {
    handleData(uriUser, showUsers);
}
const showUsers = function (data) {
    let str = '';
    for (let user of data) {
        str += `<div data-userid=${user.id} class="c-options__option js-option o-layout o-layout--align-content-center o-layout--justify-end">
                        <div class="u-text-align-right o-layout--align-self-center">
                            <h2>${user.name}</h2>
                        </div>
                    </div>`;
        users[user.id] = user;
    }
    document.querySelector('.js-options').innerHTML = str;
}
const checkUser = function () {
    if (choosing) {
        let allOptions = document.querySelector('.js-options').children.length;
        let currentOptionValue = Math.ceil(((currentValue) * allOptions) / 100) - 1;
        // console.error(currentOptionValue);
        let currOptionOb = document.querySelectorAll('.js-option')[currentOptionValue];

        if (currentOption === currentOptionValue) {

        } else {
            let element = document.querySelector('.js-progress');
            if (element) {
                element.parentNode.removeChild(element);
            }
            currOptionOb.innerHTML = `<div class="js-progress o-layout--align-self-end"><div class="progress" id="progress">
            </div></div>` + currOptionOb.innerHTML;
            progressBar =
                new ProgressBar.Circle('#progress', {
                    color: 'white',
                    strokeWidth: 10,
                    duration: 2000, // milliseconds
                    easing: 'linear'
                });
            progressBar.set(1);
            progressBar.animate(0); // percent
            if (currentTimeout) {
                clearTimeout(currentTimeout)
            }
            currentTimeout = setTimeout(chooseOption, 2000);
            currentOption = currentOptionValue;
        }

    } else {
        currentOption = -1;
        if (currentTimeout) {
            clearTimeout(currentTimeout)
        }
        let element = document.querySelector('.js-progress');
        if (element) {
            element.parentNode.removeChild(element);
        }
    }
}

const initUsers = function () {
    socket = io(urlPrefix, {transports: ['websocket']});
    socket.on('connect_failed', function () {
        window.location.reload();
    });
    socket.on('connect_error', function () {
        window.location.reload();
    })
    socket.on('connect', function () {
        socket.emit('connected');
    });
    getUsers();
    socket.on('refresh', function () {
        if (inSession) endSession('Refresh');
        window.location.reload()
    });
    socket.on('choosing', function (data) {
        // console.log('GOT INPUT');
        if (inSession && data.data) {
            let fromNow = new Date(Math.abs(new Date() - sessionStart));
            if (fromNow > 5000) {
                endSession('Ended by user');
            }
        } else {
            choosing = data.data;
            // console.log(data.data)
        }
    });
    socket.on('motion', function () {
            latestMotion = new Date();
            console.log('Motion');
            if (inSession) {
                if (overtime && hasSound) {
                    socket.emit('alarm', {speaker: true})
                }

            } else {
                let fromNow = new Date(Math.abs(new Date() - latestRefresh));
                if (fromNow.getTime() > 1800000) {
                    getUsers();
                    getWeather();
                    latestRefresh = new Date();
                }

                // if(fromNow > 10)
            }
        }
    );


    socket.on('read', function (data) {
        currentValue = data.data;
        // console.log(data.data)
    });
    interval = setInterval(checkUser, 10)


}
