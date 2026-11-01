/* Email/password account UI. Auth sessions remain private to the SDK and this closure. */
(function(global){
 'use strict';
 if(global.WORT_ACCOUNT)return;
 const i18n=global.WORT_I18N;
 i18n?.add({"en":{"حسابي":"My account","حسابك":"Your account","تسجيل الدخول":"Sign in","إنشاء حساب":"Create account","تسجيل الخروج":"Sign out","الدخول إلى حسابك":"Sign in to your account","احفظ تقدّمك عبر أجهزتك":"Keep your progress across devices","البريد الإلكتروني":"Email address","كلمة المرور":"Password","تأكيد كلمة المرور":"Confirm password","أدخل بريدًا إلكترونيًا صحيحًا.":"Enter a valid email address.","أدخل كلمة المرور.":"Enter your password.","استخدم 8 أحرف على الأقل.":"Use at least 8 characters.","كلمتا المرور غير متطابقتين.":"The passwords do not match.","إظهار كلمة المرور":"Show password","إخفاء كلمة المرور":"Hide password","إظهار":"Show","إخفاء":"Hide","نسيت كلمة المرور؟":"Forgot password?","يمكنك التعلّم بدون حساب. تسجيل الدخول يربط تقدّمك بحسابك.":"You can learn without an account. Signing in links your progress to your account.","جارٍ تسجيل الدخول…":"Signing in…","جارٍ إنشاء الحساب…":"Creating account…","جارٍ تسجيل الخروج…":"Signing out…","البريد الإلكتروني أو كلمة المرور غير صحيحين.":"The email address or password is incorrect.","أكّد بريدك الإلكتروني قبل تسجيل الدخول.":"Confirm your email address before signing in.","تعذّر إتمام التسجيل بهذا البريد. جرّب تسجيل الدخول أو استعادة كلمة المرور.":"Registration could not be completed with this email. Try signing in or resetting your password.","اختر كلمة مرور أقوى من 8 أحرف على الأقل.":"Choose a stronger password with at least 8 characters.","محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.":"Too many attempts. Wait a moment and try again.","تعذّر الاتصال بخدمة الحساب. تحقّق من اتصالك وحاول مجددًا.":"The account service could not be reached. Check your connection and try again.","تعذّر إكمال العملية. حاول مجددًا.":"The operation could not be completed. Please try again.","إنشاء الحسابات غير متاح حاليًا.":"Account registration is currently unavailable.","هذا الحساب غير متاح حاليًا.":"This account is currently unavailable.","راجع بريدك الإلكتروني":"Check your email","إذا كان التسجيل متاحًا لهذا البريد، ستصلك رسالة تأكيد. راجع بريدك ومجلد الرسائل غير المرغوب فيها.":"If registration is available for this email, you will receive a confirmation link. Check your inbox and spam folder.","بعد تأكيد البريد، يمكنك العودة لتسجيل الدخول.":"After confirming your email, you can return to sign in.","العودة لتسجيل الدخول":"Back to sign in","استعادة كلمة المرور":"Reset password","أدخل بريدك لنرسل لك رابطًا لتعيين كلمة مرور جديدة.":"Enter your email to request a link for setting a new password.","إرسال رابط الاستعادة":"Send reset link","جارٍ إرسال الرابط…":"Sending link…","إذا وُجد حساب بهذا البريد، ستصلك رسالة لاستعادة كلمة المرور.":"If an account exists for this email, you will receive a password-reset message.","تعيين كلمة مرور جديدة":"Set a new password","اختر كلمة مرور جديدة لحسابك.":"Choose a new password for your account.","حفظ كلمة المرور":"Save password","جارٍ حفظ كلمة المرور…":"Saving password…","تم تغيير كلمة المرور.":"Your password has been changed.","رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.":"The recovery link is invalid or has expired. Request a new link.","اختر كلمة مرور مختلفة عن الحالية.":"Choose a password different from your current one.","أعد تسجيل الدخول ثم حاول مجددًا.":"Sign in again and try once more.","تم تأكيد البريد الإلكتروني":"Email address confirmed","جارٍ تجهيز بيانات الحساب…":"Preparing account data…","تعذّر تجهيز بيانات الحساب. حاول مجددًا.":"Account data could not be prepared. Please try again.","إعادة المحاولة":"Try again","تسجيل الدخول غير متاح حاليًا. يمكنك التعلّم بدون حساب.":"Sign-in is currently unavailable. You can keep learning without an account.","متابعة التعلّم":"Continue learning","التقدّم على هذا الجهاز":"Progress on this device","جارٍ مزامنة التقدّم…":"Syncing progress…","تمت مزامنة التقدّم":"Progress synced","غير متصل. ستُعاد محاولة المزامنة عند الاتصال.":"Offline. Sync will be retried when you reconnect.","تعذّرت المزامنة. حاول مجددًا بعد قليل.":"Sync failed. Please try again shortly.","المزامنة غير متاحة حاليًا.":"Sync is currently unavailable.","هناك تحديث للتقدّم جاهز للتطبيق.":"A progress update is ready to apply.","تطبيق التحديث":"Apply update","حفظ التقدّم قبل الخروج…":"Saving progress before signing out…","لا تُدخل كلمة المرور إلا في صفحة الحساب.":"Only enter your password in the account form.","إغلاق نافذة الحساب":"Close account window"},"nl":{"حسابي":"Mijn account","حسابك":"Je account","تسجيل الدخول":"Inloggen","إنشاء حساب":"Account maken","تسجيل الخروج":"Uitloggen","الدخول إلى حسابك":"Log in op je account","احفظ تقدّمك عبر أجهزتك":"Bewaar je voortgang op al je apparaten","البريد الإلكتروني":"E-mailadres","كلمة المرور":"Wachtwoord","تأكيد كلمة المرور":"Wachtwoord bevestigen","أدخل بريدًا إلكترونيًا صحيحًا.":"Vul een geldig e-mailadres in.","أدخل كلمة المرور.":"Vul je wachtwoord in.","استخدم 8 أحرف على الأقل.":"Gebruik minimaal 8 tekens.","كلمتا المرور غير متطابقتين.":"De wachtwoorden komen niet overeen.","إظهار كلمة المرور":"Wachtwoord tonen","إخفاء كلمة المرور":"Wachtwoord verbergen","إظهار":"Tonen","إخفاء":"Verbergen","نسيت كلمة المرور؟":"Wachtwoord vergeten?","يمكنك التعلّم بدون حساب. تسجيل الدخول يربط تقدّمك بحسابك.":"Je kunt zonder account leren. Door in te loggen koppel je je voortgang aan je account.","جارٍ تسجيل الدخول…":"Inloggen…","جارٍ إنشاء الحساب…":"Account maken…","جارٍ تسجيل الخروج…":"Uitloggen…","البريد الإلكتروني أو كلمة المرور غير صحيحين.":"Het e-mailadres of wachtwoord is onjuist.","أكّد بريدك الإلكتروني قبل تسجيل الدخول.":"Bevestig je e-mailadres voordat je inlogt.","تعذّر إتمام التسجيل بهذا البريد. جرّب تسجيل الدخول أو استعادة كلمة المرور.":"De registratie kon niet met dit e-mailadres worden voltooid. Probeer in te loggen of je wachtwoord te herstellen.","اختر كلمة مرور أقوى من 8 أحرف على الأقل.":"Kies een sterker wachtwoord van minimaal 8 tekens.","محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.":"Te veel pogingen. Wacht even en probeer het opnieuw.","تعذّر الاتصال بخدمة الحساب. تحقّق من اتصالك وحاول مجددًا.":"De accountdienst is niet bereikbaar. Controleer je verbinding en probeer het opnieuw.","تعذّر إكمال العملية. حاول مجددًا.":"De handeling kon niet worden voltooid. Probeer het opnieuw.","إنشاء الحسابات غير متاح حاليًا.":"Accountregistratie is momenteel niet beschikbaar.","هذا الحساب غير متاح حاليًا.":"Dit account is momenteel niet beschikbaar.","راجع بريدك الإلكتروني":"Controleer je e-mail","إذا كان التسجيل متاحًا لهذا البريد، ستصلك رسالة تأكيد. راجع بريدك ومجلد الرسائل غير المرغوب فيها.":"Als registratie met dit e-mailadres mogelijk is, ontvang je een bevestigingslink. Controleer je inbox en spammap.","بعد تأكيد البريد، يمكنك العودة لتسجيل الدخول.":"Na het bevestigen van je e-mail kun je terugkeren om in te loggen.","العودة لتسجيل الدخول":"Terug naar inloggen","استعادة كلمة المرور":"Wachtwoord herstellen","أدخل بريدك لنرسل لك رابطًا لتعيين كلمة مرور جديدة.":"Vul je e-mailadres in om een link voor een nieuw wachtwoord aan te vragen.","إرسال رابط الاستعادة":"Herstellink versturen","جارٍ إرسال الرابط…":"Link versturen…","إذا وُجد حساب بهذا البريد، ستصلك رسالة لاستعادة كلمة المرور.":"Als er een account met dit e-mailadres bestaat, ontvang je een bericht om je wachtwoord te herstellen.","تعيين كلمة مرور جديدة":"Nieuw wachtwoord instellen","اختر كلمة مرور جديدة لحسابك.":"Kies een nieuw wachtwoord voor je account.","حفظ كلمة المرور":"Wachtwoord opslaan","جارٍ حفظ كلمة المرور…":"Wachtwoord opslaan…","تم تغيير كلمة المرور.":"Je wachtwoord is gewijzigd.","رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.":"De herstellink is ongeldig of verlopen. Vraag een nieuwe link aan.","اختر كلمة مرور مختلفة عن الحالية.":"Kies een ander wachtwoord dan je huidige.","أعد تسجيل الدخول ثم حاول مجددًا.":"Log opnieuw in en probeer het nogmaals.","تم تأكيد البريد الإلكتروني":"E-mailadres bevestigd","جارٍ تجهيز بيانات الحساب…":"Accountgegevens voorbereiden…","تعذّر تجهيز بيانات الحساب. حاول مجددًا.":"De accountgegevens konden niet worden voorbereid. Probeer het opnieuw.","إعادة المحاولة":"Opnieuw proberen","تسجيل الدخول غير متاح حاليًا. يمكنك التعلّم بدون حساب.":"Inloggen is momenteel niet beschikbaar. Je kunt zonder account blijven leren.","متابعة التعلّم":"Verder leren","التقدّم على هذا الجهاز":"Voortgang op dit apparaat","جارٍ مزامنة التقدّم…":"Voortgang synchroniseren…","تمت مزامنة التقدّم":"Voortgang gesynchroniseerd","غير متصل. ستُعاد محاولة المزامنة عند الاتصال.":"Offline. Synchronisatie wordt opnieuw geprobeerd zodra je verbinding hebt.","تعذّرت المزامنة. حاول مجددًا بعد قليل.":"Synchroniseren is mislukt. Probeer het straks opnieuw.","المزامنة غير متاحة حاليًا.":"Synchronisatie is momenteel niet beschikbaar.","هناك تحديث للتقدّم جاهز للتطبيق.":"Er staat een voortgangsupdate klaar.","تطبيق التحديث":"Update toepassen","حفظ التقدّم قبل الخروج…":"Voortgang opslaan voor het uitloggen…","لا تُدخل كلمة المرور إلا في صفحة الحساب.":"Vul je wachtwoord alleen in het accountformulier in.","إغلاق نافذة الحساب":"Accountvenster sluiten"},"de":{"حسابي":"Mein Konto","حسابك":"Dein Konto","تسجيل الدخول":"Anmelden","إنشاء حساب":"Konto erstellen","تسجيل الخروج":"Abmelden","الدخول إلى حسابك":"Bei deinem Konto anmelden","احفظ تقدّمك عبر أجهزتك":"Behalte deinen Fortschritt auf allen Geräten","البريد الإلكتروني":"E-Mail-Adresse","كلمة المرور":"Passwort","تأكيد كلمة المرور":"Passwort bestätigen","أدخل بريدًا إلكترونيًا صحيحًا.":"Gib eine gültige E-Mail-Adresse ein.","أدخل كلمة المرور.":"Gib dein Passwort ein.","استخدم 8 أحرف على الأقل.":"Verwende mindestens 8 Zeichen.","كلمتا المرور غير متطابقتين.":"Die Passwörter stimmen nicht überein.","إظهار كلمة المرور":"Passwort anzeigen","إخفاء كلمة المرور":"Passwort ausblenden","إظهار":"Anzeigen","إخفاء":"Ausblenden","نسيت كلمة المرور؟":"Passwort vergessen?","يمكنك التعلّم بدون حساب. تسجيل الدخول يربط تقدّمك بحسابك.":"Du kannst ohne Konto lernen. Mit der Anmeldung verknüpfst du deinen Fortschritt mit deinem Konto.","جارٍ تسجيل الدخول…":"Anmeldung läuft …","جارٍ إنشاء الحساب…":"Konto wird erstellt …","جارٍ تسجيل الخروج…":"Abmeldung läuft …","البريد الإلكتروني أو كلمة المرور غير صحيحين.":"Die E-Mail-Adresse oder das Passwort ist falsch.","أكّد بريدك الإلكتروني قبل تسجيل الدخول.":"Bestätige deine E-Mail-Adresse vor der Anmeldung.","تعذّر إتمام التسجيل بهذا البريد. جرّب تسجيل الدخول أو استعادة كلمة المرور.":"Die Registrierung konnte mit dieser E-Mail-Adresse nicht abgeschlossen werden. Versuche die Anmeldung oder setze dein Passwort zurück.","اختر كلمة مرور أقوى من 8 أحرف على الأقل.":"Wähle ein stärkeres Passwort mit mindestens 8 Zeichen.","محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.":"Zu viele Versuche. Warte einen Moment und versuche es erneut.","تعذّر الاتصال بخدمة الحساب. تحقّق من اتصالك وحاول مجددًا.":"Der Kontodienst konnte nicht erreicht werden. Prüfe deine Verbindung und versuche es erneut.","تعذّر إكمال العملية. حاول مجددًا.":"Der Vorgang konnte nicht abgeschlossen werden. Versuche es erneut.","إنشاء الحسابات غير متاح حاليًا.":"Die Kontoerstellung ist derzeit nicht verfügbar.","هذا الحساب غير متاح حاليًا.":"Dieses Konto ist derzeit nicht verfügbar.","راجع بريدك الإلكتروني":"Prüfe dein E-Mail-Postfach","إذا كان التسجيل متاحًا لهذا البريد، ستصلك رسالة تأكيد. راجع بريدك ومجلد الرسائل غير المرغوب فيها.":"Wenn eine Registrierung mit dieser Adresse möglich ist, erhältst du einen Bestätigungslink. Prüfe dein Postfach und den Spamordner.","بعد تأكيد البريد، يمكنك العودة لتسجيل الدخول.":"Nach der E-Mail-Bestätigung kannst du dich hier anmelden.","العودة لتسجيل الدخول":"Zurück zur Anmeldung","استعادة كلمة المرور":"Passwort zurücksetzen","أدخل بريدك لنرسل لك رابطًا لتعيين كلمة مرور جديدة.":"Gib deine E-Mail-Adresse ein, um einen Link für ein neues Passwort anzufordern.","إرسال رابط الاستعادة":"Link zum Zurücksetzen senden","جارٍ إرسال الرابط…":"Link wird gesendet …","إذا وُجد حساب بهذا البريد، ستصلك رسالة لاستعادة كلمة المرور.":"Falls ein Konto für diese E-Mail-Adresse existiert, erhältst du eine Nachricht zum Zurücksetzen des Passworts.","تعيين كلمة مرور جديدة":"Neues Passwort festlegen","اختر كلمة مرور جديدة لحسابك.":"Wähle ein neues Passwort für dein Konto.","حفظ كلمة المرور":"Passwort speichern","جارٍ حفظ كلمة المرور…":"Passwort wird gespeichert …","تم تغيير كلمة المرور.":"Dein Passwort wurde geändert.","رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.":"Der Wiederherstellungslink ist ungültig oder abgelaufen. Fordere einen neuen Link an.","اختر كلمة مرور مختلفة عن الحالية.":"Wähle ein anderes Passwort als dein bisheriges.","أعد تسجيل الدخول ثم حاول مجددًا.":"Melde dich erneut an und versuche es noch einmal.","تم تأكيد البريد الإلكتروني":"E-Mail-Adresse bestätigt","جارٍ تجهيز بيانات الحساب…":"Kontodaten werden vorbereitet …","تعذّر تجهيز بيانات الحساب. حاول مجددًا.":"Die Kontodaten konnten nicht vorbereitet werden. Versuche es erneut.","إعادة المحاولة":"Erneut versuchen","تسجيل الدخول غير متاح حاليًا. يمكنك التعلّم بدون حساب.":"Die Anmeldung ist derzeit nicht verfügbar. Du kannst ohne Konto weiterlernen.","متابعة التعلّم":"Weiterlernen","التقدّم على هذا الجهاز":"Fortschritt auf diesem Gerät","جارٍ مزامنة التقدّم…":"Fortschritt wird synchronisiert …","تمت مزامنة التقدّم":"Fortschritt synchronisiert","غير متصل. ستُعاد محاولة المزامنة عند الاتصال.":"Offline. Die Synchronisierung wird bei erneuter Verbindung wiederholt.","تعذّرت المزامنة. حاول مجددًا بعد قليل.":"Die Synchronisierung ist fehlgeschlagen. Versuche es gleich erneut.","المزامنة غير متاحة حاليًا.":"Die Synchronisierung ist derzeit nicht verfügbar.","هناك تحديث للتقدّم جاهز للتطبيق.":"Eine Aktualisierung deines Fortschritts steht bereit.","تطبيق التحديث":"Aktualisierung übernehmen","حفظ التقدّم قبل الخروج…":"Fortschritt wird vor der Abmeldung gespeichert …","لا تُدخل كلمة المرور إلا في صفحة الحساب.":"Gib dein Passwort nur im Kontoformular ein.","إغلاق نافذة الحساب":"Kontofenster schließen"}});
 i18n?.add({en:{'متابعة بدون حساب':'Continue without account','تعذّر إرسال رسالة التأكيد إلى هذا البريد حاليًا. استخدم بريدًا آخر أو حاول لاحقًا.':'A confirmation email could not be sent to this address right now. Use another email address or try again later.'},nl:{'متابعة بدون حساب':'Doorgaan zonder account','تعذّر إرسال رسالة التأكيد إلى هذا البريد حاليًا. استخدم بريدًا آخر أو حاول لاحقًا.':'Er kan momenteel geen bevestigingsmail naar dit adres worden verstuurd. Gebruik een ander e-mailadres of probeer het later opnieuw.'},de:{'متابعة بدون حساب':'Ohne Konto fortfahren','تعذّر إرسال رسالة التأكيد إلى هذا البريد حاليًا. استخدم بريدًا آخر أو حاول لاحقًا.':'An diese Adresse konnte derzeit keine Bestätigungs-E-Mail gesendet werden. Verwende eine andere E-Mail-Adresse oder versuche es später erneut.'}});
 const t=(key,params)=>i18n?i18n.t(key,params):key;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const client=global.WORT_SUPABASE,config=global.WORT_SUPABASE_CONFIG||{};
 const enabled=Boolean(client?.auth)&&config.enabled!==false;
 const recoveryKey='kalima-account-recovery';
 const state={mode:'login',user:null,session:null,identity:undefined,identityReady:false,initialised:false,requestBusy:false,transitionBusy:false,reloading:false,error:'',notice:'',email:'',recovering:false,authFailure:false,sync:{state:'local',needsReload:false}};
 let dialog,body,cloud=null,cloudStarted=false,authSubscription=null,cloudUnsubscribe=null,disposed=false,authChain=Promise.resolve(),resolveReady;
 const ready=new Promise(resolve=>{resolveReady=resolve;});
 let readyResolved=false;
 const lockIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></svg>';
 const mailIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>';
 const cloudIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M7 18a5 5 0 0 1-1-10 7 7 0 0 1 13 2 4 4 0 0 1-1 8H7Z"/><path d="m9 13 2 2 4-4"/></svg>';
 function safeUser(user){return user?{id:String(user.id),email:typeof user.email==='string'?user.email:null,confirmed:Boolean(user.email_confirmed_at||user.confirmed_at)}:null;}
 function finishReady(){if(!readyResolved&&!state.reloading){readyResolved=true;resolveReady({enabled,user:safeUser(state.user)});}}
 function busy(){return state.requestBusy||state.transitionBusy||state.reloading;}
 function clearRecovery(){try{sessionStorage.removeItem(recoveryKey);}catch{}}
 function rememberRecovery(user){if(!user?.id)return;try{sessionStorage.setItem(recoveryKey,JSON.stringify({userId:user.id,at:Date.now()}));}catch{}}
 function rememberedRecovery(user){try{const record=JSON.parse(sessionStorage.getItem(recoveryKey)||'null');return Boolean(record&&record.userId===user?.id&&Date.now()-record.at<1800000);}catch{return false;}}
 function redirectUrl(){return config.redirectUrl||location.origin+location.pathname;}
 function errorText(error){
  const code=error?.code||'';
  if(['invalid_credentials','invalid_grant'].includes(code))return t('البريد الإلكتروني أو كلمة المرور غير صحيحين.');
  if(code==='email_not_confirmed')return t('أكّد بريدك الإلكتروني قبل تسجيل الدخول.');
  if(['user_already_exists','email_exists'].includes(code))return t('تعذّر إتمام التسجيل بهذا البريد. جرّب تسجيل الدخول أو استعادة كلمة المرور.');
  if(code==='weak_password')return t('اختر كلمة مرور أقوى من 8 أحرف على الأقل.');
  if(['over_email_send_rate_limit','over_request_rate_limit','over_sms_send_rate_limit'].includes(code)||error?.status===429)return t('محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.');
  if(code==='email_address_not_authorized')return t('تعذّر إرسال رسالة التأكيد إلى هذا البريد حاليًا. استخدم بريدًا آخر أو حاول لاحقًا.');
  if(code==='email_address_invalid')return t('أدخل بريدًا إلكترونيًا صحيحًا.');
  if(['otp_expired','flow_state_expired','flow_state_not_found'].includes(code))return t('رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.');
  if(code==='same_password')return t('اختر كلمة مرور مختلفة عن الحالية.');
  if(['reauthentication_needed','reauthentication_not_valid','session_not_found','bad_jwt'].includes(code))return t('أعد تسجيل الدخول ثم حاول مجددًا.');
  if(code==='signup_disabled')return t('إنشاء الحسابات غير متاح حاليًا.');
  if(code==='user_banned')return t('هذا الحساب غير متاح حاليًا.');
  if(error?.name==='TypeError'||/fetch|network|timeout/i.test(error?.name||'')||error?.status===0||error?.status>=500)return t('تعذّر الاتصال بخدمة الحساب. تحقّق من اتصالك وحاول مجددًا.');
  return t('تعذّر إكمال العملية. حاول مجددًا.');
 }
 function header(){
  const button=document.querySelector('#account-button');if(!button)return;
  const label=t(state.user?'حسابك':'حسابي'),inner=button.querySelector('[data-account-label]');
  if(inner)inner.textContent=label;else button.textContent=label;
  button.classList.toggle('is-authenticated',Boolean(state.user));button.setAttribute('aria-label',label);button.title=label;button.setAttribute('aria-controls','account-dialog');button.setAttribute('aria-busy',String(state.transitionBusy));
 }
 function updateBusy(){
  if(!dialog)return;
  dialog.setAttribute('aria-busy',String(busy()));
  for(const control of dialog.querySelectorAll('button,input'))control.disabled=busy()||Boolean(state.authFailure&&control.id==='account-close');
  const submit=body.querySelector('[data-account-submit]');
  if(submit)submit.textContent=t(state.requestBusy?(submit.dataset.busyLabel||submit.dataset.idleLabel):submit.dataset.idleLabel);
  header();
 }
 function messages(){
  if(!dialog)return;
  dialog.querySelector('#account-error').textContent=state.error;
  dialog.querySelector('#account-notice').textContent=state.notice;
 }
 function setError(message,field){state.error=message;state.notice='';messages();if(field){field.setAttribute('aria-invalid','true');field.focus();}}
 function syncText(){
  if(state.sync.needsReload)return t('هناك تحديث للتقدّم جاهز للتطبيق.');
  if(!cloud&&state.user)return t('المزامنة غير متاحة حاليًا.');
  return t({local:'التقدّم على هذا الجهاز',syncing:'جارٍ مزامنة التقدّم…',synced:'تمت مزامنة التقدّم',offline:'غير متصل. ستُعاد محاولة المزامنة عند الاتصال.',error:'تعذّرت المزامنة. حاول مجددًا بعد قليل.'}[state.sync.state]||'التقدّم على هذا الجهاز');
 }
 function updateSync(){const node=body?.querySelector('#account-sync');if(node){node.dataset.state=state.sync.state;node.querySelector('span').textContent=syncText();}const reload=body?.querySelector('#account-apply-update');if(reload)reload.hidden=!state.sync.needsReload;}
 function emailField(){return `<label class="account-field" for="account-email"><span>${esc(t('البريد الإلكتروني'))}</span><input id="account-email" name="email" type="email" autocomplete="${state.mode==='login'?'username':'email'}" inputmode="email" autocapitalize="none" spellcheck="false" required aria-required="true" value="${esc(state.email)}" aria-describedby="account-error"></label>`;}
 function passwordField(id,label,confirmation=false){
  const creating=state.mode==='signup'||state.mode==='recovery';
  return `<label class="account-field" for="${id}"><span>${esc(t(label))}</span><span class="account-password"><input id="${id}" name="${confirmation?'password-confirm':'password'}" type="password" autocomplete="${creating?'new-password':'current-password'}" ${creating?'minlength="8"':''} required aria-required="true" aria-describedby="account-error${creating&&!confirmation?' account-password-help':''}"><button type="button" data-account-toggle="${id}" aria-controls="${id}" aria-pressed="false" aria-label="${esc(t('إظهار كلمة المرور'))}">${esc(t('إظهار'))}</button></span></label>${creating&&!confirmation?`<p class="account-help" id="account-password-help">${esc(t('استخدم 8 أحرف على الأقل.'))}</p>`:''}`;
 }
 function submit(label,working){return `<button type="submit" class="account-submit" data-account-submit data-idle-label="${esc(label)}" data-busy-label="${esc(working)}">${esc(t(label))}</button>`;}
 function modeButton(mode,label){return `<button type="button" class="account-text-button" data-account-mode="${mode}">${esc(t(label))}</button>`;}
 function showDialog(){if(dialog&&!dialog.open)dialog.showModal();}
 function render(){
  if(!body)return;
  const mode=state.mode,title={login:'الدخول إلى حسابك',signup:'إنشاء حساب',forgot:'استعادة كلمة المرور',verify:'راجع بريدك الإلكتروني',recovery:'تعيين كلمة مرور جديدة',account:'حسابك',connection:'حسابي',unavailable:'حسابي'}[mode]||'حسابي';
  dialog.querySelector('#account-title').textContent=t(title);
  if(state.transitionBusy||state.reloading||(!state.initialised&&!state.authFailure&&enabled))body.innerHTML=`<div class="account-loading" role="status">${esc(t('جارٍ تجهيز بيانات الحساب…'))}</div>`;
  else if(!enabled||mode==='unavailable')body.innerHTML=`<p class="account-intro">${esc(t('تسجيل الدخول غير متاح حاليًا. يمكنك التعلّم بدون حساب.'))}</p><button type="button" class="account-submit" data-account-close>${esc(t('متابعة التعلّم'))}</button>`;
  else if(mode==='connection')body.innerHTML=`<p class="account-intro">${esc(t('تعذّر تجهيز بيانات الحساب. حاول مجددًا.'))}</p><button type="button" class="account-submit" data-account-retry>${esc(t('إعادة المحاولة'))}</button><div class="account-actions"><button type="button" class="account-text-button" data-account-guest>${esc(t('متابعة بدون حساب'))}</button></div>`;
  else if(mode==='account'){
   body.innerHTML=`<div class="account-card"><bdi class="account-email">${esc(state.user?.email||'')}</bdi>${state.user?.email_confirmed_at||state.user?.confirmed_at?`<span class="account-verified">✓ ${esc(t('تم تأكيد البريد الإلكتروني'))}</span>`:''}<div class="account-sync" id="account-sync" data-state="${esc(state.sync.state)}">${cloudIcon}<span>${esc(syncText())}</span></div><button type="button" class="account-text-button" id="account-apply-update" ${state.sync.needsReload?'':'hidden'}>${esc(t('تطبيق التحديث'))}</button></div><button type="button" class="account-signout" id="account-signout">${esc(t('تسجيل الخروج'))}</button>`;
  }else if(mode==='verify'){
   body.innerHTML=`<div class="account-status-icon" aria-hidden="true">${mailIcon}</div><p class="account-intro">${esc(t('إذا كان التسجيل متاحًا لهذا البريد، ستصلك رسالة تأكيد. راجع بريدك ومجلد الرسائل غير المرغوب فيها.'))}</p>${state.email?`<bdi class="account-email">${esc(state.email)}</bdi>`:''}<p class="account-intro">${esc(t('بعد تأكيد البريد، يمكنك العودة لتسجيل الدخول.'))}</p><div class="account-actions">${modeButton('login','العودة لتسجيل الدخول')}</div>`;
  }else if(mode==='forgot'){
   body.innerHTML=`<p class="account-intro">${esc(t('أدخل بريدك لنرسل لك رابطًا لتعيين كلمة مرور جديدة.'))}</p><form class="account-form" id="account-form" novalidate>${emailField()}${submit('إرسال رابط الاستعادة','جارٍ إرسال الرابط…')}</form><div class="account-actions">${modeButton('login','العودة لتسجيل الدخول')}</div>`;
  }else if(mode==='recovery'){
   body.innerHTML=`<p class="account-intro">${esc(t('اختر كلمة مرور جديدة لحسابك.'))}</p><form class="account-form" id="account-form" novalidate>${passwordField('account-password','كلمة المرور')}${passwordField('account-password-confirm','تأكيد كلمة المرور',true)}${submit('حفظ كلمة المرور','جارٍ حفظ كلمة المرور…')}</form>`;
  }else{
   const signup=mode==='signup';
   body.innerHTML=`<p class="account-intro">${esc(t('احفظ تقدّمك عبر أجهزتك'))}</p><div class="account-tabs" role="tablist" aria-label="${esc(t('تسجيل الدخول'))} / ${esc(t('إنشاء حساب'))}"><button id="account-tab-login" type="button" role="tab" aria-controls="account-form-panel" aria-selected="${!signup}" tabindex="${signup?-1:0}" data-account-mode="login">${esc(t('تسجيل الدخول'))}</button><button id="account-tab-signup" type="button" role="tab" aria-controls="account-form-panel" aria-selected="${signup}" tabindex="${signup?0:-1}" data-account-mode="signup">${esc(t('إنشاء حساب'))}</button></div><div id="account-form-panel" role="tabpanel" aria-labelledby="account-tab-${signup?'signup':'login'}"><form class="account-form" id="account-form" novalidate>${emailField()}${passwordField('account-password','كلمة المرور')}${signup?passwordField('account-password-confirm','تأكيد كلمة المرور',true):''}${submit(signup?'إنشاء حساب':'تسجيل الدخول',signup?'جارٍ إنشاء الحساب…':'جارٍ تسجيل الدخول…')}</form></div>${signup?'':`<div class="account-actions">${modeButton('forgot','نسيت كلمة المرور؟')}</div>`}<p class="account-local-note">${esc(t('يمكنك التعلّم بدون حساب. تسجيل الدخول يربط تقدّمك بحسابك.'))}</p>`;
  }
  messages();updateBusy();header();
 }
 function clearPasswordFields(){for(const input of dialog?.querySelectorAll('input[type="password"],input[data-password-field]')||[])input.value='';}
 function focusFirst(){body?.querySelector('input,button')?.focus({preventScroll:true});}
 function setMode(mode){
  if(busy())return;
  const email=body?.querySelector('#account-email');if(email)state.email=email.value.trim();
  state.mode=state.user&&!state.recovering?'account':mode;state.error='';state.notice='';render();focusFirst();
 }
 function open(mode){
  if(!dialog)return;
  if(!enabled)state.mode='unavailable';else if(state.authFailure)state.mode='connection';else if(state.recovering&&state.user)state.mode='recovery';else if(state.user)state.mode='account';else if(['login','signup','forgot'].includes(mode))state.mode=mode;
  render();showDialog();if(!busy())focusFirst();
 }
 function close(){if(busy()||state.authFailure)return;clearPasswordFields();dialog?.close();}
 function publicEvent(event,user){global.dispatchEvent(new CustomEvent('wort:account',{detail:{event,user:safeUser(user)}}));}
 function recoveryUrlError(){try{const hash=new URLSearchParams(location.hash.slice(1));return Boolean(hash.get('error')||hash.get('error_code'));}catch{return false;}}
 async function settleAuth(event,session){
  if(disposed)return {};
  if(state.reloading)return {reloading:true};
  const user=session?.user||null,id=user?.id||null;
  if(event==='PASSWORD_RECOVERY'&&user){state.recovering=true;rememberRecovery(user);}
  if((event==='INITIAL_SESSION'||event==='SIGNED_IN')&&rememberedRecovery(user))state.recovering=true;
  if(!user){state.recovering=false;clearRecovery();}
  const identityChanged=!state.identityReady||state.identity!==id;
  if(identityChanged){
   if(typeof global.cancelWordAdvance==='function')global.cancelWordAdvance();
   const previouslyReady=state.initialised;
   state.transitionBusy=true;state.authFailure=false;render();if(previouslyReady)showDialog();
   try{
    if(!global.WORT_CLOUD_SYNC?.create)throw new Error('account-storage-unavailable');
    if(!cloud){
     cloud=global.WORT_CLOUD_SYNC.create({client});
     cloudUnsubscribe=cloud.subscribe?.(snapshot=>{state.sync=snapshot||{state:'local'};updateSync();});
    }
    const result=cloud?await cloud.activate(user):{requiresReload:false,state:'local'};
    state.identity=id;state.identityReady=true;state.session=session;state.user=user;
    if(result?.requiresReload){if(state.recovering)rememberRecovery(user);state.reloading=true;render();showDialog();location.reload();return {reloading:true};}
    if(cloud&&!cloudStarted){cloud.start();cloudStarted=true;}
   }catch(error){state.transitionBusy=false;state.authFailure=true;state.mode='connection';state.error=t('تعذّر تجهيز بيانات الحساب. حاول مجددًا.');render();showDialog();return {error:true};}
   state.transitionBusy=false;
  }else{state.session=session;state.user=user;}
  state.initialised=true;state.authFailure=false;
  if(!user){if(identityChanged||['account','recovery','connection'].includes(state.mode)){state.mode='login';state.email='';}}
  else if(state.recovering)state.mode='recovery';else state.mode='account';
  if(state.recovering){render();showDialog();if(!busy())focusFirst();}
  else if(identityChanged||dialog?.open&&state.mode==='account')render();
  header();finishReady();publicEvent(event,user);
  return {user:safeUser(user)};
 }
 function queueAuth(event,session){const task=()=>settleAuth(event,session);const result=authChain.then(task,task);authChain=result.catch(()=>{});return result;}
 async function initialise(){
  if(!enabled){state.initialised=true;state.mode='unavailable';render();finishReady();return;}
  state.requestBusy=true;updateBusy();
  try{
   if(!authSubscription){const listener=client.auth.onAuthStateChange((event,session)=>{
    // Capture recovery before a pending initial bank activation can request a reload.
    if(event==='PASSWORD_RECOVERY'&&session?.user){state.recovering=true;rememberRecovery(session.user);}
    setTimeout(()=>{queueAuth(event,session).catch(()=>{});},0);
   });authSubscription=listener?.data?.subscription||null;}
   const result=await client.auth.getSession();if(result.error)throw result.error;
   const settled=await queueAuth('INITIAL_SESSION',result.data?.session||null);
   if(!settled?.reloading&&!state.user&&recoveryUrlError()){state.mode='forgot';state.error=t('رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.');render();showDialog();}
  }catch(error){state.authFailure=true;state.mode='connection';state.error=errorText(error);render();showDialog();}
  finally{state.requestBusy=false;if(!state.reloading){updateBusy();if(state.authFailure&&dialog?.open)focusFirst();}}
 }
 async function submitForm(event){
  event.preventDefault();if(busy()||!enabled)return;
  const mode=state.mode,emailInput=body.querySelector('#account-email'),passwordInput=body.querySelector('#account-password'),confirmation=body.querySelector('#account-password-confirm');
  state.error='';state.notice='';for(const field of body.querySelectorAll('[aria-invalid]'))field.removeAttribute('aria-invalid');messages();
  const email=emailInput?.value.trim()||'',password=passwordInput?.value||'';
  if(emailInput){state.email=email;if(!email||!emailInput.checkValidity()){setError(t('أدخل بريدًا إلكترونيًا صحيحًا.'),emailInput);return;}}
  if(mode!=='forgot'){
   if(!password){setError(t('أدخل كلمة المرور.'),passwordInput);return;}
   if((mode==='signup'||mode==='recovery')&&Array.from(password).length<8){setError(t('استخدم 8 أحرف على الأقل.'),passwordInput);return;}
   if(confirmation&&password!==confirmation.value){setError(t('كلمتا المرور غير متطابقتين.'),confirmation);return;}
  }
  state.requestBusy=true;updateBusy();
  try{
   if(mode==='login'){
    const result=await client.auth.signInWithPassword({email,password});if(result.error)throw result.error;
    if(!result.data?.session)throw new Error('missing-session');
    clearPasswordFields();await queueAuth('SIGNED_IN',result.data.session);
   }else if(mode==='signup'){
    const result=await client.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl()}});if(result.error)throw result.error;
    clearPasswordFields();
    if(result.data?.session)await queueAuth('SIGNED_IN',result.data.session);
    else{state.mode='verify';state.error='';state.notice='';render();}
   }else if(mode==='forgot'){
    const result=await client.auth.resetPasswordForEmail(email,{redirectTo:redirectUrl()});if(result.error)throw result.error;
    state.notice=t('إذا وُجد حساب بهذا البريد، ستصلك رسالة لاستعادة كلمة المرور.');messages();
   }else if(mode==='recovery'){
    if(!state.user||!state.session)throw {code:'session_not_found'};
    const result=await client.auth.updateUser({password});if(result.error)throw result.error;
    clearPasswordFields();clearRecovery();state.recovering=false;state.user=result.data?.user||state.user;state.mode='account';state.notice=t('تم تغيير كلمة المرور.');render();
   }
  }catch(error){setError(errorText(error));}
  finally{state.requestBusy=false;if(!state.reloading){updateBusy();messages();}}
 }
 async function signOut(){
  if(busy()||!enabled||!state.user)return;
  state.requestBusy=true;state.error='';state.notice=t('حفظ التقدّم قبل الخروج…');messages();updateBusy();
  try{
   try{await cloud?.flush?.();}catch{}
   state.notice=t('جارٍ تسجيل الخروج…');messages();
   const result=await client.auth.signOut({scope:'local'});if(result.error)throw result.error;
   clearRecovery();clearPasswordFields();await queueAuth('SIGNED_OUT',null);
  }catch(error){setError(errorText(error));}
  finally{state.requestBusy=false;if(!state.reloading){updateBusy();messages();}}
 }
 async function continueGuest(){
  if(busy()||!enabled)return;
  state.requestBusy=true;state.error='';state.notice='';messages();updateBusy();
  let completed=false;
  try{
   // Preserve pending account changes even when the network is unavailable.
   try{await cloud?.flush?.();}catch{}
   let signOutError=null;
   try{const result=await client.auth.signOut({scope:'local'});signOutError=result.error||null;}catch(error){signOutError=error;}
   // Never label an authenticated SDK session as a guest merely to unblock startup.
   const result=await client.auth.getSession();
   if(result.error)throw result.error;
   if(result.data?.session)throw signOutError||new Error('session-still-active');
   clearRecovery();clearPasswordFields();
   const settled=await queueAuth('SIGNED_OUT',null);
   completed=!settled.error&&!settled.reloading;
  }catch(error){state.authFailure=true;state.mode='connection';state.error=errorText(error);render();showDialog();}
  finally{state.requestBusy=false;if(!state.reloading){updateBusy();messages();if(completed)close();}}
 }
 function mount(){
  dialog=document.createElement('dialog');dialog.id='account-dialog';dialog.setAttribute('aria-labelledby','account-title');dialog.innerHTML=`<div class="account-heading"><div><p class="account-kicker">${lockIcon}<span>${esc(t('حسابي'))}</span></p><h2 id="account-title">${esc(t('حسابي'))}</h2></div><button type="button" id="account-close" aria-label="${esc(t('إغلاق نافذة الحساب'))}">×</button></div><div id="account-body"></div><p id="account-error" role="alert"></p><p id="account-notice" role="status" aria-live="polite"></p>`;document.body.append(dialog);body=dialog.querySelector('#account-body');
  // Move the existing real sun/moon switch out of the header and into Account.
  // Moving (rather than cloning) preserves its ID, click listener and saved state.
  const appearanceToggle=document.querySelector('#theme-toggle');
  if(appearanceToggle){
   const names={ar:'المظهر',en:'Appearance',de:'Darstellung',nl:'Weergave'};
   const appearance=document.createElement('div');
   appearance.className='account-appearance';
   const title=document.createElement('span');
   title.className='account-appearance-label';
   title.id='account-appearance-label';
   title.textContent=names[global.WORT_COURSE?.native]||names.ar;
   appearanceToggle.setAttribute('aria-labelledby','account-appearance-label');
   appearance.append(title,appearanceToggle);
   body.after(appearance);
  }
  dialog.addEventListener('cancel',event=>{if(busy()||state.authFailure)event.preventDefault();});dialog.addEventListener('close',()=>{clearPasswordFields();state.error='';state.notice='';});
  dialog.addEventListener('click',event=>{
   const button=event.target.closest('button');if(!button||busy())return;
   if(button.id==='account-close'||button.hasAttribute('data-account-close')){close();return;}
   if(button.hasAttribute('data-account-mode')){setMode(button.dataset.accountMode);return;}
   if(button.hasAttribute('data-account-toggle')){const input=body.querySelector('#'+button.dataset.accountToggle);if(!input)return;const show=input.type==='password';input.type=show?'text':'password';input.dataset.passwordField='true';button.textContent=t(show?'إخفاء':'إظهار');button.setAttribute('aria-label',t(show?'إخفاء كلمة المرور':'إظهار كلمة المرور'));button.setAttribute('aria-pressed',String(show));return;}
   if(button.id==='account-signout'){signOut();return;}
   if(button.hasAttribute('data-account-guest')){continueGuest();return;}
   if(button.hasAttribute('data-account-retry')){state.authFailure=false;state.error='';state.initialised=false;render();initialise();return;}
   if(button.id==='account-apply-update'){state.requestBusy=true;updateBusy();Promise.resolve(cloud?.flush?.()).catch(()=>{}).finally(()=>location.reload());}
  });
  dialog.addEventListener('submit',submitForm);
  dialog.addEventListener('keydown',event=>{const tab=event.target.closest('[role="tab"]');if(!tab||busy()||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const mode=event.key==='Home'?'login':event.key==='End'?'signup':state.mode==='login'?'signup':'login';setMode(mode);body.querySelector('#account-tab-'+mode)?.focus();});
  document.querySelector('#account-button')?.addEventListener('click',()=>open());render();header();initialise();
 }
 global.WORT_ACCOUNT=Object.freeze({ready,open,close,signOut,get user(){return safeUser(state.user);},get status(){return {enabled,authenticated:Boolean(state.user),busy:busy(),mode:state.mode,syncState:state.sync.state,needsReload:Boolean(state.sync.needsReload)};},get cloud(){return cloud;}});
 if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
})(window);
