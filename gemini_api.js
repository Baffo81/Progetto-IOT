import fs from "fs/promises";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

/* =========================================================
 * CONFIG
 * ======================================================= */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const DATA_DIR_2025 = "./data/daily_validati";
const DATA_DIR_DEFAULT = "./data/daily";
const STATION_COORDS_PATH = "./data/station_coords.json";

/* =========================================================
 * IN-MEMORY CACHE
 * ======================================================= */

let currentDate = null;
let currentData = [];
let stationCoords = null;

/* =========================================================
 * HELPERS
 * ======================================================= */

function normalizeString(value) {
    return String(value || "").trim().toLowerCase();
}

function normalizeDateOnly(value) {
    return String(value || "").trim().split("T")[0];
}

function getYearFromDate(date) {
    return new Date(date).getFullYear();
}

function getDataFilePath(date) {
    const year = getYearFromDate(date);
    const baseDir = year === 2025 ? DATA_DIR_2025 : DATA_DIR_DEFAULT;
    return path.join(baseDir, `${date}.json`);
}

function extractRecordDateOnly(item) {
    if (item.date_only) {
        return normalizeDateOnly(item.date_only);
    }

    if (item.date) {
        return new Date(item.date).toISOString().split("T")[0];
    }

    return null;
}

function extractRecordHour(item) {
    if (!item.date) return null;
    return new Date(item.date).getHours().toString().padStart(2, "0");
}

/* =========================================================
 * AQI CATEGORY
 * ======================================================= */

function getAqiCategory(pollutant, value) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return "UNKNOWN";
    }

    // Placeholder semplice: personalizza con soglie reali
    if (value <= 20) return "GOOD";
    if (value <= 40) return "FAIR";
    if (value <= 60) return "MODERATE";
    if (value <= 100) return "POOR";
    return "VERY_POOR";
}

/* =========================================================
 * DATA LOADING
 * ======================================================= */

async function loadStationCoords() {
    if (stationCoords) return stationCoords;

    const content = await fs.readFile(STATION_COORDS_PATH, "utf-8");
    stationCoords = JSON.parse(content);

    return Object.keys(stationCoords);
}

loadStationCoords().then((message) => {
    console.log(message)
})

async function loadDate(date) {
    try {
        console.log(`📥 Caricamento dati per ${date}...`);

        const filePath = getDataFilePath(date);
        console.log(`📂 Leggendo file: ${filePath}`);

        const fileContent = await fs.readFile(filePath, "utf-8");
        currentData = JSON.parse(fileContent);
        currentDate = date;

        console.log(`✅ Caricati ${currentData.length} record`);
    } catch (error) {
        console.error(`❌ Errore nel caricamento dati per ${date}:`, error);
        currentData = [];
        currentDate = null;
        throw error;
    }
}

/* =========================================================
 * DOMAIN LOGIC
 * ======================================================= */

async function getValuePollutant(location, date, time = "latest", pollutant) {
    if (!location || !date || !pollutant) {
        return {
            success: false,
            error: "Parametri obbligatori mancanti: location, date, pollutant"
        };
    }

    try {
        if (date !== currentDate) {
            await loadDate(date);
        }

        const normalizedLocation = normalizeString(location);
        const normalizedDate = normalizeDateOnly(date);
        const normalizedPollutant = String(pollutant).trim();

        let matches = currentData.filter((item) => {
            if (!item.station_name || !item.pollutant) return false;

            const stationName = normalizeString(item.station_name);
            const itemDate = extractRecordDateOnly(item);

            return (
                stationName.includes(normalizedLocation) &&
                item.pollutant === normalizedPollutant &&
                itemDate === normalizedDate
            );
        });

        if (matches.length === 0) {
            return {
                success: false,
                error: `Nessun dato trovato per "${location}" il ${date} per ${pollutant}`
            };
        }

        if (time !== "latest") {
            const normalizedTime = String(time).padStart(2, "0");

            matches = matches.filter((item) => {
                const itemHour = extractRecordHour(item);
                return itemHour === normalizedTime;
            });

            if (matches.length === 0) {
                return {
                    success: false,
                    error: `Nessun dato trovato per "${location}" il ${date} alle ${normalizedTime}:00 per ${pollutant}`
                };
            }
        }

        const selectedRecord = matches.sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        )[0];

        const value = Number(selectedRecord.value);

        return {
            success: true,
            station_name: selectedRecord.station_name,
            pollutant: selectedRecord.pollutant,
            value,
            unit: "µg/m³",
            category: getAqiCategory(selectedRecord.pollutant, value),
            date: selectedRecord.date,
            date_only: selectedRecord.date_only ?? null,
            lat: selectedRecord.lat ?? null,
            lon: selectedRecord.lon ?? null
        };
    } catch (error) {
        return {
            success: false,
            error: `Errore durante il recupero del dato: ${error.message}`
        };
    }
}


/* =========================================================
 * GEMINI TOOL DECLARATIONS
 * ======================================================= */

const getValuePollutantDeclaration = {
    name: "get_value_pollutant",
    description:
        "Recupera il valore di un inquinante per una stazione, una data e opzionalmente un'ora specifica.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            location: {
                type: Type.STRING,
                description: `Nome o parte del nome della stazione di monitoraggio considerando che i nomi sono questi:${loadStationCoords()}`
            },
            date: {
                type: Type.STRING,
                description: "Data nel formato YYYY-MM-DD"
            },
            time: {
                type: Type.STRING,
                description: 'Ora nel formato HH oppure "latest"'
            },
            pollutant: {
                type: Type.STRING,
                description: "Nome dell'inquinante, ad esempio PM10, PM2.5, NO2, O3"
            }
        },
        required: ["location", "date", "pollutant"]
    }
};

const toolDeclarations = [getValuePollutantDeclaration];

const generationConfig = {
    tools: [
        {
            functionDeclarations: toolDeclarations
        }
    ]
};

/* =========================================================
 * GEMINI CLIENT
 * ======================================================= */

if (!GEMINI_API_KEY) {
    throw new Error("Variabile d'ambiente GEMINI_API_KEY mancante");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/* =========================================================
 * FUNCTION CALL DISPATCHER
 * ======================================================= */

async function executeToolCall(toolCall) {
    if (!toolCall?.name) {
        throw new Error("Tool call non valido");
    }

    switch (toolCall.name) {
        case "get_value_pollutant":
            return await getValuePollutant(
                toolCall.args.location,
                toolCall.args.date,
                toolCall.args.time ?? "latest",
                toolCall.args.pollutant
            );

        default:
            throw new Error(`Tool non supportato: ${toolCall.name}`);
    }
}

/* =========================================================
 * MAIN REQUEST FLOW
 * ======================================================= */

export async function sendRequest(userText) {
    const contents = [
        {
            role: "user",
            parts: [{ text: userText }]
        }
    ];

    const firstResponse = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: generationConfig
    });

    const toolCall = firstResponse.functionCalls?.[0];

    if (!toolCall) {
        console.log(firstResponse.text)
        return firstResponse.text ?? null;
    }

    const toolResult = await executeToolCall(toolCall);

    const functionResponsePart = {
        name: toolCall.name,
        response: { result: toolResult },
        id: toolCall.id
    };

    contents.push(firstResponse.candidates[0].content);
    contents.push({
        role: "user",
        parts: [{ functionResponse: functionResponsePart }]
    });

    const finalResponse = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: generationConfig
    });

    return finalResponse.text ?? null;
}

