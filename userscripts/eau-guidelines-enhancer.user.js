// ==UserScript==
// @name         EAU Guidelines UI Enhancer
// @namespace    http://tampermonkey.net/
// @version      1.5.1
// @description  Structural TOC fix (bypasses text matching) + vertical floating widget.
// @author       Varun
// @match        *://uroweb.org/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // MODULE 1: TOC SCROLL LOCK (Structural Search)
    // =========================================================================
    const style = document.createElement('style');
    style.innerHTML = `
        [data-custom-scrollbar="true"] {
            align-self: flex-start !important;
            position: sticky !important;
            top: 100px !important;
            max-height: calc(100vh - 120px) !important;
            overflow-y: auto !important;
            overscroll-behavior: contain !important;
            padding-right: 8px !important;
            z-index: 50 !important;
        }

        [data-custom-scrollbar="true"]::-webkit-scrollbar { width: 5px; }
        [data-custom-scrollbar="true"]::-webkit-scrollbar-track { background: transparent; }
        [data-custom-scrollbar="true"]::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        [data-custom-scrollbar="true"]:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
    `;
    document.head.appendChild(style);

    const fixTOC = () => {
        // Scan the DOM for block elements that might be the sidebar
        const elements = document.querySelectorAll('div, aside, nav, section');
        let sidebarColumn = null;

        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const rect = el.getBoundingClientRect();

            // Look for a layout column roughly the width of a sidebar (200px - 450px)
            if (rect.width >= 200 && rect.width <= 450 && rect.height > 100) {
                const parent = el.parentElement;
                if (parent) {
                    const parentStyle = window.getComputedStyle(parent);

                    // Must be a direct child of the main flex/grid layout
                    if (parentStyle.display === 'flex' || parentStyle.display === 'grid') {

                        // Verify it's actually the TOC by checking for generic chapter keywords
                        const text = el.textContent;
                        if (text.includes('Introduction') && (text.includes('Disease') || text.includes('References'))) {
                            sidebarColumn = el;
                            break;
                        }
                    }
                }
            }
        }

        if (sidebarColumn && !sidebarColumn.hasAttribute('data-custom-scrollbar')) {
            sidebarColumn.setAttribute('data-custom-scrollbar', 'true');
        }
    };

    const observer = new MutationObserver(() => {
        fixTOC();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(fixTOC, 500);
    setTimeout(fixTOC, 1500);


    // =========================================================================
    // MODULE 2: VERTICAL FLOATING WIDGET & BANNER HIDING
    // =========================================================================
    const widgetStyle = document.createElement('style');
    widgetStyle.innerHTML = `
        #uro-floating-stack {
            position: fixed;
            bottom: 24px;
            left: 24px;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(0,0,0,0.06);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
            border-radius: 24px;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 999999;
        }
        .uro-icon-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: transparent;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #475569;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
        }
        .uro-icon-btn:hover {
            background: #f1f5f9;
            color: #0f172a;
            transform: scale(1.05);
        }
        .uro-hide-safely { display: none !important; }
    `;
    document.head.appendChild(widgetStyle);

    let botVisible = true;
    const svgFullDoc = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 18 15 15"></polyline></svg>`;
    const svgPocket = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
    const svgBot = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path><path d="M12 8V4H8"></path></svg>`;

    const stack = document.createElement('div');
    stack.id = 'uro-floating-stack';

    const fullBtn = document.createElement('a');
    fullBtn.className = 'uro-icon-btn';
    fullBtn.target = '_blank';
    fullBtn.innerHTML = svgFullDoc;
    fullBtn.title = "Full PDF";
    fullBtn.style.display = 'none';

    const pocketBtn = document.createElement('a');
    pocketBtn.className = 'uro-icon-btn';
    pocketBtn.target = '_blank';
    pocketBtn.innerHTML = svgPocket;
    pocketBtn.title = "Pocket Guidelines";
    pocketBtn.style.display = 'none';

    const botToggle = document.createElement('button');
    botToggle.className = 'uro-icon-btn';
    botToggle.innerHTML = svgBot;
    botToggle.title = "Toggle Bot";

    botToggle.onclick = () => {
        botVisible = !botVisible;
        botToggle.style.opacity = botVisible ? '1' : '0.5';
        botToggle.style.background = botVisible ? 'transparent' : '#fee2e2';
        botToggle.style.color = botVisible ? '#475569' : '#ef4444';

        document.querySelectorAll('*').forEach(el => {
            const compStyle = window.getComputedStyle(el);
            if (compStyle.position === 'fixed' && (el.textContent.includes('Ask Guidelines Bot') || el.id.toLowerCase().includes('bot') || el.className.toLowerCase().includes('bot'))) {
                if (el.tagName !== 'HEADER' && !el.className.toLowerCase().includes('nav')) {
                    el.style.display = botVisible ? '' : 'none';
                }
            }
        });
    };

    stack.appendChild(fullBtn);
    stack.appendChild(pocketBtn);
    stack.appendChild(botToggle);
    document.body.appendChild(stack);

    setInterval(() => {
        Array.from(document.querySelectorAll('a')).forEach(a => {
            const txt = a.textContent.trim().toLowerCase();

            if (txt === 'download full guideline') {
                fullBtn.href = a.href;
                fullBtn.style.display = 'flex';
                const wrapper = a.closest('div');
                if (wrapper && wrapper.textContent.includes('Want to read')) {
                    wrapper.classList.add('uro-hide-safely');
                }
            }

            if (txt === 'download pocket guidelines') {
                pocketBtn.href = a.href;
                pocketBtn.style.display = 'flex';
                const wrapper = a.closest('div');
                if (wrapper && wrapper.textContent.includes('Looking for a quick overview')) {
                    wrapper.classList.add('uro-hide-safely');
                }
            }
        });
    }, 2000);
})();