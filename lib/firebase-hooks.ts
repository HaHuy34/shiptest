import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { DailySummary, WorkSession, Trip, AppSettings, Calculated } from "./db";

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getCurrentTimeStr() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

function calcValues(
  summary: DailySummary,
  sessions: WorkSession[],
  trips: Trip[],
): Calculated {
  const totalCost =
    (summary.fuelCost || 0) +
    (summary.foodCost || 0) +
    (summary.otherCost || 0);
  const profit = (summary.revenue || 0) - totalCost;

  let totalMinutes = 0;
  for (const s of sessions) {
    if (s.startTime && s.endTime) {
      const start = timeToMinutes(s.startTime);
      const end = timeToMinutes(s.endTime);
      let mins = end - start;
      if (mins < 0) mins += 24 * 60;
      totalMinutes += mins;
    }
  }
  const totalHours = totalMinutes / 60;
  const revenuePerHour =
    totalHours > 0 ? (summary.revenue || 0) / totalHours : 0;
  const profitPerHour = totalHours > 0 ? profit / totalHours : 0;

  const currentSession = sessions[sessions.length - 1] ?? null;

  // Tính doanh thu ca hiện tại theo sessionId
  let currentSessionRevenue = 0;
  if (currentSession?.id) {
    for (const t of trips) {
      if (t.sessionId === currentSession.id) {
        currentSessionRevenue += t.revenue;
      }
    }
  }

  const currentSessionTarget = currentSession?.targetRevenue || 0;
  const currentSessionPercent =
    currentSessionTarget > 0
      ? (currentSessionRevenue / currentSessionTarget) * 100
      : 0;

  const completionPercent =
    (summary.targetRevenue || 0) > 0
      ? (profit / (summary.targetRevenue || 1)) * 100
      : 0;

  return {
    totalCost,
    profit,
    totalHours,
    revenuePerHour,
    profitPerHour,
    completionPercent,
    currentSessionPercent,
    currentSessionRevenue,
    currentSessionTarget,
  };
}

function getUserId(): string | null {
  return auth.currentUser?.uid ?? "y0N3XEPvfDYZ7noikYJ8FGWHdQ43";
}

function summaryDocRef(uid: string, date: string) {
  return doc(db, "users", uid, "dailySummaries", date);
}

function sessionsColRef(uid: string, date: string) {
  return collection(db, "users", uid, "dailySummaries", date, "sessions");
}

function tripsColRef(uid: string, date: string) {
  return collection(db, "users", uid, "dailySummaries", date, "trips");
}

function settingsDocRef(uid: string) {
  return doc(db, "users", uid, "settings", "main");
}

const defaultSummary = (): DailySummary => ({
  date: "",
  revenue: 0,
  orders: 0,
  fuelCost: 0,
  foodCost: 0,
  otherCost: 0,
  targetRevenue: 0,
});

const defaultSettings = (): AppSettings => ({
  discordWebhook: "",
});

export function useAppletData(date: string) {
  const [summary, setSummary] = useState<DailySummary>(defaultSummary());
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  const calculated: Calculated = useMemo(
    () => calcValues(summary, sessions, trips),
    [summary, sessions, trips],
  );

  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;
    let cancelled = false;

    async function load() {
      try {
        const [snap, sessSnap, tripsSnap, setSnap] = await Promise.all([
          getDoc(summaryDocRef(uid!, date)),
          getDocs(
            query(sessionsColRef(uid!, date), orderBy("startTime", "asc")),
          ),
          getDocs(query(tripsColRef(uid!, date), orderBy("timestamp", "asc"))),
          getDoc(settingsDocRef(uid!)),
        ]);

        if (cancelled) return;

        startTransition(() => {
          setSummary(
            snap.exists()
              ? { ...defaultSummary(), ...(snap.data() as DailySummary), date }
              : { ...defaultSummary(), date },
          );
          setSessions(
            sessSnap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as WorkSession,
            ),
          );
          setTrips(
            tripsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Trip),
          );
          if (setSnap.exists()) {
            setSettings({
              ...defaultSettings(),
              ...(setSnap.data() as AppSettings),
            });
          }
          setIsLoading(false);
        });
      } catch {
        if (!cancelled) startTransition(() => setIsLoading(false));
      }
    }

    startTransition(() => setIsLoading(true));
    load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const updateSummary = useCallback(
    async (updates: Partial<DailySummary>) => {
      const uid = getUserId();
      if (!uid) return;
      startTransition(() => setSummary((prev) => ({ ...prev, ...updates })));
      const ref = summaryDocRef(uid, date);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { ...updates });
      } else {
        await setDoc(ref, { ...defaultSummary(), date, ...updates });
      }
    },
    [date],
  );

  const addTrip = useCallback(
    async (revenue: number) => {
      const uid = getUserId();
      if (!uid) return;

      const timestamp = getCurrentTimeStr();
      const currentSession = sessions[sessions.length - 1] ?? null;
      const sessionId = currentSession?.id ?? null;

      const ref = summaryDocRef(uid, date);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { ...defaultSummary(), date });
      }

      await updateDoc(summaryDocRef(uid, date), {
        revenue: (summary.revenue || 0) + revenue,
        orders: (summary.orders || 0) + 1,
      });

      const docRef = await addDoc(tripsColRef(uid, date), {
        revenue,
        timestamp,
        sessionId,
        date,
      });

      startTransition(() => {
        setSummary((prev) => ({
          ...prev,
          revenue: (prev.revenue || 0) + revenue,
          orders: (prev.orders || 0) + 1,
        }));
        setTrips((prev) => [
          ...prev,
          { id: docRef.id, revenue, timestamp, sessionId, date },
        ]);
      });
    },
    [date, summary.revenue, summary.orders, sessions],
  );

  const addSession = useCallback(
    async (startTime: string, endTime: string, targetRevenue: number) => {
      const uid = getUserId();
      if (!uid) return;

      const ref = summaryDocRef(uid, date);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { ...defaultSummary(), date });
      }

      const docRef = await addDoc(sessionsColRef(uid, date), {
        startTime,
        endTime,
        targetRevenue,
        date,
      });

      startTransition(() =>
        setSessions((prev) =>
          [
            ...prev,
            { id: docRef.id, startTime, endTime, targetRevenue, date },
          ].sort((a, b) => a.startTime.localeCompare(b.startTime)),
        ),
      );
    },
    [date],
  );

  const deleteSession = useCallback(
    async (id: string) => {
      const uid = getUserId();
      if (!uid) return;
      await deleteDoc(doc(sessionsColRef(uid, date), id));
      startTransition(() =>
        setSessions((prev) => prev.filter((s) => s.id !== id)),
      );
    },
    [date],
  );

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    const uid = getUserId();
    if (!uid) return;
    startTransition(() => setSettings(newSettings));
    await setDoc(settingsDocRef(uid), newSettings);
  }, []);

  return {
    summary,
    sessions,
    trips,
    settings,
    calculated,
    isLoading,
    updateSummary,
    addTrip,
    addSession,
    deleteSession,
    updateSettings,
  };
}

// ─── Hook thống kê 7 ngày ────────────────────────────────────────────────────

export interface DayStats {
  name: string;
  date: string;
  revenue: number;
  profit: number;
  orders: number;
  hours: number;
}

export function useWeeklyStats() {
  const [weekData, setWeekData] = useState<DayStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;

    let cancelled = false;

    async function load() {
      const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

      const promises = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        const dayName = dayNames[d.getDay()];

        return Promise.all([
          getDoc(summaryDocRef(uid!, dateStr)),
          getDocs(sessionsColRef(uid!, dateStr)),
        ])
          .then(([snap, sessSnap]) => {
            const s: DailySummary = snap.exists()
              ? { ...defaultSummary(), ...(snap.data() as DailySummary) }
              : defaultSummary();
            const sessions = sessSnap.docs.map((d) => d.data() as WorkSession);
            const calc = calcValues(s, sessions, []);
            return {
              name: dayName,
              date: dateStr,
              revenue: s.revenue || 0,
              profit: calc.profit,
              orders: s.orders || 0,
              hours: calc.totalHours,
            } as DayStats;
          })
          .catch(
            () =>
              ({
                name: dayName,
                date: dateStr,
                revenue: 0,
                profit: 0,
                orders: 0,
                hours: 0,
              }) as DayStats,
          );
      });

      const days = await Promise.all(promises);
      if (!cancelled) {
        startTransition(() => {
          setWeekData(days);
          setIsLoading(false);
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { weekData, isLoading };
}
