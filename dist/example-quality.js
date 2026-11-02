/* Check example relevance before associating a sentence with a vocabulary card.
   Intentionally conservative: no unrelated sentence is better than wrong teaching. */
(function (global) {
  'use strict';
  const GermanParticles = ['zurück','zusammen','weiter','entgegen','nieder','wieder','vor','auf','aus','ein','ab','an','mit','nach','bei','fest','fort','weg','los','zu','her','hin'];
  const irregular = {
    sein:['bin','bist','ist','sind','seid','war','waren','gewesen','sei'],
    haben:['habe','hast','hat','habt','hatte','hatten','gehabt'],
    werden:['werde','wirst','wird','werdet','wurde','wurden','geworden'],
    gehen:['gehe','gehst','geht','ging','gingen','gegangen'],
    kommen:['komme','kommst','kommt','kam','kamen','gekommen'],
    sehen:['sehe','siehst','sieht','sah','sahen','gesehen'],
    sprechen:['spreche','sprichst','spricht','sprach','sprachen','gesprochen'],
    nehmen:['nehme','nimmst','nimmt','nahm','nahmen','genommen'],
    geben:['gebe','gibst','gibt','gab','gaben','gegeben'],
    wissen:['weiß','weißt','wusste','wussten','gewusst'],
    essen:['esse','isst','aß','gegessen'],
    lesen:['lese','liest','las','lasen','gelesen'],
    schreiben:['schreibe','schreibst','schreibt','schrieb','geschrieben'],
    fahren:['fahre','fährst','fährt','fuhr','gefahren'],
    finden:['finde','findest','findet','fand','gefunden'],
    bringen:['bringe','bringst','bringt','brachte','gebracht'],
    denken:['denke','denkst','denkt','dachte','gedacht'],
    laufen:['laufe','läufst','läuft','lief','gelaufen'],
    stehen:['stehe','stehst','steht','stand','standen','gestanden'],
    stellen:['stelle','stellst','stellt','stellte','stellten','gestellt'],
    lassen:['lasse','lässt','ließ','gelassen'],
    schlafen:['schlafe','schläfst','schläft','schlief','geschlafen'],
    können:['kann','kannst','könnt','konnte','konnten','gekonnt'],
    müssen:['muss','musst','müsst','musste','mussten','gemusst'],
    dürfen:['darf','darfst','dürft','durfte','durften','gedurft'],
    wollen:['will','willst','wollt','wollte','wollten','gewollt'],
    mögen:['mag','magst','mochte','mochten','gemocht']
  };
  function tokens(str) {
    return String(str || '').normalize('NFC').toLocaleLowerCase('de-DE').match(/[\p{L}\p{M}]+/gu) || [];
  }
  function normalizeLemma(word, language) {
    const parts=tokens(word.lemma || word.term || word.german || '');
    if (!parts.length) return '';
    const ignored=language==='de'?new Set(['der','die','das','ein','eine','sich']):new Set(['a','an','the','to','de','het','een']);
    const significant=parts.filter(x=>!ignored.has(x));
    return significant.sort((a,b)=>b.length-a.length)[0]||parts[parts.length-1];
  }
  function regularVerbForms(infinitive) {
    const forms=new Set([infinitive]);
    if (infinitive.length<5) return forms;
    const stem=infinitive.endsWith('en')?infinitive.slice(0,-2):infinitive.endsWith('n')?infinitive.slice(0,-1):'';
    if (!stem || stem.length<3) return forms;
    ['e','st','t','en','et','te','test','ten','tet','end'].forEach(s=>forms.add(stem+s));
    forms.add('ge'+stem+'t');
    forms.add('ge'+stem+'et');
    forms.add('zu'+infinitive);
    return forms;
  }
  function germanVerbMatches(lemma, sentence) {
    const spoken=tokens(sentence);
    const words=new Set(spoken);
    const direct=regularVerbForms(lemma);
    for (const w of (irregular[lemma]||[])) direct.add(w);
    if ([...direct].some(w=>words.has(w))) return true;
    const particle=GermanParticles.find(p=>lemma.startsWith(p) && lemma.length>=p.length+4 && lemma.slice(p.length).length>=4);
    if (!particle) return false;
    const base=lemma.slice(particle.length);
    const baseForms=regularVerbForms(base);
    for (const w of (irregular[base]||[])) baseForms.add(w);
    for (const form of baseForms) {
      if (words.has(particle+form)) return true;
      if (form.startsWith('ge') && words.has(particle+form)) return true;
    }
    if (words.has(particle+'zu'+base)) return true;
    // Separable verbs (e.g., Ich stelle mich vor) must contain BOTH parts.
    // A bare 'stelle' without 'vor' never qualifies for 'vorstellen'.
    const particleIndices=spoken.flatMap((w,i)=>w===particle?[i]:[]);
    if (!particleIndices.length) return false;
    return spoken.some((w,i)=>baseForms.has(w) && particleIndices.some(j=>j>i && j-i<=12));
  }
  const irregularComparatives={
    gut:['besser','best'],
    schlecht:['schlechter','schlechtest'],
    groß:['größer','größt'],
    hoch:['höher','höchst'],
    viel:['mehr','meist'],
    nah:['näher','nächst'],
    gern:['lieber','liebst']
  };
  function germanMatches(lemma, pos, sentence, word) {
    const words=new Set(tokens(sentence));
    if (words.has(lemma)) return true;
    if (pos==='verb') return germanVerbMatches(lemma,sentence);
    if (lemma.length<3) return false;
    if (pos==='adjective') {
      const stems=[lemma,...(irregularComparatives[lemma]||[])];
      for (const stem of stems) {
        if (words.has(stem)) return true;
        for (const ending of ['e','en','em','er','es','ere','eren','erer','eres','ste','sten','stem','ster','stes']) {
          if (words.has(stem+ending)) return true;
        }
      }
      return false;
    }
    // Conservative noun inflections: exact lemma and normal case/plural suffixes.
    if (pos==='noun' || pos==='other') {
      // Prefer the actual dictionary plural over a guessed inflection.
      const plural=tokens(word?.plural).filter(x=>!['der','die','das'].includes(x)).at(-1);
      if (plural && words.has(plural)) return true;
      for (const ending of ['e','n','en','s','es','er','ern']) if (words.has(lemma+ending)) return true;
    }
    return false;
  }
  function otherLanguageMatches(lemma, language, sentence) {
    const words=new Set(tokens(sentence));
    if (words.has(lemma)) return true;
    if (lemma.length<4) return false;
    if (language==='en') {
      const forms=[lemma+'s',lemma+'es',lemma+'ed',lemma+'ing'];
      if (lemma.endsWith('e')) forms.push(lemma.slice(0,-1)+'ing',lemma+'d');
      if (lemma.endsWith('y')) forms.push(lemma.slice(0,-1)+'ies',lemma.slice(0,-1)+'ied');
      return forms.some(x=>words.has(x));
    }
    if (language==='nl') {
      return [lemma+'en',lemma+'s',lemma+'e',lemma+'de',lemma+'den',lemma+'t',lemma+'te',lemma+'ten',lemma+'d'].some(x=>words.has(x));
    }
    return false;
  }
  function relevant(word, sentence, language) {
    const lemma=normalizeLemma(word, language);
    if (!lemma || !sentence) return false;
    return language==='de'?germanMatches(lemma,word.pos||'other',sentence,word):otherLanguageMatches(lemma,language,sentence);
  }
  function curated(word, language, native) {
    if (language!=='de'||native!=='ar') return [];
    if (normalizeLemma(word,language)!=='vorstellen') return [];
    return [
      {de:'Ich möchte mich vorstellen.',ar:'أودّ أن أعرّف بنفسي.',source:'مثال تعليمي من كلمة'},
      {de:'Kannst du dir das vorstellen?',ar:'هل تستطيع أن تتخيّل ذلك؟',source:'مثال تعليمي من كلمة'},
      {de:'Ich stelle dir meinen Freund vor.',ar:'أعرّفك إلى صديقي.',source:'مثال تعليمي من كلمة'}
    ];
  }
  function filter(word, examples, target, native) {
    const original=Array.isArray(examples)?examples:[];
    const verified=original.filter(example=>example?.de&&example?.ar&&relevant(word,example.de,target));
    // Supply hand-reviewed examples only for a specific known-bad card.
    if(target==='de'&&native==='ar'&&normalizeLemma(word,target)==='vorstellen') {
      return curated(word,target,native);
    }
    // Correct corpus sentences always take priority. For entries whose corpus
    // examples are missing or mismatched, supply clearly attributed lessons.
    if(verified.length)return verified;
    return global.WORT_EXAMPLE_FALLBACK?.create(word,target,native)||[];
  }
  global.WORT_EXAMPLE_QUALITY=Object.freeze({relevant,filter});
})(globalThis);
