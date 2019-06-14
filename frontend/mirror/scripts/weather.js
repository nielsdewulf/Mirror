let uriForecast = urlPrefix+`/api/v1/temperature`;
// let uriInside = `https://mirror.nielsdewulf.be:5000/api/v1/sensors`;

const getWeather = function () {
    handleData(uriForecast, showWeather);
}

const showWeather = function (json) {
    const inside = Math.round(json.inside_temperature);
    const weather = json.weather;
    let temp = Math.round(weather.currently.temperature);
    let id = weather.currently.icon;
    let sunset = new Date(weather.daily.data[0].sunsetTime * 1000);
    let sunrise = new Date(weather.daily.data[0].sunriseTime * 1000);
    let img = weatherIconToImage(id, sunset, sunrise);

    let feelslike = Math.round(weather.currently.apparentTemperature);
    let summary = weather.hourly['summary'];
    let rainprob = Math.round(weather.daily.data[0].precipProbability*100);

    document.querySelector('.js-weather__now').innerHTML = `<h1>${temp}&deg;</h1><img src="images/weather/${img}" alt="${summary}">`;
    document.querySelector('.js-weather__description').innerHTML = `
<h2>${summary}</h2>
<div class="c-weather__detail"><h2>Feels like ${feelslike}&deg;</h2>
<h2>&bullet;</h2>
<h2><img src="images/weather/Umbrella.png" alt="Umbrella"> ${rainprob}%</h2>
<h2>&bullet;</h2>
<h2>Inside ${inside}&deg;</h2></div>
`;

}

const weatherIconToImage = function (icon, sunset, sunrise) {
    let day = {
        'clear-day': 'Sun.png',
        'clear-night': 'Moon.png',
        'partly-cloudy-night': 'Cloud_Moon.png',
        'partly-cloudy-day': 'Cloud_Sun.png',
        'thunderstorm': 'Lightning_CL.png',
        'rain': 'Rain_CR.png',
        'snow': 'Snow_CS.png',
        'sleet': 'Snow_CS.png',
        'wind': 'Wind.png',
        'fog': 'Fog.png',
        'cloudy': 'Cloud.png',
        'hail': 'Hail_CH_Alt.png',
        'tornado': 'Hurricane.png'
    };
    let night = {
        'clear-day': 'Sun.png',
        'clear-night': 'Moon.png',
        'partly-cloudy-night': 'Cloud_Moon.png',
        'thunderstorm': 'Lightning_CL.png',
        'rain': 'Rain_CRM.png',
        'snow': 'Snow_CSM.png',
        'sleet': 'Snow_CSM.png',
        'wind': 'Wind_CWM.png',
        'fog': 'Fog_M.png',
        'cloudy': 'Cloud_Moon.png',
        'hail': 'Hail_CHM_Alt.png',
        'tornado': 'Hurricane.png'
    };
    let now = new Date();//'04/03/2019 02:00:00'
    if (sunset > now && sunrise < now) {
        return day[icon];
    } else {
        return night[icon];
    }
};