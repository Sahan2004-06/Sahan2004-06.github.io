// Script.js (Simplified for index.html)
const detailsContainer = document.getElementById('earthquake-details');

fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=50')

  .then(res => res.json())
  .then(data => {
    localStorage.setItem('earthquakeList', JSON.stringify(data.features));
    displayEarthquakes(data.features);
  })
  .catch(() => {
    detailsContainer.innerHTML = '<p class="text-danger">Failed to load earthquake data.</p>';
  });

function displayEarthquakes(filteredEarthquakes) {
  detailsContainer.innerHTML = '';
  filteredEarthquakes.forEach((earthquake) => {
    const card = document.createElement('div');
    card.className = 'card mb-3';
    card.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">${earthquake.properties.place}</h5>
        <p class="card-text"><strong>Magnitude:</strong> ${earthquake.properties.mag}</p>
        <p class="card-text"><strong>Depth:</strong> ${earthquake.geometry.coordinates[2]} km</p>
        <p class="card-text"><strong>Time:</strong> ${new Date(earthquake.properties.time).toLocaleString()}</p>
        <p class="card-text"><strong>Coordinates:</strong> [${earthquake.geometry.coordinates[1]}, ${earthquake.geometry.coordinates[0]}]</p>
        <p class="card-text"><strong>More Info:</strong> <a href="${earthquake.properties.url}" target="_blank">USGS Report</a></p>
      </div>
    `;
    detailsContainer.appendChild(card);
  });
}
