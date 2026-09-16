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
    recentEmpty: 'עדיין אין חיפושים. חפשו לוחית כדי להתחיל.',
    clearRecent: 'נקה היסטוריה',
    invalidPlate: 'מספר לוחית לא תקין — יש להזין 5 עד 8 ספרות',
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
  },

  // Permissions
  permission: {
    title: 'נדרשת הרשאת מצלמה',
    body: 'כדי לסרוק לוחית רישוי צריך לאשר גישה למצלמה. התמונה מעובדת במכשיר בלבד ואינה נשלחת לאף שרת.',
    grant: 'אפשר גישה למצלמה',
    openSettings: 'פתח הגדרות',
    back: 'חזרה',
  },

  // Vehicle / result
  vehicle: {
    officialTitle: 'פרטי רכב רשמיים',
    estimatedTitle: 'נתונים משוערים',
    estimatedDisclaimer:
      'הערכים הבאים אינם מופיעים במרשם הרכב והם הערכה בלבד על סמך יצרן, דגם, שנה, נפח מנוע וסוג דלק.',
    source: 'מקור: מרשם הרכב, משרד התחבורה (data.gov.il)',
    copyVin: 'הועתק מספר השלדה',
    copyHint: 'לחיצה ארוכה להעתקה',
    searchAgain: 'חיפוש חדש',
  },

  // Labels for official registry fields (data.gov.il keys → Hebrew)
  fields: {
    tozeret_nm: 'יצרן',
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

  // Estimated spec labels
  estimates: {
    horsepower: 'הספק (כ"ס)',
    torque: 'מומנט (נמ)',
    curbWeight: 'משקל עצמי (ק"ג)',
    zeroToHundred: 'תאוצה 0-100 (שנ\')',
    approx: '~',
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
    back: 'חזרה',
  },
} as const;

export type Strings = typeof he;
