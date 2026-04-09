import os
import requests
import pandas as pd
import time
from tqdm import tqdm
from datetime import datetime
import math
import sys

# Add current directory to path to import utilities
sys.path.append(os.getcwd())

import utilities as ut
from kmodes.kprototypes import KPrototypes
import numpy as np
from sklearn.preprocessing import PowerTransformer, MinMaxScaler
from sklearn.cluster import AgglomerativeClustering
from scipy.spatial.distance import pdist, squareform
from utilities_clusters_col_text import *

def run_enedis_pipeline():
    print("\n--- Étape 1 : Téléchargement Enedis ---")
    base_url_conso = "https://opendata.enedis.fr/data-fair/api/v1/datasets/consommation-annuelle-residentielle-par-adresse/lines"
    communes_91 = pd.read_excel("List_Communes_91.xlsx").loc[:, ["code INSEE"]].to_numpy().tolist()
    annee = '"' + str(datetime.now().year - 2) + '"'
    limit = 1000
    
    communes_91_1 = communes_91[:len(communes_91)//2]
    communes_91_2 = communes_91[len(communes_91)//2:]

    communes_query_1 = " OR ".join('"'+ str(communes_91_1[i][0]) + '"' for i in range(len(communes_91_1)))
    communes_query_2 = " OR ".join('"'+ str(communes_91_2[i][0]) + '"' for i in range(len(communes_91_2)))
    query_string_1 = f"annee:{annee} AND code_commune:({communes_query_1})"
    query_string_2 = f"annee:{annee} AND code_commune:({communes_query_2})"

    def download_conso(query_string):
        params = {"qs": query_string, "size": 1000}
        response = requests.get(base_url_conso, params=params)
        response.raise_for_status()
        total_records = response.json().get('total', 0)
        
        all_records = []
        nb_pages = math.ceil(total_records / limit)
        with tqdm(total=total_records, desc="Téléchargement Enedis") as pbar:
            for page in range(1, nb_pages + 1):
                params["page"] = page
                try:
                    res = requests.get(base_url_conso, params=params)
                    res.raise_for_status() 
                    batch = res.json().get('results', [])
                    all_records.extend(batch)
                    pbar.update(len(batch))
                except requests.exceptions.RequestException as e:
                    print(f"\nErreur lors de la page {page}: {e}")
                    break
        return pd.DataFrame(all_records)
    
    df_essonne_1 = download_conso(query_string_1)
    df_essonne_2 = download_conso(query_string_2)
    df_essonne = pd.concat([df_essonne_1, df_essonne_2], ignore_index=True)
    return df_essonne

def run_geocoding_pipeline(df_essonne, file_name_conso_geocoded):
    print("\n--- Étape 2 : Géocodage ---")
    colonnes_adresse = ['adresse', 'code_commune', 'nom_commune']
    df_essonne[colonnes_adresse].fillna('')
    df_essonne['Adresse Textuelle'] = df_essonne[colonnes_adresse].astype(str).agg(' '.join, axis=1)
    
    df_conso_91_2024_geocoded = ut.geocode_avec_barre(df_essonne, 'Adresse Textuelle')
    
    part_id_ban_unique = round(df_conso_91_2024_geocoded['result_id'].nunique()/len(df_conso_91_2024_geocoded), 3)*100
    print(f'Part des adresses géocodées avec succès : {part_id_ban_unique}%')
    
    if part_id_ban_unique > 90:
        df_conso_91_2024_geocoded = df_conso_91_2024_geocoded.sort_values(by='result_score', ascending=False)
        df_conso_91_2024_geocoded.drop_duplicates(subset=['result_id'], keep='first', inplace=True)
        print("Suppression des doublons effectuée")
    else:
        print(f"Géocodage insatisfaisant, supprimer {(1-part_id_ban_unique)*100}% n'est pas judicieux")
        
    df_conso_91_2024_geocoded.to_pickle(file_name_conso_geocoded)
    return df_conso_91_2024_geocoded

def run_dpe_pipeline(file_name_dpe):
    print("\n--- Étape 3 : Téléchargement DPE ---")
    base_url_dpe = "https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines"
    
    params_dpe = {
        'size': 1000,
        "q_mode": "simple",
        "qs": "code_departement_ban:91 " 
    }
    
    init_req = requests.get(base_url_dpe, params=params_dpe)
    if init_req.status_code == 200:
        total_rows = init_req.json().get('total')
    else:
        raise Exception(f"Erreur API {init_req.status_code} lors de la requête initiale") 

    all_data_dpe = []
    next_url_dpe = base_url_dpe

    with tqdm(total=total_rows, desc="Téléchargement DPE") as pbar:
        while next_url_dpe:
            try:
                if next_url_dpe == base_url_dpe:
                    r = requests.get(next_url_dpe, params=params_dpe)
                else:
                    r = requests.get(next_url_dpe) 
            
                if r.status_code != 200:
                    print(f"Erreur API {r.status_code}")
                    break
                
                data = r.json()
                results = data.get('results', [])
                if not results: break
                    
                all_data_dpe.extend(results)
                pbar.update(len(results))
                next_url_dpe = data.get('next') 
                time.sleep(0.2) 
            except Exception as e:
                print(f"Erreur : {e}")
                break

    df_dpe_91 = pd.DataFrame(all_data_dpe)
    df_dpe_91.to_pickle(file_name_dpe)
    return df_dpe_91


# ---------- Clustering Mappings and Functions ----------
map_periode = {
    'avant 1948': 0.0, '1948-1974': 0.111, '1975-1977': 0.222, '1978-1982': 0.333,
    '1983-1988': 0.444, '1989-2000': 0.555, '2001-2005': 0.666, '2006-2012': 0.777,
    '2013-2021': 0.888, 'après 2021': 1.0
}

map_isolation = {
    'insuffisante': 0.0, 'moyenne': 0.333, 'bonne': 0.666, 'très bonne': 1.0
}

cols_quali_nom = ["type_installation_chauffage", "type_installation_ecs", "usage_generateur_n1_installation_n1", 
                  "type_batiment", "protection_solaire_exterieure", "logement_traversant", 
                  "presence_production_pv", "nombre_niveau_logement"]
cols_quali_ord = ["periode_construction", "qualite_isolation_murs", "qualite_isolation_menuiseries", 
                  "qualite_isolation_plancher_bas"]
cols_quanti = ["surface_habitable_logement", "hauteur_sous_plafond"]
cols_text = ['description_installation_chauffage_n1', 'description_installation_ecs_n1', 
             'description_generateur_chauffage_n1_installation_n1', 'description_generateur_n1_ecs_n1',
             'type_generateur_n1_installation_n1', 'type_generateur_chauffage_principal', 
             'type_generateur_chauffage_principal_ecs', 'type_emetteur_installation_chauffage_n1']

def preprocess_features(df):
    df_processed = df.copy()
    df_processed['periode_construction'] = df_processed['periode_construction'].map(map_periode)
    for col in ["qualite_isolation_murs", "qualite_isolation_menuiseries", "qualite_isolation_plancher_bas"]:
        df_processed[col] = df_processed[col].map(map_isolation)
        
    for col in cols_quanti:
        mask = df_processed[col].notna()
        if mask.sum() > 0:
            data = df_processed.loc[mask, [col]]
            lower, upper = data[col].quantile([0.01, 0.99])
            data_clipped = data[col].clip(lower, upper).values.reshape(-1, 1)
            
            pt = PowerTransformer(method='yeo-johnson')
            data_trans = pt.fit_transform(data_clipped) 
            
            scaler = MinMaxScaler()
            data_final = scaler.fit_transform(data_trans)
            df_processed.loc[mask, col] = data_final.flatten()
            
    return df_processed

def prepare_data_kproto(df_subset, cols_nom, cols_ord, cols_quant):
    df_imp = df_subset.copy()
    for c in cols_nom:
        if df_imp[c].isnull().any():
            df_imp[c] = df_imp[c].fillna('Missing')
    for c in cols_ord:
        if df_imp[c].isnull().any():
            df_imp[c] = df_imp[c].fillna(df_imp[c].median())
    for c in cols_quant:
        if df_imp[c].isnull().any():
            df_imp[c] = df_imp[c].fillna(df_imp[c].median())
            
    data_df = df_imp[cols_nom + cols_ord + cols_quant].copy()
    for c in cols_nom:
        data_df[c] = data_df[c].astype(str)
        
    return data_df.values, list(range(len(cols_nom)))


def main():
    print("====================================")
    print("=     PIPELINE DPE / ENEDIS        =")
    print("====================================")
    
    file_name_conso_geocoded = "conso_91_2024_geocoded.pickle"
    file_name_dpe = "dpe_91_v2.pickle"

    if os.path.exists(file_name_conso_geocoded):
        print(f"Chargement de {file_name_conso_geocoded} depuis le cache...")
        df_conso = pd.read_pickle(file_name_conso_geocoded)
    else:
        df_essonne = run_enedis_pipeline()
        df_conso = run_geocoding_pipeline(df_essonne, file_name_conso_geocoded)

    if os.path.exists(file_name_dpe):
        print(f"Chargement de {file_name_dpe} depuis le cache...")
        df_dpe = pd.read_pickle(file_name_dpe)
    else:
        df_dpe = run_dpe_pipeline(file_name_dpe)

    print("\n--- Étape 4 : Pipeline Clustering ---")
    combinations = [
        ("Gaz naturel", "Gaz naturel"), 
        ("Électricité", "Électricité"), 
        ("Réseau de Chauffage urbain", "Réseau de Chauffage urbain")
    ]

    final_dfs = []

    for chauf_ref, ecs_ref in combinations:
        print(f"\n--- Processing Combination: {chauf_ref} / {ecs_ref} ---")
        df_comb = recuperer_logements_combinaison(df_dpe, chauf_ref, ecs_ref)
        print(f"Initial subset size: {len(df_comb)}")
        if len(df_comb) == 0:
            continue

        ref_tokens, cols_to_score = logement_reference(df_comb[cols_text])
        embedding_ref = embedding_logement(ref_tokens)
        df_comb = similarite_sbert(df_comb, embedding_ref, cols_to_score)
        df_comb = creation_clusters(df_comb)
        
        print("Text clustering done.")
        
        df_comb_proc = preprocess_features(df_comb)
        text_clusters = df_comb_proc['cluster_bert'].unique()
        comb_name = f"{chauf_ref.split()[0]}_{ecs_ref.split()[0]}"
        
        for cluster_label in text_clusters:
            sub_df = df_comb_proc[df_comb_proc['cluster_bert'] == cluster_label].copy()
            sub_df_orig = df_comb[df_comb['cluster_bert'] == cluster_label].copy()
            n_samples = len(sub_df)
            print(f"  Clustering physical subgroup: {cluster_label} (n={n_samples})")
            
            if n_samples < 5:
                sub_df_orig['cluster_full_label'] = f"{comb_name}_{cluster_label}_Unique"
                final_dfs.append(sub_df_orig)
                continue
                
            try:
                data_matrix, cat_indices = prepare_data_kproto(sub_df, cols_quali_nom, cols_quali_ord, cols_quanti)
                n_clusters_phys = 3
                kp = KPrototypes(n_clusters=n_clusters_phys, init='Huang', n_init=5, verbose=0, random_state=42)
                labels = kp.fit_predict(data_matrix, categorical=cat_indices)
                
                sub_df_orig['cluster_physique_id'] = labels
                sub_df_orig['cluster_full_label'] = sub_df_orig['cluster_physique_id'].apply(
                    lambda x: f"{comb_name}_{cluster_label}_{x+1}"
                )
                final_dfs.append(sub_df_orig)
                
            except Exception as e:
                print(f"    Error clustering subgroup {cluster_label}: {e}")
                sub_df_orig['cluster_full_label'] = f"{comb_name}_{cluster_label}_Error"
                final_dfs.append(sub_df_orig)

    print("\nClustering processing complete.")

    if final_dfs:
        df_final_clusters = pd.concat(final_dfs, ignore_index=True)
        print(f"Final clustered shape: {df_final_clusters.shape}")
        
        df_export = df_final_clusters.copy()
        
        print("Merging with Conso data...")
        if 'result_id' in df_conso.columns:
            df_merged = df_export.merge(
                df_conso, 
                left_on='identifiant_ban',  
                right_on='result_id',       
                how='inner'
            )
            print(f"Merged shape: {df_merged.shape}")
            
            df_merged.to_csv('final_dataset_ag.csv', index=False)
            df_merged.to_pickle('final_dataset_ag.pickle')
            print("Saved to final_dataset_ag.csv and .pickle")
        else:
            print("Column 'identifiant_ban' not found in Conso dataset.")
    else:
        print("No data processed.")

if __name__ == "__main__":
    main()
