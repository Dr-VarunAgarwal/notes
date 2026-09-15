// ==UserScript==
// @name         SearchDeck Pro - Spring Entrance & Latch
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  Subtle physical spring bounce on appearance with global intent latching
// @author       Varun / Gemini
// @match        https://www.google.com/search*
// @grant        GM_xmlhttpRequest
// @connect      en.wikipedia.org
// @connect      www.reddit.com
// @connect      reddit.com
// ==/UserScript==

(function() {
    'use strict';

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes deckSpringIn {
            0% {
                opacity: 0;
                transform: translateY(40px) scale(0.96);
            }
            50% {
                opacity: 1;
                transform: translateY(-8px) scale(1.01);
            }
            75% {
                transform: translateY(3px) scale(0.995);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        #searchdeck-sidebar {
            position: fixed;
            bottom: 0;
            width: 380px;
            height: 180px;
            background: #FFFFFF !important;
            border: 1px solid #dadce0 !important;
            border-bottom: none;
            border-radius: 8px 8px 0 0;
            padding: 0;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
            z-index: 9999;
            font-family: 'Inter', -apple-system, system-ui, sans-serif;
            overflow: hidden;
            display: none;
            color: #202124 !important;
            transition: height 0.35s cubic-bezier(0.19, 1, 0.22, 1),
                        transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                        left 0.3s ease, right 0.3s ease,
                        box-shadow 0.25s ease,
                        background 0.3s;
            transform: translateY(0);
        }

        /* Applied dynamically when data is ready to render */
        #searchdeck-sidebar.spring-entrance {
            animation: deckSpringIn 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        /* DOCK ALIGNMENT */
        #searchdeck-sidebar.dock-right {
            right: 25px;
            left: auto;
        }

        #searchdeck-sidebar.dock-left {
            left: 25px;
            right: auto;
        }

        /* LATCHED EXPANDED STATE */
        #searchdeck-sidebar.latched-expanded:not(.minimized) {
            height: 80vh !important;
            box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.16);
        }

        #searchdeck-sidebar.dark-vibe {
            background: #121212 !important;
            color: #E2E3E5 !important;
            border-color: #2E3033 !important;
        }

        #searchdeck-sidebar.dark-vibe .deck-header-tab {
            background: #1A1A1A !important;
            border-bottom-color: #2E3033 !important;
        }

        #searchdeck-sidebar.dark-vibe .deck-title { color: #FFFFFF !important; }
        #searchdeck-sidebar.dark-vibe .deck-text { color: #D1D5DB !important; }

        #searchdeck-sidebar.dark-vibe a {
            color: #70C5FF !important;
            text-decoration: none !important;
            border-bottom: 1px dotted #70C5FF !important;
        }
        #searchdeck-sidebar.dark-vibe a:hover { color: #A6DFFF !important; }

        #searchdeck-sidebar.dark-vibe #deck-pane-reddit a {
            color: #FFB088 !important;
            border-bottom: 1px dotted #FFB088 !important;
        }

        #searchdeck-sidebar.minimized {
            transform: translateY(calc(100% - 44px)) !important;
        }

        .deck-header-tab {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #F8F9FA;
            padding: 0 10px;
            border-bottom: 1px solid #dadce0;
            height: 44px;
            box-sizing: border-box;
            user-select: none;
            cursor: pointer;
        }

        .deck-segmented-control {
            display: flex;
            align-items: center;
            background: #EAEAEA;
            border-radius: 6px;
            padding: 2px;
            gap: 2px;
        }

        #searchdeck-sidebar.dark-vibe .deck-segmented-control { background: #252628; }

        .deck-tab-btn {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            color: #5F6368;
            transition: all 0.2s;
        }

        .deck-tab-btn img { width: 13px; height: 13px; border-radius: 50%; }

        .deck-tab-btn.active {
            background: #FFFFFF;
            color: #202124;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        #searchdeck-sidebar.dark-vibe .deck-tab-btn { color: #8E9297; }
        #searchdeck-sidebar.dark-vibe .deck-tab-btn.active { background: #121212; color: #FFFFFF; }

        .deck-controls { display: flex; align-items: center; gap: 3px; }

        .deck-btn {
            cursor: pointer;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            color: #5F6368;
            transition: all 0.2s;
        }
        .deck-btn:hover { background: rgba(0,0,0,0.06); color: #202124; }
        #searchdeck-sidebar.dark-vibe .deck-btn { color: #8E9297; }
        #searchdeck-sidebar.dark-vibe .deck-btn:hover { background: rgba(255,255,255,0.08); color: #FFFFFF; }

        .deck-content-pane {
            display: none;
            padding: 0 18px 18px 18px;
            overflow-y: auto;
            height: calc(80vh - 44px);
            box-sizing: border-box;
            scrollbar-width: thin;
        }

        .deck-content-pane.active { display: block; }

        .deck-top-deadzone {
            padding-top: 14px;
            pointer-events: none;
        }

        .deck-hover-trigger-zone {
            pointer-events: auto;
        }

        .deck-title { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; line-height: 1.3; }
        .deck-meta { font-size: 11px; color: #70757a; margin-bottom: 12px; }
        #searchdeck-sidebar.dark-vibe .deck-meta { color: #8E9297; }

        .deck-image-wrap {
            float: right;
            max-width: 130px;
            max-height: 150px;
            object-fit: contain;
            margin: 0 0 10px 14px;
            border-radius: 6px;
            cursor: pointer;
            border: 1px solid rgba(0,0,0,0.06);
            background: rgba(0,0,0,0.02);
        }

        #searchdeck-sidebar.dark-vibe .deck-image-wrap {
            border-color: rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.02);
        }

        .deck-text { font-size: 13px; line-height: 1.65; color: inherit; }
        .deck-text p { margin-bottom: 14px !important; }

        .deck-comment-card {
            background: #F8F9FA;
            border: 1px solid #EBEBEB;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 10px;
            font-size: 12.5px;
            line-height: 1.5;
        }
        #searchdeck-sidebar.dark-vibe .deck-comment-card {
            background: #18191B;
            border-color: #282A2D;
            color: #D1D5DB;
        }

        .deck-comment-meta {
            font-size: 10px;
            font-weight: 600;
            color: #70757a;
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
        }

        .deck-footer {
            clear: both;
            margin-top: 12px;
            display: inline-block;
            font-size: 12px;
            font-weight: 600;
            text-decoration: none !important;
            border-bottom: none !important;
        }

        .deck-footer.wiki-link { color: #1a73e8; }
        .deck-footer.reddit-link { color: #FF4500; }
        #searchdeck-sidebar.dark-vibe .deck-footer.wiki-link { color: #70C5FF !important; }
        #searchdeck-sidebar.dark-vibe .deck-footer.reddit-link { color: #FF9466 !important; }

        /* MODALS */
        #deck-lightbox {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.92); z-index: 10001;
            display: none; align-items: center; justify-content: center;
            cursor: zoom-out; backdrop-filter: blur(8px);
        }
        #deck-lightbox img { max-width: 90%; max-height: 90%; border-radius: 8px; }

        #deck-info-modal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.45); z-index: 10002;
            display: none; align-items: center; justify-content: center;
            backdrop-filter: blur(4px);
        }

        .deck-info-card {
            background: #FFFFFF;
            width: 340px;
            border-radius: 12px;
            padding: 22px;
            box-shadow: 0 12px 32px rgba(0,0,0,0.2);
            font-family: 'Inter', -apple-system, system-ui, sans-serif;
            color: #202124;
            position: relative;
            border: 1px solid #DADCE0;
            box-sizing: border-box;
        }

        #searchdeck-sidebar.dark-vibe ~ #deck-info-modal .deck-info-card {
            background: #1A1A1A;
            color: #E2E3E5;
            border-color: #333333;
        }

        .deck-info-header {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .deck-info-title {
            font-size: 15px;
            font-weight: 700;
            margin: 0;
        }

        .deck-info-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            background: #EAEAEA;
            color: #5F6368;
            letter-spacing: 0.5px;
        }

        #searchdeck-sidebar.dark-vibe ~ #deck-info-modal .deck-info-badge {
            background: #2D2D2D;
            color: #9AA0A6;
        }

        .deck-info-p {
            font-size: 12px;
            line-height: 1.6;
            margin: 0 0 12px 0;
            color: #5F6368;
        }

        #searchdeck-sidebar.dark-vibe ~ #deck-info-modal .deck-info-p {
            color: #9AA0A6;
        }

        .deck-info-credits {
            font-size: 11px;
            border-top: 1px solid #EBEBEB;
            border-bottom: 1px solid #EBEBEB;
            padding: 10px 0;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            color: #70757A;
        }

        #searchdeck-sidebar.dark-vibe ~ #deck-info-modal .deck-info-credits {
            border-color: #2E3033;
            color: #8E9297;
        }

        .deck-info-credits strong {
            color: #202124;
        }

        #searchdeck-sidebar.dark-vibe ~ #deck-info-modal .deck-info-credits strong {
            color: #E2E3E5;
        }

        .deck-info-close {
            display: block;
            width: 100%;
            text-align: center;
            padding: 8px 0;
            background: #F1F3F4;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            color: #202124;
            transition: background 0.2s;
        }

        .deck-info-close:hover { background: #E8EAED; }

        #searchdeck-sidebar.dark-vibe ~ #deck-info-modal .deck-info-close {
            background: #252628;
            color: #E2E3E5;
        }
        #searchdeck-sidebar.dark-vibe ~ #deck-info-modal .deck-info-close:hover {
            background: #303134;
        }
    `;
    document.head.appendChild(style);

    const sidebar = document.createElement('div');
    sidebar.id = 'searchdeck-sidebar';

    const savedSide = localStorage.getItem('deckVibePosition') || 'right';
    sidebar.classList.add(savedSide === 'left' ? 'dock-left' : 'dock-right');

    if (localStorage.getItem('deckVibeDarkMode') === 'true') sidebar.classList.add('dark-vibe');

    const lightbox = document.createElement('div');
    lightbox.id = 'deck-lightbox';

    const infoModal = document.createElement('div');
    infoModal.id = 'deck-info-modal';
    infoModal.innerHTML = `
        <div class="deck-info-card">
            <div class="deck-info-header">
                <h3 class="deck-info-title">SearchDeck Pro</h3>
                <span class="deck-info-badge">v4.1</span>
            </div>
            <p class="deck-info-p">
                A minimalist companion that surfaces Wikipedia summaries and top Reddit community discussions directly alongside Google Search results.
            </p>
            <div class="deck-info-credits">
                <span>Created by: <strong>Varun</strong></span>
                <span>Assisted by: <strong>Gemini</strong></span>
            </div>
            <div class="deck-info-close" id="deck-info-close-btn">Close</div>
        </div>
    `;

    document.body.appendChild(sidebar);
    document.body.appendChild(lightbox);
    document.body.appendChild(infoModal);

    const icons = {
        info: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
        dockLeft: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>`,
        dockRight: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>`,
        copy: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        moon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
        sun: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        arrow: `<svg id="deck-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.3s"><polyline points="6 9 12 15 18 9"></polyline></svg>`
    };

    let wikiData = null;
    let redditData = null;
    let activeTab = 'wiki';
    let springTriggered = false;

    const triggerSpringEntrance = () => {
        if (!springTriggered) {
            springTriggered = true;
            sidebar.style.display = 'block';
            sidebar.classList.add('spring-entrance');
            setTimeout(() => {
                sidebar.classList.remove('spring-entrance');
            }, 600);
        } else {
            sidebar.style.display = 'block';
        }
    };

    const expandAndLatch = () => {
        sidebar.classList.remove('minimized');
        sidebar.classList.add('latched-expanded');
        const arrow = sidebar.querySelector('#deck-arrow');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    };

    // SCROLL DISMISS
    let initialScrollY = window.scrollY;
    let scrollTimeout = null;

    window.addEventListener('scroll', () => {
        if (sidebar.matches(':hover') || infoModal.style.display === 'flex') return;
        if (sidebar.classList.contains('latched-expanded')) return;

        if (scrollTimeout) clearTimeout(scrollTimeout);

        scrollTimeout = setTimeout(() => {
            const delta = Math.abs(window.scrollY - initialScrollY);
            if (delta > 100) {
                if (!sidebar.classList.contains('minimized')) {
                    sidebar.classList.add('minimized');
                    const arrow = sidebar.querySelector('#deck-arrow');
                    if (arrow) arrow.style.transform = 'rotate(180deg)';
                }
                initialScrollY = window.scrollY;
            }
        }, 150);
    }, { passive: true });

    const renderControls = () => {
        const controls = sidebar.querySelector('#deck-controls');
        if (!controls) return;

        const isDark = sidebar.classList.contains('dark-vibe');
        const isLeft = sidebar.classList.contains('dock-left');

        if (isLeft) {
            controls.innerHTML = `
                <div class="deck-btn" id="deck-info-btn" title="About SearchDeck">${icons.info}</div>
                <div class="deck-btn" id="deck-copy-btn" title="Copy Content">${icons.copy}</div>
                <div class="deck-btn" id="deck-dock-btn" title="Move to Right Dock">${icons.dockRight}</div>
                <div class="deck-btn" id="deck-dark-btn">${isDark ? icons.sun : icons.moon}</div>
                <div class="deck-btn" id="deck-toggle-btn" title="Minimize/Expand">${icons.arrow}</div>
            `;
        } else {
            controls.innerHTML = `
                <div class="deck-btn" id="deck-toggle-btn" title="Minimize/Expand">${icons.arrow}</div>
                <div class="deck-btn" id="deck-dark-btn">${isDark ? icons.sun : icons.moon}</div>
                <div class="deck-btn" id="deck-dock-btn" title="Move to Left Dock">${icons.dockLeft}</div>
                <div class="deck-btn" id="deck-copy-btn" title="Copy Content">${icons.copy}</div>
                <div class="deck-btn" id="deck-info-btn" title="About SearchDeck">${icons.info}</div>
            `;
        }

        attachControlHandlers();
    };

    const attachControlHandlers = () => {
        const arrow = sidebar.querySelector('#deck-arrow');
        const toggleBtn = sidebar.querySelector('#deck-toggle-btn');
        const dockBtn = sidebar.querySelector('#deck-dock-btn');
        const darkBtn = sidebar.querySelector('#deck-dark-btn');
        const copyBtn = sidebar.querySelector('#deck-copy-btn');
        const infoBtn = sidebar.querySelector('#deck-info-btn');

        if (toggleBtn) {
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('minimized');
                if (sidebar.classList.contains('minimized')) {
                    sidebar.classList.remove('latched-expanded');
                } else {
                    sidebar.classList.add('latched-expanded');
                }
                if (arrow) arrow.style.transform = sidebar.classList.contains('minimized') ? 'rotate(180deg)' : 'rotate(0deg)';
            };
        }

        if (dockBtn) {
            dockBtn.onclick = (e) => {
                e.stopPropagation();
                const toLeft = sidebar.classList.contains('dock-right');
                sidebar.classList.toggle('dock-left', toLeft);
                sidebar.classList.toggle('dock-right', !toLeft);
                localStorage.setItem('deckVibePosition', toLeft ? 'left' : 'right');
                renderControls();
            };
        }

        if (darkBtn) {
            darkBtn.onclick = (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('dark-vibe');
                const currentlyDark = sidebar.classList.contains('dark-vibe');
                localStorage.setItem('deckVibeDarkMode', currentlyDark);
                darkBtn.innerHTML = currentlyDark ? icons.sun : icons.moon;
            };
        }

        if (copyBtn) {
            copyBtn.onclick = (e) => {
                e.stopPropagation();
                const activePane = sidebar.querySelector('.deck-content-pane.active');
                if (activePane) {
                    navigator.clipboard.writeText(activePane.innerText);
                    copyBtn.innerHTML = '✓';
                    setTimeout(() => { copyBtn.innerHTML = icons.copy; }, 2000);
                }
            };
        }

        if (infoBtn) {
            infoBtn.onclick = (e) => {
                e.stopPropagation();
                infoModal.style.display = 'flex';
            };
        }
    };

    const attachHoverTriggers = () => {
        const triggerZones = sidebar.querySelectorAll('.deck-hover-trigger-zone');
        triggerZones.forEach(zone => {
            zone.addEventListener('mouseenter', expandAndLatch);
        });
    };

    const buildShell = () => {
        sidebar.innerHTML = `
            <div class="deck-header-tab" id="deck-header">
                <div class="deck-segmented-control" id="deck-tabs"></div>
                <div class="deck-controls" id="deck-controls"></div>
            </div>
            <div class="deck-content-pane active" id="deck-pane-wiki"></div>
            <div class="deck-content-pane" id="deck-pane-reddit"></div>
        `;

        renderControls();

        const header = sidebar.querySelector('#deck-header');
        header.onclick = (e) => {
            if (e.target.closest('.deck-btn') || e.target.closest('.deck-tab-btn')) return;
            if (sidebar.classList.contains('minimized')) {
                expandAndLatch();
            } else {
                sidebar.classList.add('minimized');
                sidebar.classList.remove('latched-expanded');
                const arrow = sidebar.querySelector('#deck-arrow');
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            }
        };
    };

    const updateTabs = () => {
        const tabsContainer = sidebar.querySelector('#deck-tabs');
        if (!tabsContainer) return;
        tabsContainer.innerHTML = '';

        if (wikiData) {
            const btn = document.createElement('div');
            btn.className = `deck-tab-btn ${activeTab === 'wiki' ? 'active' : ''}`;
            btn.innerHTML = `<img src="https://en.wikipedia.org/favicon.ico"> Wiki`;
            btn.onclick = (e) => {
                e.stopPropagation();
                switchTab('wiki');
                expandAndLatch();
            };
            tabsContainer.appendChild(btn);
        }

        if (redditData) {
            const btn = document.createElement('div');
            btn.className = `deck-tab-btn ${activeTab === 'reddit' ? 'active' : ''}`;
            btn.innerHTML = `<img src="https://www.redditstatic.com/shreddit/assets/favicon/192x192.png"> Reddit`;
            btn.onclick = (e) => {
                e.stopPropagation();
                switchTab('reddit');
                expandAndLatch();
            };
            tabsContainer.appendChild(btn);
        }
    };

    const switchTab = (tab) => {
        activeTab = tab;
        updateTabs();
        sidebar.querySelectorAll('.deck-content-pane').forEach(p => p.classList.remove('active'));
        const target = sidebar.querySelector(`#deck-pane-${tab}`);
        if (target) target.classList.add('active');
    };

    const fetchRequest = (url) => new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: (res) => (res.status === 200 ? resolve(JSON.parse(res.responseText)) : reject(res)),
            onerror: reject
        });
    });

    const fetchWikipedia = async (slug) => {
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
        const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${slug}&format=json&prop=text&origin=*`;

        try {
            const [sData, pData] = await Promise.all([
                fetchRequest(summaryUrl).catch(() => ({})),
                fetchRequest(apiUrl).catch(() => ({}))
            ]);

            if (pData.parse) {
                const rawHtml = pData.parse.text["*"];
                const parser = new DOMParser();
                const doc = parser.parseFromString(rawHtml, 'text/html');
                doc.querySelectorAll('.mw-empty-elt, .reference, .infobox, .noprint, .ambox, .mw-editsection').forEach(el => el.remove());
                const paragraphs = Array.from(doc.querySelectorAll('p')).filter(p => p.innerText.trim().length > 60).slice(0, 6);
                const htmlContent = paragraphs.map(p => `<p>${p.innerHTML}</p>`).join('');

                const pane = sidebar.querySelector('#deck-pane-wiki');
                pane.innerHTML = `
                    <div class="deck-top-deadzone">
                        <h2 class="deck-title">${pData.parse.title}</h2>
                        <div class="deck-meta">${sData.description || "Wikipedia Encyclopedia"}</div>
                    </div>
                    <div class="deck-hover-trigger-zone">
                        ${sData.thumbnail ? `<img src="${sData.thumbnail.source}" class="deck-image-wrap" id="deck-wiki-img">` : ''}
                        <div class="deck-text">${htmlContent}</div>
                        <a class="deck-footer wiki-link" href="https://en.wikipedia.org/wiki/${slug}" target="_blank">Full Article on Wikipedia →</a>
                    </div>
                `;

                if (sData.thumbnail) {
                    pane.querySelector('#deck-wiki-img').onclick = () => {
                        lightbox.innerHTML = `<img src="${sData.originalimage ? sData.originalimage.source : sData.thumbnail.source}">`;
                        lightbox.style.display = 'flex';
                    };
                }

                wikiData = true;
                switchTab('wiki');
                attachHoverTriggers();
                triggerSpringEntrance();
            }
        } catch (e) {
            console.error("Wiki fetch error", e);
        }
    };

    const fetchReddit = async (rawUrl) => {
        const cleanUrl = rawUrl.split('?')[0].replace(/\/$/, '') + '.json';

        try {
            const data = await fetchRequest(cleanUrl);
            const post = data[0].data.children[0].data;
            const comments = data[1].data.children
                .filter(c => c.kind === 't1' && c.data.body)
                .slice(0, 4)
                .map(c => `
                    <div class="deck-comment-card">
                        <div class="deck-comment-meta">
                            <span>u/${c.data.author}</span>
                            <span>▲ ${c.data.score}</span>
                        </div>
                        <div>${c.data.body}</div>
                    </div>
                `).join('');

            const pane = sidebar.querySelector('#deck-pane-reddit');
            pane.innerHTML = `
                <div class="deck-top-deadzone">
                    <h2 class="deck-title">${post.title}</h2>
                    <div class="deck-meta">${post.subreddit_name_prefixed} • Posted by u/${post.author} • ▲ ${post.score}</div>
                </div>
                <div class="deck-hover-trigger-zone">
                    ${post.selftext ? `<div class="deck-text" style="margin-bottom:14px; padding-bottom:12px; border-bottom:1px solid #eee;">${post.selftext}</div>` : ''}
                    <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; margin:14px 0 8px 0; color:#70757a;">Top Discussions</div>
                    ${comments || '<div style="font-size:13px;color:#70757a;">No top-level comments found.</div>'}
                    <a class="deck-footer reddit-link" href="https://reddit.com${post.permalink}" target="_blank">Open Thread on Reddit →</a>
                </div>
            `;

            redditData = true;
            if (!wikiData) switchTab('reddit');
            else updateTabs();
            attachHoverTriggers();
            triggerSpringEntrance();
        } catch (e) {
            console.error("Reddit fetch error", e);
        }
    };

    buildShell();

    // Modal Dismiss Handlers
    lightbox.onclick = () => { lightbox.style.display = 'none'; };
    infoModal.onclick = (e) => {
        if (e.target === infoModal || e.target.id === 'deck-info-close-btn') {
            infoModal.style.display = 'none';
        }
    };

    const scanPage = () => {
        if (!wikiData) {
            const wikiLink = document.querySelector('a[href*="en.wikipedia.org/wiki/"]');
            if (wikiLink) {
                const slug = wikiLink.href.split('/wiki/')[1].split('&')[0].split('#')[0];
                fetchWikipedia(slug);
            }
        }
        if (!redditData) {
            const redditLink = document.querySelector('a[href*="reddit.com/r/"]');
            if (redditLink) {
                fetchReddit(redditLink.href);
            }
        }
    };

    scanPage();
    setInterval(scanPage, 2500);
})();