import pandas as pd
import json
import random

print("Loading full dataset...")
df = pd.read_csv('final_dataset_ag.csv')
print(f"Dataset loaded with {len(df)} rows.")

# Compute cluster medians for fallback
col_mwh = "consommation_annuelle_moyenne_par_site_de_ladresse_mwh"
cluster_medians = df.groupby('cluster_full_label')[col_mwh].median().to_dict() if 'cluster_full_label' in df.columns else {}

def get_consumption(row):
    # Try MWh column first
    if col_mwh in row and pd.notna(row[col_mwh]):
        return float(row[col_mwh]) * 1000
        
    # Fallback to cluster median
    cluster = row.get('cluster_full_label')
    if pd.notna(cluster) and cluster in cluster_medians and pd.notna(cluster_medians[cluster]):
        return float(cluster_medians[cluster]) * 1000
        
    # Final fallback
    return 4000.0

addresses = []
def_dept = df['code_departement'].astype(str).str.zfill(2).tolist() if 'code_departement' in df.columns else []

for idx, row in df.iterrows():
    # ID
    uid = str(row.get('numero_dpe', row.get('identifiant_ban', row.get('result_id', f"house_{idx}"))))
    if pd.isna(uid) or uid == 'nan':
        uid = f"house_{idx}"
        
    street = str(row.get('adresse', f"Rue inconnue {idx}"))
    if street == 'nan':
        street = str(row.get('Adresse Textuelle', f"Rue inconnue {idx}"))
        
    city = str(row.get('nom_commune', 'Inconnue'))
    city = city.title() if city != 'nan' else 'Inconnue'
    
    zipcode = str(row.get('code_commune', ''))
    if zipcode == 'nan': zipcode = ''
    
    dept = str(row.get('code_departement', ''))
    if dept == 'nan' or not dept: 
        dept = zipcode[:2] if len(zipcode) >= 2 else (def_dept[idx] if idx < len(def_dept) else '91')

    lat = row.get('latitude', 48.6)
    lng = row.get('longitude', 2.3)
    if pd.isna(lat): lat = 48.6 + random.uniform(-0.1, 0.1)
    if pd.isna(lng): lng = 2.3 + random.uniform(-0.1, 0.1)
    
    address_data = {
        "id": uid,
        "street": street,
        "city": city,
        "zipCode": zipcode,
        "department": str(dept).replace('.0', ''),
        "lat": float(lat),
        "lng": float(lng)
    }
    
    surface = row.get('surface_habitable_logement', 0)
    if pd.isna(surface) or surface == 0:
        surface = 56
        
    # Construction year with fallback to period estimation
    year = row.get('annee_construction')
    if pd.isna(year):
        periode = str(row.get('periode_construction', '')).lower()
        if '1948-1974' in periode: year = 1961
        elif '1975-1977' in periode: year = 1976
        elif '1978-1982' in periode: year = 1980
        elif '1983-1988' in periode: year = 1985
        elif '1989-2000' in periode: year = 1995
        elif '2001-2005' in periode: year = 2003
        elif '2006-2012' in periode: year = 2009
        elif '2013-2021' in periode: year = 2017
        elif 'avant 1948' in periode: year = 1940
        elif '2021' in periode: year = 2022
        else: year = 1980
    else:
        year = int(year)

    # Real DPE label from CSV
    raw_dpe = row.get('etiquette_dpe', '')
    dpe = str(raw_dpe).strip().upper() if pd.notna(raw_dpe) and str(raw_dpe).strip() != '' else 'N/A'

    # Real GES label from CSV
    raw_ges = row.get('etiquette_ges', '')
    ges = str(raw_ges).strip().upper() if pd.notna(raw_ges) and str(raw_ges).strip() != '' else 'N/A'

    # Real numero_dpe from CSV
    raw_numero = row.get('numero_dpe', '')
    numero_dpe = str(raw_numero).strip() if pd.notna(raw_numero) and str(raw_numero).strip() != '' else 'N/A'

    house_data = {
        "dpe": dpe,
        "ges": ges,
        "numeroDpe": numero_dpe,
        "consumption": get_consumption(row),
        "surface": float(surface),
        "year": int(year),
        "clusterLabel": str(row.get('cluster_full_label', 'Unknown'))
    }
    
    addresses.append({
        "address": address_data,
        "house": house_data
    })
    
    if (idx + 1) % 10000 == 0:
        print(f"Processed {idx + 1} / {len(df)} records...")

# Save to public directory so Vite can serve it statically
out_path = 'public/light_data.json'
import os
os.makedirs('public', exist_ok=True)
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(addresses, f, ensure_ascii=False)

print(f"Extraction complete! Saved {len(addresses)} records to {out_path}.")
