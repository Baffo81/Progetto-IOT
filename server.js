import express from "express";
import cors from "cors";
import { sendRequest } from "./gemini_api.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Messaggio mancante" });
        }

        const reply = await sendRequest(message);
        res.json({ reply });
    } catch (error) {
        console.error("Errore server:", error);
        res.status(500).json({ error: "Errore interno del server" });
    }
});

app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});