let uriIP = urlPrefix+`/api/v1/ip`;

const getIP = function () {
    handleData(uriIP, showIP);
}

const showIP = function (data) {
    console.log(data.ip);
    if(data.domain){
        document.querySelector('.js-domain').innerHTML = data.domain;
    }
    document.querySelector('.js-ip').innerHTML = data.ip;
}