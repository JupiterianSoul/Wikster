/**
 * RELEASE TIMELINE
 * ----------------------------------------------------------------------------
 * Everything that has shipped, oldest first. No dates on purpose: the order
 * is the story. The Updates screen renders this newest-first.
 *
 * `points` is the short version: new features only, one plain line each, no
 * mechanics and no numbers. `changelog` is the whole truth for that release,
 * behind the "full changelog" button. `icon` keys into src/data/icons.js and
 * `accent` colours the node on the timeline.
 */
export const RELEASES = [
  {
    id: 'origins', icon: 'packs', accent: '#60a5fa',
    title: { en: 'The first packs', fr: 'Les premiers boosters' },
    points: [
      { en: 'Boosters drawn live from Wikipedia', fr: 'Des boosters tirés en direct de Wikipédia' },
      { en: 'A collection, a shop and a wallet', fr: 'Une collection, une boutique et un porte-monnaie' },
      { en: 'Custom boosters from any wiki', fr: 'Des boosters personnalisés depuis n’importe quel wiki' }
    ],
    changelog: [
      { en: 'Every card is a real article with a price and a rarity', fr: 'Chaque carte est un vrai article, avec un prix et une rareté' },
      { en: 'Boosters are bought with Buckarooz and opened card by card', fr: 'Les boosters s’achètent en Buckarooz et s’ouvrent carte par carte' },
      { en: 'The collection keeps every card ever pulled, with duplicates counted', fr: 'La collection garde chaque carte tirée, doublons comptés' },
      { en: 'Custom boosters can be built on any subject that has its own wiki', fr: 'Des boosters personnalisés se créent sur tout sujet qui a son wiki' }
    ]
  },
  {
    id: 'rip', icon: 'spark', accent: '#f472b6',
    title: { en: 'The rip', fr: 'La déchirure' },
    points: [
      { en: 'Foil bags you tear open with a finger', fr: 'Des sachets métallisés à déchirer du doigt' },
      { en: 'Cards rebuilt, with rarity effects', fr: 'Des cartes reconstruites, avec effets de rareté' }
    ],
    changelog: [
      { en: 'Boosters became foil bags, torn open by dragging a finger across', fr: 'Les boosters sont devenus des sachets métallisés, déchirés du doigt' },
      { en: 'Cards were rebuilt: artwork, text, statistics and per-tier effects', fr: 'Cartes reconstruites : visuel, texte, statistiques et effets par rareté' },
      { en: 'The reveal deals the cards one at a time', fr: 'La révélation distribue les cartes une par une' },
      { en: 'Each subject got its own emblem, palette and wrapper design', fr: 'Chaque sujet a reçu son emblème, sa palette et son emballage' }
    ]
  },
  {
    id: 'bigone', icon: 'trophy', accent: '#fbbf24',
    title: { en: 'The big update', fr: 'La grande mise à jour' },
    points: [
      { en: 'Albums, achievements and daily gifts', fr: 'Albums, succès et cadeaux quotidiens' },
      { en: 'Friends, chat, trades and gifts', fr: 'Amis, discussion, échanges et cadeaux' },
      { en: 'Sounds, two new themes, a new logo', fr: 'Des sons, deux nouveaux thèmes, un nouveau logo' }
    ],
    changelog: [
      { en: 'Albums on a shelf, one book per category', fr: 'Des albums sur une étagère, un livre par catégorie' },
      { en: 'Achievements with rewards to redeem', fr: 'Des succès avec des récompenses à réclamer' },
      { en: 'A daily gift board and free packs on a levelling track', fr: 'Un plateau de cadeaux quotidiens et des packs gratuits sur une piste de niveaux' },
      { en: 'Accounts with friends, chat, trades and gifts between players', fr: 'Des comptes avec amis, discussion, échanges et cadeaux entre joueurs' },
      { en: 'A synthesiser giving every gesture a sound, tuned per theme', fr: 'Un synthétiseur qui donne un son à chaque geste, accordé par thème' },
      { en: 'A new logo, a launch animation, and less heat on the phone', fr: 'Un nouveau logo, une animation de lancement, et moins de chauffe' }
    ]
  },
  {
    id: 'mended', icon: 'friends', accent: '#4ade80',
    title: { en: 'Friends, mended', fr: 'Les amis, réparés' },
    points: [
      { en: 'A sturdier friends list', fr: 'Une liste d’amis plus solide' }
    ],
    changelog: [
      { en: 'The friends list survives a database that is behind', fr: 'La liste d’amis survit à une base de données en retard' },
      { en: 'Clear words on screen when the server itself needs updating', fr: 'Des mots clairs à l’écran quand le serveur doit être mis à jour' }
    ]
  },
  {
    id: 'fluid', icon: 'clock', accent: '#22d3ee',
    title: { en: 'The fluid one', fr: 'La fluidité' },
    points: [
      { en: 'A faster, smoother app throughout', fr: 'Une application plus rapide et plus fluide' },
      { en: 'A bigger album book', fr: 'Un livre d’album plus grand' }
    ],
    changelog: [
      { en: 'The whole app aims for sixty frames a second', fr: 'Toute l’application vise soixante images par seconde' },
      { en: 'The Meadow theme rebuilt, calmer', fr: 'Le thème Prairie reconstruit, plus calme' },
      { en: 'The opening scene sits centred with nothing scrolling under it', fr: 'La scène d’ouverture est centrée, rien ne défile dessous' },
      { en: 'A bigger album book that turns both ways', fr: 'Un livre d’album plus grand, qui tourne dans les deux sens' },
      { en: 'Profile picture cropping that is pleasant to use', fr: 'Un recadrage de photo de profil agréable à utiliser' }
    ]
  },
  {
    id: 'fame', icon: 'gem', accent: '#c084fc',
    title: { en: 'The fame update', fr: 'La célébrité' },
    points: [
      { en: 'Rarity now comes from real readership', fr: 'La rareté vient désormais de la vraie lecture' },
      { en: 'The shop became a market, with eight new subjects', fr: 'La boutique est devenue un marché, avec huit nouveaux sujets' },
      { en: 'The Forge and the Quiz', fr: 'La Forge et le Quiz' }
    ],
    changelog: [
      { en: 'A card’s rarity now follows how much its article is read', fr: 'La rareté d’une carte suit désormais la lecture réelle de son article' },
      { en: 'The economy reworked around it; collections re-graded on launch', fr: 'L’économie retravaillée en conséquence ; collections reclassées au lancement' },
      { en: 'The shop rebuilt as a market: a spotlight deal, subjects, a tier vault', fr: 'La boutique reconstruite en marché : offre en vitrine, sujets, réserve à paliers' },
      { en: 'Albums count the real size of every category', fr: 'Les albums comptent la vraie taille de chaque catégorie' },
      { en: 'Eight new subjects, from Music to Memes', fr: 'Huit nouveaux sujets, de la musique aux mèmes' },
      { en: 'The Forge: custom packs with a live preview', fr: 'La Forge : des packs personnalisés avec aperçu en direct' },
      { en: 'A quiz written from the cards’ own articles, with rewards', fr: 'Un quiz rédigé depuis les articles des cartes, avec récompenses' },
      { en: 'This timeline', fr: 'Cette chronologie' }
    ]
  },
  {
    id: 'polish', icon: 'collection', accent: '#38bdf8',
    title: { en: 'Sharper edges', fr: 'Les angles polis' },
    points: [
      { en: 'Albums one page at a time, and a classic list view', fr: 'Les albums page par page, et une vue en liste classique' },
      { en: 'Faster, safer booster opening', fr: 'Une ouverture de booster plus rapide et plus sûre' },
      { en: 'The quiz needs nothing from you', fr: 'Le quiz ne demande plus rien' }
    ],
    changelog: [
      { en: 'Album books show one page at a time, four cards at full size', fr: 'Les albums montrent une page à la fois, quatre cartes en taille réelle' },
      { en: 'The collection reads as albums or as a classic sorted list', fr: 'La collection se lit en albums ou en liste classique triée' },
      { en: 'One album per custom subject; lost custom packs come back', fr: 'Un seul album par sujet personnalisé ; les packs perdus reviennent' },
      { en: 'Boosters only draw pages actually about their subject', fr: 'Les boosters ne tirent que des pages qui parlent vraiment de leur sujet' },
      { en: 'Opening takes about one request instead of three per card', fr: 'L’ouverture tient en une requête environ, au lieu de trois par carte' },
      { en: 'A lost connection can never eat a booster', fr: 'Une connexion perdue ne peut plus avaler un booster' },
      { en: 'Cards left in the wrong language are translated on launch', fr: 'Les cartes restées dans la mauvaise langue sont traduites au lancement' },
      { en: 'The quiz is written server-side; no key, no setting', fr: 'Le quiz est rédigé côté serveur ; sans clé ni réglage' }
    ]
  },
  {
    id: 'hundred', icon: 'trophy', accent: '#e0a33e',
    title: { en: 'The hundred goals', fr: 'Les cent objectifs' },
    points: [
      { en: 'One hundred achievements in chains', fr: 'Cent succès organisés en chaînes' },
      { en: 'A Customization screen', fr: 'Un écran Personnalisation' },
      { en: 'A daily quiz allowance', fr: 'Un quota de quiz quotidien' }
    ],
    changelog: [
      { en: 'The achievements table grew to one hundred, organised as chains', fr: 'La table des succès est passée à cent, organisée en chaînes' },
      { en: 'Rewards rescaled by difficulty, up to a top-tier pack at the level cap', fr: 'Récompenses recalibrées par difficulté, jusqu’à un pack du plus haut rang au niveau maximal' },
      { en: 'The quiz shows its winnings and allows five runs a day', fr: 'Le quiz affiche ses gains et permet cinq parties par jour' },
      { en: 'Four themes turned down: they played louder than the rest', fr: 'Quatre thèmes baissés : ils sonnaient plus fort que les autres' },
      { en: 'Themes, picture and name moved to a Customization screen', fr: 'Thèmes, photo et pseudo déplacés vers un écran Personnalisation' },
      { en: 'Settings sorted into Preferences, Account and Data', fr: 'Réglages triés en Préférences, Compte et Données' }
    ]
  },
  {
    id: 'regalia', icon: 'star', accent: '#7ef2ff',
    title: { en: 'Badges and frames', fr: 'Insignes et cadres' },
    points: [
      { en: 'Holographic badges on the profile', fr: 'Des insignes holographiques sur le profil' },
      { en: 'Level frames in five styles', fr: 'Des cadres de niveau en cinq styles' }
    ],
    changelog: [
      { en: 'Twelve holographic badges for the hardest feats, upgrading in place', fr: 'Douze insignes holographiques pour les grands exploits, qui montent en grade' },
      { en: 'Badges sit on the profile, between level and statistics', fr: 'Les insignes se placent sur le profil, entre niveau et statistiques' },
      { en: 'A frame around the level, changing every ten levels to the cap', fr: 'Un cadre autour du niveau, qui change tous les dix niveaux jusqu’au maximum' },
      { en: 'Five frame styles to wear, chosen in Customization', fr: 'Cinq styles de cadre à porter, choisis dans Personnalisation' },
      { en: 'Friends see the frame on your picture and profile', fr: 'Les amis voient le cadre sur votre photo et votre profil' }
    ]
  },
  {
    id: 'bazaar', icon: 'trade', accent: '#4ade80',
    title: { en: 'The market opens', fr: 'Le marché ouvre' },
    points: [
      { en: 'Auctions between all players', fr: 'Des enchères entre tous les joueurs' },
      { en: 'Two new themes: Cartoon and Matrix', fr: 'Deux nouveaux thèmes : Cartoon et Matrix' },
      { en: 'A Badges screen to choose what you wear', fr: 'Un écran Insignes pour choisir ce que vous portez' }
    ],
    changelog: [
      { en: 'Any player can put cards up for auction; everyone can bid', fr: 'Tout joueur peut mettre des cartes aux enchères ; tout le monde peut miser' },
      { en: 'Each bid must clear the last by a fixed margin, shown to everyone', fr: 'Chaque mise doit dépasser la précédente d’une marge fixe, affichée à tous' },
      { en: 'A bid in the closing seconds winds the clock back up', fr: 'Une mise dans les dernières secondes relance le compte à rebours' },
      { en: 'A sale with a bid on it can no longer be withdrawn; unsold cards return', fr: 'Une vente avec mise ne peut plus être retirée ; les invendues reviennent' },
      { en: 'The Cartoon theme: ink borders, halftone, a real comic typeface, rubber sounds', fr: 'Le thème Cartoon : bords à l’encre, trame, vraie police comique, sons en caoutchouc' },
      { en: 'The Matrix theme: green rain, terminal type, digital sounds', fr: 'Le thème Matrix : pluie verte, police de terminal, sons numériques' },
      { en: 'Both themes speak in public-domain recordings', fr: 'Les deux thèmes parlent en enregistrements du domaine public' },
      { en: 'A Badges screen; up to four badges worn on the profile', fr: 'Un écran Insignes ; jusqu’à quatre insignes portés sur le profil' },
      { en: 'Arrows under the cards while opening a booster', fr: 'Des flèches sous les cartes pendant l’ouverture d’un booster' }
    ]
  },
  {
    id: 'collectors', icon: 'search', accent: '#f2ca4f',
    title: { en: 'The collectors update', fr: 'La mise à jour des collectionneurs' },
    points: [
      { en: 'The Auction House, rebuilt with five rooms', fr: 'L’Hôtel des ventes, reconstruit en cinq salles' },
      { en: 'All the Cards: a shared index of every discovery', fr: 'Toutes les cartes : un index partagé des découvertes' },
      { en: 'Wishlists, on every card', fr: 'Des listes de souhaits, sur chaque carte' },
      { en: 'Background music, and two new themes', fr: 'Une musique de fond, et deux nouveaux thèmes' }
    ],
    changelog: [
      { en: 'The market became the Auction House: browse, sales, bids, won, history', fr: 'Le marché est devenu l’Hôtel des ventes : parcourir, ventes, enchères, gagnées, historique' },
      { en: 'Auctions listed as full cards, two a row, with a search bar and sorts', fr: 'Les enchères affichées en vraies cartes, deux par ligne, avec recherche et tris' },
      { en: 'All the Cards: every real card any player has found, with counters and filters', fr: 'Toutes les cartes : chaque vraie carte trouvée par un joueur, avec compteurs et filtres' },
      { en: 'A wishlist bookmark on every card, yours or not; friends can see it', fr: 'Un marque-page de souhait sur chaque carte, à vous ou non ; visible par les amis' },
      { en: 'A bell when a wished card walks onto the auction floor', fr: 'Une cloche quand une carte souhaitée arrive aux enchères' },
      { en: 'A friend’s wishlist on their profile; an Owned tag on all cards', fr: 'La liste d’un ami sur son profil ; une étiquette Possédée sur toutes les cartes' },
      { en: 'A Glossary of every booster category', fr: 'Un glossaire de toutes les catégories de boosters' },
      { en: 'Achievements and badges for selling and winning at auction, and two more badges', fr: 'Succès et insignes pour vendre et gagner aux enchères, et deux insignes de plus' },
      { en: 'Three found lounge tracks under the app, with music and volume settings', fr: 'Trois morceaux lounge trouvés sous l’application, avec réglages de musique et de volume' },
      { en: 'A sound volume slider; the theme-selection sound turned right down', fr: 'Un curseur de volume ; le son de sélection de thème nettement baissé' },
      { en: 'The Casino theme: green felt, gold trim, drifting suits', fr: 'Le thème Casino : tapis vert, liseré doré, enseignes flottantes' },
      { en: 'The Horror theme: fog, grain, one red light', fr: 'Le thème Horreur : brume, grain, une lumière rouge' },
      { en: 'Boosters counted on the bottom bar; the packs screen fits without scrolling', fr: 'Les boosters comptés sur la barre du bas ; l’écran des boosters tient sans défiler' },
      { en: 'Notifications in the side menu, and new bells: full shelf, ready achievements', fr: 'Les notifications dans le menu latéral, et de nouvelles cloches : étagère pleine, succès prêts' }
    ]
  },
  {
    id: 'prism', icon: 'gem', accent: '#f472b6',
    title: { en: 'The rarity update', fr: 'La mise à jour des raretés' },
    points: [
      { en: 'Every rarity with a look of its own', fr: 'Chaque rareté avec un style bien à elle' },
      { en: 'Cards that lean with your hand and with the phone', fr: 'Des cartes qui s’inclinent avec la main et avec le téléphone' },
      { en: 'Prismatic, the new top tier', fr: 'Prismatique, le nouveau rang suprême' }
    ],
    changelog: [
      { en: 'Artifact became Prismatic; every old card, count and badge carries over', fr: 'Artefact est devenu Prismatique ; anciennes cartes, compteurs et insignes suivent' },
      { en: 'Common cards print flat, with a halftone; uncommon cards breathe green', fr: 'Les communes s’impriment à plat, avec une trame ; les peu communes respirent en vert' },
      { en: 'Rare cards wear a foil sheen and their title lights up when tapped', fr: 'Les rares portent un reflet métallisé et leur titre s’allume au toucher' },
      { en: 'Epic cards carry an aurora that drifts behind the art as the card leans', fr: 'Les épiques portent une aurore qui dérive derrière l’image quand la carte s’incline' },
      { en: 'Legendary cards in brushed gold, with sparks rising', fr: 'Les légendaires en or brossé, avec des étincelles qui montent' },
      { en: 'Mythic cards burn: embers, a molten ring, a picture that glitches', fr: 'Les mythiques brûlent : braises, anneau en fusion, image qui saute' },
      { en: 'Exotic cards as holograms, with scrolling wikitext and scanlines', fr: 'Les exotiques en hologrammes, avec du wikitexte qui défile et des lignes de balayage' },
      { en: 'Prismatic cards pour a rainbow ribbon across the face as you tilt them, over a liquid prism that never stops moving', fr: 'Les prismatiques font couler un ruban arc-en-ciel sur la carte quand on l’incline, au-dessus d’un prisme liquide qui ne s’arrête jamais' },
      { en: 'Prismatic corners shift from teal to magenta to gold, and the lettering is silver foil split red and cyan by the light', fr: 'Les bords prismatiques passent du turquoise au magenta puis à l’or, et le lettrage est un métal argenté que la lumière sépare en rouge et cyan' },
      { en: 'A held card leans and its light slides; on a phone the gyroscope leans it too', fr: 'Une carte tenue s’incline et sa lumière glisse ; sur téléphone, le gyroscope l’incline aussi' },
      { en: 'Battery saver keeps every card still', fr: 'L’économie de batterie garde chaque carte immobile' }
    ]
  },
  {
    id: 'web', icon: 'wand', accent: '#38bdf8',
    title: { en: 'Wikster on the web', fr: 'Wikster sur le web' },
    points: [
      { en: 'The whole game in a browser, desktop included', fr: 'Le jeu entier dans un navigateur, ordinateur compris' },
      { en: 'Search bars that finally match the app', fr: 'Des barres de recherche enfin accordées à l’app' }
    ],
    changelog: [
      { en: 'Wikster runs as a website as well as an app, from the same build', fr: 'Wikster tourne en site web comme en application, depuis la même version' },
      { en: 'On a desktop screen the game is laid out for a desk: a rail down the left, a header across the top, dialogues in the middle and grids that use the width', fr: 'Sur un écran d’ordinateur le jeu est disposé pour un bureau : une barre à gauche, un en-tête en haut, des boîtes de dialogue au centre et des grilles qui prennent la largeur' },
      { en: 'Every search bar wears the theme now instead of the browser’s white box', fr: 'Chaque barre de recherche porte le thème au lieu de la boîte blanche du navigateur' },
      { en: 'The card index and the auction house line up with the rest of the screen', fr: 'L’index des cartes et la salle des ventes s’alignent avec le reste de l’écran' },
      { en: 'Changing theme no longer closes the game: the launcher icon changes once you leave', fr: 'Changer de thème ne ferme plus le jeu : l’icône change quand vous quittez' },
      { en: 'The music is slow jazz now: piano, blues and a modal walk, and the restless tracks are gone', fr: 'La musique est du jazz lent : piano, blues et une marche modale, et les morceaux agités ont disparu' },
      { en: 'The chat stopped polling in the background after you left the room', fr: 'La discussion cesse de sonder en arrière-plan une fois la salle quittée' }
    ]
  },
  {
    id: 'endings', icon: 'trash', accent: '#fb7185',
    title: { en: 'Two ways to end a save', fr: 'Deux façons de finir une sauvegarde' },
    points: [
      { en: 'Erase everything now signs you out, so the cloud save cannot pull it back', fr: 'Tout effacer vous déconnecte désormais, pour que la sauvegarde cloud ne puisse pas tout ramener' },
      { en: 'A new button deletes the account itself, freeing the email address', fr: 'Un nouveau bouton supprime le compte lui-même et libère l’adresse e-mail' },
      { en: 'Sparkle joins Noah’s special booster', fr: 'Sparkle rejoint le booster spécial de Noah' }
    ],
    changelog: [
      { en: 'Erase everything signs you out as well as wiping the save, which is what it was missing: the address stayed signed in, so the account’s copy came straight back down on the next launch. The save row is now deleted outright rather than blanked, and the device is cleared down to the session token', fr: 'Tout effacer vous déconnecte en plus d’effacer la sauvegarde, ce qui lui manquait : l’adresse restait connectée, et la copie du compte redescendait au lancement suivant. La ligne de sauvegarde est maintenant supprimée et non vidée, et l’appareil est nettoyé jusqu’au jeton de session' },
      { en: 'Delete account is a second, harder ending: it removes the account itself, so the email stops working and is free to sign up with again as a new player. It runs as an edge function because deleting an account needs a key that must never ship inside the app', fr: 'Supprimer le compte est une fin plus radicale : le compte lui-même disparaît, l’e-mail cesse de fonctionner et redevient libre pour créer un nouveau joueur. Cela passe par une fonction edge, car supprimer un compte demande une clé qui ne doit jamais être livrée dans l’application' },
      { en: 'Sparkle, from Honkai: Star Rail, joins Noah’s special booster as the last card before The Creator, which brings it to five things and a sixth card like every other', fr: 'Sparkle, de Honkai: Star Rail, rejoint le booster spécial de Noah en dernière carte avant Le Créateur, ce qui le porte à cinq choses et une sixième carte comme tous les autres' }
    ]
  },
  {
    id: 'dressup', icon: 'wand', accent: '#fbbf24',
    title: { en: 'Dress your own collection', fr: 'Habillez votre collection' },
    points: [
      { en: 'Choose the effect each rarity wears, earned by collecting it', fr: 'Choisissez l’effet porté par chaque rareté, gagné en la collectionnant' },
      { en: 'Three new level frames, and every frame now opens at a level', fr: 'Trois nouveaux cadres de niveau, et chaque cadre s’ouvre désormais à un niveau' },
      { en: 'Four new settings, and the music starts the moment the app does', fr: 'Quatre nouveaux réglages, et la musique démarre en même temps que l’application' }
    ],
    changelog: [
      { en: 'Customization now holds a card-effect picker: one row per rarity, five looks each. Foil Sheen, Prism Split, Halo and Archive are earned by holding cards of that tier, and each is painted in the tier’s own colour so choosing a look never costs the ladder its legibility', fr: 'La personnalisation contient désormais un sélecteur d’effets : une ligne par rareté, cinq allures chacune. Éclat métallisé, Éclat prismatique, Halo et Archive s’obtiennent en possédant des cartes de ce palier, et chacun est peint dans la couleur du palier pour que le choix ne coûte jamais sa lisibilité à l’échelle' },
      { en: 'Three new level frames: Aurora Veil, Runic Seal and Solar Crown. Every frame now opens at a level of its own, from 25 to 450, and a locked one still shows its drawing so you can see what you are climbing towards', fr: 'Trois nouveaux cadres : Voile aurore, Sceau runique et Couronne solaire. Chaque cadre s’ouvre désormais à son propre niveau, de 25 à 450, et un cadre verrouillé montre quand même son dessin pour que vous voyiez vers quoi vous grimpez' },
      { en: 'Reset all progress really does end the save now: it clears the account on the server, the profile, the wishlist, the friends, the messages and the session itself, so the app comes back at the welcome screen the way a new install does. It also stops any sync still in flight from putting the old save straight back', fr: 'Réinitialiser toute la progression met vraiment fin à la sauvegarde : le compte sur le serveur, le profil, la liste de souhaits, les amis, les messages et la session sont effacés, et l’application revient à l’écran d’accueil comme une nouvelle installation. Une synchronisation encore en vol ne peut plus remettre l’ancienne sauvegarde' },
      { en: 'The music starts with the app instead of five seconds into it: the first track is fetched while the splash is still up rather than at the first tap', fr: 'La musique démarre avec l’application au lieu de cinq secondes plus tard : le premier morceau est chargé pendant l’écran de démarrage plutôt qu’au premier appui' },
      { en: 'Four new settings: tilt with the phone, vibration, keep the screen on while opening, and show card values', fr: 'Quatre nouveaux réglages : inclinaison avec le téléphone, vibration, garder l’écran allumé pendant l’ouverture, et afficher la valeur des cartes' },
      { en: 'A booster is only owed when a roll lands BELOW what it asked for. A subject whose pages are all famous no longer pays out for the Commons it could not find', fr: 'Un booster n’est dû que lorsqu’un tirage tombe EN DESSOUS de ce qu’il demandait. Un sujet dont toutes les pages sont célèbres ne paie plus pour les Communes qu’il n’a pas trouvées' }
    ]
  },
  {
    id: 'keepsword', icon: 'weird', accent: '#a3a3a3',
    title: { en: 'Boosters that keep their word', fr: 'Des boosters qui tiennent parole' },
    points: [
      { en: 'Pull rates decide the draw, and the odds sheet shows the real table', fr: 'Les taux de tirage décident du tirage, et la feuille des chances montre la vraie table' },
      { en: 'A tier booster now always contains a card of its tier', fr: 'Un booster à palier contient désormais toujours une carte de son palier' },
      { en: 'A pack tells you about a bad connection before you tear it', fr: 'Un paquet vous prévient d’une mauvaise connexion avant que vous l’ouvriez' }
    ],
    changelog: [
      { en: 'Pull rates are back, and they decide the draw: each card rolls a rarity off the booster’s own table, and only then is an article of that rarity found. A tier booster rolls on a better table and still guarantees at least one card of its tier, with anything above it counting', fr: 'Les taux de tirage sont de retour et décident du tirage : chaque carte tire une rareté sur la table du booster, et seulement ensuite un article de cette rareté est cherché. Un booster à palier tire sur une meilleure table et garantit toujours au moins une carte de son palier, tout ce qui est au-dessus comptant' },
      { en: 'The odds sheet shows the real table, percentage by percentage, for the booster in front of you rather than in the abstract', fr: 'La feuille des chances affiche la vraie table, pourcentage par pourcentage, pour le booster devant vous plutôt que dans l’abstrait' },
      { en: 'When a subject holds no page famous enough for a rarity the roll asked for, the pack drops a tier rather than leave its subject, and hands you a single-card booster of the rarity it could not give', fr: 'Quand un sujet n’a aucune page assez célèbre pour une rareté demandée par le tirage, le paquet descend d’un palier plutôt que de quitter son sujet, et vous remet un booster d’une carte de la rareté qu’il n’a pas pu donner' },
      { en: 'Booster prices are computed from the table itself, so the shop cannot drift out of step with what a pack actually pays out', fr: 'Les prix des boosters sont calculés depuis la table elle-même : la boutique ne peut plus se désynchroniser de ce qu’un paquet rapporte vraiment' },
      { en: 'The open screen warns about a dead or unreachable connection while the pack is still sealed, rather than after it is spent', fr: 'L’écran d’ouverture signale une connexion morte ou injoignable tant que le paquet est scellé, plutôt qu’une fois dépensé' },
      { en: 'A booster that fails to open comes back exactly once, through the same path the next launch uses, so it can never be handed back twice', fr: 'Un booster qui échoue à s’ouvrir revient exactement une fois, par le même chemin que le lancement suivant, sans jamais être rendu deux fois' },
      { en: 'Two separate buttons where there was one: Remove all cards keeps your level and your achievements, Reset all progress ends the save', fr: 'Deux boutons distincts là où il n’y en avait qu’un : Retirer toutes les cartes conserve votre niveau et vos succès, Réinitialiser toute la progression met fin à la sauvegarde' },
      { en: 'Reset all progress now really does clear everything, including the wishlist, the badge shelf, the frame and your saved bids, which used to survive it', fr: 'Réinitialiser toute la progression efface vraiment tout, y compris la liste de souhaits, l’étagère à badges, le cadre et vos enchères, qui y survivaient' },
      { en: 'The mark is painted in the theme’s own colours, so the drawer, the splash and the gate follow a theme change', fr: 'Le logo est peint aux couleurs du thème, si bien que le tiroir, l’écran de démarrage et la porte suivent un changement de thème' },
      { en: 'One Gift button on a friend’s profile, which then asks whether you meant a card or a booster', fr: 'Un seul bouton Offrir sur le profil d’un ami, qui demande ensuite s’il s’agit d’une carte ou d’un booster' },
      { en: 'Notifications can be cleared once read; the launcher icon changes safely when the game is put away', fr: 'Les notifications lues peuvent être effacées ; l’icône change sans risque quand le jeu est mis de côté' },
      { en: 'The Android app ships as a release build rather than a debug one, which is the version Android words its install warnings least harshly about. Same signing key, so it still installs over your copy and keeps your collection', fr: 'L’application Android est désormais une version release plutôt qu’une version debug, celle sur laquelle Android formule ses avertissements le moins durement. Même clé de signature : elle s’installe toujours par-dessus votre copie et conserve votre collection' }
    ]
  },
  {
    id: 'wikster', icon: 'spark', accent: '#a78bfa',
    title: { en: 'Wikster, and rarity is the print', fr: 'Wikster, et la rareté est l’impression' },
    points: [
      { en: 'The game is called Wikster', fr: 'Le jeu s’appelle Wikster' },
      { en: 'Rarity is rolled with the pack, at the same rates in every subject', fr: 'La rareté se tire avec le booster, aux mêmes taux dans tous les sujets' },
      { en: 'A better print of a card you own replaces it', fr: 'Une meilleure impression d’une carte possédée la remplace' },
      { en: 'The app updates itself, and music fades from one track to the next', fr: 'L’appli se met à jour toute seule, et la musique enchaîne en fondu' }
    ],
    changelog: [
      { en: 'Rarity is the print: rolled per card off the booster’s odds row when the pack is opened, and the article is drawn from the subject on its own. An Epic pack deals Epics at its printed rate whatever the subject holds; nothing is owed, capped or re-graded afterwards', fr: 'La rareté est l’impression : tirée par carte selon la table du booster à l’ouverture, l’article étant tiré du sujet à part. Un booster Épique distribue des Épiques à son taux quel que soit le sujet ; plus rien n’est dû, plafonné ou reclassé après coup' },
      { en: 'Fame (monthly readers) sets the price and the Famous band, and no longer the tier. A card graded while its readership request had failed is priced right on the next launch', fr: 'La notoriété (lecteurs par mois) fixe le prix et la bande Célèbre, plus le palier. Une carte classée alors que sa requête d’audience avait échoué est correctement valorisée au prochain lancement' },
      { en: 'Pulling an article already owned at a better print replaces the lesser print, copies kept', fr: 'Retirer un article déjà possédé avec une meilleure impression remplace l’ancienne, exemplaires conservés' },
      { en: 'A booster is two to seven requests: readership comes back with the page, and custom wikis are drawn from one listing rather than a search per card', fr: 'Un booster tient en deux à sept requêtes : l’audience revient avec la page, et les wikis personnalisés se tirent d’une seule liste plutôt que d’une recherche par carte' },
      { en: 'Every card’s picture starts downloading the moment the draw has chosen it, and smaller pictures are asked for on a slow line', fr: 'L’image de chaque carte se télécharge dès que le tirage l’a choisie, et des images plus petites sont demandées sur une connexion lente' },
      { en: 'The Android app opens the published site and only falls back to its built-in copy offline, so every publish reaches it with no reinstall', fr: 'L’appli Android ouvre le site publié et ne se rabat sur sa copie intégrée que hors ligne : chaque publication l’atteint sans réinstallation' },
      { en: 'An older build never overwrites a save written by a newer one; a bar says when a newer build is out', fr: 'Une ancienne version n’écrase jamais une sauvegarde écrite par une plus récente ; une barre signale qu’une version plus récente existe' },
      { en: 'A deleted account is signed out at launch instead of walking in on a stale token', fr: 'Un compte supprimé est déconnecté au lancement au lieu d’entrer avec un jeton périmé' },
      { en: 'Remove all cards tells the account before reloading, so the cards no longer come straight back', fr: 'Retirer toutes les cartes prévient le compte avant de recharger, les cartes ne reviennent donc plus aussitôt' },
      { en: 'Special cards come from their own wikis (the Terraforming Mars card, not the animal), and the ones already owned are repaired', fr: 'Les cartes spéciales viennent de leurs propres wikis (la carte Terraforming Mars, pas l’animal), et celles déjà possédées sont réparées' },
      { en: 'Music crossfades from one track to the next', fr: 'La musique enchaîne les morceaux en fondu' }
    ]
  },
  {
    id: 'arcade', icon: 'dice', accent: '#f472b6',
    title: { en: 'The arcade', fr: 'La salle de jeux' },
    points: [
      { en: 'Wikdle, a slot machine and a roulette wheel', fr: 'Wikdle, une machine à sous et une roulette' },
      { en: 'Three quests a day, with rewards to claim', fr: 'Trois quêtes par jour, avec des récompenses à réclamer' },
      { en: 'A leaderboard for today, this week and all time', fr: 'Un classement du jour, de la semaine et de toujours' },
      { en: 'The shop rebuilt around the print, and boosters sized by you', fr: 'La boutique refaite autour de l’impression, et des boosters à la taille que vous voulez' }
    ],
    changelog: [
      { en: 'A Minigames tab: Wikdle, the slot machine and the roulette, each with its own help sheet', fr: 'Un onglet Mini-jeux : Wikdle, la machine à sous et la roulette, chacun avec sa fiche d’aide' },
      { en: 'Wikdle: the encyclopaedia’s five-letter word of the day in six rows, the same word for everyone, with a dictionary that refuses non-words and duplicate letters scored the way the real game scores them. A finished board is locked for the day and pays points', fr: 'Wikdle : le mot de cinq lettres du jour en six lignes, le même pour tout le monde, avec un dictionnaire qui refuse les non-mots et des lettres doublées notées comme dans le vrai jeu. Une grille finie est verrouillée pour la journée et rapporte des points' },
      { en: 'The slot machine: three reels, five symbols, five paylines, a book tuned to pay back 95%. Every spin is decided on the server with cryptographic randomness; the app checks the answer against the book before paying and refunds the coin if the house does not answer', fr: 'La machine à sous : trois rouleaux, cinq symboles, cinq lignes, un livre réglé pour rendre 95 %. Chaque tour se décide sur le serveur avec un aléa cryptographique ; l’appli vérifie la réponse contre le livre avant de payer et rend la pièce si la maison ne répond pas' },
      { en: 'The roulette: a real European table, every classic bet, and the game’s own tier bets from Common at 1.5x to Exotic at 10x, several chips a spin up to a table limit. The wheel turns to the pocket the server named and settles on it', fr: 'La roulette : une vraie table européenne, toutes les mises classiques, et les mises de palier du jeu, de Commune à 1,5x jusqu’à Exotique à 10x, plusieurs jetons par tour jusqu’à une limite de table. La roue tourne jusqu’à la case nommée par le serveur et s’y arrête' },
      { en: 'Daily quests: three a day from a book of over a hundred, dealt at 00:00 UTC, easy, medium and hard by weight, credited by everything you already do in the game. Signed in, the deal and the claim are the server’s', fr: 'Quêtes du jour : trois par jour tirées d’un livre de plus de cent, distribuées à 00 h 00 UTC, faciles, moyennes et difficiles selon leur poids, créditées par tout ce que vous faites déjà dans le jeu. Connecté, la distribution et la réclamation sont celles du serveur' },
      { en: 'The leaderboard: daily, weekly and all-time tables kept on the server, twenty rows a page, your own row pinned to the bottom when it is not on screen', fr: 'Le classement : des tables du jour, de la semaine et de toujours tenues sur le serveur, vingt lignes par page, votre propre ligne épinglée en bas quand elle n’est pas à l’écran' },
      { en: 'The shop: the press stocks tier boosters with their real chance printed on the label, bundles of three, a sealed crate, and a card-count picker for custom packs priced so that two one-card packs cost more than one two-card pack', fr: 'La boutique : la presse propose des boosters à palier avec leur vraie chance imprimée sur l’étiquette, des lots de trois, une caisse scellée, et un choix du nombre de cartes des boosters perso, tarifé pour que deux boosters d’une carte coûtent plus qu’un booster de deux' },
      { en: 'Rarity effects show everywhere a card is shown, not only in the booster', fr: 'Les effets de rareté s’affichent partout où une carte apparaît, pas seulement dans le booster' },
      { en: 'Special badges can be taken off, all of them, and stay off', fr: 'Les badges spéciaux peuvent tous être retirés, et le restent' },
      { en: 'Updates are numbered: the fifth update is called the fifth update', fr: 'Les mises à jour sont numérotées : la cinquième s’appelle la cinquième' }
    ]
  },
  {
    id: 'house', icon: 'reel', accent: '#fa8072',
    title: { en: 'The house, rebuilt', fr: 'La maison, reconstruite' },
    points: [
      { en: 'The slot machine rebuilt: new symbols, a wild, a bonus of free spins', fr: 'La machine à sous refaite : nouveaux symboles, un joker, un bonus de tours gratuits' },
      { en: 'Wikdle with hints from Wikipedia and streaks that pay', fr: 'Wikdle avec des indices de Wikipédia et des séries qui paient' },
      { en: 'Notifications redesigned, and the chat bar back where it belongs', fr: 'Les notifications refaites, et la barre de discussion remise à sa place' },
      { en: 'A frame from level 1, and quests that keep count', fr: 'Un cadre dès le niveau 1, et des quêtes qui tiennent le compte' }
    ],
    changelog: [
      { en: 'The slot machine, again from the ground up: eight symbols drawn as pictures, a wild that stands in for any of them and pays 700 times the line bet three across, and a bonus symbol that opens eight free spins when three land anywhere in the window. The house plays the free spins on the spot and the app draws them one by one. Pay lines are drawn across the glass, winning cells glow, coins rain, and a big, mega or jackpot win gets its banner. The book returns about 95%, bonus counted', fr: 'La machine à sous, de nouveau depuis zéro : huit symboles dessinés, un joker qui remplace n’importe lequel et paie 700 fois la mise par ligne quand il est aligné trois fois, et un symbole bonus qui ouvre huit tours gratuits quand trois tombent n’importe où dans la fenêtre. La maison joue les tours gratuits sur-le-champ et l’appli les dessine un par un. Les lignes gagnantes se tracent sur la vitre, les cases gagnantes brillent, les pièces pleuvent, et un gros, méga ou jackpot a sa bannière. Le livre rend environ 95 %, bonus compris' },
      { en: 'Wikdle: two hints from the word’s own Wikipedia article for a hundred points each, a streak bonus on the coins up to half again, a Rare booster for a solve in two, a booster every seventh day of a streak, a link to the article once the board is done, tiles that flip and dance, confetti, and a done panel that shows where the points came from', fr: 'Wikdle : deux indices tirés de l’article Wikipédia du mot pour cent points chacun, un bonus de série sur les pièces jusqu’à la moitié en plus, un booster Rare pour une réussite en deux essais, un booster tous les sept jours de série, un lien vers l’article une fois la grille finie, des cases qui se retournent et dansent, des confettis, et un panneau de fin qui montre d’où viennent les points' },
      { en: 'The roulette is gone', fr: 'La roulette a disparu' },
      { en: 'Notifications: a redesigned sheet, new and earlier on two shelves, a colour and a label per kind, and every note opens its screen freshly painted, so a quest note lands on the quest with its progress', fr: 'Notifications : une feuille refaite, nouveau et plus tôt sur deux étagères, une couleur et un libellé par genre, et chaque note ouvre son écran fraîchement peint, si bien qu’une note de quête arrive sur la quête avec sa progression' },
      { en: 'Daily quests keep a ledger of everything done today, so progress survives signing in, a change of deal, or a server that had not seen it', fr: 'Les quêtes du jour tiennent un registre de tout ce qui a été fait aujourd’hui, si bien que la progression survit à une connexion, à un changement de distribution ou à un serveur qui ne l’avait pas vue' },
      { en: 'A message notification opens the conversation with the composer showing; the chat bar stays above the bottom bar on every phone', fr: 'Une notification de message ouvre la conversation avec la zone de saisie visible ; la barre de discussion reste au-dessus de la barre du bas sur tous les téléphones' },
      { en: 'An equipped level frame shows from level 1, with a new tier every ten levels', fr: 'Un cadre de niveau équipé s’affiche dès le niveau 1, avec un nouveau palier tous les dix niveaux' },
      { en: 'A special album shows every one of its cards whatever the binder’s filters say', fr: 'Un album spécial montre chacune de ses cartes quels que soient les filtres du classeur' },
      { en: 'The special badges draw their own motifs (a seal, a wheel, a book, a pot) instead of a star', fr: 'Les badges spéciaux dessinent leurs propres motifs (un sceau, une meule, un livre, un pot) au lieu d’une étoile' }
    ]
  },
  {
    id: 'shining', icon: 'gem', accent: '#fbbf24',
    title: { en: 'The Shining Shop', fr: 'La boutique qui brille' },
    points: [
      { en: 'The crate rolls: one price, the whole shop goes by, and it stops on yours', fr: 'La caisse tourne : un seul prix, toute la boutique défile, et elle s’arrête sur la vôtre' },
      { en: 'The press rebuilt, with prices that mean something', fr: 'La presse refaite, avec des prix qui veulent dire quelque chose' },
      { en: 'Bundles of every kind, and a shop that runs out', fr: 'Des lots de toutes sortes, et une boutique qui s’épuise' },
      { en: 'Updates by name, with their number beside them', fr: 'Les mises à jour par leur nom, avec leur numéro à côté' }
    ],
    changelog: [
      { en: 'The crate: one price, 1,000, and anything the shop sells can come out, any subject or pack you built, any size from three cards, any tier, the bigger and the rarer the less likely. Buying one rolls a reel of the whole shop across the screen that slows and stops on your booster, with a proper sheet saying what it held. Each crate bought makes the next one a quarter dearer until the restock', fr: 'La caisse : un seul prix, 1 000, et tout ce que vend la boutique peut en sortir, n’importe quel sujet ou pack que vous avez créé, n’importe quelle taille à partir de trois cartes, n’importe quel palier, plus c’est grand et rare, moins c’est probable. L’acheter fait défiler toute la boutique à l’écran, qui ralentit et s’arrête sur votre booster, avec une vraie fiche disant ce qu’elle contenait. Chaque caisse achetée rend la suivante un quart plus chère jusqu’au réassort' },
      { en: 'The press, again from scratch: a plate per tier that says exactly what it promises, at least one card of the tier and every print rolled on that tier’s row, with a run of one or two copies and a price that carries the premium the promise is worth. A Mythic run now costs several times a Rare one, and a Prismatic run is an event', fr: 'La presse, de nouveau depuis zéro : une plaque par palier qui dit exactement ce qu’elle promet, au moins une carte du palier et chaque impression tirée sur la ligne de ce palier, avec une série d’un ou deux exemplaires et un prix qui porte la prime que vaut la promesse. Une série Mythique coûte désormais plusieurs fois une Rare, et une série Prismatique est un événement' },
      { en: 'Bundles of two to four boosters, several of one or a mix of subjects, sizes and tiers, ten to twenty percent under the sum, with the saving on the label and the wrappers fanned sideways rather than climbing', fr: 'Des lots de deux à quatre boosters, plusieurs d’un même ou un mélange de sujets, tailles et paliers, dix à vingt pour cent sous la somme, avec l’économie sur l’étiquette et les emballages en éventail plutôt qu’en escalier' },
      { en: 'The shop runs out: the spotlight and every bundle are one each, subjects and press runs a few copies, all counted per restock and shown on the shelf; the crate and your own packs never run out', fr: 'La boutique s’épuise : la vitrine et chaque lot sont uniques, les sujets et les séries de la presse à quelques exemplaires, tous comptés par réassort et affichés sur l’étagère ; la caisse et vos propres packs ne s’épuisent jamais' },
      { en: 'The spotlight deal shows what it saves you, that there is only one, and a shine that crosses it', fr: 'L’offre en vitrine montre ce qu’elle vous fait économiser, qu’il n’y en a qu’une, et un reflet qui la traverse' },
      { en: 'The balance at the top of the shop follows every purchase', fr: 'Le solde en haut de la boutique suit chaque achat' },
      { en: 'Updates are named again, every one, with its number next to the name', fr: 'Les mises à jour ont de nouveau un nom, chacune, avec son numéro à côté' }
    ]
  },
  {
    id: 'facetoface', icon: 'friends', accent: '#38bdf8',
    title: { en: 'Face to Face', fr: 'Face à face' },
    points: [
      { en: 'Chat says when they have seen it and when they are typing', fr: 'La discussion dit quand ils ont vu et quand ils écrivent' },
      { en: 'A friend’s profile with their stats, and their cards two ways', fr: 'Le profil d’un ami avec ses statistiques, et ses cartes de deux façons' },
      { en: 'A profile picture that is really the circle you chose', fr: 'Une photo de profil qui est vraiment le cercle choisi' },
      { en: 'Solid gold Legendary cards, and the Prismatic remade', fr: 'Des Légendaires en or massif, et la Prismatique refaite' }
    ],
    changelog: [
      { en: 'Chat: every message you send carries a tick once it is on the server and two blue ones once the other person has opened the conversation, the last one says it in words, and three dots under the log show when they are typing. Sent messages and receipts arrive live when the project has Realtime, and on the poll otherwise', fr: 'Discussion : chaque message envoyé porte une coche une fois sur le serveur et deux bleues une fois que l’autre a ouvert la conversation, le dernier le dit en toutes lettres, et trois points sous le fil montrent quand l’autre écrit. Messages et accusés arrivent en direct quand le projet a le Realtime, et au rafraîchissement sinon' },
      { en: 'Gift and Trade sit in the chat header, and tapping the name or the picture opens the friend’s profile', fr: 'Offrir et Échanger sont dans l’en-tête de la discussion, et toucher le nom ou la photo ouvre le profil de l’ami' },
      { en: 'The keyboard no longer covers the conversation: the room shrinks above it and the newest line stays in view, in the app and in the browser', fr: 'Le clavier ne couvre plus la conversation : la pièce se rétrécit au-dessus de lui et la dernière ligne reste visible, dans l’appli comme dans le navigateur' },
      { en: 'A friend’s profile shows the same stats block as yours, their cards per tier, and their collection as albums or as the classic view, every card openable', fr: 'Le profil d’un ami montre le même bloc de statistiques que le vôtre, ses cartes par palier, et sa collection en albums ou en vue classique, chaque carte ouvrable' },
      { en: 'The profile picture is cropped for real: the picture moves under a fixed circle, pinch, scroll or the slider zoom it, a live preview shows the result, and the circle you chose is exactly what everyone sees', fr: 'La photo de profil est vraiment recadrée : l’image bouge sous un cercle fixe, pincer, faire défiler ou le curseur zooment, un aperçu montre le résultat, et le cercle choisi est exactement ce que tout le monde voit' },
      { en: 'The classic view has a search field of its own', fr: 'La vue classique a son propre champ de recherche' },
      { en: 'Bundles show three sleeves at most, fanned like a hand, with a count for the rest', fr: 'Les lots montrent trois emballages au plus, en éventail, avec un compte pour le reste' },
      { en: 'The favourite star answers to a much wider tap without growing, so it no longer opens the card by mistake, and the big view has its own star', fr: 'L’étoile de favori répond à une zone bien plus large sans grossir, si bien qu’elle n’ouvre plus la carte par erreur, et la grande vue a sa propre étoile' },
      { en: 'Legendary cards are gold through and through: an opaque brushed metal plate with a light that crosses it, a bronze bevel, and type stamped dark into it', fr: 'Les cartes Légendaires sont en or de part en part : une plaque de métal brossé opaque traversée d’un reflet, un biseau bronze, et un texte gravé sombre dedans' },
      { en: 'The Prismatic remade from the board: the holo-foil plate, a rainbow ribbon that curves and breathes and slides with the tilt, thin-film corners, and the glass badge', fr: 'La Prismatique refaite d’après la planche : la plaque holographique, un ruban arc-en-ciel qui ondule, respire et glisse avec l’inclinaison, des coins irisés, et le badge de verre' }
    ]
  },
  {
    id: 'worldclock', icon: 'clock', accent: '#7dd3fc',
    title: { en: 'The World Clock', fr: 'L’heure du monde' },
    points: [
      { en: 'The daily gift rebuilt: a week of seven, on UTC, in step with the quests', fr: 'Le cadeau quotidien refait : une semaine de sept, en UTC, au pas des quêtes' },
      { en: 'Quests and the leaderboard redrawn, with their clocks on the wall', fr: 'Quêtes et classement redessinés, leur horloge au mur' },
      { en: 'Every little message at the bottom is a proper card now', fr: 'Chaque petit message du bas est une vraie carte désormais' },
      { en: 'Frames come sooner, and the Singularity waits at 500', fr: 'Les cadres arrivent plus tôt, et la Singularité attend au niveau 500' }
    ],
    changelog: [
      { en: 'The daily gift, again from the ground up: seven rungs make a week, coins most days, a booster on the third and sixth, coins and an Epic booster on the seventh. The day turns at 00:00 UTC for everyone, the same moment the quests and the boards do, and the sheet says so with a live clock. Miss a day and the week starts again; every completed week adds two percent to the coins, up to half again. Sized against the shop’s stipend, a full week is about a day of stipends spread over seven days. Old records carry over: the rung reached and the boards completed become the day and the weeks', fr: 'Le cadeau quotidien, de nouveau depuis zéro : sept échelons font une semaine, des pièces la plupart des jours, un booster le troisième et le sixième, des pièces et un booster Épique le septième. Le jour change à 00:00 UTC pour tout le monde, au même instant que les quêtes et les classements, et la fiche le dit avec une horloge en direct. Un jour manqué et la semaine recommence ; chaque semaine complète ajoute deux pour cent aux pièces, jusqu’à la moitié en plus. Calibrée sur la rente de la boutique, une semaine entière vaut environ une journée de rentes étalée sur sept jours. Les anciens carnets sont repris : l’échelon atteint et les planches complétées deviennent le jour et les semaines' },
      { en: 'Daily quests: a board with a ring that counts the day, what the three pay together, and a clock to midnight UTC; rows with a stripe for the tier, a bar with the count inside it, and a claim that pays on the row with a burst. The board is painted in place, so opening the tab or claiming a quest never blanks and redraws it', fr: 'Quêtes du jour : un tableau avec un anneau qui compte la journée, ce que les trois paient ensemble, et une horloge jusqu’à minuit UTC ; des lignes avec une bande pour le palier, une barre avec le compte dedans, et une réclamation qui paie sur la ligne avec une gerbe. Le tableau est peint sur place, si bien qu’ouvrir l’onglet ou réclamer une quête ne l’efface plus pour le redessiner' },
      { en: 'The leaderboard: a podium for the first three, the first in the middle a step higher, rows from the fourth with a rank chip, room under the switch, and a live clock that says when the window turns: 00:00 UTC daily, Sunday 00:00 UTC weekly, the same clock the server keeps', fr: 'Le classement : un podium pour les trois premiers, le premier au milieu une marche plus haut, des lignes à partir du quatrième avec une pastille de rang, de l’air sous le sélecteur, et une horloge en direct qui dit quand la fenêtre tourne : 00:00 UTC chaque jour, dimanche 00:00 UTC chaque semaine, la même horloge que le serveur' },
      { en: 'The small messages at the bottom of the screen are cards now: a mark for the kind of news, the words, a bar that drains while the card stays, a spring on the way in, and a tap to send one away', fr: 'Les petits messages en bas de l’écran sont des cartes maintenant : une marque pour le genre de nouvelle, les mots, une barre qui s’écoule tant que la carte reste, un ressort à l’arrivée, et un toucher pour la renvoyer' },
      { en: 'Level frames open sooner: Neon Circuit at 15, Cosmic Orbit at 35, Foil Crest at 60, Crystal Bloom at 90, Aurora Veil at 125, Runic Seal at 160 and the Solar Crown at 200', fr: 'Les cadres de niveau s’ouvrent plus tôt : Circuit néon à 15, Orbite cosmique à 35, Blason métallisé à 60, Floraison de cristal à 90, Voile aurore à 125, Sceau runique à 160 et la Couronne solaire à 200' },
      { en: 'The Singularity, at level 500 and nothing less: the level becomes a black hole, with a photon ring that breathes, three rings of an accretion disc turning at three speeds, lensed light bending around the horizon, jets pulsing from the poles, and stars circling in', fr: 'La Singularité, au niveau 500 et pas moins : le niveau devient un trou noir, avec un anneau de photons qui respire, trois anneaux d’un disque d’accrétion tournant à trois vitesses, de la lumière déviée autour de l’horizon, des jets qui pulsent aux pôles, et des étoiles qui tournent vers lui' }
    ]
  },
  {
    id: 'sharpening', icon: 'target', accent: '#a78bfa',
    title: { en: 'Sharp Edges', fr: 'Angles nets' },
    points: [
      { en: 'Boosters deal what the wrapper says, tier included', fr: 'Les boosters donnent ce que dit l’emballage, palier compris' },
      { en: 'Wikdle hints that are hints, and a day’s work worth the coins', fr: 'Des indices Wikdle qui en sont, et une journée qui vaut ses pièces' },
      { en: 'A real interface on a desk, not a phone stretched across one', fr: 'Une vraie interface sur un bureau, pas un téléphone étiré' },
      { en: 'Blur adult content, a setting away', fr: 'Flouter le contenu adulte, à un réglage près' }
    ],
    changelog: [
      { en: 'A booster hands over the number of cards printed on it. A thin subject used to run out of pages and deal four of a ten, so the draw now keeps looking, with a longer budget and many more rounds, and says in the console when it still cannot fill a pack', fr: 'Un booster remet le nombre de cartes imprimé dessus. Un sujet mince manquait de pages et en donnait quatre sur dix ; le tirage cherche désormais plus longtemps, avec un budget plus large et bien plus de tours, et signale dans la console s’il ne peut toujours pas remplir un paquet' },
      { en: 'A tier booster keeps its promise even when it comes back short. The prints are rolled for the size the pack was sold as, and the guaranteed one could land past the last card actually drawn: a ten-card Epic pack that found four cards handed over four Commons. The promise is now made again over the cards in hand', fr: 'Un booster à palier tient sa promesse même s’il revient court. Les impressions sont tirées pour la taille vendue, et celle qui est garantie pouvait tomber au-delà de la dernière carte réellement tirée : un paquet Épique de dix cartes qui en trouvait quatre remettait quatre Communes. La promesse est désormais refaite sur les cartes en main' },
      { en: 'Wikdle hints are worth their points. The first is always a letter in its place, drawn from the answer itself, so it works with no connection and can never be vague; the second is what the word means, and only when Wikipedia has a real article rather than a page of things the word can name. "Topics referred to by the same term" is not a hint, and is never handed over as one', fr: 'Les indices de Wikdle valent leurs points. Le premier est toujours une lettre à sa place, tirée de la réponse elle-même : il marche sans connexion et ne peut pas être vague ; le second est le sens du mot, et seulement quand Wikipédia a un vrai article plutôt qu’une page de ce que le mot peut désigner. « Topics referred to by the same term » n’est pas un indice, et n’est plus donné comme tel' },
      { en: 'Wikdle pays like the day’s puzzle it is: a solve is worth 500 to 1,400 points, a hint costs 120, and the coins follow the points closely instead of halving them. A morning’s board now stands next to a handful of slot spins rather than under them; the machine itself is unchanged and still returns about 95%', fr: 'Wikdle paie comme l’énigme du jour qu’il est : une réussite vaut de 500 à 1 400 points, un indice coûte 120, et les pièces suivent les points de près au lieu de les diviser par deux. Une grille du matin tient désormais la comparaison avec quelques tours de machine ; la machine elle-même est inchangée et rend toujours environ 95 %' },
      { en: 'The favourite star is centred in its disc, and answers to a reach far wider than it is drawn, so it no longer opens the card by mistake', fr: 'L’étoile de favori est centrée dans son disque et répond à une zone bien plus large qu’elle n’est dessinée : elle n’ouvre plus la carte par erreur' },
      { en: 'The collection’s search field no longer prints its placeholder on top of its magnifier', fr: 'Le champ de recherche de la collection n’écrit plus son texte par-dessus sa loupe' },
      { en: 'Every card with a picture is offered as a profile picture, rarest first; the picker used to stop at sixty', fr: 'Chaque carte avec une image est proposée comme photo de profil, la plus rare d’abord ; le sélecteur s’arrêtait à soixante' },
      { en: 'Blur adult content: a setting that hides the picture on cards about explicit subjects, in the collection, the albums and the picture picker. Nothing is removed and no draw changes; an open card can still be uncovered with a tap', fr: 'Flouter le contenu adulte : un réglage qui masque l’image des cartes traitant de sujets explicites, dans la collection, les albums et le sélecteur de photo. Rien n’est supprimé et aucun tirage ne change ; une carte ouverte peut être dévoilée d’un toucher' },
      { en: 'A subject has been withdrawn, and everything it dealt goes with it: its cards, any booster of it still on the shelf, and its name anywhere in the app', fr: 'Un sujet a été retiré, et tout ce qu’il a distribué part avec lui : ses cartes, tout booster de ce sujet encore sur l’étagère, et son nom partout dans l’application' },
      { en: 'On a desk, a card in the collection is the size of a card again: the classic view and every grid of cards are measured in card widths rather than in two columns, so a monitor shows a collection instead of two posters', fr: 'Sur un bureau, une carte de la collection a de nouveau la taille d’une carte : la vue classique et toutes les grilles de cartes se mesurent en largeurs de carte plutôt qu’en deux colonnes, si bien qu’un écran montre une collection et non deux affiches' },
      { en: 'Panels, rows and lists keep one measure on a wide screen rather than being dragged from edge to edge, and the sheets that open in the middle of the screen have their contents in the middle of themselves: the level-up jump, its reward and its button are centred, and so are the week of gifts and the picture cropper', fr: 'Les panneaux, les lignes et les listes gardent une seule mesure sur un large écran au lieu d’être tirés d’un bord à l’autre, et les fiches qui s’ouvrent au milieu de l’écran ont leur contenu au milieu d’elles-mêmes : le saut de niveau, sa récompense et son bouton sont centrés, comme la semaine de cadeaux et le recadrage de la photo' }
    ]
  },
  {
    id: 'longgame', icon: 'podium', accent: '#22d3ee',
    title: { en: 'The Long Game', fr: 'Le jeu long' },
    points: [
      { en: 'Album medals: Bronze at 75, Silver at 200, Gold at 500, Diamond at 1,000', fr: 'Des médailles d’album : bronze à 75, argent à 200, or à 500, diamant à 1 000' },
      { en: 'Two new games on your own cards: the Popularity Duel and Guess the Article', fr: 'Deux nouveaux jeux sur vos propres cartes : le Duel de popularité et Devinez l’article' },
      { en: 'Two phones on one account no longer erase each other, and the server keeps backups', fr: 'Deux téléphones sur un compte ne s’effacent plus, et le serveur garde des sauvegardes' },
      { en: 'Opens with no connection at all, and loads in a third of the code', fr: 'S’ouvre sans aucune connexion, et charge avec un tiers du code' }
    ],
    changelog: [
      { en: 'Every album has four medals, targets that can actually be reached: Bronze at 75 different cards of the subject, Silver at 200, Gold at 500, Diamond at 1,000. Each pays coins, and from Silver up a booster of the subject with a guaranteed tier. The rung reached sits on the album cover; the open album carries the four with the one to claim', fr: 'Chaque album a quatre médailles, des objectifs qu’on peut vraiment atteindre : bronze à 75 cartes différentes du sujet, argent à 200, or à 500, diamant à 1 000. Chacune paie des pièces, et à partir de l’argent un booster du sujet avec un palier garanti. La médaille atteinte est sur la couverture ; l’album ouvert montre les quatre, avec celle à réclamer' },
      { en: 'Three spare copies of a card fuse into a one-card booster guaranteed a tier above it, from the card’s own sheet. The fourth Cat becomes an Epic pull', fr: 'Trois doubles d’une carte fusionnent en un booster d’une carte garanti un palier au-dessus, depuis la fiche de la carte. Le quatrième Chat devient un tirage épique' },
      { en: 'The Popularity Duel: two of your cards, one shows its monthly readers, the other hides them, and the call is more or fewer. Every right call is worth more than the last, one wrong ends the round, fifteen in a row is a perfect. Three rounds a day', fr: 'Le Duel de popularité : deux de vos cartes, l’une montre ses lecteurs mensuels, l’autre les cache, et il faut dire plus ou moins. Chaque bonne réponse vaut plus que la précédente, une erreur termine la manche, quinze d’affilée c’est une manche parfaite. Trois manches par jour' },
      { en: 'Guess the Article: a picture out of your album, blurred past recognition, and four titles, the decoys from the same album. The blur lifts step by step and the points fall with it. Eight cards a round, three rounds a day', fr: 'Devinez l’article : une image de votre album, floutée jusqu’à l’indéchiffrable, et quatre titres, les leurres venant du même album. Le flou se lève palier par palier et les points baissent avec lui. Huit cartes par manche, trois manches par jour' },
      { en: 'Both games pay Buckarooz, count toward the day’s quests (five new ones), the achievements (seven new ones) and the leaderboard', fr: 'Les deux jeux paient des Buckarooz, comptent pour les quêtes du jour (cinq nouvelles), les succès (sept nouveaux) et le classement' },
      { en: 'The save is merged between devices instead of the last one winning: every part of it remembers when it last changed, and a phone that played while another was syncing keeps what it did, and gets what the other did', fr: 'La sauvegarde est fusionnée entre appareils au lieu que le dernier gagne : chaque partie se souvient de quand elle a changé, et un téléphone qui a joué pendant qu’un autre synchronisait garde ce qu’il a fait, et reçoit ce que l’autre a fait' },
      { en: 'The server keeps earlier versions of your save, and Settings lists them: a wrong merge, an erase by mistake or a lost phone can be walked back from there', fr: 'Le serveur garde les versions précédentes de votre sauvegarde, et les Réglages les listent : une mauvaise fusion, un effacement par erreur ou un téléphone perdu se rattrapent là' },
      { en: 'The app opens with no connection at all: the first visit stores it, and the cards already seen keep their pictures. It can be installed to the home screen from the site', fr: 'L’application s’ouvre sans aucune connexion : la première visite la garde, et les cartes déjà vues gardent leurs images. Elle s’installe sur l’écran d’accueil depuis le site' },
      { en: 'The first screen loads a third of the code it did: the market, the index, the quiz, the timeline and the games arrive when they are opened. The APK sets down fourteen megabytes of music and plays it from the site instead', fr: 'Le premier écran charge un tiers du code d’avant : le marché, l’index, le quiz, la chronologie et les jeux arrivent quand on les ouvre. L’APK laisse quatorze mégaoctets de musique et la joue depuis le site' },
      { en: 'A card’s article is checked once a week when the card is looked at: a renamed page brings the card up to date, a deleted one is said to be gone. The card stays', fr: 'L’article d’une carte est vérifié une fois par semaine quand on la regarde : une page renommée met la carte à jour, une page supprimée est signalée. La carte reste' },
      { en: 'Rarity shapes, a setting: a different mark before each tier’s name, for when colours alone do not tell them apart. Keyboard focus is visible everywhere', fr: 'Formes de rareté, un réglage : un signe différent devant le nom de chaque palier, pour quand les couleurs seules ne suffisent pas. Le focus clavier est visible partout' },
      { en: 'Opening the shop before the Auction House no longer leaves the house showing an error until the next launch', fr: 'Ouvrir la boutique avant la Maison des enchères ne laisse plus la maison afficher une erreur jusqu’au lancement suivant' },
      { en: 'Wikdle scores reach the leaderboard again: the server refused anything above 600 points since the puzzle started paying up to 1,400', fr: 'Les scores Wikdle atteignent de nouveau le classement : le serveur refusait tout ce qui dépassait 600 points depuis que le puzzle paie jusqu’à 1 400' }
    ]
  },
  {
    id: 'thedesk', icon: 'grid', accent: '#7dd3fc',
    title: { en: 'The Desk', fr: 'Le bureau' },
    points: [
      { en: 'A real desktop app: a rail, the work, and a panel that carries the day', fr: 'Une vraie application de bureau : un rail, le travail, et un panneau qui porte la journée' },
      { en: 'Settings, achievements and the shop in two columns; the album book holds eight', fr: 'Réglages, succès et boutique en deux colonnes ; l’album tient huit cartes' },
      { en: 'Album medals are paid the moment you reach them, and leave the album alone', fr: 'Les médailles d’album sont payées dès que vous les atteignez, et laissent l’album tranquille' },
      { en: 'Guess the Article opens where you can actually see something, with a clock you can read', fr: 'Devinez l’article commence là où l’on voit quelque chose, avec un chrono lisible' }
    ],
    changelog: [
      { en: 'On a screen 1280px and wider the app grows a third column: a panel down the right carrying your level, the daily gift, the day’s quests and the bell under every screen, and above them whatever the screen at hand keeps out of sight on a phone: the shop’s clocks and pull rates, the collection’s count and filters, the arcade’s rounds left, your own lots at the auction house. It folds away to a handle, and remembers', fr: 'Sur un écran de 1280px et plus, l’application gagne une troisième colonne : un panneau à droite qui porte votre niveau, le cadeau du jour, les quêtes et la cloche sous chaque écran, et au-dessus ce que l’écran en cours garde hors de vue sur un téléphone : les horloges et les taux de la boutique, le compte et les filtres de la collection, les manches restantes de l’arcade, vos propres lots aux enchères. Il se replie en une poignée, et s’en souvient' },
      { en: 'The middle column stops being an 1180px letterbox down the centre of a monitor and takes the room it is given, with insets on an 8px rhythm instead of a phone’s padding', fr: 'La colonne centrale cesse d’être une bande de 1180px au milieu du moniteur et prend la place qu’on lui donne, avec des marges au rythme de 8px plutôt que celles d’un téléphone' },
      { en: 'Lists of self-contained rows run in two columns (settings, achievements, the glossary), the shop’s stalls sit side by side, and the profile puts who you are beside everything you have', fr: 'Les listes de lignes autonomes passent en deux colonnes (réglages, succès, glossaire), les étals de la boutique se rangent côte à côte, et le profil met qui vous êtes à côté de tout ce que vous avez' },
      { en: 'The album book holds eight cards to a page on a desk instead of four, so a card in an album is the size of a card rather than a poster', fr: 'L’album tient huit cartes par page sur un bureau au lieu de quatre : une carte dans un album a la taille d’une carte, pas d’une affiche' },
      { en: 'Icon-only buttons say what they do on hover and on keyboard focus, rows answer a pointer the moment it arrives, and a row holding a focused control says so', fr: 'Les boutons sans texte disent ce qu’ils font au survol et au focus clavier, les lignes répondent au pointeur dès son arrivée, et une ligne contenant un contrôle au focus le montre' },
      { en: 'Album medals are paid the moment an album reaches one, with a note in the bell; the album itself goes back to being a book of cards', fr: 'Les médailles d’album sont payées dès qu’un album en atteint une, avec une note dans la cloche ; l’album redevient un livre de cartes' },
      { en: 'Guess the Article drops its first blur, the one nothing could be read through: three steps now, opening where a good eye has something to go on, with a clock that shows how long is left and a longer step to think in', fr: 'Devinez l’article abandonne son premier flou, celui qu’on ne pouvait pas percer : trois paliers désormais, commençant là où un bon œil a de quoi travailler, avec un chrono qui montre le temps restant et un palier plus long pour réfléchir' },
      { en: '"Blur adult content" is now "Hide sensitive content". It does exactly what it did', fr: '« Flouter le contenu adulte » devient « Masquer le contenu sensible ». Le comportement est identique' }
    ]
  },
  {
    id: 'cleandesk', icon: 'grid', accent: '#a5b4fc',
    title: { en: 'A clean desk', fr: 'Un bureau net' },
    points: [
      { en: 'Your own lots at the Auction House open again', fr: 'Vos propres lots à la Maison des enchères s’ouvrent de nouveau' },
      { en: 'The desk gets a real toolbar, and its heads and panel sit where they should', fr: 'Le bureau reçoit une vraie barre d’outils, et ses en-têtes et son panneau sont à leur place' },
      { en: 'Medal notes in the bell read as words, not code', fr: 'Les notes de médaille dans la cloche sont des mots, pas du code' }
    ],
    changelog: [
      { en: 'Tapping a lot you put up for auction opened nothing, so a card at auction could not be withdrawn or even looked at: the sheet asked for a rarity it had never been told. It opens', fr: 'Toucher un lot que vous aviez mis aux enchères n’ouvrait rien : impossible de retirer la carte ou même de la regarder. La fiche demandait une rareté qu’on ne lui avait jamais donnée. Elle s’ouvre' },
      { en: 'The note the bell keeps when an album medal is paid showed the markup of the coin instead of the amount. Every note in the bell is plain words now, old ones included', fr: 'La note gardée par la cloche quand une médaille d’album est payée montrait le code de la pièce au lieu du montant. Chaque note de la cloche est en mots simples désormais, les anciennes comprises' },
      { en: 'On a desk the header is a toolbar on the right (purse, gift, bell, level) instead of a phone’s bar stretched across a monitor; a screen’s caption sits under its title instead of drifting beside it; the Boosters screen’s help and odds buttons stand in the row instead of under the level ring; Free Packs puts the dial beside the track; frame and effect pickers run in columns', fr: 'Sur un bureau, l’en-tête est une barre d’outils à droite (bourse, cadeau, cloche, niveau) plutôt que la barre d’un téléphone étirée sur un moniteur ; la légende d’un écran se place sous son titre au lieu de dériver à côté ; l’aide et les taux de l’écran Boosters sont dans la ligne et non sous l’anneau de niveau ; Packs gratuits met le cadran à côté de la piste ; les choix de cadres et d’effets se rangent en colonnes' },
      { en: 'The panel’s handle sits in the panel’s own head, with its name, instead of floating above it', fr: 'La poignée du panneau est dans l’en-tête du panneau, avec son nom, au lieu de flotter au-dessus' },
      { en: 'A window dragged across the desk’s edge repaints the book, the shelf’s hint and the panel, not only the drawer', fr: 'Une fenêtre déplacée au-delà du seuil du bureau repeint l’album, l’indice de l’étagère et le panneau, pas seulement le tiroir' },
      { en: 'Sync waits until a booster is opened before pushing: a merge landing mid-reveal could hand another device’s cards back to it undone', fr: 'La synchronisation attend la fin de l’ouverture d’un booster avant d’envoyer : une fusion tombée en pleine révélation pouvait rendre à un autre appareil ses cartes défaites' }
    ]
  },
  {
    id: 'livewire', icon: 'bell', accent: '#34d399',
    title: { en: 'The live wire', fr: 'Le fil direct' },
    points: [
      { en: 'Messages, requests, gifts and trades arrive the moment they are sent', fr: 'Messages, demandes, cadeaux et échanges arrivent à l’instant où ils partent' },
      { en: 'Friends show online and offline as it happens, with when they were last here', fr: 'Les amis passent en ligne et hors ligne en direct, avec leur dernière venue' },
      { en: 'Wikdle in French, with hints from the encyclopaedia', fr: 'Wikdle en français, avec des indices tirés de l’encyclopédie' },
      { en: 'Every minigame counts on the leaderboard, and a score is never lost', fr: 'Chaque mini-jeu compte au classement, et un score n’est jamais perdu' }
    ],
    changelog: [
      { en: 'The app listens to the server instead of asking it once a minute: a message, a read receipt, a friend request, a parcel or a trade reaches you as it is written', fr: 'L’application écoute le serveur au lieu de l’interroger chaque minute : un message, un accusé de lecture, une demande d’ami, un colis ou un échange vous parvient dès qu’il est écrit' },
      { en: 'Who is online comes from a presence channel everyone joins on sign-in: a friend closing the app goes offline at once, and Appear offline keeps you off it', fr: 'Qui est en ligne vient d’un canal de présence que chacun rejoint à la connexion : un ami qui ferme l’application passe hors ligne aussitôt, et Apparaître hors ligne vous en garde à l’écart' },
      { en: 'The read mark in a chat appears when the other person opens the conversation, not when they start typing: the receipt was being sent before the wire had joined', fr: 'La marque de lecture d’une discussion apparaît quand l’autre ouvre la conversation, pas quand il se met à écrire : l’accusé partait avant que le fil n’ait rejoint' },
      { en: 'A friend who is offline says when they were last online: to the minute within the hour, to the hour within the day, then yesterday and days; under their name on their profile and beside Offline in the chat', fr: 'Un ami hors ligne indique sa dernière venue : à la minute dans l’heure, à l’heure dans la journée, puis hier et en jours ; sous son nom sur son profil et à côté de Hors ligne dans la discussion' },
      { en: 'Wikdle has a French board: French words, checked against a French dictionary, on an AZERTY keyboard, with the day’s article on the French Wikipedia', fr: 'Wikdle a un plateau français : des mots français, vérifiés dans un dictionnaire français, sur un clavier AZERTY, avec l’article du jour sur la Wikipédia francophone' },
      { en: 'Wikdle’s hints come from the word’s own article, what Wikipedia calls it and then how its article begins with the word blanked out; a letter in its place is the third, or the fallback', fr: 'Les indices de Wikdle viennent de l’article du mot, comment Wikipédia l’appelle puis le début de son article avec le mot masqué ; une lettre à sa place est le troisième, ou le recours' },
      { en: 'The slot machine and the quiz score on the leaderboard too; a score that could not be sent waits on the device and goes up on the next connection; the board repaints as scores land, yours or anyone’s', fr: 'La machine à sous et le quiz comptent aussi au classement ; un score qui n’a pu partir attend sur l’appareil et monte à la prochaine connexion ; le classement se repeint quand les scores tombent, les vôtres ou ceux des autres' },
      { en: 'Time played is written every minute while the app is open, so the profile, the friends’ view of it and the achievements never lag a session behind', fr: 'Le temps de jeu s’écrit chaque minute tant que l’application est ouverte : le profil, ce qu’en voient les amis et les succès n’ont plus une session de retard' }
    ]
  },
  {
    id: 'seasons', icon: 'calendar', accent: '#fb923c',
    title: { en: 'The seasons', fr: 'Les saisons' },
    points: [
      { en: 'The year is eleven seasons, each with its own booster, board and track', fr: 'L’année compte onze saisons, chacune avec son booster, son classement et sa piste' },
      { en: 'A theme and a badge per season, nowhere else to be had', fr: 'Un thème et un badge par saison, introuvables ailleurs' },
      { en: 'A season quest a day, and a fourth window on every board', fr: 'Une quête de saison par jour, et une quatrième fenêtre sur chaque classement' }
    ],
    changelog: [
      { en: 'Eleven seasons on the calendar, every day of the year in one of them: Frost, Hearts, Thaw, Fools and Eggs, Bloom, Solstice, Voyage, Harvest, Hallows, Ember, Yule. Each comes round every year with the same name and the same look', fr: 'Onze saisons au calendrier, chaque jour de l’année dans l’une d’elles : Givre, Cœurs, Dégel, Poissons et œufs, Floraison, Solstice, Grand voyage, Moisson, Sabbat, Braise, Noël. Chacune revient chaque année, même nom, même allure' },
      { en: 'Season points from everything you do, on a track of ten rungs: coins, the season’s boosters, and at the fourth and seventh rung the season’s badge and the season’s theme, kept for good and never offered again once the season has passed. A rung reached can be claimed after the season; a rung not reached cannot', fr: 'Des points de saison pour tout ce que vous faites, sur une piste de dix paliers : des pièces, les boosters de la saison, et aux quatrième et septième paliers le badge et le thème de la saison, gardés pour toujours et jamais réoffèrts une fois la saison passée. Un palier atteint se réclame après la saison ; un palier non atteint, jamais' },
      { en: 'Each season has a booster of its own, drawn from its corner of the encyclopaedia (Christmas markets and reindeer in Yule, haunted houses and witches in Hallows, hoaxes and painted eggs in April), on the shop floor and on the Season screen until the season turns, in a plain and a Rare size, priced by the same rule as every other booster', fr: 'Chaque saison a son booster, tiré de son coin de l’encyclopédie (marchés de Noël et rennes à Noël, maisons hantées et sorcières au Sabbat, canulars et œufs peints en avril), dans la boutique et sur l’écran Saison jusqu’au changement de saison, en taille simple et Rare, au prix de la règle de tous les autres boosters' },
      { en: 'Eleven themes, one per season, each with its own palette, shape and type and its own weather behind the app: snow in Frost and Yule, hearts rising in Hearts, petals in Thaw and Bloom, bubbles in April and on the Voyage, sparks off the water at the Solstice, leaves in Harvest, embers in Hallows and Ember', fr: 'Onze thèmes, un par saison, chacun avec sa palette, ses formes, sa typographie et sa propre météo derrière l’application : de la neige à Givre et Noël, des cœurs qui montent à Cœurs, des pétales à Dégel et Floraison, des bulles en avril et en Grand voyage, des étincelles sur l’eau au Solstice, des feuilles à Moisson, des braises au Sabbat et à Braise' },
      { en: 'A season quest a day, dealt from the season, read off the same ledger as the daily quests, paying coins and season points', fr: 'Une quête de saison par jour, tirée de la saison, lue sur le même registre que les quêtes du jour, payée en pièces et en points de saison' },
      { en: 'The leaderboard and the guild board have a fourth window, the season, filed under the season a score was made in and kept forever; the Season screen says where you and your guild stand in it', fr: 'Le classement et celui des guildes ont une quatrième fenêtre, la saison, classée sous la saison où le score a été fait et gardée pour toujours ; l’écran Saison dit où vous et votre guilde en êtes' },
      { en: 'The Season screen lays the year out: what is on, how long it has left, what came before with what you reached in it, and what comes next', fr: 'L’écran Saison étale l’année : ce qui est en cours, ce qui lui reste, ce qui est passé avec ce que vous y avez atteint, et ce qui vient' }
    ]
  },
  {
    id: 'clubs', icon: 'shield', accent: '#c4b5fd',
    title: { en: 'The clubhouse', fr: 'Le club' },
    points: [
      { en: 'Guilds: fifty players under one name, with a board of their own', fr: 'Des guildes : cinquante joueurs sous un même nom, avec leur propre classement' },
      { en: 'A showcase of three cards on your profile, with hearts from friends', fr: 'Une vitrine de trois cartes sur votre profil, avec les cœurs des amis' },
      { en: 'Wikipedia Today: yesterday’s most-read articles as a booster', fr: 'Wikipédia du jour : les articles les plus lus d’hier en booster' },
      { en: 'Notifications in the phone’s shade while the app is put away', fr: 'Des notifications dans le volet du téléphone quand l’application est rangée' },
      { en: 'Ask a friend into your guild, and close it when you founded it', fr: 'Invitez un ami dans votre guilde, et dissolvez-la si vous l’avez fondée' },
      { en: 'The guild hall: a room to talk in, a weekly goal, a table for spare cards, and a match against another guild', fr: 'La salle de guilde : un salon, un objectif hebdomadaire, une table pour les doublons et un match contre une autre guilde' }
    ],
    changelog: [
      { en: 'Guilds: found one with a name and a tag, or search and join; one guild at a time, fifty players at most. Every point you score lands on your guild’s daily, weekly and all-time windows the moment it lands on yours, through the same trigger, and the guild leaderboard moves live', fr: 'Guildes : fondez-en une avec un nom et un tag, ou cherchez et rejoignez ; une guilde à la fois, cinquante joueurs au plus. Chaque point marqué tombe sur les fenêtres du jour, de la semaine et de toujours de votre guilde à l’instant où il tombe sur les vôtres, par le même déclencheur, et le classement des guildes bouge en direct' },
      { en: 'The guild screen shows the guild’s standing in each window, its roster with everyone’s points, and the way out; leaving hands the guild to its oldest member', fr: 'L’écran de guilde montre sa place dans chaque fenêtre, ses membres avec leurs points, et la sortie ; partir confie la guilde à son plus ancien membre' },
      { en: 'Invite a friend into your guild by name: the invitation reaches them as it is sent, waits on their Guilds screen with who asked and into what, and is theirs to accept or turn down. Everything is checked when they answer, not when you ask, so a guild that filled up or closed in between cannot take them in', fr: 'Invitez un ami dans votre guilde : l’invitation lui parvient à l’instant où elle part, l’attend sur son écran Guildes avec qui l’a envoyée et dans quelle guilde, et c’est à lui d’accepter ou de refuser. Tout est vérifié au moment de sa réponse, pas de la demande : une guilde remplie ou dissoute entre-temps ne peut pas l’accueillir' },
      { en: 'The founder can close the guild outright, in two taps like leaving, instead of waiting for everyone to leave. The roster, the three windows and any standing invitation go with it, and members watching the screen are put back on the search rather than left holding a guild that is not there', fr: 'Le fondateur peut dissoudre la guilde d’un coup, en deux appuis comme pour la quitter, au lieu d’attendre que tout le monde parte. Les membres, les trois fenêtres et les invitations en cours partent avec elle, et les membres devant l’écran reviennent à la recherche au lieu de rester sur une guilde qui n’existe plus' },
      { en: 'The guild hall. A room where the whole roster talks, on the same live wire as friend chat. A goal for the week, picked for the guild and sized for its roster: open so many boosters between you, score so many points, find so many cards none of you had, solve so many Wikdles; the bar moves on everyone’s screen as members play, and when it lands every member claims nine hundred and a Rare booster. A table where a spare copy of a card is put down for anyone in the guild to take, three a day each. And a match: each week the guild is paired with the nearest guild on the weekly board, the two scores sit side by side and move live, and a win pays every member when the week turns', fr: 'La salle de guilde. Un salon où tout l’effectif discute, sur le même fil direct que la discussion entre amis. Un objectif pour la semaine, choisi pour la guilde et à la taille de son effectif : ouvrir tant de boosters à vous tous, marquer tant de points, trouver tant de cartes qu’aucun de vous n’avait, résoudre tant de Wikdles ; la barre avance sur l’écran de chacun à mesure que les membres jouent, et quand elle arrive au bout chaque membre réclame neuf cents et un booster Rare. Une table où un exemplaire en trop se pose pour que n’importe qui dans la guilde le prenne, trois par jour chacun. Et un match : chaque semaine la guilde est appariée à la guilde la plus proche au classement hebdomadaire, les deux scores se font face et bougent en direct, et une victoire paie chaque membre au changement de semaine' },
      { en: 'The guild card keeps up on its own: a member joining or leaving changes the count and the roster on everyone’s screen without a reload', fr: 'La fiche de guilde se tient à jour seule : un membre qui arrive ou qui part change le nombre et la liste sur l’écran de chacun, sans rechargement' },
      { en: 'The showcase: pin up to three cards on your profile. Friends see them on your page and leave a heart on each; a second tap takes it back', fr: 'La vitrine : épinglez jusqu’à trois cartes sur votre profil. Les amis les voient sur votre page et laissent un cœur sur chacune ; un second appui le reprend' },
      { en: 'Wikipedia Today on the shop floor: five cards dealt from what the whole world read yesterday, one pack a day', fr: 'Wikipédia du jour dans la boutique : cinq cartes tirées de ce que le monde entier a lu hier, un booster par jour' },
      { en: 'A Wikipedia Today card is graded by its article’s place on the day rather than by how read it is: everything on that list is read by everyone, which is what put it there, so the ranking is what tells them apart. The day’s number one is Prismatic, the next four Exotic, and the list runs down to Rare at two hundred. The price follows from that ladder under the same rule as every other booster, so the pack cannot be opened and sold at a profit', fr: 'Une carte Wikipédia du jour est classée selon la place de son article ce jour-là, et non selon sa fréquentation : tout ce qui figure sur cette liste est lu par tout le monde, ce qui l’y a mis, donc c’est le classement qui les distingue. Le numéro un du jour est Prismatique, les quatre suivants Exotiques, et la liste descend jusqu’à Rare au deux centième. Le prix découle de cette échelle selon la règle de tous les autres boosters : le booster ne peut pas être ouvert puis revendu avec profit' },
      { en: 'A page the encyclopaedia has no picture for is passed over while there is another to take its place, so a Wikipedia Today hand is five real cards', fr: 'Une page dont l’encyclopédie n’a pas d’image est écartée tant qu’une autre peut la remplacer : une main Wikipédia du jour est donc cinq vraies cartes' },
      { en: 'On Android, a message, a request, a gift or a trade that arrives while the app is put away shows in the phone’s shade, and opening the conversation takes it down; in a browser, the same as a notification once allowed from Settings', fr: 'Sur Android, un message, une demande, un cadeau ou un échange qui arrive quand l’application est rangée s’affiche dans le volet du téléphone, et ouvrir la conversation l’efface ; dans un navigateur, la même chose en notification une fois autorisée dans les Réglages' }
    ]
  },
  {
    id: 'atelier', icon: 'ink', accent: '#818cf8',
    title: { en: 'The Atelier', fr: 'L’Atelier' },
    points: [
      { en: 'Ink: a second currency, earned by playing, for how things look', fr: 'L’Encre : une seconde monnaie, gagnée en jouant, pour l’apparence' },
      { en: 'The Atelier: themes, ten new level frames and forty card effects, for Ink', fr: 'L’Atelier : des thèmes, dix nouveaux cadres de niveau et quarante effets de carte, contre de l’Encre' },
      { en: 'Five effects for every rarity, none alike; the old four are gone', fr: 'Cinq effets par rareté, tous différents ; les quatre anciens ont disparu' },
      { en: 'Press Buckarooz into Ink at the counter', fr: 'Pressez des Buckarooz en Encre au comptoir' }
    ],
    changelog: [
      { en: 'Ink is the Atelier’s currency and nothing else takes it. It is paid by every level (more at the round ones), every achievement, every daily quest by its tier, every rung of the season track and the day’s season quest, the seventh gift of a week, a guild goal met and a guild match won. It shows in the app bar beside the coins, in the wallet sheet, and travels with the save', fr: 'L’Encre est la monnaie de l’Atelier et rien d’autre ne la prend. Elle est payée par chaque niveau (davantage aux niveaux ronds), chaque succès, chaque quête du jour selon son palier, chaque palier de la piste de saison et la quête de saison du jour, le septième cadeau de la semaine, un objectif de guilde atteint et un match de guilde gagné. Elle s’affiche dans la barre du haut à côté des pièces, dans la fiche du porte-monnaie, et voyage avec la sauvegarde' },
      { en: 'The Atelier, under the shop tab and from the drawer: every theme that is not a season’s or a code’s, ten level frames no level hands out, and five card effects for each of the eight rarities. A tile shows its price in Ink, then offers to wear what it sold. What is bought goes to the profile and turns up in Customization, which now shows only what is owned', fr: 'L’Atelier, sous l’onglet boutique et depuis le tiroir : chaque thème qui n’est ni de saison ni de code, dix cadres de niveau qu’aucun niveau ne donne, et cinq effets de carte pour chacune des huit raretés. Une tuile affiche son prix en Encre, puis propose de porter ce qu’elle a vendu. Ce qui est acheté va sur le profil et apparaît dans Personnalisation, qui ne montre plus que ce qui est possédé' },
      { en: 'Forty card effects, each built its own way: pencil hatching, a crease, a postmark, dust and halftone for Commons; moss, vines, dew, verdigris and a fern for Uncommons; ripples, frost, a tide, sapphire facets and a constellation for Rares; a nebula, runes, lightning, velvet and orbitals for Epics; gilt, a sunburst, a laurel, embers and molten gold for Legendaries; a blood moon, dragonscale, an inferno, a sigil and thorns for Mythics; a hologram, a glitch, plasma, an oil slick and scanlines for Exotics; a spectrum, shattered glass, an aurora curtain, a starfield and a crown for Prismatics. A chosen effect replaces the tier’s own dressing rather than stacking on it, and holds still in low power', fr: 'Quarante effets de carte, chacun construit à sa manière : hachures au crayon, pli, cachet, poussière et trame pour les Communes ; mousse, lianes, rosée, vert-de-gris et fougère pour les Peu communes ; ondulations, givre, marée, facettes de saphir et constellation pour les Rares ; nébuleuse, runes, éclair, velours et orbitales pour les Épiques ; dorure, rayons, laurier, braises et or en fusion pour les Légendaires ; lune de sang, écailles, brasier, sceau et épines pour les Mythiques ; hologramme, glitch, plasma, irisé et balayage pour les Exotiques ; spectre, éclats, rideau, champ d’étoiles et couronne pour les Prismatiques. Un effet choisi remplace l’habillage propre au palier au lieu de s’y empiler, et se fige en mode économie' },
      { en: 'Foil Sheen, Prism Split, Halo and Archive are gone, along with the rule that unlocked them by cards held; a save that wore one wears Classic again', fr: 'Reflet, Prisme, Halo et Archive ont disparu, avec la règle qui les débloquait par cartes possédées ; une sauvegarde qui en portait un reporte Classique' },
      { en: 'Ten new level frames, worn from level 1 once bought and climbing the same fifty tiers: Living Ivy, Clockwork, Tidewater, Stormcell, Honeycomb, Inkwell, Paper Fold, Paper Lanterns, Stained Glass and Comet Trail, each with a movement of its own', fr: 'Dix nouveaux cadres de niveau, portés dès le niveau 1 une fois achetés et montant les mêmes cinquante paliers : Lierre vivant, Horlogerie, Marée, Cellule orageuse, Rayon de miel, Encrier, Pli de papier, Lanternes de papier, Vitrail et Traînée de comète, chacun avec son propre mouvement' },
      { en: 'The counter presses Buckarooz into Ink, one, ten or fifty at a time, at a rate that keeps a theme a real purchase; the wallet sheet explains Ink and leads there', fr: 'Le comptoir presse des Buckarooz en Encre, une, dix ou cinquante à la fois, à un taux qui garde à un thème son vrai prix ; la fiche du porte-monnaie explique l’Encre et y mène' }
    ]
  },
  {
    id: 'shelf', icon: 'trophy', accent: '#fbbf24',
    title: { en: 'The trophy shelf', fr: 'L’étagère à trophées' },
    points: [
      { en: 'Over two hundred new achievements, for over three hundred and fifty', fr: 'Plus de deux cents nouveaux succès, pour plus de trois cent cinquante' },
      { en: 'Fifty-eight new badges, and no two badges alike', fr: 'Cinquante-huit nouveaux badges, et jamais deux badges pareils' },
      { en: 'A friend’s badge shelf on their page', fr: 'L’étagère à badges d’un ami sur sa page' }
    ],
    changelog: [
      { en: 'A hundred new achievement families, one per real thing the game now has: every rarity pulled, every kind of booster opened, subjects explored, cards read, the wishlist, each minigame played and won, quests claimed and hard ones, whole days of quests, the season track and its points and badges, the guild joined, founded, its goals, matches, table and hall, friends messaged, hearts left, gifts received, bids and lots and record sales, the shop and what was spent in it, crates, bundles, the press, Ink earned and spent and what it bought, themes and frames and effects worn, codes, days played, full gift weeks, the leaderboard, and a backup kept. Every one is judged against a ledger of things actually done, kept on the save', fr: 'Cent nouvelles familles de succès, une par chose réelle que le jeu possède désormais : chaque rareté tirée, chaque sorte de booster ouvert, les sujets explorés, les cartes lues, la liste de souhaits, chaque mini-jeu joué et gagné, les quêtes réclamées et les difficiles, des journées entières de quêtes, la piste de saison avec ses points et ses badges, la guilde rejointe, fondée, ses objectifs, matchs, table et salle, les amis à qui l’on écrit, les cœurs laissés, les cadeaux reçus, les enchères, les lots et les ventes record, la boutique et ce qu’on y dépense, les caisses, les lots, la presse, l’Encre gagnée et dépensée et ce qu’elle a acheté, les thèmes, cadres et effets portés, les codes, les jours joués, les semaines de cadeaux complètes, le classement, et une sauvegarde gardée. Chacun est jugé sur un registre de choses vraiment faites, gardé dans la sauvegarde' },
      { en: 'Achievements pay Ink as well as coins or a booster', fr: 'Les succès paient de l’Encre en plus des pièces ou d’un booster' },
      { en: 'Fifty-eight new badges hang off the hard ends of the new families, each with its own line art. Every badge, old and new, now has a foil of its own and one of six shapes (hexagon, shield, circle, diamond, octagon, square), so no two chips on any shelf look alike', fr: 'Cinquante-huit nouveaux badges accrochés au bout des nouvelles familles, chacun avec son propre dessin. Chaque badge, ancien ou nouveau, a désormais sa propre dorure et l’une de six formes (hexagone, écu, cercle, losange, octogone, carré) : deux jetons ne se ressemblent jamais' },
      { en: 'The badges you have earned, with their ranks, are published with your public stats, and a friend’s page shows their whole shelf under their showcase; a tap on a chip says what each rank took', fr: 'Les badges gagnés, avec leur rang, sont publiés avec vos statistiques publiques, et la page d’un ami montre toute son étagère sous sa vitrine ; un appui sur un jeton dit ce que chaque rang a demandé' }
    ]
  },
  {
    id: 'faces', icon: 'friends', accent: '#38bdf8',
    title: { en: 'Faces everywhere', fr: 'Des visages partout' },
    points: [
      { en: 'Pictures and level frames wherever a name is: the guild, the board, the profiles', fr: 'Photos et cadres de niveau partout où il y a un nom : la guilde, le classement, les profils' },
      { en: 'A what’s-new sheet on launch, with the way to the patch notes', fr: 'Une fiche Quoi de neuf au lancement, avec le chemin des notes de version' },
      { en: 'Wishlist matching: which friends hold what you want, and a trade already asking for it', fr: 'Liste de souhaits : quels amis possèdent ce que vous voulez, et un échange déjà rédigé' }
    ],
    changelog: [
      { en: 'Every place a player is named now shows their picture inside their level frame: the guild roster, the hall (beside each line), the table (beside each donor), an invitation (the inviter), every row and the podium of the leaderboard, and the hero of your own profile and of a friend’s page. People who are not friends are read from the profiles table in one batch per screen and kept for the session', fr: 'Partout où un joueur est nommé, sa photo apparaît dans son cadre de niveau : la liste de la guilde, la salle (à côté de chaque ligne), la table (à côté de chaque donateur), une invitation (l’invitant), chaque ligne et le podium du classement, et l’en-tête de votre profil et de la page d’un ami. Les joueurs qui ne sont pas des amis sont lus dans la table des profils en une fois par écran et gardés pour la session' },
      { en: 'On launch, a device last here before the latest release gets a short sheet of what changed since (the last three releases at most, newest first), with a button to the full patch notes on the Updates screen. A brand-new player sees the welcome instead and is marked up to date', fr: 'Au lancement, un appareil venu pour la dernière fois avant la dernière version reçoit une courte fiche de ce qui a changé depuis (les trois dernières versions au plus, la plus récente d’abord), avec un bouton vers les notes de version complètes sur l’écran Mises à jour. Un nouveau joueur voit l’accueil à la place et est marqué à jour' },
      { en: 'The wishlist view of the Card Index has a button that looks through your friends’ collections for the cards on your list, friends with spare copies first, and opens a trade sheet with those cards already asked for', fr: 'La vue liste de souhaits de l’Index a un bouton qui parcourt les collections de vos amis à la recherche des cartes de votre liste, les amis avec des doubles d’abord, et ouvre une fiche d’échange avec ces cartes déjà demandées' }
    ]
  },
  {
    id: 'versus', icon: 'dice', accent: '#a78bfa',
    title: { en: 'Play with friends', fr: 'Jouer entre amis' },
    points: [
      { en: 'Card Clash: five cards against a friend’s five, round by round', fr: 'Duel de cartes : cinq cartes contre les cinq d’un ami, manche par manche' },
      { en: 'Speed Sort: the same eight cards, in order of readers, against the clock', fr: 'Tri chrono : les mêmes huit cartes, par lecteurs, contre la montre' },
      { en: 'Challenges from the Games screen or a friend’s page, settled the moment both halves are in', fr: 'Des défis depuis l’écran Jeux ou la page d’un ami, réglés dès que les deux moitiés sont là' }
    ],
    changelog: [
      { en: 'Two games that cannot be played alone. A challenge is set for a friend with the challenger’s half already played; the friend plays theirs when they like, and the server settles it the moment their half lands, so neither side sees the other’s hand first and neither marks their own. Open challenges and the last fortnight of settled ones sit on one table, which follows the server live', fr: 'Deux jeux qui ne se jouent pas seul. Un défi est lancé à un ami avec la moitié du lanceur déjà jouée ; l’ami joue la sienne quand il veut, et le serveur règle la partie à l’instant où elle arrive : aucun des deux ne voit la main de l’autre avant, et aucun ne note la sienne. Les défis ouverts et la quinzaine de parties réglées tiennent sur une table qui suit le serveur en direct' },
      { en: 'Card Clash: each side picks five cards, readers showing. The hands are laid best to worst by monthly readers and compared pair by pair; the more-read card takes the round, a tied round is nobody’s, and the hand with more rounds wins', fr: 'Duel de cartes : chacun choisit cinq cartes, lecteurs visibles. Les mains sont rangées de la meilleure à la pire par lecteurs mensuels et comparées deux à deux ; la carte la plus lue prend la manche, une manche à égalité n’est à personne, et la main qui a le plus de manches gagne' },
      { en: 'Speed Sort: the challenger deals eight of their cards with different readerships, shuffled, and both players tap them most read first; the clock starts on the first tap and a tap can be undone. Right positions count first, the faster hand wins a tie', fr: 'Tri chrono : le lanceur distribue huit de ses cartes aux lectorats différents, mélangées, et les deux joueurs les touchent de la plus lue à la moins lue ; le chrono part au premier appui et un appui s’annule. Les bonnes positions comptent d’abord, la main la plus rapide gagne à égalité' },
      { en: 'A win pays 600 Buckarooz, 15 Ink and 40 season points; a draw 300, 8 and 20; a loss 150, 3 and 10, each claimed once from the table or the reckoning. The bell rings when a challenge arrives and when one you set is settled; the Games link in the drawer shows a dot while something waits on you', fr: 'Une victoire rapporte 600 Buckarooz, 15 Encre et 40 points de saison ; une égalité 300, 8 et 20 ; une défaite 150, 3 et 10, réclamés une fois depuis la table ou le compte-rendu. La cloche sonne quand un défi arrive et quand un des vôtres est réglé ; le lien Jeux du tiroir porte un point tant que quelque chose vous attend' },
      { en: 'Seven achievements and two badges for the friend games; the Games screen has a fifth tile and a friend’s page a Challenge button', fr: 'Sept succès et deux badges pour les jeux entre amis ; l’écran Jeux a une cinquième tuile et la page d’un ami un bouton Défier' }
    ]
  },
  {
    id: 'steadier', icon: 'spark', accent: '#22d3ee',
    title: { en: 'A steadier hand', fr: 'Une main plus sûre' },
    points: [
      { en: 'Every card effect is now one of the designs off the boards, shown on a real card before you buy it', fr: 'Chaque effet de carte est désormais un des designs des planches, montré sur une vraie carte avant l’achat' },
      { en: 'Every free pack you have banked, opened as one', fr: 'Tous vos packs gratuits en réserve, ouverts d’un coup' },
      { en: 'A way past the cards straight to what a booster held', fr: 'Un chemin direct vers ce que contenait un booster' },
      { en: 'Screens that open faster and scroll smoother', fr: 'Des écrans qui s’ouvrent plus vite et défilent plus doucement' }
    ],
    changelog: [
      { en: 'The treatments sold in the Atelier are the ones off the design boards. Two boards were built and shown before any of this: three executions for each of the eight tiers, and five more for Prismatic. One per tier was picked and became that tier’s own drawing, which is what Classic means. The twenty-one that were passed over were never used again, and they are what the shop sells now, kept exactly as they were drawn, on the tier they were drawn for. That is why the counts are not round: two for most tiers, seven for Prismatic. Nothing in the shop is invented any more', fr: 'Les traitements vendus à l’Atelier sont ceux des planches de design. Deux planches avaient été construites et présentées avant tout cela : trois exécutions pour chacun des huit paliers, et cinq de plus pour Prismatique. Une par palier a été choisie et est devenue le dessin propre à ce palier, ce que veut dire Classique. Les vingt et une écartées n’avaient jamais resservi : ce sont elles que la boutique vend désormais, gardées telles qu’elles avaient été dessinées, sur le palier pour lequel elles l’avaient été. D’où des comptes qui ne tombent pas rond : deux pour la plupart des paliers, sept pour Prismatique. Plus rien dans la boutique n’est inventé' },
      { en: 'A treatment is no longer something laid over a card. Each one restyles the whole face the way the tier drawings do: the plate, the frame, the ring, the artwork’s mount, the title’s colour and the tag. The card’s own layers are wiped to nothing first, so a tier’s dressing never shows through the treatment standing in for it, and the drawings the boards generated (the marble, the parchment, the ivory, the gold circuit lattice, the mandala, the corners, the crystal facets, the caustics) are baked in, so what shipped is what was looked at', fr: 'Un traitement n’est plus quelque chose de posé sur une carte. Chacun refait toute la face comme le font les dessins de palier : la plaque, le cadre, l’anneau, le support de l’image, la couleur du titre et l’étiquette. Les calques propres à la carte sont d’abord remis à zéro, pour que l’habillage d’un palier ne transparaisse jamais sous le traitement qui le remplace, et les dessins produits par les planches (le marbre, le parchemin, l’ivoire, le réseau de circuits dorés, le mandala, les coins, les facettes de cristal, les caustiques) sont intégrés : ce qui est livré est ce qui a été regardé' },
      { en: 'Two bugs went with the rewrite. Six of the eight tiers draw a travelling layer of their own and nothing turned it off, so a dressed Prismatic card wore its rainbow and its treatment at once, which is why five of its five looked alike. And the reset was written at a higher weight than the effects below it, so any effect that moved its own layer had that move overruled', fr: 'Deux bogues sont partis avec la réécriture. Six des huit paliers dessinent un calque mobile qui leur est propre et rien ne l’éteignait : une carte Prismatique habillée portait son arc-en-ciel ET son traitement, d’où cinq effets identiques sur cinq. Et la remise à zéro était écrite avec un poids supérieur aux effets qui la suivaient : tout effet déplaçant son propre calque voyait ce déplacement annulé' },
      { en: 'The Atelier and Customization both paint a real card at card size wearing each treatment, on a drawn stand-in article so nothing needs the network. A sample animates only while it is being looked at', fr: 'L’Atelier et la Personnalisation affichent chacun une vraie carte, à taille réelle, portant le traitement, sur un article de doublure dessiné : rien ne dépend du réseau. Un exemple ne s’anime que pendant qu’on le regarde' },
      { en: 'With more than one free pack banked, the timed screen offers to open them all as a single booster: every slot spent at once, their cards dealt as one pack. The track is credited per slot spent, so nothing about levelling changes for taking the quick way', fr: 'Avec plusieurs packs gratuits en réserve, l’écran propose de tous les ouvrir en un seul booster : toutes les réserves dépensées d’un coup, leurs cartes distribuées en un pack. La piste est créditée par réserve dépensée : rien ne change pour la montée en palier' },
      { en: 'Every opening has a button top right that goes straight to the summary. The cards are written to the collection before the first one turns, so a skip skips the ceremony and nothing else. While there: a draw that came back short used to leave the extra face-down cards in the deck forever, waiting on a card that does not exist; they are taken out now', fr: 'Chaque ouverture porte un bouton en haut à droite qui mène droit au récapitulatif. Les cartes sont écrites dans la collection avant que la première ne se retourne : passer ne saute que la cérémonie. Au passage : un tirage revenu incomplet laissait les cartes en trop face cachée dans le paquet pour toujours, en attente d’une carte qui n’existe pas ; elles sont retirées' },
      { en: 'A layout sweep, screen by screen. The shop’s bundle tiles were landing on the headings of the two sections below them: an off-screen tile that is skipped for speed needs a stand-in height, and theirs had none. The frame list, the effect list and their notes on the Atelier and Customization ran flush to the screen edges while every other section on those screens kept its margin; they now sit on the same line', fr: 'Une passe de mise en page, écran par écran. Les tuiles de lots de la boutique retombaient sur les titres des deux sections suivantes : une tuile hors écran, sautée pour la vitesse, a besoin d’une hauteur de remplaçante, et la leur n’en avait pas. La liste des cadres, celle des effets et leurs notes, à l’Atelier et en Personnalisation, touchaient les bords de l’écran alors que toutes les autres sections gardaient leur marge ; elles s’alignent désormais' },
      { en: 'Speed. A list of three hundred and sixty five achievements used to be built, animated and inserted in one go before the screen appeared: it is now built a screenful at a time, with the rows a reader can see going in on the first frame. The badge wall and the icon set are drawn once per shape and cloned after. The drawer is rebuilt only when its links change rather than on every tap. The themes, frames and badges are skipped while off screen', fr: 'La vitesse. Une liste de trois cent soixante-cinq succès était construite, animée et insérée d’un bloc avant que l’écran n’apparaisse : elle se construit désormais un écran à la fois, les lignes visibles entrant dès la première image. Le mur de badges et le jeu d’icônes sont dessinés une fois par forme puis clonés. Le tiroir n’est reconstruit que lorsque ses liens changent, plus à chaque appui. Les thèmes, cadres et badges sont sautés hors écran' },
      { en: 'The tabs that were missing what the others carry have it now. Achievements, Badges and Customization each get the "?" nineteen screens already had, with a sheet of their own; the Profile names itself in a title block like every other tab rather than opening straight onto the level card; and a screen’s lead-in paragraph is one treatment instead of three, so a tab that keeps its lead-in outside the title block still reads like the tab beside it', fr: 'Les onglets auxquels manquait ce que portent les autres l’ont désormais. Succès, Badges et Personnalisation reçoivent chacun le « ? » que dix-neuf écrans avaient déjà, avec leur propre fiche ; le Profil se nomme dans un bloc de titre comme tous les autres onglets au lieu de s’ouvrir directement sur la carte de niveau ; et le paragraphe d’introduction d’un écran suit un seul traitement au lieu de trois, pour qu’un onglet qui garde son introduction hors du bloc de titre se lise comme celui d’à côté' },
      { en: 'The French strings live in their own file now, so an English device never downloads or parses them: seventy kilobytes off every English boot, and a French device is written in French from its first frame rather than corrected a moment later', fr: 'Les textes français vivent désormais dans leur propre fichier : un appareil en anglais ne les télécharge ni ne les analyse jamais, soit soixante-dix kilo-octets de moins à chaque démarrage anglais, et un appareil en français est écrit en français dès sa première image plutôt que corrigé un instant plus tard' }
    ]
  },
  {
    id: 'stillmoving', icon: 'spark', accent: '#f472b6',
    title: { en: 'The ones that move', fr: 'Ceux qui bougent' },
    points: [
      { en: 'Every treatment in the shop is alive, none of them sit still', fr: 'Chaque traitement de la boutique est vivant, aucun ne reste figé' },
      { en: 'The treatments drawn before Prismatic existed are gone', fr: 'Les traitements dessinés avant l’existence de Prismatique ont disparu' }
    ],
    changelog: [
      { en: 'Three treatments were left over from before Prismatic was named, drawn against a tier that no longer exists under that name. They are out of the shop, out of the catalogue and out of the stylesheet, along with the drawn grounds only they used. Eighteen remain, every one of them from a board', fr: 'Trois traitements restaient d’avant que Prismatique ne porte ce nom, dessinés pour un palier qui n’existe plus sous ce nom. Ils quittent la boutique, le catalogue et la feuille de style, avec les fonds dessinés qu’eux seuls utilisaient. Il en reste dix-huit, tous issus d’une planche' },
      { en: 'Half the treatments stood still in the Atelier and in Customization. The rule that silences a tier’s own animation was written heavier than the treatments underneath it, so it silenced them too: it is now written at a weight a treatment can beat, and the samples carry their own slow turn of the light so a design that only lives in the tilt still moves while it is being looked at. Eighteen of eighteen animate, and every animation on a sample belongs to that sample', fr: 'La moitié des traitements restaient immobiles à l’Atelier et en Personnalisation. La règle qui éteint l’animation propre d’un palier était écrite plus lourdement que les traitements en dessous : elle les éteignait aussi. Elle est désormais écrite à un poids qu’un traitement peut battre, et les exemples portent leur propre rotation lente de la lumière, pour qu’un design qui ne vit que dans l’inclinaison bouge quand même pendant qu’on le regarde. Dix-huit sur dix-huit s’animent, et chaque animation d’un exemple lui appartient' },
      { en: 'On a narrow phone the article summary on a card could be a line taller than the room left for it and print straight through the price. The text block clips its own overflow now', fr: 'Sur un téléphone étroit, le résumé d’article d’une carte pouvait dépasser d’une ligne la place qui lui restait et s’imprimer à travers le prix. Le bloc de texte rogne désormais son propre débordement' }
    ]
  },
  {
    id: 'thirtynine', icon: 'spark', accent: '#c084fc',
    title: { en: 'Thirty-nine off the board', fr: 'Trente-neuf de la planche' },
    points: [
      { en: 'Four or five card treatments for every rarity, all of them new', fr: 'Quatre ou cinq traitements de carte par rareté, tous nouveaux' },
      { en: 'No treatment paints on the article picture any more', fr: 'Aucun traitement ne peint plus sur l’image de l’article' }
    ],
    changelog: [
      { en: 'A third design board was built and shown before any of this shipped: ten treatments for each of the eight tiers, eighty in all, every one of them drawn as a real card at real size on the layers the app actually uses, so what was looked at is what a card wears. Thirty-nine were chosen. They are the whole shop now, carried across rule for rule with nothing changed but the selector and the names of their clocks. Common got newsprint, graph paper, a carbon copy, a photocopy and an index card; Prismatic an aurora veil, a diffraction grating, refraction, spectral rain and a supernova. Five a tier, four for Rare, because that is what was picked', fr: 'Une troisième planche de design a été construite et présentée avant que rien de tout cela ne parte : dix traitements pour chacun des huit paliers, quatre-vingts en tout, chacun dessiné comme une vraie carte à taille réelle sur les calques que l’application utilise vraiment, pour que ce qui a été regardé soit ce que porte une carte. Trente-neuf ont été retenus. Ils constituent toute la boutique désormais, repris règle par règle, sans rien changer d’autre que le sélecteur et le nom de leurs horloges. Commune reçoit le papier journal, le millimétré, le carbone, la photocopie et la fiche bristol ; Prismatique un voile d’aurore, un réseau de diffraction, la réfraction, la pluie spectrale et une supernova. Cinq par palier, quatre pour Rare, parce que c’est ce qui a été choisi' },
      { en: 'A treatment never paints on the article picture. The photograph is raised above every effect layer, so a design restyles the plate, the frame, the ring and the writing around it and cannot land on the image: no grid over a photograph, no hazard stripe across a face. A treatment that wants to act on the picture does it from inside the mount, by filtering the image rather than covering it', fr: 'Un traitement ne peint jamais sur l’image de l’article. La photographie est élevée au-dessus de tous les calques d’effet : un design refait la plaque, le cadre, l’anneau et les écritures autour, sans pouvoir atteindre l’image. Pas de grille sur une photo, pas de bande de danger en travers d’un visage. Un traitement qui veut agir sur l’image le fait depuis l’intérieur du support, en filtrant plutôt qu’en recouvrant' },
      { en: 'Every one of the thirty-nine was measured rather than glanced at: all thirty-nine animate, none of them borrows a tier’s motion, none paints over the picture, and every title holds three to one against what is painted behind it with the summary at better than two to one. Five treatments had a travelling band that washed out their own summary halfway through its cycle; they were given a floor to cross', fr: 'Chacun des trente-neuf a été mesuré plutôt que regardé de loin : les trente-neuf s’animent, aucun n’emprunte le mouvement d’un palier, aucun ne recouvre l’image, et chaque titre tient trois contre un face à ce qui est peint derrière lui, le résumé au-delà de deux contre un. Cinq traitements avaient une bande mobile qui effaçait leur propre résumé au milieu de son cycle ; on leur a donné un sol à traverser' },
      { en: 'The sparks a treatment can ask for are built on every tier that has one wanting them, not just on Legendary and Mythic, so the pollen, the bubbles, the orchid dust and the supernova debris have something to rise', fr: 'Les étincelles qu’un traitement peut demander sont construites sur tous les paliers qui en ont un qui les veut, pas seulement Légendaire et Mythique : le pollen, les bulles, la poussière d’orchidée et les débris de supernova ont de quoi monter' }
    ]
  },
  {
    id: 'aword', icon: 'spark', accent: '#38bdf8',
    title: { en: 'A word from the creator', fr: 'Un mot du créateur' },
    points: [
      { en: 'The game can now tell you something the creator wants everyone to read', fr: 'Le jeu peut désormais vous transmettre un message que le créateur adresse à tous' },
      { en: 'And an account that has been stopped is told why, rather than left guessing', fr: 'Et un compte mis en pause sait pourquoi, au lieu d’avoir à le deviner' }
    ],
    changelog: [
      { en: 'An announcement written by the creator now reaches the game: a short sheet on launch, in your language, shown once and then gone. It reaches a player with no account too, because the game is playable without one and the person who never signed up is exactly the one who would not hear about an outage any other way. An announcement aimed at a single player is the exception: a signed-out reader cannot be told apart from anyone else, so it waits for them to sign in', fr: 'Une annonce écrite par le créateur atteint désormais le jeu : une courte fiche au lancement, dans votre langue, montrée une fois puis oubliée. Elle atteint aussi un joueur sans compte, car le jeu se joue sans compte et celui qui ne s’est jamais inscrit est justement celui qui n’entendrait parler d’une panne par aucun autre moyen. Une annonce destinée à un seul joueur fait exception : un lecteur déconnecté ne peut être distingué d’un autre, elle attend donc sa connexion' },
      { en: 'An account can be muted or put on hold, and either way it is told which and why, in plain words. Neither locks anyone out of their own cards: a collection that took months is not a thing to take away over something said in a chat, so a stopped account can still open the game, look at everything it owns and keep opening boosters. What it cannot do is act on anybody else. Muted means chat and guild messages; on hold means chat, trades, listings and guilds', fr: 'Un compte peut être réduit au silence ou mis en pause, et dans les deux cas il apprend lequel et pourquoi, en clair. Ni l’un ni l’autre ne prive qui que ce soit de ses cartes : une collection bâtie en des mois ne se retire pas pour un mot dans un chat, un compte arrêté peut donc toujours ouvrir le jeu, regarder tout ce qu’il possède et continuer d’ouvrir des boosters. Ce qu’il ne peut pas faire, c’est agir sur les autres. Silence vise le chat et les guildes ; pause vise le chat, les échanges, les ventes et les guildes' },
      { en: 'Both are enforced by the database rather than by the app, and with triggers rather than with policies. That is not a detail: this schema drops and recreates its own policies every time it is run, so a rule written anywhere else would have vanished the next time the schema was updated and stopped working with nobody noticing. A trigger is not touched by that', fr: 'Les deux sont appliqués par la base de données plutôt que par l’application, et par des déclencheurs plutôt que par des règles. Ce n’est pas un détail : ce schéma supprime et recrée ses propres règles à chaque exécution, une règle écrite ailleurs aurait donc disparu à la mise à jour suivante et cessé d’agir sans que personne ne le remarque. Un déclencheur n’est pas concerné' },
      { en: 'None of it is allowed to matter. An announcement that fails to load, a project whose schema has not been updated, a device with no connection: every one of those ends with the game carrying on exactly as it did before. A message from the creator is not worth a broken launch', fr: 'Rien de tout cela n’a le droit de compter. Une annonce qui ne se charge pas, un projet dont le schéma n’a pas été mis à jour, un appareil sans connexion : chacun de ces cas se termine par un jeu qui continue exactement comme avant. Un message du créateur ne vaut pas un lancement cassé' }
    ]
  }
];
