export type Lang = "en" | "fr";

interface Translations {
  // Header
  subtitle: string;
  btnRefresh: string;
  btnClosePool: string;
  btnPoolProjection: string;
  noMetaMask: string;
  btnConnectMetaMask: string;
  titleRefresh: string;
  titlePool: string;
  titleHelp: string;

  // Loading / error
  loadingDefault: string;
  loadFetchingLeaderboard: string;
  loadFetchingUserDetails: (n: number) => string;
  loadFetchingLockData: string;
  loadFetchingLockDataBlock: (block: number) => string;
  errorPrefix: string;

  // Stats
  statsTitle: string;
  btnHide: string;
  btnShow: string;
  titleHideStats: string;
  titleShowStats: string;
  statUsers: string;
  statTotalRep: string;
  statEmission: string;
  statPool: string;
  statGubiPrice: string;
  statGubiSupply: string;
  statBacking: string;
  statBlock: string;
  statSnapshot: string;
  gubiPerMonth: string;

  // Simulator
  simTitle: string;
  lblAddress: string;
  lblOrPick: string;
  placeholderAddress: string;
  placeholderSelect: string;
  addrNotFound: string;

  // Sliders
  sliderGNET: string;
  sliderDays: string;
  sliderSoul: string;
  btnMAX: string;

  // Result table
  colMetric: string;
  colCurrent: string;
  colSimulated: string;
  colDelta: string;
  rowSoulScore: string;
  rowLockedGNET: string;
  rowLockDays: string;
  rowVeGNET: string;
  rowReputation: string;
  rowRank: string;
  rowMonthlyGubi: string;

  // Leaderboard
  lbTitle: string;
  lbSimNotice: string;
  colHash: string;
  colAddress: string;
  colSoulScore: string;
  colLockedGNET: string;
  colVeGNET: string;
  colReputation: string;
  colMonthlyGubi: string;
  colLockEnd: string;
  lockExpired: string;
  btnShowAll: (n: number) => string;
  btnCollapse: string;
  yourSimRank: (rank: number) => string;

  // Pool modal
  poolTitle: string;
  poolDesc: string;
  poolBase: string;
  btnClose: string;
  colPeriod: string;
  colGNETInflow: string;
  colCumulativeGNET: string;
  colProjectedBacking: string;

  // Help modal
  helpTitle: string;
  helpVeGNETTitle: string;
  helpVeGNETFormula: string;
  helpVeGNETBody: string;
  helpRepTitle: string;
  helpRepFormula: string;
  helpRepBody: string;
  helpGubiTitle: string;
  helpGubiFormula: string;
  helpGubiBody: string;
  helpSlidersTitle: string;
  helpSliderGNETDesc: string;
  helpSliderDaysDesc: string;
  helpSliderSoulDesc: string;
  helpSourcesTitle: string;
  helpSourcesBody: string;
}

export const translations: Record<Lang, Translations> = {
  en: {
    subtitle: "gUBI rank and reward simulator",
    btnRefresh: "↺ Refresh",
    btnClosePool: "Close Pool",
    btnPoolProjection: "Pool Projection ↗",
    noMetaMask: "No MetaMask",
    btnConnectMetaMask: "Connect MetaMask",
    titleRefresh: "Re-fetch all data from chain and API",
    titlePool: "Open projected pool backing in a modal",
    titleHelp: "How does this work?",

    loadingDefault: "Loading...",
    loadFetchingLeaderboard: "Fetching leaderboard...",
    loadFetchingUserDetails: (n) => `Loaded ${n} users. Fetching user details...`,
    loadFetchingLockData: "Fetching on-chain lock data...",
    loadFetchingLockDataBlock: (block) => `Fetching on-chain lock data at block ${block}...`,
    errorPrefix: "Error:",

    statsTitle: "Stats",
    btnHide: "Hide",
    btnShow: "Show",
    titleHideStats: "Collapse stats",
    titleShowStats: "Expand stats",
    statUsers: "users",
    statTotalRep: "total rep",
    statEmission: "emission",
    statPool: "pool",
    statGubiPrice: "gUBI price",
    statGubiSupply: "gUBI supply",
    statBacking: "backing/gUBI",
    statBlock: "block",
    statSnapshot: "snapshot",
    gubiPerMonth: "gUBI/mo",

    simTitle: "Simulator",
    lblAddress: "address",
    lblOrPick: "or pick",
    placeholderAddress: "0x...",
    placeholderSelect: "— select —",
    addrNotFound: "Address not found in leaderboard.",

    sliderGNET: "+GNET lock",
    sliderDays: "+Lock days",
    sliderSoul: "+SoulScore",
    btnMAX: "MAX",

    colMetric: "Metric",
    colCurrent: "Current",
    colSimulated: "Simulated",
    colDelta: "Delta",
    rowSoulScore: "SoulScore",
    rowLockedGNET: "Locked GNET",
    rowLockDays: "Lock Days",
    rowVeGNET: "veGNET",
    rowReputation: "Reputation",
    rowRank: "Rank",
    rowMonthlyGubi: "Monthly gUBI",

    lbTitle: "Leaderboard",
    lbSimNotice: "⚡ simulated ranking for",
    colHash: "#",
    colAddress: "Address",
    colSoulScore: "SoulScore",
    colLockedGNET: "Locked GNET",
    colVeGNET: "veGNET",
    colReputation: "Reputation",
    colMonthlyGubi: "Monthly gUBI",
    colLockEnd: "Lock End",
    lockExpired: "expired",
    btnShowAll: (n) => `↓ Show all ${n} users`,
    btnCollapse: "↑ Collapse",
    yourSimRank: (rank) => `your simulated rank: #${rank}`,

    poolTitle: "Pool Backing Projection",
    poolDesc: "Projected backing as scheduled GNET unlocks enter the pool over time.",
    poolBase: "Base",
    btnClose: "Close",
    colPeriod: "Period",
    colGNETInflow: "GNET Inflow",
    colCumulativeGNET: "Cumulative GNET",
    colProjectedBacking: "Projected Backing/gUBI",

    helpTitle: "How it works",
    helpVeGNETTitle: "veGNET — voting-escrowed GNET",
    helpVeGNETFormula: "veGNET = lockedGNET × (daysLeft / 730)",
    helpVeGNETBody: "Lock up to 730 days. The longer the lock, the more veGNET you get. veGNET decays linearly every day as your lock approaches expiry.",
    helpRepTitle: "Reputation",
    helpRepFormula: "reputation = SoulScore × log₁₀(veGNET)",
    helpRepBody: "SoulScore comes from your on-chain ZK-KYC and credential proofs — it cannot be bought. veGNET brings the economic weight. The logarithm prevents pure capital from dominating.",
    helpGubiTitle: "Monthly gUBI reward",
    helpGubiFormula: "reward = (yourReputation / totalReputation) × 5,000,000 gUBI",
    helpGubiBody: "5,000,000 gUBI is emitted every month, split pro-rata across all participants by reputation. Your share grows as your reputation grows — or shrinks as others grow.",
    helpSlidersTitle: "Simulator sliders",
    helpSliderGNETDesc: "— adds GNET to your locked position, increasing veGNET and thus reputation.",
    helpSliderDaysDesc: "— extends your lock duration (capped at 730 days total). Uses MAX to fill to the cap.",
    helpSliderSoulDesc: "— hypothetical future credential gains. Real SoulScore can only increase on-chain.",
    helpSourcesTitle: "Data sources",
    helpSourcesBody: "Leaderboard and user stats: Galactica Admin API. Lock data (lockedGNET, lockEnd, veGNET) and gUBI supply: on-chain at block snapshot. All data refreshes on every page load or manual ↺ Refresh.",
  },

  fr: {
    subtitle: "simulateur de rang et récompense gUBI",
    btnRefresh: "↺ Actualiser",
    btnClosePool: "Fermer pool",
    btnPoolProjection: "Projection pool ↗",
    noMetaMask: "Sans MetaMask",
    btnConnectMetaMask: "Connecter MetaMask",
    titleRefresh: "Récupérer toutes les données depuis la chaîne et l'API",
    titlePool: "Ouvrir la projection de couverture du pool",
    titleHelp: "Comment ça marche ?",

    loadingDefault: "Chargement...",
    loadFetchingLeaderboard: "Récupération du classement...",
    loadFetchingUserDetails: (n) => `${n} utilisateurs chargés. Récupération des détails...`,
    loadFetchingLockData: "Récupération des données de verrouillage...",
    loadFetchingLockDataBlock: (block) => `Récupération des données de verrouillage au bloc ${block}...`,
    errorPrefix: "Erreur :",

    statsTitle: "Statistiques",
    btnHide: "Masquer",
    btnShow: "Afficher",
    titleHideStats: "Réduire les statistiques",
    titleShowStats: "Agrandir les statistiques",
    statUsers: "utilisateurs",
    statTotalRep: "rép. totale",
    statEmission: "émission",
    statPool: "pool",
    statGubiPrice: "prix gUBI",
    statGubiSupply: "offre gUBI",
    statBacking: "couverture/gUBI",
    statBlock: "bloc",
    statSnapshot: "instantané",
    gubiPerMonth: "gUBI/mois",

    simTitle: "Simulateur",
    lblAddress: "adresse",
    lblOrPick: "ou choisir",
    placeholderAddress: "0x...",
    placeholderSelect: "— choisir —",
    addrNotFound: "Adresse introuvable dans le classement.",

    sliderGNET: "+GNET verrouillé",
    sliderDays: "+Jours de verrou",
    sliderSoul: "+SoulScore",
    btnMAX: "MAX",

    colMetric: "Métrique",
    colCurrent: "Actuel",
    colSimulated: "Simulé",
    colDelta: "Delta",
    rowSoulScore: "SoulScore",
    rowLockedGNET: "GNET verrouillé",
    rowLockDays: "Jours de verrou",
    rowVeGNET: "veGNET",
    rowReputation: "Réputation",
    rowRank: "Rang",
    rowMonthlyGubi: "gUBI mensuel",

    lbTitle: "Classement",
    lbSimNotice: "⚡ classement simulé pour",
    colHash: "#",
    colAddress: "Adresse",
    colSoulScore: "SoulScore",
    colLockedGNET: "GNET verrouillé",
    colVeGNET: "veGNET",
    colReputation: "Réputation",
    colMonthlyGubi: "gUBI mensuel",
    colLockEnd: "Fin de verrou",
    lockExpired: "expiré",
    btnShowAll: (n) => `↓ Voir les ${n} utilisateurs`,
    btnCollapse: "↑ Réduire",
    yourSimRank: (rank) => `votre rang simulé : #${rank}`,

    poolTitle: "Projection de couverture du pool",
    poolDesc: "Couverture projetée au fur et à mesure que les déblocages de GNET entrent dans le pool.",
    poolBase: "Base",
    btnClose: "Fermer",
    colPeriod: "Période",
    colGNETInflow: "Apport GNET",
    colCumulativeGNET: "GNET cumulé",
    colProjectedBacking: "Couverture projetée/gUBI",

    helpTitle: "Comment ça marche",
    helpVeGNETTitle: "veGNET — GNET en séquestre de vote",
    helpVeGNETFormula: "veGNET = lockedGNET × (jours restants / 730)",
    helpVeGNETBody: "Verrouillez jusqu'à 730 jours. Plus le verrou est long, plus vous obtenez de veGNET. Le veGNET décroît linéairement chaque jour à l'approche de l'expiration.",
    helpRepTitle: "Réputation",
    helpRepFormula: "réputation = SoulScore × log₁₀(veGNET)",
    helpRepBody: "Le SoulScore provient de vos preuves ZK-KYC et d'identifiants on-chain — il ne peut pas s'acheter. Le veGNET apporte le poids économique. Le logarithme empêche le capital pur de dominer.",
    helpGubiTitle: "Récompense mensuelle gUBI",
    helpGubiFormula: "récompense = (votreRéputation / réputation totale) × 5 000 000 gUBI",
    helpGubiBody: "5 000 000 gUBI sont émis chaque mois, répartis au prorata de la réputation de chaque participant. Votre part augmente avec votre réputation — ou diminue si les autres progressent.",
    helpSlidersTitle: "Curseurs du simulateur",
    helpSliderGNETDesc: "— ajoute du GNET à votre position verrouillée, augmentant le veGNET et donc la réputation.",
    helpSliderDaysDesc: "— prolonge la durée de votre verrou (plafonné à 730 jours au total). Utilisez MAX pour atteindre le plafond.",
    helpSliderSoulDesc: "— gains hypothétiques futurs d'identifiants. Le vrai SoulScore ne peut qu'augmenter on-chain.",
    helpSourcesTitle: "Sources de données",
    helpSourcesBody: "Classement et statistiques : API Galactica Admin. Données de verrou (lockedGNET, lockEnd, veGNET) et offre gUBI : on-chain à l'instantané de bloc. Toutes les données sont actualisées à chaque chargement ou en appuyant sur ↺ Actualiser.",
  },
};
