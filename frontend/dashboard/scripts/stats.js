// let urlPrefix = `${String(window.location).substring(0, String(window.location).length - 1)}:5000`;
let urlPrefix;
let oldUrl = window.location;
let url = new URL(oldUrl);
let timezone;
let sessions = [];
let labels = [];
let chart;
let dataarray = [];
const toggleLoading = function (obj, val) {
    let elem = obj;
    if (!val) {
        elem.classList.remove('c-settings--locked');
    } else {
        elem.classList.add('c-settings--locked');
    }
};
const showTemperature = function (data) {
    for (let rw of data) {
        let date = new Date(rw.datetime);

        let hour_string = `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}u`;
        // let date_string = `${date.getDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().padStart(4, '0')}`;
        let date_string = `${date.getDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`;

        labels.push(date);
        dataarray.push(rw.value);
    }
    var ctx = document.getElementById('temperatureData').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Date Time'
                    },

                }],
                yAxes: [{
                    display: true,
                    ticks: {
                        suggestedMin: 15,    // minimum will be 0, unless there is a lower value.
                        suggestedMax: 30,
                    }
                }]
            },
            tooltips: {
                intersect: false,
                mode: 'index'
            }
        },

        data: {
            labels: labels,
            datasets: [{
                spanGaps: false,
                label: 'Inside temperature (°C)',
                data: dataarray,
                backgroundColor: 'rgba(0,85,255,0.5)',
                borderWidth: 0,
                pointRadius: 0,
                borderColor: 'rgba(0,0,0,0)'
                // backgroundColor: [
                //     'transparent'
                // ],
                // borderColor: [
                //     'rgba(255, 0, 0, 1)'
                // ],
                // pointBackgroundColor: 'white'
            }]
        },

    });
    toggleLoading(document.querySelectorAll('.c-settings')[1], false);

};
const convertUTCDateToLocalDate = function (datesec) {
    // let newDate = new Date(new Date(datesec).getTime()+new Date(datesec).getTimezoneOffset()*60*1000);
    // // let thisisadate = new Date(datesec).getTime();
    // //
    // let offset = new Date(datesec).getTimezoneOffset() / 60;
    // let hours = new Date(datesec).getHours();
    //
    // newDate.setHours(hours - offset);
    //
    // return newDate;
    // // return moment(datesec,"YYYY-MM-DDTHH:mm:ss.SSS[Z]").format('DD/MM/YYYY HH:MMu');
    let b = datesec.split(/\D+/);
    return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
};
const showSessions = function (data) {
        data.sort(function (a, b) {
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return new Date(b.start) - new Date(a.start);
        });
        let str = '';
        for (let session of data) {
            let dateStart = new Date(convertUTCDateToLocalDate(session.start).toLocaleString());

            let hourStringStart = `${dateStart.getHours().toString().padStart(2, '0')}:${dateStart.getMinutes().toString().padStart(2, '0')}u`;
            let dateStringStart = `${dateStart.getDate().toString().padStart(2, '0')}/${(dateStart.getMonth() + 1).toString().padStart(2, '0')}/${dateStart.getFullYear().toString().padStart(4, '0')}`;

            let dateEnd = new Date(convertUTCDateToLocalDate(session.stop).toLocaleString());

            let hourStringEnd = `${dateEnd.getHours().toString().padStart(2, '0')}:${dateEnd.getMinutes().toString().padStart(2, '0')}u`;
            let dateStringEnd = `${dateEnd.getDate().toString().padStart(2, '0')}/${(dateEnd.getMonth() + 1).toString().padStart(2, '0')}/${dateEnd.getFullYear().toString().padStart(4, '0')}`;

            str += `<tr class="c-table__row">
                            <td>${dateStringStart} ${hourStringStart}</td>
                            <td>${dateStringEnd} ${hourStringEnd}</td>
                            <td>${session.name}</td>
                            <td>${session.motioncount}</td>
                        </tr>`;
            sessions.push(session);
        }
        document.querySelector('.js-table').innerHTML = str;
        toggleLoading(document.querySelectorAll('.c-settings')[0], false);

    }
;

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

const getTemperatureData = function () {
    toggleLoading(document.querySelectorAll('.c-settings')[1], true);
    handleData(`${urlPrefix}/api/v1/temperature/history`, showTemperature)
};

const getSessions = function () {
    toggleLoading(document.querySelectorAll('.c-settings')[0], true);
    handleData(`${urlPrefix}/api/v1/user/session`, showSessions)
};

// const getTimezone = function () {
//     handleData(`${urlPrefix}/api/v1/settings/timezone`, handleTimezone)
// };
// const handleTimezone = function (data) {
//     moment.tz.setDefault(data.timezone);
// };
const getRedirect = function () {
    handleData(`connection`, handleRedirect)
};

const init = function () {
    socket = io(urlPrefix, {transports: ['websocket']});
    socket.on('tempUpdate', function (data) {
        let temp = data.temp;
        chart.data.labels.push(new Date());
        chart.data.datasets.forEach((dataset) => {
            dataset.data.push(temp);
        });
        chart.update();
    });
    socket.on('userUpdate', function (data) {
        toggleLoading(document.querySelectorAll('.c-settings')[0], true);

        sessions.unshift(data);
        let str = '';
        for (let session of sessions) {

            let dateStart = new Date(convertUTCDateToLocalDate(session.start).toLocaleString());

            let hourStringStart = `${dateStart.getHours().toString().padStart(2, '0')}:${dateStart.getMinutes().toString().padStart(2, '0')}u`;
            let dateStringStart = `${dateStart.getDate().toString().padStart(2, '0')}/${(dateStart.getMonth() + 1).toString().padStart(2, '0')}/${dateStart.getFullYear().toString().padStart(4, '0')}`;

            let dateEnd = new Date(convertUTCDateToLocalDate(session.stop).toLocaleString());

            let hourStringEnd = `${dateEnd.getHours().toString().padStart(2, '0')}:${dateEnd.getMinutes().toString().padStart(2, '0')}u`;
            let dateStringEnd = `${dateEnd.getDate().toString().padStart(2, '0')}/${(dateEnd.getMonth() + 1).toString().padStart(2, '0')}/${dateEnd.getFullYear().toString().padStart(4, '0')}`;

            str += `<tr class="c-table__row">
                            <td>${dateStringStart} ${hourStringStart}</td>
                            <td>${dateStringEnd} ${hourStringEnd}</td>
                            <td>${session.name}</td>
                            <td>${session.motioncount}</td>
                        </tr>`;
        }
        document.querySelector('.js-table').innerHTML = str;
        toggleLoading(document.querySelectorAll('.c-settings')[0], false);
    });

    console.log(url.hostname);
    getSessions();
    getTemperatureData();
};
document.addEventListener('DOMContentLoaded', function () {
    getRedirect();
});