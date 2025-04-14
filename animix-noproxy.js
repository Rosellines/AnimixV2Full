// === Animix No Proxy Bot - Versi Repack Bahasa Indonesia ===
// Otomatis farming tanpa proxy untuk game Animix

const fs = require('fs');
const axios = require('axios');
const colors = require('colors');
const readline = require("readline");

const clan_id = 4428;
const maxThreads = 50000;
const taskTimeout = 20 * 60 * 1000; // Timeout 20 menit per akun

let missionsData = null;

async function loadMissionsFromAnimix() {
    try {
        const response = await axios.get('https://statics.animix.tech/missions.json');
        missionsData = response.data;
        console.log('Berhasil memuat missions.json'.cyan);
    } catch (error) {
        console.error('Gagal memuat missions.json:', error.message);
        throw error;
    }
}

class Animix {
    constructor() {
        this.headers = {
            'Accept': '*/*',
            'Accept-encoding': 'gzip, deflate, br, zstd',
            'Accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Content-type': 'application/json',
            'Origin': 'https://tele-game.animix.tech',
            'Referer': 'https://tele-game.animix.tech/',
            'User-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async runWithTimeout(task, timeout, stt) {
        return Promise.race([
            task(),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout (${timeout / 1000} detik)`)), timeout))
        ]);
    }

    async processQueries(queryFilePath) {
        const startTime = Date.now();
        try {
            await loadMissionsFromAnimix();
            const queryData = fs.readFileSync(queryFilePath, 'utf-8');
            const queries = queryData.split('\n').map(line => line.trim()).filter(Boolean);

            const tasks = queries.map((query, index) => {
                const stt = index + 1;
                return async () => {
                    let attempt = 0;
                    while (attempt < 3) {
                        try {
                            await this.runWithTimeout(async () => {
                                await this.checkClan(query, stt);
                                await this.claimPVP(query, stt);
                                await this.claimSeasonPass(query, stt);
                                await this.gacha(query, stt);
                                await this.setDefenseTeam(query, stt);
                                await this.attack(query, stt);
                                await this.claimBonusGacha(query, stt);
                                await this.mixPet(query, stt);
                                await this.processMission(query, stt);
                                await this.claimAchievements(query, stt);
                                const questCodes = await this.getList(query, stt);
                                for (const questCode of questCodes) {
                                    await this.checkQuest(questCode, query, stt);
                                }
                            }, taskTimeout, stt);
                            console.log(colors.cyan(`[Akun ${stt}] Semua tugas selesai!`));
                            break;
                        } catch (err) {
                            attempt++;
                            console.error(colors.red(`[Akun ${stt}] Terjadi kesalahan: ${err.message}`));
                            if (attempt >= 3) {
                                console.error(colors.red(`[Akun ${stt}] Gagal setelah 3x percobaan, lanjut ke akun berikutnya...`));
                                break;
                            } else {
                                console.log(colors.yellow(`[Akun ${stt}] Ulangi percobaan setelah 2 detik...`));
                                await this.sleep(2000);
                            }
                        }
                    }
                };
            });

            const chunkedTasks = chunkArray(tasks, maxThreads);
            for (const chunk of chunkedTasks) {
                const taskPromises = chunk.map((task, i) => this.sleep(i * 90000).then(task));
                await Promise.all(taskPromises);
            }

            const elapsedTime = Date.now() - startTime;
            console.log(`Waktu proses selesai: ${(elapsedTime / (60 * 1000)).toFixed(1)} menit`);

            const remainingTime = Math.max(0, 4.1 * 60 * 60 * 1000 - elapsedTime);
            if (remainingTime > 0) await countdown(remainingTime / 1000);
            await this.processQueries(queryFilePath);
        } catch (error) {
            console.error(colors.red('Gagal membaca data file: ', error.message));
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
            process.stdout.write(`\r${colors.cyan(`[*] Tunggu ${min} menit ${sec.toFixed(0)} detik untuk lanjut`)}`.padEnd(80));
            await new Promise((res) => setTimeout(res, 1000));
        }
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
        console.log(`Mulai loop baru...`.green);
        resolve();
    });
}

const animix = new Animix();
animix.processQueries('data.txt').catch(err => console.error('Kesalahan fatal:', err.message));
