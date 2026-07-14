// Singleton toast dispatcher — avoids stale ES module binding issues
let _dispatch = null;

export function registerToast(fn) {
  _dispatch = fn;
}

export function showToast(message, type = 'info') {
  if (_dispatch) {
    _dispatch(message, type);
  } else {
    // fallback before React mounts
    console.warn('[Toast]', type, message);
  }
}
