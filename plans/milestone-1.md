# תוכנית – Milestone 1: בסיס אפליקציה ושני מסכים מעוצבים

> מקורות: `MILESTONES.md` (Milestone 1), `PRD.md`, `ARCHITECTURE.md` (כולל ADR-1, ADR-2, ADR-8), `DESIGN.md` ושלוש התמונות ב-`spec/`.
> תוכנית זו לבנייה בלבד. אחרי הבנייה הקוד ו-`MILESTONES.md` הם מקור האמת.

## 1. המטרה בקצרה

פרויקט React + TypeScript + Vite שרץ מקומית, עם שני מסכים (**בית**, **אודות**) בעיצוב הכהה של ה-Mockups, ניווט ביניהם בלי טעינת דף, ובדיקות בסיסיות.
הלוח וכפתור **"התחל משחק"** מוצגים, אבל עדיין **לא** מריצים משחק.

**לא נכנס ל-Milestone הזה** (שייך לאבני דרך מאוחרות): לוגיקת משחק, `useReducer`, אודיו, קונפטי, השהיה, היסטוריה ב-`localStorage`, Dialog מחיקה, PWA, אייקונים, GitHub Actions ופריסה.
לכן לא מתקינים עדיין `canvas-confetti`, `vite-plugin-pwa` או `@vite-pwa/assets-generator`.

## 2. תנאי מקדים – לפני כתיבת קוד

1. לבדוק ש-Node.js מותקן במחשב (`node -v`, `npm -v`), בגרסת LTS שמתאימה לגרסת Vite שתותקן.
   אם Node חסר או ישן מדי: **לעצור** ולהדריך את המשתמש בשפה פשוטה, צעד אחר צעד, להתקין Node.js LTS מהאתר הרשמי (nodejs.org).
2. שורש הפרויקט הוא תיקיית `simon` (שבה נמצאים `CLAUDE.md` ו-`spec/`). הקוד נוצר שם, לא בתוך `spec/`.
3. **Git:** לא מריצים `git init`, `commit` או `push` ב-Milestone הזה. ה-repo נוצר ומחובר ל-GitHub בשלב "דחיפה" לפי `CLAUDE.md`, אחרי האישור.
4. **`.env`:** לפרויקט אין מפתחות או הגדרות סודיות, ולכן **לא** יוצרים `.env.example` ו-`.env`.
5. **`.gitignore`:** כבר מכסה `node_modules/` ו-`dist/`. לא נדרש שינוי.

## 3. Dependencies

התקנה ב-`npm install`, בגרסאות היציבות העדכניות שתואמות זו לזו ולגרסת Node המותקנת. `package-lock.json` נשמר בפרויקט.

| חבילה | סוג | למה |
|---|---|---|
| `react`, `react-dom` | dependency | ה-UI |
| `@fontsource/heebo` | dependency | גופן Heebo ארוז באפליקציה, בלי Google Fonts. מייבאים רק 400, 600 ו-700 |
| `vite`, `@vitejs/plugin-react` | dev | שרת פיתוח ו-Build |
| `typescript`, `@types/react`, `@types/react-dom` | dev | TypeScript |
| `vitest`, `jsdom` | dev | הרצת בדיקות |
| `@testing-library/react`, `@testing-library/jest-dom` | dev | בדיקות Render וניווט |

אין ספריית UI, אין Router ואין ספריית CSS.

## 4. הקבצים ליצור

```text
simon/
├── package.json
├── package-lock.json            (נוצר ע"י npm)
├── index.html
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.test.tsx
    ├── vite-env.d.ts
    ├── styles/
    │   ├── tokens.css
    │   └── global.css
    ├── game/
    │   └── colors.ts
    ├── components/
    │   ├── ScreenHeader.tsx
    │   ├── ScreenHeader.css
    │   ├── NavBar.tsx
    │   ├── NavBar.css
    │   ├── SimonBoard.tsx
    │   └── SimonBoard.css
    ├── screens/
    │   ├── HomeScreen.tsx
    │   ├── HomeScreen.css
    │   ├── AboutScreen.tsx
    │   └── AboutScreen.css
    └── test/
        └── setup.ts
```

קבצים קיימים שמתעדכנים בסוף הבנייה: `CLAUDE.md` (סעיף "פקודות הרצה" בלבד) ו-`spec/MILESTONES.md` (סימון 🟡 ליד כותרת Milestone 1 בלבד).

## 5. פירוט לפי קובץ

### `package.json`
- `"type": "module"`, `"private": true`, `"name": "simon"`.
- Scripts:
  - `dev`: `vite`
  - `typecheck`: `tsc --noEmit`
  - `build`: `tsc --noEmit && vite build`
  - `preview`: `vite preview`
  - `test`: `vitest run`

### `vite.config.ts`
- `@vitejs/plugin-react`.
- `base: '/Simon/'` בכל הסביבות (ADR-8). לכן כתובת הפיתוח היא `http://localhost:5173/Simon/`.
- הגדרות Vitest באותו קובץ: `environment: 'jsdom'`, `setupFiles: ['src/test/setup.ts']`, `css: false`.

### `tsconfig.json`
- `strict: true`, `jsx: "react-jsx"`, `moduleResolution: "bundler"`, `noEmit: true`, `skipLibCheck: true`, `types: ["vite/client"]`.
- `include`: `src` ו-`vite.config.ts`.

### `index.html`
- `<html lang="he" dir="rtl">`.
- `<title>סיימון</title>`.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- `<meta name="theme-color" content="#0A1628">`.
- `<div id="root">` ו-`<script type="module" src="/src/main.tsx">`.
- בלי favicon ובלי manifest (Milestone 5).

### `src/main.tsx`
- ייבוא `@fontsource/heebo/400.css`, `600.css`, `700.css`.
- ייבוא `styles/tokens.css` ואחריו `styles/global.css`.
- `createRoot(...).render(<StrictMode><App /></StrictMode>)`.

### `src/styles/tokens.css` – CSS Variables על `:root`
ערכים מ-`DESIGN.md` §2:

| משתנה | ערך |
|---|---|
| `--color-green` | `#00D26A` |
| `--color-red` | `#FF3B30` |
| `--color-yellow` | `#FFD600` |
| `--color-blue` | `#00A3FF` |
| `--color-charcoal` | `#0F0F0F` |
| `--color-soft-gray` | `#E5E5E5` |
| `--color-white` | `#FFFFFF` |
| `--color-bg` | `#0A1628` |
| `--color-surface` | `#12213A` |
| `--color-border` | `#1E3556` |
| `--space-1` … `--space-4` | `8px`, `12px`, `16px`, `24px` |
| `--font-family` | `'Heebo', Arial, sans-serif` |
| `--fs-h1` / `--fs-h2` / `--fs-h3` / `--fs-body` / `--fs-caption` / `--fs-button` | `32px` / `24px` / `20px` / `16px` / `14px` / `16px` |
| `--radius-card` / `--radius-button` | `16px` / `999px` |

### `src/styles/global.css`
- `box-sizing: border-box` לכל האלמנטים, `margin: 0` ל-`body`.
- `body`: רקע `--color-bg`, טקסט `--color-white`, `font-family: var(--font-family)`, `font-size: var(--fs-body)`.
- `html, body { overflow-x: hidden; }` כרשת ביטחון. הפריסה עצמה חייבת להתאים לרוחב בלי לסמוך על זה.
- `button`: יורש גופן, `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`, `user-select: none`.
- Focus גלוי (`:focus-visible`) עם קו מתאר בצבע `--color-blue`.

### `src/game/colors.ts`
מקור אחד לצבעי הלוח (ADR-1). אותו קובץ ישמש את מנוע המשחק ב-Milestone 2.
```ts
export type ColorId = 'green' | 'red' | 'yellow' | 'blue';
export type BoardPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const BOARD_COLORS: ReadonlyArray<{
  id: ColorId;
  label: string;        // Hebrew accessible name
  position: BoardPosition;
}> = [
  { id: 'green',  label: 'ירוק', position: 'top-left' },
  { id: 'red',    label: 'אדום', position: 'top-right' },
  { id: 'yellow', label: 'צהוב', position: 'bottom-left' },
  { id: 'blue',   label: 'כחול', position: 'bottom-right' },
];
```
הסידור לפי ה-Mockups, שגובר על ה-Wireframes (`DESIGN.md` §1.1).

### `src/App.tsx`
- `type Screen = 'home' | 'about'`, ו-`useState<Screen>('home')`.
- מרנדר את `HomeScreen` או את `AboutScreen` לפי המצב, ומתחתיו `NavBar` עם `current` ו-`onNavigate`.
- מבנה: מיכל `.app` בעמודה (`display: flex; flex-direction: column; min-height: 100dvh`), רוחב מקסימלי `480px` וממורכז. אזור התוכן (`main`) גדל וגולל. ה-NavBar בתחתית.
- `App` הוא המקום שבו יישב מצב המשחק ב-Milestone 2 (ADR-2), כדי שמעבר מסכים לא יפרק אותו. ב-Milestone הזה אין בו מצב משחק.

### `src/components/ScreenHeader.tsx`
- `<header>` עם `<h1>` אחד (`title` כ-prop). H1: `32px Bold`, לבן, ממורכז.
- מתחת לכותרת קו הפרדה דק בצבע `--color-border` (כמו ב-Mockups).
- קשת דקורטיבית עדינה ברקע, בצבע `--color-border`, כמו ב-Mockups. `aria-hidden`, בלי השפעה על הפריסה (`pointer-events: none`, ללא גלישה לרוחב).

### `src/components/NavBar.tsx`
- `<nav aria-label="ניווט ראשי">` עם **שני** `<button type="button">` בלבד: **"בית"** ואחריו **"אודות"**. בגלל RTL, "בית" מימין.
- כפתורים ולא קישורים (`<a>`), כדי שאין שום טעינת דף או שינוי כתובת.
- הכפתור הפעיל מקבל `aria-current="page"` ומובחן חזותית: טקסט לבן מודגש. הלא-פעיל בגוון `--color-soft-gray` מעומעם.
- עיצוב לפי ה-Mockups: פס כהה `--color-surface`, גבול `--color-border`, פינות `--radius-card`, קו הפרדה אנכי בין שתי האפשרויות. טקסט בלבד, בלי אייקונים (`DESIGN.md` §2.3: אייקונים הם אופציונליים).
- `padding-bottom` כולל `env(safe-area-inset-bottom)`.
- גובה כל כפתור לפחות `48px`.

### `src/components/SimonBoard.tsx`
לפי ADR-1:
- מיכל עגול (`border-radius: 50%`), `display: grid`, `grid-template: 1fr 1fr / 1fr 1fr`, ו-**`direction: ltr`**, כדי שמיקום הצבעים לא יתהפך ב-RTL.
- רקע המיכל `--color-charcoal`. ה-`gap` (כ-`10px`) יוצר את פסי ההפרדה הכהים. מסגרת חיצונית בצבע `--color-border`.
- ארבעה `<button type="button">` לפי `BOARD_COLORS`:
  - `aria-label` בעברית (`label`), `data-color={id}`, `data-position={position}`.
  - `grid-area` מפורש לפי `position`, והפינה החיצונית של כל רבע מעוגלת (`border-top-left-radius: 100%` לירוק, וכן הלאה).
  - צבע מלא מה-tokens, בלי טקסט גלוי על הרבעים (כמו ב-Mockups).
  - ב-Milestone הזה **אין להם handler**. הם מוצגים בצבע מלא (מצב "לפני תחילת משחק"), לא מעומעמים ולא `disabled`.
- דיסק מרכזי: `div` עם `aria-hidden="true"` ו-`pointer-events: none`, ממוקם במרכז (`position: absolute`), בקוטר כ-30% מהלוח, בצבע `--color-bg` עם מסגרת `--color-border`. **ריק**, בלי טקסט (`DESIGN.md` §2.3: "אין בו פיצ'ר נוסף").
- גודל: `width: min(84vw, 44dvh, 340px)` ו-`aspect-ratio: 1`, כדי שהלוח, הכותרת, חיווי השלב, הכפתור והניווט ייכנסו במסך `375×667` בלי גלילה, ובלי חריגה לרוחב.
- צל רך מתחת ללוח. בלי Glow ובלי אנימציות ב-Milestone הזה.
- ה-props מוכנים להרחבה ב-Milestone 2 (למשל `activeColor`, `dimmed`, `onPress`), אבל לא מממשים אותם עכשיו. מספיק רכיב שמקבל אפס props.

### `src/screens/HomeScreen.tsx`
מלמעלה למטה, ממורכז:
1. `ScreenHeader` עם **"סיימון"**.
2. חיווי שלב: **"שלב 1 מתוך 10"**, `20px Semibold` (H3 / Subsection), כטקסט פשוט כמו ב-Mockups.
3. אזור טקסט סטטוס מתחת לחיווי עם `min-height` קבוע וריק במצב הזה. הוא שומר מקום ל"המשחק מציג את הרצף" ול"התור שלך" במילסטונים הבאים, כדי שהפריסה לא תקפוץ.
4. `SimonBoard`.
5. כפתור ראשי **"התחל משחק"**: `<button type="button">`, כחול מלא (`--color-blue`), טקסט לבן `16px Semibold`, פינות `--radius-button`, רוחב כ-80% מהעמודה (עד `320px`), גובה לפחות `48px`, צל רך. **בלי handler** ב-Milestone הזה.

### `src/screens/AboutScreen.tsx`
1. `ScreenHeader` עם **"אודות"** (`DESIGN.md` §1.2).
2. כרטיס **"על המשחק"** (`<section>` עם `<h2>`): רקע `--color-surface`, גבול `--color-border`, פינות `--radius-card`, ריווח `--space-3`/`--space-4`. התוכן:
   - "זכרו את רצף הצבעים שהמשחק מציג, ולחצו על הצבעים באותו סדר."
   - "בכל שלב מתווסף צבע אחד לרצף. טעות אחת מסיימת את המשחק."
   - "נסו להגיע עד שלב 10!"
3. אזור היסטוריה (`<section>` עם `<h2>`): כותרת **"10 המשחקים האחרונים"**, ומתחתיה חיווי ריק: **"עדיין אין משחקים שמורים."** בגוון `--color-soft-gray`.
4. **אין** כפתור "מחק היסטוריה" (הוא מוצג רק כשיש רשומות, ובמילסטון הזה אין). **אין** כרטיסי היסטוריה מזויפים.
5. אם התוכן ארוך יותר מהמסך, הוא גולל בתוך העמוד.

### `src/test/setup.ts`
- `import '@testing-library/jest-dom/vitest'`.
- `afterEach(cleanup)` מ-`@testing-library/react`.

### `src/App.test.tsx`
בדיקות Render וניווט, עם `render(<App />)`, `screen` ו-`fireEvent`:
1. **מסך הבית בטעינה:** כותרת `סיימון` (role `heading`), הטקסט `שלב 1 מתוך 10`, כפתור `התחל משחק`, וארבעה כפתורים בשמות `ירוק`, `אדום`, `צהוב`, `כחול`.
2. **מיקום הצבעים:** ל-`ירוק` יש `data-position="top-left"`, ל-`אדום` `top-right`, ל-`צהוב` `bottom-left` ול-`כחול` `bottom-right`.
3. **ניווט:** ב-`nav` יש בדיוק שני כפתורים, `בית` ו-`אודות`, ואין בו קישורים (`<a>`). בהתחלה `בית` מסומן `aria-current="page"`.
4. **מעבר לאודות:** לחיצה על `אודות` מציגה כותרת `אודות`, את `על המשחק`, את `10 המשחקים האחרונים` ואת `עדיין אין משחקים שמורים.`. הלוח ו-`התחל משחק` כבר לא מוצגים, ואין כפתור `מחק היסטוריה`.
5. **חזרה לבית:** לחיצה על `בית` מחזירה את הלוח ואת `שלב 1 מתוך 10`.

## 6. החלטות שהתקבלו בתכנון (סתירות בין התמונות למסמכים)

כולן הוכרעו לפי כללי `CLAUDE.md`. אף אחת לא דורשת שינוי במסמכי ה-spec.

| הנושא | מה רואים בתמונות | מה נבנה | למה |
|---|---|---|---|
| טקסט הכפתור | "התחל" ב-Wireframes וב-Mockups | **"התחל משחק"** | ה-PRD וה-DESIGN קובעים את הנוסח |
| חיווי שלב לפני משחק | "שלב 0 מתוך 10" ב-Wireframes | **"שלב 1 מתוך 10"** | `DESIGN.md` §1.1 קובע זאת במפורש |
| סידור הצבעים | שונה ב-Wireframes | ירוק / אדום / צהוב / כחול כמו ב-Mockups | `DESIGN.md` קובע שה-Mockups גוברים |
| כותרת מסך אודות | "סיימון" ב-Mockups | **"אודות"** | `DESIGN.md` §1.2 גובר על פריסה |
| טקסט בדיסק המרכזי | יש טקסט לא קריא ב-Mockups | דיסק ריק | `DESIGN.md` §2.3: "אין בו פיצ'ר נוסף" |
| אייקונים בניווט | יש ב-Wireframes, אין ב-Mockups | טקסט בלבד | ה-Mockups הם המראה הסופי, ואייקונים אופציונליים |
| תוויות על רבעי הלוח | יש ב-Wireframes, אין ב-Mockups | בלי טקסט גלוי, עם `aria-label` | ה-Mockups הם המראה הסופי. הנגישות נשמרת דרך השם הנגיש |
| חיווי שלב כ-Badge | ב-Style Guide | טקסט פשוט | ה-Mockups מציגים טקסט פשוט |

נוסח ההוראות במסך אודות נכתב לפי ה-Wireframes וחוקי ה-PRD. ה-PRD מאפשר לקבוע את הנוסח ביישום. המשתמש יכול לבקש לשנות אותו בבדיקה.

## 7. בדיקה עצמית בסוף הבנייה

1. `npm run typecheck`, `npm run test` ו-`npm run build` עוברים בלי שגיאות.
2. `npm run dev` ובדיקה בדפדפן, בכתובת `http://localhost:5173/Simon/`, באמולציית מובייל `375×667` (אנכי):
   - שני המסכים מוצגים ונראים קרובים ל-Mockups: רקע כהה, לוח עגול, כפתור כחול ופס ניווט.
   - מעבר בין "בית" ל"אודות" לא מרענן את הדף: הכתובת לא משתנה ואין טעינה ברשת.
   - אין גלילה אופקית: `document.documentElement.scrollWidth <= window.innerWidth`.
   - הגופן Heebo נטען מקומית, בלי בקשה ל-`fonts.googleapis.com`.
   - כל הטקסטים בעברית, והדף RTL (`lang="he"`, `dir="rtl"`).
3. אם אין כלי דפדפן זמין לבדיקה החזותית, **לא** לסמן אותה כעוברת. לכתוב במפורש שהיא לא בוצעה ושהמשתמש יבדוק אותה.
4. לסגור את שרת הפיתוח בסיום.
5. לעדכן את `CLAUDE.md`, סעיף "פקודות הרצה":
   - **הרצה (dev):** `npm run dev`, ואז לפתוח `http://localhost:5173/Simon/`
   - **בדיקות (test):** `npm run test`
6. לסמן 🟡 ליד הכותרת של Milestone 1 ב-`spec/MILESTONES.md`. בלי commit.

## 8. Definition of Done – איך כל תנאי נבדק

| תנאי מ-`MILESTONES.md` | איך בודקים |
|---|---|
| `npm run build` ו-typecheck מסתיימים בהצלחה; בדיקת Render/Navigation בסיסית עוברת | הרצת שלוש הפקודות; בדיקות 1–5 ב-`App.test.tsx` |
| שני המסכים נפתחים, מעבר ביניהם לא מרענן את הדף, אין מסך שלישי | בדיקות 3–5; בדיקה ידנית של הכתובת ושל לשונית Network |
| ארבעת אזורי הלוח במיקומים הנכונים, חיווי שלב וכפתור "התחל משחק"; אודות מציג הסבר והודעת היסטוריה ריקה | בדיקות 1, 2 ו-4; השוואה חזותית ל-Mockups |
| כל הטקסטים בעברית, RTL, נוח וקריא ב-Smartphone אנכי, ללא גלילה אופקית | בדיקה ידנית ב-`375×667`; בדיקת `scrollWidth` |
| לא נוספו יכולות שאינן ב-PRD, ואין Backend או Database | סקירת קבצים ו-`package.json`: אין שרת, אין DB, אין Router ואין חבילות של אבני דרך עתידיות |
