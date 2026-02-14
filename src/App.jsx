import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icons } from './components/Icons';
import './index.css';

// Исправление иконок Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Иконка для центров реабилитации
const rehabIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Иконка для текущего положения
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// ============ Context для состояния приложения ============
const AppContext = createContext();

const useApp = () => useContext(AppContext);

// ============ Центры реабилитации для женщин в Казахстане ============
const REHAB_CENTERS = [
  {
    id: 1,
    name: 'Союз кризисных центров Казахстана',
    address: 'г. Алматы, ул. Гоголя, 86',
    phone: '+7 727 250 50 50',
    hours: 'Круглосуточно',
    services: 'Психологическая помощь, юридические консультации, временное убежище',
    lat: 43.2567,
    lng: 76.9286
  },
  {
    id: 2,
    name: 'Кризисный центр "Забота"',
    address: 'г. Астана, ул. Сыганак, 18',
    phone: '+7 7172 70 03 40',
    hours: '09:00 - 21:00',
    services: 'Консультации, группы поддержки, правовая помощь',
    lat: 51.1282,
    lng: 71.4307
  },
  {
    id: 3,
    name: 'Центр поддержки женщин "Коргау"',
    address: 'г. Шымкент, ул. Тауке хана, 45',
    phone: '+7 7252 53 12 34',
    hours: '08:00 - 20:00',
    services: 'Убежище, психологическая реабилитация, помощь детям',
    lat: 42.3417,
    lng: 69.5901
  },
  {
    id: 4,
    name: 'Кризисный центр "Подруги"',
    address: 'г. Караганда, ул. Ержанова, 25',
    phone: '+7 7212 42 56 78',
    hours: 'Круглосуточно',
    services: 'Горячая линия, временное проживание, социальная помощь',
    lat: 49.8047,
    lng: 73.1094
  },
  {
    id: 5,
    name: 'Центр "Надежда"',
    address: 'г. Актобе, пр. Абылхайыр хана, 67',
    phone: '+7 7132 54 32 10',
    hours: '09:00 - 18:00',
    services: 'Консультации, юридическая поддержка',
    lat: 50.2839,
    lng: 57.1670
  },
  {
    id: 6,
    name: 'Кризисный центр "Арай"',
    address: 'г. Павлодар, ул. Кутузова, 12',
    phone: '+7 7182 32 45 67',
    hours: '08:00 - 22:00',
    services: 'Психологическая помощь, группы взаимопомощи',
    lat: 52.2873,
    lng: 76.9674
  }
];

// ============ Опасные зоны (данные реестра pravstat.kz) ============
const DANGER_ZONES = [
  // Алматы
  { id: 1, lat: 43.2220, lng: 76.8512, radius: 500, district: 'Алмалинский р-н' },
  { id: 2, lat: 43.2567, lng: 76.9786, radius: 450, district: 'Ауэзовский р-н' },
  { id: 3, lat: 43.2140, lng: 76.8950, radius: 400, district: 'Бостандыкский р-н' },
  { id: 4, lat: 43.3050, lng: 76.9200, radius: 500, district: 'Турксибский р-н' },
  // Астана
  { id: 5, lat: 51.1605, lng: 71.4704, radius: 500, district: 'Сарыарка' },
  { id: 6, lat: 51.1000, lng: 71.4200, radius: 450, district: 'Алматы р-н' },
  { id: 7, lat: 51.1350, lng: 71.3900, radius: 400, district: 'Байконур р-н' },
  // Шымкент
  { id: 8, lat: 42.3200, lng: 69.6300, radius: 500, district: 'Аль-Фарабийский р-н' },
  { id: 9, lat: 42.3500, lng: 69.5500, radius: 450, district: 'Енбекшинский р-н' },
  // Караганда
  { id: 10, lat: 49.8350, lng: 73.0850, radius: 500, district: 'Казыбекбийский р-н' },
  { id: 11, lat: 49.7900, lng: 73.1400, radius: 400, district: 'Октябрьский р-н' },
  // Актобе
  { id: 12, lat: 50.3000, lng: 57.2100, radius: 500, district: 'Центр' },
  { id: 13, lat: 50.2700, lng: 57.1500, radius: 450, district: 'Южный' },
  // Павлодар
  { id: 14, lat: 52.3000, lng: 76.9500, radius: 500, district: 'Центральный' },
  // Семей
  { id: 15, lat: 50.4200, lng: 80.2300, radius: 450, district: 'Центр' },
  // Атырау
  { id: 16, lat: 47.1100, lng: 51.9200, radius: 500, district: 'Центр' },
  // Тараз
  { id: 17, lat: 42.9000, lng: 71.3700, radius: 450, district: 'Центр' },
  // Костанай
  { id: 18, lat: 53.2100, lng: 63.6300, radius: 500, district: 'Центр' },
];

// ============ Данные ============
const HOTLINES = [
  { id: 1, name: 'Полиция', number: '102', icon: 'Police' },
  { id: 2, name: 'Скорая помощь', number: '103', icon: 'Hospital' },
  { id: 3, name: 'Линия доверия для женщин', number: '150', icon: 'Heart' },
  { id: 4, name: 'Кризисный центр', number: '+7 727 250 50 50', icon: 'Users' },
];

const FAQ_ITEMS = [
  {
    id: 1,
    question: 'Что делать в момент угрозы насилия?',
    answer: '🚨 НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ:\n\n1. Сохраняйте спокойствие — не кричите и не провоцируйте агрессора\n2. Если возможно, уйдите в безопасное место (комната с замком, к соседям)\n3. Нажмите кнопку SOS в приложении или позвоните 102\n4. Отправьте свою геолокацию близким\n5. При физической угрозе защищайте голову и жизненно важные органы\n\n⚠️ Помните: ваша жизнь важнее вещей. Не спорьте из-за имущества.'
  },
  {
    id: 2,
    question: 'Как составить план безопасности?',
    answer: '📋 ВАШ ПЛАН БЕЗОПАСНОСТИ:\n\n📄 Документы (держите копии в надёжном месте):\n• Удостоверение личности\n• Свидетельства о рождении детей\n• Документы на имущество, банковские карты\n\n💰 Финансы:\n• Заначка наличных денег\n• Доступ к отдельному счёту\n\n🏠 Места укрытия:\n• Адреса 2-3 кризисных центров\n• Контакты друзей/родственников, готовых принять\n\n📱 Связь:\n• Кодовое слово для близких\n• Заряженный телефон с важными номерами\n• Договорённость с соседями о сигнале помощи'
  },
  {
    id: 3,
    question: 'Куда обратиться за помощью?',
    answer: '📞 ТЕЛЕФОНЫ ЭКСТРЕННОЙ ПОМОЩИ:\n\n🚔 Полиция: 102 (бесплатно, круглосуточно)\n🆘 Линия доверия: 150\n🏥 Скорая помощь: 103\n\n🏠 КРИЗИСНЫЕ ЦЕНТРЫ В КАЗАХСТАНЕ:\n\n• Союз кризисных центров:\n  +7 727 250 50 50 (Алматы)\n\n• Кризисный центр "Забота":\n  +7 7172 70 03 40 (Астана)\n\n• Национальная комиссия по делам женщин:\n  +7 7172 74 28 03\n\n💡 Все центры предоставляют бесплатную помощь и временное убежище.'
  },
  {
    id: 4,
    question: 'Какие признаки домашнего насилия?',
    answer: '⚠️ ВИДЫ НАСИЛИЯ:\n\n👊 Физическое:\n• Удары, толчки, пощёчины\n• Ограничение свободы передвижения\n• Причинение боли\n\n💬 Психологическое:\n• Унижения, оскорбления, угрозы\n• Контроль общения с друзьями и семьёй\n• Обвинения во всех проблемах\n• Газлайтинг (отрицание вашей реальности)\n\n💰 Экономическое:\n• Контроль над деньгами\n• Запрет на работу\n• Требование отчёта о каждой покупке\n\n❗ Если вы узнаёте эти признаки — это НЕ ваша вина. Вы заслуживаете безопасности.'
  },
  {
    id: 5,
    question: 'Как помочь близкому человеку?',
    answer: '💜 КАК ПОДДЕРЖАТЬ ЖЕРТВУ НАСИЛИЯ:\n\n✅ ЧТО ДЕЛАТЬ:\n• Выслушайте без осуждения\n• Скажите: "Я тебе верю. Это не твоя вина"\n• Не давите — решение должно быть добровольным\n• Предложите конкретную помощь\n• Поделитесь контактами кризисных центров\n\n❌ ЧЕГО НЕ ДЕЛАТЬ:\n• Не критикуйте за то, что не уходит\n• Не говорите "почему ты терпишь?"\n• Не принимайте решения за неё\n• Не конфликтуйте с агрессором напрямую\n\n🚨 Если угроза жизни — звоните 102 немедленно!'
  },
  {
    id: 6,
    question: 'Какие права есть у жертвы насилия?',
    answer: '⚖️ ВАШИ ПРАВА ПО ЗАКОНУ РК:\n\n📜 Закон "О профилактике бытового насилия":\n\n• Право на защитное предписание (запрет агрессору приближаться)\n• Право на бесплатную юридическую помощь\n• Право на временное убежище в кризисном центре (до 6 месяцев)\n• Право на медицинскую помощь\n• Право на социальную реабилитацию\n\n📝 КАК ПОЛУЧИТЬ ЗАЩИТНОЕ ПРЕДПИСАНИЕ:\n1. Обратитесь в полицию с заявлением\n2. Участковый обязан выдать предписание в течение 24 часов\n3. Нарушение предписания — административная ответственность\n\n💪 Вы имеете право на жизнь без насилия!'
  },
  {
    id: 7,
    question: 'Как сохранить доказательства?',
    answer: '📸 СБОР ДОКАЗАТЕЛЬСТВ:\n\n🏥 Медицинские:\n• Фотографируйте травмы (с датой на снимке)\n• Обратитесь в травмпункт за справкой\n• Сохраняйте все медицинские документы\n\n📱 Цифровые:\n• Скриншоты угроз в мессенджерах\n• Записи голосовых сообщений\n• Запись на диктофон (законно для самозащиты)\n\n👥 Свидетельства:\n• Имена и контакты свидетелей\n• Показания соседей, коллег\n\n📂 Хранение:\n• Копии в облаке (Google Drive, iCloud)\n• Отправьте копии доверенному лицу\n• Не храните всё только в телефоне'
  },
  {
    id: 8,
    question: 'Что делать после ухода от агрессора?',
    answer: '🌟 ПЕРВЫЕ ШАГИ К НОВОЙ ЖИЗНИ:\n\n🔐 БЕЗОПАСНОСТЬ:\n• Смените замки, номер телефона\n• Предупредите школу/сад ребёнка\n• Не публикуйте местоположение в соцсетях\n\n📋 ЮРИДИЧЕСКИЕ ДЕЛА:\n• Подайте заявление в полицию\n• Получите защитное предписание\n• Консультация с юристом о разводе и детях\n\n💜 ВОССТАНОВЛЕНИЕ:\n• Психолог в кризисном центре (бесплатно)\n• Группы поддержки для женщин\n• Не торопитесь — исцеление требует времени\n\n💰 РЕСУРСЫ:\n• Помощь с трудоустройством\n• Социальные пособия\n• Программы переобучения'
  }
];

// Начальные заметки (будут заменены данными из localStorage)
const INITIAL_NOTES = [
  { id: 1, title: 'Список покупок', text: 'Молоко, хлеб, яйца, сыр, помидоры...', date: new Date().toLocaleString('ru-RU') },
  { id: 2, title: 'Заметки с совещания', text: 'Обсудить квартальные цели с командой...', date: new Date(Date.now() - 86400000).toLocaleString('ru-RU') },
];

// ============ Хуки ============

// Геолокация
function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  return { location, error, loading, refresh: getLocation };
}

// Распознавание речи
function useSpeechRecognition(triggerPhrase, onTrigger) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Распознавание речи не поддерживается в этом браузере. Используйте Chrome.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'ru-RU';

    recognitionRef.current.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);

      if (triggerPhrase && text.toLowerCase().includes(triggerPhrase.toLowerCase())) {
        stopListening();
        onTrigger && onTrigger();
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Доступ к микрофону запрещен. Разрешите доступ в настройках браузера.');
      }
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        recognitionRef.current?.start();
      }
    };

    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setTranscript('');
  };

  const toggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return { isListening, transcript, toggle, startListening, stopListening };
}

const DB_NAME = 'guardianvoice_db';
const DB_STORE = 'app_state';

function openAppDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readDbValue(key) {
  const db = await openAppDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function writeDbValue(key, value) {
  const db = await openAppDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    const request = store.put({ key, value });

    request.onsuccess = () => resolve(value);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// Local Storage
function useLocalStorage(key, initialValue) {
  const initialValueRef = useRef(initialValue);

  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValueRef.current;
    } catch {
      return initialValueRef.current;
    }
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadFromDb = async () => {
      try {
        const dbValue = await readDbValue(key);
        if (!isActive) return;

        if (dbValue !== undefined) {
          setStoredValue(dbValue);
        } else {
          const item = window.localStorage.getItem(key);
          const fallbackValue = item ? JSON.parse(item) : initialValueRef.current;
          await writeDbValue(key, fallbackValue);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isActive) {
          setIsLoaded(true);
        }
      }
    };

    loadFromDb();

    return () => {
      isActive = false;
    };
  }, [key]);

  const setValue = (value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;

    try {
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      writeDbValue(key, valueToStore).catch(console.error);
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue, isLoaded];
}

// ============ Компоненты ============

// Onboarding с валидацией
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [triggerPhrase, setTriggerPhrase] = useState('помоги мне');
  const [error, setError] = useState('');

  const steps = [
    {
      title: 'Добро пожаловать',
      subtitle: 'GuardianVoice — ваш невидимый помощник безопасности',
      icon: <Icons.Shield />
    },
    {
      title: 'Как вас зовут?',
      subtitle: 'Это обязательное поле',
      input: { value: name, onChange: setName, placeholder: 'Введите имя', required: true }
    },
    {
      title: 'Экстренный контакт',
      subtitle: 'Кому отправить SOS при опасности? (обязательно)',
      input: { value: contact, onChange: setContact, placeholder: '+7 777 123 4567', type: 'tel', required: true }
    },
    {
      title: 'Кодовая фраза',
      subtitle: 'Произнесите эту фразу для активации SOS (обязательно)',
      input: { value: triggerPhrase, onChange: setTriggerPhrase, placeholder: 'помоги мне', required: true }
    }
  ];

  const validateStep = () => {
    setError('');
    const current = steps[step];

    if (current.input?.required) {
      if (!current.input.value.trim()) {
        setError('Это поле обязательно для заполнения');
        return false;
      }
      // Валидация телефона
      if (current.input.type === 'tel') {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(current.input.value.replace(/\s/g, ''))) {
          setError('Введите корректный номер телефона');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (step < steps.length - 1) {
      setStep(step + 1);
      setError('');
    } else {
      onComplete({ name, contact, triggerPhrase });
    }
  };

  const current = steps[step];

  return (
    <div className="onboarding-screen">
      <div className="onboarding-progress">
        {steps.map((_, i) => (
          <div key={i} className={`progress-dot ${i <= step ? 'active' : ''}`} />
        ))}
      </div>

      <div className="onboarding-content">
        {current.icon && (
          <div className="onboarding-icon">
            <span className="icon icon-xl">{current.icon}</span>
          </div>
        )}

        <h1>{current.title}</h1>
        {current.subtitle && <p>{current.subtitle}</p>}

        {current.input && (
          <>
            <input
              type={current.input.type || 'text'}
              className={`onboarding-input ${error ? 'input-error' : ''}`}
              value={current.input.value}
              onChange={(e) => {
                current.input.onChange(e.target.value);
                setError('');
              }}
              placeholder={current.input.placeholder}
            />
            {error && <div className="error-message">{error}</div>}
          </>
        )}
      </div>

      <div className="onboarding-actions">
        {step > 0 && (
          <button className="btn btn-ghost" onClick={() => { setStep(step - 1); setError(''); }}>
            Назад
          </button>
        )}
        <button className="btn btn-primary" onClick={handleNext}>
          {step === steps.length - 1 ? 'Начать' : 'Далее'}
        </button>
      </div>
    </div>
  );
}

// SOS Screen с таймером
function SOSScreen({ onCancel, contact, location, deafMode }) {
  const [countdown, setCountdown] = useState(10);
  const [alertSent, setAlertSent] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (countdown > 0 && !alertSent) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !alertSent) {
      setAlertSent(true);
      // Вибрация
      if (navigator.vibrate) {
        navigator.vibrate(deafMode
          ? [1000, 200, 1000, 200, 1000, 200, 1000]
          : [500, 200, 500, 200, 500]);
      }
      // Вспышка для слабослышащих
      if (deafMode) {
        let flashes = 0;
        const flashInterval = setInterval(() => {
          setFlashOn(prev => !prev);
          flashes++;
          if (flashes > 10) clearInterval(flashInterval);
        }, 300);
      }
      // Отправка SMS доверенному контакту
      if (contact) {
        const locText = location
          ? `Моя локация: https://maps.google.com/?q=${location.lat},${location.lng}`
          : 'Не удалось определить местоположение';
        const smsBody = encodeURIComponent(`🆘 SOS! Мне нужна помощь! ${locText}`);
        const smsUrl = `sms:${contact}?body=${smsBody}`;
        window.open(smsUrl, '_self');
      }
    }
  }, [countdown, alertSent]);

  return (
    <div className="sos-screen">
      {/* Вспышка для глухих */}
      {flashOn && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'white', zIndex: 9999, pointerEvents: 'none'
        }} />
      )}
      <button className="back-btn" onClick={onCancel}>
        <span className="icon"><Icons.ArrowLeft /></span>
      </button>

      {!alertSent ? (
        <>
          <div className="countdown-ring">
            <div className="countdown-number">{countdown}</div>
          </div>
          <h1>Отправка SOS через {countdown} сек</h1>
          <p>Нажмите "Отмена" если вы в безопасности</p>

          <button className="btn btn-white" onClick={onCancel}>
            Отменить
          </button>
        </>
      ) : (
        <>
          <span className="icon icon-xl" style={{ marginBottom: 30 }}>
            <Icons.Ambulance />
          </span>

          <h1>Помощь в пути!</h1>
          <p>
            Ваше местоположение и сигнал бедствия отправлены на номер {contact || '102'}.
            {location && ` Координаты: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
          </p>

          {/* Кнопка записи аудио */}
          <button
            className={`btn ${isRecording ? 'btn-white' : 'btn-ghost'}`}
            style={{ marginBottom: 12 }}
            onClick={async () => {
              if (isRecording) {
                // Остановить и поделиться
                mediaRecorderRef.current?.stop();
                setIsRecording(false);
              } else {
                // Начать запись
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  const recorder = new MediaRecorder(stream);
                  audioChunksRef.current = [];
                  recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
                  recorder.onstop = async () => {
                    stream.getTracks().forEach(t => t.stop());
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const file = new File([blob], 'sos_audio.webm', { type: 'audio/webm' });
                    if (navigator.share && navigator.canShare?.({ files: [file] })) {
                      await navigator.share({
                        title: '🆘 SOS Аудио',
                        text: 'Мне нужна помощь! Послушай что происходит.',
                        files: [file]
                      }).catch(() => { });
                    } else {
                      // Фоллбэк: скачать файл
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'sos_audio.webm'; a.click();
                      URL.revokeObjectURL(url);
                    }
                  };
                  mediaRecorderRef.current = recorder;
                  recorder.start();
                  setIsRecording(true);
                } catch (e) {
                  console.error('Mic error:', e);
                }
              }
            }}
          >
            <span className="icon icon-sm"><Icons.Microphone /></span>
            {isRecording ? '🔴 Остановить и отправить' : '🎤 Записать аудио для друзей'}
          </button>

          <button className="btn btn-ghost" style={{ marginBottom: 12 }}>
            <span className="icon icon-sm"><Icons.Phone /></span>
            Позвонить 102
          </button>

          <button className="btn btn-white" onClick={onCancel}>
            Закрыть
          </button>
        </>
      )}
    </div>
  );
}

// Компонент для центрирования карты на пользователе
function MapCenterController({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], 13);
    }
  }, [location, map]);

  return null;
}

// Map Screen с интерактивной картой Leaflet
function MapScreen({ onBack, location, onShare, onRequestLocation, locationError }) {
  const [showCenters, setShowCenters] = useState(true);
  const [showDangerZones, setShowDangerZones] = useState(false);
  const defaultCenter = location ? [location.lat, location.lng] : [43.2380, 76.9458]; // Алматы по умолчанию

  return (
    <div className="app map-screen slide-in">
      <div className="map-header">
        <button className="icon-btn" onClick={onBack}>
          <span className="icon"><Icons.ArrowLeft /></span>
        </button>
        <h2>Карта помощи</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`icon-btn ${showDangerZones ? 'active' : ''}`}
            onClick={() => setShowDangerZones(!showDangerZones)}
            title="Опасные зоны"
            style={showDangerZones ? { background: 'rgba(239,68,68,0.2)', color: '#ef4444' } : {}}
          >
            <span className="icon icon-sm"><Icons.AlertTriangle /></span>
          </button>
          <button
            className={`icon-btn ${showCenters ? 'active' : ''}`}
            onClick={() => setShowCenters(!showCenters)}
            title="Центры помощи"
          >
            <span className="icon icon-sm"><Icons.MapPin /></span>
          </button>
        </div>
      </div>

      {/* Запрос геолокации */}
      {!location && (
        <div className="location-request-banner">
          <div className="location-request-content">
            <span className="icon"><Icons.MapPin /></span>
            <div>
              <strong>Определить местоположение</strong>
              <p>{locationError || 'Разрешите доступ для показа вашей позиции'}</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={onRequestLocation}>
            Разрешить
          </button>
        </div>
      )}

      {/* Интерактивная карта Leaflet */}
      <div className="map-container leaflet-map">
        <MapContainer
          center={defaultCenter}
          zoom={location ? 13 : 6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Центрирование на пользователе */}
          {location && <MapCenterController location={location} />}

          {/* Маркер пользователя */}
          {location && (
            <Marker position={[location.lat, location.lng]} icon={userIcon}>
              <Popup>
                <div className="popup-content">
                  <strong>📍 Вы здесь</strong>
                  <p>Точность: ±{Math.round(location.accuracy)} м</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Опасные зоны */}
          {showDangerZones && DANGER_ZONES.map(zone => (
            <Circle
              key={`danger-${zone.id}`}
              center={[zone.lat, zone.lng]}
              radius={zone.radius}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '5, 10'
              }}
            >
              <Popup>
                <div className="popup-content">
                  <h4>⚠️ Зона повышенного риска</h4>
                  <p>{zone.district}</p>
                  <p style={{ fontSize: 11, color: '#888' }}>Данные: реестр pravstat.kz</p>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Маркеры центров реабилитации */}
          {showCenters && REHAB_CENTERS.map(center => (
            <Marker
              key={center.id}
              position={[center.lat, center.lng]}
              icon={rehabIcon}
            >
              <Popup>
                <div className="popup-content rehab-popup">
                  <h4>💜 {center.name}</h4>
                  <p className="popup-address">📍 {center.address}</p>
                  <p className="popup-phone">📞 <a href={`tel:${center.phone.replace(/\s/g, '')}`}>{center.phone}</a></p>
                  <p className="popup-hours">🕐 {center.hours}</p>
                  <p className="popup-services">{center.services}</p>
                  <a
                    href={`tel:${center.phone.replace(/\s/g, '')}`}
                    className="popup-call-btn"
                  >
                    Позвонить
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Легенда */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-marker user"></span>
          <span>Вы здесь</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker rehab"></span>
          <span>Центр помощи ({REHAB_CENTERS.length})</span>
        </div>
        {showDangerZones && (
          <div className="legend-item">
            <span className="legend-marker danger"></span>
            <span>Опасная зона ({DANGER_ZONES.length})</span>
          </div>
        )}
      </div>

      {/* Информация о местоположении */}
      <div className="map-info-card">
        <h3>Ваше местоположение</h3>
        <div className="coord-row">
          <span className="coord-label">Широта</span>
          <span className="coord-value">{location ? `${location.lat.toFixed(6)}° N` : 'Не определено'}</span>
        </div>
        <div className="coord-row">
          <span className="coord-label">Долгота</span>
          <span className="coord-value">{location ? `${location.lng.toFixed(6)}° E` : 'Не определено'}</span>
        </div>
        <div className="coord-row">
          <span className="coord-label">Точность</span>
          <span className="coord-value">{location ? `±${Math.round(location.accuracy)} м` : '—'}</span>
        </div>

        <button className="btn btn-primary share-btn" onClick={onShare}>
          <span className="icon icon-sm"><Icons.Share /></span>
          Поделиться с полицией
        </button>
      </div>

      {/* Список центров */}
      <div className="rehab-list">
        <h3>
          <span className="icon icon-sm"><Icons.Heart /></span>
          Ближайшие центры помощи
        </h3>
        {REHAB_CENTERS.slice(0, 3).map(center => (
          <a
            key={center.id}
            href={`tel:${center.phone.replace(/\s/g, '')}`}
            className="rehab-card"
          >
            <div className="rehab-info">
              <h4>{center.name}</h4>
              <p>{center.address}</p>
              <span className="rehab-hours">{center.hours}</span>
            </div>
            <div className="rehab-action">
              <span className="icon"><Icons.Phone /></span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Note Editor Modal
function NoteEditor({ note, onSave, onCancel }) {
  const [title, setTitle] = useState(note?.title || '');
  const [text, setText] = useState(note?.text || '');

  const handleSave = () => {
    if (!title.trim() && !text.trim()) {
      alert('Заполните хотя бы одно поле');
      return;
    }
    onSave({ title: title || 'Без названия', text });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="note-editor" onClick={(e) => e.stopPropagation()}>
        <div className="mask-header">
          <h2>{note ? 'Редактировать' : 'Новая заметка'}</h2>
          <button className="icon-btn" onClick={onCancel}>
            <span className="icon icon-sm"><Icons.X /></span>
          </button>
        </div>

        <input
          type="text"
          className="note-title-input"
          placeholder="Заголовок..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <textarea
          className="note-text-input"
          placeholder="Начните писать..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
        />

        <div className="note-editor-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            Отмена
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// Mask Mode (Notes)
function MaskScreen({ onExit, notes, onAddNote, onEditNote, onDeleteNote }) {
  const [editingNote, setEditingNote] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleSave = (noteData) => {
    if (editingNote) {
      onEditNote(editingNote.id, noteData);
    } else {
      onAddNote(noteData);
    }
    setShowEditor(false);
    setEditingNote(null);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleDelete = (id) => {
    if (confirm('Удалить эту заметку?')) {
      onDeleteNote(id);
    }
  };

  return (
    <div className="app mask-screen">
      <div className="mask-header">
        <h2>
          <span className="icon"><Icons.File /></span>
          Мои заметки
        </h2>
        <button className="icon-btn active" onClick={onExit}>
          <span className="icon icon-sm"><Icons.EyeOff /></span>
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <span className="icon icon-xl"><Icons.File /></span>
          <h3>Нет заметок</h3>
          <p>Нажмите + чтобы создать первую заметку</p>
        </div>
      ) : (
        notes.map(note => (
          <div key={note.id} className="note-card" onClick={() => handleEdit(note)}>
            <div className="note-card-header">
              <h4>{note.title}</h4>
              <button
                className="icon-btn note-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(note.id);
                }}
              >
                <span className="icon icon-sm"><Icons.Trash /></span>
              </button>
            </div>
            <p>{note.text}</p>
            <div className="date">{note.date}</div>
          </div>
        ))
      )}

      <button className="fab fab-yellow" onClick={() => setShowEditor(true)}>
        <span className="icon icon-lg"><Icons.Plus /></span>
      </button>

      {showEditor && (
        <NoteEditor
          note={editingNote}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}

// Settings Screen
function SettingsScreen({ onBack, settings, onUpdate }) {
  return (
    <div className="app settings-screen slide-in">
      <div className="map-header">
        <button className="icon-btn" onClick={onBack}>
          <span className="icon"><Icons.ArrowLeft /></span>
        </button>
        <h2>Настройки</h2>
      </div>

      <div className="section">
        <div className="settings-card">
          <div className="settings-item">
            <div className="settings-label">Имя</div>
            <input
              type="text"
              className="settings-input"
              value={settings.name}
              onChange={(e) => onUpdate({ ...settings, name: e.target.value })}
            />
          </div>

          <div className="settings-item">
            <div className="settings-label">Экстренный контакт</div>
            <input
              type="tel"
              className="settings-input"
              value={settings.contact}
              onChange={(e) => onUpdate({ ...settings, contact: e.target.value })}
            />
          </div>

          <div className="settings-item">
            <div className="settings-label">Кодовая фраза</div>
            <input
              type="text"
              className="settings-input"
              value={settings.triggerPhrase}
              onChange={(e) => onUpdate({ ...settings, triggerPhrase: e.target.value })}
            />
          </div>
        </div>

        {/* Доступность */}
        <div className="settings-card" style={{ marginTop: 20 }}>
          <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="icon icon-sm" style={{ color: 'var(--primary)' }}><Icons.VolumeX /></span>
            Доступность
          </h4>
          <div className="settings-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="settings-label" style={{ marginBottom: 4 }}>Режим для слабослышащих</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Вибрация + вспышка при SOS</p>
            </div>
            <button
              onClick={() => onUpdate({ ...settings, deafMode: !settings.deafMode })}
              style={{
                width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: settings.deafMode ? 'var(--primary)' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s'
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 3, transition: 'left 0.2s',
                left: settings.deafMode ? 27 : 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </button>
          </div>
        </div>

        <div className="settings-card" style={{ marginTop: 20 }}>
          <h4 style={{ marginBottom: 12 }}>О приложении</h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            GuardianVoice AI v2.0<br />
            Приложение для экстренной помощи с голосовой активацией и AI.
          </p>
        </div>
      </div>
    </div>
  );
}

// Voice Listening Overlay
function VoiceOverlay({ transcript, onStop }) {
  return (
    <div className="voice-overlay">
      <div className="voice-content">
        <div className="voice-pulse">
          <span className="icon icon-xl"><Icons.Microphone /></span>
        </div>
        <h2>Слушаю...</h2>
        <p>Скажите кодовую фразу для активации SOS</p>
        {transcript && (
          <div className="voice-transcript">{transcript}</div>
        )}
        <button className="btn btn-white" onClick={onStop} style={{ marginTop: 30 }}>
          Остановить
        </button>
      </div>
    </div>
  );
}

// ============ AI Vision Screen (для слепых) ============
function AIVisionScreen({ onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [analysis, setAnalysis] = useState('Нажмите «Запустить» для начала анализа');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const intervalRef = useRef(null);
  const analyzingRef = useRef(false);
  const currentAudioRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
        intervalRef.current = setInterval(() => captureAndAnalyze(), 8000);
        setTimeout(() => captureAndAnalyze(), 2000);
      }
    } catch (err) {
      setAnalysis('❗ Не удалось получить доступ к камере. Разрешите в настройках.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    analyzingRef.current = false;
    setIsActive(false);
    setIsAnalyzing(false);
    setAnalysis('Камера остановлена');
  };

  const speak = async (text) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'nova',
          speed: 1.0
        })
      });
      if (!response.ok) throw new Error('TTS error');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (currentAudioRef.current === audio) currentAudioRef.current = null;
      };
      audio.play().catch(() => { });
    } catch (e) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ru-RU';
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
      }
    }
  };

  const captureAndAnalyze = async () => {
    if (analyzingRef.current) return;
    if (!videoRef.current || !canvasRef.current) return;
    analyzingRef.current = true;
    setIsAnalyzing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    const imageData = canvas.toDataURL('image/jpeg', 0.6);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Ты — голосовой помощник для незрячего человека. Дай КОНКРЕТНЫЕ подсказки для навигации. Формат: 1) Что прямо перед тобой (расстояние). 2) Куда безопасно идти (лево/право/прямо). 3) Препятствия или опасности. Говори как GPS-навигатор: кратко, 2-3 предложения. Пример: «Прямо — стол в двух шагах, обойди левее. Справа свободный проход. Пол ровный.» Отвечай на русском.'
              },
              {
                type: 'image_url',
                image_url: { url: imageData, detail: 'low' }
              }
            ]
          }],
          max_tokens: 150
        })
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      const text = data.choices[0].message.content;
      setAnalysis(text);
      speak(text);
    } catch (err) {
      setAnalysis('Ошибка анализа. Жду следующий кадр...');
    }
    setIsAnalyzing(false);
    analyzingRef.current = false;
  };

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="app settings-screen slide-in">
      <div className="map-header">
        <button className="icon-btn" onClick={() => { stopCamera(); onBack(); }}>
          <span className="icon"><Icons.ArrowLeft /></span>
        </button>
        <h2>👁️ AI Зрение</h2>
      </div>

      <div className="section">
        <div style={{
          position: 'relative', borderRadius: 16, overflow: 'hidden',
          background: '#000', marginBottom: 16, aspectRatio: '4/3'
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {isAnalyzing && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(239,68,68,0.9)', color: 'white',
              padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              animation: 'pulse 1s infinite'
            }}>
              🔴 Анализ...
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="settings-card" style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="icon icon-sm" style={{ color: 'var(--primary)' }}><Icons.Bot /></span>
            Подсказки навигации
          </h4>
          <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
            {analysis}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {!isActive ? (
            <button className="btn btn-primary" style={{ flex: 1, padding: 16 }} onClick={startCamera}>
              <span className="icon icon-sm"><Icons.Camera /></span>
              Запустить
            </button>
          ) : (
            <>
              <button className="btn btn-primary" style={{ flex: 1, padding: 16 }} onClick={captureAndAnalyze} disabled={isAnalyzing}>
                Анализ сейчас
              </button>
              <button className="btn btn-ghost" style={{ padding: 16 }} onClick={stopCamera}>
                Стоп
              </button>
            </>
          )}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
          AI анализирует каждые 8 сек. Озвучка не накладывается.
        </p>
      </div>
    </div>
  );
}

// ============ OpenAI GPT Integration ============
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const SYSTEM_PROMPT = `Ты — AI-помощник приложения GuardianVoice. Это приложение для экстренной помощи и защиты от домашнего насилия в Казахстане.

Твоя задача — отвечать на вопросы пользователей о безопасности, защите от насилия, правах и кризисных центрах. Будь эмпатичной, поддерживающей и конкретной.

Важная информация для ответов:

📞 Экстренные номера:
• 102 — полиция
• 103 — скорая помощь  
• 150 — линия доверия для женщин
• +7 727 250 50 50 — кризисный центр Алматы

🏥 Кризисные центры Казахстана:
• Союз кризисных центров — г. Алматы, ул. Гоголя 86, +7 727 250 50 50 (круглосуточно)
• Центр поддержки женщин — г. Астана, ул. Сыганак 18, +7 7172 70 03 40 (09:00-21:00)
• Центр «Забота» — г. Шымкент, ул. Байтурсынова 15, +7 7252 53 21 89 (круглосуточно)
• Кризисный центр — г. Караганда, ул. Ерубаева 44, +7 7212 42 56 78 (круглосуточно)
• Центр «Надежда» — г. Актобе, пр. Абылхайыр хана 67, +7 7132 54 32 10 (09:00-18:00)
• Центр помощи — г. Павлодар, ул. Ак. Сатпаева 50, +7 7182 32 45 67 (08:00-22:00)

⚖️ Права по закону РК:
• Защитное предписание (запрет приближаться)
• Бесплатная юридическая помощь
• Временное убежище до 6 месяцев
• Медицинская помощь
• Социальная реабилитация

Правила общения:
- Отвечай на русском языке
- Будь краткой, но информативной
- Используй эмодзи умеренно
- Если человек в опасности — сразу дай экстренные номера
- Никогда не осуждай пользователя
- Напоминай про кнопку SOS в приложении при необходимости
- Не выходи за рамки темы безопасности и помощи`;

async function getAIResponse(message, conversationHistory) {
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Извините, произошла ошибка при подключении к AI. Если вам нужна срочная помощь — нажмите SOS или позвоните 102.';
  }
}

// AI Chat Bot
function AIChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Здравствуйте! Я AI-помощник GuardianVoice. Задайте вопрос о безопасности, защите от насилия, или ваших правах. Я здесь, чтобы помочь. 💜' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), type: 'user', text: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const aiText = await getAIResponse(currentInput, messages);
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: aiText
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: 'Произошла ошибка. Если вам нужна помощь — позвоните 102 или нажмите SOS.'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    'Что делать при угрозе?',
    'Куда обратиться за помощью?',
    'Какие у меня права?'
  ];

  return (
    <div className="chat-screen slide-in">
      <div className="chat-header">
        <button className="icon-btn" onClick={onClose}>
          <span className="icon"><Icons.ArrowLeft /></span>
        </button>
        <div className="chat-header-info">
          <div className="chat-avatar">
            <span className="icon"><Icons.Bot /></span>
          </div>
          <div>
            <h3>AI Помощник</h3>
            <span className="chat-status">Онлайн</span>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.type}`}>
            {msg.type === 'bot' && (
              <div className="message-avatar">
                <span className="icon icon-sm"><Icons.Bot /></span>
              </div>
            )}
            <div className="message-bubble">
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-message bot">
            <div className="message-avatar">
              <span className="icon icon-sm"><Icons.Bot /></span>
            </div>
            <div className="message-bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="quick-questions">
          {quickQuestions.map((q, i) => (
            <button key={i} className="quick-q-btn" onClick={() => setInput(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="Напишите сообщение..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <span className="icon"><Icons.Send /></span>
        </button>
      </div>
    </div>
  );
}

// Bottom Navigation
function BottomNav({ current, onNavigate }) {
  const items = [
    { id: 'home', label: 'Главная', icon: Icons.Home, screen: 'dashboard' },
    { id: 'map', label: 'Карта', icon: Icons.Map, screen: 'map' },
    { id: 'clan', label: 'Клан', icon: Icons.Building, screen: 'clan' },
    { id: 'chat', label: 'Помощник', icon: Icons.Bot, screen: 'chat' },
    { id: 'settings', label: 'Настройки', icon: Icons.Settings, screen: 'settings' },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.id}
          className={`nav-item ${current === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.screen)}
        >
          <span className="icon"><item.icon /></span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// Dashboard
function Dashboard({
  settings,
  onSOS,
  onMap,
  onMask,
  onChat,
  onVision,
  voice,
  location
}) {
  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="avatar">{settings.name?.charAt(0) || 'U'}</div>
        <div className="user-info">
          <div className="greeting">Добро пожаловать</div>
          <div className="username">{settings.name || 'Пользователь'}</div>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={onMask}>
            <span className="icon icon-sm"><Icons.Eye /></span>
          </button>
          <button className="icon-btn">
            <span className="icon icon-sm"><Icons.Bell /></span>
          </button>
        </div>
      </header>

      {/* Emergency Section */}
      <div className="emergency-section">
        <h1 className="emergency-title">Вы в опасности?</h1>
        <p className="emergency-subtitle">Нажмите кнопку — помощь прибудет быстро</p>
      </div>

      {/* SOS Button */}
      <div className="sos-container">
        <button className="sos-button" onClick={onSOS}>
          SOS
        </button>
      </div>

      {/* Location Card */}
      <div className="card">
        <div className="card-row">
          <div className="card-icon">
            <span className="icon"><Icons.MapPin /></span>
          </div>
          <div className="card-content">
            <div className="card-label">Ваша локация</div>
            <div className="card-value">
              {location.location
                ? `${location.location.lat.toFixed(4)}, ${location.location.lng.toFixed(4)}`
                : location.loading ? 'Определение...' : 'Недоступно'}
            </div>
          </div>
          <button className="btn btn-primary" onClick={onMap}>
            Карта
          </button>
        </div>
      </div>

      {/* Action Grid */}
      <div className="action-grid">
        <button
          className={`action-card ${voice.isListening ? 'active' : ''}`}
          onClick={voice.toggle}
        >
          <div className="action-icon">
            <span className="icon"><Icons.Microphone /></span>
          </div>
          <div className="action-label">Голосовая активация</div>
          <div className="action-desc">
            {voice.isListening ? 'Слушаю...' : 'Скажите кодовое слово'}
          </div>
        </button>

        <button className="action-card" onClick={onVision}>
          <div className="action-icon">
            <span className="icon"><Icons.Camera /></span>
          </div>
          <div className="action-label">AI Зрение</div>
          <div className="action-desc">Помощь для незрячих</div>
        </button>
      </div>

      {/* AI Chat Card */}
      <div className="section">
        <button className="ai-chat-card" onClick={onChat}>
          <div className="ai-chat-icon">
            <span className="icon"><Icons.Bot /></span>
          </div>
          <div className="ai-chat-info">
            <h3>AI Помощник</h3>
            <p>Задайте вопрос о безопасности, правах или как получить помощь</p>
          </div>
          <span className="icon ai-chat-arrow"><Icons.ChevronRight /></span>
        </button>
      </div>

      {/* Hotlines */}
      <div className="section">
        <div className="section-header">
          <span className="icon section-icon icon-sm"><Icons.Phone /></span>
          <h3 className="section-title">Горячие линии</h3>
        </div>

        {HOTLINES.map(hotline => (
          <a
            key={hotline.id}
            className="hotline-item"
            href={`tel:${hotline.number.replace(/\s/g, '')}`}
          >
            <div className="hotline-icon">
              <span className="icon icon-sm">
                {Icons[hotline.icon] ? React.createElement(Icons[hotline.icon]) : <Icons.Phone />}
              </span>
            </div>
            <div className="hotline-info">
              <div className="hotline-name">{hotline.name}</div>
              <div className="hotline-number">{hotline.number}</div>
            </div>
            <div className="btn btn-success">
              <span className="icon icon-sm"><Icons.Phone /></span>
              Звонок
            </div>
          </a>
        ))}
      </div>
    </>
  );
}

// ============ Клан подъезда ============
function ClanScreen({ onBack, settings }) {
  const [clan, setClan] = useLocalStorage('guardianvoice_clan', null);
  const [joinCode, setJoinCode] = useState('');
  const [newClanName, setNewClanName] = useState('');
  const [newClanAddress, setNewClanAddress] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const createClan = () => {
    if (!newClanName.trim()) return;
    const code = generateCode();
    setClan({
      name: newClanName,
      address: newClanAddress,
      code,
      members: [{ name: settings?.name || 'Я', isMe: true, joinedAt: Date.now() }],
      createdAt: Date.now()
    });
    setShowCreate(false);
  };

  const joinClan = () => {
    if (!joinCode.trim()) return;
    // В реальном приложении: запрос к серверу. Тут — создаём мок-клан
    setClan({
      name: `Клан ${joinCode}`,
      address: 'Адрес по коду',
      code: joinCode.toUpperCase(),
      members: [
        { name: 'Сосед Михаил', isMe: false, joinedAt: Date.now() - 86400000 },
        { name: settings?.name || 'Я', isMe: true, joinedAt: Date.now() }
      ],
      createdAt: Date.now() - 86400000
    });
    setJoinCode('');
  };

  const alertClan = () => {
    const members = clan?.members?.filter(m => !m.isMe) || [];
    const text = encodeURIComponent(`🆘 SOS от ${settings?.name || 'соседа'}! Нужна помощь в подъезде!`);
    // Открываем SMS для быстрой отправки
    window.open(`sms:?body=${text}`, '_self');
  };

  return (
    <div className="app settings-screen slide-in">
      <div className="map-header">
        <button className="icon-btn" onClick={onBack}>
          <span className="icon"><Icons.ArrowLeft /></span>
        </button>
        <h2>🏠 Мой клан</h2>
      </div>

      <div className="section">
        {!clan ? (
          // Нет клана — создать или присоединиться
          <>
            {!showCreate ? (
              <>
                <div className="settings-card" style={{ textAlign: 'center', padding: 30 }}>
                  <span className="icon icon-xl" style={{ color: 'var(--primary)', marginBottom: 16, display: 'block' }}>
                    <Icons.Building />
                  </span>
                  <h3 style={{ marginBottom: 8 }}>Объединитесь с соседями</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    Создайте группу безопасности вашего подъезда или дома для взаимной помощи
                  </p>
                  <button className="btn btn-primary" style={{ width: '100%', marginBottom: 10 }} onClick={() => setShowCreate(true)}>
                    Создать клан
                  </button>
                </div>

                <div className="settings-card" style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 12 }}>Присоединиться по коду</h4>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="text"
                      className="settings-input"
                      placeholder="Введите код"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', flex: 1 }}
                    />
                    <button className="btn btn-primary" onClick={joinClan} disabled={!joinCode.trim()}>
                      Войти
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="settings-card">
                <h4 style={{ marginBottom: 16 }}>Новый клан</h4>
                <div className="settings-item">
                  <div className="settings-label">Название</div>
                  <input
                    type="text"
                    className="settings-input"
                    placeholder="Подъезд 3, ЖК Алмагуль"
                    value={newClanName}
                    onChange={(e) => setNewClanName(e.target.value)}
                  />
                </div>
                <div className="settings-item">
                  <div className="settings-label">Адрес</div>
                  <input
                    type="text"
                    className="settings-input"
                    placeholder="ул. Абая 15"
                    value={newClanAddress}
                    onChange={(e) => setNewClanAddress(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>
                    Назад
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={createClan} disabled={!newClanName.trim()}>
                    Создать
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          // Клан существует
          <>
            <div className="settings-card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>{clan.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>📍 {clan.address}</p>
                </div>
                <div style={{
                  background: 'rgba(238,105,131,0.15)', padding: '6px 12px',
                  borderRadius: 8, fontSize: 13, fontWeight: 700, color: 'var(--primary)'
                }}>
                  {clan.code}
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Код для приглашения: <strong>{clan.code}</strong> — поделитесь с соседями
              </p>
            </div>

            {/* Участники */}
            <div className="settings-card" style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 12 }}>
                <span className="icon icon-sm" style={{ color: 'var(--primary)' }}><Icons.Users /></span>
                {' '}Участники ({clan.members?.length || 0})
              </h4>
              {clan.members?.map((member, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: i < clan.members.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: member.isMe ? 'var(--primary)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: member.isMe ? 'white' : 'var(--text-secondary)',
                    fontSize: 14, fontWeight: 600
                  }}>
                    {member.name?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {member.name}{member.isMe && ' (Вы)'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопки */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: 16, marginBottom: 10, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              onClick={alertClan}
            >
              🆘 Позвать клан на помощь
            </button>

            <button
              className="btn btn-ghost"
              style={{ width: '100%', padding: 14 }}
              onClick={() => setClan(null)}
            >
              Покинуть клан
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============ Главный компонент ============
function App() {
  const [settings, setSettings, settingsLoaded] = useLocalStorage('guardianvoice_settings', null);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [notes, setNotes, notesLoaded] = useLocalStorage('guardianvoice_notes', []);

  const location = useGeolocation();

  const voice = useSpeechRecognition(
    settings?.triggerPhrase || 'помоги мне',
    () => setCurrentScreen('sos')
  );

  // Функции для заметок
  const addNote = (noteData) => {
    const newNote = {
      id: Date.now(),
      ...noteData,
      date: new Date().toLocaleString('ru-RU')
    };
    setNotes([newNote, ...notes]);
  };

  const editNote = (id, noteData) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, ...noteData, date: new Date().toLocaleString('ru-RU') } : note
    ));
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  // Если нет настроек — показываем onboarding
  if (!settingsLoaded || !notesLoaded) {
    return <div className="app" />;
  }

  if (!settings) {
    return <Onboarding onComplete={(data) => setSettings(data)} />;
  }

  const navigate = (screen) => setCurrentScreen(screen);

  const shareLocation = () => {
    const text = location.location
      ? `SOS! Моё местоположение: ${location.location.lat.toFixed(6)}, ${location.location.lng.toFixed(6)}\nhttps://maps.google.com/?q=${location.location.lat},${location.location.lng}`
      : 'SOS! Нужна помощь!';

    if (navigator.share) {
      navigator.share({ title: 'SOS', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Координаты скопированы в буфер обмена!');
    }
  };

  // Mask Mode
  if (currentScreen === 'mask') {
    return (
      <MaskScreen
        onExit={() => navigate('dashboard')}
        notes={notes}
        onAddNote={addNote}
        onEditNote={editNote}
        onDeleteNote={deleteNote}
      />
    );
  }

  // SOS Screen
  if (currentScreen === 'sos') {
    return (
      <SOSScreen
        onCancel={() => navigate('dashboard')}
        contact={settings.contact}
        location={location.location}
        deafMode={settings.deafMode}
      />
    );
  }

  // Map Screen
  if (currentScreen === 'map') {
    return (
      <>
        <MapScreen
          onBack={() => navigate('dashboard')}
          location={location.location}
          onShare={shareLocation}
          onRequestLocation={location.refresh}
          locationError={location.error}
        />
        <BottomNav current="map" onNavigate={navigate} />
      </>
    );
  }

  // AI Vision Screen
  if (currentScreen === 'vision') {
    return (
      <>
        <AIVisionScreen onBack={() => navigate('dashboard')} />
        <BottomNav current="home" onNavigate={navigate} />
      </>
    );
  }

  // Chat Screen
  if (currentScreen === 'chat') {
    return (
      <>
        <AIChatBot onClose={() => navigate('dashboard')} />
        <BottomNav current="chat" onNavigate={navigate} />
      </>
    );
  }

  // Clan Screen
  if (currentScreen === 'clan') {
    return (
      <>
        <ClanScreen onBack={() => navigate('dashboard')} settings={settings} />
        <BottomNav current="clan" onNavigate={navigate} />
      </>
    );
  }

  // Settings Screen
  if (currentScreen === 'settings') {
    return (
      <>
        <SettingsScreen
          onBack={() => navigate('dashboard')}
          settings={settings}
          onUpdate={setSettings}
        />
        <BottomNav current="settings" onNavigate={navigate} />
      </>
    );
  }

  // Dashboard
  return (
    <div className="app">
      <Dashboard
        settings={settings}
        onSOS={() => navigate('sos')}
        onMap={() => navigate('map')}
        onMask={() => navigate('mask')}
        onChat={() => navigate('chat')}
        onVision={() => navigate('vision')}
        voice={voice}
        location={location}
      />

      {voice.isListening && (
        <VoiceOverlay transcript={voice.transcript} onStop={voice.stopListening} />
      )}

      <BottomNav current="home" onNavigate={navigate} />
    </div>
  );
}

export default App;
