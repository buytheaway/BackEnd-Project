window.onSpotifyWebPlaybackSDKReady = () => {
    fetch('/get-token') // Запрос на сервер для получения токена
        .then(response => response.json())
        .then(data => {
            const token = data.access_token;

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
        })
        .catch(error => {
            console.error('Error fetching token:', error);
        });
};
