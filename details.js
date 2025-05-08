const detailsContainer = document.getElementById('earthquake-details');
const searchBar = document.getElementById('search-bar');

let earthquakeList = JSON.parse(localStorage.getItem('earthquakeList'));

// Function to display earthquake details
function displayEarthquakes(filteredEarthquakes) {
  detailsContainer.innerHTML = ''; // Clear previous results

  if (filteredEarthquakes.length > 0) {
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
  } else {
    detailsContainer.innerHTML = '<p class="text-danger">No earthquakes match your search criteria.</p>';
  }
}

// If earthquakeList is null, fetch from API
if (!earthquakeList) {
  fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=50')
    .then(res => res.json())
    .then(data => {
      earthquakeList = data.features;
      localStorage.setItem('earthquakeList', JSON.stringify(earthquakeList));
      displayEarthquakes(earthquakeList);
    })
    .catch(() => {
      detailsContainer.innerHTML = '<p class="text-danger">Failed to load earthquake data.</p>';
    });
} else {
  // Display from localStorage
  displayEarthquakes(earthquakeList);
}

// Add event listener for search bar
searchBar.addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();

  const filteredEarthquakes = earthquakeList.filter((earthquake) => {
    const location = earthquake.properties.place.toLowerCase();
    const magnitude = earthquake.properties.mag.toString();
    return location.includes(query) || magnitude.includes(query);
  });

  displayEarthquakes(filteredEarthquakes);
});
