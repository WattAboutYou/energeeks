import requests
import pandas as pd
import io
import time
from tqdm import tqdm



# Fonction de géocodage via l'API CSV de la BAN
def geocode_dataframe(df, nom_colonne_adresse=str, nom_colonne_cp=None, batch_size=1000):
    """
    Géocode via l'API BAN (CSV) en gérant correctement les séparateurs.
    
    En entrée :
    df: le DataFrame des consommations électriques
    nom_colonne_adresse: Le nom de la colonne qui contient l'adresse textuelle à géocoder
    nom_colonne_cp: (Optionnel) Le nom de la colonne Code Postal pour aider l'API

    En sortie : Le DataFrame enrichi de l'identifiant BAN et des coordonnées géographiques.
    """
    
    # Préparation du fichier CSV en mémoire
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, sep=';', index=False)
    csv_buffer.seek(0)

    # Configuration des paramètres
    # 'columns': indique à l'API quelle colonne contient l'adresse à chercher
    params = {
        'columns': nom_colonne_adresse
    }
    
    # Ajout optionnel de la colonne code postal
    if nom_colonne_cp:
        params['postcode'] = nom_colonne_cp

    # Envoi du fichier
    # Précision explicite du nom du fichier 'file.csv' pour aider l'API
    files = {
        'data': ('file.csv', csv_buffer)
    }

    url_ban = "https://api-adresse.data.gouv.fr/search/csv/"
    
    try:
        r = requests.post(url_ban, data=params, files=files)
        
        # Lecture de la réponse
        if r.status_code == 200:
            df_result = pd.read_csv(
                io.StringIO(r.text), 
                sep=';', 
                dtype={'result_postcode': str} 
            )
            # Nettoyage de la réponse : suppression des colonnes inutiles
            cols_originales = df.columns.tolist()
            cols_api = ['result_id', 'latitude', 'longitude']
            cols_finales = cols_originales + [c for c in cols_api if c in df_result.columns]
            df_clean = df_result[cols_finales]
            df_clean = df_clean.rename(columns={'result_id': 'identifiant_ban'})
            return df_clean
        else:
            print(f"Erreur API : {r.status_code}")
            print(r.text) # Affiche l'erreur pour comprendre
            return None
            
    except Exception as e:
        print(f"Erreur technique : {e}")
        return None
    

def geocode_avec_barre(df, col_adresse, col_cp=None, taille_paquet=100):
    """
    Géocode via l'API BAN (CSV) par paquets de données.
    
    En entrée :
    df: le DataFrame des consommations électriques
    nom_colonne_adresse: Le nom de la colonne qui contient l'adresse textuelle à géocoder
    nom_colonne_cp: (Optionnel) Le nom de la colonne Code Postal pour aider l'API

    En sortie : Le DataFrame enrichi de l'identifiant BAN et des coordonnées géographiques.
    """
    
    # Liste pour stocker les morceaux de résultats
    resultats = []
    
    # URL de l'API BAN CSV
    url = "https://api-adresse.data.gouv.fr/search/csv/"
    
    total_lignes = len(df)
    print(f"Démarrage du géocodage de {total_lignes} lignes...")

    with tqdm(total=total_lignes, unit="adresses") as pbar:
        
        for i in range(0, total_lignes, taille_paquet):
            # On découpe un morceau du dataframe
            df_chunk = df.iloc[i : i + taille_paquet]
            resultat = df_chunk
    
            # Préparation du CSV en mémoire pour ce morceau
            csv_buffer = io.StringIO()
            resultat.to_csv(csv_buffer, sep=';', index=False)
            csv_buffer.seek(0)
        
            files = {'data': ('chunk.csv', csv_buffer)}
            # Configuration des paramètres
            params = {'columns': col_adresse, 'result_columns': ['result_id', 'latitude', 'longitude', 'result_score']}
        
            # Ajout optionnel de la colonne code postal
            if col_cp:
                params['postcode'] = col_cp
                
            try:
                # Appel API
                r = requests.post(url, files=files, data=params, timeout=60)     
                
                if r.status_code == 200:
                    # Lecture du résultat
                    resultat = pd.read_csv(io.StringIO(r.text), sep=';', dtype={'result_postcode': str})
                    resultats.append(resultat)
                    
                else:
                    print(f"Erreur sur le paquet {i} : Code {r.status_code}")
                    # En cas d'erreur, on garde quand même les données d'origine pour ne pas perdre les lignes
                    resultats.append(resultat)
                    
            except Exception as e:
                print(f"Erreur réseau {i}: {e}")
                resultats.append(df_chunk)
            # Pause pour éviter de surcharger l'API
            time.sleep(1)

            # On met à jour la barre de progression de la taille du paquet
            pbar.update(len(df_chunk))

    # Concaténation des résultats
    if resultats:
        return pd.concat(resultats, ignore_index=True)
    else:
        return df