if (!navigator.onLine) {
  location.href = '/offline.html';
}

if (!window.localStorage) {
  console.log('Your browser does not support indexedDB');
}

//Declare Constants
const $map = document.getElementById('map');
const $mag = document.getElementById('mag');
const $radius = document.getElementById('radius');
const $years = document.getElementById('years');
const $query = document.getElementById('query');
const $loading = document.getElementById('loading');
const currentDate = new Date();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
  .then(function () {
    console.log('[SW] Registered');
  })
  .catch(err => {
    console.warn('Error', err);
  });
}

$query.addEventListener('click', function () {
  let lat;
  let long;
  if (localStorage.getItem('lat')) {
    console.log('IN storage');
    lat = localStorage.getItem('lat');
    long = localStorage.getItem('long');
    lat = parseFloat(lat);
    long = parseFloat(long);
    query(lat, long);
  } else {
    console.log('Out of storage');
    getLocation();
  }

  $loading.style.display = 'flex';
});

function getLocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(position => {
      let lat = position.coords.latitude;
      let long = position.coords.longitude;
      localStorage.setItem('lat', lat);
      localStorage.setItem('long', long);
      query(lat, long);
    });
  } else {
    console.warn('Your browser does not support geolocation :(');
  }
}

function query(lat, long) {
  console.log('[APP] Querying');
  let mag = $mag.value;
  let years = $years.value;
  let radius = $radius.value;
  console.log(radius);

  const startTime = (currentDate.getFullYear() - years) + '-' +
   currentDate.getMonth() + '-' + currentDate.getDay();

  const endTime = currentDate.getFullYear() + '-' +
   (currentDate.getMonth()) + '-' + currentDate.getDay();

  let url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&';
  let finalURL =
  `${url}maxradius=${radius}&minmagnitude=${mag}
  &latitude=${lat}&longitude=${long}&starttime=${startTime}&endtime=${endTime}`;

  fetch(finalURL, { method: 'GET' })
    .then(resp => {
      resp.json().then(data => {
        let earthquakeData = data;
        createMap(earthquakeData, lat, long, radius);
      });
    })
    .catch(err => {
      console.warn('Fetch error: ', err);
    });
}

//Create the map with the google maps api
function createMap(data, lat, long, radius) {
  let myLatLng = { lat: lat, lng: long };
  let rad;
  let tempRad = parseInt(radius);
  if (tempRad / 2 > 30) {
    rad = 4;
  } else if (tempRad / 2 > 10) {
    rad = 6;
  } else {
    rad = 7;
  }

  let map = new google.maps.Map($map, {
    zoom: rad,
    center: myLatLng,
  });

  let coords;
  let formattedDate;
  let status;
  let mag;

  $loading.style.display = 'none';

  for (let i = 0; i < data.features.length; i++) {
    addCircle(i);
  }

  function addCircle(i) {
    coords = { lat: data.features[i].geometry.coordinates[1],
      lng: data.features[i].geometry.coordinates[0], };
    formattedDate = timeConverter(data.features[i].properties.time);
    status = data.features[i].properties.status;
    mag = data.features[i].properties.mag;
    let infowindow = new google.maps.InfoWindow({
      content: `Date: ${formattedDate}<br>Status: ${status}<br>Magnitude: ${mag}`,
    });
    let latOne = data.features[i].geometry.coordinates[1];
    let latTwo = data.features[i].geometry.coordinates[0];
    let circle = new google.maps.Circle({
      strokeColor: '#009688',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#009688',
      fillOpacity: 0.6,
      map: map,
      center: coords,
      position: new google.maps.LatLng(latOne, latTwo),
      radius: Math.pow(4, data.features[i].properties.mag),
    });
    circle.addListener('click', function () {
      infowindow.setPosition(coords);
      infowindow.open(map, circle);
    });
  }
}

//Function to convert any js date into a well formatted one
function timeConverter(time) {
  let dateToConvert = new Date(time);
  let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let year = dateToConvert.getFullYear();
  let month = months[dateToConvert.getMonth()];
  let date = dateToConvert.getDate();
  return (month + ' ' + date + ', ' + year);
}
