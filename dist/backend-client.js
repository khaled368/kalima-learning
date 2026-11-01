/* Official pinned Supabase client; sessions belong to the SDK, never to progress backups. */
(function (global) {
  'use strict';
  const config = global.WORT_SUPABASE_CONFIG;
  global.WORT_SUPABASE = null;
  if (!config?.url || !config.publishableKey || typeof global.supabase?.createClient !== 'function') return;
  try {
    const storage = global.localStorage;
    const probe = 'kalima-auth-storage-probe';
    storage.setItem(probe, '1'); storage.removeItem(probe);
    const address = new URL(config.url);
    if (address.protocol !== 'https:' || !address.hostname.endsWith('.supabase.co')) return;
    global.WORT_SUPABASE = global.supabase.createClient(config.url, config.publishableKey, {
      auth: {
        storageKey: 'kalima-auth-v1',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit'
      }
    });
  } catch (_) {
    global.WORT_SUPABASE = null;
  }
})(window);
