# Progetto-IOT – Monitoraggio Qualità dell’Aria

## Descrizione
Questo progetto permette di scaricare, processare, visualizzare e interrogare dati sulla qualità dell’aria in Campania, utilizzando dati ARPAC e un chatbot AI (Gemini) per rispondere a domande sugli inquinanti e sulle stazioni.

## Struttura Principale dei File

- **main.py**: pipeline principale, scarica, pulisce, aggrega e salva i dati.
- **Ckan_client.py**: scarica i dati dalle API CKAN di ARPAC.
- **add_coords.py**: aggiunge le coordinate geografiche alle stazioni.
- **preprocessing.py**: pulizia, normalizzazione e rimozione outlier dai dati.
- **aggregation.py**: calcolo delle medie giornaliere.
- **config.py**: tutte le configurazioni, resource ID, nomi file, parametri.
- **utils.py**: funzioni di utilità per salvataggio/caricamento dati, AQI, ecc.
- **/data/**: dati grezzi, validati, file giornalieri e indici.
- **/gemini/**: API FastAPI per chatbot AI, funzioni di interfacciamento Gemini.
- **index.html, style.css, app.js**: frontend web per visualizzazione mappa, chatbot, grafici.

## Requisiti
- Python >= 3.9
- Dipendenze Python: vedi requirements.txt 

## Setup Ambiente
1. **Clona la repository**
   ```sh
   git clone <repo-url>
   cd Progetto-IOT
   ```
2. **Crea un ambiente virtuale (opzionale ma consigliato)**
   ```sh
   python3 -m venv venv
   source venv/bin/activate
   ```
3. **Installa le dipendenze Python**
   ```sh
   pip install -r requirements.txt
   ```
   Se non hai requirements.txt, installa almeno:
   ```sh
   pip install pandas fastapi uvicorn google-generativeai
   ```
4. **Configura la chiave API Gemini**
   - Crea un file `.env` nella cartella principale con la riga:
     ```
     GEMINI_API_KEY=la_tua_chiave
     ```

## Esecuzione Backend (Pipeline dati)
1. **Esegui la pipeline di preprocessing**
   ```sh
   python3 main.py
   ```
   Questo scarica, pulisce e salva tutti i dati necessari in `/data`.

## Esecuzione del Chatbot Gemini (API)
1. **Avvia il server FastAPI con Uvicorn**
   ```sh
   cd gemini
   uvicorn api:app --reload --port 8001
   ```
   Il backend sarà disponibile su `http://127.0.0.1:8001` (o altra porta specificata).

## Esecuzione Frontend
1. **Avvia un server HTTP per il frontend**
   ```sh
   python3 -m http.server 8000
   ```
   Poi visita `http://localhost:8000` nel browser.

## Utilizzo
- Visualizza la mappa, le stazioni e i dati.
- Clicca sulle stazioni per vedere i dettagli e i grafici.
- Usa il chatbot per chiedere informazioni sugli inquinanti o sulle stazioni.

## Note
- Se il chatbot non risponde, controlla che la chiave API Gemini sia corretta e che il backend sia avviato.
- I dati vengono salvati in `/data` e suddivisi per giorno e tipologia.
- Puoi modificare la configurazione in `config.py`.

## Autore
- Vincenzo Figliolino
- Vincenzo De Candia
---

