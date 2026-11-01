/* Restore the signed-in workspace before the learning modules read local progress. */
(function (global) {
  'use strict';
  const scripts = ['feedback.js','history.js','usage.js','audio.js','analytics.js','verbs.js','lesson-courses.js','sentences.js','writing.js','journey-calendar.js','content.js','grammar.js','app.js?v=20261101-case-names','course-ui.js'];
  const messages = {
    ar: ['جارٍ تجهيز مكتبتك…','تعذّر فتح الموقع. أعد تحميل الصفحة.'],
    en: ['Preparing your library…','Could not open the app. Reload the page.'],
    nl: ['Je bibliotheek wordt voorbereid…','De app kon niet worden geopend. Herlaad de pagina.'],
    de: ['Deine Bibliothek wird vorbereitet…','Die App konnte nicht geöffnet werden. Lade die Seite neu.']
  };
  const text = messages[global.WORT_COURSE?.native] || messages.ar;
  const status = document.querySelector('#app-status'), main = document.querySelector('#main-content');
  if (status) status.textContent = text[0];
  main?.setAttribute('aria-busy','true');
  const load = source => new Promise((resolve,reject) => {
    const script = document.createElement('script');
    script.src = source; script.async = false;
    script.onload = resolve; script.onerror = () => reject(new Error('module-load'));
    document.body.append(script);
  });
  global.WORT_APP_READY = (async () => {
    await global.WORT_ACCOUNT?.ready;
    for (const source of scripts) await load(source);
    main?.setAttribute('aria-busy','false');
    if (status?.textContent === text[0]) status.textContent = '';
  })().catch(() => {
    main?.setAttribute('aria-busy','false');
    if (status) {status.textContent = text[1];status.setAttribute('role','alert');}
  });
})(window);
