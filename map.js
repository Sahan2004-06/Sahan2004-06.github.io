// Initialize the map
const map = L.map('map').setView([20, 0], 2);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Fetch recent earthquakes (last 10)
fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=10')
  .then(res => res.json())
  .then(data => {
    if (data.features && data.features.length > 0) {
      L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          const magnitude = feature.properties.mag;
          const place = feature.properties.place;
          const url = feature.properties.url;

          // Customize the marker icon if desired
          const redIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          return L.marker(latlng, { icon: redIcon }).bindPopup(
            `<strong>${place}</strong><br>Magnitude: ${magnitude}<br><a href="${url}" target="_blank">More details</a>`
          );
        }
      }).addTo(map);
    } else {
      alert('No recent earthquakes found.');
    }
  })
  .catch(error => {
    alert('Failed to load earthquake data.');
    console.error(error);
  });
