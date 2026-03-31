export type Lang = "en" | "fr";

interface Translations {
  // Promo banner
  promoFlambeurPrefix: string;
  promoFlambeurSuffix: string;

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
  btnHelp: string;

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
  statDailyDistribution: string;
  statPool: string;
  statGubiPrice: string;
  statGubiSupply: string;
  statBacking: string;
  statBlock: string;
  statSnapshot: string;
  gubiPerMonth: string;
  statTotalBurned: string;
  statBurnEvents: string;
  statBurners: string;

  // Simulator
  simTitle: string;
  addrNotFound: string;
  btnNewWallet: string;
  newWalletLabel: string;

  // Sliders
  sliderGNET: string;
  sliderDays: string;
  sliderSoul: string;
  btnMAX: string;

  // Result table
  colMetric: string;
  colCurrent: string;
  colResult: string;
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
  lbRankNotice: string;
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
  btnShowCols: string;
  btnHideCols: string;
  btnReset: string;
  simEmptyHint: string;
  yourRank: (rank: number) => string;
  yourSimRank: (rank: number) => string;

  // Holders modal
  btnHolders: string;
  holdersTitle: string;
  holdersDesc: string;
  holdersColRank: string;
  holdersColAddress: string;
  holdersColBalance: string;

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

  // Lab
  labTitle: string;
  labDisclaimer: string;
  labBtnOpen: string;
  labBtnBack: string;
  labStartGNET: string;
  labStartDays: string;
  labSoulScore: string;
  labAddGNET: string;
  labAddGNETSlider: string;
  labFrequency: string;
  labFreqWeekly: string;
  labFreqBiweekly: string;
  labFreqMonthly: string;
  labFreqNone: string;
  labLockNewDays: string;
  labExtendOnAdd: string;
  labRelockExpired: string;
  labRelockDays: string;
  labHorizon: string;
  labPoolGrowth: string;
  labSpread: string;
  labScenarioPess: string;
  labScenarioNeutral: string;
  labScenarioOpt: string;
  labChartYAxis: string;
  labTableMonth: string;
  labTablePess: string;
  labTableNeutral: string;
  labTableOpt: string;
  labTableCumPess: string;
  labTableCumNeutral: string;
  labTableCumOpt: string;
  labSectionStart: string;
  labSectionPool: string;
  labFillWallet: string;
  labStartFresh: string;
  labNoData: string;
  labMonths: (n: number) => string;
  labInspectorTitle: string;
  labInspectMonth: string;
  labCurrentRep: string;
  labProjectedRep: string;
  labOtherPoolRep: string;
  labTotalPoolRep: string;
  labRewardShare: string;
  labProjectedReward: string;
  // Lab tooltips
  tipStartGNET: string;
  tipStartDays: string;
  tipSoulScore: string;
  tipAddGNETSlider: string;
  tipFreqNone: string;
  tipFreqWeekly: string;
  tipFreqBiweekly: string;
  tipFreqMonthly: string;
  tipExtendOnAdd: string;
  tipLockNewDays: string;
  tipRelockExpired: string;
  tipRelockDays: string;
  tipPoolGrowth: string;
  tipSpread: string;
  tipFillWallet: string;
  tipStartFresh: string;
}

export const translations: Record<Lang, Translations> = {
  en: {
    promoFlambeurPrefix: "◈ Have gUBI to burn? Use",
    promoFlambeurSuffix: "instead — get WGNET for your full gUBI balance, including ARCHAI, with a 25% bonus.",

    subtitle: "gUBI rank and reward simulator",
    btnRefresh: "↺ Refresh",
    btnClosePool: "Close Pool",
    btnPoolProjection: "Pool Projection ↗",
    noMetaMask: "No MetaMask",
    btnConnectMetaMask: "Connect MetaMask",
    titleRefresh: "Re-fetch all data from chain and API",
    titlePool: "Open projected pool backing in a modal",
    titleHelp: "How does this work?",
    btnHelp: "? Help",

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
    statDailyDistribution: "daily dist.",
    statPool: "pool",
    statGubiPrice: "gUBI price",
    statGubiSupply: "gUBI supply",
    statBacking: "backing/gUBI",
    statBlock: "block",
    statSnapshot: "snapshot",
    gubiPerMonth: "gUBI/mo",
    statTotalBurned: "total burned",
    statBurnEvents: "burn txs",
    statBurners: "burner wallets",

    simTitle: "Simulator",
    addrNotFound: "Address not found in leaderboard.",
    btnNewWallet: "New wallet",
    newWalletLabel: "new wallet",

    sliderGNET: "+GNET lock",
    sliderDays: "+Lock days",
    sliderSoul: "+SoulScore",
    btnMAX: "MAX",

    colMetric: "Metric",
    colCurrent: "Current",
    colResult: "Result",
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
    lbRankNotice: "ranking for",
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
    btnShowCols: "► More columns",
    btnHideCols: "◄ Fewer columns",
    btnReset: "Reset",
    simEmptyHint: "← click a row in the leaderboard to simulate",
    yourRank: (rank) => `your rank: #${rank}`,
    yourSimRank: (rank) => `your simulated rank: #${rank}`,

    btnHolders: "gUBI Holders ↗",
    holdersTitle: "gUBI Holders",
    holdersDesc: "All addresses holding gUBI, excluding protocol addresses.",
    holdersColRank: "#",
    holdersColAddress: "Address",
    holdersColBalance: "Balance",

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
    helpSourcesBody: "Leaderboard and user stats: Galactica Admin API. Lock data (lockedGNET, lockEnd, veGNET) and gUBI supply: on-chain at block snapshot. Burn stats (total burned, burn txs, burner wallets) and gUBI holders: fetched on-demand from Transfer event logs. All data refreshes on every page load or manual ↺ Refresh.",

    labTitle: "⚗ Lab — gUBI Projection",
    labDisclaimer: "⚗ Experimental — purely mathematical projection. Not a forecast. Pool competition is unpredictable.",
    labBtnOpen: "⚗ Lab",
    labBtnBack: "← Back",
    labStartGNET: "Locked GNET",
    labStartDays: "Days left",
    labSoulScore: "SoulScore",
    labAddGNET: "Contributions",
    labAddGNETSlider: "GNET per period",
    labFrequency: "Frequency",
    labFreqWeekly: "Weekly",
    labFreqBiweekly: "Every 2 weeks",
    labFreqMonthly: "Monthly (4 weeks)",
    labFreqNone: "No contributions",
    labLockNewDays: "Lock new GNET for (days)",
    labExtendOnAdd: "Extend lock when adding",
    labRelockExpired: "Re-lock when expired",
    labRelockDays: "Re-lock duration (days)",
    labHorizon: "Horizon",
    labPoolGrowth: "Pool growth %/month (neutral)",
    labSpread: "Scenario spread %",
    labScenarioPess: "Pessimistic",
    labScenarioNeutral: "Neutral",
    labScenarioOpt: "Optimistic",
    labChartYAxis: "gUBI / month",
    labTableMonth: "Month",
    labTablePess: "Pess. (gUBI/mo)",
    labTableNeutral: "Neutral (gUBI/mo)",
    labTableOpt: "Opt. (gUBI/mo)",
    labTableCumPess: "Cum. Pess.",
    labTableCumNeutral: "Cum. Neutral",
    labTableCumOpt: "Cum. Opt.",
    labSectionStart: "Starting position",
    labSectionPool: "Pool assumptions",
    labFillWallet: "Fill from wallet",
    labStartFresh: "Start fresh",
    labNoData: "Adjust parameters to see projection.",
    labMonths: (n) => `${n} month${n === 1 ? "" : "s"}`,
    labInspectorTitle: "Sanity check",
    labInspectMonth: "Inspect month",
    labCurrentRep: "Current rep",
    labProjectedRep: "Projected rep",
    labOtherPoolRep: "Other pool rep",
    labTotalPoolRep: "Total pool rep",
    labRewardShare: "Reward share",
    labProjectedReward: "Projected gUBI/mo",
    tipStartGNET: "Your currently locked GNET. veGNET = lockedGNET × (daysLeft / 730)",
    tipStartDays: "Days remaining on your lock. Max 730 (2 years). Snapped to weekly boundaries in simulation.",
    tipSoulScore: "On-chain ZK credential score. reputation = SoulScore × log₁₀(veGNET)",
    tipAddGNETSlider: "Amount of GNET added to your locked position each period (mirrors increase_amount on-chain)",
    tipFreqNone: "No periodic contributions — simulate current position decaying over time",
    tipFreqWeekly: "Add GNET every week (minimum VotingEscrow interval)",
    tipFreqBiweekly: "Add GNET every 2 weeks",
    tipFreqMonthly: "Add GNET every 4 weeks (~monthly)",
    tipExtendOnAdd: "Each time you add GNET, also extend lock duration (increase_unlock_time). If already at 730 days, extension has no effect.",
    tipLockNewDays: "Target lock duration when extending. Capped at 730 days from the current simulation week.",
    tipRelockExpired: "Automatically re-lock when daysLeft reaches 0. Not available when extend-on-add already prevents expiry.",
    tipRelockDays: "Duration to re-lock for when expired. Max 730 days.",
    tipPoolGrowth: "Extra pool reputation growth per month ON TOP of the natural veGNET decay from expiring locks. 0% = pure decay floor (nobody new enters or re-locks). Positive = new entrants and re-lockers offset the decay. The pessimistic scenario adds the spread (more competition), the optimistic scenario subtracts it (less).",
    tipSpread: "Symmetric uncertainty range. Pessimistic = pool grows faster (neutral + spread). Optimistic = pool grows slower (neutral − spread).",
    tipFillWallet: "Pre-fill starting position from your connected wallet or selected leaderboard address",
    tipStartFresh: "Reset starting position to zero (new wallet with no existing lock)",
  },

  fr: {
    promoFlambeurPrefix: "◈ Vous prévoyez de brûler des gUBI ? Utilisez",
    promoFlambeurSuffix: "— obtenez des WGNET avec 25 % de bonus pour tous vos gUBI, ARCHAI inclus.",

    subtitle: "simulateur de rang et récompense gUBI",
    btnRefresh: "↺ Actualiser",
    btnClosePool: "Fermer pool",
    btnPoolProjection: "Projection pool ↗",
    noMetaMask: "Sans MetaMask",
    btnConnectMetaMask: "Connecter MetaMask",
    titleRefresh: "Récupérer toutes les données depuis la chaîne et l'API",
    titlePool: "Ouvrir la projection de couverture du pool",
    titleHelp: "Comment ça marche ?",
    btnHelp: "? Aide",

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
    statDailyDistribution: "dist. quotidienne",
    statPool: "pool",
    statGubiPrice: "prix gUBI",
    statGubiSupply: "offre gUBI",
    statBacking: "couverture/gUBI",
    statBlock: "bloc",
    statSnapshot: "instantané",
    gubiPerMonth: "gUBI/mois",
    statTotalBurned: "total brûlés",
    statBurnEvents: "txs de burn",
    statBurners: "wallets brûleurs",

    simTitle: "Simulateur",
    addrNotFound: "Adresse introuvable dans le classement.",
    btnNewWallet: "Nouvelle adresse",
    newWalletLabel: "nouvelle adresse",

    sliderGNET: "+GNET verrouillé",
    sliderDays: "+Jours de verrou",
    sliderSoul: "+SoulScore",
    btnMAX: "MAX",

    colMetric: "Métrique",
    colCurrent: "Actuel",
    colResult: "Résultat",
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
    lbRankNotice: "classement pour",
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
    btnShowCols: "► Plus de colonnes",
    btnHideCols: "◄ Moins de colonnes",
    btnReset: "Réinitialiser",
    simEmptyHint: "← cliquez sur une ligne du classement pour simuler",
    yourRank: (rank) => `votre rang : #${rank}`,
    yourSimRank: (rank) => `votre rang simulé : #${rank}`,

    btnHolders: "gUBI Holders ↗",
    holdersTitle: "Détenteurs gUBI",
    holdersDesc: "Toutes les adresses détenant des gUBI, hors adresses protocole.",
    holdersColRank: "#",
    holdersColAddress: "Adresse",
    holdersColBalance: "Solde",

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
    helpSourcesBody: "Classement et statistiques : API Galactica Admin. Données de verrou (lockedGNET, lockEnd, veGNET) et offre gUBI : on-chain à l'instantané de bloc. Stats de burn (total brûlés, txs, wallets brûleurs) et détenteurs gUBI : chargés à la demande depuis les logs d'événements Transfer. Toutes les données sont actualisées à chaque chargement ou en appuyant sur ↺ Actualiser.",

    labTitle: "⚗ Lab — Projection gUBI",
    labDisclaimer: "⚗ Expérimental — projection purement mathématique. Pas une prévision. La concurrence du pool est imprévisible.",
    labBtnOpen: "⚗ Lab",
    labBtnBack: "← Retour",
    labStartGNET: "GNET verrouillé",
    labStartDays: "Jours restants",
    labSoulScore: "SoulScore",
    labAddGNET: "Contributions",
    labAddGNETSlider: "GNET par période",
    labFrequency: "Fréquence",
    labFreqWeekly: "Hebdomadaire",
    labFreqBiweekly: "Toutes les 2 semaines",
    labFreqMonthly: "Mensuel (4 semaines)",
    labFreqNone: "Aucun apport",
    labLockNewDays: "Verrouiller le nouveau GNET pour (jours)",
    labExtendOnAdd: "Prolonger le verrou à chaque ajout",
    labRelockExpired: "Re-verrouiller à l'expiration",
    labRelockDays: "Durée de re-verrouillage (jours)",
    labHorizon: "Horizon",
    labPoolGrowth: "Croissance pool %/mois (neutre)",
    labSpread: "Écart de scénario %",
    labScenarioPess: "Pessimiste",
    labScenarioNeutral: "Neutre",
    labScenarioOpt: "Optimiste",
    labChartYAxis: "gUBI / mois",
    labTableMonth: "Mois",
    labTablePess: "Pess. (gUBI/mois)",
    labTableNeutral: "Neutre (gUBI/mois)",
    labTableOpt: "Opt. (gUBI/mois)",
    labTableCumPess: "Cum. Pess.",
    labTableCumNeutral: "Cum. Neutre",
    labTableCumOpt: "Cum. Opt.",
    labSectionStart: "Position de départ",
    labSectionPool: "Hypothèses pool",
    labFillWallet: "Depuis le portefeuille",
    labStartFresh: "Réinitialiser",
    labNoData: "Ajustez les paramètres pour voir la projection.",
    labMonths: (n) => `${n} mois`,
    labInspectorTitle: "Contrôle de cohérence",
    labInspectMonth: "Mois inspecté",
    labCurrentRep: "Réputation actuelle",
    labProjectedRep: "Réputation projetée",
    labOtherPoolRep: "Réputation du reste du pool",
    labTotalPoolRep: "Réputation totale du pool",
    labRewardShare: "Part de récompense",
    labProjectedReward: "gUBI/mois projeté",
    tipStartGNET: "Votre GNET actuellement verrouillé. veGNET = lockedGNET × (joursRestants / 730)",
    tipStartDays: "Jours restants sur votre verrou. Max 730 (2 ans). Arrondi aux semaines dans la simulation.",
    tipSoulScore: "Score d’identifiants ZK on-chain. réputation = SoulScore × log₁₀(veGNET)",
    tipAddGNETSlider: "Montant de GNET ajouté à votre position verrouillée chaque période (increase_amount on-chain)",
    tipFreqNone: "Aucun apport périodique — simuler la décroissance de la position actuelle",
    tipFreqWeekly: "Ajouter du GNET chaque semaine (intervalle minimum du VotingEscrow)",
    tipFreqBiweekly: "Ajouter du GNET toutes les 2 semaines",
    tipFreqMonthly: "Ajouter du GNET toutes les 4 semaines (~mensuel)",
    tipExtendOnAdd: "À chaque ajout de GNET, prolonger aussi la durée du verrou (increase_unlock_time). Sans effet si déjà à 730 jours.",
    tipLockNewDays: "Durée cible lors de la prolongation. Plafonné à 730 jours depuis la semaine de simulation courante.",
    tipRelockExpired: "Re-verrouiller automatiquement quand joursRestants atteint 0. Non disponible si extend-on-add empêche déjà l’expiration.",
    tipRelockDays: "Durée du re-verrouillage automatique. Max 730 jours.",
    tipPoolGrowth: "Croissance supplémentaire de la réputation du pool par mois, AU-DELÀ de la décroissance naturelle du veGNET. 0% = décroissance pure (aucun nouvel entrant ni re-verrou). Positif = nouveaux participants et re-verrouilleurs. Le scénario pessimiste ajoute le spread (plus de concurrence), l'optimiste le soustrait.",
    tipSpread: "Écart symétrique d’incertitude. Pessimiste = croissance plus rapide (neutre + écart). Optimiste = plus lente (neutre − écart).",
    tipFillWallet: "Pré-remplir la position de départ depuis votre portefeuille connecté ou l’adresse sélectionnée",
    tipStartFresh: "Réinitialiser la position de départ à zéro (nouveau portefeuille sans verrou existant)",

  },
};
