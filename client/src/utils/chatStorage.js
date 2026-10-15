const STORAGE_KEY = 'saved_chats';
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

/**
 * Loads all saved chats from localStorage, automatically filtering out
 * any chats unused for more than 1 month (30 days).
 *
 * @returns {Array<{ roomId: string, title?: string, lastUsed: number, createdAt: number }>}
 */
export function getSavedChats() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const chats = JSON.parse(raw);
    if (!Array.isArray(chats)) {
      return [];
    }

    const now = Date.now();
    // Filter out chats unused for more than a month
    const validChats = chats.filter(chat => {
      if (!chat || !chat.roomId) return false;
      const lastUsed = Number(chat.lastUsed) || Number(chat.createdAt) || 0;
      return now - lastUsed < ONE_MONTH_MS;
    });

    // If any expired chats were removed, update localStorage
    if (validChats.length !== chats.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validChats));
    }

    return validChats;
  } catch (err) {
    console.error('Failed to parse saved chats from localStorage:', err);
    return [];
  }
}

/**
 * Saves or updates a chat room in localStorage.
 *
 * @param {string} roomId
 * @param {string} [title]
 * @param {string} [username]
 * @returns {Array} Updated chats array
 */
export function saveChat(roomId, title, username) {
  if (!roomId || typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  const chats = getSavedChats();
  const now = Date.now();
  const existingIndex = chats.findIndex(c => c.roomId === roomId);

  if (existingIndex >= 0) {
    chats[existingIndex] = {
      ...chats[existingIndex],
      lastUsed: now,
      title: title || chats[existingIndex].title || `Room ${roomId.slice(0, 8)}...`,
      username: username || chats[existingIndex].username || undefined
    };
  } else {
    chats.unshift({
      roomId,
      title: title || `Room ${roomId.slice(0, 8)}...`,
      username: username || undefined,
      createdAt: now,
      lastUsed: now
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    localStorage.setItem('chatURL', roomId);
  } catch (err) {
    console.error('Failed to save chat to localStorage:', err);
  }

  return chats;
}

/**
 * Touches a chat room to refresh its lastUsed timestamp and optionally keep username updated.
 *
 * @param {string} roomId
 * @param {string} [username]
 */
export function touchChat(roomId, username) {
  if (!roomId) return;
  saveChat(roomId, undefined, username);
}

/**
 * Removes a chat room from localStorage.
 *
 * @param {string} roomId
 * @returns {Array} Updated chats array
 */
export function deleteSavedChat(roomId) {
  if (!roomId || typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  const chats = getSavedChats().filter(c => c.roomId !== roomId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    if (localStorage.getItem('chatURL') === roomId) {
      if (chats.length > 0) {
        localStorage.setItem('chatURL', chats[0].roomId);
      } else {
        localStorage.removeItem('chatURL');
      }
    }
  } catch (err) {
    console.error('Failed to delete chat from localStorage:', err);
  }

  return chats;
}
