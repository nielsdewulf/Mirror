let urlPrefix;
let oldUrl = window.location;
let url = new URL(oldUrl);
let googleState;
let currentPart = 0;
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
const handleAddUser = function () {
    toggleLoading(false)
};
const toggleLoading = function (val) {
    let elem = document.querySelector('.c-setup');
    if (!val) {
        elem.classList.remove('c-setup--locked');
    } else {
        elem.classList.add('c-setup--locked');
    }
};
const handleGooglePopup = function (data) {
    let googlecal = document.querySelector('.js-googlecal');
    const uri = data.uri;
    googleState = data.state;
    window.open(uri, '_blank');
    googlecal.innerHTML = 'Disconnect Google Calendar';
    googlecal.setAttribute('data-action', 'disconnect');
    toggleLoading(false);
};
const getGoogleUri = function () {
    toggleLoading(true);
    handleData(`${urlPrefix}:5000/api/v1/setup/calendar/`, handleGooglePopup);
};
const sendNewUser = function (toSend) {
    toggleLoading(true);
    handleData(`${urlPrefix}:5000/api/v1/user/`, handleAddUser, 'POST', JSON.stringify(toSend))
};
const listenToSave = function () {
    let saveBtn = document.querySelectorAll('.js-save');
    for (let btn of saveBtn) {
        btn.addEventListener('click', function (el) {
            let name = document.querySelector('#name').value;
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
            sendNewUser(toSend);
        })
    }
};
const listenToGoogle = function () {
    googleState = 0;
    let googlecal = document.querySelector('.js-googlecal');
    googlecal.addEventListener('click', function () {
        if (googlecal.getAttribute('data-action') === 'connect') {
            getGoogleUri();
        } else {
            googleState = 0;
            googlecal.innerHTML = 'Connect Google Calendar';
            googlecal.setAttribute('data-action', 'connect');
        }
    })
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
const listenToNextBtn = function () {
    let nextBtn = document.querySelectorAll('.js-next');
    for (let btn of nextBtn) {
        btn.addEventListener('click', function (el) {
            if(currentPart === 2){
                let name = document.querySelector('#name').value;
                if(name === '' || name === undefined || name === null)return;
            }
            document.querySelectorAll('.js-setup__part')[currentPart].classList.add('js-part__hide');
            currentPart++;
            document.querySelectorAll('.js-setup__part')[currentPart].classList.remove('js-part__hide');
        })
    }
};
const listenToBackBtn = function () {
    let nextBtn = document.querySelectorAll('.js-back');
    for (let btn of nextBtn) {
        btn.addEventListener('click', function (el) {
            document.querySelectorAll('.js-setup__part')[currentPart].classList.add('js-part__hide');
            currentPart--;
            document.querySelectorAll('.js-setup__part')[currentPart].classList.remove('js-part__hide');
        })
    }
};
const listenToRedoBtn = function () {
    let redoBtn = document.querySelector('.js-redo');
    redoBtn.addEventListener('click', function (el) {
        document.querySelectorAll('.js-setup__part')[currentPart].classList.add('js-part__hide');
        currentPart = 2;
        document.querySelectorAll('.js-setup__part')[currentPart].classList.remove('js-part__hide');

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
        listenToGoogle();
        let calstr = '';
        document.querySelector('.js-ical__group').innerHTML = calstr;
    })
};
const listenToFinish = function () {
  let finishBtn = document.querySelector('.js-finish');
  finishBtn.addEventListener('click', function (el) {
      sendFinish();
  })
};
const handleFinish = function (data) {
    window.location = urlPrefix;
};
const sendFinish = function () {
    toggleLoading(true);

    let toSend = {
        setup: true
    };
    handleData(`${urlPrefix}:5000/api/v1/settings/setup`, handleFinish, 'POST',JSON.stringify(toSend));
};
const handleRedirect = function (data) {
    if (url.hostname !== data.domain || url.protocol !== data.protocol + ":") {
        console.error('WRONG IP ' + url.href);
        url.protocol = data.protocol + ":";
        url.hostname = data.domain;
        window.location = url.href; //'http://example.com:8080/one/two'
    } else {
        urlPrefix = `${data.protocol}://${url.host}`;
        init();
    }
};

const getRedirect = function () {
    handleData(`connection`, handleRedirect)
};

const init = function () {
    listenToQuantityCounter();
    listenToNextBtn();
    listenToBackBtn();
    listenToRedoBtn();
    listenToFinish();
    listenToGoogle();
    listenToSave();
    listenToIcalAdd();
};
document.addEventListener('DOMContentLoaded', function () {
    getRedirect()
});