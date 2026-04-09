# Création du fichier `light_data.json`

Ce document explique comment le jeu de données allégé `light_data.json` a été généré à partir de notre jeu de données de référence `final_dataset_ag.csv`. 

Le fichier `light_data.json` situé dans le dossier `public/` de l'application est utilisé par le frontend. Il contient une version épurée et géolocalisée de la donnée, formatée spécifiquement pour le rendu côté client et pour la vue 'Observatoire Territorial'.

## Localisation du code source

Le code de création a été réorganisé pour plus de clarté et se trouve désormais dans ce dossier :
`data_preparation/extract_light_data.py` (anciennement `extract_data.py` à la racine).

## Fonctionnement du script de préparation

Le script lit le fichier CSV de référence (`final_dataset_ag.csv`) via la librairie **Pandas**. 
Pour chaque ligne (logement ou observation), le script extrait et formate un sous-ensemble d'informations, transformant les colonnes complexes en un objet JSON simple avec deux clés principales par enregistrement : `address` (informations géographiques) et `house` (informations du bâti et consommation).

### Détail du mapping et des règles appliquées

#### 1. Informations de localisation (`address`)
*   **Identifiant (`id`)** : Tente d'utiliser par ordre de priorité `numero_dpe`, `identifiant_ban` ou `result_id`. S'ils sont absents, génère un identifiant unique du type `house_{idx}`.
*   **Adresse (`street`)** : Récupère la colonne `Adresse` ou, s'il n'y a pas de donnée, cherche dans `Adresse Textuelle`. S'il n'y a rien, indique "Rue inconnue {idx}".
*   **Ville et Code Postal (`city`, `zipCode`)** : Récupérés depuis `Nom Commune` et `Code Commune`.
*   **Département (`department`)** : Construit à partir de `Code Département`. S'il est absent, il tente de le déduire des deux premiers chiffres du code postal, puis prend une valeur par défaut en dernier recours.
*   **Coordonnées (`lat` , `lng`)** : Prend directement `latitude` et `longitude`. *Remarque : en cas de données manquantes, le script introduit une variation aléatoire autour des coordonnées de base pour éviter de superposer les points manquants de façon erronée.*

#### 2. Données liées au logement et Diagnostic (`house`)
*   **Surface (`surface`)** : Utilise la `surface_habitable_logement` en priorité, et dans un second temps la `surface_habitable_immeuble`. S'il n'y a rien, une valeur par défaut de `80` m² est appliquée.
*   **Année de construction (`year`)** : Utilise la colonne `annee_construction`. Valeur par défaut : `1980`.
*   **Valeurs DPE et GES (`dpe`, `ges`, `numeroDpe`)** : Les étiquettes (`etiquette_dpe` et `etiquette_ges`) et le numéro DPE sont récupérés dans les colonnes CSV ajoutées durant la phase de consolidation des données DPE. Les chaînes de caractères sont mises en majuscules. S'il n'y a pas d'info, il renvoie "N/A".
*   **Consommation électrique (`consumption`)** : 
    Il tente dans l'ordre :
    1.  De prendre la `Consommation annuelle moyenne par logement de l'adresse (MWh)` et la multiplier par 1000 pour l'avoir en kWh.
    2.  Si cette donnée est absente, de prendre la médiane de la consommation des logements regroupés dans le même cluster (`cluster_full_label`).
    3.  En dernier ressort, s'il n'y a toujours aucune donnée, la valeur par défaut de `4000` kWh est assignée.
*   **Cluster (`clusterLabel`)** : La catégorie associée au bâtiment suite à l'algorithme de clustering (`cluster_full_label`).

## Exécution du script

Si vous devez relancer le processus complet de génération de ce fichier, il vous suffit de vous rendre à la racine du projet et d'exécuter la commande :
```bash
python data_preparation/extract_light_data.py
```

Le script lira en entrée `final_dataset_ag.csv` et écrasera silencieusement le fichier existant situé dans `public/light_data.json`.
