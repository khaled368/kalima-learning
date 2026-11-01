/* Original German sentence-building lessons, with Arabic teaching notes. */
(() => {
  'use strict';
  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const STORAGE_KEY = 'wort-sentences-v1';
  const mounted = new WeakMap();
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const make = (id, level, title, words, meaning, instruction, explanation, alternatives = []) => ({ id, level, title, words, meaning, instruction, explanation, alternatives });
  const EXERCISES = [
    make('a1-statement', 'A1', 'الجملة الخبرية البسيطة', ['Ich', 'lerne', 'Deutsch', '.'], 'أنا أتعلّم الألمانية.', 'ابدأ بـ Ich، ثم ضع الفعل وبعده اللغة التي تتعلّمها.', 'في هذه الجملة: Ich فاعل، وlerne فعل مصرّف مع ich، وDeutsch تكملة. الفعل المصرّف يحتلّ الموضع الثاني.'),
    make('a1-time-first', 'A1', 'حين تبدأ الجملة بالزمان', ['Heute', 'trinke', 'ich', 'Kaffee', '.'], 'اليوم أشرب القهوة.', 'ابدأ بظرف الزمان Heute. اجعل الفاعل مباشرة بعد الفعل.', 'يمكن أن يبدأ ظرف الزمان الجملة. يبقى الفعل trinke في الموضع الثاني، ثم يأتي الفاعل ich. الموضع يعني عنصرًا في الجملة، لا عدد الكلمات دائمًا.'),
    make('a1-yes-no', 'A1', 'سؤال إجابته نعم أو لا', ['Lernst', 'du', 'Deutsch', '?'], 'هل تتعلّم الألمانية؟', 'كوّن سؤالًا يبدأ بالفعل Lernst، ثم ضع الفاعل.', 'في سؤال نعم/لا يبدأ الفعل المصرّف الجملة: Lernst du …? صيغة lernst تناسب الضمير du.'),
    make('a1-question-word', 'A1', 'السؤال بأداة استفهام', ['Wo', 'wohnst', 'du', '?'], 'أين تسكن؟', 'ابدأ بأداة السؤال Wo، ثم الفعل ثم الفاعل.', 'في هذا السؤال تأتي أداة الاستفهام Wo أولًا، ثم الفعل المصرّف wohnst، ثم الفاعل du.'),
    make('a1-kein', 'A1', 'نفي الاسم باستخدام kein', ['Ich', 'habe', 'kein', 'Auto', '.'], 'ليست لديّ سيارة.', 'ابدأ بـ Ich habe، ثم أضف الاسم المنفي مع أداته قبله.', 'ننفي هنا الاسم المحايد Auto باستخدام kein. يأتي kein قبل الاسم. ترتيب الجملة: فاعل + فعل + تكملة منفيّة.'),

    make('a2-modal', 'A2', 'الفعل الناقص: قوس الفعل', ['Ich', 'möchte', 'heute', 'Deutsch', 'lernen', '.'], 'أودّ أن أتعلّم الألمانية اليوم.', 'ابدأ بـ Ich möchte، وضع heute قبل Deutsch، واجعل المصدر في نهاية الجملة.', 'الفعل المصرّف möchte في الموضع الثاني. يبقى lernen مصدرًا في النهاية. عناصر مثل heute وDeutsch تقع بين طرفَي قوس الفعل.'),
    make('a2-separable', 'A2', 'الفعل القابل للانفصال', ['Morgen', 'rufe', 'ich', 'meine', 'Mutter', 'an', '.'], 'سأتّصل بأمّي غدًا.', 'ابدأ بـ Morgen، وضع الفاعل بعد الفعل، واجعل الجزء المنفصل في النهاية.', 'الفعل هو anrufen. في الجملة الرئيسية ينفصل an إلى النهاية، ويأتي الجزء المصرّف rufe في الموضع الثاني.'),
    make('a2-perfect', 'A2', 'بناء الماضي المركّب', ['Gestern', 'habe', 'ich', 'einen', 'Film', 'gesehen', '.'], 'شاهدت فيلمًا أمس.', 'ابدأ بـ Gestern، ثم الفعل المساعد، ثم الفاعل. ضع اسم المفعول في النهاية.', 'في Perfekt نستخدم هنا habe مع gesehen. الفعل المساعد مصرّف في الموضع الثاني، واسم المفعول gesehen في نهاية الجملة.'),
    make('a2-two-objects', 'A2', 'ترتيب مفعولَين اسميَّين', ['Ich', 'gebe', 'meinem', 'Bruder', 'das', 'Buch', '.'], 'أعطي أخي الكتاب.', 'ابدأ بـ Ich gebe. يجوز تقديم أحد المفعولَين بحسب التركيز؛ نقبل الترتيبين المذكورين في الشرح.', 'عندما يكون المفعولان اسمَين، يأتي الداتيف meinem Bruder عادة قبل الأكوزاتيف das Buch. الترتيب الآخر صحيح أيضًا بحسب السياق وما نريد تقديمه أو التأكيد عليه.', [['Ich', 'gebe', 'das', 'Buch', 'meinem', 'Bruder', '.']]),
    make('a2-denn', 'A2', 'الربط باستخدام denn', ['Ich', 'bleibe', 'zu', 'Hause', ',', 'denn', 'ich', 'bin', 'krank', '.'], 'أبقى في المنزل لأنني مريض.', 'ابدأ بـ Ich bleibe، ثم zu Hause. اربط السبب باستخدام denn، وبعدها ابدأ بالفاعل ich.', 'تربط denn جملتَين رئيسيتَين. لذلك يبقى ترتيب ich bin krank عاديًا بعد denn، ولا ينتقل الفعل bin إلى النهاية.'),

    make('b1-weil', 'B1', 'جملة السبب مع weil', ['Ich', 'bleibe', 'zu', 'Hause', ',', 'weil', 'ich', 'krank', 'bin', '.'], 'أبقى في المنزل لأنني مريض.', 'ابدأ بالجملة Ich bleibe zu Hause، ثم weil. ضع فعل جملة السبب في نهايتها.', 'بعد weil نبني جملة فرعية: weil ich krank bin. الفعل المصرّف bin يأتي في آخر الجملة الفرعية، وتفصل فاصلة بينها وبين الجملة الرئيسية.'),
    make('b1-dass', 'B1', 'نقل الفكرة باستخدام dass', ['Ich', 'glaube', ',', 'dass', 'er', 'heute', 'kommt', '.'], 'أعتقد أنه سيأتي اليوم.', 'ابدأ بـ Ich glaube، واجعل er أول عنصر بعد dass، ثم الزمان، ثم الفعل.', 'تبدأ dass جملة فرعية. يأتي er بعد الأداة في هذا النمط، ويقف الفعل المصرّف kommt في النهاية.'),
    make('b1-clause-first', 'B1', 'الجملة الفرعية في البداية', ['Wenn', 'ich', 'Zeit', 'habe', ',', 'lese', 'ich', 'ein', 'Buch', '.'], 'عندما يكون لديّ وقت، أقرأ كتابًا.', 'ابدأ بجملة Wenn ich Zeit habe، ثم ضع فعل الجملة الرئيسية مباشرة بعد الفاصلة.', 'في جملة wenn يأتي habe في النهاية. والجملة الفرعية كلها تشغل العنصر الأول؛ لذلك يليها الفعل الرئيسي lese، ثم الفاعل ich.'),
    make('b1-reflexive', 'B1', 'الضمير الانعكاسي وحرف الجر', ['Ich', 'interessiere', 'mich', 'für', 'Musik', '.'], 'أنا مهتمّ بالموسيقى.', 'ابدأ بـ Ich interessiere، ثم الضمير الانعكاسي، ثم عبارة حرف الجر.', 'التعبير هو sich für etwas interessieren. مع ich نستخدم mich، وتأتي عبارة für Musik بعده في هذا النمط.'),
    make('b1-infinitive', 'B1', 'المصدر مع zu', ['Er', 'versucht', ',', 'jeden', 'Tag', 'Deutsch', 'zu', 'sprechen', '.'], 'يحاول أن يتحدّث الألمانية كل يوم.', 'ابدأ بـ Er versucht، ثم jeden Tag Deutsch. ضع zu قبل المصدر sprechen مباشرة.', 'نستخدم هنا versucht مع تركيب مصدر بـ zu: Deutsch zu sprechen. الفاصلة في هذا المثال جائزة وتوضّح الفصل بين الجزأين؛ وهي من القطع المطلوب ترتيبها.'),

    make('b2-relative-subject', 'B2', 'جملة الوصل: الضمير فاعل', ['Das', 'ist', 'der', 'Mann', ',', 'der', 'neben', 'uns', 'wohnt', '.'], 'هذا هو الرجل الذي يسكن بجوارنا.', 'ابدأ بـ Das ist der Mann، ثم ضمير الوصل der. ضع فعل جملة الوصل في النهاية.', 'der بعد الفاصلة ضمير وصل يعود على Mann، وهو فاعل في جملة الوصل، لذلك يأتي في حالة الرفع. ينتهي الجزء الفرعي بالفعل wohnt.'),
    make('b2-relative-object', 'B2', 'جملة الوصل في الماضي المركّب', ['Das', 'ist', 'das', 'Buch', ',', 'das', 'ich', 'gestern', 'gekauft', 'habe', '.'], 'هذا هو الكتاب الذي اشتريته أمس.', 'ابدأ بـ Das ist das Buch، ثم das ich gestern. اختم جملة الوصل باسم المفعول ثم الفعل المساعد.', 'das بعد الفاصلة ضمير وصل محايد في الأكوزاتيف، لأنه المفعول به لـ kaufen. في جملة الوصل يتأخّر الفعل المساعد habe بعد gekauft.'),
    make('b2-although', 'B2', 'المقابلة باستخدام obwohl', ['Obwohl', 'es', 'regnet', ',', 'gehen', 'wir', 'spazieren', '.'], 'رغم أن المطر يهطل، نذهب للتنزّه.', 'ابدأ بالجملة الفرعية Obwohl es regnet، ثم ضع gehen قبل الفاعل wir.', 'بعد obwohl يأتي الفعل regnet في نهاية الجزء الفرعي. ولأن الجزء الفرعي سبق الجملة الرئيسية، يأتي gehen قبل wir مباشرة بعد الفاصلة.'),
    make('b2-purpose', 'B2', 'التعبير عن الهدف بـ um … zu', ['Ich', 'lerne', 'Deutsch', ',', 'um', 'in', 'Deutschland', 'zu', 'studieren', '.'], 'أتعلّم الألمانية لكي أدرس في ألمانيا.', 'ابدأ بـ Ich lerne Deutsch. ابدأ الهدف بـ um، وضع zu قبل المصدر studieren.', 'نستعمل um … zu عندما يكون فاعل الجملة الرئيسية وفاعل الهدف واحدًا، وهو Ich هنا. يسبق zu المصدر، وتفصل فاصلة بين الجزأين.'),
    make('b2-not-only', 'B2', 'ليس فقط … بل أيضًا', ['Er', 'lernt', 'nicht', 'nur', 'Deutsch', ',', 'sondern', 'auch', 'Französisch', '.'], 'هو لا يتعلّم الألمانية فقط، بل الفرنسية أيضًا.', 'ابدأ بـ Er lernt، وضع nicht nur قبل Deutsch، ثم اربط اللغة الأخرى بـ sondern auch.', 'يربط nicht nur … sondern auch عنصرَين متوازيَين: Deutsch وFranzösisch. يبقى الفعل lernt في موضعه داخل الجملة الرئيسية.'),

    make('c1-indirect-question', 'C1', 'السؤال غير المباشر', ['Ich', 'frage', 'mich', ',', 'ob', 'er', 'die', 'Entscheidung', 'bereits', 'getroffen', 'hat', '.'], 'أتساءل عمّا إذا كان قد اتّخذ القرار بالفعل.', 'ابدأ بـ Ich frage mich، وبعد ob ابدأ بالفاعل er. نقبل bereits قبل المفعول أو بعده.', 'في السؤال غير المباشر تبدأ ob الجملة الفرعية. يأتي الفعل المساعد المصرّف hat في النهاية بعد getroffen. يمكن وضع bereits قبل die Entscheidung أو بعد المفعول بحسب التركيز.', [['Ich', 'frage', 'mich', ',', 'ob', 'er', 'bereits', 'die', 'Entscheidung', 'getroffen', 'hat', '.']]),
    make('c1-modal-passive', 'C1', 'الفعل الناقص مع المبني للمجهول', ['Dieser', 'Vorschlag', 'muss', 'noch', 'einmal', 'gründlich', 'geprüft', 'werden', '.'], 'يجب فحص هذا الاقتراح بدقّة مرة أخرى.', 'ابدأ بـ Dieser Vorschlag muss، ثم noch einmal gründlich، واختم بـ geprüft werden.', 'muss هو الفعل المصرّف في الموضع الثاني بعد الفاعل المكوَّن من كلمتين. يأتي تركيب المبني للمجهول geprüft werden في النهاية؛ فلا نصرّف werden هنا.'),
    make('c1-proportional', 'C1', 'كلّما … ازداد', ['Je', 'mehr', 'ich', 'übe', ',', 'desto', 'flüssiger', 'spreche', 'ich', '.'], 'كلّما تدربت أكثر، تحدّثت بطلاقة أكبر.', 'ابدأ بـ Je mehr ich übe. بعد الفاصلة ضع desto flüssiger ثم الفعل ثم الفاعل.', 'في جزء je يتأخّر الفعل übe إلى نهايته. وفي الجزء الرئيسي تشغل desto flüssiger العنصر الأول، ثم يأتي الفعل spreche، ثم الفاعل ich.'),
    make('c1-unreal-condition', 'C1', 'الشرط الافتراضي', ['Wenn', 'ich', 'mehr', 'Zeit', 'hätte', ',', 'würde', 'ich', 'regelmäßig', 'schreiben', '.'], 'لو كان لديّ وقت أكثر، لكتبت بانتظام.', 'ابدأ بـ Wenn ich mehr Zeit hätte. بعد الفاصلة ضع würde ثم ich، واجعل schreiben آخر كلمة قبل النقطة.', 'hätte في جملة الشرط صيغة Konjunktiv II ويتأخّر إلى النهاية. تبدأ الجملة الرئيسية بـ würde بعد الجزء الشرطي، ويبقى schreiben مصدرًا في آخرها.'),
    make('c1-reported-speech', 'C1', 'الكلام المنقول دون dass', ['Der', 'Autor', 'betont', ',', 'die', 'Ergebnisse', 'seien', 'noch', 'nicht', 'eindeutig', '.'], 'يؤكّد الكاتب أن النتائج ليست حاسمة بعد.', 'ابدأ بـ Der Autor betont. انقل قوله دون dass: ابدأ بالفاعل die Ergebnisse، ثم seien.', 'seien صيغة Konjunktiv I للجمع، وتُستخدم هنا لنقل كلام الكاتب. لأن الجزء المنقول لا يبدأ بـ dass في هذا النمط، يبقى فعله seien في الموضع الثاني بعد die Ergebnisse.')
  ];
  const RULES = {
    A1: { title: 'ابدأ من مكان الفعل', pattern: [['الفاعل', 'subject'], ['الفعل المصرّف', 'verb'], ['التكملة', 'object']], notes: ['في الجملة الخبرية يكون الفعل المصرّف ثاني عنصر.', 'في سؤال نعم/لا يبدأ الفعل الجملة. مع أداة سؤال يأتي بعدها.', 'طابق تصريف الفعل مع الفاعل، وأضف علامة النهاية.'] },
    A2: { title: 'تعلّم قوس الفعل', pattern: [['العنصر الأول', 'subject'], ['الفعل المصرّف', 'verb'], ['التكملات', 'object'], ['جزء الفعل الأخير', 'verb']], notes: ['مع فعل ناقص يتأخّر المصدر إلى آخر الجملة.', 'الفعل القابل للانفصال يترك بادئته في النهاية.', 'في Perfekt يأتي الفعل المساعد مبكرًا واسم المفعول أخيرًا.'] },
    B1: { title: 'ميّز الرئيسية عن الفرعية', pattern: [['أداة الربط', 'connector'], ['الفاعل والتكملات', 'object'], ['الفعل المصرّف أخيرًا', 'verb']], notes: ['بعد weil وdass وwenn يأتي الفعل المصرّف في نهاية الجملة الفرعية.', 'إذا سبقت الجملة الفرعية، يليها فعل الجملة الرئيسية ثم فاعلها.', 'المصدر مع zu له تركيب مختلف عن الفعل المصرّف.'] },
    B2: { title: 'اربط الأفكار مع ضبط وظيفة كل جزء', pattern: [['الفكرة الرئيسية', 'subject'], ['فاصلة وأداة ربط', 'connector'], ['تفصيل أو هدف', 'object'], ['فعل الجزء الفرعي', 'verb']], notes: ['ضمير الوصل يأخذ جنسه وعدده من الاسم السابق، وحالته من دوره داخل جملة الوصل.', 'بعد obwohl يبقى الفعل في نهاية الجزء الفرعي.', 'um … zu يعبّر عن هدف يشترك صاحبه مع فاعل الرئيسية.'] },
    C1: { title: 'اضبط نوع الجملة قبل ترتيب الأفعال', pattern: [['جملة ممهِّدة', 'subject'], ['ترابط منطقي', 'connector'], ['مجموعة الأفعال', 'verb']], notes: ['السؤال غير المباشر مع ob يتبع ترتيب الجملة الفرعية.', 'المبني للمجهول مع فعل ناقص ينتهي باسم المفعول ثم werden.', 'الكلام المنقول والشرط والمقارنة النسبية تحتاج الانتباه إلى صيغة الفعل وموضعه معًا.'] }
  };
  function readProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const ids = new Set(EXERCISES.map(exercise => exercise.id));
      return { solved: new Set(Array.isArray(value.solved) ? value.solved.filter(id => ids.has(id)) : []), level: LEVELS.includes(value.level) ? value.level : 'A1', exercise: typeof value.exercise === 'string' ? value.exercise : '' };
    } catch { return { solved: new Set(), level: 'A1', exercise: '' }; }
  }
  function shuffledIndices(length) {
    const indices = Array.from({ length }, (_, index) => index);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    if (length > 1 && indices.every((value, index) => value === index)) indices.push(indices.shift());
    return indices;
  }
  function sentence(words) { return words.join(' ').replace(/\s+([,.!?;:])/g, '$1'); }
  function equalWords(a, b) { return a.length === b.length && a.every((word, index) => word === b[index]); }
  function mount(container) {
    if (!container || typeof container.innerHTML !== 'string') throw new TypeError('A container element is required.');
    const previous = mounted.get(container);
    if (previous) previous.cleanup();
    const progress = readProgress();
    const state = { level: progress.level, exercise: progress.exercise, selected: [], bank: [], feedback: '', feedbackType: '', showExplanation: false, revealed: false, ruleOpen: true, storageAvailable: true };
    let disposed = false;
    const list = () => EXERCISES.filter(exercise => exercise.level === state.level);
    const current = () => list().find(exercise => exercise.id === state.exercise) || list()[0];
    function persist() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ solved: [...progress.solved], level: state.level, exercise: current().id })); }
      catch { state.storageAvailable = false; }
    }
    function resetExercise(id = current().id, save = true) {
      const exercise = list().find(exercise => exercise.id === id) || list()[0];
      state.exercise = exercise.id;
      state.selected = [];
      state.bank = shuffledIndices(exercise.words.length);
      state.feedback = '';
      state.feedbackType = '';
      state.showExplanation = false;
      state.revealed = false;
      if (save) persist();
    }
    function clearFeedback() { state.feedback = ''; state.feedbackType = ''; state.showExplanation = false; }
    function render() {
      if (disposed) return;
      const exercise = current(), exercises = list(), index = exercises.findIndex(item => item.id === exercise.id), rule = RULES[state.level];
      const selected = new Set(state.selected);
      const solvedLevel = exercises.filter(item => progress.solved.has(item.id)).length;
      const alternatives = [exercise.words, ...exercise.alternatives];
      const answer = state.selected.map(tokenIndex => exercise.words[tokenIndex]);
      container.innerHTML = `<div class="lesson-module sentence-module">
        <div class="welcome"><p class="eyebrow">افهم النمط، ثم جرّبه بنفسك</p><h1 class="hero-title">كيف أركّب جملة؟</h1><p class="hero-subtitle">شرح قصير، وكلمات ترتّبها لتبني جملة ألمانية مفهومة.</p></div>
        <div class="lesson-levels level-tabs" aria-label="مستوى تركيب الجملة">${LEVELS.map(level => `<button type="button" class="lesson-level level-tab ${level === state.level ? 'active' : ''}" data-sentence-level="${level}" aria-pressed="${level === state.level}"><strong dir="ltr">${level}</strong></button>`).join('')}</div>
        <details class="lesson-rule-card sentence-rule-card" ${state.ruleOpen ? 'open' : ''}><summary>${escapeHtml(rule.title)}</summary><div class="sentence-pattern" aria-label="مخطط الجملة">${rule.pattern.map(([label, role], position) => `${position ? '<span class="sentence-pattern-arrow" aria-hidden="true">←</span>' : ''}<span class="sentence-pattern-chip sentence-role-${role}">${escapeHtml(label)}</span>`).join('')}</div><ul>${rule.notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul></details>
        <div class="lesson-progress"><span>أنجزت ${solvedLevel} من ${exercises.length} في ${state.level}</span><span>المجموع <bdi dir="ltr">${progress.solved.size} / ${EXERCISES.length}</bdi></span></div>
        <div class="track" role="progressbar" aria-label="تقدم تمارين ${state.level}" aria-valuemin="0" aria-valuemax="${exercises.length}" aria-valuenow="${solvedLevel}"><i style="width:${solvedLevel / exercises.length * 100}%"></i></div>
        <div class="lesson-toolbar sentence-toolbar"><label for="sentence-exercise-select">اختر التمرين</label><select id="sentence-exercise-select" class="filter-select" data-sentence-select>${exercises.map((item, itemIndex) => `<option value="${item.id}" ${item.id === exercise.id ? 'selected' : ''}>${itemIndex + 1}. ${escapeHtml(item.title)}${progress.solved.has(item.id) ? ' ✓' : ''}</option>`).join('')}</select></div>
        <section class="sentence-exercise lesson-card" aria-labelledby="sentence-exercise-title"><div class="section-heading"><h2 id="sentence-exercise-title" tabindex="-1">${escapeHtml(exercise.title)}</h2><span dir="ltr">${index + 1} / ${exercises.length}</span></div><p class="sentence-meaning">${escapeHtml(exercise.meaning)}</p><p class="sentence-instruction">${escapeHtml(exercise.instruction)}</p>
          <h3 class="lesson-label">جملتك</h3><div class="sentence-answer" lang="de" dir="ltr" aria-label="الجملة التي تركّبها">${state.selected.length ? state.selected.map(tokenIndex => `<button type="button" class="sentence-token sentence-answer-token" data-answer-token="${tokenIndex}" aria-label="إزالة ${escapeHtml(exercise.words[tokenIndex])} من الجملة؛ يمكنك تحريكه بسهمَي اليمين واليسار">${escapeHtml(exercise.words[tokenIndex])}</button>`).join('') : '<span class="sentence-placeholder" lang="ar" dir="rtl">اضغط الكلمات في الأسفل بالترتيب الذي تختاره.</span>'}</div>
          <h3 class="lesson-label">الكلمات المتاحة</h3><div class="sentence-bank" lang="de" dir="ltr" aria-label="كلمات التمرين">${state.bank.map(tokenIndex => `<button type="button" class="sentence-token ${selected.has(tokenIndex) ? 'is-used' : ''}" data-bank-token="${tokenIndex}" ${selected.has(tokenIndex) ? 'disabled' : ''} aria-label="أضف ${escapeHtml(exercise.words[tokenIndex])} إلى الجملة">${escapeHtml(exercise.words[tokenIndex])}</button>`).join('')}</div>
          <p class="source-note sentence-help">اضغط كلمة في جملتك لإعادتها إلى البنك. من لوحة المفاتيح: حرّك الكلمة بسهمَي اليمين واليسار، أو احذفها بزر الحذف.</p>
          <div class="sentence-actions"><button type="button" class="primary" data-sentence-action="check">تحقّق من الترتيب ✓</button><button type="button" class="secondary" data-sentence-action="undo" ${state.selected.length ? '' : 'disabled'}>تراجع</button><button type="button" class="secondary" data-sentence-action="reset">أعد المحاولة</button><button type="button" class="secondary" data-sentence-action="reveal">أظهر النموذج</button><button type="button" class="secondary" data-example-speak="${escapeHtml(sentence(exercise.words))}">استمع إلى النموذج ♬</button></div>
          <div class="sentence-feedback ${state.feedbackType}" role="status" aria-live="polite" tabindex="-1">${state.feedback ? `<p>${escapeHtml(state.feedback)}</p>` : ''}${state.showExplanation ? `<p class="sentence-result" lang="de" dir="ltr">${escapeHtml(sentence(answer.length ? answer : exercise.words))}</p><p>${escapeHtml(exercise.explanation)}</p>${alternatives.length > 1 ? `<details class="sentence-alternatives"><summary>ترتيبات مقبولة في هذا التمرين</summary>${alternatives.map(words => `<p lang="de" dir="ltr">${escapeHtml(sentence(words))}</p>`).join('')}</details>` : ''}` : ''}</div>
        </section>
        <div class="lesson-pagination"><button type="button" class="secondary" data-sentence-action="previous" ${index > 0 ? '' : 'disabled'}>التمرين السابق</button><button type="button" class="primary" data-sentence-action="next" ${index < exercises.length - 1 ? '' : 'disabled'}>التمرين التالي ←</button></div>
        <p class="source-note">كل تمرين يحدّد نمطًا أو بدايةً مطلوبة. قد توجد جمل صحيحة أخرى خارج هذا النمط؛ هذا تدريب على الترتيب، وليس مصحّحًا آليًا للكتابة الحرّة.${state.storageAvailable ? ' يُحفظ إنجازك في هذا المتصفح.' : ' التخزين غير متاح حاليًا؛ يُحفظ الإنجاز خلال هذه الجلسة فقط.'}</p>
      </div>`;
    }
    function checkAnswer() {
      const exercise = current();
      if (state.selected.length !== exercise.words.length) {
        state.feedback = `أضف الكلمات وعلامات الترقيم المتبقية أولًا (${exercise.words.length - state.selected.length} متبقية).`;
        state.feedbackType = 'is-incomplete';
        state.showExplanation = false;
      } else {
        const answer = state.selected.map(index => exercise.words[index]);
        const correct = [exercise.words, ...exercise.alternatives].some(words => equalWords(words, answer));
        if (correct && state.revealed) {
          state.feedback = 'هذا هو النموذج المعروض. اضغط «أعد المحاولة» ثم رتّبه بنفسك ليُحتسب إنجازك.';
          state.feedbackType = 'is-revealed';
          state.showExplanation = true;
        } else if (correct) {
          progress.solved.add(exercise.id);
          state.feedback = 'أحسنت! رتّبت الجملة وفق النمط المطلوب.';
          state.feedbackType = 'is-correct';
          state.showExplanation = true;
          persist();
        } else {
          state.feedback = 'ترتيبك لا يطابق النمط المطلوب في هذا التمرين. راجع البداية المحدّدة وموضع الفعل والفاصلة، ثم حاول مجددًا.';
          state.feedbackType = 'is-incorrect';
          state.showExplanation = false;
        }
      }
      render();
      container.querySelector('.sentence-feedback')?.focus();
    }
    function onClick(event) {
      const button = event.target.closest('button');
      if (!button || !container.contains(button)) return;
      if (button.hasAttribute('data-sentence-level')) {
        state.level = button.dataset.sentenceLevel;
        resetExercise(list()[0].id);
        render();
        container.querySelector(`[data-sentence-level="${state.level}"]`)?.focus();
        return;
      }
      if (button.hasAttribute('data-bank-token')) {
        const tokenIndex = Number(button.dataset.bankToken);
        if (!state.selected.includes(tokenIndex)) state.selected.push(tokenIndex);
        clearFeedback();
        render();
        (container.querySelector('[data-bank-token]:not([disabled])') || container.querySelector('[data-sentence-action="check"]'))?.focus();
        return;
      }
      if (button.hasAttribute('data-answer-token')) {
        const tokenIndex = Number(button.dataset.answerToken);
        state.selected = state.selected.filter(index => index !== tokenIndex);
        clearFeedback();
        render();
        container.querySelector(`[data-bank-token="${tokenIndex}"]`)?.focus();
        return;
      }
      const action = button.dataset.sentenceAction;
      if (!action) return;
      if (action === 'check') return checkAnswer();
      if (action === 'undo') { state.selected.pop(); clearFeedback(); }
      if (action === 'reset') resetExercise();
      if (action === 'reveal') {
        state.selected = current().words.map((_, index) => index);
        state.revealed = true;
        state.feedback = 'هذا نموذج صحيح. اقرأ الشرح، ثم أعد المحاولة دون النظر إليه.';
        state.feedbackType = 'is-revealed';
        state.showExplanation = true;
      }
      if (action === 'previous' || action === 'next') {
        const exercises = list(), index = exercises.findIndex(exercise => exercise.id === state.exercise), next = index + (action === 'next' ? 1 : -1);
        if (exercises[next]) resetExercise(exercises[next].id);
      }
      render();
      if (action === 'reveal') container.querySelector('.sentence-feedback')?.focus();
      else if (action === 'next' || action === 'previous') container.querySelector('#sentence-exercise-title')?.focus();
      else if (action === 'undo' && state.selected.length) container.querySelector('[data-sentence-action="undo"]')?.focus();
      else container.querySelector('[data-bank-token]:not([disabled])')?.focus();
    }
    function onChange(event) {
      if (event.target.hasAttribute('data-sentence-select')) { resetExercise(event.target.value); render(); container.querySelector('[data-sentence-select]')?.focus(); }
    }
    function onToggle(event) {
      if (event.target.isConnected && event.target.classList?.contains('sentence-rule-card')) state.ruleOpen = event.target.open;
    }
    function onKeydown(event) {
      const button = event.target.closest('[data-answer-token]');
      if (!button || !container.contains(button)) return;
      const tokenIndex = Number(button.dataset.answerToken), index = state.selected.indexOf(tokenIndex);
      if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Delete', 'Backspace'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Delete' || event.key === 'Backspace') {
        state.selected.splice(index, 1);
        clearFeedback(); render();
        container.querySelector(`[data-bank-token="${tokenIndex}"]`)?.focus();
        return;
      }
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? state.selected.length - 1 : index + (event.key === 'ArrowLeft' ? -1 : 1);
      if (next < 0 || next >= state.selected.length || next === index) return;
      state.selected.splice(index, 1); state.selected.splice(next, 0, tokenIndex);
      clearFeedback(); render();
      container.querySelector(`[data-answer-token="${tokenIndex}"]`)?.focus();
    }
    container.addEventListener('click', onClick);
    container.addEventListener('change', onChange);
    container.addEventListener('keydown', onKeydown);
    container.addEventListener('toggle', onToggle, true);
    const cleanup = () => { if (disposed) return; disposed = true; container.removeEventListener('click', onClick); container.removeEventListener('change', onChange); container.removeEventListener('keydown', onKeydown); container.removeEventListener('toggle', onToggle, true); mounted.delete(container); };
    mounted.set(container, { cleanup });
    resetExercise(state.exercise, false);
    render();
    return cleanup;
  }
  function deepFreeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(deepFreeze); } return value; }
  deepFreeze(EXERCISES);
  globalThis.WORT_SENTENCES = Object.freeze({ mount, levels: Object.freeze([...LEVELS]), exercises: EXERCISES });
})();
