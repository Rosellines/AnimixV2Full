
const fs = require('fs');
const axios = require('axios');
const colors = require('colors');
const readline = require("readline");

const clan_id = 4428;
const maxThreads= 50000;
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
