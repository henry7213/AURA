document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        slider: document.getElementById('theme-slider'),
        labels: document.querySelectorAll('.slider-label'),
        html: document.documentElement,
        desc: document.getElementById('theme-description'),
        title: document.getElementById('theme-title-display'),
        scene: document.getElementById('scene-layer'),
        foreground: document.getElementById('foreground-layer'),
        intro: document.getElementById('intro-card'),
        controls: document.querySelector('.controls-card'),
        toggle: document.getElementById('toggle-intro-btn'),
        header: document.querySelector('.intro-card .panel-header'),
        overlay: document.getElementById('welcome-overlay'),
        enterBtn: document.getElementById('enter-btn')
    };

    // Configuration
    const themes = ['deep-night', 'misty-forest', 'warm-ember'];
    const themeData = {
        'deep-night': {
            title: '午夜海岬',
            desc: '此刻，您佇立於午夜的海岬。冰冷的雨絲、洶湧的海浪與呼嘯的海風交織，帶走所有的煩惱，只留下大自然的壯闊與寧靜。',
            sounds: [
                { icon: '🌧️', label: '雨聲強度', src: 'assets/sounds/rain.mp3', vol: 0.2 },
                { icon: '🌊', label: '海浪頻率', src: 'assets/sounds/ocean-waves.mp3', vol: 0.5 },
                { icon: '💨', label: '風聲流動', src: 'assets/sounds/wind.mp3', vol: 0.3 }
            ]
        },
        'misty-forest': {
            title: '迷霧森林',
            desc: '此刻，您漫步於清晨的迷霧森林。深墨綠與松針綠的色調帶來有機的呼吸感，彷彿能聞到苔蘚與樹皮的氣息。',
            sounds: [
                { icon: '🍃', label: '林間風聲', src: 'assets/sounds/forest-wind.mp3', vol: 0.5 },
                { icon: '🐦', label: '蟲鳴鳥叫', src: 'assets/sounds/birds-and-insects.mp3', vol: 0.15 },
                { icon: '💧', label: '溪流潺潺', src: 'assets/sounds/stream.mp3', vol: 0.4 }
            ]
        },
        'warm-ember': {
            title: '溫暖營火',
            desc: '此刻，您坐在溫暖的壁爐旁。柴火燃燒的劈啪聲與飄散的火星，營造出極致的安全感，像一個溫暖的擁抱，驅散寒冷。',
            sounds: [
                { icon: '🔥', label: '營火劈啪', src: 'assets/sounds/campfire.mp3', vol: 0.5 },
                { icon: '🍂', label: '落葉沙沙', src: 'assets/sounds/rustling-leaves.mp3', vol: 0.2 },
                { icon: '🦗', label: '夜蟲低鳴', src: 'assets/sounds/night-insects-crickets.mp3', vol: 0.15 }
            ]
        }
    };

    let activeAudioTracks = [];
    let collapseTimer;

    // Helper: Create Element
    const createEl = (tag, classes = [], parent = null, styles = {}) => {
        const el = document.createElement(tag);
        if (classes.length) el.classList.add(...classes);
        Object.assign(el.style, styles);
        if (parent) parent.appendChild(el);
        return el;
    };

    // Helper: Random Range
    const random = (min, max) => Math.random() * (max - min) + min;

    // Initialization
    const init = () => {
        const savedTheme = 'deep-night';
        // const savedTheme = localStorage.getItem('selectedTheme') || 'deep-night';
        elements.slider.value = themes.indexOf(savedTheme) !== -1 ? themes.indexOf(savedTheme) : 0;
        setTheme(savedTheme, false); // Don't play audio on init
        startCollapseTimer();
        setupEventListeners();
    };

    // Event Listeners
    const setupEventListeners = () => {
        if (elements.enterBtn) {
            elements.enterBtn.addEventListener('click', () => {
                elements.overlay.classList.add('hidden');
                // Resume audio context if needed (browsers sometimes require this)
                // Then play the current theme's sounds
                const currentTheme = themes[elements.slider.value];
                updateSoundscape(currentTheme, true);
            });
        }

        elements.slider.addEventListener('input', (e) => setTheme(themes[e.target.value], true));

        elements.labels.forEach(label => {
            label.addEventListener('click', () => {
                const index = label.getAttribute('data-target');
                elements.slider.value = index;
                setTheme(themes[index], true);
            });
        });

        document.querySelectorAll('.volume-slider').forEach((slider, index) => {
            slider.addEventListener('input', (e) => {
                if (activeAudioTracks[index]) activeAudioTracks[index].volume = e.target.value / 100;
                resetCollapseTimer();
            });
        });

        // Collapse Logic
        const toggleCollapse = (e) => {
            if (e) e.stopPropagation();
            elements.intro.classList.toggle('collapsed');
            !elements.intro.classList.contains('collapsed') ? startCollapseTimer() : clearTimeout(collapseTimer);
        };

        if (elements.toggle) elements.toggle.addEventListener('click', toggleCollapse);
        if (elements.header) elements.header.addEventListener('click', toggleCollapse);

        [elements.intro, elements.controls].forEach(el => {
            if (el) {
                el.addEventListener('mousemove', resetCollapseTimer);
                el.addEventListener('touchstart', resetCollapseTimer);
            }
        });
    };

    // Timer Logic
    function startCollapseTimer() {
        clearTimeout(collapseTimer);
        collapseTimer = setTimeout(() => {
            if (elements.intro) elements.intro.classList.add('collapsed');
        }, 20000);
    }

    function resetCollapseTimer() {
        startCollapseTimer();
    }

    // Theme Logic
    function setTheme(themeName, playAudio = true) {
        const data = themeData[themeName];
        elements.html.setAttribute('data-theme', themeName);
        localStorage.setItem('selectedTheme', themeName);

        if (elements.title) elements.title.textContent = data.title;
        if (elements.desc) {
            elements.desc.style.opacity = '0';
            setTimeout(() => {
                elements.desc.innerHTML = `<p>${data.desc}</p>`;
                elements.desc.style.opacity = '1';
            }, 300);
        }

        if (elements.intro) elements.intro.classList.remove('collapsed');
        resetCollapseTimer();
        updateSoundscape(themeName, playAudio);
        createSceneParticles(themeName);
        createForeground(themeName);
    }

    function updateSoundscape(themeName, playAudio = true) {
        const soundItems = document.querySelectorAll('.sound-item');
        const sounds = themeData[themeName].sounds;

        activeAudioTracks.forEach(audio => audio && audio.pause());
        activeAudioTracks = [];

        soundItems.forEach((item, index) => {
            if (!sounds[index]) return;
            const { icon, label, src, vol } = sounds[index];
            const iconSpan = item.querySelector('.sound-icon');
            const labelSpan = item.querySelector('label');
            const slider = item.querySelector('.volume-slider');

            item.style.opacity = '0.5';
            setTimeout(() => {
                if (iconSpan) iconSpan.textContent = icon;
                if (labelSpan) labelSpan.textContent = label;
                item.style.opacity = '1';
            }, 300);

            const audio = new Audio(src);
            audio.loop = true;
            audio.volume = vol;
            slider.value = vol * 100;

            if (playAudio) {
                audio.play().catch(e => console.log("Auto-play prevented or awaiting interaction:", e));
            }
            activeAudioTracks[index] = audio;
        });
    }

    // Visuals
    function createSceneParticles(theme) {
        elements.scene.innerHTML = '';
        const s = elements.scene;
        const isMobile = window.innerWidth < 768;

        // Mobile Optimization: Significantly reduce particle count
        // Desktop: use first value, Mobile: use second value
        const getCount = (desktop, mobile) => isMobile ? mobile : desktop;

        if (theme === 'deep-night') {
            // Stars: 60 -> 20
            const starCount = getCount(60, 20);
            for (let i = 0; i < starCount; i++) {
                const size = random(1, 3);
                createEl('div', ['particle'], s, {
                    width: `${size}px`, height: `${size}px`,
                    left: `${random(0, 100)}%`, top: `${random(0, 80)}%`,
                    animation: `twinkle ${random(2, 5)}s infinite ease-in-out`,
                    animationDelay: `${random(0, 5)}s`
                });
            }
            // Wind: 5 -> 2
            const windCount = getCount(5, 2);
            for (let i = 0; i < windCount; i++) {
                createEl('div', ['wind-gust'], s, {
                    width: `${random(100, 300)}px`, top: `${random(0, 80)}%`,
                    animationDelay: `${random(0, 5)}s`, animationDuration: `${random(0.5, 1)}s`
                });
            }
            // Clouds: 5 -> 2
            const cloudCount = getCount(5, 2);
            for (let i = 0; i < cloudCount; i++) {
                const width = random(200, 500);
                createEl('div', ['night-cloud'], s, {
                    width: `${width}px`, height: `${width * 0.6}px`,
                    left: `${random(0, 100)}%`, top: `${random(0, 40)}%`,
                    animation: `cloud-drift ${random(60, 120)}s infinite linear`,
                    animationDelay: `${random(-60, 0)}s`
                });
            }
            // Rain: 100 -> 25 (Major performance saver)
            const rainCount = getCount(100, 25);
            for (let i = 0; i < rainCount; i++) {
                createEl('div', ['rain'], s, {
                    left: `${random(0, 100)}%`, top: `${random(-20, 0)}%`,
                    height: `${random(10, 30)}px`, opacity: random(0.1, 0.6),
                    animation: `rain-fall ${random(0.5, 1)}s infinite linear`,
                    animationDelay: `${random(0, 2)}s`
                });
            }
            // Waves & Lighthouse
            // On mobile, simplify layers if needed, but CSS handles layout
            const waveContainer = createEl('div', ['ocean-wave'], s);
            ['wave-back', 'wave-mid', 'wave-front'].forEach(cls => createEl('div', ['wave-layer', cls], waveContainer));

            const lighthouse = createEl('div', ['lighthouse'], s);
            createEl('div', ['lighthouse-glow'], lighthouse);

            // Beam calculation is expensive, reduce intensity or opacity on mobile (handled in CSS filters)
            createEl('div', ['lighthouse-beam'], lighthouse);
            createEl('div', ['sea-mist'], s);

        } else if (theme === 'misty-forest') {
            // God Rays: 3 -> 1
            const rayCount = getCount(3, 1);
            for (let i = 0; i < rayCount; i++) {
                createEl('div', ['god-ray'], s, { left: `${20 + i * 30}%`, animationDelay: `${i * 2}s` });
            }
            // Fog: 5 -> 2
            const fogCount = getCount(5, 2);
            for (let i = 0; i < fogCount; i++) {
                createEl('div', ['particle'], s, {
                    width: '150%', height: '200px', left: '-25%', top: `${random(0, 100)}%`,
                    background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                    borderRadius: '0', animation: `drift ${random(20, 40)}s infinite linear alternate`,
                    animationDelay: `${random(-20, 0)}s`
                });
            }
            // Leaves: 30 -> 10
            const leafCount = getCount(30, 10);
            for (let i = 0; i < leafCount; i++) {
                createEl('div', ['leaf'], s, {
                    left: `${random(0, 100)}%`, top: `${random(-20, 0)}%`,
                    animation: `leaf-fall ${random(8, 13)}s infinite linear`,
                    animationDelay: `${random(0, 10)}s`
                });
            }
            // Fireflies: 20 -> 5
            const fireflyCount = getCount(20, 5);
            for (let i = 0; i < fireflyCount; i++) {
                const fly = createEl('div', ['firefly'], s, {
                    left: `${random(0, 100)}%`, top: `${random(0, 100)}%`,
                    animation: `fly ${random(5, 10)}s infinite ease-in-out alternate`,
                    animationDelay: `${random(0, 5)}s`
                });
                fly.style.setProperty('--move-x', `${random(-100, 100)}px`);
                fly.style.setProperty('--move-y', `${random(-100, 100)}px`);
            }

        } else if (theme === 'warm-ember') {
            // Stars: 50 -> 15
            const starCount = getCount(50, 15);
            for (let i = 0; i < starCount; i++) {
                const size = random(1, 3);
                createEl('div', ['ember-star'], s, {
                    width: `${size}px`, height: `${size}px`,
                    left: `${random(0, 100)}%`, top: `${random(0, 60)}%`,
                    animationDelay: `${random(0, 5)}s`
                });
            }
            createEl('div', ['campfire-glow'], s);
            createEl('div', ['heat-haze'], s);

            // Embers: 80 -> 25
            const emberCount = getCount(80, 25);
            for (let i = 0; i < emberCount; i++) {
                const size = random(2, 6);
                createEl('div', ['particle'], s, {
                    width: `${size}px`, height: `${size}px`,
                    left: `${random(0, 100)}%`, bottom: '-10px',
                    background: 'rgba(255, 204, 128, 0.9)',
                    boxShadow: '0 0 10px rgba(255, 140, 0, 1)',
                    animation: `rise ${random(3, 8)}s infinite linear`,
                    animationDelay: `${random(0, 5)}s`
                });
            }
            // Smoke: 30 -> 8
            const smokeCount = getCount(30, 8);
            for (let i = 0; i < smokeCount; i++) createEl('div', ['smoke'], s, {
                left: `${random(0, 100)}%`, bottom: '-50px',
                animation: `smoke-rise ${random(10, 20)}s infinite linear`, animationDelay: `${random(0, 10)}s`
            });
            // Ash: 40 -> 10
            const ashCount = getCount(40, 10);
            for (let i = 0; i < ashCount; i++) createEl('div', ['ash'], s, {
                left: `${random(0, 100)}%`, top: `${random(0, 100)}%`,
                animation: `ash-float ${random(5, 15)}s infinite linear`, animationDelay: `${random(0, 5)}s`
            });
        }
    }

    function createForeground(theme) {
        elements.foreground.innerHTML = '';
        const f = elements.foreground;

        if (theme === 'deep-night') {
            createEl('div', ['moon'], f);
            createEl('div', ['moon-reflection'], f);
        } else if (theme === 'misty-forest') {
            ['back', 'mid', 'front'].forEach(layer => createEl('div', ['forest-layer', `forest-${layer}`], f));
        } else if (theme === 'warm-ember') {
            createEl('div', ['vignette'], f);
            createEl('div', ['tent-silhouette'], f);
            createEl('div', ['logs-silhouette'], f);
        }
    }

    init();
});
