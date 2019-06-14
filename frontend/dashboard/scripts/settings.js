let urlPrefix;
let oldUrl = window.location;
let url = new URL(oldUrl);

var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

const success = function (pos) {
    var crd = pos.coords;
    //
    // console.log('Your current position is:');
    // console.log(`Latitude : ${crd.latitude}`);
    // console.log(`Longitude: ${crd.longitude}`);
    // console.log(`More or less ${crd.accuracy} meters.`);
    let position = {long: crd.longitude, lat: crd.latitude};
    handleData(`${urlPrefix}/api/v1/settings/location`, handleLocation, 'POST', JSON.stringify(position))
};

const handleLocation = function (data) {
    console.log(`Location successfully sent: Long:${data.long} Lat:${data.lat}`)
};

const error = function (err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
};


const listenToLocationBtn = function () {
    document.querySelector('.js-updatelocation').addEventListener('click', function (el) {
        navigator.geolocation.getCurrentPosition(success, error, options);
    })
};
const listenToSpeakerBtn = function () {
    document.querySelector('.js-speaker').addEventListener('click', function (el) {
        handleData(`${urlPrefix}/api/v1/settings/testspeaker`)
    })
};
const handleRedirect = function (data) {
    if (url.hostname !== data.domain || url.protocol !== data.protocol + ":") {
        console.error('WRONG IP ' + url.href);
        url.protocol = data.protocol + ":";

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
    listenToLocationBtn();
    listenToSpeakerBtn();
};
document.addEventListener('DOMContentLoaded', function () {
    getRedirect()
});