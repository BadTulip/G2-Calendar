import { 
  waitForEvenAppBridge, 
  TextContainerProperty, 
  OsEventTypeList,
  CreateStartUpPageContainer,
  RebuildPageContainer
} from '@evenrealities/even_hub_sdk';

// Configurazione e Stato
interface AppConfig {
  locale: string;
  weekStart: number; // 0 = Domenica, 1 = Lunedì
  devMode: boolean;
}

// Inizializzazione sicura della configurazione
const getStoredConfig = (): AppConfig => {
  try {
    const locale = localStorage.getItem('calendar_locale') || 'it';
    const weekStartRaw = localStorage.getItem('calendar_weekstart');
    const weekStart = (weekStartRaw === '0' || weekStartRaw === '1') ? parseInt(weekStartRaw) : 1;
    const devMode = localStorage.getItem('calendar_devmode') === 'true';
    return { locale, weekStart, devMode };
  } catch (e) {
    return { locale: 'it', weekStart: 1, devMode: false };
  }
};

let config: AppConfig = getStoredConfig();

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let viewState: 'calendar' | 'clock' = 'calendar';
let debugText = "v3.1.1";

const translations: Record<string, any> = {
  it: { 
    gestures: "Gestures & Comandi", 
    up: "Sopra ↑ : Mese Successivo", 
    down: "Sotto ↓ : Mese Precedente", 
    click: "Click : Oggi / Minimal", 
    double: "Doppio Click : Esci dall'App", 
    devMode: "Developer Mode",
    subtitle: "Personalizza la tua esperienza sui G2",
    langApp: "Lingua Applicazione",
    weekStart: "Inizio Settimana",
    monday: "Lunedì",
    sunday: "Domenica",
    footer: "Le modifiche vengono applicate istantaneamente ai tuoi occhiali."
  },
  en: { 
    gestures: "Gestures & Controls", 
    up: "Up ↑ : Next Month", 
    down: "Down ↓ : Previous Month", 
    click: "Click : Today / Minimal", 
    double: "Double Click : Exit App", 
    devMode: "Developer Mode",
    subtitle: "Customize your experience on G2",
    langApp: "Application Language",
    weekStart: "Week Start",
    monday: "Monday",
    sunday: "Sunday",
    footer: "Changes are applied instantly to your glasses."
  },
  es: { 
    gestures: "Gestos y Controles", 
    up: "Arriba ↑ : Mes Siguiente", 
    down: "Abajo ↓ : Mes Anterior", 
    click: "Click : Hoy / Minimal", 
    double: "Doble Click : Salir de la App", 
    devMode: "Modo Desarrollador",
    subtitle: "Personaliza tu experiencia en G2",
    langApp: "Idioma de la aplicación",
    weekStart: "Inicio de la semana",
    monday: "Lunes",
    sunday: "Domingo",
    footer: "Los cambios se aplican al instante en tus gafas."
  },
  de: { 
    gestures: "Gesten & Steuerung", 
    up: "Hoch ↑ : Nächster Monat", 
    down: "Runter ↓ : Vorheriger Monat", 
    click: "Klick : Heute / Minimal", 
    double: "Doppelklick : App Beenden", 
    devMode: "Entwicklermodus",
    subtitle: "Passen Sie Ihr G2-Erlebnis an",
    langApp: "Anwendungssprache",
    weekStart: "Wochenbeginn",
    monday: "Montag",
    sunday: "Sonntag",
    footer: "Änderungen werden sofort auf Ihre Brille übertragen."
  },
  fr: { 
    gestures: "Gestes et Commandes", 
    up: "Haut ↑ : Mois Suivant", 
    down: "Bas ↓ : Mois Précédent", 
    click: "Clic : Aujourd'hui / Minimal", 
    double: "Double Clic : Quitter l'App", 
    devMode: "Mode Développeur",
    subtitle: "Personnalisez votre expérience G2",
    langApp: "Langue de l'application",
    weekStart: "Début de la semaine",
    monday: "Lundi",
    sunday: "Dimanche",
    footer: "Les modifications sont appliquées instantanément à vos lunettes."
  },
  zh: { 
    gestures: "手势与控制", 
    up: "向上 ↑ : 下一个月", 
    down: "向下 ↓ : 上一个月", 
    click: "单击 : 今天 / 极简模式", 
    double: "双击 : 退出应用", 
    devMode: "开发模式",
    subtitle: "自定义您的 G2 体验",
    langApp: "应用语言",
    weekStart: "每周开始于",
    monday: "星期一",
    sunday: "星期日",
    footer: "更改将立即应用到您的眼镜上。"
  },
  ja: { 
    gestures: "ジェスチャーとコントロール", 
    up: "上 ↑ : 翌月", 
    down: "下 ↓ : 前月", 
    click: "クリック : 今日 / ミニマル", 
    double: "ダブルクリック : アプリを終了", 
    devMode: "開発モード",
    subtitle: "G2体験をカスタマイズする",
    langApp: "アプリの言語",
    weekStart: "週の始まり",
    monday: "月曜日",
    sunday: "日曜日",
    footer: "変更は即座にメガネに適用されます。"
  },
  ko: { 
    gestures: "제스처 및 제어", 
    up: "위 ↑ : 다음 달", 
    down: "아래 ↓ : 이전 달", 
    click: "클릭 : 오늘 / 최소화", 
    double: "더블 클릭 : 앱 종료", 
    devMode: "개발자 모드",
    subtitle: "G2 경험 사용자 정의",
    langApp: "애플리케이션 언어",
    weekStart: "주 시작일",
    monday: "월요일",
    sunday: "일요일",
    footer: "변경 사항이 안경에 즉시 적용됩니다."
  }
};

async function init() {
  try {
    setupPhoneUI();
    const bridge = await waitForEvenAppBridge();
    console.log("Bridge pronto - Versione 3.1.1");

    const page = generateCurrentPage();
    await bridge.createStartUpPageContainer(page);

    bridge.onEvenHubEvent(async (event) => {
      const rawType = event.textEvent?.eventType ?? event.sysEvent?.eventType ?? (event as any).type ?? (event as any).eventType;
      const source = event.textEvent ? 'TXT' : (event.sysEvent ? 'SYS' : 'RAW');
      const cid = event.textEvent?.containerID ?? '?';
      
      debugText = `ID:${cid} ${source}:${rawType}`;

      switch (rawType) {
        // Doppio click sulla root page → exit dialogue (policy Even Hub)
        case OsEventTypeList.DOUBLE_CLICK_EVENT:
        case 3:
        case 'enterx2':
          await (bridge as any).shutDownPageContainer(1);
          break;

        case OsEventTypeList.CLICK_EVENT:
        case 0:
        case undefined:
        case null:
        case 'enter':
        case 'click':
          const today = new Date();
          const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth();
          
          if (!isCurrentMonth) {
            currentYear = today.getFullYear();
            currentMonth = today.getMonth();
            viewState = 'calendar';
          } else {
            viewState = viewState === 'calendar' ? 'clock' : 'calendar';
          }
          await updateDisplay();
          break;

        case OsEventTypeList.SCROLL_TOP_EVENT:
        case 1:
        case 'up':
          if (viewState === 'clock') viewState = 'calendar';
          currentMonth++;
          if (currentMonth > 11) { currentMonth = 0; currentYear++; }
          await updateDisplay();
          break;

        case OsEventTypeList.SCROLL_BOTTOM_EVENT:
        case 2:
        case 'down':
          if (viewState === 'clock') viewState = 'calendar';
          currentMonth--;
          if (currentMonth < 0) { currentMonth = 11; currentYear--; }
          await updateDisplay();
          break;
          
        default:
          if (config.devMode) await updateDisplay();
      }
    });
  } catch (err) {
    console.error("Errore fatale in init:", err);
    document.body.innerHTML += `<div style="color:red; padding:20px;">ERRORE: ${err}</div>`;
  }
}

function setupPhoneUI() {
  const langSelect = document.getElementById('langSelect') as HTMLSelectElement;
  const startMon = document.getElementById('startMon');
  const startSun = document.getElementById('startSun');
  const gestureList = document.getElementById('gestureList');
  const devOn = document.getElementById('devOn');
  const devOff = document.getElementById('devOff');
  const labelGestures = document.getElementById('labelGestures');
  const labelDevMode = document.getElementById('labelDevMode');
  const subtitle = document.getElementById('subtitle');
  const labelLang = document.getElementById('labelLang');
  const labelWeekStart = document.getElementById('labelWeekStart');
  const footerText = document.getElementById('footerText');

  const updateUIStrings = () => {
    const lang = config.locale;
    const t = translations[lang] || translations['en'];
    if (gestureList) {
      gestureList.innerHTML = `
        • ${t.up}<br>
        • ${t.down}<br>
        • ${t.click}<br>
        • ${t.double}
      `;
    }
    if (labelGestures) labelGestures.innerText = t.gestures;
    if (labelDevMode) labelDevMode.innerText = t.devMode;
    if (subtitle) subtitle.innerText = `${t.subtitle} (${debugText})`;
    if (labelLang) labelLang.innerText = t.langApp;
    if (labelWeekStart) labelWeekStart.innerText = t.weekStart;
    if (startMon) startMon.innerText = t.monday;
    if (startSun) startSun.innerText = t.sunday;
    if (footerText) footerText.innerText = t.footer;
  };

  if (langSelect) {
    langSelect.value = config.locale;
    langSelect.onchange = () => {
      config.locale = langSelect.value;
      localStorage.setItem('calendar_locale', config.locale);
      updateUIStrings();
      updateDisplay().catch(() => {});
    };
  }

  if (startMon && startSun) {
    const updateButtons = () => {
      startMon.classList.toggle('active', config.weekStart === 1);
      startSun.classList.toggle('active', config.weekStart === 0);
    };
    updateButtons();

    startMon.onclick = () => {
      config.weekStart = 1;
      localStorage.setItem('calendar_weekstart', '1');
      updateButtons();
      updateDisplay().catch(() => {});
    };
    startSun.onclick = () => {
      config.weekStart = 0;
      localStorage.setItem('calendar_weekstart', '0');
      updateButtons();
      updateDisplay().catch(() => {});
    };
  }

  if (devOn && devOff) {
    const updateDevButtons = () => {
      devOn.classList.toggle('active', config.devMode === true);
      devOff.classList.toggle('active', config.devMode === false);
    };
    updateDevButtons();

    devOn.onclick = () => {
      config.devMode = true;
      localStorage.setItem('calendar_devmode', 'true');
      updateDevButtons();
      updateDisplay().catch(() => {});
    };
    devOff.onclick = () => {
      config.devMode = false;
      localStorage.setItem('calendar_devmode', 'false');
      updateDevButtons();
      updateDisplay().catch(() => {});
    };
  }
  
  updateUIStrings();
}

function generateCurrentPage() {
  return viewState === 'calendar' ? generateCalendarPage() : generateClockPage();
}

function generateClockPage() {
  const now = new Date();
  const dayName = now.toLocaleDateString(config.locale, { weekday: 'short' }).toUpperCase();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear().toString().slice(-2);
  const timeStr = now.toLocaleTimeString(config.locale, { hour: '2-digit', minute: '2-digit' });
  
  const displayContent = `${dayName} ${day}/${month}/${year} ${timeStr}`;
  
  const containers: TextContainerProperty[] = [];
  
  containers.push(new TextContainerProperty({
    xPosition: 0, yPosition: 0, width: 576, height: 288,
    containerID: 1, containerName: 'event_catcher',
    content: ' ', isEventCapture: 1, borderWidth: 0, paddingLength: 0
  }));

  if (config.devMode) {
    containers.push(new TextContainerProperty({
      xPosition: 10, yPosition: 10, width: 150, height: 30,
      containerID: 2, containerName: 'debug',
      content: debugText, isEventCapture: 0, borderWidth: 0, paddingLength: 0
    }));
  }

  containers.push(new TextContainerProperty({
    xPosition: 200, yPosition: 10, width: 360, height: 60,
    containerID: config.devMode ? 3 : 2, containerName: 'clock',
    content: displayContent, isEventCapture: 0, borderWidth: 0, paddingLength: 0
  }));

  return new CreateStartUpPageContainer({
    containerTotalNum: containers.length,
    textObject: containers
  });
}

function generateCalendarPage() {
  const monthNum = (currentMonth + 1).toString().padStart(2, '0');
  const monthName = new Intl.DateTimeFormat(config.locale, { month: 'long' }).format(new Date(currentYear, currentMonth));
  const titleText = `${monthNum} -- ${monthName.toUpperCase()} ${currentYear} --`; 
  const displayTitle = config.devMode ? `    ${titleText}    [${debugText}]` : `    ${titleText}`;

  const containers: TextContainerProperty[] = [];

  containers.push(new TextContainerProperty({
    xPosition: 0, yPosition: 0, width: 576, height: 288,
    containerID: 1, containerName: 'header',
    content: `\n${displayTitle}`, isEventCapture: 1, borderWidth: 0, paddingLength: 0
  }));

  const dayNames: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dayIndex = (i + config.weekStart) % 7;
    const date = new Date(2024, 0, dayIndex === 0 ? 7 : dayIndex); 
    const name = new Intl.DateTimeFormat(config.locale, { weekday: 'narrow' }).format(date);
    dayNames.push(name.toUpperCase());
  }
  
  containers.push(new TextContainerProperty({
    xPosition: 180, yPosition: 60, width: 30, height: 200,
    containerID: 2, containerName: 'col_names',
    content: dayNames.join('\n'), isEventCapture: 0, borderWidth: 0, paddingLength: 0
  }));

  const weeks: string[][] = Array(6).fill(0).map(() => Array(7).fill('  '));
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  let firstDayIndex = firstDayOfMonth - config.weekStart;
  if (firstDayIndex < 0) firstDayIndex += 7;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  let currentWeek = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayIndex = (firstDayIndex + d - 1) % 7;
    const formattedDay = d.toString().padStart(2, ' ');
    weeks[currentWeek][dayIndex] = formattedDay;
    if (dayIndex === 6) currentWeek++;
  }

  const START_X = 210; 
  const COL_WIDTH = 35; 
  
  for (let w = 0; w < 6; w++) {
    containers.push(new TextContainerProperty({
      xPosition: START_X + (w * COL_WIDTH),
      yPosition: 60,
      width: COL_WIDTH,
      height: 200,
      containerID: w + 3,
      containerName: `col_week_${w}`,
      content: weeks[w].join('\n'), 
      isEventCapture: 0,
      borderWidth: 0,
      paddingLength: 0
    }));
  }

  return new CreateStartUpPageContainer({
    containerTotalNum: containers.length, 
    textObject: containers
  });
}

async function updateDisplay() {
  const bridge = await waitForEvenAppBridge();
  const pageData = generateCurrentPage();
  
  await (bridge as any).rebuildPageContainer(new RebuildPageContainer({
    containerTotalNum: pageData.containerTotalNum,
    textObject: pageData.textObject
  }));
}

// Avvio
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
