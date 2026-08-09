/**
 * Server Backend Pelacak Link Publik
 * * Dokumentasi Endpoint:
 * - Tracker URL : https://domain-anda.vercel.app/track?target=https://google.com
 * - Logs Viewer : https://domain-anda.vercel.app/logs
 */

const express = require('express');
const app = express();

// Penyimpanan log sementara di memori server
const visitLogs = [];

// Endpoint 1: Link Pelacak (Diakses oleh Target)
app.get('/track', (req, res) => {
    // Ambil URL tujuan akhir (default: Google)
    const targetUrl = req.query.target || 'https://www.google.com';

    // Ekstraksi Informasi Pengunjung dari HTTP Header
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP Tidak Terdeteksi';
    const clientIp = rawIp.split(',')[0].trim(); // Ambil IP pertama jika melewati proxy
    const userAgent = req.headers['user-agent'] || 'Browser Tidak Diketahui';
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const referrer = req.headers['referer'] || 'Akses Langsung / Aplikasi';

    // Buat objek catatan log
    const logEntry = {
        id: Date.now(),
        waktu: timestamp,
        ipAddress: clientIp,
        perangkatBrowser: userAgent,
        sumberAsal: referrer,
        tujuanRedirect: targetUrl
    };

    // Simpan log ke daftar paling atas
    visitLogs.unshift(logEntry);

    // Cetak ke console server Vercel
    console.log(`[LOG KUNJUNGAN] Waktu: ${timestamp} | IP: ${clientIp} | Tujuan: ${targetUrl}`);

    // Alihkan pengunjung secara instan ke URL tujuan akhir (HTTP Status 302)
    res.redirect(302, targetUrl);
});

// Endpoint 2: Halaman Melihat Hasil Log Kunjungan
app.get('/logs', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard Log Kunjungan</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        </head>
        <body class="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
            <div class="max-w-5xl mx-auto space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                        <h1 class="text-xl font-bold text-white flex items-center gap-2">
                            <i class="fa-solid fa-server text-blue-500"></i> Server Analytics Dashboard
                        </h1>
                        <p class="text-xs text-slate-400 mt-1">Laporan Log Kunjungan Link Pelacak Real-Time</p>
                    </div>
                    <button onclick="window.location.reload()" class="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
                        <i class="fa-solid fa-rotate-right"></i> Refresh Logs
                    </button>
                </div>

                <!-- Summary -->
                <div class="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
                    <span class="text-xs text-slate-400">Total Kunjungan Terekam:</span>
                    <span class="text-lg font-bold text-emerald-400 font-mono">${visitLogs.length} Kunjungan</span>
                </div>

                <!-- Logs Table / Cards -->
                <div class="space-y-3">
                    ${visitLogs.length === 0 ? `
                        <div class="text-center py-12 text-slate-500 text-sm">
                            <i class="fa-solid fa-inbox text-3xl mb-2 block"></i>
                            Belum ada kunjungan terekam.
                        </div>
                    ` : visitLogs.map(log => `
                        <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
                            <div class="flex justify-between items-start">
                                <span class="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono px-2 py-0.5 rounded">
                                    IP: ${log.ipAddress}
                                </span>
                                <span class="text-xs font-mono text-slate-400">${log.waktu}</span>
                            </div>
                            <div class="text-xs space-y-1">
                                <p class="text-slate-300 font-medium"><span class="text-slate-500">User-Agent:</span> ${log.perangkatBrowser}</p>
                                <p class="text-slate-400"><span class="text-slate-500">Sumber Referrer:</span> ${log.sumberAsal}</p>
                                <p class="text-slate-400 truncate"><span class="text-slate-500">Tujuan Target:</span> <a href="${log.tujuanRedirect}" target="_blank" class="text-blue-400 underline">${log.tujuanRedirect}</a></p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </body>
        </html>
    `);
});

// Endpoint 3: Halaman Utama (Panduan Penggunaan)
app.get('/', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    const baseUrl = `${protocol}://${host}`;

    res.send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Panduan Link Tracker</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
            <div class="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4">
                <h1 class="text-lg font-bold text-white">Server Link Tracker Aktif!</h1>
                <p class="text-xs text-slate-400">Gunakan format URL berikut untuk membuat tautan pelacak:</p>
                
                <div class="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <p class="text-[11px] text-slate-500 font-medium">Contoh Link Pelacak:</p>
                    <code class="text-xs text-emerald-400 font-mono break-all block">
                        ${baseUrl}/track?target=https://www.google.com
                    </code>
                </div>

                <div class="pt-2">
                    <a href="${baseUrl}/logs" class="block text-center w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors">
                        Lihat Dashboard Logs Kunjungan
                    </a>
                </div>
            </div>
        </body>
        </html>
    `);
});

module.exports = app;
