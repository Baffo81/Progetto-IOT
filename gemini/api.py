# =========================
# GEMINI API
# =========================
# Questo modulo espone gli endpoint API per la comunicazione con Gemini.
# Ogni funzione e route è commentata per spiegare il suo scopo.

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gemini.gemini_api import send_request

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatBotInput(BaseModel):
    user_msg: str

@app.get("/")
async def root_app():
    """Endpoint di base che restituisce un messaggio vuoto."""
    return {"message": ""}

@app.post("/chat")
async def chatbot(chat_input: ChatBotInput):
    """
    Endpoint per inviare un messaggio al chatbot e ricevere una risposta.

    - chat_input: Un oggetto contenente il messaggio dell'utente.
    """
    try:
        resp = send_request(chat_input.user_msg)
        return {"response": resp}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
