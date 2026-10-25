# תוכנית – Milestone 5: PWA, Offline ופרסום ב-GitHub Pages

מקורות: `MILESTONES.md` (Milestone 5), `PRD.md` §4.5 ומקרי קצה, `ARCHITECTURE.md` §2.7, §2.9, ADR-6 עד ADR-10, `DESIGN.md` §2.1 (צבעים) ו-§2.4 (App Icon).
מצב פתיחה: Milestones 1–4 ✅. המשחק המלא כבר פורס אוטומטית ל-`https://maxxik810.github.io/Simon/` בכל Push ל-`main` (ADR-10). אין עדיין Manifest, Service Worker, אייקונים או תיקיית `public/`.
נבדק: ה-Repository `Maxxik810/Simon` ציבורי (GitHub API: `"visibility": "public"`), ו-`base: '/Simon/'` כבר מוגדר ב-`vite.config.ts`.

## 1. מה נבנה

האתר הופך ל-PWA: אפשר להתקין אותו בטלפון תומך (שם ההתקנה `Simon`, אייקון לוח סיימון), והוא נפתח ועובד בלי אינטרנט אחרי טעינה ראשונה מלאה – שני המסכים, המשחק, הצלילים (Web Audio, בלי קבצים), הגופן Heebo וההיסטוריה (`localStorage`). גרסה חדשה מותקנת ברקע ונכנסת לתוקף רק בפתיחה הבאה אחרי סגירה מלאה, כך שעדכון לעולם לא קוטע משחק (ADR-6).
**לא בשלב זה:** אין חלונית "גרסה חדשה", אין כפתור "התקן" בתוך האפליקציה, אין שינוי בלוגיקת המשחק או בעיצוב המסכים.

## 2. קבצים

| קובץ | פעולה | תוכן |
|---|---|---|
| `package.json` / `package-lock.json` | שינוי | devDependencies: `vite-plugin-pwa` (^2.0.0), `@vite-pwa/assets-generator` (^2.0.0), `workbox-window` (peer). סקריפט `generate-pwa-assets` |
| `public/icon.svg` | חדש | מקור האייקון, כתוב ידנית (§3) |
| `pwa-assets.config.ts` | חדש | תצורת יצירת האייקונים (preset `minimal2023`, רקע `#0A1628`) |
| `public/pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico` | חדש (נוצר) | נוצרים פעם אחת מה-SVG ונשמרים ב-Git (ADR-7) |
| `pwa.config.ts` | חדש | הקבוע `BASE` ותצורת ה-Manifest, בקובץ נפרד כדי שאפשר יהיה לבדוק אותה |
| `vite.config.ts` | שינוי | `VitePWA({...})` (§4), משתמש ב-`pwa.config.ts` |
| `src/main.tsx` | שינוי | `registerSW({ immediate: true })` מ-`virtual:pwa-register`, בלי `onNeedRefresh` (ADR-6) |
| `src/vite-env.d.ts` | שינוי | `/// <reference types="vite-plugin-pwa/client" />` |
| `index.html` | שינוי | `<link rel="icon">` ל-`favicon.ico` ו-`icon.svg`, `<link rel="apple-touch-icon">`, `<meta name="description">` בעברית. ה-`<title>` נשאר "סיימון" |
| `src/pwa.test.ts` | חדש | בדיקות לתצורת ה-Manifest (§6) |
| `.github/workflows/deploy.yml` | בדיקה בלבד | כבר מריץ `npm ci` → typecheck → test → build → Pages. שינוי רק אם משהו מה-DoD חסר |
| `spec/MILESTONES.md` | סימון | 🟡 ליד Milestone 5 בסיום הבנייה |
| `CLAUDE.md` | שינוי קטן | הוספת פקודות `npm run preview` (בדיקת PWA מקומית) ו-`npm run generate-pwa-assets` לסעיף "פקודות הרצה" |

## 3. אייקון האפליקציה (`public/icon.svg`)

לפי `DESIGN.md` §2.4: קנבס 512×512, רקע מלא `#0A1628` (בלי פינות שקופות, כדי שיתאים גם כ-Maskable). במרכז לוח עגול בקוטר ~78% מהקנבס (בתוך ה-Safe Zone של Maskable, ADR-7), מחולק לארבעה רבעים בסידור של הלוח במשחק (`colors.ts`): ירוק `#00D26A` למעלה-שמאל, אדום `#FF3B30` למעלה-ימין, צהוב `#FFD600` למטה-שמאל, כחול `#00A3FF` למטה-ימין. פסי הפרדה עבים ודיסק מרכזי בצבע Charcoal `#0F0F0F`. ללא טקסט.
את ה-PNG וה-favicon יוצר `npm run generate-pwa-assets`. אציג לך את האייקון כתמונה לפני ההמשך.

## 4. תצורת `vite-plugin-pwa`

```ts
VitePWA({
  strategies: 'generateSW',
  registerType: 'prompt',      // never auto-reload (ADR-6)
  injectRegister: false,       // registered manually in main.tsx
  includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
  manifest: {
    id: '/Simon/app',          // must never change (ADR-9)
    name: 'Simon', short_name: 'Simon',
    description: 'משחק זיכרון צבעים וצלילים',
    lang: 'he', dir: 'rtl',
    start_url: BASE, scope: BASE,   // '/Simon/', same constant as Vite base (ADR-8)
    display: 'standalone', orientation: 'portrait',
    background_color: '#0A1628', theme_color: '#0A1628',
    icons: [64, 192, 512 'any' + 512 'maskable'],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
    navigateFallback: 'index.html',   // SPA fallback, inside the /Simon/ scope only
    cleanupOutdatedCaches: true,
    // no skipWaiting, no clientsClaim (ADR-6)
  },
})
```

- `BASE = '/Simon/'` יוגדר כקבוע אחד ב-`vite.config.ts` ומשמש גם ל-`base` של Vite וגם ל-`start_url`/`scope`.
- הגופן: לוודא אחרי ה-Build שקובצי Heebo (רק 400/600/700, בתת-קבוצות שנטענות) נכנסו לרשימת ה-Precache. אם `@fontsource` מוסיף קבצי `woff` כפולים ל-`woff2`, להשאיר רק את `woff2` כדי לא לנפח את ה-Cache.
- `orientation: 'portrait'` – תואם ל"תצוגת Smartphone אנכית" ב-DoD. אם תעדיף לא לנעול את הסיבוב, אסיר את השורה.

## 5. עדכוני גרסה (ADR-6)

`registerSW({ immediate: true })` בלבד. גרסה חדשה מורדת ברקע ונשארת במצב המתנה עד שכל חלונות האפליקציה נסגרים; בפתיחה הבאה נטענת הגרסה החדשה. אין `skipWaiting`, אין `clientsClaim`, אין רענון יזום, ולכן משחק פעיל לא נקטע לעולם.

## 6. בדיקות

**אוטומטיות (Vitest):**
- `src/pwa.test.ts`: ייבוא תצורת ה-Manifest (אוציא אותה לקובץ קטן `pwa.config.ts` כדי שתהיה ניתנת לבדיקה) ובדיקה ש-`id`, `start_url` ו-`scope` הם תחת `/Simon/`, `lang: 'he'`, `dir: 'rtl'`, `display: 'standalone'`, ויש אייקונים 192, 512 ו-Maskable.
- כל בדיקות ה-Regression הקיימות (עשרה שלבים, כישלון ראשון, קונפטי בניצחון בלבד, השהיה/חידוש, עשר תוצאות, מחיקה מאושרת) חייבות להמשיך לעבור. `npm run typecheck` ו-`npm run build` נקיים.

**שלי, אחרי הבנייה (מקומית, `npm run build` + `npm run preview` ב-`http://localhost:4173/Simon/`):**
- ב-`dist/`: קיימים `manifest.webmanifest`, `sw.js`, האייקונים, ורשימת ה-Precache כוללת HTML, JS, CSS, גופנים ואייקונים.
- בדפדפן: ה-Manifest נטען בלי שגיאות, ה-Service Worker פעיל, אין 404 בנכסים.
- Offline: אחרי טעינה מלאה – ניתוק רשת (אמולציה), טעינה מחדש, ובדיקה ששני המסכים, משחק, צלילים והיסטוריה עובדים.
- עדכון: Build שני עם שינוי קטן – בזמן משחק פעיל הדף לא מתרענן, והגרסה הישנה ממשיכה לרוץ.
- תצוגה אנכית במובייל (אמולציה), עברית/RTL.

**שלך:**
- **הרצה מקומית** (שלב 3): אריץ את גרסת ה-Build (`preview`) ואסביר לך איך לבדוק במחשב, כולל מצב Offline. בטלפון אי אפשר לבדוק PWA מקומית, כי Service Worker דורש HTTPS.
- **אחרי הדחיפה** (שלב 4): בדיקה בטלפון בלינק החי – התקנה, פתיחה מהמסך הראשי, מצב טיסה, משחק וצפייה בהיסטוריה.

## 7. דחיפה ופריסה

ה-Workflow הקיים כבר עונה על סעיף ה-CI ב-DoD. אחרי ה-Push: לוודא שה-Run ב-GitHub Actions הצליח, שהלינק החי מגיש `manifest.webmanifest` ו-`sw.js` ב-HTTPS תחת `/Simon/` בלי 404, ואז ליצור `builds/simon-m5.zip` מתוך `dist/`.

## 8. ADR

ההחלטות המרכזיות כבר מתועדות ב-ADR-6 עד ADR-9. ADR חדש יתווסף רק אם בבנייה תתקבל החלטה שאינה מכוסה שם.

## מה נבנה בפועל

- נוספו `vite-plugin-pwa` 2.0, `@vite-pwa/assets-generator` 2.0 ו-`workbox-window`. התצורה כפי שתוכננה ב-§4; ה-Manifest והקבוע `BASE` נמצאים ב-`pwa.config.ts`.
- `public/icon.svg` ושישה קבצי אייקון שנוצרו ממנו (`npm run generate-pwa-assets`), כולל Maskable ו-favicon. ב-`index.html` נוספו favicon, apple-touch-icon ו-description.
- `registerSW({ immediate: true })` ב-`src/main.tsx`, בלי `onNeedRefresh`, `skipWaiting` או `clientsClaim`.
- ב-Precache יש 27 קבצים (~390KB): HTML, JS, CSS, אייקונים, Manifest וגופני Heebo בפורמט `woff2` בלבד (קובצי `woff` הכפולים לא נשמרים).
- `src/pwa.test.ts` (3 בדיקות). סה"כ 60 בדיקות עוברות; typecheck ו-Build נקיים.
- נבדק מקומית ב-`preview`: Service Worker פעיל ב-Scope `/Simon/`; אחרי עצירת השרת האפליקציה נפתחת מחדש, משחק רץ עד הפסד, התוצאה נשמרת ומוצגת ב"אודות". Build שני עם שינוי זמני: הגרסה החדשה נשארה במצב `waiting`, והדף לא התרענן באמצע משחק.
- טרם נבדק: התקנה ומצב טיסה בטלפון אמיתי, ו-HTTPS בלינק החי. אלה ייבדקו אחרי הדחיפה.
