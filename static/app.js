'use strict';

if(!navigator.onLine){
  location.href = '/offline.html';
};

if (!window.indexedDB) {
  console.log('Your browser does not support indexedDB');
};

//Declare Constants
const $map = document.getElementById('map');
const $mag = document.getElementById('mag');
const $radius = document.getElementById('radius');
const $years = document.getElementById('years');
const $query = document.getElementById('query');
const $loading = document.getElementById('loading');
const currentDate = new Date();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', {scope: '/'})
  .then(registration => {
    console.log('[SW] Registered');
  })
  .catch(err => {
    console.warn('Error', err);
  })
};

$query.addEventListener('click', function() {
  getLocation();
  $loading.style.display = 'flex';
});

function getLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(position => {
      let lat = position.coords.latitude;
      let long = position.coords.longitude;
      query(lat, long)
    });
  } else {
    alert('Your browser does not support geolocation :(');
  }
}

function query(lat, long) {
  console.log('[APP] Querying');
  let mag = $mag.value;
  let years = $years.value;
  let radius = $radius.value;

  const startTime = (currentDate.getFullYear() - years) + '-' + currentDate.getMonth() + '-' + currentDate.getDay();
  const endTime = currentDate.getFullYear() + '-' + (currentDate.getMonth()) + '-' + currentDate.getDay();
  let url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&";
  let finalURL = `${url}maxradius=${radius}&minmagnitude=${mag}&latitude=${lat}&longitude=${long}&starttime=${startTime}&endtime=${endTime}`;

  fetch(finalURL, { method: 'GET'})
    .then(resp => {
      resp.json().then(data => {
        let earthquakeData = data;
        createMap(earthquakeData, lat, long, radius);
      })
    })
    .catch(err => {
      console.warn('Fetch error: ', err);
    })
};

//Create the map with the google maps api
function createMap(data, lat, long, radius) {
  let myLatLng = {lat: lat, lng: long};
  let rad;
  let tempRad = parseInt(radius);
  if(tempRad / 2 > 30){
    rad = 4;
  } else if(tempRad / 2 > 10) {
    rad = 6;
  } else {
    rad = 7;
  }
  let map = new google.maps.Map($map, {
    zoom: rad,
    center: myLatLng
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
    coords = {lat: data.features[i].geometry.coordinates[1], lng: data.features[i].geometry.coordinates[0]};
    formattedDate = timeConverter(data.features[i].properties.time);
    status = data.features[i].properties.status;
    mag = data.features[i].properties.mag;
    let infowindow = new google.maps.InfoWindow({
      content: `Date: ${formattedDate}<br>Status: ${status}<br>Magnitude: ${mag}`
    });
    let circle = new google.maps.Circle({
      strokeColor: '#009688',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#009688',
      fillOpacity: 0.6,
      map: map,
      center: coords,
      position: new google.maps.LatLng(data.features[i].geometry.coordinates[1], data.features[i].geometry.coordinates[0]),
      radius: 4.5 ** data.features[i].properties.mag
    });
    circle.addListener('click', function() {
      infowindow.setPosition(coords);
      infowindow.open(map, circle);
    });
  }
};

//Function to convert any js date into a well formatted one
function timeConverter(time) {
  let dateToConvert = new Date(time);
  let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let year = dateToConvert.getFullYear();
  let month = months[dateToConvert.getMonth()];
  let date = dateToConvert.getDate();
  let hour = dateToConvert.getHours();
  let min = dateToConvert.getMinutes();
  let sec = dateToConvert.getSeconds();
  return (month + ' ' + date + ', ' + year);
};
