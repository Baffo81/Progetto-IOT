
# =========================
# AGGREGAZIONE DATI
# =========================
# Questo modulo contiene funzioni per aggregare i dati orari delle stazioni
# in dati giornalieri, calcolando la media e il numero di ore disponibili.



def media_giornaliera(df):
    """
    Calcola la media giornaliera a partire dai dati ORARI.
    Ogni giorno → una sola riga per stazione e inquinante.

    Args:
        df (DataFrame): DataFrame con dati orari, deve contenere le colonne:
            - 'Data_ora' (datetime)
            - 'Stazione', 'Descrizione', 'Inquinante', 'Valore'

    Returns:
        DataFrame: DataFrame aggregato con una riga per giorno, stazione e inquinante,
                   con le colonne 'Media_Giornaliera' e 'Ore_Disponibili'.
    """

    # Estraiamo la data (YYYY-MM-DD) dalla colonna data/ora
    df["Data"] = df["Data_ora"].dt.date

    # Raggruppiamo per giorno, stazione e inquinante
    df_media = (
        df
        .groupby(
            ["Stazione", "Descrizione", "Inquinante", "Data"],
            as_index=False
        )
        .agg(
            Media_Giornaliera=("Valore", "mean"),  # Media dei valori orari
            Ore_Disponibili=("Valore", "count")    # Numero di ore disponibili per la media
        )
    )

    return df_media