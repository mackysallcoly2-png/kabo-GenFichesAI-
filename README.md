<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Kabo FichesGen

Application de génération de fiches pédagogiques.

Voir l'application AI Studio : https://ai.studio/apps/88d9819c-1e0c-4eb9-b240-96d8f7b7c8d5

## Développement local

**Prérequis :** Node.js

1. Installer les dépendances : `npm install`
2. Ajouter `GEMINI_API_KEY=votre_cle` dans `.env.local`
3. Lancer l'application : `npm run dev`

Le serveur Vite expose la fonction locale `/api/generate`. La clé est lue par le serveur et ne doit jamais être ajoutée à une variable `VITE_*` ni injectée dans le bundle navigateur.

## Déploiement Vercel

Configurer `GEMINI_API_KEY` dans les variables d'environnement du projet Vercel, puis redéployer. La fonction `api/generate.ts` traite les demandes côté serveur.

Les fiches générées par l'IA doivent être relues et validées par l'enseignant avant utilisation.
