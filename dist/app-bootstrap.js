/* Restore the signed-in workspace before the learning modules read local progress. */
(function (global) {
  'use strict';
  const scripts = ['feedback.js','history.js','usage.js','audio.js?v=20261101-tts-repair-v4','analytics.js','verbs.js','lesson-courses.js','sentences.js','writing.js','journey-calendar.js','example-curated-a1.js?v=20261102-a1-sentences','example-fallback.js?v=20261102-a1-sentences','example-quality.js?v=20261102-all-words','content.js?v=20261102-all-words','grammar.js','topics-data.js?v=20261102-expanded16','topics-additional-a.js?v=20261102-extra19','topics-additional-b.js?v=20261102-extra19','topics-language-pack.js?v=20261102-topic4-expanded-v2','topics-more-manual-a.js?v=20261102-more35','topics-more-manual-b.js?v=20261102-more35','topics-more-related.js?v=20261102-more35','topics.js?v=20261102-two-tabs','daily-reminders.js?v=20261102-daily-reminder','app.js?v=20261102-daily-reminder','course-ui.js'];
  const messages = {
    ar: ['جارٍ تجهيز مكتبتك…','تعذّر فتح الموقع. أعد تحميل الصفحة.'],
    en: ['Preparing your library…','Could not open the app. Reload the page.'],
    nl: ['Je bibliotheek wordt voorbereid…','De app kon niet worden geopend. Herlaad de pagina.'],
    de: ['Deine Bibliothek wird vorbereitet…','Die App konnte nicht geöffnet werden. Lade die Seite neu.']
  };
  const text = messages[global.WORT_COURSE?.native] || messages.ar;
  const status = document.querySelector('#app-status'), main = document.querySelector('#main-content');
  const boot = document.querySelector('#kalima-boot-screen');
  const bootMessage = document.querySelector('#kalima-boot-message');
  const retry = document.querySelector('#kalima-boot-retry');
  if (bootMessage) bootMessage.textContent = text[0];
  retry?.addEventListener('click', () => location.reload());

  // A slow connection should never reveal the incomplete 0 / 0 learning page.
  // Offer a safe retry while waiting for account sync and course downloads.
  let completed = false;
  const longLoadTimer = setTimeout(() => {
    if (completed || !bootMessage) return;
    bootMessage.textContent = text[0];
    if (retry) retry.hidden = false;
  }, 18000);
  function showReady() {
    completed = true;
    clearTimeout(longLoadTimer);
    document.documentElement.classList.remove('kalima-booting');
    document.documentElement.classList.add('kalima-boot-finished');
    setTimeout(() => boot?.remove(), 240);
  }
  function showFailure(message) {
    completed = true;
    clearTimeout(longLoadTimer);
    if (bootMessage) bootMessage.textContent = message || text[1];
    if (retry) retry.hidden = false;
  }

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
    // Loading the app script is not sufficient: its initial fetch of the
    // curriculum and A1 word list must also finish before the first paint.
    if (global.WORT_APP_INIT) await global.WORT_APP_INIT;
    if (status?.textContent?.trim() && status.textContent !== text[0]) {
      throw new Error(status.textContent);
    }
    main?.setAttribute('aria-busy','false');
    if (status?.textContent === text[0]) status.textContent = '';
    showReady();
  })().catch(error => {
    main?.setAttribute('aria-busy','false');
    const message = error?.message && error.message !== 'module-load' ? error.message : text[1];
    if (status) {status.textContent = message;status.setAttribute('role','alert');}
    showFailure(message);
  });
})(window);
