//MANUAL SIZE ADJUSTMENT
//u-width-full
let oldUrl = window.location;
let url = new URL(oldUrl);
let urlPrefix = `${url.protocol}//${url.host}:5000`;
console.log(urlPrefix);
const getScreen = function () {
    handleData(urlPrefix + '/api/v1/monitor', showScreenAdjustments)
};
const showScreenAdjustments = function (data) {
    let obj = document.querySelectorAll('.u-width-full');
    let total = data.right + data.left;
    for (let o of obj) {
        o.style.width = `calc(100% - (${total}${data.unit}))`;
        o.style.marginLeft = `${data.left}${data.unit}`;
    }
};

document.addEventListener('DOMContentLoaded', function () {
    getScreen();
    initUsers();
    getWeather();
    setInterval(getWeather, 900000);
    getTimezone();
    updateTime();
    setInterval(updateTime, 1000);

    // getCalendar();
    // setInterval(getCalendar, 3600000);
    getIP();

});