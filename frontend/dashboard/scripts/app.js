let urlPrefix;
let oldUrl = window.location;
let url = new URL(oldUrl);
let userSelected;
let googleState;
let currentUsers = {};
const listenToQuantityCounter = function () {
    for (let option of document.querySelectorAll('.c-input__number')) {
        option.querySelector('input').onkeydown = function (e) {
            if (e.key === '-' || e.key === '+' || e.key === 'Add' || e.key === 'Substract') {
                return false;
            }
            // else if (parseInt(e.target.value + e.key) > 60) {
            //
            //     return false;
            // }
        };
        option.querySelectorAll('span')[1].addEventListener('click', function (el) {
            let currentValue = option.querySelector('input').value;
            let maxValue = option.querySelector('input').max;

            if (parseInt(currentValue) > 0) {
                option.querySelector('input').value = parseInt(currentValue) - 1;
            } else {
                option.querySelector('input').value = parseInt(maxValue);
            }
            console.log('minus')
        });
        option.querySelectorAll('span')[0].addEventListener('click', function (el) {
            let currentValue = option.querySelector('input').value;
            let maxValue = option.querySelector('input').max;
            let minValue = option.querySelector('input').min;
            if (parseInt(currentValue) < parseInt(maxValue)) {
                option.querySelector('input').value = parseInt(currentValue) + 1;
            } else {
                option.querySelector('input').value = parseInt(minValue);
            }
            console.log('plus');
        });
    }
};
const showUser = function () {
    let data = currentUsers[userSelected];
    for (let usr of document.querySelectorAll('.c-userselect__item')) {
        if (parseInt(usr.getAttribute('data-usr-id')) === userSelected) {
            usr.classList.add('c-userselect__item--selected')
        } else {
            usr.classList.remove('c-userselect__item--selected')
        }
    }
    let name = document.querySelector('#name');
    let timelim = document.querySelector('#timelimit');
    let playsound = document.querySelector('#speaker');
    let googlecal = document.querySelector('.js-googlecal');
    // let calurl = document.querySelector('#icsurl');

    name.value = data.name;
    timelim.value = data.timelimit;
    playsound.checked = data.sound;
    googlecal.innerHTML = data.calendar.google ? 'Disconnect Google Calendar' : 'Connect Google Calendar';
    googlecal.setAttribute('data-action', data.calendar.google ? 'disconnect' : 'connect');
    let calstr = '';
    for (let url of data.calendar['calendarURL']) {
        calstr += `<div class="c-input"><span class="js-ical__remove"></span><input id="icsurl_${url.idurl}" data-url-id="${url.idurl}" value="${url.url}" type="text"></div>`;
    }
    document.querySelector('.js-ical__group').innerHTML = calstr;
    for (let delBtn of document.querySelectorAll('.js-delete')) {
        delBtn.innerHTML = 'Delete';
    }
    listenToIcalDel();
    toggleLoading(false);
};

const showNewUser = function (noUsers) {
    userSelected = -1;
    for (let usr of document.querySelectorAll('.c-userselect__item')) {
        usr.classList.remove('c-userselect__item--selected')
    }
    if (noUsers) {
        document.querySelector('.js-userlist').innerHTML = `<li class="c-userselect__item c-userselect__item--selected js-user" data-usr-id="-1">New user</li>`;
    } else {
        document.querySelector('.js-userlist').innerHTML += `<li class="c-userselect__item c-userselect__item--selected js-user" data-usr-id="-1">New user</li>`;
    }

    let name = document.querySelector('#name');
    let timelim = document.querySelector('#timelimit');
    let playsound = document.querySelector('#speaker');
    let googlecal = document.querySelector('.js-googlecal');
    // let calurl = document.querySelector('#icsurl');

    name.value = '';
    timelim.value = 0;
    playsound.checked = false;
    googlecal.innerHTML = 'Connect Google Calendar';
    googlecal.setAttribute('data-action', 'connect');
    let calstr = '';
    document.querySelector('.js-ical__group').innerHTML = calstr;
    for (let delBtn of document.querySelectorAll('.js-delete')) {
        delBtn.innerHTML = 'Cancel';
    }
    listenToUser();
    toggleLoading(false);
};
const showCachedUsers = function () {
    if (currentUsers.length === 0) {
        showNewUser();
        return;
    }
    let str = '';
    let first = true;
    for (let key in currentUsers) {
        let usr = currentUsers[key];
        if (first && userSelected == (undefined || null)) {
            str += `<li class="c-userselect__item c-userselect__item--selected js-user" data-usr-id="${usr.id}">${usr.name}</li>`;
            first = false;
            userSelected = usr.id;
        } else {
            str += `<li class="c-userselect__item js-user" data-usr-id="${usr.id}">${usr.name}</li>`;
        }
    }
    str += `<li class="c-userselect__item js-create">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path d="M0 0h24v24H0z" fill="none"/>
                        <path fill="#0055FF" d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                </li>`;
    document.querySelector('.js-userlist').innerHTML = str;
    listenToUser();
    listenToNewUser();
    showUser();
};
const showUsers = function (data) {
    if (data.length === 0) {
        showNewUser(true);
        return;
    }
    let str = '';
    let first = true;
    currentUsers = {};
    for (let usr of data) {
        currentUsers[usr.id] = usr;
    }
    for (let key in currentUsers) {
        let usr = currentUsers[key];
        if (first && userSelected == (undefined || null)) {
            str += `<li class="c-userselect__item c-userselect__item--selected js-user" data-usr-id="${usr.id}">${usr.name}</li>`;
            first = false;
            userSelected = usr.id;
        } else {
            str += `<li class="c-userselect__item js-user" data-usr-id="${usr.id}">${usr.name}</li>`;
        }
    }
    str += `<li class="c-userselect__item js-create">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path d="M0 0h24v24H0z" fill="none"/>
                        <path fill="#0055FF" d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                </li>`;
    document.querySelector('.js-userlist').innerHTML = str;
    listenToUser();
    listenToNewUser();
    showUser();

};
const toggleLoading = function (val) {
    let elem = document.querySelector('.c-settings');
    if (!val) {
        elem.classList.remove('c-settings--locked');
    } else {
        elem.classList.add('c-settings--locked');
    }
};
const getUsers = function (data) {
    if (data) {
        if (data.id) {
            userSelected = data.id;
        }
    }
    toggleLoading(true);
    handleData(`${urlPrefix}/api/v1/user/`, showUsers)
};
// const getUserData = function () {
//     toggleLoading(true);
//     handleData(`${urlPrefix}/api/v1/user/${userSelected}`, showUser)
// };
const getGoogleUri = function () {
    toggleLoading(true);
    handleData(`${urlPrefix}/api/v1/setup/calendar/`, handleGooglePopup);
};
const getGoogleUriForUser = function () {
    console.warn('GETTING GOOGLE URI');
    toggleLoading(true);
    handleData(`${urlPrefix}/api/v1/setup/calendar/${userSelected}`, handleGooglePopup);
};
const getDisconnectGoogle = function () {
    toggleLoading(true);
    handleData(`${urlPrefix}/api/v1/setup/calendar/disconnect/${userSelected}`, handleGoogleDisconnect);
};
const sendUserChanges = function (toSend) {
    toggleLoading(true);
    handleData(`${urlPrefix}/api/v1/user/${userSelected}`, getUsers, 'PUT', JSON.stringify(toSend))
};
const sendUserDelete = function (selected) {
    toggleLoading(true);
    userSelected = undefined;
    handleData(`${urlPrefix}/api/v1/user/${selected}`, getUsers, 'DELETE');
};
const sendNewUser = function (toSend) {
    toggleLoading(true);
    handleData(`${urlPrefix}/api/v1/user/`, getUsers, 'POST', JSON.stringify(toSend))
};
const handleGooglePopup = function (data) {
    let googlecal = document.querySelector('.js-googlecal');
    const uri = data.uri;
    googleState = data.state;
    window.open(uri, '_blank');
    googlecal.innerHTML = 'Disconnect Google Calendar';
    googlecal.setAttribute('data-action', 'disconnect');
    if (userSelected !== -1) currentUsers[userSelected].calendar.google = 1;
    toggleLoading(false);
};
const handleGoogleDisconnect = function (data) {
    let googlecal = document.querySelector('.js-googlecal');
    if (data.status === 'disconnected') {
        googlecal.innerHTML = 'Connect Google Calendar';
        googlecal.setAttribute('data-action', 'connect');
        currentUsers[userSelected].calendar.google = 0;
    }
    toggleLoading(false);
};
const listenToUser = function () {
    for (let usr of document.querySelectorAll('.js-user')) {
        usr.addEventListener('click', function (el) {
            if (userSelected !== -1) {
                userSelected = parseInt(usr.getAttribute('data-usr-id'));
                toggleLoading(true);
                showCachedUsers();
            } else {
                userSelected = parseInt(usr.getAttribute('data-usr-id'));
                toggleLoading(true);
                showCachedUsers();
            }


        })
    }
};
const listenToIcalDel = function () {
    let delBtns = document.querySelectorAll('.js-ical__remove');

    for (let delBtn of delBtns) {
        delBtn.addEventListener('click', function (el) {
            delBtn.parentElement.remove();
        })
    }

};
const listenToIcalAdd = function () {
    let addBtn = document.querySelector('.js-ical__add');
    addBtn.addEventListener('click', function (el) {
        let div = document.createElement('div');
        div.innerHTML = `<div class="c-input"><span class="js-ical__remove"></span><input placeholder="https://your.site.url/ical.ics" type="text"></div>`;
        document.querySelector('.js-ical__group').appendChild(div.firstChild);
        listenToIcalDel();
    });

};
const listenToNewUser = function () {
    let btn = document.querySelector('.js-create');
    btn.addEventListener('click', function (el) {
        btn.remove();
        showNewUser();
    })
};
const listenToSave = function () {
    let saveBtn = document.querySelectorAll('.js-save');
    for (let btn of saveBtn) {
        btn.addEventListener('click', function (el) {
            let name = document.querySelector('#name').value;
            if (name === '' || name === undefined || name === null) return;
            let timelim = document.querySelector('#timelimit').value;
            let playsound = document.querySelector('#speaker').checked;
            let icalUrls = document.querySelector('.js-ical__group').children;
            let calendarURL = [];
            for (let icalUrl of icalUrls) {
                let URI = icalUrl.querySelector('input').value;
                let res = URI.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
                if (res !== null)
                    calendarURL.push(URI);
            }
            let toSend = {
                name: name,
                idgcalendar: googleState,
                timelimit: timelim,
                sound: playsound,
                calendars: calendarURL
            };
            if (userSelected !== -1) {
                sendUserChanges(toSend);
            } else {
                sendNewUser(toSend);
            }
        })
    }
};
const listenToDelete = function () {
    let saveBtn = document.querySelectorAll('.js-delete');
    for (let btn of saveBtn) {
        btn.addEventListener('click', function (el) {
            if (userSelected !== -1) {
                sendUserDelete(userSelected);
            } else {
                userSelected = undefined;
                showCachedUsers();
            }
        })
    }
};
const listenToGoogle = function () {
    googleState = 0;
    let googlecal = document.querySelector('.js-googlecal');
    googlecal.addEventListener('click', function () {
        if (googlecal.getAttribute('data-action') === 'connect') {
            if (userSelected === -1) {
                getGoogleUri();
            } else {
                getGoogleUriForUser();
            }
        } else {
            if (userSelected === -1) {
                googleState = 0;
            } else {
                getDisconnectGoogle();
            }
        }
    })
};
const handleSetup = function (data) {
    if (!data.setup) {
        window.location = `${url.protocol}//${url.host}/setup.html`;
    }
};
const getSetup = function () {
    handleData(`${urlPrefix}/api/v1/settings/setup`, handleSetup);
};
const handleRedirect = function (data) {

    if (url.hostname !== data.domain || url.protocol !== data.protocol + ':') {
        console.error('WRONG IP ' + url.href);
        url.protocol = data.protocol + ':';
        url.hostname = data.domain;
        window.location = url.href; //'http://example.com:8080/one/two'
    } else {
        urlPrefix = `${data.protocol}://${url.host}:5000`;
        init();
    }
};
const getRedirect = function () {
    handleData(`connection`, handleRedirect)
};

const init = function () {
    getSetup();
    listenToQuantityCounter();
    getUsers();
    listenToSave();
    listenToDelete();
    listenToIcalAdd();
    listenToGoogle();
};
document.addEventListener('DOMContentLoaded', function () {
    getRedirect()
});