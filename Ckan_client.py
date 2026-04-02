

# =========================
# CLIENT CKAN
# =========================
# Questo file si occupa ESCLUSIVAMENTE
# di scaricare i dati dall’API CKAN.
# Fornisce funzioni per scaricare uno o più dataset tramite le API REST.



import requests.api
import pandas as pd
from config import URL, Limit

def fetch_cska_client(resource_id):
    """
    Scarica tutti i record di un dataset CKAN dato il resource_id.
    Gestisce il download a blocchi (paginazione) e restituisce un DataFrame.

    Args:
        resource_id (str): L'ID della risorsa CKAN da scaricare

    Returns:
        DataFrame: Tutti i record scaricati dal dataset
    """
    records = []  # lista che conterrà tutti i record
    offset = 0    # indica da quale record iniziare a scaricare

    while True:
        # Parametri della richiesta HTTP
        params = {
            "resource_id": resource_id,  # dataset specifico
            "limit": Limit,              # massimo numero di record per richiesta
            "offset": offset             # punto di partenza
        }

        # Chiamata GET all’API
        response = requests.get(URL, params=params)

        # Se la richiesta fallisce, viene sollevata un’eccezione
        response.raise_for_status()

        # Conversione risposta JSON → dizionario Python
        data = response.json()

        # Estrazione dei record dal risultato
        batch = data["result"]["records"]

        # Aggiungiamo i record correnti alla lista totale
        records.extend(batch)

        # Se i record scaricati sono meno del limite,
        # significa che siamo arrivati alla fine del dataset
        if len(batch) < Limit:
            break

        # Altrimenti passiamo al blocco successivo
        offset += Limit

    return pd.DataFrame(records)



def fetch_multiple_resources(resource_ids):
    """
    Scarica e concatena più resource_id CKAN
    restituendo un unico DataFrame.

    Args:
        resource_ids (list): Lista di resource_id CKAN

    Returns:
        DataFrame: Tutti i record concatenati
    """
    frames = []

    for rid in resource_ids:
        # Scarica ogni dataset e aggiungilo alla lista
        df = fetch_cska_client(rid)
        frames.append(df)

    # Concatena tutti i DataFrame in uno solo
    return pd.concat(frames, ignore_index=True)