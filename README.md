# ⚡ Watt About You — par Energeeks

> Comparateur de performance énergétique résidentielle pour le département de l'Essonne (91).

**Watt About You** permet aux habitants de l'Essonne de comparer la consommation électrique et le Diagnostic de Performance Énergétique (DPE) de leur logement avec des biens aux caractéristiques similaires. Le projet repose sur une pipeline de data science qui collecte, géocode, enrichit et clusterise les données, et sur une application web React qui les restitue de manière interactive.

---

## 📁 Structure du projet

```
energeeks/
├── Clustering/              # Pipeline de collecte & clustering (Python)
│   ├── main.py              # Point d'entrée unique de la pipeline
│   ├── utilities.py         # Fonctions de géocodage (API BAN)
│   ├── utilities_clusters_col_text.py  # Clustering textuel (sBERT + Jenks)
│   ├── pipeline_documentation.md       # Documentation détaillée de la pipeline
│   ├── requirements.txt     # Dépendances Python
│   └── List_communes_91.xlsx           # Liste des communes de l'Essonne
│
├── Exctract_Data/           # Extraction des données allégées pour le frontend
│   ├── extract_light_data.py           # Script de transformation CSV → JSON
│   ├── EXPLICATION_LIGHT_DATA.md       # Documentation du format light_data.json
│   └── requirements.txt     # Dépendances Python
│
├── Site/                    # Application web React + TypeScript + Vite
│   ├── App.tsx              # Composant principal
│   ├── index.html           # Point d'entrée HTML
│   ├── index.tsx            # Bootstrap React
│   ├── types.ts             # Types TypeScript
│   ├── components/          # Composants UI (Header, SimpleView, ExpertView, etc.)
│   ├── services/            # Services de données et génération PDF
│   ├── public/              # Assets statiques (dont light_data.json)
│   ├── package.json         # Dépendances Node.js
│   └── vite.config.ts       # Configuration Vite
│
└── .github/workflows/
    └── deploy.yml           # CI/CD GitHub Pages (build & deploy automatique)
```

---

## 🔬 Pipeline de données (`Clustering/`)

La pipeline automatise la collecte, le nettoyage et la classification des logements de l'Essonne en **4 étapes** :

| Étape | Description | Source |
|-------|-------------|--------|
| **1 — Enedis** | Téléchargement de la consommation résidentielle annuelle par adresse | API Open Data Enedis |
| **2 — Géocodage** | Association d'un identifiant BAN unique à chaque adresse | API BAN (data.gouv.fr) |
| **3 — DPE** | Récupération des diagnostics de performance énergétique existants | API ADEME |
| **4 — Clustering** | Classification en deux niveaux (textuel sBERT + physique K-Prototypes) | — |

Le clustering s'applique à 3 combinaisons d'énergie (Gaz/Gaz, Électricité/Électricité, Réseau de Chauffage urbain/Réseau de Chauffage urbain) et produit des labels finaux du type `Gaz_Gaz_Standard_1`.

**Fichiers produits** : `final_dataset_ag.csv` et `final_dataset_ag.pickle`

> 📖 Voir [`Clustering/pipeline_documentation.md`](Clustering/pipeline_documentation.md) pour la documentation complète avec schéma Mermaid.

### Lancer la pipeline

```bash
cd Clustering
pip install -r requirements.txt
python main.py
```

> 💡 **Cache intelligent** : si les fichiers `.pickle` intermédiaires existent déjà, les téléchargements API sont automatiquement ignorés.

---

## 📦 Extraction des données (`Exctract_Data/`)

Le script `extract_light_data.py` transforme le dataset consolidé (`final_dataset_ag.csv`) en un fichier JSON allégé (`light_data.json`) utilisable par le frontend.

Pour chaque logement, il extrait :
- **Localisation** : identifiant, adresse, ville, code postal, département, coordonnées GPS
- **Données du logement** : DPE, GES, n° DPE, consommation annuelle (kWh), surface, année de construction, cluster

```bash
cd Exctract_Data
pip install -r requirements.txt
python extract_light_data.py
```

> 📖 Voir [`Exctract_Data/EXPLICATION_LIGHT_DATA.md`](Exctract_Data/EXPLICATION_LIGHT_DATA.md) pour le détail du mapping des colonnes.

---

## 🌐 Application web (`Site/`)

Application React + TypeScript construite avec **Vite**, utilisant **TailwindCSS** (via CDN), **Recharts** pour la data-visualisation, **Pigeon Maps** pour la cartographie, et **jsPDF** pour l'export de rapports.

### Fonctionnalités

- 🏠 **Recherche par adresse** — Sélection par département → ville → adresse avec autocomplétion
- 📊 **Vue Simple** — Résumé accessible de la performance énergétique du logement
- 🔬 **Vue Expert** — Graphiques détaillés (distribution, scatter, box plots, radar)
- 🗺️ **Observatoire Territorial** — Dashboard cartographique des clusters de l'Essonne
- 📄 **Export PDF** — Génération d'un rapport téléchargeable
- 🔗 **Redirection DPE** — Lien vers un estimateur en ligne pour les logements sans DPE récent

### Lancer en local

```bash
cd Site
npm install
npm run dev
```

L'application sera accessible sur `http://localhost:5173`.

### Build production

```bash
npm run build
```

Les fichiers statiques sont générés dans `Site/dist/`.

---

## 🚀 Déploiement

Le site est déployé automatiquement sur **GitHub Pages** via GitHub Actions à chaque push sur la branche `main`. Le workflow :

1. Checkout du code
2. Installation des dépendances (`npm ci`)
3. Build de production (`npm run build`)
4. Upload et déploiement du dossier `Site/dist/`

---

## 🛠️ Stack technique

| Composant | Technologies |
|-----------|-------------|
| **Data Pipeline** | Python 3, Pandas, scikit-learn, K-Prototypes, Sentence-Transformers (MiniLM), Jenkspy, SciPy |
| **Frontend** | React 19, TypeScript, Vite 6, TailwindCSS, Recharts, Pigeon Maps, jsPDF |
| **APIs externes** | Enedis Open Data, ADEME DPE, API BAN (Base Adresse Nationale) |
| **CI/CD** | GitHub Actions → GitHub Pages |

---

## 👥 Équipe

Projet réalisé par **Energeeks**.

---

## 📄 Licence

Ce projet est à usage académique / pédagogique. Données DPE issues de l'ADEME, données de consommation issues d'Enedis Open Data.
