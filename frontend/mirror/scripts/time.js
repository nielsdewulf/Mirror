const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let now;
let uriTimezone = urlPrefix + `/api/v1/settings/timezone`;
let timezone;

const getTimezone = function () {
    handleData(uriTimezone, handleTimezone)
};
const handleTimezone = function (data) {
    timezone = data.timezone
};
const updateTime = function () {
    if (timezone) {
        let timezoneTime = new Date().toLocaleString('en-US', {timeZone: timezone});

        now = new Date(timezoneTime);
        let h = now.getHours();
        let m = now.getMinutes();
        let weekday = now.getDay();
        let month = now.getMonth();
        document.querySelector('.js-date').innerHTML = `<h2>${weekdays[weekday]}</h2><h2>${months[month]} ${now.getDate()}</h2>`;
        document.querySelector('.js-time').innerHTML = `${zeroFill(h, 2)}:${zeroFill(m, 2)}`;

    }
};

const zeroFill = function (number, width) {
    width -= number.toString().length;
    if (width > 0) {
        return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
    }
    return number + ''; // always return a string
};
