// localStorage adapter to match the window.storage API used in MISPortal
const storage = {
  get: (key) => {
    try {
      const value = localStorage.getItem(key);
      return Promise.resolve(value != null ? { value } : null);
    } catch {
      return Promise.resolve(null);
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return Promise.resolve();
    } catch {
      return Promise.resolve();
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return Promise.resolve();
    } catch {
      return Promise.resolve();
    }
  },
};

export default storage;
