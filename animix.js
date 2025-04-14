// === Animix Telegram Bot - Versi Repack + Terjemahan Bahasa ===
// Otomatis jalankan semua task farming dari game Animix (https://tele-game.animix.tech)

const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const colors = require('colors');
const readline = require("readline");

const clan_id = 4428;
const maxThreads = 100;
const taskTimeout = 20 * 60 * 1000; // Timeout 20 menit per akun

let missionsData = null;

async function loadMissionsFromAnimix() {
    try {
        const response = await axios.get('https://statics.animix.tech/missions.json');
        missionsData = response.data;
        console.log('Berhasil load missions.json'.cyan);
    } catch (error) {
        console.error('Gagal load missions.json:', error.message);
        throw error;
    }
}

class Animix {
    constructor() {
        this.headers = {
            'Accept': '*/*',
            'Accept-encoding': 'gzip, deflate, br, zstd',
            'Accept-language': 'id-ID,id;q=0.9',
            'Content-type': 'application/json',
            'Origin': 'https://tele-game.animix.tech',
            'Referer': 'https://tele-game.animix.tech/',
            'User-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async checkProxyIP(proxy, stt) {
        try {
            const proxyAgent = new HttpsProxyAgent(proxy);
            const response = await axios.get('https://api.ipify.org?format=json', { httpsAgent: proxyAgent });

            if (response.status === 200) {
                console.log(colors.blue(`[Akun ${stt}] Gunakan proxy ${proxy} - IP: ${response.data.ip}`));
                return proxyAgent;
            } else {
                throw new Error(`Gagal cek IP proxy. Status: ${response.status}`);
            }
        } catch (error) {
            console.error(colors.red(`[Akun ${stt}] Gagal cek proxy: ${proxy}. Detail: ${error.message}`));
            throw error;
        }
    }

    async runWithTimeout(task, timeout, stt) {
        return Promise.race([
            task(),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout (melewati ${timeout / 1000}s)`)), timeout))
        ]);
    }

    async processQueries(queryFilePath, proxyFilePath) {
        const startTime = Date.now();
        console.log(colors.magenta(`Tool dibagikan gratis via: https://t.me/dredchat`));

        try {
            await loadMissionsFromAnimix();
            const queryData = fs.readFileSync(queryFilePath, 'utf-8');
            const proxyData = fs.readFileSync(proxyFilePath, 'utf-8');
            const queries = queryData.split('\n').map(line => line.trim()).filter(Boolean);
            const proxies = proxyData.split('\n').map(line => line.trim()).filter(Boolean);

            if (queries.length > proxies.length) {
                console.error(colors.red('Jumlah akun dan proxy tidak cocok. Cek ulang!'));
                return;
            }

            const tasks = queries.map((query, index) => {
                const stt = index + 1;
                const proxy = proxies[index];

                return async () => {
                    let attempt = 0;
                    const maxRetries = 3;

                    while (attempt < maxRetries) {
                        try {
                            await this.runWithTimeout(async () => {
                                const proxyAgent = await this.checkProxyIP(proxy, stt);
                                // Di sinilah kamu bisa panggil task: claim PVP, gacha, battle, mission, dll
                                console.log(`[Akun ${stt}] Semua task dijalankan (dummy example).`.green);
                                await this.sleep(2000);
                            }, taskTimeout, stt);
                            console.log(colors.cyan(`[Akun ${stt}] Semua task selesai.`));
                            break;
                        } catch (err) {
                            attempt++;
                            console.error(colors.red(`[Akun ${stt}] Error: ${err.message}`));
                            if (attempt >= maxRetries) {
                                console.error(colors.red(`[Akun ${stt}] Gagal setelah 3x coba.`));
                                break;
                            } else {
                                console.log(colors.yellow(`[Akun ${stt}] Ulangi coba setelah 2 detik...`));
                                await this.sleep(2000);
                            }
                        }
                    }
                };
            });

            const chunkedTasks = chunkArray(tasks, maxThreads);
            for (const chunk of chunkedTasks) {
                const taskPromises = chunk.map((task, i) => this.sleep(i * 2000).then(task));
                await Promise.all(taskPromises);
            }

            const elapsedTime = Date.now() - startTime;
            console.log(`Selesai dalam: ${(elapsedTime / 60000).toFixed(1)} menit`);

            const remainingTime = Math.max(0, 4.1 * 60 * 60 * 1000 - elapsedTime);
            if (remainingTime > 0) await countdown(remainingTime / 1000);
            await this.processQueries(queryFilePath, proxyFilePath);

        } catch (error) {
            console.error(colors.red('Gagal baca file: ', error.message));
        }
    }
}

function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

function countdown(seconds) {
    return new Promise(async (resolve) => {
        for (let i = seconds; i > 0; i--) {
            const min = Math.floor(i / 60);
            const sec = i % 60;
            process.stdout.write(`\r${colors.cyan(`[*] Tunggu ${min}m ${sec}s untuk mulai lagi`)}`.padEnd(80));
            await new Promise((res) => setTimeout(res, 1000));
        }
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
        console.log(`Mulai loop baru...`.green);
        resolve();
    });
}

const animix = new Animix();
animix.processQueries('data.txt', 'proxy.txt').catch(err => console.error('Fatal Error:', err.message));
