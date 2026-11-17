import { getToken } from "./lib/api";

// Colecciones que llegan en /api/bootstrap
export const COLLECTIONS = ["pillars", "goals", "habits", "habitLogs", "dailyLogs", "workouts", "focus", "journal",
  "funds", "transactions", "budgets", "investments", "apartment", "vision", "rewards", "xpEvents", "chat"];

export const initialStore = () => ({
  token: getToken(),
  user: null,
  ready: false,       // true cuando ya cargó el bootstrap
  streak: 0,
  aiReady: false,
  toasts: [],
  celebration: null,  // { title, subtitle, emoji } para el momento grande
  ...Object.fromEntries(COLLECTIONS.map((k) => [k, []])),
});

export default function storeReducer(store, action = {}) {
  const p = action.payload;
  switch (action.type) {
    case "auth":
      return { ...store, token: p.token, user: p.user, ready: false };
    case "logout":
      return { ...initialStore(), token: null };
    case "boot":
      return { ...store, ...p, ready: true };
    case "game": // respuesta de una acción con premio
      return {
        ...store,
        user: p.user || store.user,
        streak: p.streak ?? store.streak,
        xpEvents: p.events?.length ? [...[...p.events].reverse(), ...store.xpEvents] : store.xpEvents,
      };
    case "upsert": {
      const list = store[p.key];
      const exists = list.some((x) => x.id === p.item.id);
      return { ...store, [p.key]: exists ? list.map((x) => (x.id === p.item.id ? p.item : x)) : [p.item, ...list] };
    }
    case "remove":
      return { ...store, [p.key]: store[p.key].filter((x) => x.id !== p.id) };
    case "habit_log": {
      const rest = store.habitLogs.filter((l) => !(l.habit_id === p.habit_id && l.day === p.day));
      return { ...store, habitLogs: p.done ? [...rest, { habit_id: p.habit_id, day: p.day }] : rest };
    }
    case "set":
      return { ...store, [p.key]: p.value };
    case "toast":
      return { ...store, toasts: [...store.toasts, p] };
    case "toast_off":
      return { ...store, toasts: store.toasts.filter((t) => t.id !== p) };
    case "celebrate":
      return { ...store, celebration: p };
    default:
      throw Error("Unknown action: " + action.type);
  }
}
