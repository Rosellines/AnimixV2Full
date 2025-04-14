
const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const colors = require('colors');
const readline = require("readline");

const clan_id = 4428;
const maxThreads= 100;
const taskTimeout = 20 * 60 * 1000; // Timeout 20 menit untuk setiap akun

let missionsData = null;

async function loadMissionsFromAnimix() {
    try {
        const response = await axios.get('https://statics.animix.tech/missions.json');
        missionsData = response.data;
        console.log('Berhasil memuat missions.json.'.cyan);
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
            'Sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'Sec-ch-ua-mobile': '?0',
            'Sec-ch-ua-platform': '"Windows"',
            'Sec-fetch-dest': 'empty',
            'Sec-fetch-mode': 'cors',
            'Sec-fetch-site': 'same-site',
            'User-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async checkProxyIP(proxy, stt) {
        return new Promise(async (resolve, reject) => {
            try {
                const proxyAgent = new HttpsProxyAgent(proxy);
                const response = await axios.get('https://api.ipify.org?format=json', {
                    httpsAgent: proxyAgent
                });

                if (response.status === 200) {
                    console.log(colors.blue(`[Akun ${stt}] Menggunakan proxy ${proxy} - IP: ${response.data.ip}`));
                    resolve(proxyAgent);
                } else {
                    throw new Error(`Tidak dapat memeriksa IP proxy. Status code: ${response.status}`);
                }
            } catch (error) {
                console.error(colors.red(`[Akun ${stt}] Gagal memeriksa proxy: ${proxy}. Detail: ${error.message}`));
                reject(error);
            }
        });
    }
}
