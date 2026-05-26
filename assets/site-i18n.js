(function () {
    const STORAGE_KEY = 'preferredLanguage';
    const LANGS = [
        ['en', 'English'],
        ['zh', '简体中文'],
        ['zh-Hant', '繁體中文'],
        ['ja', '日本語'],
        ['ru', 'Русский'],
        ['es', 'Español'],
        ['pt', 'Português'],
        ['fr', 'Français'],
        ['de', 'Deutsch']
    ];

    const path = location.pathname.split('/').pop() || 'index.html';
    const isWebdav = location.pathname.includes('/webdav/');
    const SWITCHER_STYLE_ID = 'site-lang-switcher-style';
    let switcherEventsBound = false;

    function norm(lang) {
        const raw = String(lang || 'en').toLowerCase().replace('_', '-');
        if (raw.includes('hant') || ['zh-tw', 'zh-hk', 'zh-mo'].includes(raw)) return 'zh-Hant';
        if (raw === 'zh' || raw.includes('hans') || ['zh-cn', 'zh-sg'].includes(raw)) return 'zh';
        const base = raw.split('-')[0];
        return ['en', 'zh', 'ja', 'ru', 'es', 'pt', 'fr', 'de'].includes(base) ? base : 'en';
    }

    function initialLang() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return norm(saved);
        } catch (_) {}
        const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
        return norm(list[0]);
    }

    function save(lang) {
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    }

    function langLabel(lang) {
        const item = LANGS.find(([code]) => code === norm(lang));
        return item ? item[1] : LANGS[0][1];
    }

    function injectSwitcherStyles() {
        if (document.getElementById(SWITCHER_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = SWITCHER_STYLE_ID;
        style.textContent = `
            .lang-switcher.lang-switcher--fixed {
                position: fixed;
                top: max(12px, env(safe-area-inset-top));
                right: max(12px, env(safe-area-inset-right));
                z-index: 9999;
                display: block;
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }

            .lang-switcher.lang-switcher--fixed .lang-toggle {
                min-height: 42px;
                padding: 0 16px;
                border: 1px solid rgba(222, 223, 230, 0.95);
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.94);
                color: #191919;
                box-shadow: 0 12px 34px rgba(31, 34, 42, 0.16);
                cursor: pointer;
                font-size: 0.95rem;
                font-weight: 700;
                -webkit-backdrop-filter: blur(12px);
                backdrop-filter: blur(12px);
            }

            .lang-switcher.lang-switcher--fixed .lang-toggle::after {
                content: "▾";
                margin-left: 8px;
                color: #ff560f;
                font-size: 0.8rem;
            }

            .lang-switcher.lang-switcher--fixed.open .lang-toggle::after {
                content: "▴";
            }

            .lang-switcher.lang-switcher--fixed .lang-menu {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                min-width: 180px;
                max-height: min(70vh, 360px);
                overflow-y: auto;
                padding: 8px;
                border: 1px solid #e4e5ec;
                border-radius: 18px;
                background: rgba(255, 255, 255, 0.98);
                box-shadow: 0 24px 70px rgba(31, 34, 42, 0.2);
                opacity: 0;
                pointer-events: none;
                transform: translateY(-6px);
                transition: opacity 0.18s ease, transform 0.18s ease;
                -webkit-backdrop-filter: blur(16px);
                backdrop-filter: blur(16px);
            }

            .lang-switcher.lang-switcher--fixed.open .lang-menu {
                opacity: 1;
                pointer-events: auto;
                transform: translateY(0);
            }

            .lang-switcher.lang-switcher--fixed .lang-btn {
                display: block;
                width: 100%;
                min-height: 40px;
                margin: 0;
                padding: 0 12px;
                border: 0;
                border-radius: 12px;
                background: transparent;
                color: #4d4f58;
                cursor: pointer;
                font-size: 0.95rem;
                font-weight: 600;
                text-align: left;
                transition: background 0.16s ease, color 0.16s ease;
            }

            .lang-switcher.lang-switcher--fixed .lang-btn:hover {
                background: #fff3ed;
                color: #ff560f;
            }

            .lang-switcher.lang-switcher--fixed .lang-btn.active {
                background: #ff560f;
                color: #fff;
            }

            @media (max-width: 768px) {
                .lang-switcher.lang-switcher--fixed {
                    top: max(10px, env(safe-area-inset-top));
                    right: max(10px, env(safe-area-inset-right));
                }

                .lang-switcher.lang-switcher--fixed .lang-toggle {
                    min-height: 40px;
                    padding: 0 13px;
                    font-size: 0.9rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function setSwitcherOpen(switcher, open) {
        if (!switcher) return;
        switcher.classList.toggle('open', open);
        const toggle = switcher.querySelector('.lang-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function bindSwitcherEvents() {
        if (switcherEventsBound) return;
        switcherEventsBound = true;
        document.addEventListener('click', () => setSwitcherOpen(document.querySelector('.lang-switcher'), false));
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') setSwitcherOpen(document.querySelector('.lang-switcher'), false);
        });
    }

    function txt(selector, value, root = document) {
        const el = root.querySelector(selector);
        if (el && value != null) el.textContent = value;
    }

    function html(selector, value, root = document) {
        const el = root.querySelector(selector);
        if (el && value != null) el.innerHTML = value;
    }

    function all(selector, values, root = document) {
        root.querySelectorAll(selector).forEach((el, i) => {
            if (values && values[i] != null) el.textContent = values[i];
        });
    }

    function ensureSwitcher() {
        injectSwitcherStyles();
        bindSwitcherEvents();
        let switcher = document.querySelector('.lang-switcher');
        if (!switcher) {
            switcher = document.createElement('div');
            document.body.appendChild(switcher);
        } else if (switcher.parentElement !== document.body) {
            document.body.appendChild(switcher);
        }
        const current = norm(document.documentElement.lang || initialLang());
        switcher.className = 'lang-switcher lang-switcher--fixed';
        switcher.innerHTML = '';
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'lang-toggle';
        toggle.setAttribute('aria-haspopup', 'listbox');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Language');
        toggle.textContent = langLabel(current);
        toggle.addEventListener('click', event => {
            event.stopPropagation();
            setSwitcherOpen(switcher, !switcher.classList.contains('open'));
        });
        switcher.appendChild(toggle);

        const menu = document.createElement('div');
        menu.className = 'lang-menu';
        menu.setAttribute('role', 'listbox');
        menu.addEventListener('click', event => event.stopPropagation());
        LANGS.forEach(([code, label]) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'lang-btn';
            btn.dataset.lang = code;
            btn.setAttribute('role', 'option');
            btn.textContent = label;
            btn.addEventListener('click', () => {
                switchLang(code);
                setSwitcherOpen(document.querySelector('.lang-switcher'), false);
            });
            menu.appendChild(btn);
        });
        switcher.appendChild(menu);
    }

    function active(lang) {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const isActive = btn.dataset.lang === lang;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        const toggle = document.querySelector('.lang-toggle');
        if (toggle) toggle.textContent = langLabel(lang);
    }

    const common = {
        en: { back: '← Back to Home', email: 'Email:', support: 'Support:', supportSite: 'Technical Support Website' },
        zh: { back: '← 返回首页', email: '邮箱：', support: '支持：', supportSite: '技术支持网站' },
        'zh-Hant': { back: '← 返回首頁', email: '信箱：', support: '支援：', supportSite: '技術支援網站' },
        ja: { back: '← ホームに戻る', email: 'メール：', support: 'サポート：', supportSite: 'テクニカルサポートサイト' },
        ko: { back: '← 홈으로 돌아가기', email: '이메일:', support: '지원:', supportSite: '기술 지원 사이트' },
        ru: { back: '← На главную', email: 'Email:', support: 'Поддержка:', supportSite: 'Сайт технической поддержки' },
        fr: { back: '← Retour à l\'accueil', email: 'E-mail :', support: 'Assistance :', supportSite: 'Site d’assistance technique' },
        de: { back: '← Zur Startseite', email: 'E-Mail:', support: 'Support:', supportSite: 'Technische Support-Website' },
        es: { back: '← Volver al inicio', email: 'Email:', support: 'Soporte:', supportSite: 'Sitio de soporte técnico' },
        pt: { back: '← Voltar ao início', email: 'Email:', support: 'Suporte:', supportSite: 'Site de suporte técnico' }
    };

    const index = {
        en: {
            title: 'MusicX - Private Cloud Music Player',
            kicker: 'Private cloud music player',
            subtitle: 'Organize local songs, connect cloud drives, create AI music, and transfer files over Wi-Fi from one focused mobile app.',
            badges: ['iOS', 'Android', 'Local first'],
            actions: ['View Screenshots', 'Support'],
            h2: ['Overview', 'Key Features', 'App Screenshots', 'What MusicX is NOT', 'Legal', 'Status', 'Support / Contact'],
            overview: 'MusicX is a private cloud music player for iOS and Android. It helps you organize and play your own audio library from local storage, connected cloud drives, and supported self-hosted sources.',
            features: ['Local music library with songs, recent plays, and recent additions', 'Cloud drive connections for browsing and playing your own music files', 'AI music creation workflow with local saving and cloud upload', 'Wi-Fi transfer for moving music between your phone and computer', 'Appearance, language, cloud account, and AI service settings', 'Optional Last.fm login for scrobbling and listening history'],
            cards: [['Library', 'Browse local songs, recent playback, recent additions, folders, albums, artists, and playlists.'], ['Cloud', 'Connect cloud drives, review transfer tasks, and quickly return to recently accessed folders.'], ['Create', 'Keep generated works organized, play results, save them locally, or upload them to cloud storage.'], ['Settings', 'Manage theme, language, cloud accounts, Wi-Fi transfer, and AI service configuration.']],
            disclaimer: ['MusicX does not provide or host copyrighted content.', 'MusicX is designed to manage content that users own or have rights to access.'],
            legal: ['Please read our policies:', 'Privacy Policy', 'Terms of Service', 'Technical Support'],
            status: ['MusicX is currently under development. Features and supported services may change over time.', '🚧 Under Development'],
            contact: ['For any questions or suggestions, please contact us:', '© 2026 MusicX. All rights reserved.', 'Your personal music space']
        },
        zh: {
            title: 'MusicX - 私有云音乐播放器', kicker: '私有云音乐播放器', subtitle: '在一个专注的移动应用中管理本地歌曲、连接云盘、创作 AI 音乐，并通过 Wi-Fi 传输文件。', badges: ['iOS', 'Android', '本地优先'], actions: ['查看截图', '技术支持'], h2: ['概览', '核心功能', '应用截图', 'MusicX 不是什么', '法律条款', '状态', '支持 / 联系'], overview: 'MusicX 是适用于 iOS 和 Android 的私有云音乐播放器，可帮助你整理并播放来自本地存储、已连接云盘和受支持自托管来源的个人音频库。', features: ['本地音乐库，包含歌曲、最近播放和最近添加', '连接云盘，浏览并播放你自己的音乐文件', 'AI 音乐创作流程，支持本地保存和上传云端', '通过 Wi-Fi 在手机和电脑之间传输音乐', '外观、语言、云账号和 AI 服务设置', '可选 Last.fm 登录，用于 scrobbling 和收听历史'], cards: [['音乐库', '浏览本地歌曲、最近播放、最近添加、文件夹、专辑、艺术家和播放列表。'], ['云盘', '连接云盘，查看传输任务，并快速返回最近访问的文件夹。'], ['创作', '整理生成作品、播放结果、保存到本地或上传到云存储。'], ['设置', '管理主题、语言、云账号、Wi-Fi 传输和 AI 服务配置。']], disclaimer: ['MusicX 不提供、不托管任何受版权保护的内容。', 'MusicX 用于管理用户拥有或有权访问的内容。'], legal: ['请阅读我们的政策：', '隐私政策', '服务条款', '技术支持'], status: ['MusicX 目前仍在开发中，功能和支持的服务可能随时间变化。', '🚧 开发中'], contact: ['如有任何问题或建议，请联系我们：', '© 2026 MusicX. 保留所有权利。', '你的个人音乐空间']
        },
        'zh-Hant': {
            title: 'MusicX - 私有雲音樂播放器', kicker: '私有雲音樂播放器', subtitle: '在一個專注的行動應用中管理本機歌曲、連接雲端硬碟、創作 AI 音樂，並透過 Wi-Fi 傳輸檔案。', badges: ['iOS', 'Android', '本機優先'], actions: ['查看截圖', '技術支援'], h2: ['概覽', '核心功能', '應用截圖', 'MusicX 不是什麼', '法律條款', '狀態', '支援 / 聯絡'], overview: 'MusicX 是適用於 iOS 和 Android 的私有雲音樂播放器，可協助你整理並播放來自本機儲存、已連接雲端硬碟和受支援自架來源的個人音訊庫。', features: ['本機音樂庫，包含歌曲、最近播放和最近加入', '連接雲端硬碟，瀏覽並播放你自己的音樂檔案', 'AI 音樂創作流程，支援本機儲存和上傳雲端', '透過 Wi-Fi 在手機和電腦之間傳輸音樂', '外觀、語言、雲端帳號和 AI 服務設定', '可選 Last.fm 登入，用於 scrobbling 和收聽記錄'], cards: [['音樂庫', '瀏覽本機歌曲、最近播放、最近加入、資料夾、專輯、藝人和播放清單。'], ['雲端', '連接雲端硬碟，查看傳輸任務，並快速返回最近存取的資料夾。'], ['創作', '整理生成作品、播放結果、儲存到本機或上傳到雲端儲存。'], ['設定', '管理主題、語言、雲端帳號、Wi-Fi 傳輸和 AI 服務設定。']], disclaimer: ['MusicX 不提供、不託管任何受版權保護的內容。', 'MusicX 用於管理使用者擁有或有權存取的內容。'], legal: ['請閱讀我們的政策：', '隱私權政策', '服務條款', '技術支援'], status: ['MusicX 目前仍在開發中，功能和支援的服務可能會隨時間變更。', '🚧 開發中'], contact: ['如有任何問題或建議，請聯絡我們：', '© 2026 MusicX. 保留所有權利。', '你的個人音樂空間']
        },
        ja: {
            title: 'MusicX - プライベートクラウド音楽プレーヤー', kicker: 'プライベートクラウド音楽プレーヤー', subtitle: 'ローカル曲の整理、クラウド接続、AI 音楽作成、Wi-Fi ファイル転送を 1 つのモバイルアプリで行えます。', badges: ['iOS', 'Android', 'ローカル優先'], actions: ['スクリーンショット', 'サポート'], h2: ['概要', '主な機能', 'アプリ画面', 'MusicX ではないもの', '法的情報', 'ステータス', 'サポート / 連絡先'], overview: 'MusicX は iOS / Android 向けのプライベートクラウド音楽プレーヤーです。ローカルストレージ、接続済みクラウド、自ホスト環境の音楽ライブラリを整理して再生できます。', features: ['曲、最近再生、最近追加を含むローカル音楽ライブラリ', 'クラウドドライブに接続して自分の音楽ファイルを閲覧・再生', 'AI 音楽作成、ローカル保存、クラウドアップロード', 'スマートフォンとパソコン間の Wi-Fi 転送', '外観、言語、クラウドアカウント、AI サービス設定', '任意の Last.fm ログインによる scrobbling と再生履歴'], cards: [['ライブラリ', 'ローカル曲、最近再生、最近追加、フォルダ、アルバム、アーティスト、プレイリストを閲覧。'], ['クラウド', 'クラウドドライブを接続し、転送タスクや最近使ったフォルダへ素早く戻れます。'], ['作成', '生成作品を整理し、再生、ローカル保存、クラウドアップロードができます。'], ['設定', 'テーマ、言語、クラウドアカウント、Wi-Fi 転送、AI サービスを管理。']], disclaimer: ['MusicX は著作権保護コンテンツを提供・ホストしません。', 'MusicX はユーザーが所有または利用権を持つコンテンツを管理するためのものです。'], legal: ['ポリシーをご確認ください：', 'プライバシーポリシー', '利用規約', 'テクニカルサポート'], status: ['MusicX は現在開発中です。機能や対応サービスは変更される場合があります。', '🚧 開発中'], contact: ['ご質問やご提案は以下までご連絡ください：', '© 2026 MusicX. All rights reserved.', 'あなたの個人音楽スペース']
        },
        ko: {
            title: 'MusicX - 프라이빗 클라우드 음악 플레이어', kicker: '프라이빗 클라우드 음악 플레이어', subtitle: '하나의 집중된 모바일 앱에서 로컬 음악을 정리하고, 클라우드 드라이브를 연결하고, AI 음악을 만들고, Wi-Fi로 파일을 전송하세요.', badges: ['iOS', 'Android', '로컬 우선'], actions: ['스크린샷 보기', '지원'], h2: ['개요', '주요 기능', '앱 스크린샷', 'MusicX가 하지 않는 일', '법적 정보', '상태', '지원 / 문의'], overview: 'MusicX는 iOS 및 Android용 프라이빗 클라우드 음악 플레이어입니다. 로컬 저장소, 연결된 클라우드 드라이브, 지원되는 자체 호스팅 소스의 개인 오디오 라이브러리를 정리하고 재생할 수 있습니다.', features: ['노래, 최근 재생, 최근 추가 항목을 포함한 로컬 음악 라이브러리', '내 음악 파일을 탐색하고 재생하기 위한 클라우드 드라이브 연결', '로컬 저장 및 클라우드 업로드를 지원하는 AI 음악 제작 흐름', '휴대폰과 컴퓨터 간 Wi-Fi 음악 전송', '외관, 언어, 클라우드 계정 및 AI 서비스 설정', 'Scrobbling 및 청취 기록을 위한 선택적 Last.fm 로그인'], cards: [['라이브러리', '로컬 노래, 최근 재생, 최근 추가, 폴더, 앨범, 아티스트, 재생목록을 탐색합니다.'], ['클라우드', '클라우드 드라이브를 연결하고 전송 작업을 확인하며 최근 폴더로 빠르게 돌아갑니다.'], ['제작', '생성된 작업을 정리하고 결과를 재생하며 로컬에 저장하거나 클라우드에 업로드합니다.'], ['설정', '테마, 언어, 클라우드 계정, Wi-Fi 전송 및 AI 서비스 구성을 관리합니다.']], disclaimer: ['MusicX는 저작권 보호 콘텐츠를 제공하거나 호스팅하지 않습니다.', 'MusicX는 사용자가 소유하거나 접근 권한이 있는 콘텐츠를 관리하도록 설계되었습니다.'], legal: ['정책을 확인해 주세요:', '개인정보 처리방침', '서비스 약관', '기술 지원'], status: ['MusicX는 현재 개발 중입니다. 기능과 지원 서비스는 시간이 지나면서 변경될 수 있습니다.', '🚧 개발 중'], contact: ['질문이나 제안이 있으면 문의해 주세요:', '© 2026 MusicX. All rights reserved.', '나만의 음악 공간']
        },
        ru: {
            title: 'MusicX - частный облачный музыкальный плеер', kicker: 'Частный облачный музыкальный плеер', subtitle: 'Организуйте локальные треки, подключайте облака, создавайте AI-музыку и передавайте файлы по Wi-Fi в одном мобильном приложении.', badges: ['iOS', 'Android', 'Local first'], actions: ['Скриншоты', 'Поддержка'], h2: ['Обзор', 'Ключевые функции', 'Скриншоты приложения', 'Чем MusicX не является', 'Правовая информация', 'Статус', 'Поддержка / Контакт'], overview: 'MusicX — частный облачный музыкальный плеер для iOS и Android. Он помогает организовывать и воспроизводить вашу аудиотеку из локального хранилища, облаков и self-hosted источников.', features: ['Локальная музыкальная библиотека с треками, недавним воспроизведением и добавлениями', 'Подключение облачных дисков для просмотра и воспроизведения ваших файлов', 'Создание AI-музыки с локальным сохранением и загрузкой в облако', 'Передача музыки между телефоном и компьютером по Wi-Fi', 'Настройки внешнего вида, языка, облачных аккаунтов и AI-сервисов', 'Опциональный вход Last.fm для scrobbling и истории прослушивания'], cards: [['Библиотека', 'Просматривайте локальные треки, недавнее воспроизведение, папки, альбомы, исполнителей и плейлисты.'], ['Облако', 'Подключайте облака, проверяйте передачи и быстро возвращайтесь к недавним папкам.'], ['Создание', 'Организуйте созданные работы, воспроизводите результаты, сохраняйте локально или загружайте в облако.'], ['Настройки', 'Управляйте темой, языком, облачными аккаунтами, Wi-Fi передачей и AI-сервисами.']], disclaimer: ['MusicX не предоставляет и не хостит защищённый авторским правом контент.', 'MusicX предназначен для управления контентом, которым пользователи владеют или имеют право пользоваться.'], legal: ['Ознакомьтесь с нашими документами:', 'Политика конфиденциальности', 'Условия обслуживания', 'Техническая поддержка'], status: ['MusicX сейчас находится в разработке. Функции и поддерживаемые сервисы могут изменяться.', '🚧 В разработке'], contact: ['По вопросам и предложениям свяжитесь с нами:', '© 2026 MusicX. Все права защищены.', 'Ваше личное музыкальное пространство']
        },
        es: {
            title: 'MusicX - Reproductor privado de música en la nube', kicker: 'Reproductor privado de música en la nube', subtitle: 'Organiza canciones locales, conecta unidades en la nube, crea música con IA y transfiere archivos por Wi-Fi desde una app móvil enfocada.', badges: ['iOS', 'Android', 'Local primero'], actions: ['Ver capturas', 'Soporte'], h2: ['Resumen', 'Funciones clave', 'Capturas de la app', 'Lo que MusicX NO es', 'Legal', 'Estado', 'Soporte / Contacto'], overview: 'MusicX es un reproductor privado de música en la nube para iOS y Android. Te ayuda a organizar y reproducir tu propia biblioteca de audio desde almacenamiento local, unidades en la nube conectadas y fuentes autohospedadas compatibles.', features: ['Biblioteca local con canciones, reproducciones recientes y añadidos recientes', 'Conexiones a unidades en la nube para explorar y reproducir tus propios archivos de música', 'Flujo de creación musical con IA con guardado local y subida a la nube', 'Transferencia por Wi-Fi para mover música entre el teléfono y el ordenador', 'Ajustes de apariencia, idioma, cuentas en la nube y servicios de IA', 'Inicio de sesión opcional en Last.fm para scrobbling e historial de escucha'], cards: [['Biblioteca', 'Explora canciones locales, reproducciones recientes, añadidos recientes, carpetas, álbumes, artistas y listas.'], ['Nube', 'Conecta unidades en la nube, revisa tareas de transferencia y vuelve rápido a carpetas recientes.'], ['Crear', 'Mantén las obras generadas organizadas, reproduce resultados, guárdalos localmente o súbelos a la nube.'], ['Ajustes', 'Gestiona tema, idioma, cuentas en la nube, transferencia Wi-Fi y configuración de servicios de IA.']], disclaimer: ['MusicX no proporciona ni aloja contenido protegido por copyright.', 'MusicX está diseñado para gestionar contenido que los usuarios poseen o tienen derecho a acceder.'], legal: ['Lee nuestras políticas:', 'Política de privacidad', 'Términos de servicio', 'Soporte técnico'], status: ['MusicX está actualmente en desarrollo. Las funciones y los servicios compatibles pueden cambiar con el tiempo.', '🚧 En desarrollo'], contact: ['Para preguntas o sugerencias, contáctanos:', '© 2026 MusicX. Todos los derechos reservados.', 'Tu espacio musical personal']
        },
        pt: {
            title: 'MusicX - Reprodutor privado de música em nuvem', kicker: 'Reprodutor privado de música em nuvem', subtitle: 'Organize músicas locais, conecte unidades em nuvem, crie música com IA e transfira arquivos por Wi-Fi em um app móvel focado.', badges: ['iOS', 'Android', 'Local primeiro'], actions: ['Ver capturas', 'Suporte'], h2: ['Visão geral', 'Recursos principais', 'Capturas do app', 'O que o MusicX NÃO é', 'Legal', 'Status', 'Suporte / Contato'], overview: 'O MusicX é um reprodutor privado de música em nuvem para iOS e Android. Ele ajuda você a organizar e reproduzir sua própria biblioteca de áudio do armazenamento local, unidades em nuvem conectadas e fontes autohospedadas compatíveis.', features: ['Biblioteca local com músicas, reproduções recentes e adições recentes', 'Conexões com unidades em nuvem para navegar e reproduzir seus próprios arquivos de música', 'Fluxo de criação musical com IA com salvamento local e envio para a nuvem', 'Transferência por Wi-Fi para mover músicas entre o telefone e o computador', 'Configurações de aparência, idioma, contas em nuvem e serviços de IA', 'Login opcional no Last.fm para scrobbling e histórico de escuta'], cards: [['Biblioteca', 'Navegue por músicas locais, reproduções recentes, adições recentes, pastas, álbuns, artistas e playlists.'], ['Nuvem', 'Conecte unidades em nuvem, revise tarefas de transferência e volte rapidamente a pastas recentes.'], ['Criar', 'Mantenha obras geradas organizadas, reproduza resultados, salve localmente ou envie para a nuvem.'], ['Ajustes', 'Gerencie tema, idioma, contas em nuvem, transferência Wi-Fi e configuração de serviços de IA.']], disclaimer: ['O MusicX não fornece nem hospeda conteúdo protegido por direitos autorais.', 'O MusicX foi criado para gerenciar conteúdo que os usuários possuem ou têm direito de acessar.'], legal: ['Leia nossas políticas:', 'Política de privacidade', 'Termos de serviço', 'Suporte técnico'], status: ['O MusicX está atualmente em desenvolvimento. Recursos e serviços compatíveis podem mudar com o tempo.', '🚧 Em desenvolvimento'], contact: ['Para dúvidas ou sugestões, entre em contato:', '© 2026 MusicX. Todos os direitos reservados.', 'Seu espaço musical pessoal']
        }
    };

    const support = {
        en: {
            title: 'Technical Support — MusicX', updated: 'Last Updated: 2026-02-03', contact: ['Contact', 'If you need help with MusicX, please contact us by email.', 'To help us troubleshoot faster, please include your device model, OS version, MusicX version, and a short description (plus screenshots if possible).'], quick: ['Quick Links', 'These pages explain how to configure popular services and how to get required app passwords.'], links: ['🌐 WebDAV: InfiniCLOUD (Apps Password / Apps Connection)', '🌐 WebDAV: Yandex Disk (App Password)', '🌐 WebDAV: Synology NAS', '🌐 WebDAV: Custom / Other Providers'], faqTitle: 'Common Questions', faq: ['Where do I find App Password / Apps Password? Open the default bookmark inside MusicX.', 'WebDAV login fails: verify server address, root path, and that you used the correct app password (not your main login password).', 'Some files don’t show up: check account permissions and whether the service supports directory listing over WebDAV.', 'Playback issues: try re-importing the file, check codec support, and confirm the file is not corrupted.'], copyright: ['Copyright Notice', 'MusicX does not provide or host copyrighted content. Please only access media that you own or have rights to use.'], legal: ['Legal', 'Please read our policies:', '📄 Privacy Policy', '📋 Terms of Service']
        },
        zh: {
            title: '技术支持 — MusicX', updated: '更新日期：2026-02-03', contact: ['联系支持', '如你在使用 MusicX 过程中遇到问题，请通过邮件联系我们。', '为了更快定位问题，建议在邮件中提供：设备型号、系统版本、MusicX 版本、问题描述（尽量附截图/录屏）。'], quick: ['快速入口', '这些页面会说明常见服务的配置方法，以及如何获取所需的应用密码（App Password / Apps Password）。'], links: ['🌐 WebDAV：InfiniCLOUD（Apps Password / Apps Connection）', '🌐 WebDAV：Yandex Disk（App Password）', '🌐 WebDAV：Synology 群晖 NAS', '🌐 WebDAV：自定义/其他服务商'], faqTitle: '常见问题', faq: ['App Password / Apps Password 在哪获取？可直接在 MusicX 的【书签】里打开默认书签获取。', 'WebDAV 登录失败：请核对服务器地址、根路径，并确认使用的是“应用密码”（而不是官网登录密码）。', '部分文件不显示：请检查账号权限，以及服务端是否支持 WebDAV 目录列表。', '播放异常：可尝试重新导入文件，检查编码格式是否支持，并确认文件未损坏。'], copyright: ['版权提示', 'MusicX 不提供、不托管任何受版权保护的内容。请仅访问你拥有或有权使用的媒体内容。'], legal: ['法律条款', '请阅读我们的政策：', '📄 隐私政策', '📋 服务条款']
        },
        'zh-Hant': {
            title: '技術支援 — MusicX', updated: '更新日期：2026-02-03', contact: ['聯絡支援', '如你在使用 MusicX 過程中遇到問題，請透過電子郵件聯絡我們。', '為了更快定位問題，建議在郵件中提供：裝置型號、系統版本、MusicX 版本、問題描述（盡量附截圖/錄影）。'], quick: ['快速入口', '這些頁面會說明常見服務的設定方法，以及如何取得所需的應用程式密碼（App Password / Apps Password）。'], links: ['🌐 WebDAV：InfiniCLOUD（Apps Password / Apps Connection）', '🌐 WebDAV：Yandex Disk（App Password）', '🌐 WebDAV：Synology NAS', '🌐 WebDAV：自訂/其他服務商'], faqTitle: '常見問題', faq: ['App Password / Apps Password 在哪裡取得？可直接在 MusicX 的「書籤」裡開啟預設書籤取得。', 'WebDAV 登入失敗：請核對伺服器位址、根路徑，並確認使用的是「應用程式密碼」（不是官網登入密碼）。', '部分檔案不顯示：請檢查帳號權限，以及服務端是否支援 WebDAV 目錄列表。', '播放異常：可嘗試重新匯入檔案，檢查編碼格式是否支援，並確認檔案未損壞。'], copyright: ['版權提示', 'MusicX 不提供、不託管任何受版權保護的內容。請僅存取你擁有或有權使用的媒體內容。'], legal: ['法律條款', '請閱讀我們的政策：', '📄 隱私權政策', '📋 服務條款']
        },
        ja: {
            title: 'テクニカルサポート — MusicX', updated: '最終更新日：2026-02-03', contact: ['お問い合わせ', 'MusicX に関するサポートが必要な場合は、メールでご連絡ください。', '調査を迅速に進めるため、端末機種・OS バージョン・MusicX バージョン・症状の説明（可能ならスクリーンショット/録画）を添えてください。'], quick: ['クイックリンク', 'よく使われるサービスの設定方法や、必要なアプリ用パスワードの取得方法を案内します。'], links: ['🌐 WebDAV：InfiniCLOUD（Apps Password / Apps Connection）', '🌐 WebDAV：Yandex Disk（App Password）', '🌐 WebDAV：Synology NAS', '🌐 WebDAV：カスタム/その他プロバイダー'], faqTitle: 'よくある質問', faq: ['App Password / Apps Password はどこで取得できますか？MusicX の「ブックマーク」にある既定ブックマークから開けます。', 'WebDAV にログインできない：サーバー、ルートパス、そしてメインパスワードではなくアプリ用パスワードを使っているか確認してください。', '一部のファイルが表示されない：権限や、サーバーが WebDAV のディレクトリ一覧に対応しているか確認してください。', '再生の不具合：再インポート、コーデック対応状況の確認、ファイル破損がないかをご確認ください。'], copyright: ['著作権に関する注意', 'MusicX は著作権保護されたコンテンツを提供・ホストしません。権利を有するメディアのみをご利用ください。'], legal: ['法的情報', 'ポリシーをご確認ください：', '📄 プライバシーポリシー', '📋 利用規約']
        },
        ko: {
            title: '기술 지원 — MusicX', updated: '마지막 업데이트: 2026-02-03', contact: ['문의', 'MusicX 사용 중 도움이 필요하면 이메일로 문의해 주세요.', '더 빠르게 문제를 확인할 수 있도록 기기 모델, OS 버전, MusicX 버전, 간단한 설명과 가능하면 스크린샷을 함께 보내 주세요.'], quick: ['빠른 링크', '이 페이지들은 인기 서비스 설정 방법과 필요한 앱 비밀번호를 얻는 방법을 설명합니다.'], links: ['🌐 WebDAV: InfiniCLOUD (Apps Password / Apps Connection)', '🌐 WebDAV: Yandex Disk (App Password)', '🌐 WebDAV: Synology NAS', '🌐 WebDAV: 사용자 지정 / 기타 제공업체'], faqTitle: '자주 묻는 질문', faq: ['App Password / Apps Password는 어디에서 찾나요? MusicX의 기본 북마크를 열어 확인할 수 있습니다.', 'WebDAV 로그인이 실패하면 서버 주소, 루트 경로, 기본 비밀번호가 아닌 올바른 앱 비밀번호를 사용했는지 확인하세요.', '일부 파일이 보이지 않으면 계정 권한과 서비스가 WebDAV 디렉터리 목록을 지원하는지 확인하세요.', '재생 문제가 있으면 파일을 다시 가져오고 코덱 지원 여부와 파일 손상 여부를 확인하세요.'], copyright: ['저작권 안내', 'MusicX는 저작권 보호 콘텐츠를 제공하거나 호스팅하지 않습니다. 소유하거나 사용할 권리가 있는 미디어만 이용하세요.'], legal: ['법적 정보', '정책을 확인해 주세요:', '📄 개인정보 처리방침', '📋 서비스 약관']
        },
        ru: {
            title: 'Техническая поддержка — MusicX', updated: 'Дата обновления: 2026-02-03', contact: ['Связаться с поддержкой', 'Если вам нужна помощь с MusicX, напишите нам на email.', 'Чтобы мы быстрее разобрались, укажите модель устройства, версию ОС, версию MusicX и краткое описание проблемы (по возможности со скриншотами/записью экрана).'], quick: ['Быстрые ссылки', 'Здесь собраны страницы по настройке популярных сервисов и получению необходимых паролей приложений.'], links: ['🌐 WebDAV: InfiniCLOUD (Apps Password / Apps Connection)', '🌐 WebDAV: Yandex Disk (App Password)', '🌐 WebDAV: Synology NAS', '🌐 WebDAV: Пользовательский / другие провайдеры'], faqTitle: 'Частые вопросы', faq: ['Где взять App Password / Apps Password? Откройте закладку по умолчанию внутри MusicX.', 'Не удаётся войти по WebDAV: проверьте адрес сервера, корневой путь и что вы используете пароль приложения (а не основной пароль).', 'Некоторые файлы не отображаются: проверьте права доступа и поддержку листинга каталогов по WebDAV на стороне сервиса.', 'Проблемы с воспроизведением: попробуйте переимпортировать файл, проверьте поддержку кодека и отсутствие повреждений.'], copyright: ['Уведомление об авторских правах', 'MusicX не предоставляет и не хостит контент, защищённый авторским правом. Используйте только медиа, на которые у вас есть права.'], legal: ['Правовая информация', 'Пожалуйста, ознакомьтесь с нашими документами:', '📄 Политика конфиденциальности', '📋 Условия обслуживания']
        },
        es: { title: 'Soporte técnico — MusicX', updated: 'Última actualización: 2026-02-03', contact: ['Contacto', 'Si necesitas ayuda con MusicX, contáctanos por email.', 'Para ayudarnos a diagnosticar más rápido, incluye el modelo del dispositivo, la versión del sistema operativo, la versión de MusicX y una breve descripción del problema, además de capturas si es posible.'], quick: ['Enlaces rápidos', 'Estas páginas explican cómo configurar servicios populares y cómo obtener las contraseñas de aplicación necesarias.'], links: ['🌐 WebDAV: InfiniCLOUD (Apps Password / Apps Connection)', '🌐 WebDAV: Yandex Disk (contraseña de aplicación)', '🌐 WebDAV: Synology NAS', '🌐 WebDAV: personalizado / otros proveedores'], faqTitle: 'Preguntas frecuentes', faq: ['¿Dónde encuentro App Password / Apps Password? Abre el marcador predeterminado dentro de MusicX.', 'Error de inicio de sesión WebDAV: verifica la dirección del servidor, la ruta raíz y que uses la contraseña de aplicación correcta, no la contraseña principal de inicio de sesión.', 'Si algunos archivos no aparecen, revisa los permisos de la cuenta y si el servicio admite el listado de directorios mediante WebDAV.', 'Problemas de reproducción: intenta volver a importar el archivo, comprueba la compatibilidad del códec y confirma que el archivo no esté dañado.'], copyright: ['Aviso de copyright', 'MusicX no proporciona ni aloja contenido protegido por copyright. Accede solo a medios que poseas o tengas derecho a usar.'], legal: ['Legal', 'Lee nuestras políticas:', '📄 Política de privacidad', '📋 Términos de servicio'] },
        pt: { title: 'Suporte técnico — MusicX', updated: 'Última atualização: 2026-02-03', contact: ['Contato', 'Se precisar de ajuda com o MusicX, entre em contato por email.', 'Para ajudar no diagnóstico mais rápido, inclua o modelo do dispositivo, a versão do sistema operacional, a versão do MusicX e uma breve descrição do problema, além de capturas se possível.'], quick: ['Links rápidos', 'Estas páginas explicam como configurar serviços populares e como obter as senhas de aplicativo necessárias.'], links: ['🌐 WebDAV: InfiniCLOUD (Apps Password / Apps Connection)', '🌐 WebDAV: Yandex Disk (senha de aplicativo)', '🌐 WebDAV: Synology NAS', '🌐 WebDAV: personalizado / outros provedores'], faqTitle: 'Perguntas frequentes', faq: ['Onde encontro App Password / Apps Password? Abra o favorito padrão dentro do MusicX.', 'Falha no login WebDAV: verifique o endereço do servidor, o caminho raiz e se você usou a senha de aplicativo correta, não a senha principal de login.', 'Se alguns arquivos não aparecerem, confira as permissões da conta e se o serviço oferece listagem de diretórios via WebDAV.', 'Problemas de reprodução: tente reimportar o arquivo, verifique a compatibilidade do codec e confirme que o arquivo não está corrompido.'], copyright: ['Aviso de direitos autorais', 'O MusicX não fornece nem hospeda conteúdo protegido por direitos autorais. Acesse apenas mídias que você possui ou tem direito de usar.'], legal: ['Legal', 'Leia nossas políticas:', '📄 Política de privacidade', '📋 Termos de serviço'] }
    };

    index.fr = { ...index.en, title: 'MusicX - Lecteur de musique cloud privé', kicker: 'Lecteur de musique cloud privé', subtitle: 'Organisez vos morceaux locaux, connectez vos clouds, créez de la musique avec IA et transférez des fichiers en Wi-Fi depuis une app mobile ciblée.', actions: ['Voir les captures', 'Assistance'], h2: ['Aperçu', 'Fonctionnalités clés', 'Captures de l\'application', 'Ce que MusicX n\'est pas', 'Mentions légales', 'Statut', 'Assistance / Contact'], overview: 'MusicX est un lecteur de musique cloud privé pour iOS et Android. Il vous aide à organiser et lire votre bibliothèque audio depuis le stockage local, des clouds connectés et des sources auto-hébergées compatibles.', legal: ['Veuillez lire nos politiques :', 'Politique de confidentialité', 'Conditions d\'utilisation', 'Assistance technique'], status: ['MusicX est actuellement en développement. Les fonctionnalités et services pris en charge peuvent évoluer.', '🚧 En développement'], contact: ['Pour toute question ou suggestion, contactez-nous :', '© 2026 MusicX. Tous droits réservés.', 'Votre espace musical personnel'] };
    index.de = { ...index.en, title: 'MusicX - Privater Cloud-Musikplayer', kicker: 'Privater Cloud-Musikplayer', subtitle: 'Organisieren Sie lokale Songs, verbinden Sie Cloud-Laufwerke, erstellen Sie KI-Musik und übertragen Sie Dateien per WLAN in einer fokussierten mobilen App.', actions: ['Screenshots ansehen', 'Support'], h2: ['Überblick', 'Hauptfunktionen', 'App-Screenshots', 'Was MusicX NICHT ist', 'Rechtliches', 'Status', 'Support / Kontakt'], overview: 'MusicX ist ein privater Cloud-Musikplayer für iOS und Android. Die App hilft Ihnen, Ihre eigene Audiobibliothek aus lokalem Speicher, verbundenen Cloud-Laufwerken und unterstützten selbst gehosteten Quellen zu organisieren und abzuspielen.', legal: ['Bitte lesen Sie unsere Richtlinien:', 'Datenschutzrichtlinie', 'Nutzungsbedingungen', 'Technischer Support'], status: ['MusicX befindet sich derzeit in Entwicklung. Funktionen und unterstützte Dienste können sich ändern.', '🚧 In Entwicklung'], contact: ['Bei Fragen oder Vorschlägen kontaktieren Sie uns bitte:', '© 2026 MusicX. Alle Rechte vorbehalten.', 'Ihr persönlicher Musikbereich'] };

    function applyIndex(lang) {
        const t = index[lang] || index.en;
        document.title = t.title;
        txt('.hero-kicker', t.kicker);
        txt('.subtitle', t.subtitle);
        all('.platform-badges .badge', t.badges);
        all('.hero-actions .button', t.actions);
        txt('#overview h2', t.h2[0]); txt('#overview p', t.overview);
        txt('#features h2', t.h2[1]); all('.feature-item', t.features);
        txt('#screenshots h2', t.h2[2]);
        document.querySelectorAll('.screenshot-card').forEach((card, i) => {
            txt('h3', t.cards[i][0], card);
            txt('p', t.cards[i][1], card);
        });
        txt('#disclaimer h2', t.h2[3]); all('#disclaimer strong', t.disclaimer);
        txt('#privacy h2', t.h2[4]); txt('#privacy .info-box p', t.legal[0]);
        all('#privacy a', t.legal.slice(1));
        txt('#status h2', t.h2[5]); txt('#status p', t.status[0]); txt('#status .status-badge', t.status[1]);
        txt('#contact h2', t.h2[6]); txt('#contact > p', t.contact[0]);
        const c = common[lang] || common.en;
        const contactPs = document.querySelectorAll('#contact p');
        if (contactPs[1]) contactPs[1].innerHTML = '📧 ' + c.email + ' <a href="mailto:dec12230713@163.com">dec12230713@163.com</a>';
        if (contactPs[2]) contactPs[2].innerHTML = '🛟 ' + c.support + ' <a href="support.html">' + c.supportSite + '</a>';
        all('footer .contact p', [t.contact[1], t.contact[2]]);
    }

    support.fr = { ...support.en, title: 'Assistance technique — MusicX', updated: 'Dernière mise à jour : 2026-02-03', contact: ['Contact', 'Si vous avez besoin d\'aide avec MusicX, contactez-nous par e-mail.', 'Pour nous aider à diagnostiquer plus vite, indiquez le modèle de votre appareil, la version du système, la version de MusicX et une brève description, avec des captures si possible.'], quick: ['Liens rapides', 'Ces pages expliquent comment configurer les services populaires et obtenir les mots de passe d\'application requis.'], links: ['🌐 WebDAV : InfiniCLOUD (Apps Password / Apps Connection)', '🌐 WebDAV : Yandex Disk (mot de passe d\'application)', '🌐 WebDAV : Synology NAS', '🌐 WebDAV : personnalisé / autres fournisseurs'], faqTitle: 'Questions fréquentes', faq: ['Où trouver App Password / Apps Password ? Ouvrez le favori par défaut dans MusicX.', 'La connexion WebDAV échoue : vérifiez l\'adresse du serveur, le chemin racine et l\'utilisation du bon mot de passe d\'application, pas votre mot de passe principal.', 'Certains fichiers ne s\'affichent pas : vérifiez les autorisations du compte et la prise en charge du listage de dossiers via WebDAV.', 'Problèmes de lecture : réimportez le fichier, vérifiez la prise en charge du codec et assurez-vous que le fichier n\'est pas endommagé.'], copyright: ['Avis de droit d\'auteur', 'MusicX ne fournit ni n\'héberge de contenus protégés par le droit d\'auteur. Accédez uniquement aux médias que vous possédez ou avez le droit d\'utiliser.'], legal: ['Mentions légales', 'Veuillez lire nos politiques :', '📄 Politique de confidentialité', '📋 Conditions d\'utilisation'] };
    support.de = { ...support.en, title: 'Technischer Support — MusicX', updated: 'Zuletzt aktualisiert: 2026-02-03', contact: ['Kontakt', 'Wenn Sie Hilfe mit MusicX benötigen, kontaktieren Sie uns bitte per E-Mail.', 'Damit wir schneller helfen können, nennen Sie bitte Gerätemodell, Betriebssystemversion, MusicX-Version und eine kurze Fehlerbeschreibung, möglichst mit Screenshots.'], quick: ['Schnellzugriffe', 'Diese Seiten erklären die Einrichtung beliebter Dienste und das Abrufen erforderlicher App-Passwörter.'], links: ['🌐 WebDAV: InfiniCLOUD (Apps Password / Apps Connection)', '🌐 WebDAV: Yandex Disk (App-Passwort)', '🌐 WebDAV: Synology NAS', '🌐 WebDAV: Benutzerdefiniert / andere Anbieter'], faqTitle: 'Häufige Fragen', faq: ['Wo finde ich App Password / Apps Password? Öffnen Sie das Standard-Lesezeichen in MusicX.', 'WebDAV-Anmeldung schlägt fehl: Prüfen Sie Serveradresse, Stammverzeichnis und ob Sie das richtige App-Passwort verwenden, nicht Ihr Hauptpasswort.', 'Einige Dateien erscheinen nicht: Prüfen Sie Kontoberechtigungen und ob der Dienst Verzeichnislisten über WebDAV unterstützt.', 'Wiedergabeprobleme: Importieren Sie die Datei erneut, prüfen Sie Codec-Unterstützung und stellen Sie sicher, dass die Datei nicht beschädigt ist.'], copyright: ['Urheberrechtshinweis', 'MusicX stellt keine urheberrechtlich geschützten Inhalte bereit und hostet sie nicht. Greifen Sie nur auf Medien zu, die Ihnen gehören oder zu deren Nutzung Sie berechtigt sind.'], legal: ['Rechtliches', 'Bitte lesen Sie unsere Richtlinien:', '📄 Datenschutzrichtlinie', '📋 Nutzungsbedingungen'] };

    function applySupport(lang) {
        const t = support[lang] || support.en;
        const c = common[lang] || common.en;
        document.title = t.title;
        txt('#back-button', c.back);
        txt('#title', t.title); txt('#last-updated', t.updated);
        txt('#contact-title', t.contact[0]); txt('#contact-desc', t.contact[1]); txt('#email-label', c.email); txt('#contact-tip', t.contact[2]);
        txt('#quick-links-title', t.quick[0]); txt('#quick-links-desc', t.quick[1]);
        const urls = ['webdav/infini-cloud.html', 'webdav/yandex-disk.html', 'webdav/synology.html', 'webdav/custom.html'];
        const q = document.getElementById('quick-links');
        if (q) {
            q.innerHTML = '';
            t.links.forEach((label, i) => {
                const div = document.createElement('div');
                div.className = 'link-item';
                div.innerHTML = '<a href="' + urls[i] + '">' + label + '</a>';
                q.appendChild(div);
            });
        }
        txt('#faq-title', t.faqTitle);
        const faq = document.getElementById('faq-list');
        if (faq) {
            faq.innerHTML = '';
            t.faq.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                faq.appendChild(li);
            });
        }
        txt('#copyright-title', t.copyright[0]); txt('#copyright-desc', t.copyright[1]);
        txt('#legal-title', t.legal[0]); txt('#legal-desc', t.legal[1]); txt('#privacy-link', t.legal[2]); txt('#tos-link', t.legal[3]);
    }

    const legalText = {
        privacy: {
            en: ['Privacy Policy — MusicX', 'Last Updated: 2026-01-21', ['1. Summary', 'MusicX is a private cloud music & video player. We aim to minimize data collection. Most of your data stays on your device unless you choose cloud sync/storage or connect third-party services.'], ['2. Data We Collect', 'We do not run our own user account system. MusicX does not require you to create a MusicX account.', 'Depending on features you use, MusicX may handle local library data, cloud connection data, and generated music records.'], ['3. Optional Services', 'If you connect Last.fm, cloud providers, or self-hosted sources, MusicX uses the information you provide only to enable those features. Third-party services are governed by their own policies.'], ['4. Permissions', 'MusicX may request local storage/media library access, local network access for Wi-Fi transfer, and background audio playback permissions. You can control permissions in system settings.'], ['5. Contact', '<strong>Email:</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>Support:</strong> <a href="support.html">Technical Support Website</a>']],
            zh: ['隐私政策 — MusicX', '更新日期：2026-01-21', ['1. 概要', 'MusicX 是一款私有云音乐与视频播放器。我们尽量减少数据收集。除非你选择云同步/存储或连接第三方服务，大多数数据都保留在你的设备上。'], ['2. 我们处理的数据', '我们不运营自己的用户账号系统。MusicX 不要求你创建 MusicX 账号。', '根据你使用的功能，MusicX 可能处理本地媒体库数据、云连接数据和生成音乐记录。'], ['3. 可选服务', '如果你连接 Last.fm、云服务商或自托管来源，MusicX 仅使用你提供的信息来启用相关功能。第三方服务适用其自身政策。'], ['4. 权限', 'MusicX 可能请求本地存储/媒体库访问、本地网络访问（用于 Wi-Fi 传输）和后台音频播放权限。你可以在系统设置中控制权限。'], ['5. 联系方式', '<strong>邮箱：</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>支持：</strong> <a href="support.html">技术支持网站</a>']],
            'zh-Hant': ['隱私權政策 — MusicX', '更新日期：2026-01-21', ['1. 概要', 'MusicX 是一款私有雲音樂與影片播放器。我們盡量減少資料收集。除非你選擇雲端同步/儲存或連接第三方服務，大多數資料都保留在你的裝置上。'], ['2. 我們處理的資料', '我們不營運自己的使用者帳號系統。MusicX 不要求你建立 MusicX 帳號。', '根據你使用的功能，MusicX 可能處理本機媒體庫資料、雲端連接資料和生成音樂記錄。'], ['3. 可選服務', '如果你連接 Last.fm、雲端服務商或自架來源，MusicX 僅使用你提供的資訊來啟用相關功能。第三方服務適用其自身政策。'], ['4. 權限', 'MusicX 可能請求本機儲存/媒體庫存取、本機網路存取（用於 Wi-Fi 傳輸）和背景音訊播放權限。你可以在系統設定中控制權限。'], ['5. 聯絡方式', '<strong>信箱：</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>支援：</strong> <a href="support.html">技術支援網站</a>']],
            ja: ['プライバシーポリシー — MusicX', '最終更新日：2026-01-21', ['1. 概要', 'MusicX はプライベートクラウド音楽・動画プレーヤーです。データ収集は最小限に抑えています。クラウド同期/保存や第三者サービスを接続しない限り、多くのデータは端末内に残ります。'], ['2. 取り扱うデータ', 'MusicX は独自のユーザーアカウントシステムを運用しておらず、MusicX アカウント作成は不要です。', '利用機能に応じて、ローカルライブラリデータ、クラウド接続データ、生成音楽の記録を扱う場合があります。'], ['3. 任意サービス', 'Last.fm、クラウドプロバイダー、自ホストソースを接続した場合、MusicX はその機能を有効にするために提供情報を使用します。第三者サービスには各自のポリシーが適用されます。'], ['4. 権限', 'MusicX はローカルストレージ/メディアライブラリ、Wi-Fi 転送用ローカルネットワーク、バックグラウンド再生の権限を求める場合があります。権限はシステム設定で管理できます。'], ['5. 連絡先', '<strong>メール：</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>サポート：</strong> <a href="support.html">テクニカルサポートサイト</a>']],
            ko: ['개인정보 처리방침 — MusicX', '마지막 업데이트: 2026-01-21', ['1. 요약', 'MusicX는 프라이빗 클라우드 음악 및 비디오 플레이어입니다. 데이터 수집을 최소화하며, 클라우드 동기화/저장 또는 타사 서비스를 연결하지 않는 한 대부분의 데이터는 기기에 남아 있습니다.'], ['2. 처리하는 데이터', 'MusicX는 자체 사용자 계정 시스템을 운영하지 않으며 MusicX 계정 생성을 요구하지 않습니다.', '사용하는 기능에 따라 로컬 라이브러리 데이터, 클라우드 연결 데이터, 생성 음악 기록을 처리할 수 있습니다.'], ['3. 선택 서비스', 'Last.fm, 클라우드 제공업체 또는 자체 호스팅 소스를 연결하면 MusicX는 해당 기능을 제공하기 위해 사용자가 제공한 정보만 사용합니다. 타사 서비스에는 해당 서비스의 정책이 적용됩니다.'], ['4. 권한', 'MusicX는 로컬 저장소/미디어 라이브러리 접근, Wi-Fi 전송을 위한 로컬 네트워크 접근, 백그라운드 오디오 재생 권한을 요청할 수 있습니다. 권한은 시스템 설정에서 관리할 수 있습니다.'], ['5. 문의', '<strong>이메일:</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>지원:</strong> <a href="support.html">기술 지원 사이트</a>']],
            fr: ['Politique de confidentialité — MusicX', 'Dernière mise à jour : 2026-01-21', ['1. Résumé', 'MusicX est un lecteur privé de musique et vidéo cloud. Nous cherchons à limiter la collecte de données. La plupart de vos données restent sur votre appareil, sauf si vous choisissez la synchronisation/le stockage cloud ou connectez des services tiers.'], ['2. Données que nous collectons', 'Nous n’exploitons pas notre propre système de comptes utilisateur. MusicX ne vous oblige pas à créer un compte MusicX.', 'Selon les fonctionnalités utilisées, MusicX peut traiter des données de bibliothèque locale, des données de connexion cloud et des enregistrements de musique générée.'], ['3. Services facultatifs', 'Si vous connectez Last.fm, des fournisseurs cloud ou des sources auto-hébergées, MusicX utilise les informations que vous fournissez uniquement pour activer ces fonctionnalités. Les services tiers sont régis par leurs propres politiques.'], ['4. Autorisations', 'MusicX peut demander l’accès au stockage local ou à la médiathèque, l’accès au réseau local pour le transfert Wi-Fi et les autorisations de lecture audio en arrière-plan. Vous pouvez gérer ces autorisations dans les réglages du système.'], ['5. Contact', '<strong>E-mail :</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>Assistance :</strong> <a href="support.html">Site d’assistance technique</a>']],
            de: ['Datenschutzrichtlinie — MusicX', 'Zuletzt aktualisiert: 2026-01-21', ['1. Zusammenfassung', 'MusicX ist ein privater Cloud-Musik- und Videoplayer. Wir möchten die Datenerfassung minimieren. Die meisten Ihrer Daten bleiben auf Ihrem Gerät, sofern Sie nicht Cloud-Synchronisierung/Speicher nutzen oder Drittanbieter-Dienste verbinden.'], ['2. Daten, die wir verarbeiten', 'Wir betreiben kein eigenes Benutzerkontosystem. MusicX verlangt nicht, dass Sie ein MusicX-Konto erstellen.', 'Je nach genutzten Funktionen kann MusicX lokale Bibliotheksdaten, Cloud-Verbindungsdaten und Datensätze generierter Musik verarbeiten.'], ['3. Optionale Dienste', 'Wenn Sie Last.fm, Cloud-Anbieter oder selbst gehostete Quellen verbinden, verwendet MusicX die von Ihnen bereitgestellten Informationen nur, um diese Funktionen zu ermöglichen. Für Drittanbieterdienste gelten deren eigene Richtlinien.'], ['4. Berechtigungen', 'MusicX kann Zugriff auf lokalen Speicher oder die Medienbibliothek, lokalen Netzwerkzugriff für die WLAN-Übertragung und Berechtigungen für Audiowiedergabe im Hintergrund anfordern. Sie können Berechtigungen in den Systemeinstellungen steuern.'], ['5. Kontakt', '<strong>E-Mail:</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>Support:</strong> <a href="support.html">Technische Support-Website</a>']],
            ru: ['Политика конфиденциальности — MusicX', 'Дата обновления: 2026-01-21', ['1. Кратко', 'MusicX — частный облачный музыкальный и видеоплеер. Мы стремимся минимизировать сбор данных. Большая часть данных остаётся на устройстве, если вы не включаете облачную синхронизацию/хранение или сторонние сервисы.'], ['2. Какие данные обрабатываются', 'Мы не используем собственную систему аккаунтов. MusicX не требует создания аккаунта MusicX.', 'В зависимости от функций MusicX может обрабатывать данные локальной библиотеки, данные подключения к облаку и записи созданной музыки.'], ['3. Дополнительные сервисы', 'При подключении Last.fm, облачных провайдеров или self-hosted источников MusicX использует предоставленные данные только для работы этих функций. На сторонние сервисы распространяются их собственные правила.'], ['4. Разрешения', 'MusicX может запросить доступ к локальному хранилищу/медиатеке, локальной сети для Wi-Fi передачи и фоновому аудио. Разрешениями можно управлять в настройках системы.'], ['5. Контакты', '<strong>Email:</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>Поддержка:</strong> <a href="support.html">Сайт технической поддержки</a>']]
        ,
            es: ['Política de privacidad — MusicX', 'Última actualización: 2026-01-21', ['1. Resumen', 'MusicX es un reproductor privado de música y video en la nube. Buscamos minimizar la recopilación de datos. La mayor parte de tus datos permanece en tu dispositivo salvo que elijas sincronización/almacenamiento en la nube o conectes servicios de terceros.'], ['2. Datos que procesamos', 'No operamos un sistema propio de cuentas de usuario. MusicX no requiere que crees una cuenta de MusicX.', 'Según las funciones que uses, MusicX puede procesar datos de biblioteca local, datos de conexión a la nube y registros de música generada.'], ['3. Servicios opcionales', 'Si conectas Last.fm, proveedores en la nube o fuentes autohospedadas, MusicX usa la información que proporcionas solo para habilitar esas funciones. Los servicios de terceros se rigen por sus propias políticas.'], ['4. Permisos', 'MusicX puede solicitar acceso al almacenamiento local o biblioteca multimedia, acceso a la red local para la transferencia por Wi-Fi y permisos de reproducción de audio en segundo plano. Puedes controlar los permisos en los ajustes del sistema.'], ['5. Contacto', '<strong>Email:</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>Soporte:</strong> <a href="support.html">Sitio de soporte técnico</a>']],
            pt: ['Política de privacidade — MusicX', 'Última atualização: 2026-01-21', ['1. Resumo', 'O MusicX é um reprodutor privado de música e vídeo em nuvem. Buscamos minimizar a coleta de dados. A maior parte dos seus dados permanece no dispositivo, salvo se você escolher sincronização/armazenamento em nuvem ou conectar serviços de terceiros.'], ['2. Dados que processamos', 'Não operamos um sistema próprio de contas de usuário. O MusicX não exige que você crie uma conta MusicX.', 'Dependendo dos recursos usados, o MusicX pode processar dados da biblioteca local, dados de conexão com nuvem e registros de música gerada.'], ['3. Serviços opcionais', 'Ao conectar Last.fm, provedores em nuvem ou fontes autohospedadas, o MusicX usa as informações que você fornece apenas para habilitar esses recursos. Serviços de terceiros são regidos por suas próprias políticas.'], ['4. Permissões', 'O MusicX pode solicitar acesso ao armazenamento local ou biblioteca de mídia, acesso à rede local para transferência por Wi-Fi e permissões de reprodução de áudio em segundo plano. Você pode controlar as permissões nas configurações do sistema.'], ['5. Contato', '<strong>Email:</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>Suporte:</strong> <a href="support.html">Site de suporte técnico</a>']]
        },
        terms: {
            en: ['Terms of Service — MusicX', 'Last Updated: 2026-01-21', ['1. Acceptance of Terms', 'By downloading, installing, accessing, or using MusicX, you agree to these Terms of Service. If you do not agree, please do not use the app.'], ['2. Service Description', 'MusicX is a private cloud music and video player for iOS and Android. It helps users manage and play media they own or have legal rights to access.'], ['3. User Responsibility', 'You are solely responsible for the content you access, import, store, or play using MusicX. Do not use MusicX to access, store, or distribute content in violation of copyright or other laws.'], ['4. Third-Party Services', 'MusicX may integrate with services such as Last.fm, cloud storage, WebDAV, or SMB. Your use of those services is subject to their own terms and privacy policies.'], ['5. Contact', '<strong>Email:</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>Support:</strong> <a href="support.html">Technical Support Website</a>']],
            zh: ['服务条款 — MusicX', '更新日期：2026-01-21', ['1. 接受条款', '下载、安装、访问或使用 MusicX 即表示你同意这些服务条款。如果你不同意，请不要使用本应用。'], ['2. 服务说明', 'MusicX 是适用于 iOS 和 Android 的私有云音乐与视频播放器，帮助用户管理并播放其拥有或有合法访问权的媒体。'], ['3. 用户责任', '你对通过 MusicX 访问、导入、存储或播放的内容负全部责任。不得使用 MusicX 访问、存储或分发违反版权或其他法律的内容。'], ['4. 第三方服务', 'MusicX 可能集成 Last.fm、云存储、WebDAV 或 SMB 等服务。你使用这些服务时需遵守其自身条款和隐私政策。'], ['5. 联系方式', '<strong>邮箱：</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>支持：</strong> <a href="support.html">技术支持网站</a>']],
            'zh-Hant': ['服務條款 — MusicX', '更新日期：2026-01-21', ['1. 接受條款', '下載、安裝、存取或使用 MusicX 即表示你同意這些服務條款。如果你不同意，請不要使用本應用。'], ['2. 服務說明', 'MusicX 是適用於 iOS 和 Android 的私有雲音樂與影片播放器，協助使用者管理並播放其擁有或有合法存取權的媒體。'], ['3. 使用者責任', '你對透過 MusicX 存取、匯入、儲存或播放的內容負全部責任。不得使用 MusicX 存取、儲存或分發違反版權或其他法律的內容。'], ['4. 第三方服務', 'MusicX 可能整合 Last.fm、雲端儲存、WebDAV 或 SMB 等服務。你使用這些服務時需遵守其自身條款和隱私權政策。'], ['5. 聯絡方式', '<strong>信箱：</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>支援：</strong> <a href="support.html">技術支援網站</a>']],
            ja: ['利用規約 — MusicX', '最終更新日：2026-01-21', ['1. 規約への同意', 'MusicX をダウンロード、インストール、アクセス、使用することで、本利用規約に同意したものとみなされます。同意しない場合はアプリを使用しないでください。'], ['2. サービス内容', 'MusicX は iOS / Android 向けのプライベートクラウド音楽・動画プレーヤーで、ユーザーが所有または合法的にアクセスできるメディアの管理と再生を支援します。'], ['3. ユーザーの責任', 'MusicX を使ってアクセス、インポート、保存、再生するコンテンツについてはユーザー自身が責任を負います。著作権その他の法律に違反する利用は禁止します。'], ['4. 第三者サービス', 'MusicX は Last.fm、クラウドストレージ、WebDAV、SMB などと連携する場合があります。これらの利用には各サービスの規約とポリシーが適用されます。'], ['5. 連絡先', '<strong>メール：</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>サポート：</strong> <a href="support.html">テクニカルサポートサイト</a>']],
            ko: ['서비스 약관 — MusicX', '마지막 업데이트: 2026-01-21', ['1. 약관 동의', 'MusicX를 다운로드, 설치, 접근 또는 사용하면 본 서비스 약관에 동의하는 것입니다. 동의하지 않으면 앱을 사용하지 마세요.'], ['2. 서비스 설명', 'MusicX는 iOS 및 Android용 프라이빗 클라우드 음악 및 비디오 플레이어로, 사용자가 소유하거나 합법적으로 접근할 권리가 있는 미디어를 관리하고 재생하도록 돕습니다.'], ['3. 사용자 책임', 'MusicX를 통해 접근, 가져오기, 저장 또는 재생하는 콘텐츠에 대한 책임은 전적으로 사용자에게 있습니다. 저작권 또는 기타 법률을 위반하는 콘텐츠 접근, 저장, 배포에 MusicX를 사용해서는 안 됩니다.'], ['4. 타사 서비스', 'MusicX는 Last.fm, 클라우드 저장소, WebDAV, SMB 등과 연동될 수 있습니다. 해당 서비스 이용에는 각 서비스의 약관과 개인정보 정책이 적용됩니다.'], ['5. 문의', '<strong>이메일:</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>지원:</strong> <a href="support.html">기술 지원 사이트</a>']],
            fr: ['Conditions d\'utilisation — MusicX', 'Dernière mise à jour : 2026-01-21', ['1. Acceptation des conditions', 'En téléchargeant, installant, accédant à MusicX ou en l’utilisant, vous acceptez ces Conditions d’utilisation. Si vous ne les acceptez pas, veuillez ne pas utiliser l’application.'], ['2. Description du service', 'MusicX est un lecteur privé de musique et vidéo cloud pour iOS et Android. Il aide les utilisateurs à gérer et lire les médias qu’ils possèdent ou auxquels ils ont légalement le droit d’accéder.'], ['3. Responsabilité de l’utilisateur', 'Vous êtes seul responsable des contenus auxquels vous accédez, que vous importez, stockez ou lisez avec MusicX. N’utilisez pas MusicX pour accéder à des contenus, les stocker ou les distribuer en violation du droit d’auteur ou d’autres lois.'], ['4. Services tiers', 'MusicX peut s’intégrer à des services tels que Last.fm, le stockage cloud, WebDAV ou SMB. Votre utilisation de ces services est soumise à leurs propres conditions et politiques de confidentialité.'], ['5. Contact', '<strong>E-mail :</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>Assistance :</strong> <a href="support.html">Site d’assistance technique</a>']],
            de: ['Nutzungsbedingungen — MusicX', 'Zuletzt aktualisiert: 2026-01-21', ['1. Annahme der Bedingungen', 'Durch Herunterladen, Installieren, Zugriff auf oder Nutzung von MusicX stimmen Sie diesen Nutzungsbedingungen zu. Wenn Sie nicht zustimmen, verwenden Sie die App bitte nicht.'], ['2. Beschreibung des Dienstes', 'MusicX ist ein privater Cloud-Musik- und Videoplayer für iOS und Android. Die App hilft Nutzern, Medien zu verwalten und abzuspielen, die ihnen gehören oder auf die sie rechtmäßig zugreifen dürfen.'], ['3. Verantwortung der Nutzer', 'Sie sind allein verantwortlich für Inhalte, auf die Sie mit MusicX zugreifen, die Sie importieren, speichern oder abspielen. Verwenden Sie MusicX nicht, um Inhalte unter Verletzung von Urheberrechten oder anderen Gesetzen abzurufen, zu speichern oder zu verbreiten.'], ['4. Drittanbieterdienste', 'MusicX kann Dienste wie Last.fm, Cloud-Speicher, WebDAV oder SMB integrieren. Ihre Nutzung dieser Dienste unterliegt deren eigenen Bedingungen und Datenschutzrichtlinien.'], ['5. Kontakt', '<strong>E-Mail:</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>Support:</strong> <a href="support.html">Technische Support-Website</a>']],
            ru: ['Условия обслуживания — MusicX', 'Дата обновления: 2026-01-21', ['1. Принятие условий', 'Скачивая, устанавливая, открывая или используя MusicX, вы соглашаетесь с этими Условиями обслуживания. Если вы не согласны, не используйте приложение.'], ['2. Описание сервиса', 'MusicX — частный облачный музыкальный и видеоплеер для iOS и Android, помогающий управлять и воспроизводить медиа, которыми пользователь владеет или к которым имеет законный доступ.'], ['3. Ответственность пользователя', 'Вы несёте ответственность за контент, к которому обращаетесь, который импортируете, храните или воспроизводите через MusicX. Не используйте MusicX для нарушения авторских прав или иных законов.'], ['4. Сторонние сервисы', 'MusicX может интегрироваться с Last.fm, облачными хранилищами, WebDAV или SMB. Использование этих сервисов регулируется их собственными условиями и политиками.'], ['5. Контакты', '<strong>Email:</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>Поддержка:</strong> <a href="support.html">Сайт технической поддержки</a>']]
        ,
            es: ['Términos de servicio — MusicX', 'Última actualización: 2026-01-21', ['1. Aceptación de los términos', 'Al descargar, instalar, acceder o usar MusicX, aceptas estos Términos de servicio. Si no estás de acuerdo, no uses la app.'], ['2. Descripción del servicio', 'MusicX es un reproductor privado de música y video en la nube para iOS y Android. Ayuda a los usuarios a gestionar y reproducir medios que poseen o a los que tienen derecho legal de acceso.'], ['3. Responsabilidad del usuario', 'Eres el único responsable del contenido al que accedes, importas, almacenas o reproduces usando MusicX. No uses MusicX para acceder, almacenar o distribuir contenido que infrinja derechos de autor u otras leyes.'], ['4. Servicios de terceros', 'MusicX puede integrarse con servicios como Last.fm, almacenamiento en la nube, WebDAV o SMB. Tu uso de esos servicios está sujeto a sus propios términos y políticas de privacidad.'], ['5. Contacto', '<strong>Email:</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>Soporte:</strong> <a href="support.html">Sitio de soporte técnico</a>']],
            pt: ['Termos de serviço — MusicX', 'Última atualização: 2026-01-21', ['1. Aceitação dos termos', 'Ao baixar, instalar, acessar ou usar o MusicX, você concorda com estes Termos de serviço. Se não concordar, não use o app.'], ['2. Descrição do serviço', 'O MusicX é um reprodutor privado de música e vídeo em nuvem para iOS e Android. Ele ajuda usuários a gerenciar e reproduzir mídias que possuem ou às quais têm direito legal de acesso.'], ['3. Responsabilidade do usuário', 'Você é o único responsável pelo conteúdo que acessa, importa, armazena ou reproduz usando o MusicX. Não use o MusicX para acessar, armazenar ou distribuir conteúdo que viole direitos autorais ou outras leis.'], ['4. Serviços de terceiros', 'O MusicX pode integrar serviços como Last.fm, armazenamento em nuvem, WebDAV ou SMB. O uso desses serviços está sujeito aos próprios termos e políticas de privacidade deles.'], ['5. Contato', '<strong>Email:</strong> <a href="mailto:dec12230713@163.com">dec12230713@163.com</a><br><strong>Suporte:</strong> <a href="support.html">Site de suporte técnico</a>']]
        }
    };

    function applyLegal(kind, lang) {
        const t = legalText[kind][lang] || legalText[kind].en;
        const c = common[lang] || common.en;
        document.title = t[0];
        txt('.back-button', c.back);
        const content = document.querySelector('.content');
        if (!content) return;
        content.innerHTML = '<h1>' + t[0] + '</h1><p class="last-updated">' + t[1] + '</p>' +
            t.slice(2).map(section => '<div class="section"><h2>' + section[0] + '</h2>' + section.slice(1).map(p => '<p>' + p + '</p>').join('') + '</div>').join('');
    }

    function applyWebdav(lang) {
        const title = document.querySelector('#title');
        if (!title) return;
        const enTitle = title.dataset.en || title.textContent || document.title;
        title.dataset.en = enTitle;
        const service = enTitle.replace(/ WebDAV Configuration| WebDAV 設定| WebDAV 配置|Настройка | WebDAV/g, '').trim() || 'WebDAV';
        const webdavLabels = {
            en: ['WebDAV Configuration', 'Default Configuration', 'Server Address', 'Protocol', 'Root Path', 'Authentication', 'Account & Authentication', 'Username:', 'Password:', 'Important Note', 'Official Reference'],
            zh: ['WebDAV 配置', '默认配置', '服务器地址', '协议', '根路径', '认证方式', '账号与认证', '用户名：', '密码：', '重要提示', '官方参考'],
            'zh-Hant': ['WebDAV 配置', '預設配置', '伺服器位址', '協定', '根路徑', '認證方式', '帳號與認證', '使用者名稱：', '密碼：', '重要提示', '官方參考'],
            ja: ['WebDAV 設定', 'デフォルト設定', 'サーバーアドレス', 'プロトコル', 'ルートパス', '認証方式', 'アカウントと認証', 'ユーザー名：', 'パスワード：', '重要な注意', '公式リファレンス'],
            ko: ['WebDAV 구성', '기본 구성', '서버 주소', '프로토콜', '루트 경로', '인증', '계정 및 인증', '사용자 이름:', '비밀번호:', '중요 안내', '공식 참고 자료'],
            ru: ['Настройка WebDAV', 'Конфигурация по умолчанию', 'Адрес сервера', 'Протокол', 'Корневой путь', 'Аутентификация', 'Учетная запись и аутентификация', 'Имя пользователя:', 'Пароль:', 'Важное примечание', 'Официальная справка'],
            fr: ['Configuration WebDAV', 'Configuration par défaut', 'Adresse du serveur', 'Protocole', 'Chemin racine', 'Authentification', 'Compte et authentification', 'Nom d\'utilisateur :', 'Mot de passe :', 'Remarque importante', 'Références officielles'],
            de: ['WebDAV-Konfiguration', 'Standardkonfiguration', 'Serveradresse', 'Protokoll', 'Stammverzeichnis', 'Authentifizierung', 'Konto und Authentifizierung', 'Benutzername:', 'Passwort:', 'Wichtiger Hinweis', 'Offizielle Referenzen'],
            es: ['Configuración WebDAV', 'Configuración predeterminada', 'Dirección del servidor', 'Protocolo', 'Ruta raíz', 'Autenticación', 'Cuenta y autenticación', 'Usuario:', 'Contraseña:', 'Nota importante', 'Referencia oficial'],
            pt: ['Configuração WebDAV', 'Configuração padrão', 'Endereço do servidor', 'Protocolo', 'Caminho raiz', 'Autenticação', 'Conta e autenticação', 'Usuário:', 'Senha:', 'Observação importante', 'Referência oficial']
        };
        const labels = webdavLabels[lang] || webdavLabels.en;
        title.textContent = service + ' ' + labels[0];
        document.title = title.textContent;
        txt('#config-title', '📋 ' + labels[1]);
        txt('#server-label', labels[2]);
        txt('#protocol-label', labels[3]);
        txt('#path-label', labels[4]);
        txt('#auth-label', labels[5]);
        txt('#account-title', '🔑 ' + labels[6]);
        txt('#username-label', labels[7]);
        txt('#password-label', labels[8]);
        txt('#warning-title', '⚠️ ' + labels[9]);
        txt('#refs-title', '📚 ' + labels[10]);

        const details = {
            'zh-Hant': {
                subtitle: '{service} WebDAV 連線設定指南',
                usernameDesc: '使用你的服務帳號使用者名稱或電子郵件。',
                passwordDesc: '請使用應用程式密碼或服務專用 WebDAV 密碼，不要使用主帳號密碼，除非服務明確要求。',
                tip: '在 MusicX 中開啟雲端帳號設定，選擇 WebDAV，填入本頁的伺服器位址、根路徑和帳號資訊。',
                warning: '如果登入失敗，請先確認 WebDAV 功能已啟用、伺服器位址與根路徑正確，並使用了最新的應用程式密碼。',
                bookmarkTip: '你也可以在 MusicX 內建書籤中快速開啟此服務的官方設定頁。',
                configDesc: '把下列資訊填入 MusicX 的 WebDAV 連線表單即可連接你的個人雲端儲存。',
                howto: ['登入服務的官方網站或管理後台。', '找到安全性、應用程式密碼、WebDAV 或外部連線設定。', '啟用 WebDAV，必要時建立新的應用程式密碼。', '複製伺服器位址與根路徑，並填入 MusicX。'],
                usage: ['確認帳號具有目標資料夾的讀取權限。', '在 MusicX 中新增 WebDAV 雲端帳號。', '儲存後進入雲端瀏覽器，檢查音訊檔案是否能正常列出與播放。'],
                configPoints: ['伺服器位址必須包含正確協定與主機名稱。', '根路徑可留空或使用服務要求的路徑。', '帳號欄位通常填電子郵件、使用者名稱或服務指定的登入 ID。', '密碼欄位優先使用應用程式密碼。'],
                security: ['為 MusicX 建立獨立應用程式密碼。', '不要在不信任的裝置上儲存雲端帳號。', '如果不再使用某個裝置，請在服務端撤銷對應密碼。'],
                warningList: ['不要把主帳號密碼分享給他人。', '服務變更安全設定後，可能需要重新建立應用程式密碼。', '不同服務對路徑大小寫和結尾斜線的要求可能不同。'],
                suggestions: ['先用官方範例路徑測試連線。', '把音樂檔案放在穩定的資料夾層級中。', '如果資料夾很多，首次載入可能需要較長時間。'],
                platforms: ['iOS 和 Android 版 MusicX 均可使用 WebDAV。', '只要服務支援標準 WebDAV，通常也可用自架 NAS 或私有雲。'],
                remote: ['在服務端啟用遠端存取或 HTTPS。', '確認路由器、防火牆與憑證設定正確。', '在外部網路測試 WebDAV 位址，再填入 MusicX。'],
                examples: '常見服務會使用 HTTPS 位址、根路徑、帳號和應用程式密碼四項資訊。若服務提供完整 WebDAV URL，請依其文件拆分為伺服器位址與根路徑。',
                faq: '連線失敗通常與密碼類型、根路徑或帳號權限有關。請先在服務官方頁面確認 WebDAV 已開啟，再回到 MusicX 重新儲存設定。',
                ref: '官方參考'
            },
            fr: {
                subtitle: 'Guide de configuration WebDAV pour {service}',
                usernameDesc: 'Utilisez le nom d’utilisateur ou l’e-mail de votre compte du service.',
                passwordDesc: 'Utilisez un mot de passe d’application ou le mot de passe WebDAV propre au service ; n’utilisez pas le mot de passe principal sauf si le service le demande explicitement.',
                tip: 'Dans MusicX, ouvrez les réglages des comptes cloud, choisissez WebDAV, puis saisissez l’adresse du serveur, le chemin racine et les identifiants indiqués sur cette page.',
                warning: 'Si la connexion échoue, vérifiez que WebDAV est activé, que l’adresse et le chemin racine sont corrects, et que vous utilisez le mot de passe d’application le plus récent.',
                bookmarkTip: 'Vous pouvez aussi ouvrir la page officielle de configuration depuis les favoris intégrés de MusicX.',
                configDesc: 'Renseignez ces informations dans le formulaire WebDAV de MusicX pour connecter votre stockage cloud personnel.',
                howto: ['Connectez-vous au site officiel ou au panneau d’administration du service.', 'Cherchez les réglages Sécurité, mots de passe d’application, WebDAV ou connexions externes.', 'Activez WebDAV et créez un nouveau mot de passe d’application si nécessaire.', 'Copiez l’adresse du serveur et le chemin racine, puis enregistrez-les dans MusicX.'],
                usage: ['Vérifiez que le compte dispose d’un accès en lecture au dossier musical.', 'Ajoutez un nouveau compte WebDAV dans MusicX.', 'Après l’enregistrement, ouvrez le navigateur cloud et vérifiez que les fichiers audio sont listés et lisibles.'],
                configPoints: ['L’adresse du serveur doit inclure le protocole et l’hôte corrects.', 'Le chemin racine peut rester vide ou utiliser le chemin exigé par le service.', 'Le nom d’utilisateur est généralement l’e-mail, le nom d’utilisateur ou l’identifiant de connexion du service.', 'Dans le champ de mot de passe, privilégiez un mot de passe d’application.'],
                security: ['Créez un mot de passe d’application distinct pour MusicX.', 'N’enregistrez pas vos comptes sur des appareils non fiables.', 'Révoquez le mot de passe côté service si vous cessez d’utiliser un appareil.'],
                warningList: ['Ne partagez pas le mot de passe principal de votre compte.', 'Après une modification des réglages de sécurité, vous devrez peut-être créer un nouveau mot de passe d’application.', 'Chaque service peut gérer différemment la casse et la barre oblique finale du chemin.'],
                suggestions: ['Testez d’abord avec le chemin d’exemple officiel.', 'Conservez votre musique dans une structure de dossiers stable.', 'S’il y a beaucoup de dossiers, le premier chargement peut prendre plus de temps.'],
                platforms: ['WebDAV fonctionne dans MusicX pour iOS et Android.', 'Les NAS et clouds privés fonctionnent généralement s’ils exposent un WebDAV standard.'],
                remote: ['Activez l’accès distant ou HTTPS dans le service.', 'Vérifiez le routeur, le pare-feu et les certificats.', 'Testez l’URL WebDAV depuis un réseau externe avant de l’enregistrer dans MusicX.'],
                examples: 'Les services courants utilisent quatre informations : URL HTTPS, chemin racine, compte et mot de passe d’application. Si le service fournit une URL WebDAV complète, séparez-la selon sa documentation.',
                faq: 'Les échecs de connexion sont généralement liés au type de mot de passe, au chemin racine ou aux autorisations. Confirmez sur la page officielle que WebDAV est activé, puis enregistrez à nouveau le compte dans MusicX.',
                ref: 'Référence officielle'
            },
            de: {
                subtitle: 'WebDAV-Konfigurationsanleitung für {service}',
                usernameDesc: 'Verwenden Sie den Benutzernamen oder die E-Mail-Adresse Ihres Dienstkontos.',
                passwordDesc: 'Verwenden Sie ein App-Passwort oder das dienstspezifische WebDAV-Passwort; verwenden Sie das Hauptpasswort nur, wenn der Dienst dies ausdrücklich verlangt.',
                tip: 'Öffnen Sie in MusicX die Cloud-Kontoeinstellungen, wählen Sie WebDAV und tragen Sie Serveradresse, Stammverzeichnis und Zugangsdaten von dieser Seite ein.',
                warning: 'Wenn die Anmeldung fehlschlägt, prüfen Sie, ob WebDAV aktiviert ist, ob Adresse und Stammverzeichnis korrekt sind und ob Sie das neueste App-Passwort verwenden.',
                bookmarkTip: 'Sie können die offizielle Konfigurationsseite auch über die integrierten Lesezeichen in MusicX öffnen.',
                configDesc: 'Tragen Sie diese Angaben in das WebDAV-Formular von MusicX ein, um Ihren persönlichen Cloud-Speicher zu verbinden.',
                howto: ['Melden Sie sich auf der offiziellen Website oder im Administrationsbereich des Dienstes an.', 'Suchen Sie nach Sicherheit, App-Passwörtern, WebDAV oder externen Verbindungen.', 'Aktivieren Sie WebDAV und erstellen Sie bei Bedarf ein neues App-Passwort.', 'Kopieren Sie Serveradresse und Stammverzeichnis und speichern Sie sie in MusicX.'],
                usage: ['Prüfen Sie, ob das Konto Leserechte für den Musikordner hat.', 'Fügen Sie in MusicX ein neues WebDAV-Konto hinzu.', 'Öffnen Sie nach dem Speichern den Cloud-Browser und prüfen Sie, ob Audiodateien aufgelistet und abgespielt werden.'],
                configPoints: ['Die Serveradresse muss das richtige Protokoll und den richtigen Host enthalten.', 'Das Stammverzeichnis kann leer bleiben oder den vom Dienst verlangten Pfad verwenden.', 'Der Benutzername ist meist E-Mail-Adresse, Benutzername oder Login-ID des Dienstes.', 'Verwenden Sie im Passwortfeld bevorzugt ein App-Passwort.'],
                security: ['Erstellen Sie ein separates App-Passwort für MusicX.', 'Speichern Sie Konten nicht auf nicht vertrauenswürdigen Geräten.', 'Widerrufen Sie das Passwort beim Dienst, wenn Sie ein Gerät nicht mehr verwenden.'],
                warningList: ['Teilen Sie das Hauptpasswort Ihres Kontos nicht.', 'Nach Änderungen an Sicherheitseinstellungen müssen Sie möglicherweise ein neues App-Passwort erstellen.', 'Dienste können Groß- und Kleinschreibung sowie abschließende Schrägstriche im Pfad unterschiedlich behandeln.'],
                suggestions: ['Testen Sie zuerst mit dem offiziellen Beispielpfad.', 'Bewahren Sie Musikdateien in einer stabilen Ordnerstruktur auf.', 'Bei vielen Ordnern kann das erste Laden länger dauern.'],
                platforms: ['WebDAV funktioniert in MusicX für iOS und Android.', 'NAS und private Clouds funktionieren in der Regel, wenn sie standardkonformes WebDAV bereitstellen.'],
                remote: ['Aktivieren Sie Remotezugriff oder HTTPS im Dienst.', 'Prüfen Sie Router, Firewall und Zertifikate.', 'Testen Sie die WebDAV-URL aus einem externen Netzwerk, bevor Sie sie in MusicX speichern.'],
                examples: 'Übliche Dienste verwenden vier Angaben: HTTPS-URL, Stammverzeichnis, Konto und App-Passwort. Wenn der Dienst eine vollständige WebDAV-URL bereitstellt, teilen Sie sie gemäß der Dokumentation auf.',
                faq: 'Verbindungsfehler hängen meist mit Passworttyp, Stammverzeichnis oder Berechtigungen zusammen. Bestätigen Sie auf der offiziellen Seite, dass WebDAV aktiviert ist, und speichern Sie das Konto danach erneut in MusicX.',
                ref: 'Offizielle Referenz'
            },
            es: {
                subtitle: 'Guía de configuración WebDAV para {service}',
                usernameDesc: 'Usa el nombre de usuario o el email de tu cuenta del servicio.',
                passwordDesc: 'Usa una contraseña de aplicación o la contraseña WebDAV específica del servicio; no uses la contraseña principal salvo que el servicio lo indique.',
                tip: 'En MusicX, abre la configuración de cuentas en la nube, elige WebDAV e introduce la dirección del servidor, la ruta raíz y las credenciales de esta página.',
                warning: 'Si el inicio de sesión falla, comprueba que WebDAV esté activado, que la dirección y la ruta raíz sean correctas, y que uses la contraseña de aplicación más reciente.',
                bookmarkTip: 'También puedes abrir la página oficial de configuración desde los marcadores integrados de MusicX.',
                configDesc: 'Introduce estos datos en el formulario WebDAV de MusicX para conectar tu almacenamiento personal en la nube.',
                howto: ['Inicia sesión en el sitio oficial o panel de administración del servicio.', 'Busca Seguridad, contraseñas de aplicación, WebDAV o conexiones externas.', 'Activa WebDAV y crea una contraseña de aplicación nueva si es necesario.', 'Copia la dirección del servidor y la ruta raíz, y guárdalas en MusicX.'],
                usage: ['Comprueba que la cuenta tenga permiso de lectura sobre la carpeta de música.', 'Añade una cuenta WebDAV nueva en MusicX.', 'Después de guardar, abre el navegador en la nube y verifica que los archivos de audio se listen y reproduzcan.'],
                configPoints: ['La dirección del servidor debe incluir el protocolo y el host correctos.', 'La ruta raíz puede quedar vacía o usar la ruta exigida por el servicio.', 'El usuario suele ser email, nombre de usuario o ID de inicio de sesión del servicio.', 'En el campo de contraseña, usa preferentemente una contraseña de aplicación.'],
                security: ['Crea una contraseña de aplicación independiente para MusicX.', 'No guardes cuentas en dispositivos que no sean de confianza.', 'Revoca la contraseña del servicio si dejas de usar un dispositivo.'],
                warningList: ['No compartas la contraseña principal de tu cuenta.', 'Después de cambios de seguridad, quizá tengas que crear otra contraseña de aplicación.', 'Cada servicio puede tratar de forma distinta mayúsculas, minúsculas y barras finales en la ruta.'],
                suggestions: ['Prueba primero con la ruta de ejemplo oficial.', 'Guarda la música en una estructura de carpetas estable.', 'Si hay muchas carpetas, la primera carga puede tardar más.'],
                platforms: ['WebDAV funciona en MusicX para iOS y Android.', 'Los NAS y nubes privadas suelen funcionar si exponen WebDAV estándar.'],
                remote: ['Activa el acceso remoto o HTTPS en el servicio.', 'Comprueba router, firewall y certificados.', 'Prueba la URL WebDAV desde una red externa antes de guardarla en MusicX.'],
                examples: 'Los servicios habituales usan cuatro datos: URL HTTPS, ruta raíz, cuenta y contraseña de aplicación. Si el servicio ofrece una URL WebDAV completa, sepárala según su documentación.',
                faq: 'Los fallos de conexión suelen deberse al tipo de contraseña, la ruta raíz o los permisos. Confirma en la página oficial que WebDAV esté activo y vuelve a guardar la cuenta en MusicX.',
                ref: 'Referencia oficial'
            },
            pt: {
                subtitle: 'Guia de configuração WebDAV para {service}',
                usernameDesc: 'Use o nome de usuário ou email da sua conta do serviço.',
                passwordDesc: 'Use uma senha de aplicativo ou a senha WebDAV específica do serviço; não use a senha principal, salvo se o serviço exigir.',
                tip: 'No MusicX, abra as configurações de conta em nuvem, escolha WebDAV e preencha o endereço do servidor, o caminho raiz e as credenciais desta página.',
                warning: 'Se o login falhar, confirme que o WebDAV está ativado, que o endereço e o caminho raiz estão corretos e que você está usando a senha de aplicativo mais recente.',
                bookmarkTip: 'Você também pode abrir a página oficial de configuração pelos favoritos integrados do MusicX.',
                configDesc: 'Preencha estes dados no formulário WebDAV do MusicX para conectar seu armazenamento pessoal em nuvem.',
                howto: ['Entre no site oficial ou painel de administração do serviço.', 'Procure Segurança, senhas de aplicativo, WebDAV ou conexões externas.', 'Ative o WebDAV e crie uma nova senha de aplicativo se necessário.', 'Copie o endereço do servidor e o caminho raiz, e salve-os no MusicX.'],
                usage: ['Confirme que a conta tem permissão de leitura na pasta de música.', 'Adicione uma nova conta WebDAV no MusicX.', 'Depois de salvar, abra o navegador em nuvem e verifique se os arquivos de áudio aparecem e tocam.'],
                configPoints: ['O endereço do servidor deve incluir o protocolo e o host corretos.', 'O caminho raiz pode ficar vazio ou usar o caminho exigido pelo serviço.', 'O usuário geralmente é email, nome de usuário ou ID de login do serviço.', 'No campo de senha, prefira usar uma senha de aplicativo.'],
                security: ['Crie uma senha de aplicativo separada para o MusicX.', 'Não salve contas em dispositivos que não sejam confiáveis.', 'Revogue a senha no serviço se deixar de usar um dispositivo.'],
                warningList: ['Não compartilhe a senha principal da sua conta.', 'Após alterações de segurança, talvez seja necessário criar outra senha de aplicativo.', 'Cada serviço pode tratar maiúsculas, minúsculas e barras finais no caminho de forma diferente.'],
                suggestions: ['Teste primeiro com o caminho de exemplo oficial.', 'Mantenha os arquivos de música em uma estrutura de pastas estável.', 'Se houver muitas pastas, o primeiro carregamento pode demorar mais.'],
                platforms: ['O WebDAV funciona no MusicX para iOS e Android.', 'NAS e nuvens privadas geralmente funcionam quando expõem WebDAV padrão.'],
                remote: ['Ative acesso remoto ou HTTPS no serviço.', 'Confira roteador, firewall e certificados.', 'Teste a URL WebDAV em uma rede externa antes de salvá-la no MusicX.'],
                examples: 'Serviços comuns usam quatro dados: URL HTTPS, caminho raiz, conta e senha de aplicativo. Se o serviço fornecer uma URL WebDAV completa, separe-a conforme a documentação.',
                faq: 'Falhas de conexão normalmente envolvem tipo de senha, caminho raiz ou permissões. Confirme na página oficial que o WebDAV está ativo e salve a conta novamente no MusicX.',
                ref: 'Referência oficial'
            }
        };

        const detail = details[lang];
        if (!detail) return;
        const fillList = (selector, items) => {
            const el = document.querySelector(selector);
            if (!el) return;
            el.innerHTML = '';
            items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                el.appendChild(li);
            });
        };
        txt('#subtitle', detail.subtitle.replace('{service}', service));
        txt('#username-desc', detail.usernameDesc);
        txt('#password-desc', detail.passwordDesc);
        txt('#tip-content', detail.tip);
        txt('#warning-content', detail.warning);
        txt('#bookmark-tip-content', detail.bookmarkTip);
        txt('#config-desc', detail.configDesc);
        fillList('#howto-list', detail.howto);
        fillList('#usage-list', detail.usage);
        fillList('#config-points-list', detail.configPoints);
        fillList('#security-list', detail.security);
        fillList('#warning-list', detail.warningList);
        fillList('#config-suggest-list', detail.suggestions);
        fillList('#platforms-list', detail.platforms);
        fillList('#remote-steps', detail.remote);
        fillList('#nas-config-list', detail.configPoints);
        fillList('#nas-access-list', detail.remote);
        html('#examples-content', '<p>' + detail.examples + '</p>');
        html('#faq-content', '<p>' + detail.faq + '</p>');
        const refs = document.querySelector('#refs-list');
        if (refs) refs.querySelectorAll('a').forEach(a => { a.textContent = detail.ref; });
    }

    function switchLang(lang) {
        lang = norm(lang);
        ensureSwitcher();
        document.documentElement.lang = lang;
        if (path === 'index.html') applyIndex(lang);
        else if (path === 'support.html') applySupport(lang);
        else if (path === 'privacy-policy.html') applyLegal('privacy', lang);
        else if (path === 'terms-of-service.html') applyLegal('terms', lang);
        else if (isWebdav) applyWebdav(lang);
        active(lang);
        save(lang);
    }

    window.switchLang = switchLang;

    window.addEventListener('load', function () {
        setTimeout(() => switchLang(initialLang()), 0);
    });
})();
