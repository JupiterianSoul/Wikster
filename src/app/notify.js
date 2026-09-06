/**
 * SYSTEM NOTIFICATIONS
 * ----------------------------------------------------------------------------
 * What reaches the player when the app is not on screen. Inside the Android
 * wrapper the page hands the line to WiksterNotify, a bridge to the system
 * shade; in a browser it uses the Notification API once the player has
 * allowed it from Settings. Neither is a push service: both work while the
 * page is alive in the background, which is where the live wire keeps
 * listening, and stop when the page is gone.
 *
 * Nothing here is raised while the app is on screen: the toast, the bell and
 * the badge already say it, and a second copy in the shade would be noise.
 */

const bridge = () => (typeof window !== 'undefined' ? window.WiksterNotify : null);

/** Whether the device runs inside the Android wrapper. */
export const inWrapper = () => Boolean(bridge()?.notify);

/** Where notifications stand: 'on', 'off' (refused), 'ask' (never asked), 'none' (no way at all). */
export function notifyState() {
  const b = bridge();
  if (b?.notify) { try { return b.enabled() ? 'on' : 'off'; } catch { return 'on'; } }
  if (typeof Notification === 'undefined') return 'none';
  return Notification.permission === 'granted' ? 'on' : Notification.permission === 'denied' ? 'off' : 'ask';
}

/** Asks for the permission; resolves to the state afterwards. */
export async function askNotify() {
  const b = bridge();
  if (b?.request) { try { b.request(); } catch { /* the wrapper refused */ } return notifyState(); }
  if (typeof Notification === 'undefined') return 'none';
  try { await Notification.requestPermission(); } catch { /* refused */ }
  return notifyState();
}

/** Whether a line should go to the shade right now: only when the app is away. */
export const shouldNotify = () => notifyState() === 'on' && document.visibilityState !== 'visible';

/**
 * One line in the shade. `tag` replaces an earlier line about the same
 * thing (one per conversation, one for the postbox) rather than stacking.
 * Returns whether anything was shown.
 */
export function systemNotify(title, body, tag = 'wikster') {
  const b = bridge();
  if (b?.notify) {
    try { b.notify(String(title ?? ''), String(body ?? ''), String(tag)); return true; } catch { return false; }
  }
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  try {
    const note = new Notification(String(title ?? ''), { body: String(body ?? ''), tag: String(tag), icon: 'icons/icon-192.png' });
    note.onclick = () => { try { window.focus(); } catch { /* no window to focus */ } note.close(); };
    return true;
  } catch {
    return false;
  }
}

/** Takes a line down: the thing it was about has been opened. */
export function clearNotify(tag = 'wikster') {
  const b = bridge();
  if (b?.clear) { try { b.clear(String(tag)); } catch { /* gone */ } }
}
