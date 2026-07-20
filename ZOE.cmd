@echo off
rem ============================================================
rem  ZOE.cmd — DOUBLE-CLIQUE ICI. C'est tout.
rem ------------------------------------------------------------
rem  Lance le serveur local et ouvre l'atelier dans le navigateur.
rem
rem  POURQUOI un serveur et pas un double-clic sur la page : en
rem  file://, le navigateur BLOQUE les modules ES. Les composants
rem  ne se definissent jamais, la page parait morte — sans un mot
rem  d'explication. Un serveur local, et tout marche.
rem
rem  Pour arreter : ferme cette fenetre (ou Ctrl+C).
rem ============================================================

cd /d "%~dp0"

echo.
echo   Zoe — l'atelier
echo   http://localhost:5173/
echo.
echo   (laisse cette fenetre ouverte ; ferme-la pour arreter)
echo.

rem  On ouvre le navigateur d'abord : le serveur, lui, ne rend jamais la main.
start "" "http://localhost:5173/"

node scripts\serve.mjs 5173
