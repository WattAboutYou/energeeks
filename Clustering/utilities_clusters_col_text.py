import pandas as pd
import numpy as np
import jenkspy
import os

from sentence_transformers import SentenceTransformer, util


# ======== Récupération des logements d'une combinaison spécifique de chauffage et d'ECS ========
def recuperer_logements_combinaison(df, chauffage_ref, ecs_ref):
    ''' Récupère les logements correspondant à une combinaison spécifique de chauffage et d'ECS.
    prend en entrée : 
    - df : le dataframe des colonnes TEXTUELLES du DPE
    - chauffage_ref : le type d'energie de chauffage de la combinaison ciblée
    - ecs_ref : le type d'energie d'ecs de la combinaison ciblée
    renvoie : 
    - le dataframe filtré sur la combinaison ciblée
    '''
    # Filtrage sur la combinaison ciblée
    df_combinaison = df[(df['type_energie_principale_chauffage'] == chauffage_ref) & (df['type_energie_principale_ecs'] == ecs_ref)]
    
    return df_combinaison




# ======== Construction du logement de référence par combinaison de chauffage et d'ECS ========
def logement_reference(df_combinaison):
    ''' Trouve un logement de référence pour une combinaison spécifique de chauffage et d'ECS.
    prend en entrée : 
    - df_combinaison : le dataframe des colonnes textuelles du DPE filtré sur la combinaison ciblée
    renvoie : 
    - les informations textuelles tokénisées les plus fréquentes pour cette combinaison de chauffage et d'ECS
    - les variables textuelles à prendre en compte pour le calcul de la distance textuelle (celles pour lesquelles la modalité la plus fréquente a une fréquence supérieure à 10%)
    '''
    # Filtrage sur la combinaison ciblée
    total_combinaison = len(df_combinaison)

    # Création des statistiques pour chaque colonne textuelle
    stats_reference = []

    for col in df_combinaison.columns:
        counts = df_combinaison[col].value_counts(dropna=True)
        
        if not counts.empty:
            top_valeur = counts.index[0]
            nb_occurrences = counts.iloc[0]
            frequence_pct = (nb_occurrences / total_combinaison) * 100
        
        stats_reference.append({
            'Variable': col,
            'Valeur_la_plus_frequente': top_valeur,
            'Occurrences': nb_occurrences,
            'Frequence_%': round(frequence_pct, 2)
        })

        stats = pd.DataFrame(stats_reference)

        # Colonnes pour lesquelles la modalité la plus fréquente a une fréquence supérieure à 10%
        cols_to_score = stats['Variable'][stats['Frequence_%']> 10]

        # Construction du logement de référence avec les modalités sélectionnées
        reference_text = " ".join(stats['Valeur_la_plus_frequente'][stats['Frequence_%']> 10]).lower()

        return reference_text.split(), cols_to_score
    



# ======== Calcul de la similarité de Jaccard entre les descriptions textuelles d'un logement de référence et les autres logements du groupe majoritaire ========
def similarite_jaccard(reference_tokens, cols_to_score, logement):
    ''' Calcule la similarité de Jaccard entre la description textuelle du logement de référence et celle d'un autre logement.
    prend en entrée : 
    - reference_tokens : description textuelle tokenisée de référence,
    - cols_to_score : colonnes sur lesquelles porte la description
    - logement : la ligne d'un logement du dataset des DPE (variables textuelles uniquement)
    renvoie : 
    - la similarité de Jaccard entre les deux descriptions
    '''
    # On crée l'ensemble des mots du logement actuel
    text_logement = " ".join([str(logement[col]) for col in cols_to_score]).lower()
    tokens_logement = set(text_logement.split())
    tokens_ref = set(reference_tokens)

    # Calcul de la similarité de Jaccard
    if not tokens_ref :
        return 0.0
    
    intersection = tokens_ref.intersection(tokens_logement)
    union = tokens_ref.union(tokens_logement)
    return len(intersection) / len(union) if union else 0.0
    



# ======== Embedding de la description textuelle du logement de référence avec Bert ========
def embedding_logement(reference_tokens):
    '''
    Calcule l'embedding de la description textuelle du logement de référence à l'aide du modèle sentence transformer MiniLM.
    prend en entrée :
    - reference_tokens : description textuelle tokenisée du logement de référence
    renvoie :
    - l'embedding du logement de référence
    '''
    # Chargement du modèle sentence transformer MiniLM
    if not(os.path.exists('./modele_sentence_transformer_MiniLM/')):
        print('Téléchargement du modèle sentence transformer MiniLM...')
        model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2') # chargement du modèle
        model.save('./modele_sentence_transformer_MiniLM/') # sauvegarde locale du modèle pour éviter de le retélécharger à chaque fois
        print('Modèle téléchargé et sauvegardé localement.')
    else : 
        model = SentenceTransformer('./modele_sentence_transformer_MiniLM/')
        
    # Embedding de la description textuelle du logement de référence
    texte_ref = " ".join(reference_tokens).lower()
    embedding_ref = model.encode([texte_ref], convert_to_tensor=True)
    return embedding_ref




# ======== Calcul similarité sBERT ========
def similarite_sbert(df_combinaison, embedding_ref, cols_to_score):
    ''' Calcule la similarité de cosinus entre l'embedding de la description textuelle du logement de référence et celle des autres logements du groupe ciblé.
    prend en entrée :
    - df_combinaison : le dataframe des colonnes textuelles du DPE filtré sur la combinaison ciblée
    - embedding_ref : l'embedding de la description textuelle du logement de référence
    - cols_to_score : les variables textuelles à prendre en compte pour le calcul de la distance textuelle
    renvoie :
    - le dataframe de la combinaison ciblée avec une nouvelle colonne "score_bert" contenant la similarité de cosinus entre l'embedding de chaque logement et celui du logement de référence
    '''

    # Chargement du modèle sentence transformer MiniLM
    model = SentenceTransformer('./modele_sentence_transformer_MiniLM') 
    textes = df_combinaison[cols_to_score].fillna('').agg(' '.join, axis=1).tolist()

    embeddings_logements = model.encode(textes, convert_to_tensor=True, show_progress_bar=True)

    # 4. Calcul de la similarité cosinus
    # On compare chaque ligne à la référence unique
    scores_bert = util.cos_sim(embeddings_logements, embedding_ref)

    # 5. Stockage dans le DataFrame
    df_combinaison['score_bert'] = scores_bert.flatten().cpu().numpy()

    return df_combinaison


# ======== Calcul du Goodness of Variance Fit (GVF) pour 3 classes ========
def goodness_of_variance_fit(array, classes=3):
    ''' Calcule le Goodness of Variance Fit (GVF) pour une classification donnée.
    prend en entrée :
    - array : un tableau de données numériques à classifier
    - classes : le nombre de classes pour la classification
    renvoie :
    - le GVF de la classification  
    '''
    # Calcul des ruptures de Jenks
    breaks = jenkspy.jenks_breaks(array, n_classes=classes)
    
    # Classification des données
    classified = np.array([np.digitize(x, breaks[1:-1]) for x in array])
    
    # Somme des carrés totale
    gvf_total = np.var(array) * len(array)
    
    # Somme des carrés intra-classe (SDCM)
    gvf_intra = 0
    for i in range(classes):
        group = array[classified == i]
        if len(group) > 0:
            gvf_intra += np.var(group) * len(group)
            
    return 1 - (gvf_intra / gvf_total)



# ======== Création des clusters de similarité textuelle à partir des scores de similarité sBERT ========
def creation_clusters(df_combinaison, classes=3):
    ''' Crée des clusters de similarité textuelle à partir des scores de similarité sBERT.
    prend en entrée :
    - df_combinaison : le dataframe de la combinaison ciblée avec la colonne "score_bert" contenant les similarités de cosinus entre l'embedding de chaque logement et celui du logement de référence
    - classes : le nombre de clusters à créer
    renvoie :
    - le dataframe de la combinaison ciblée avec une nouvelle colonne "cluster_similarite" contenant l'affectation de chaque logement à un cluster de similarité textuelle
    '''
    # Calcul des ruptures de Jenks pour les scores de similarité sBERT
    breaks = jenkspy.jenks_breaks(df_combinaison['score_bert'], n_classes=classes)

    noms_groupes = ['Atypique', 'Variante', 'Standard']

    df_combinaison['cluster_bert'] = pd.cut(
        df_combinaison['score_bert'], 
        bins=breaks, 
        labels=noms_groupes, 
        include_lowest=True
    )
    
    # Classification des logements en clusters de similarité textuelle
    df_combinaison['cluster_similarite'] = df_combinaison['score_bert'].apply(lambda x: np.digitize(x, breaks[1:-1]))
    
    return df_combinaison


# ======== Analyse de la distribution des clusters de similarité textuelle ========
def analyse_clusters(df_combinaison):
    ''' Analyse la distribution des clusters de similarité textuelle.
    prend en entrée :
    - df_combinaison : le dataframe de la combinaison ciblée avec la colonne "cluster_similarite" contenant l'affectation de chaque logement à un cluster de similarité textuelle
    renvoie :
    - un résumé de la distribution des clusters de similarité textuelle (nombre et pourcentage de logements dans chaque cluster)
    '''
    distribution_clusters = df_combinaison['cluster_similarite'].value_counts(normalize=True).mul(100).reset_index()
    distribution_clusters.columns = ['Cluster', 'Proportion (%)']
    
    return distribution_clusters.to_string(index=False)


# ========== EXEMPLE D'UTILISATION ==========

'''
# Liste des variables textuelles à analyser
col_text_keep = ['description_installation_chauffage_n1',
                'description_installation_ecs_n1', 
                'description_generateur_chauffage_n1_installation_n1', 
                'description_generateur_n1_ecs_n1',
                'type_generateur_n1_installation_n1', 
                'type_generateur_chauffage_principal', 
                'type_generateur_chauffage_principal_ecs', 
                'type_emetteur_installation_chauffage_n1']

# Combinaison ciblée : Gaz/Gaz
chauffage_ref = "Gaz"
ecs_ref = "Gaz"

# Calcul des clusters de similarité textuelle pour la combinaison ciblée par rapport au logement de référence
df_combinaison = recuperer_logements_combinaison(df, chauffage_ref, ecs_ref)
reference_tokens, cols_to_score = logement_reference(df_combinaison[col_text_keep])
embedding_ref = embedding_logement(reference_tokens)
df_combinaison = similarite_sbert(df_combinaison, embedding_ref, cols_to_score)
df_combinaison = creation_clusters(df_combinaison)
print(analyse_clusters(df_combinaison))
'''
