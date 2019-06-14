let uriCalendar = urlPrefix+`/api/v1/calendar/`;

const getCalendar = function (user) {
    handleData(`${uriCalendar}${user}`, showCalendar)
};

const showCalendar = function (json) {
    let str = '';
    let today = new Date();
    json.sort(function (a, b) {
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        return a.fullDay?-1:new Date(parseISOString(a.start)) - new Date(parseISOString(b.start));
    });
    if (json.length > 0) {
        for (const ev of json) {
            let start;
            if (ev.fullDay) {
                // const date_str = `${today.getFullYear().toString().padStart(4, '0')}-${(today.getMonth()+1).toString().padStart(2, '0')}-${(today.getUTCDate()).toString().padStart(2, '0')}`;
                // console.log(ev.start.date, date_str);

                // if (ev.start !== date_str){
                //     continue;
                // }
                start = 'Now';
            } else {
                let date = new Date(parseISOString(ev.start));
                start = `${zeroFill(date.getHours(), 2)}:${zeroFill(date.getMinutes(), 2)}`
            }

            let summary = ev['summary'];

            str += `<div class="c-calendar__item">
                        <h2>${start}</h2>
                        <h2>&bullet;</h2>
                        <h2>${summary}</h2>
                    </div>`
        }
    } else {
        str += `<div class="c-calendar__item">
                        <h2>No events for today.</h2>
                    </div>`
    }
    document.querySelector('.js-calendar').innerHTML = str;
    sessionReady();
};

function parseISOString(s) {
    var b = s.split(/\D+/);
    return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}