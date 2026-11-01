German, English and Dutch speech engine bundled for Wort

meSpeak.js 2.0.7 (2020-04-23) by Norbert Landsteiner, mass:werk (2011–2020).
Based on speak.js by Alon Zakai and the eSpeak speech synthesizer by Jonathan Duddington and contributors.

The files mespeak.js, mespeak-core.js, and voices/de.json were downloaded unchanged from:
https://www.masswerk.at/mespeak/

Additional unmodified voice modules downloaded from the same upstream distribution:
https://www.masswerk.at/mespeak/voices/en/en-us.json (English, voice_id en/en-us)
https://www.masswerk.at/mespeak/voices/nl.json (Dutch, voice_id nl)
Both voice modules were verified to synthesize non-silent WAV audio with the bundled core.

Licence: GNU General Public License, version 3.
A copy is provided as COPYING.txt in this directory.

Official upstream source archive and documentation:
https://www.masswerk.at/mespeak/mespeak.zip
https://www.masswerk.at/mespeak/
https://github.com/kripken/speak.js
https://espeak.sourceforge.net/

Wort's audio.js controls playback, user-gesture unlocking, local speech rendering and optional device speech. Bundled German, English and Dutch voices render text locally. Arabic uses a matching device speech voice; no Arabic voice module is bundled. Device voice availability and processing depend on the browser and operating system. The app never substitutes a German voice when a requested language is unavailable.
