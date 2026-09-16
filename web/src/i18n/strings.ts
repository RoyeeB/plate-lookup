/**
 * All user-facing strings live here so another language can be added later.
 * Default (and only, for now) language is Hebrew.
 */

export const he = {
  appName: 'איתור לוחית',

  // Home
  home: {
    title: 'איתור פרטי רכב',
    subtitle: 'הקלד מספר לוחית או סרוק אותה כדי לראות את פרטי הרכב מהמאגר הממשלתי',
    platePlaceholder: '00-000-00',
    searchButton: 'חפש רכב',
    scanButton: 'סרוק לוחית',
    recentTitle: 'חיפושים אחרונים',
    recentEmptyTitle: 'עדיין אין חיפושים',
    recentEmpty: 'רכבים שתחפשו יופיעו כאן, כדי שתוכלו לחזור אליהם בלחיצה.',
    clearRecent: 'נקה היסטוריה',
    invalidPlate: 'מספר לוחית לא תקין — יש להזין 5 עד 8 ספרות',
    plateInputLabel: 'מספר לוחית רישוי',
    searchAgainCar: 'חפש שוב {car}, לוחית {plate}',
    searchAgainPlate: 'חפש שוב לוחית {plate}',
  },

  // Scan
  scan: {
    title: 'סריקת לוחית',
    hint: 'מקמו את הלוחית בתוך המסגרת',
    capture: 'צלם',
    processing: 'מזהה מספר…',
    retake: 'צלם שוב',
    noPlateDetected: 'לא זוהה מספר — נסה שוב או הקלד ידנית',
    manualEntry: 'הקלדה ידנית',
    confirmTitle: 'המספר שזוהה',
    confirmSubtitle: 'בדקו ותקנו במידת הצורך לפני החיפוש',
    confirmSearch: 'חפש רכב',
    confirmCancel: 'ביטול',
    // Web-only states (the native build has no equivalent).
    starting: 'מפעיל מצלמה…',
    engineLoading: 'טוען מנוע זיהוי…',
    unsupportedTitle: 'הדפדפן לא תומך במצלמה',
    unsupportedBody:
      'הדפדפן הזה לא מאפשר גישה למצלמה מתוך אתר. אפשר להקליד את מספר הלוחית ידנית.',
    insecureTitle: 'נדרש חיבור מאובטח',
    insecureBody:
      'דפדפנים מאפשרים גישה למצלמה רק באתרים מאובטחים (HTTPS) או ב-localhost. פתחו את האתר ב-HTTPS או הקלידו את המספר ידנית.',
    torchOn: 'הדלק פנס',
    torchOff: 'כבה פנס',
  },

  // Permissions
  permission: {
    title: 'נדרשת הרשאת מצלמה',
    body: 'כדי לסרוק לוחית רישוי צריך לאשר גישה למצלמה. התמונה מעובדת במכשיר בלבד ואינה נשלחת לאף שרת.',
    grant: 'אפשר גישה למצלמה',
    openSettings: 'פתח הגדרות',
    back: 'חזרה',
    // Web-only: a browser permission can only be re-granted from site settings.
    deniedTitle: 'הגישה למצלמה נחסמה',
    deniedBody:
      'חסמתם את הגישה למצלמה עבור האתר. אפשר לאפשר אותה מחדש בהגדרות האתר בדפדפן (סמל המנעול שליד הכתובת), או להקליד את המספר ידנית.',
  },

  // Vehicle / result
  vehicle: {
    officialTitle: 'פרטי רכב רשמיים',
    estimatedTitle: 'נתונים משוערים',
    estimatedDisclaimer:
      'הערכים הבאים אינם מופיעים במרשם הרכב והם הערכה בלבד על סמך יצרן, דגם, שנה, נפח מנוע וסוג דלק.',
    source: 'מקור: מרשם הרכב, משרד התחבורה (data.gov.il)',
    copyVin: 'הועתק מספר השלדה',
    copyHint: 'לחצו להעתקה',
    searchAgain: 'חיפוש חדש',
    unnamed: 'רכב',
    madeIn: 'תוצרת {country}',
    imageLoading: 'טוען תמונת דגם…',
  },

  // At-a-glance facts under the hero
  facts: {
    title: 'במבט מהיר',
    year: 'שנת ייצור',
    hand: 'בעלויות',
    mileage: 'קילומטראז\'',
    fuel: 'דלק',
    unknown: 'לא ידוע',
    unavailable: '—',
    loading: 'טוען…',
    perYear: '~{km} ק"מ בשנה',
    bandLow: 'נמוך מהממוצע',
    bandAverage: 'ממוצע',
    bandHigh: 'גבוה מהממוצע',
    mileageNote: 'לפי הקילומטראז\' בטסט האחרון, ביחס לממוצע של כ-15,000 ק"מ בשנה לרכב פרטי',
  },

  // Licence validity ("טסט") — the one field a buyer or driver may need to act on.
  license: {
    expiredTitle: 'רישיון הרכב פג תוקף',
    expiredBody:
      'תוקף רישיון הרכב (טסט) פג בתאריך {date}. נהיגה ללא רישיון בתוקף אינה חוקית, וייתכן שכיסוי הביטוח אינו תקף.',
    soonTitle: 'הרישיון עומד לפוג',
    soonBody: 'תוקף רישיון הרכב (טסט) יפוג בתאריך {date}. מומלץ לקבוע טסט.',
    validTitle: 'הרישיון בתוקף',
    validBody: 'תוקף רישיון הרכב (טסט) עד {date}.',
    daysAgo: 'לפני {n} ימים',
    daysLeft: 'בעוד {n} ימים',
    today: 'היום',
    yesterday: 'אתמול',
    tomorrow: 'מחר',
  },

  // Sharing a result
  share: {
    action: 'שתף',
    copied: 'הקישור הועתק',
    failed: 'לא ניתן לשתף מדפדפן זה',
    subject: 'פרטי רכב {plate}',
  },

  // Partially-failed enrichment
  enrichment: {
    partialTitle: 'חלק מהנתונים המשלימים לא נטענו',
    partialBody: 'הפרטים הרשמיים שלמעלה מלאים. אפשר לנסות לטעון את השאר שוב.',
    failedTitle: 'הנתונים המשלימים לא נטענו',
    failedBody:
      'הפרטים הרשמיים שלמעלה מלאים, אבל מחיר המחירון, הבעלויות, המפרט וההיסטוריה לא נטענו.',
  },

  // Labels for official registry fields (data.gov.il keys → Hebrew)
  fields: {
    tozeret_nm: 'יצרן',
    tozeret_eretz_nm: 'ארץ ייצור',
    kinuy_mishari: 'דגם מסחרי',
    degem_nm: 'קוד דגם',
    ramat_gimur: 'רמת גימור',
    shnat_yitzur: 'שנת ייצור',
    tzeva_rechev: 'צבע',
    nefach_manoa: 'נפח מנוע (סמ"ק)',
    sug_delek_nm: 'סוג דלק',
    misgeret: 'מספר שלדה',
    baalut: 'בעלות',
    mivchan_acharon_dt: 'טסט אחרון',
    tokef_dt: 'תוקף רישיון',
    ramat_eivzur_betihuty: 'רמת אבזור בטיחותי',
    kvutzat_zihum: 'קבוצת זיהום',
  },

  // Model specification (WLTP catalogue) — official, not estimated.
  spec: {
    title: 'מפרט הדגם',
    subtitle: 'נתוני היצרן לדגם זה, כפי שפורסמו למשרד התחבורה',
    horsepower: 'הספק (כ"ס)',
    displacement: 'נפח מנוע (סמ"ק)',
    gearbox: 'תיבת הילוכים',
    automatic: 'אוטומטית',
    manual: 'ידנית',
    drivetrain: 'הנעה',
    body: 'מרכב',
    doors: 'דלתות',
    seats: 'מושבים',
    grossWeight: 'משקל כולל (ק"ג)',
    propulsion: 'טכנולוגיית הנעה',
    towing: 'כושר גרירה עם בלמים (ק"ג)',
    airbags: 'כריות אוויר',
    safetyScore: 'ציון בטיחות',
    safetyLevel: 'רמת אבזור בטיחותי',
    co2: 'פליטת CO₂ (גר\'/ק"מ)',
    greenIndex: 'מדד ירוק',
    greenIndexHint: 'ככל שהמדד נמוך יותר — הרכב מזהם פחות',
    standard: 'תקינה',
  },

  // Features / equipment
  features: {
    title: 'אבזור ובטיחות',
    subtitle: 'מערכות הקיימות בדגם לפי נתוני היצרן',
  },

  // Price
  price: {
    title: 'מחיר מחירון',
    label: 'מחיר כשהדגם היה חדש',
    rangeNote: 'הדגם מופיע במחירון בכמה גרסאות, במחירים שונים.',
    importer: 'יבואן',
    disclaimer:
      'זהו מחיר המחירון שפורסם לדגם בשנת הייצור — לא שווי הרכב היום. שווי נוכחי מושפע מקילומטראז\', מצב, בעלויות ותאונות, ומופיע רק במחירונים מסחריים.',
  },

  // History
  history: {
    title: 'היסטוריית הרכב',
    odometer: 'קילומטראז\' בטסט האחרון',
    firstRegistration: 'עלה לכביש',
    origin: 'מקוריות / שימוש קודם',
    engineNumber: 'מספר מנוע',
    structuralChange: 'שינוי מבנה',
    colorChange: 'שינוי צבע',
    tireChange: 'שינוי צמיגים',
    yes: 'כן',
    no: 'לא',
    km: 'ק"מ',
  },

  // Model photo (Wikipedia)
  image: {
    caption: 'תמונה להמחשה בלבד — אינה תמונת הרכב הזה',
    detail: 'תמונה כללית של הדגם; ייתכנו הבדלים בשנתון, ברמת הגימור ובצבע.',
    credit: 'מקור: ויקיפדיה',
  },

  // Ownership chain ("יד ראשונה / שנייה …")
  ownership: {
    title: 'בעלויות',
    hand: 'יד',
    ordinals: [
      'ראשונה',
      'שנייה',
      'שלישית',
      'רביעית',
      'חמישית',
      'שישית',
      'שביעית',
      'שמינית',
      'תשיעית',
      'עשירית',
    ],
    atLeast: 'לפחות',
    owners: 'בעלים',
    dealerTransfers: 'העברות דרך סוחר',
    dealerNote: 'העברה דרך סוחר אינה נספרת כיד.',
    chainTitle: 'שרשרת הבעלויות',
    partialNote:
      'מרשם ההעברות של משרד התחבורה מתחיל בינואר 2017. הרכב עלה לכביש לפני כן, ולכן ייתכנו בעלויות קודמות שאינן מופיעות — המספר הוא מינימום.',
    unknownTitle: 'מספר הידיים לא ידוע',
    unknownBody:
      'לרכב זה אין רשומות במרשם ההעברות, שמתחיל בינואר 2017. היעדר רשומות אינו אומר שמדובר ביד ראשונה.',
    types: {
      dealer: 'סוחר',
    },
  },

  // Open recalls
  recall: {
    title: 'ריקול פתוח',
    body: 'היצרן פרסם קריאת שירות שטרם בוצעה ברכב זה. מומלץ לפנות למוסך מורשה.',
    opened: 'נפתח',
    none: 'אין ריקול פתוח',
  },

  // Estimated spec labels
  estimates: {
    horsepower: 'הספק (כ"ס)',
    torque: 'מומנט (נמ)',
    curbWeight: 'משקל עצמי (ק"ג)',
    zeroToHundred: 'תאוצה 0-100 (שנ\')',
    approx: '~',
    fromOfficial: 'מחושב מנתוני ההספק והמשקל הרשמיים של הדגם',
  },

  // Generic states
  states: {
    loading: 'טוען פרטי רכב…',
    notFoundTitle: 'לא נמצא רכב',
    notFoundBody:
      'המספר לא נמצא במאגרים. ייתכן שהרכב שייך לקטגוריה שאינה כלולה במאגר, או שהרישיון בוטל / הרכב הורד מהכביש.',
    notFoundCta: 'חיפוש אחר',
    errorTitle: 'שגיאת תקשורת',
    errorBody: 'לא הצלחנו לטעון את הנתונים. בדקו את החיבור לאינטרנט ונסו שוב.',
    offlineTitle: 'אין חיבור לאינטרנט',
    offlineBody: 'נדרש חיבור לאינטרנט כדי לאתר פרטי רכב.',
    retry: 'נסה שוב',
    retrying: 'מנסה שוב…',
    back: 'חזרה',
    // Unhandled render error caught by the error boundary.
    crashTitle: 'משהו השתבש',
    crashBody: 'אירעה שגיאה בלתי צפויה בתצוגה. רענון העמוד בדרך כלל פותר את הבעיה.',
    reload: 'רענן את העמוד',
  },
} as const;

export type Strings = typeof he;
