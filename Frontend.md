# Frontend.md — Fairydev CTF Sandbox: план интеграции

Текущую версию фронта переписываем целиком. Контракт и его Program ID не трогаем.
Тексты интерфейса на английском (проект для международного хакатона), этот план на русском.

---

## 0. Зафиксированные решения

- **Раскладка A: «Сцена».** Один шаг = один экран. Крупная Fairydev с репликой в пузыре и зона действия с одним элементом. Фон общий (розовый паттерн), это одна сцена, а не набор независимых блоков.
- **Не используем:** стопки карточек, аккордеоны, боковую колонку «Guided hints», сплит-экран.
- **Сквозная нумерация миссий 1–6** (раньше было 1 → 4).
- **Правило юмора:** шутка в реплике феи, инструкция в зоне действия простым текстом, настоящий термин всегда в скобках при первом упоминании.
- **Каждый шаг с автопроверкой**, где это технически возможно. «Дальше» разблокируется только после прохождения проверки.
- **Существующую логику** (отправка транзакции, проверка флага) переиспользуем: переносим в хуки, не переписываем.

Причина, по которой инструкция должна быть внутри действия: в прошлой версии правая колонка с нумерованными подсказками читалась как «план будущих шагов», и её пропускали. Теперь подсказку произносит фея в момент действия.

---

## 1. Структура экрана (Stage)

```
┌─────────────────────────────────────────────────────┐
│ Logo        ✦ wings progress  3/6        [Wallet]   │
│                                                     │
│   (bubble: реплика феи)                             │
│                              ACTION ZONE            │
│   Fairydev (крупно)          один элемент шага      │
│                                                     │
│                              [ Next ▸ ]  locked/open│
└─────────────────────────────────────────────────────┘
```

- Фея слева, крупно, занимает ~40% ширины. Пузырь реплики рядом с ней.
- Зона действия справа: заголовок шага, 1–3 строки простым текстом, один главный элемент (кнопка / поле / подсветка), кнопка «Next».
- **Мобильная версия:** вертикально. Прогресс сверху, фея меньше + пузырь, зона действия ниже, «Next» закреплена внизу экрана.
- **Контраст:** текст никогда не лежит прямо на паттерне. Пузырь и зона действия имеют сплошную заливку (белая, ~92% непрозрачности), контраст текста не ниже AA (4.5:1). Линии паттерна тонкие и белые на розовом, поэтому поверх паттерна накладывается лёгкий розовый оверлей.

---

## 2. Ассеты

Кладём в `app/public/fairy/` и `app/public/bg/`. Формат: PNG с прозрачным фоном, конвертировать в WebP, каждый файл < 200 KB.

| Файл | Источник | Где используется |
|---|---|---|
| `fairy-idle.png` | вид спереди из листа с ракурсами (вырезать) | стандартное состояние |
| `fairy-happy.png` | поза с ноутбуком и бутылкой | шаг пройден, интро, финал |
| `fairy-thinking.png` | сгенерировать с тем же референсом | проверка идёт (`checking`) |
| `fairy-confused.png` | сгенерировать с тем же референсом | ошибка проверки |
| `fairy-celebrate.png` | сгенерировать с тем же референсом | миссия завершена, финал |
| `fairy-side.png` / `fairy-back.png` | вид сбоку / сзади из листа | опционально: «фея улетает» между миссиями |
| `bg/pattern-pink.jpg` | розовый паттерн | фон сцены |
| `sparkle.svg`, `wing.svg` | нарисовать/сгенерировать | блёстки, прогресс-крылья |

Для всех поз сохранять одинаковый масштаб и опорную точку (низ спрайта), чтобы при смене настроения фея не «прыгала».

---

## 3. Дизайн-токены

```css
/* app/src/styles/tokens.css */
:root {
  /* цвета: пипеткой уточнить по паттерну и персонажу, значения стартовые */
  --pink-400: #f58aa8;
  --pink-300: #f9a8be;
  --pink-100: #fde4ec;
  --lilac-300: #cdb4f6;
  --gold-400: #e8b84a;       /* акценты как у украшений феи */
  --ink-900: #3a2a3f;        /* основной текст, тёмный, не чёрный */
  --surface: rgba(255, 255, 255, 0.92);

  --radius-lg: 28px;         /* максимально округлые формы */
  --shadow-soft: 0 10px 30px rgba(232, 120, 160, 0.35);
}
```

Шрифты: заголовки `Fredoka`, текст `Nunito` (оба с Google Fonts, оба «круглые»). Кнопки крупные, скруглённые, с мягкой тенью; при наведении слегка подпрыгивают.

---

## 4. Архитектура

Пути адаптировать под фреймворк, который уже стоит в `app/` (Next/Vite).

```
app/src/
  content/
    missions.ts          # ВСЕ шаги и реплики данными, без логики в компонентах
    glossary.ts          # термины для тултипов
  engine/
    useMissionEngine.ts  # состояние, переходы, сохранение прогресса
    checks.ts            # функции автопроверок (изолированы!)
  components/
    Stage.tsx            # сцена: фон, шапка, фея, пузырь, зона действия
    Fairy.tsx            # спрайт + настроение + анимации
    SpeechBubble.tsx     # реплика с эффектом печатной машинки
    ActionZone.tsx       # рендерит action-компонент текущего шага
    WingsProgress.tsx    # прогресс 1–6 в виде крыльев
    Term.tsx             # <Term id="devnet"> с тултипом
    Sparkles.tsx         # всплеск блёсток при успехе
    ExplorerTrainer.tsx  # тренажёр Explorer (миссия 5)
    FinalBadge.tsx       # финальный экран
  actions/               # по одному компоненту на тип действия
    LinkAction.tsx, ManualConfirmAction.tsx, ConnectWalletAction.tsx,
    FaucetAction.tsx, CastSpellAction.tsx, SubmitFlagAction.tsx
```

### Модель данных шага

```ts
// content/missions.ts
type Mood = 'idle' | 'happy' | 'thinking' | 'confused' | 'celebrate';

type Step = {
  id: string;                       // '1.2', '4.2' ... сквозная нумерация
  title: string;                    // заголовок в зоне действия
  body: string;                     // 1–3 строки простым текстом, термины в скобках
  fairy: { mood: Mood; line: string };      // реплика при входе в шаг
  action: 'none' | 'link' | 'manual' | 'connect' | 'faucet' | 'cast' | 'trainer' | 'flag';
  check: 'none' | 'manual' | CheckId;       // чем подтверждается прохождение
  onPass?: { mood: Mood; line: string };    // реплика феи при успехе
  onFail?: Record<string, { mood: Mood; line: string }>; // причина → реплика
};

type Mission = { id: number; name: string; steps: Step[] };
```

---

## 5. Движок (`useMissionEngine`)

- Состояние: `missionIndex`, `stepIndex`, `status: 'idle' | 'checking' | 'passed' | 'failed'`, `failReason`.
- «Next» активна, только если `status === 'passed'`, либо шаг `check: 'none'`, либо ручное подтверждение нажато.
- Типы проверок: `auto` (подписка/опрос), `manual` (кнопка «I did it» / чекбокс), `none` (просто чтение).
- Сохранение прогресса: `localStorage`, ключ `fairydev:v1:<pubkey|anon>`. Любое чтение/запись в `try/catch`, при пустом хранилище начинаем с шага 1.1.
- Баланс отслеживаем через `connection.onAccountChange`, а не только опросом; опрос как запасной вариант раз в ~3 с с остановкой при размонтировании.
- Ошибки не показываются «сырыми»: движок мапит причину в реплику феи (см. раздел 7) и в одну строку подсказки в зоне действия.

---

## 6. Автопроверки (`engine/checks.ts`)

| Check ID | Как проверяем | Ограничение |
|---|---|---|
| `walletInstalled` | `readyState === Installed` у адаптера (Phantom) | после установки расширения нужна перезагрузка страницы, фея об этом говорит |
| `walletConnected` | `useWallet().connected` | — |
| `balancePositive` | `connection.getBalance(pubkey) > 0`, `connection` строго на devnet | это косвенно подтверждает и faucet, и devnet |
| `txConfirmed` | существующая отправка + `confirmTransaction`; сохранить `signature` в состояние | причины ошибок: отказ в кошельке, нет средств, не та сеть |
| `trainerHotspot` | клик по правильной области на скриншоте тренажёра | — |
| `flagValid` | существующая проверка флага | вынести в `checks.ts` |
| `manual` | кнопка «I did it» / чекбокс | для того, что приложение проверить не может |

**Важно по сети кошелька:** адаптер не умеет читать, на какой сети стоит кошелёк. Поэтому шаг «переключиться на Devnet» ручной, а реальная проверка происходит косвенно на шаге с балансом и на шаге с транзакцией. Если транзакция падает из-за сети, фея объясняет причину.

---

## 7. Миссии и шаги (контент)

Реплики феи: 1–2 коротких предложения, максимум одна шутка, термин в скобках при первом упоминании. Ниже стартовый вариант, дальше правим по вкусу.

### Миссия 1 — Get your wand (wallet)

| Шаг | Фея (EN) | Действие | Проверка |
|---|---|---|---|
| 1.1 Meet Fairydev | "Hi! I'm Fairydev, your fairy godfather. Today you cast a spell on Solana. I'll hold the beer." | кнопка Start | none |
| 1.2 Install Phantom | "A wallet is a magic pouch (wallet) for your keys. Phantom is the cutest one. Installed? Refresh, I'll wait." | ссылка на phantom.app/download | `walletInstalled` |
| 1.3 Create a wallet | "Click Create a new wallet and set a password. Easy peasy." | 3 строки инструкции | manual |
| 1.4 Save the phrase | "These words are your whole kingdom (Secret Recovery Phrase). Paper only. Never type them into any website, even mine." | чекбокс «I wrote it down offline» | manual |
| 1.5 Connect | "Now show me your wand!" | кнопка Select Wallet | `walletConnected` |

### Миссия 2 — Jump into the practice pond (Devnet)

| Шаг | Фея (EN) | Действие | Проверка |
|---|---|---|---|
| 2.1 Switch to Devnet | "Devnet is a practice pond (test network): the coins are fake, the splash is real." | пошаговая инструкция в Phantom (Settings → Developer Settings → Testnet Mode → Solana Devnet; **сверить с актуальным UI Phantom**) | manual |

### Миссия 3 — Collect fairy dust (devnet SOL)

| Шаг | Фея (EN) | Действие | Проверка |
|---|---|---|---|
| 3.1 Get dust | "Fairy dust (devnet SOL) pays for spells (fees). Copy your address, open the fountain (faucet)." | кнопка копирования адреса + ссылка на faucet, живой баланс | `balancePositive` |

Реплики ошибок: пока 0 → "Still 0 ✨. Dust takes a few seconds. Or the fountain is shy, try again in a bit." (лимиты faucet могут меняться, держать эту реплику общей).

### Миссия 4 — Cast the spell (transaction)

| Шаг | Фея (EN) | Действие | Проверка |
|---|---|---|---|
| 4.1 What is a spell | "A transaction is a spell (transaction) you sign with your wand. A pinch of dust pays for it." | чтение | none |
| 4.2 Cast it | "Press the button. Your wallet will ask permission. Say yes." | кнопка Cast spell | `txConfirmed` |
| 4.3 Get the receipt | "This receipt is your spell's ID (transaction signature). Keep it!" | сигнатура + кнопка копирования | none |

Реплики ошибок `txConfirmed`: `rejected` → "You said no in the wallet. Totally fair, but I need a yes."; `insufficient` → "Out of dust! Back to the fountain."; `network` → "Wrong pond! Switch your wallet to Devnet."

### Миссия 5 — Crystal ball training (Explorer)

| Шаг | Фея (EN) | Действие | Проверка |
|---|---|---|---|
| 5.1 Practice first | "Before the real crystal ball (block explorer), try my fake one. No pressure." | запуск тренажёра | none |
| 5.2 Find the logs (training) | "Find the echo of the spell (Program Instruction Logs)." | тренажёр: три экрана с горячими точками (сигнатура → раздел логов → строка `Program log:`) | `trainerHotspot` |
| 5.3 Open the real one | "Now the real thing!" | deep-link на Explorer (cluster=devnet) | manual |
| 5.4 Find the flag | "Scroll to Program Instruction Logs. Look for CTF{...}. It's the lost wing!" | кнопка «Peek at training» открывает скриншот-подсказку | manual |

Тренажёр использует **фальшивый флаг** (`CTF{practice_flag}`), чтобы не раскрывать настоящий. Скриншоты делаем с реальной транзакции на devnet, подсветка и пульсирующее кольцо накладываются поверх. Неверный клик → "Close! Warmer… the section is a bit lower."

### Миссия 6 — Return the lost wing (submit flag)

| Шаг | Фея (EN) | Действие | Проверка |
|---|---|---|---|
| 6.1 Submit | "Paste the wing here." | поле + Verify (существующая логика) | `flagValid` |
| 6.2 Finale | "You did it! You read the chain like a pro." | финальный экран, бейдж «Certified by Fairydev», что ты научился (кошелёк, devnet, транзакция, сигнатура, логи), кнопка «Play again» | none |

Опционально (если останется время): mint бейджа на devnet. Это требует изменений на стороне контракта/Metaplex и в ядро не входит.

---

## 8. Анимации (CSS, без лишних зависимостей)

- Фея: плавное «парение» (`translateY` ±6px, 3 с, бесконечно).
- Смена настроения: короткий кроссфейд между спрайтами (150–200 мс).
- Пузырь: появление «pop» и печатная машинка ~25 мс на символ, клик пропускает анимацию.
- Успех шага: `Sparkles` вокруг феи + реплика `onPass`.
- Прогресс: крылья заполняются блёстками по мере миссий.
- `prefers-reduced-motion`: отключить парение, блёстки и печатную машинку.

---

## 9. Глоссарий (`<Term>`)

Тултип при наведении/тапе, одно предложение на термин: wallet, Secret Recovery Phrase, devnet, faucet, SOL / lamports, fee, transaction, signature, program, program logs, block explorer, flag. Каждый термин объясняется там, где встретился, не отдельной страницей.

---

## 10. Порядок работ

1. **Основа:** токены, шрифты, `Stage` с фоном, `Fairy` (статичный спрайт), `SpeechBubble`.
2. **Движок:** `missions.ts` (пока 2–3 шага-заглушки), `useMissionEngine`, блокировка «Next», сохранение прогресса.
3. **Подключение существующей логики:** кошелёк, баланс, отправка транзакции, проверка флага → в `checks.ts` и action-компоненты. Сквозной путь 1.5 → 4.3 → 6.1 должен работать на devnet.
4. **Весь контент миссий 1–6** из раздела 7, реплики ошибок.
5. **Тренажёр Explorer** (миссия 5): скриншоты + горячие точки.
6. **Полировка:** анимации, глоссарий, мобильная версия, контраст, финальный экран.
7. **Деплой** (Vercel/Netlify), подставить Live demo URL в README, добавить GIF/скриншоты сцены.

**Что режем первым, если не хватает времени:** mint бейджа, виды сбоку/сзади, крылья-прогресс (заменить обычной полоской), три экрана тренажёра (оставить один аннотированный скриншот).

---

## 11. Стыки с остальной командой

- **Program ID** берётся из одной константы/`.env`, в UI не хардкодим.
- **Контракт:** если флаг станет уникальным для игрока, меняется только проверка `flagValid` в `checks.ts` и текст шага 5.4. Остальной фронт не затрагивается, поэтому проверки изолированы.
- **README:** после деплоя добавить Live demo URL, GIF сцены, обновить раздел «How to Play» под новые миссии 1–6.

---

## 12. Критерии приёмки

- Новичок проходит путь от нуля до флага, не открывая документацию, только внешние сайты (установка Phantom, faucet, Explorer).
- Ни один шаг не пропускается: «Next» заблокирована до прохождения проверки.
- Нет стопок карточек, аккордеонов и боковых подсказок. Раскладка A на десктопе и мобильном.
- Каждая возможная ошибка проверки имеет конкретную реплику феи.
- Нумерация миссий сквозная 1–6.
- Текст читается: контраст не ниже AA, текст не лежит на паттерне.
- Прогон «глазами новичка»: человек, не работавший с Solana, проходит весь путь без вопросов к команде.
