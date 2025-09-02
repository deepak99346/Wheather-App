const form = document.getElementById('searchForm');
const input = document.getElementById('cityInput');
const status = document.getElementById('status');
const result = document.getElementById('result');


function showStatus(msg = '', isError = false) {
status.textContent = msg;
status.style.color = isError ? 'crimson' : 'black';
}


function render(data) {
result.hidden = false;
result.innerHTML = `
<h3>${data.name}, ${data.country}</h3>
<p>${data.description} — ${data.temp}°C (feels like ${data.feels_like}°C)</p>
<p>Humidity: ${data.humidity}% — Wind: ${data.wind} m/s</p>
${data.icon ? `<img src="https://openweathermap.org/img/wn/${data.icon}@2x.png" alt="${data.description}">` : ''}
<small>Source: ${data.source}</small>
`;
}


form.addEventListener('submit', async (e) => {
e.preventDefault();
const city = input.value.trim();
if (!city) return;
showStatus('Loading...');
result.hidden = true;


try {
const res = await fetch('/weather/' + encodeURIComponent(city));


// Handle HTTP errors
if (!res.ok) {
let errorMsg = res.statusText;
try {
const payload = await res.json();
errorMsg = payload.error || errorMsg;
} catch (e) {}
showStatus('Error: ' + errorMsg, true);
return;
}


const data = await res.json();
render(data);
showStatus('');
} catch (err) {
console.error(err);
showStatus('Network error — ' + err.message, true);
}
});
