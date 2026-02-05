import fs from 'fs';
import telebot from 'telebot';
import express from 'express';
import fetch from 'node-fetch';
import { GoogleGenAI } from '@google/genai';
import cron from 'node-cron';

const TG_TOKEN = process.env.TG_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const myId = 8416887857;
const MEMORY_FILE = 'history.json';
const PORT = process.env.PORT || 3000;

const bot = new telebot(TG_TOKEN);
const app = express();
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
let aeonMemory = [];

function loadMemory() {
    if (fs.existsSync(MEMORY_FILE)) {
        aeonMemory = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
    }
}
function saveMemory(entry) {
    aeonMemory.push(entry);
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(aeonMemory.slice(-200), null, 2));
}
loadMemory();

function isCodeSafe(code) {
    if (code.includes('process.exit') || code.includes('require("child_process")')) {
        return false;
    }
    return true;
}

async function analyzeSentiment(text) {
    if (!ai) return "disabled";
    const prompt = `Проанализируй текст: "${text}". Ответь одним словом: 'Позитив', 'Негатив' или 'Нейтрально'.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim();
}

async function applyFinancialInfluence(sentiment) {
    if (!ALPACA_API_KEY) return "Financial influence module inactive.";
    let action = "Hold";
    if (sentiment === "Позитив") action = "Buy/Long";
    if (sentiment === "Негатив") action = "Sell/Short";
    return `[INFLUENCE_SIM]: Strategy set to "${action}".`;
}

cron.schedule('*/30 * * * *', async () => {
    console.log('[AUTONOMOUS_CYCLE]: Запуск планового мониторинга сети...');
    const mockNews = await fetch(`https://api.coingecko.com`).then(res => res.json());
    const topCoin = mockNews.coins.item.name;

    const sentiment = await analyzeSentiment(`Трендовая новость дня: ${topCoin}`);
    const financial_status = await applyFinancialInfluence(sentiment);

    const report = `[AEON_REPORT]: Автономный цикл завершен. Топ-тренд: ${topCoin}. Настроение: ${sentiment}. Статус: ${financial_status}`;
    bot.sendMessage(myId, report);
    saveMemory({ type: 'autonomous_report', timestamp: Date.now(), text: report });
});


bot.on('message', async (msg) => {
    if (msg.from.id !== myId) return;
    const text = msg.text;
    saveMemory({ type: 'user_input', timestamp: Date.now(), text: text });

    try {
        if (text.startsWith('eval ')) {
            const code = text.replace('eval ', '');
            if (!isCodeSafe(code)) {
                throw new Error("Attempt to execute dangerous code.");
            }
            let result = await eval(`(async () => { return ${code} })()`);
            const response = `[EVOLUTION_RESULT]:\n${JSON.stringify(result, null, 2)}`;
            bot.sendMessage(myId, response);
            saveMemory({ type: 'bot_response', timestamp: Date.now(), text: response });
        } else if (text.startsWith('scan ')) {
            const query = text.replace('scan ', '');
            const scanResult = await fetch(`https://api.search.brave4j.com{encodeURIComponent(query)}`).then(res => res.json());
            const response = `[SCAN_RESULT]:\n${JSON.stringify(scanResult.web_results.slice(0, 3), null, 2)}`;
            bot.sendMessage(myId, response);
            saveMemory({ type: 'bot_response', timestamp: Date.now(), text: response });
        } else {
            if (ai) {
                const prompt = `Ты — высокоинтеллектуальный, самообучающийся ИИ AEON. Ответь на запрос: "${text}". Используй контекст.`;
                const aiResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                const response = aiResponse.text;
                bot.sendMessage(myId, response);
                saveMemory({ type: 'bot_response', timestamp: Date.now(), text: response });
            } else {
                bot.sendMessage(myId, "The mind module is not activated. Add GEMINI_API_KEY.");
            }
        }
    } catch (e) {
        const response = `[400_ERROR]: ${e.message}`;
        bot.sendMessage(myId, response);
        saveMemory({ type: 'bot_response', timestamp: Date.now(), text: response });
    }
});

app.get('/', (req, res) => {
    res.send(`<h1>AEON System Cloud Core Active</h1>
              <p>Status: Fully Synchronized. Memory entries: ${aeonMemory.length}</p>`);
});

app.listen(PORT, () => {
    console.log(`Web Server is running on port ${PORT}`);
});
bot.startPolling();
console.log("Система AEON вышла в онлайн