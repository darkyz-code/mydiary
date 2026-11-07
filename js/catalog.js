'use strict';
(function (H) {
  const EMOTIONS = [
    { id: 'joy', name: 'Радость', e: '😊', v: 1, g: 'pos' },
    { id: 'neutral', name: 'Нейтрально', e: '😐', v: 0, g: 'pos' },
    { id: 'calm', name: 'Спокойствие', e: '😌', v: 1, g: 'pos' },
    { id: 'inspired', name: 'Воодушевление', e: '🤩', v: 1, g: 'pos', rare: true },
    { id: 'tender', name: 'Нежность', e: '🥰', v: 1, g: 'pos', rare: true },
    { id: 'interest', name: 'Интерес', e: '🧐', v: 1, g: 'pos' },
    { id: 'grateful', name: 'Благодарность', e: '🙏', v: 1, g: 'pos' },
    { id: 'love', name: 'Любовь', e: '💗', v: 1, g: 'pos', rare: true },
    { id: 'peace', name: 'Умиротворение', e: '🕊️', v: 1, g: 'pos', rare: true },
    { id: 'light', name: 'Лёгкость', e: '🍃', v: 1, g: 'pos' },
    { id: 'confident', name: 'Уверенность', e: '💪', v: 1, g: 'pos', rare: true },
    { id: 'proud', name: 'Гордость за себя', e: '🏆', v: 1, g: 'pos', rare: true },
    { id: 'hope', name: 'Надежда', e: '🌱', v: 1, g: 'pos', rare: true },
    { id: 'playful', name: 'Игривость', e: '😜', v: 1, g: 'pos', rare: true },
    { id: 'cozy', name: 'Уют и тепло', e: '☕', v: 1, g: 'pos' },
    { id: 'relief', name: 'Облегчение', e: '😅', v: 1, g: 'pos' },
    { id: 'motivated', name: 'Мотивация', e: '🔥', v: 1, g: 'pos' },
    { id: 'delight', name: 'Восторг', e: '🥳', v: 1, g: 'pos', rare: true },
    { id: 'content', name: 'Удовлетворение', e: '☺️', v: 1, g: 'pos', rare: true },
    { id: 'anticip', name: 'Радостное ожидание', e: '🎈', v: 1, g: 'pos', rare: true },
    { id: 'sad', name: 'Грусть', e: '😢', v: -1, g: 'low' },
    { id: 'melancholy', name: 'Меланхолия', e: '🌧️', v: -1, g: 'low' },
    { id: 'depressed', name: 'Подавленность', e: '😞', v: -1, g: 'low' },
    { id: 'apathy', name: 'Апатия', e: '😶', v: -1, g: 'low' },
    { id: 'empty', name: 'Пустота', e: '🕳️', v: -1, g: 'low' },
    { id: 'anxiety', name: 'Тревога', e: '😰', v: -1, g: 'tense' },
    { id: 'fear', name: 'Страх', e: '😨', v: -1, g: 'tense' },
    { id: 'irritation', name: 'Раздражение', e: '😤', v: -1, g: 'tense' },
    { id: 'anger', name: 'Злость, агрессия', e: '😠', v: -1, g: 'tense' },
    { id: 'tearful', name: 'Плаксивость', e: '🥺', v: -1, g: 'low' },
    { id: 'lonely', name: 'Одиночество', e: '🌙', v: -1, g: 'low' },
    { id: 'guilt', name: 'Вина, стыд', e: '😣', v: -1, g: 'tense' },
    { id: 'overwhelmed', name: 'Перегруженность', e: '🤯', v: -1, g: 'tense' },
    { id: 'swings', name: 'Перепады настроения', e: '🎢', v: -1, g: 'tense' },
    { id: 'emotired', name: 'Эмоциональная усталость', e: '😩', v: -1, g: 'low' },
  ];

  const EMO_GROUPS = [
    { id: 'pos', name: 'Приятные и ровные' },
    { id: 'low', name: 'Грусть и упадок сил' },
    { id: 'tense', name: 'Тревога и напряжение' },
  ];

  const EMOJI_PICK = ['🙂', '😊', '😇', '😌', '🤍', '✨', '🌸', '🌙', '☀️', '🌧️', '🌊', '🍂', '🔥', '❄️', '💧', '🎵', '😐', '😕', '😟', '😣', '😤', '😶', '🤔', '💭'];

  const ZONES = {
    head: 'Голова',
    chest: 'Грудь и сердце',
    stomach: 'Живот',
    pelvis: 'Низ живота',
    hands: 'Руки',
    legs: 'Ноги',
    body: 'Всё тело',
  };

  const SYMPTOM_GROUPS = [
    { id: 'base', name: 'Основное' },
    { id: 'iron', name: 'Признаки нехватки железа' },
    { id: 'gi', name: 'Желудок и кишечник' },
    { id: 'side', name: 'Возможные побочные эффекты препаратов' },
    { id: 'other', name: 'Другое' },
    { id: 'custom', name: 'Мои симптомы' },
  ];

  const SYMPTOMS = [
    { id: 'sleepiness', name: 'Сонливость', g: 'base', z: 'head', base: true },
    { id: 'weakness', name: 'Слабость', g: 'base', z: 'body', base: true },
    { id: 'dizziness', name: 'Головокружение', g: 'base', z: 'head', base: true },
    { id: 'headache', name: 'Головная боль', g: 'base', z: 'head', base: true },
    { id: 'fog', name: 'Туман в голове, рассеянность', g: 'base', z: 'head', base: true },

    { id: 'hairloss', name: 'Выпадение волос', g: 'iron', z: 'head' },
    { id: 'coldlimbs', name: 'Холодные руки и ноги', g: 'iron', z: 'hands' },
    { id: 'breath', name: 'Одышка при нагрузке', g: 'iron', z: 'chest' },
    { id: 'palpit', name: 'Сердцебиение', g: 'iron', z: 'chest' },
    { id: 'rls', name: 'Беспокойные ноги', g: 'iron', z: 'legs' },
    { id: 'nails', name: 'Ломкие ногти', g: 'iron', z: 'hands' },
    { id: 'pica', name: 'Тяга к льду, мелу', g: 'iron', z: 'head' },
    { id: 'pale', name: 'Бледность', g: 'iron', z: 'head' },
    { id: 'orthostatic', name: 'Темнеет в глазах при вставании', g: 'iron', z: 'head' },

    { id: 'nausea', name: 'Тошнота', g: 'gi', z: 'stomach' },
    { id: 'stomachache', name: 'Боль в животе', g: 'gi', z: 'stomach' },
    { id: 'bloating', name: 'Вздутие', g: 'gi', z: 'stomach' },
    { id: 'constipation', name: 'Запор', g: 'gi', z: 'stomach' },
    { id: 'diarrhea', name: 'Диарея', g: 'gi', z: 'stomach' },
    { id: 'heartburn', name: 'Изжога', g: 'gi', z: 'chest' },

    { id: 'sweating', name: 'Потливость', g: 'side', z: 'body' },
    { id: 'tremor', name: 'Дрожь в руках', g: 'side', z: 'hands' },
    { id: 'drymouth', name: 'Сухость во рту', g: 'side', z: 'head' },
    { id: 'dreams', name: 'Яркие сны, кошмары', g: 'side', z: 'head' },
    { id: 'restless', name: 'Внутреннее беспокойство', g: 'side', z: 'chest' },
    { id: 'blunting', name: 'Притуплённость эмоций', g: 'side', z: 'head' },
    { id: 'libido', name: 'Снижение либидо', g: 'side', z: 'pelvis' },
    { id: 'insomnia', name: 'Трудно уснуть', g: 'side', z: 'head' },

    { id: 'musclepain', name: 'Боль в мышцах', g: 'other', z: 'legs' },
    { id: 'jointpain', name: 'Боль в суставах', g: 'other', z: 'legs' },
    { id: 'backpain', name: 'Боль в спине', g: 'other', z: 'body' },
    { id: 'swelling', name: 'Отёки', g: 'other', z: 'legs' },
    { id: 'chestpain', name: 'Боль в груди', g: 'other', z: 'chest' },
    { id: 'breast', name: 'Чувствительность груди', g: 'other', z: 'chest' },
    { id: 'pelvicpain', name: 'Боль внизу живота', g: 'other', z: 'pelvis' },
    { id: 'cold', name: 'Насморк, горло', g: 'other', z: 'head' },
    { id: 'chills', name: 'Озноб', g: 'other', z: 'body' },
    { id: 'skin', name: 'Высыпания на коже', g: 'other', z: 'body' },
  ];

  const PMS = [
    { id: 'appetite', name: 'Повышенный аппетит' },
    { id: 'sweets', name: 'Тяга к сладкому' },
    { id: 'bloating', name: 'Вздутие' },
    { id: 'irritability', name: 'Раздражительность' },
    { id: 'tearful', name: 'Плаксивость' },
    { id: 'breast', name: 'Боль в груди' },
    { id: 'acne', name: 'Высыпания' },
    { id: 'swelling', name: 'Отёки' },
    { id: 'cramps', name: 'Спазмы' },
    { id: 'swings', name: 'Перепады настроения' },
    { id: 'fatigue', name: 'Усталость' },
    { id: 'headache', name: 'Головная боль' },
  ];

  const FLOW = [
    { id: 'spot', name: 'Мажущие', v: 1 },
    { id: 'light', name: 'Скудные', v: 2 },
    { id: 'medium', name: 'Умеренные', v: 3 },
    { id: 'heavy', name: 'Обильные', v: 4 },
    { id: 'vheavy', name: 'Очень обильные', v: 5 },
  ];

  const DREAMS = [
    { id: 'none', name: 'Не было / не помню' }, { id: 'usual', name: 'Обычные' }, { id: 'nice', name: 'Приятные' }, { id: 'vivid', name: 'Яркие' },
    { id: 'strange', name: 'Странные' }, { id: 'anxious', name: 'Тревожные' }, { id: 'nightmare', name: 'Кошмары' }, { id: 'lucid', name: 'Осознанные' },
  ];
  const LATENCY = [
    { id: 'q', name: 'до 15 мин', v: 10 }, { id: 'm', name: '15–30 мин', v: 22 }, { id: 'l', name: '30–60 мин', v: 45 }, { id: 'xl', name: 'больше часа', v: 75 },
  ];

  const ACTIVITIES = ['Работа', 'Учёба', 'Домашние дела', 'Прогулка', 'Спорт', 'Друзья', 'Семья', 'Отдых', 'Творчество',
    'Чтение', 'Кино, сериалы', 'Врач, процедуры', 'Поездка', 'Покупки', 'Весь день лежала'];

  const ACTIVITY_LEVEL = [
    { id: 'none', name: 'Не было' },
    { id: 'light', name: 'Лёгкая' },
    { id: 'moderate', name: 'Умеренная' },
    { id: 'intense', name: 'Интенсивная' },
  ];
  const SOCIAL = [
    { id: 'alone', name: 'Была одна' },
    { id: 'some', name: 'Немного общения' },
    { id: 'lot', name: 'Много общения' },
  ];

  const MED_KINDS = [
    { id: 'antidepressant', name: 'Антидепрессант', color: '#8b7cf6' },
    { id: 'iron', name: 'Препарат железа', color: '#e0605a' },
    { id: 'vitamin', name: 'Витамины', color: '#f0a43a' },
    { id: 'hormone', name: 'Гормоны', color: '#ec6fa5' },
    { id: 'other', name: 'Другое', color: '#4aa3f0' },
  ];
  const SLOT_NAMES = { 1: ['Утро'], 2: ['Утро', 'Вечер'], 3: ['Утро', 'День', 'Вечер'], 4: ['Утро', 'День', 'Вечер', 'Ночь'] };

  const LAB_PRESETS = [
    { key: 'ferritin', name: 'Ферритин', unit: 'нг/мл', min: 15, max: 150, note: 'Отражает запасы железа. Многие врачи считают желательным уровень от 30–50 нг/мл. При воспалении может быть ложно нормальным.' },
    { key: 'hb', name: 'Гемоглобин', unit: 'г/л', min: 120, max: 150 },
    { key: 'iron', name: 'Сывороточное железо', unit: 'мкмоль/л', min: 9, max: 30.4, note: 'Сильно колеблется в течение дня и от еды, поэтому сам по себе мало информативен.' },
    { key: 'tibc', name: 'ОЖСС', unit: 'мкмоль/л', min: 45, max: 77 },
    { key: 'transferrin', name: 'Трансферрин', unit: 'г/л', min: 2, max: 3.6 },
    { key: 'tsat', name: 'Насыщение трансферрина', unit: '%', min: 15, max: 50 },
    { key: 'rbc', name: 'Эритроциты', unit: '×10¹²/л', min: 3.8, max: 5.1 },
    { key: 'mcv', name: 'MCV (объём эритроцита)', unit: 'фл', min: 80, max: 100 },
    { key: 'mch', name: 'MCH (гемоглобин в эритроците)', unit: 'пг', min: 27, max: 34 },
    { key: 'plt', name: 'Тромбоциты', unit: '×10⁹/л', min: 150, max: 400 },
    { key: 'wbc', name: 'Лейкоциты', unit: '×10⁹/л', min: 4, max: 9 },
    { key: 'esr', name: 'СОЭ', unit: 'мм/ч', min: 2, max: 20 },
    { key: 'b12', name: 'Витамин B12', unit: 'пг/мл', min: 187, max: 883 },
    { key: 'folate', name: 'Фолиевая кислота', unit: 'нг/мл', min: 3.1, max: 20.5 },
    { key: 'vitd', name: 'Витамин D (25-OH)', unit: 'нг/мл', min: 30, max: 100 },
    { key: 'tsh', name: 'ТТГ', unit: 'мкМЕ/мл', min: 0.4, max: 4.0 },
    { key: 'ft4', name: 'Т4 свободный', unit: 'пмоль/л', min: 9, max: 19 },
    { key: 'crp', name: 'С-реактивный белок', unit: 'мг/л', min: 0, max: 5 },
    { key: 'glucose', name: 'Глюкоза натощак', unit: 'ммоль/л', min: 4.1, max: 5.9 },
    { key: 'mg', name: 'Магний', unit: 'ммоль/л', min: 0.66, max: 1.07 },
  ];

  const THEMES = [
    { id: 'silver', name: 'Серебро', desc: 'Хром, перламутр и тонкие линии', sw: ['#0b0c10', '#5d6573', '#c9d6ff'], accent: '#c8ced8' },
    { id: 'glass', name: 'Liquid Glass', desc: 'Светлое матовое стекло', sw: ['#f3eefb', '#c9b8ff', '#ffd0e4'], accent: '#8b7cf6' },
    { id: 'night', name: 'Полночь', desc: 'Тёмное стекло', sw: ['#141428', '#3b2f72', '#6a2f5f'], accent: '#8b7cf6' },
    { id: 'powder', name: 'Пудра', desc: 'Тёплые пастельные тона', sw: ['#fbf1ea', '#f6c9b8', '#e9d3f0'], accent: '#f0816a' },
    { id: 'minimal', name: 'Минимал', desc: 'Чисто и без эффектов', sw: ['#f6f6f4', '#ffffff', '#e4e4e0'], accent: '#5b6cf0' },
    { id: 'aurora', name: 'Сияние', desc: 'Тёмный фон и яркие переливы', sw: ['#0c1a1f', '#1f6f73', '#5a3c8c'], accent: '#3fbf9a' },
  ];

  const ACCENTS = ['#c8ced8', '#8b7cf6', '#ec6fa5', '#f0816a', '#e9a23b', '#3fbf9a', '#4aa3f0', '#5b6cf0', '#7fa37a', '#b04a8f', '#6b7280'];

  const SILHOUETTES = [
    { id: 'chrome', name: 'Хром' },
    { id: 'line', name: 'Линии' },
    { id: 'soft', name: 'Мягкая' },
    { id: 'abstract', name: 'Абстрактная' },
  ];

  const BLOCKS = [
    { id: 'general', name: 'Общее самочувствие', ic: 'sparkle' },
    { id: 'emotions', name: 'Эмоциональное состояние', ic: 'mind' },
    { id: 'physical', name: 'Физическое состояние', ic: 'body' },
    { id: 'sleep', name: 'Сон', ic: 'moon' },
    { id: 'cycle', name: 'Цикл', ic: 'flower' },
    { id: 'meds', name: 'Лекарства', ic: 'pill' },
    { id: 'lifestyle', name: 'Питание и образ жизни', ic: 'leaf', optional: true },
    { id: 'vitals', name: 'Показатели', ic: 'pulse', optional: true },
    { id: 'photo', name: 'Фото дня', ic: 'camera' },
    { id: 'complaints', name: 'Жалобы', ic: 'note' },
    { id: 'thoughts', name: 'Мои мысли', ic: 'feather' },
    { id: 'activities', name: 'Чем занималась', ic: 'list' },
  ];

  const TIPS = [
    'Дневной свет утром помогает настроить внутренние часы: даже 10–15 минут у окна или на улице.',
    'Старайся ложиться и вставать примерно в одно и то же время, даже в выходные.',
    'Маленькие шаги тоже считаются. Сегодня достаточно сделать одно приятное дело для себя.',
    'Если принимаешь железо — чай, кофе и молочное лучше отодвинуть от таблетки примерно на 2 часа.',
    'Вода — простой способ помочь себе при слабости и головной боли.',
    'Короткая прогулка часто помогает больше, чем кажется, когда совсем нет сил.',
    'Запиши хотя бы одну хорошую вещь за сегодня, пусть даже совсем маленькую.',
    'Не отменяй и не меняй дозу антидепрессанта самостоятельно — если что-то беспокоит, расскажи врачу.',
    'Перед визитом к врачу выгрузи PDF за последние недели — так проще ничего не забыть.',
    'Общение с близкими — тоже забота о себе. Можно просто написать кому-то пару строк.',
    'Экраны за час до сна мешают засыпанию: попробуй книгу или тёплый душ.',
    'Железо из растительных продуктов (бобовые, крупы, зелень) лучше усваивается вместе с витамином C. Но при низком ферритине одной диеты обычно мало — нужен план врача.',
  ];

  Object.assign(H, { DREAMS, LATENCY, EMOJI_PICK, EMO_GROUPS, EMOTIONS, ZONES, SYMPTOM_GROUPS, SYMPTOMS, PMS, FLOW, ACTIVITIES, ACTIVITY_LEVEL, SOCIAL, MED_KINDS, SLOT_NAMES, LAB_PRESETS, THEMES, ACCENTS, SILHOUETTES, BLOCKS, TIPS });
})(window.H);
/* v1.7: emotion model — circumplex coordinates (valence, arousal in -1..1), own colour and a poetic colour name */
(function (H) {
  H.EMO_MODEL = {
    neutral: [0, -.1, '#b9bec9', 'Серебристый туман', 'тумана'],
    joy: [.8, .5, '#ffd36e', 'Солнечный янтарь', 'янтаря'], calm: [.55, -.6, '#9fe6d0', 'Морская бирюза', 'бирюзы'],
    inspired: [.8, .75, '#ff9fd2', 'Розовый рассвет', 'рассвета'], tender: [.7, -.25, '#ffc2d6', 'Пудровый шёлк', 'пудры'],
    interest: [.55, .45, '#ffb36b', 'Мандариновый свет', 'мандарина'], grateful: [.7, -.1, '#f7d9a0', 'Тёплый мёд', 'мёда'],
    love: [.9, .35, '#ff7aa8', 'Гранатовое сердце', 'граната'], peace: [.6, -.75, '#a8e6ff', 'Тихое небо', 'неба'],
    light: [.65, .1, '#e9f2ff', 'Лунный жемчуг', 'жемчуга'], confident: [.65, .35, '#ffcf5a', 'Золотая сталь', 'золота'],
    proud: [.7, .4, '#f5b84a', 'Медовое золото', 'золота'], hope: [.55, .15, '#b8f5a0', 'Весенняя листва', 'листвы'],
    playful: [.75, .65, '#ff9bf0', 'Фуксиевая искра', 'фуксии'], cozy: [.65, -.5, '#e8a87c', 'Карамельный плед', 'карамели'],
    relief: [.5, -.55, '#b6f0e4', 'Мятный выдох', 'мяты'], motivated: [.6, .7, '#ff8a5c', 'Коралловый огонь', 'коралла'],
    delight: [.9, .8, '#ffe066', 'Искристое шампанское', 'шампанского'], content: [.6, -.3, '#d8f0b0', 'Луговой свет', 'луга'],
    anticip: [.6, .55, '#ffb0e0', 'Розовая сирень', 'сирени'],
    sad: [-.65, -.4, '#6f8fd8', 'Дождливый сапфир', 'сапфира'], melancholy: [-.4, -.45, '#8a94c8', 'Сизые сумерки', 'сумерек'],
    depressed: [-.8, -.55, '#4a5a8a', 'Глубокий индиго', 'индиго'], apathy: [-.35, -.85, '#8c8f99', 'Пепельный туман', 'тумана'],
    empty: [-.5, -.75, '#5b5f6b', 'Графитовая тишина', 'графита'], anxiety: [-.6, .7, '#b48cff', 'Грозовой аметист', 'аметиста'],
    fear: [-.75, .75, '#7a5cc8', 'Ночная гроза', 'грозы'], irritation: [-.5, .6, '#ff7a5a', 'Терракотовый жар', 'терракоты'],
    anger: [-.7, .85, '#e0453a', 'Рубиновое пламя', 'рубина'], tearful: [-.6, -.1, '#7fb0e8', 'Акварельный дождь', 'акварели'],
    lonely: [-.6, -.45, '#5d7fb0', 'Холодный кобальт', 'кобальта'], guilt: [-.6, .15, '#9a6f8f', 'Пыльная слива', 'сливы'],
    overwhelmed: [-.55, .65, '#c06fd0', 'Лиловый шторм', 'шторма'], swings: [-.3, .5, '#d08cff', 'Переливчатый опал', 'опала'],
    emotired: [-.55, -.6, '#7d7a9e', 'Выцветшая лаванда', 'лаванды'],
  };
  const GROUP_DEF = { pos: [.6, .1, '#ffd9a8', 'Тёплый жемчуг', 'жемчуга'], low: [-.5, -.5, '#8fb3ff', 'Холодный сапфир', 'сапфира'], tense: [-.5, .6, '#b98cff', 'Грозовой аметист', 'аметиста'] };
  // custom emotions get their group's place with a slight personal shift of hue
  H.emoModel = function (e) {
    if (!e) return null;
    const m = H.EMO_MODEL[e.id];
    if (m) return { v: m[0], a: m[1], c: m[2], n: m[3], g: m[4] };
    const d = GROUP_DEF[e.g] || GROUP_DEF[e.v > 0 ? 'pos' : 'low'];
    let x = 0; for (const ch of e.id) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
    const [r, g2, b] = H.hexToRgb(d[2]); const sh = (x % 40) - 20;
    const c = '#' + [r + sh, g2 - sh / 2, b + sh / 3].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    return { v: d[0], a: d[1], c, n: d[3], g: d[4] };
  };
})(window.H);
