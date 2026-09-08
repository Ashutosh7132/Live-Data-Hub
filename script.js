// Global variables
let cryptoChart = null;
let populationChart = null;
let covidChart = null;
let populationInterval = null;
let cryptoInterval = null;
let clockInterval = null;

// Base population (2024 estimate)
const BASE_POPULATION = 8050000000;
let currentPopulation = BASE_POPULATION;
let birthsPerSecond = 4.3;
let deathsPerSecond = 1.8;

// API endpoints
const APIs = {
    crypto: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false',
    weather: 'https://api.openweathermap.org/data/2.5/group?id=2643743,5128581,1850147,2147714,1819729&units=metric&appid=YOUR_API_KEY',
    exchange: 'https://api.exchangerate-api.com/v4/latest/USD',
    covid: 'https://disease.sh/v3/covid-19/all',
    population: 'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=1'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    loadCryptoData();
    loadWeatherData();
    loadExchangeRates();
    loadCovidData();
    startPopulationCounter();
    setupNavigation();
    
    // Set intervals for real-time updates
    cryptoInterval = setInterval(loadCryptoData, 30000); // Update crypto every 30 seconds
    setInterval(loadWeatherData, 600000); // Update weather every 10 minutes
    setInterval(loadExchangeRates, 3600000); // Update exchange rates every hour
    setInterval(loadCovidData, 86400000); // Update COVID data daily
});

// Clock
function startClock() {
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('liveClock').textContent = timeString;
    document.getElementById('dateDisplay').textContent = dateString;
    document.getElementById('lastUpdated').textContent = `Last updated: ${timeString}`;
}

// Cryptocurrency Data
async function loadCryptoData() {
    try {
        const response = await axios.get(APIs.crypto);
        const cryptoData = response.data;
        
        displayCryptoData(cryptoData);
        createCryptoChart(cryptoData);
        updateBitcoinStat(cryptoData[0]);
        
    } catch (error) {
        console.error('Error loading crypto data:', error);
        showError('cryptoGrid', 'Failed to load cryptocurrency data');
    }
}

function displayCryptoData(data) {
    const cryptoGrid = document.getElementById('cryptoGrid');
    cryptoGrid.innerHTML = '';
    
    data.forEach(crypto => {
        const changeClass = crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        const card = document.createElement('div');
        card.className = 'crypto-card';
        card.innerHTML = `
            <img src="${crypto.image}" alt="${crypto.name}">
            <h3>${crypto.name}</h3>
            <p class="crypto-price">$${crypto.current_price.toLocaleString()}</p>
            <p class="crypto-change ${changeClass}">
                ${crypto.price_change_percentage_24h >= 0 ? '▲' : '▼'} 
                ${Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
            </p>
        `;
        cryptoGrid.appendChild(card);
    });
}

function updateBitcoinStat(bitcoin) {
    if (bitcoin) {
        const btcPrice = document.getElementById('btcPrice');
        const btcChange = document.getElementById('btcChange');
        
        btcPrice.textContent = `$${bitcoin.current_price.toLocaleString()}`;
        btcChange.textContent = `${bitcoin.price_change_percentage_24h >= 0 ? '+' : ''}${bitcoin.price_change_percentage_24h.toFixed(2)}% (24h)`;
        btcChange.className = `stat-change ${bitcoin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`;
    }
}

function createCryptoChart(data) {
    const ctx = document.getElementById('cryptoChart').getContext('2d');
    
    if (cryptoChart) {
        cryptoChart.destroy();
    }
    
    cryptoChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(crypto => crypto.name),
            datasets: [{
                label: 'Price (USD)',
                data: data.map(crypto => crypto.current_price),
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Cryptocurrencies by Market Cap',
                    font: { size: 16, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price (USD)'
                    }
                }
            }
        }
    });
}

// Weather Data
async function loadWeatherData() {
    try {
        // Using OpenWeatherMap API
        // Note: Replace 'YOUR_API_KEY' with actual API key
        const cities = [
            { name: 'London', lat: 51.5074, lon: -0.1278 },
            { name: 'New York', lat: 40.7128, lon: -74.0060 },
            { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
            { name: 'Paris', lat: 48.8566, lon: 2.3522 },
            { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
            { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
            { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
            { name: 'Mumbai', lat: 19.0760, lon: 72.8777 }
        ];
        
        const weatherGrid = document.getElementById('weatherGrid');
        weatherGrid.innerHTML = '';
        
        // Try to use free weather API (Open-Meteo)
        for (const city of cities) {
            try {
                const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`);
                const weather = response.data.current_weather;
                
                const card = document.createElement('div');
                card.className = 'weather-card';
                card.innerHTML = `
                    <h3>${city.name}</h3>
                    <p class="weather-temp">${weather.temperature}°C</p>
                    <p class="weather-desc">Wind: ${weather.windspeed} km/h</p>
                `;
                weatherGrid.appendChild(card);
                
                if (city.name === 'London') {
                    document.getElementById('globalTemp').textContent = `${weather.temperature}°C`;
                }
            } catch (error) {
                console.error(`Error loading weather for ${city.name}:`, error);
            }
        }
        
    } catch (error) {
        console.error('Error loading weather data:', error);
        showError('weatherGrid', 'Failed to load weather data');
    }
}

// World Population Counter
function startPopulationCounter() {
    const startTime = Date.now();
    let lastMinutePopulation = currentPopulation;
    
    populationInterval = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const netGrowthPerSecond = birthsPerSecond - deathsPerSecond;
        currentPopulation = BASE_POPULATION + (netGrowthPerSecond * elapsedSeconds);
        
        const birthsToday = Math.floor(birthsPerSecond * elapsedSeconds);
        const deathsToday = Math.floor(deathsPerSecond * elapsedSeconds);
        
        document.getElementById('populationCounter').textContent = 
            Math.floor(currentPopulation).toLocaleString();
        document.getElementById('birthsToday').textContent = birthsToday.toLocaleString();
        document.getElementById('deathsToday').textContent = deathsToday.toLocaleString();
        document.getElementById('netGrowth').textContent = (birthsToday - deathsToday).toLocaleString();
        
        // Update quick stat
        document.getElementById('worldPopulation').textContent = 
            Math.floor(currentPopulation).toLocaleString();
        
        // Calculate population change in last minute
        if (elapsedSeconds % 60 < 1) {
            const minuteChange = Math.floor(currentPopulation - lastMinutePopulation);
            document.getElementById('populationChange').textContent = 
                `+${minuteChange.toLocaleString()} this minute`;
            lastMinutePopulation = currentPopulation;
        }
    }, 1000);
}

// Exchange Rates
async function loadExchangeRates() {
    try {
        const response = await axios.get(APIs.exchange);
        const rates = response.data.rates;
        
        const currencies = ['EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'INR', 'SGD', 'NZD'];
        const exchangeBody = document.getElementById('exchangeBody');
        exchangeBody.innerHTML = '';
        
        currencies.forEach(currency => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${getCurrencyName(currency)}</td>
                <td>${currency}</td>
                <td>${rates[currency].toFixed(4)}</td>
                <td>Live Rate</td>
            `;
            exchangeBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading exchange rates:', error);
        showError('exchangeBody', 'Failed to load exchange rates');
    }
}

function getCurrencyName(code) {
    const names = {
        'EUR': 'Euro',
        'GBP': 'British Pound',
        'JPY': 'Japanese Yen',
        'CNY': 'Chinese Yuan',
        'AUD': 'Australian Dollar',
        'CAD': 'Canadian Dollar',
        'CHF': 'Swiss Franc',
        'INR': 'Indian Rupee',
        'SGD': 'Singapore Dollar',
        'NZD': 'New Zealand Dollar'
    };
    return names[code] || code;
}

// COVID-19 Data
async function loadCovidData() {
    try {
        const response = await axios.get(APIs.covid);
        const data = response.data;
        
        document.getElementById('totalCases').textContent = 
            data.cases.toLocaleString();
        document.getElementById('totalDeaths').textContent = 
            data.deaths.toLocaleString();
        document.getElementById('totalRecovered').textContent = 
            data.recovered.toLocaleString();
        document.getElementById('activeCases').textContent = 
            data.active.toLocaleString();
        
        // Update quick stats
        document.getElementById('covidCases').textContent = 
            data.cases.toLocaleString();
        document.getElementById('covidNew').textContent = 
            `+${data.todayCases.toLocaleString()} today`;
        
        createCovidChart(data);
        
    } catch (error) {
        console.error('Error loading COVID data:', error);
        showError('covidChart', 'Failed to load COVID data');
    }
}

function createCovidChart(data) {
    const ctx = document.getElementById('covidChart').getContext('2d');
    
    if (covidChart) {
        covidChart.destroy();
    }
    
    covidChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active Cases', 'Recovered', 'Deaths'],
            datasets: [{
                data: [data.active, data.recovered, data.deaths],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'COVID-19 Cases Distribution',
                    font: { size: 16, weight: 'bold' }
                }
            }
        }
    });
}

// Refresh all data
function refreshAllData() {
    loadCryptoData();
    loadWeatherData();
    loadExchangeRates();
    loadCovidData();
    
    // Show refresh animation
    const btn = document.querySelector('.refresh-btn');
    btn.textContent = '🔄 Refreshing...';
    setTimeout(() => {
        btn.textContent = '🔄 Refresh Now';
    }, 2000);
}

// Error handling
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div style="text-align:center; padding:20px; color:#666;">${message}</div>`;
    }
}

// Navigation setup
function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Close menu when clicking a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}