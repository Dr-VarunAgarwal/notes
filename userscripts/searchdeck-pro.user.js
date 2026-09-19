// ==UserScript==
// @name         SearchDeck Pro - First-Click Full Expand
// @namespace    http://tampermonkey.net/
// @version      5.4
// @description  First click on blank header space expands the deck fully; standard toggles resume afterwards
// @author       Varun / Gemini
// @match        https://www.google.com/search*
// @match        https://www.google.co.in/search*
// @grant        GM_xmlhttpRequest
// @connect      en.wikipedia.org
// @connect      www.reddit.com
// @connect      reddit.com
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @connect      eutils.ncbi.nlm.nih.gov
// ==/UserScript==

(function() {
    'use strict';

    function parseRedditMarkdown(text) {
        if (!text) return '';
        let s = String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        s = s.replace(/\[([^\]]+)\]\((\/[ru]\/[^\s\)]+)\)/g, '<a href="https://www.reddit.com$2" target="_blank" rel="noopener noreferrer">$1</a>');
        s = s.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
        s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
        s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
        s = s.replace(/\n\n+/g, '<br><br>');
        s = s.replace(/\n/g, '<br>');
        return s;
    }

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes deckSpringIn {
            0% { opacity: 0; transform: translateY(40px) scale(0.96); }
            50% { opacity: 1; transform: translateY(-8px) scale(1.01); }
            75% { transform: translateY(3px) scale(0.995); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        #searchdeck-sidebar {
            position: fixed;
            bottom: 0;
            width: 400px;
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

        #searchdeck-sidebar.spring-entrance {
            animation: deckSpringIn 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        #searchdeck-sidebar.dock-right { right: 25px; left: auto; }
        #searchdeck-sidebar.dock-left { left: 25px; right: auto; }

        #searchdeck-sidebar.latched-expanded:not(.minimized) {
            height: 82vh !important;
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
            max-width: 250px;
            overflow-x: auto;
        }

        #searchdeck-sidebar.dark-vibe .deck-segmented-control { background: #252628; }

        .deck-tab-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 3px 7px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            color: #5F6368;
            white-space: nowrap;
            transition: all 0.2s;
        }

        .deck-tab-btn img { width: 12px; height: 12px; border-radius: 2px; }

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
            width: 26px;
            height: 26px;
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
            height: calc(82vh - 44px);
            box-sizing: border-box;
            scrollbar-width: thin;
        }

        .deck-content-pane.active { display: block; }

        .deck-top-deadzone { padding-top: 14px; pointer-events: none; }
        .deck-hover-trigger-zone { pointer-events: auto; }

        .deck-title { font-size: 17px; font-weight: 700; margin: 0 0 4px 0; line-height: 1.35; }
        .deck-meta { font-size: 11px; color: #70757a; margin-bottom: 12px; }
        #searchdeck-sidebar.dark-vibe .deck-meta { color: #8E9297; }

        .deck-carousel-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            margin: 10px 0;
            background: rgba(0,0,0,0.03);
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
        }
        #searchdeck-sidebar.dark-vibe .deck-carousel-bar { background: #1E1E1E; }
        .deck-carousel-nav { display: flex; gap: 4px; align-items: center; }
        .deck-nav-btn {
            cursor: pointer;
            padding: 2px 7px;
            border-radius: 4px;
            background: rgba(0,0,0,0.06);
            user-select: none;
        }
        #searchdeck-sidebar.dark-vibe .deck-nav-btn { background: #2E2E2E; color: #FFF; }

        .deck-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
        .deck-chip {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 4px;
            background: #EFEFEF;
            color: #333;
            font-weight: 600;
        }
        #searchdeck-sidebar.dark-vibe .deck-chip { background: #222; color: #BBB; border: 1px solid #333; }

        .deck-image-wrap {
            float: right;
            max-width: 125px;
            max-height: 140px;
            object-fit: contain;
            margin: 0 0 10px 14px;
            border-radius: 6px;
            cursor: pointer;
            border: 1px solid rgba(0,0,0,0.06);
        }

        .deck-text { font-size: 13px; line-height: 1.65; color: inherit; }
        .deck-text p { margin-bottom: 12px !important; }

        .deck-comment-card {
            background: #F8F9FA;
            border: 1px solid #EBEBEB;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
            font-size: 12px;
            line-height: 1.55;
            word-break: break-word;
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

        .deck-action-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
            padding: 9px 12px;
            margin-top: 12px;
            background: #1A73E8;
            color: #FFFFFF !important;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-decoration: none !important;
            cursor: pointer;
            box-sizing: border-box;
            transition: background 0.2s, transform 0.1s ease;
        }
        .deck-action-btn:hover {
            background: #1557B0;
            transform: translateY(-1px);
        }
        #searchdeck-sidebar.dark-vibe .deck-action-btn {
            background: #3C4043;
            color: #E8EAED !important;
            border: 1px solid #5F6368;
        }
        #searchdeck-sidebar.dark-vibe .deck-action-btn:hover {
            background: #4E5256;
            color: #FFFFFF !important;
        }

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
            border: 1px solid #DADCE0;
            box-sizing: border-box;
        }
        #searchdeck-sidebar.dark-vibe ~ #deck-info-modal .deck-info-card {
            background: #1A1A1A;
            color: #E2E3E5;
            border-color: #333333;
        }
        .deck-info-close {
            display: block; width: 100%; text-align: center; padding: 8px 0;
            background: #F1F3F4; border-radius: 6px; font-size: 12px;
            font-weight: 600; cursor: pointer; color: #202124;
        }
        #searchdeck-sidebar.dark-vibe ~ #deck-info-modal .deck-info-close { background: #252628; color: #E2E3E5; }
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
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
                <h3 style="margin:0;font-size:15px;font-weight:700;">SearchDeck Pro</h3>
                <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;background:#EAEAEA;color:#5F6368;">v5.4</span>
            </div>
            <p style="font-size:12px;line-height:1.6;color:#5F6368;margin-bottom:12px;">
                Unified research panel surfacing Wikipedia summaries, Reddit thread carousels, GitHub repositories, and PubMed/PMC literature carousels directly alongside search results.
            </p>
            <div style="font-size:11px;border-top:1px solid #EBEBEB;border-bottom:1px solid #EBEBEB;padding:8px 0;margin-bottom:14px;display:flex;justify-content:space-between;color:#70757A;">
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
        info: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
        dockLeft: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>`,
        dockRight: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>`,
        copy: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        moon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
        sun: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        arrow: `<svg id="deck-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition:transform 0.3s"><polyline points="6 9 12 15 18 9"></polyline></svg>`
    };

    const state = {
        wiki: null,
        redditThreads: [],
        redditPostIds: new Set(),
        redditIndex: 0,
        github: null,
        articles: [],
        articleIds: new Set(),
        articleIndex: 0,
        activeTab: null,
        springTriggered: false,
        headerEverExpanded: false
    };

    const triggerSpringEntrance = () => {
        if (!state.springTriggered) {
            state.springTriggered = true;
            sidebar.style.display = 'block';
            sidebar.classList.add('spring-entrance');
            setTimeout(() => sidebar.classList.remove('spring-entrance'), 600);
        } else {
            sidebar.style.display = 'block';
        }
    };

    const expandAndLatch = () => {
        state.headerEverExpanded = true;
        sidebar.classList.remove('minimized');
        sidebar.classList.add('latched-expanded');
        const arrow = sidebar.querySelector('#deck-arrow');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    };

    // Scroll dismiss
    let initialScrollY = window.scrollY;
    let scrollTimeout = null;
    window.addEventListener('scroll', () => {
        if (sidebar.matches(':hover') || infoModal.style.display === 'flex' || sidebar.classList.contains('latched-expanded')) return;
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (Math.abs(window.scrollY - initialScrollY) > 100) {
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

        controls.innerHTML = `
            <div class="deck-btn" id="deck-copy-btn" title="Copy Content">${icons.copy}</div>
            <div class="deck-btn" id="deck-dock-btn" title="Toggle Dock Side">${isLeft ? icons.dockRight : icons.dockLeft}</div>
            <div class="deck-btn" id="deck-dark-btn">${isDark ? icons.sun : icons.moon}</div>
            <div class="deck-btn" id="deck-info-btn" title="About SearchDeck">${icons.info}</div>
            <div class="deck-btn" id="deck-toggle-btn" title="Minimize/Expand">${icons.arrow}</div>
        `;
        attachControlHandlers();
    };

    const attachControlHandlers = () => {
        const toggleBtn = sidebar.querySelector('#deck-toggle-btn');
        const dockBtn = sidebar.querySelector('#deck-dock-btn');
        const darkBtn = sidebar.querySelector('#deck-dark-btn');
        const copyBtn = sidebar.querySelector('#deck-copy-btn');
        const infoBtn = sidebar.querySelector('#deck-info-btn');
        const arrow = sidebar.querySelector('#deck-arrow');

        if (toggleBtn) {
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('minimized');
                sidebar.classList.toggle('latched-expanded', !sidebar.classList.contains('minimized'));
                if (!sidebar.classList.contains('minimized')) state.headerEverExpanded = true;
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
                const isDark = sidebar.classList.contains('dark-vibe');
                localStorage.setItem('deckVibeDarkMode', isDark);
                darkBtn.innerHTML = isDark ? icons.sun : icons.moon;
            };
        }

        if (copyBtn) {
            copyBtn.onclick = (e) => {
                e.stopPropagation();
                const activePane = sidebar.querySelector('.deck-content-pane.active');
                if (activePane) {
                    navigator.clipboard.writeText(activePane.innerText);
                    copyBtn.innerHTML = '✓';
                    setTimeout(() => copyBtn.innerHTML = icons.copy, 2000);
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
        triggerZones.forEach(zone => zone.addEventListener('mouseenter', expandAndLatch));
    };

    const buildShell = () => {
        sidebar.innerHTML = `
            <div class="deck-header-tab" id="deck-header">
                <div class="deck-segmented-control" id="deck-tabs"></div>
                <div class="deck-controls" id="deck-controls"></div>
            </div>
            <div class="deck-content-pane active" id="deck-pane-wiki"></div>
            <div class="deck-content-pane" id="deck-pane-reddit"></div>
            <div class="deck-content-pane" id="deck-pane-github"></div>
            <div class="deck-content-pane" id="deck-pane-pubmed"></div>
        `;

        renderControls();
        const header = sidebar.querySelector('#deck-header');
        header.onclick = (e) => {
            if (e.target.closest('.deck-btn') || e.target.closest('.deck-tab-btn')) return;

            // FIRST-CLICK FULL EXPAND LOGIC
            if (!state.headerEverExpanded) {
                expandAndLatch();
                return;
            }

            // Normal subsequent toggle behaviour
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

        const currentArticle = state.articles[state.articleIndex];
        const medLabel = state.articles.length > 0 ? (currentArticle?.isPMC ? 'PMC' : 'PubMed') : 'PubMed';

        const available = [
            { key: 'wiki', label: 'Wiki', icon: 'https://en.wikipedia.org/favicon.ico', data: state.wiki },
            { key: 'reddit', label: 'Reddit', icon: 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png', data: state.redditThreads.length > 0 },
            { key: 'github', label: 'GitHub', icon: 'https://github.githubassets.com/favicons/favicon.png', data: state.github },
            { key: 'pubmed', label: medLabel, icon: 'https://pubmed.ncbi.nlm.nih.gov/favicon.ico', data: state.articles.length > 0 }
        ];

        available.filter(t => t.data).forEach(t => {
            const btn = document.createElement('div');
            btn.className = `deck-tab-btn ${state.activeTab === t.key ? 'active' : ''}`;
            btn.innerHTML = `<img src="${t.icon}"> ${t.label}`;
            btn.onclick = (e) => {
                e.stopPropagation();
                if (state.activeTab === t.key) {
                    let url = null;
                    if (t.key === 'wiki') url = state.wiki.url;
                    if (t.key === 'reddit') url = state.redditThreads[state.redditIndex]?.url;
                    if (t.key === 'github') url = state.github.url;
                    if (t.key === 'pubmed') url = state.articles[state.articleIndex]?.url;
                    if (url) window.open(url, '_blank');
                } else {
                    switchTab(t.key);
                    expandAndLatch();
                }
            };
            tabsContainer.appendChild(btn);
        });
    };

    const switchTab = (tabKey) => {
        state.activeTab = tabKey;
        updateTabs();
        sidebar.querySelectorAll('.deck-content-pane').forEach(p => p.classList.remove('active'));
        const pane = sidebar.querySelector(`#deck-pane-${tabKey}`);
        if (pane) pane.classList.add('active');
    };

    const fetchRequest = (url, headers = {}) => new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: headers,
            onload: (res) => (res.status === 200 ? resolve(res.responseText) : reject(res)),
            onerror: reject
        });
    });

    // WIKIPEDIA
    const fetchWikipedia = async (slug) => {
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
        const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${slug}&format=json&prop=text&origin=*`;

        try {
            const [sRaw, pRaw] = await Promise.all([
                fetchRequest(summaryUrl).catch(() => "{}"),
                fetchRequest(apiUrl).catch(() => "{}")
            ]);
            const sData = JSON.parse(sRaw);
            const pData = JSON.parse(pRaw);

            if (pData.parse) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(pData.parse.text["*"], 'text/html');
                doc.querySelectorAll('.mw-empty-elt, .reference, .infobox, .noprint, .ambox, .mw-editsection').forEach(el => el.remove());
                const paragraphs = Array.from(doc.querySelectorAll('p')).filter(p => p.innerText.trim().length > 60).slice(0, 6);
                const htmlContent = paragraphs.map(p => `<p>${p.innerHTML}</p>`).join('');

                state.wiki = {
                    title: pData.parse.title,
                    meta: sData.description || "Wikipedia Encyclopedia",
                    thumbnail: sData.thumbnail?.source,
                    original: sData.originalimage?.source,
                    body: htmlContent,
                    url: `https://en.wikipedia.org/wiki/${slug}`
                };

                const pane = sidebar.querySelector('#deck-pane-wiki');
                pane.innerHTML = `
                    <div class="deck-top-deadzone">
                        <h2 class="deck-title">${state.wiki.title}</h2>
                        <div class="deck-meta">${state.wiki.meta}</div>
                    </div>
                    <div class="deck-hover-trigger-zone">
                        ${state.wiki.thumbnail ? `<img src="${state.wiki.thumbnail}" class="deck-image-wrap" id="deck-wiki-img">` : ''}
                        <div class="deck-text">${state.wiki.body}</div>
                    </div>
                `;

                if (state.wiki.thumbnail) {
                    pane.querySelector('#deck-wiki-img').onclick = () => {
                        lightbox.innerHTML = `<img src="${state.wiki.original || state.wiki.thumbnail}">`;
                        lightbox.style.display = 'flex';
                    };
                }

                if (!state.activeTab || state.activeTab === 'wiki') switchTab('wiki');
                else updateTabs();
                attachHoverTriggers();
                triggerSpringEntrance();
            }
        } catch (e) {
            console.error("Wiki error", e);
        }
    };

    // REDDIT
    const renderRedditThread = (index) => {
        const post = state.redditThreads[index];
        if (!post) return;
        const pane = sidebar.querySelector('#deck-pane-reddit');
        const total = state.redditThreads.length;

        const carouselControls = total > 1 ? `
            <div class="deck-carousel-bar">
                <span>Thread ${index + 1} of ${total}</span>
                <div class="deck-carousel-nav">
                    <span class="deck-nav-btn" id="deck-red-prev">‹</span>
                    <span class="deck-nav-btn" id="deck-red-next">›</span>
                </div>
            </div>
        ` : '';

        pane.innerHTML = `
            <div class="deck-top-deadzone">
                <h2 class="deck-title">${post.title}</h2>
                <div class="deck-meta">${post.subreddit} • u/${post.author} • ▲ ${post.score}</div>
            </div>
            <div class="deck-hover-trigger-zone">
                ${carouselControls}
                ${post.selftext ? `<div class="deck-text" style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #eee;">${parseRedditMarkdown(post.selftext)}</div>` : ''}
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin:14px 0 8px 0;color:#70757a;">Top Discussions</div>
                ${post.commentsHtml || '<div style="font-size:13px;color:#70757a;">No comments available.</div>'}
            </div>
        `;

        if (total > 1) {
            pane.querySelector('#deck-red-prev').onclick = (e) => {
                e.stopPropagation();
                state.redditIndex = (state.redditIndex - 1 + total) % total;
                renderRedditThread(state.redditIndex);
            };
            pane.querySelector('#deck-red-next').onclick = (e) => {
                e.stopPropagation();
                state.redditIndex = (state.redditIndex + 1) % total;
                renderRedditThread(state.redditIndex);
            };
        }

        attachHoverTriggers();
    };

    const fetchRedditThread = async (postId, rawUrl) => {
        try {
            let cleanUrl = rawUrl;
            if (cleanUrl.includes('/url?q=')) cleanUrl = decodeURIComponent(cleanUrl.split('/url?q=')[1].split('&')[0]);
            cleanUrl = cleanUrl.split('?')[0].replace(/\/$/, '') + '.json';

            const raw = await fetchRequest(cleanUrl);
            const data = JSON.parse(raw);
            const post = data[0].data.children[0].data;

            const comments = data[1].data.children
                .filter(c => c.kind === 't1' && c.data.body && c.data.author !== 'AutoModerator')
                .slice(0, 4)
                .map(c => `
                    <div class="deck-comment-card">
                        <div class="deck-comment-meta">
                            <span>u/${c.data.author}</span>
                            <span>▲ ${c.data.score}</span>
                        </div>
                        <div>${parseRedditMarkdown(c.data.body)}</div>
                    </div>
                `).join('');

            state.redditThreads.push({
                id: postId,
                title: post.title,
                subreddit: post.subreddit_name_prefixed,
                author: post.author,
                score: post.score,
                selftext: post.selftext,
                commentsHtml: comments,
                url: `https://reddit.com${post.permalink}`
            });

            if (state.redditThreads.length === 1) {
                renderRedditThread(0);
                if (!state.activeTab) switchTab('reddit');
                else updateTabs();
                triggerSpringEntrance();
            } else {
                updateTabs();
                renderRedditThread(state.redditIndex);
            }
        } catch (e) {
            console.error("Reddit error", e);
        }
    };

    // GITHUB
    const fetchGitHub = async (owner, repo) => {
        try {
            const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
            const raw = await fetchRequest(apiUrl, { 'Accept': 'application/vnd.github.v3+json' });
            const data = JSON.parse(raw);

            let readmeText = '';
            try {
                const rRaw = await fetchRequest(`https://raw.githubusercontent.com/${owner}/${repo}/${data.default_branch || 'main'}/README.md`);
                readmeText = rRaw.split('\n').filter(line => !line.startsWith('#') && line.trim().length > 20).slice(0, 4).join('\n\n');
            } catch (err) {}

            state.github = {
                title: data.full_name,
                description: data.description || "No description provided.",
                stars: data.stargazers_count,
                forks: data.forks_count,
                issues: data.open_issues_count,
                license: data.license ? data.license.spdx_id : 'No License',
                language: data.language || 'Code',
                readme: readmeText,
                url: data.html_url
            };

            const pane = sidebar.querySelector('#deck-pane-github');
            pane.innerHTML = `
                <div class="deck-top-deadzone">
                    <h2 class="deck-title">${state.github.title}</h2>
                    <div class="deck-meta">${state.github.language} • ${state.github.license}</div>
                </div>
                <div class="deck-hover-trigger-zone">
                    <div class="deck-badges">
                        <span class="deck-chip">★ ${state.github.stars} Stars</span>
                        <span class="deck-chip">⑂ ${state.github.forks} Forks</span>
                        <span class="deck-chip">⊙ ${state.github.issues} Issues</span>
                    </div>
                    <div class="deck-text" style="font-weight:500;margin-bottom:14px;">${state.github.description}</div>
                    ${state.github.readme ? `<div class="deck-comment-card" style="font-family:monospace;font-size:11.5px;">${parseRedditMarkdown(state.github.readme)}</div>` : ''}
                </div>
            `;

            if (!state.activeTab) switchTab('github');
            else updateTabs();
            attachHoverTriggers();
            triggerSpringEntrance();
        } catch (e) {
            console.error("GitHub error", e);
        }
    };

    // PUBMED & PMC CAROUSEL
    const renderArticle = (index) => {
        const item = state.articles[index];
        if (!item) return;
        const pane = sidebar.querySelector('#deck-pane-pubmed');
        const total = state.articles.length;

        const carouselControls = total > 1 ? `
            <div class="deck-carousel-bar">
                <span>Article ${index + 1} of ${total} (${item.isPMC ? 'PMC' : 'PubMed'})</span>
                <div class="deck-carousel-nav">
                    <span class="deck-nav-btn" id="deck-med-prev">‹</span>
                    <span class="deck-nav-btn" id="deck-med-next">›</span>
                </div>
            </div>
        ` : '';

        const actionLabel = item.isPMC ? "Open Full Article on PMC ↗" : "View on PubMed ↗";

        pane.innerHTML = `
            <div class="deck-top-deadzone">
                <h2 class="deck-title" style="font-size:16px;">${item.title}</h2>
                <div class="deck-meta">${item.journal} • ${item.pubdate}</div>
            </div>
            <div class="deck-hover-trigger-zone">
                ${carouselControls}
                <div class="deck-badges">
                    <span class="deck-chip">${item.id}</span>
                    <span class="deck-chip">${item.isPMC ? "NIH Free Full Text" : "NLM Indexed"}</span>
                </div>
                ${item.authors ? `<div class="deck-text" style="margin-bottom:12px;font-style:italic;color:#666;">Authors: ${item.authors}</div>` : ''}
                <div class="deck-comment-card">
                    <div style="font-weight:700;margin-bottom:6px;font-size:11px;text-transform:uppercase;color:#70757a;">
                        ${item.abstract ? "Structured Abstract" : (item.isPMC ? "Open Access Full Article Notice" : "Medical Reference Citation")}
                    </div>
                    <div style="line-height:1.6;">
                        ${item.abstract || `Indexed via National Institutes of Health (NIH) PMC. You can review the full publication on NCBI directly.`}
                    </div>
                    <a class="deck-action-btn" href="${item.url}" target="_blank" rel="noopener noreferrer">
                        ${actionLabel}
                    </a>
                </div>
            </div>
        `;

        if (total > 1) {
            pane.querySelector('#deck-med-prev').onclick = (e) => {
                e.stopPropagation();
                state.articleIndex = (state.articleIndex - 1 + total) % total;
                renderArticle(state.articleIndex);
                updateTabs();
            };
            pane.querySelector('#deck-med-next').onclick = (e) => {
                e.stopPropagation();
                state.articleIndex = (state.articleIndex + 1) % total;
                renderArticle(state.articleIndex);
                updateTabs();
            };
        }

        attachHoverTriggers();
    };

    const fetchPubMedOrPMC = async (id, isPMC) => {
        try {
            const db = isPMC ? 'pmc' : 'pubmed';
            const queryId = isPMC ? id.replace(/^PMC/i, '') : id;
            const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=${db}&id=${queryId}&retmode=json`;

            const sRaw = await fetchRequest(summaryUrl);
            const sData = JSON.parse(sRaw);
            const doc = sData.result[queryId];
            if (!doc) return;

            const authors = (doc.authors || []).map(a => a.name).slice(0, 3).join(', ') + ((doc.authors && doc.authors.length > 3) ? ' et al.' : '');
            const targetUrl = isPMC ? `https://pmc.ncbi.nlm.nih.gov/articles/PMC${queryId}/` : `https://pubmed.ncbi.nlm.nih.gov/${queryId}/`;

            let abstractText = '';
            const pmidToFetch = isPMC ? (doc.articleids || []).find(a => a.idtype === 'pmid')?.value : queryId;
            if (pmidToFetch) {
                try {
                    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmidToFetch}&retmode=xml`;
                    const xmlRaw = await fetchRequest(efetchUrl);
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlRaw, "text/xml");
                    const abstractTexts = xmlDoc.querySelectorAll("AbstractText");
                    if (abstractTexts.length > 0) {
                        abstractText = Array.from(abstractTexts)
                            .map(node => {
                                const label = node.getAttribute("Label");
                                return label ? `<strong>${label}:</strong> ${node.textContent}` : node.textContent;
                            })
                            .join('<br><br>');
                    }
                } catch (err) {}
            }

            state.articles.push({
                uniqueKey: (isPMC ? 'PMC' : 'PMID') + queryId,
                title: doc.title,
                journal: doc.source || (isPMC ? "PubMed Central Open Access" : "MEDLINE"),
                pubdate: doc.pubdate || "",
                authors: authors,
                isPMC: isPMC,
                id: isPMC ? `PMC${queryId}` : `PMID: ${queryId}`,
                abstract: abstractText,
                url: targetUrl
            });

            if (state.articles.length === 1) {
                renderArticle(0);
                if (!state.activeTab) switchTab('pubmed');
                else updateTabs();
                triggerSpringEntrance();
            } else {
                updateTabs();
                renderArticle(state.articleIndex);
            }
        } catch (e) {
            console.error("PubMed/PMC error", e);
        }
    };

    buildShell();

    lightbox.onclick = () => { lightbox.style.display = 'none'; };
    infoModal.onclick = (e) => {
        if (e.target === infoModal || e.target.id === 'deck-info-close-btn') {
            infoModal.style.display = 'none';
        }
    };

    const scanPage = () => {
        // Wikipedia Scan
        if (!state.wiki) {
            const wikiLink = document.querySelector('a[href*="en.wikipedia.org/wiki/"]');
            if (wikiLink) {
                const slug = wikiLink.href.split('/wiki/')[1].split('&')[0].split('#')[0];
                fetchWikipedia(slug);
            }
        }

        // Reddit Scan
        if (state.redditThreads.length < 5) {
            const redditLinks = document.querySelectorAll('a[href*="reddit.com/r/"]');
            redditLinks.forEach(link => {
                const match = link.href.match(/\/comments\/([a-z0-9]{5,8})\b/i);
                if (match && !state.redditPostIds.has(match[1]) && state.redditThreads.length < 5) {
                    state.redditPostIds.add(match[1]);
                    fetchRedditThread(match[1], link.href);
                }
            });
        }

        // GitHub Scan
        if (!state.github) {
            const ghLink = document.querySelector('a[href*="github.com/"]');
            if (ghLink) {
                const match = ghLink.href.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
                if (match && !['topics', 'features', 'pricing', 'login', 'signup', 'explore'].includes(match[1])) {
                    fetchGitHub(match[1], match[2]);
                }
            }
        }

        // Multi-Article PubMed & PMC Scan (up to 5 papers)
        if (state.articles.length < 5) {
            const pmcLinks = document.querySelectorAll('a[href*="pmc.ncbi.nlm.nih.gov/articles/PMC"], a[href*="ncbi.nlm.nih.gov/pmc/articles/PMC"]');
            pmcLinks.forEach(link => {
                const match = link.href.match(/PMC(\d+)/i);
                if (match && !state.articleIds.has('PMC' + match[1]) && state.articles.length < 5) {
                    state.articleIds.add('PMC' + match[1]);
                    fetchPubMedOrPMC(match[1], true);
                }
            });

            const pubmedLinks = document.querySelectorAll('a[href*="pubmed.ncbi.nlm.nih.gov/"]');
            pubmedLinks.forEach(link => {
                const match = link.href.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
                if (match && !state.articleIds.has('PMID' + match[1]) && state.articles.length < 5) {
                    state.articleIds.add('PMID' + match[1]);
                    fetchPubMedOrPMC(match[1], false);
                }
            });
        }
    };

    scanPage();
    setInterval(scanPage, 2500);
})();