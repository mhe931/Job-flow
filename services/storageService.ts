
import { UserProfile } from '../types';

const DB_NAME = 'jobflow_sqlite_mirror';

/**
 * Acts as the Data Access Layer (DAL) for the application.
 * In a native environment, these would be SQL queries to a SQLite DB.
 */
export const storage = {
  saveProfile: (profile: UserProfile) => {
    const db = storage.getDB();
    db[profile.uid] = profile;
    localStorage.setItem(DB_NAME, JSON.stringify(db));
  },

  getProfile: (uid: string): UserProfile | null => {
    const db = storage.getDB();
    return db[uid] || null;
  },

  getDB: (): Record<string, UserProfile> => {
    const raw = localStorage.getItem(DB_NAME);
    return raw ? JSON.parse(raw) : {};
  },

  deleteProfile: (uid: string) => {
    const db = storage.getDB();
    delete db[uid];
    localStorage.setItem(DB_NAME, JSON.stringify(db));
  }
};
