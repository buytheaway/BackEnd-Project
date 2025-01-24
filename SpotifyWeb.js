const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const path = require('path');

const app = express();
const PORT = 8080;

// Инициализация клиента Spotify API
const spotifyApi = new SpotifyWebApi({
    clientId: '3a421a2074014f0d9de49ed10e4dbf4c',
    clientSecret: 'e3c8453264794fb4abfc7df6edd37876',
    redirectUri: 'http://localhost:8080/callback'
});

const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state'
];

// Главная страница с кнопкой "Войти через Spotify"
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head><title>Spotify Mini Player</title></head>
        <body>
            <h1>Spotify Mini Player</h1>
            <a href="/login">Login with Spotify</a>
        </body>
        </html>
    `);
});

// Авторизация пользователя
app.get('/login', (req, res) => {
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL);
});

// Callback после авторизации
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token, expires_in } = data.body;

        // Установите токены в клиент Spotify API
        spotifyApi.setAccessToken(access_token);
        spotifyApi.setRefreshToken(refresh_token);

        console.log('Access Token:', access_token);
        console.log('Refresh Token:', refresh_token);

        // Передача токена на клиент
        res.send(`
            <html>
            <head><title>Spotify Mini Player</title></head>
            <body>
                <h1>Authorization Successful!</h1>
                <div id="player-controls">
                    <button onclick="player.previousTrack()">Previous</button>
                    <button onclick="player.togglePlay()">Play/Pause</button>
                    <button onclick="player.nextTrack()">Next</button>
                </div>
                <script src="https://sdk.scdn.co/spotify-player.js"></script>
                <script>
                    window.onSpotifyWebPlaybackSDKReady = () => {
                        const token = '${access_token}';

                        const player = new Spotify.Player({
                            name: 'Spotify Mini Player',
                            getOAuthToken: cb => { cb(token); },
                            volume: 0.5
                        });

                        player.addListener('ready', ({ device_id }) => {
                            console.log('Ready with Device ID:', device_id);
                        });

                        player.addListener('not_ready', ({ device_id }) => {
                            console.log('Device ID has gone offline:', device_id);
                        });

                        player.addListener('player_state_changed', state => {
                            console.log('Player state changed:', state);
                        });

                        player.connect();
                    };
                </script>
            </body>
            </html>
        `);
    } catch (err) {
        console.error('Error during authentication:', err);
        res.send('Error during authentication');
    }
});

// Маршрут для получения токена
app.get('/get-token', (req, res) => {
    const accessToken = spotifyApi.getAccessToken();
    if (accessToken) {
        res.json({ access_token: accessToken });
    } else {
        res.status(401).json({ error: 'No access token available' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
