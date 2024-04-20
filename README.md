# 👾 API | CineGram 👾
CineGram is een app waarbij gebruikers in staat zijn om foto's en video's van films die ze hebben gezien te delen met hun volgers. Het stelt gebruikers ook in staat om posts van andere gebruikers te bekijken, leuk te vinden en te delen. Zoeken naar andere films kun je ook doen en een special watchlist in je eigen profiel kun je ook aanmaken.

## 🎯 Features
Ik heb ervoor gekozen om te focussen op een aantal features. in de tabel hieronder kun je ze bekijken:

| Features | 
| ----------- | 
| Inladen van Movie API | 
| Database connecten |
| "Liken" van film naar account (DB) |
| Login systeem maken |
| search pagina + details pop-up |
| Account pagina met opgelsagen films |
| PWA van website maken (service worker) |

## 🚀 Dit Project Gebruiken?
<b>Stap 1:</b> Om de app te gebruiken moet je deze repository clonen. gebruik de volgende commando in jouw Terminal:
```
git clone https://github.com/Kboere/api-2324.git
```
<b>Stap2:</b> De volgende stap is om een [MongoDB](https://www.mongodb.com) account aan te maken met een database.<br>
- hierbij noem je de database 'api'
- en heb je 2 collections nodig 'users' & 'posts' <br>

<b>Stap 3:</b> Maak nu een account aan bij [TMDB](https://www.themoviedb.org/settings/api). Hier heb je een api-sleutel nodig die je kunt vinden via instellingen > API.

Nadat je dit hebt gedaan is het noodzakelijk om alle **NPM Packeges** te downloaden. Deze kun je zien in de package.json file onder "dependencies". Gebruik hiervoor:
```
$ npm install i
```

Je bent er bijna!

Om jouw database te connecten aan het project maak je een .env file aan via de Terminal (`touch .env`). Hierin zet je vervolgens de volgende regel code:
```
MONGODB_URI = 'Jouw mongodb connectie link'
API_TOKEN=hierjeapitokenplaatsen
```

## GEFELICITEERD!🎉  je kunt de CineGram app gaan gebruiken!

## ✍🏻 Auteur
Dit project is gemaakt door Kevin Boere

## 📜 License
Copyright © 2024 Kevin Boere<br>
Dit project heeft een [MIT](https://github.com/Kboere/API-2324/blob/main/LICENSE) license


