"use client";

import { useQuery } from "@tanstack/react-query";
import { startTransition, useEffect, useState, type ReactNode } from "react";
import {
  completionHistorySeed,
  initialProfile,
  initialProteinItems,
  initialRecords,
  initialRoutine,
  machineLibrary,
  tabItems,
} from "@/data/mock-data";
import {
  calculateDayCompletion,
  calculateExerciseCompletion,
  calculateStreak,
  formatPercent,
  getGrassColor,
  getProteinGoal,
  getWeeklyAverage,
} from "@/lib/calculations";
import {
  formatHeroDate,
  formatMiniDate,
  getCurrentWeekday,
  getTodayIsoDate,
  weekdayLabels,
  weekdayOrder,
  weekdayShortLabels,
} from "@/lib/date";
import { fetchMealForDay } from "@/lib/mock-api";
import type {
  DashboardTab,
  DayRoutine,
  ExercisePlan,
  ProteinItem,
  UserGoal,
  UserProfile,
  Weekday,
  WorkoutRecords,
} from "@/types";

const STORAGE_KEY = "gunyoil-shell-state-v4";

type OnboardingStep = "account" | "routine";
type AuthMode = "signup" | "login";
type AuthAccount = {
  email: string;
  password: string;
};

type PersistedShellState = {
  activeTab: DashboardTab;
  authAccount?: AuthAccount | null;
  extraProteinItems: ProteinItem[];
  hasCompletedOnboarding: boolean;
  isReminderEnabled: boolean;
  mealRatio: number;
  profile: UserProfile;
  records: WorkoutRecords;
  routine: DayRoutine[];
  selectedDay: Weekday;
};

type ProfileFieldUpdater = <Field extends keyof UserProfile>(
  field: Field,
  value: UserProfile[Field],
) => void;

type RecordField = "completedSets" | "completedReps" | "completedWeight";

const routineAreaPresets: Array<{
  theme: string;
  focus: string;
  exercises: Array<Omit<ExercisePlan, "id">>;
}> = [
  {
    theme: "가슴",
    focus: "가슴 중심",
    exercises: [
      { machine: "체스트 프레스", focus: "가슴", weight: 35, reps: 10, sets: 4 },
      { machine: "펙덱 플라이", focus: "가슴", weight: 20, reps: 12, sets: 3 },
      { machine: "케이블 크로스오버", focus: "가슴 상부", weight: 15, reps: 12, sets: 3 },
    ],
  },
  {
    theme: "등",
    focus: "등 중심",
    exercises: [
      { machine: "랫 풀다운", focus: "광배", weight: 40, reps: 10, sets: 4 },
      { machine: "시티드 로우", focus: "등 중앙", weight: 35, reps: 12, sets: 3 },
      { machine: "어시스트 풀업", focus: "등 상부", weight: 25, reps: 8, sets: 3 },
    ],
  },
  {
    theme: "하체",
    focus: "하체 중심",
    exercises: [
      { machine: "스쿼트 랙", focus: "대퇴사두", weight: 50, reps: 8, sets: 4 },
      { machine: "레그 프레스", focus: "하체 전체", weight: 100, reps: 12, sets: 4 },
      { machine: "레그 컬", focus: "햄스트링", weight: 35, reps: 12, sets: 3 },
    ],
  },
  {
    theme: "어깨",
    focus: "어깨 중심",
    exercises: [
      { machine: "숄더 프레스", focus: "전면삼각근", weight: 25, reps: 10, sets: 4 },
      { machine: "덤벨 숄더 프레스", focus: "측면", weight: 10, reps: 12, sets: 3 },
      { machine: "케이블 크로스오버", focus: "후면", weight: 10, reps: 15, sets: 3 },
    ],
  },
  {
    theme: "팔",
    focus: "이두 / 삼두",
    exercises: [
      { machine: "덤벨 컬", focus: "이두", weight: 8, reps: 12, sets: 3 },
      { machine: "케이블 푸시다운", focus: "삼두", weight: 18, reps: 12, sets: 3 },
      { machine: "덤벨 벤치", focus: "보조 자극", weight: 12, reps: 10, sets: 3 },
    ],
  },
  {
    theme: "유산소",
    focus: "가벼운 유산소",
    exercises: [
      { machine: "러닝머신 걷기", focus: "유산소", weight: 0, reps: 20, sets: 1 },
      { machine: "폼롤러", focus: "마무리", weight: 0, reps: 15, sets: 1 },
    ],
  },
  {
    theme: "전신",
    focus: "짧은 전신 루틴",
    exercises: [
      { machine: "스미스 머신", focus: "복합 운동", weight: 40, reps: 10, sets: 4 },
      { machine: "랫 풀다운", focus: "상체", weight: 35, reps: 10, sets: 3 },
      { machine: "레그 프레스", focus: "하체", weight: 90, reps: 15, sets: 3 },
    ],
  },
  {
    theme: "휴식",
    focus: "회복 중심",
    exercises: [
      { machine: "러닝머신 걷기", focus: "회복", weight: 0, reps: 20, sets: 1 },
      { machine: "폼롤러", focus: "가동성", weight: 0, reps: 15, sets: 1 },
    ],
  },
];

function findRoutine(routines: DayRoutine[], day: Weekday) {
  return routines.find((routine) => routine.day === day);
}

function chunkHistory<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function readNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function sanitizeProfile(value: unknown): UserProfile {
  if (!value || typeof value !== "object") {
    return initialProfile;
  }

  const source = value as Partial<Record<keyof UserProfile, unknown>>;

  return {
    name: typeof source.name === "string" ? source.name : initialProfile.name,
    email: typeof source.email === "string" ? source.email : initialProfile.email,
    gender: source.gender === "female" ? "female" : "male",
    height: readNumber(source.height, initialProfile.height),
    weight: readNumber(source.weight, initialProfile.weight),
    goal:
      source.goal === "cut" || source.goal === "maintenance" || source.goal === "bulk"
        ? source.goal
        : initialProfile.goal,
  };
}

function isDashboardTab(value: unknown): value is DashboardTab {
  return typeof value === "string" && tabItems.some((tab) => tab.id === value);
}

function isWeekday(value: unknown): value is Weekday {
  return typeof value === "string" && weekdayOrder.some((day) => day === value);
}

function getGoalLabel(goal: UserGoal) {
  switch (goal) {
    case "bulk":
      return "근육 증가";
    case "maintenance":
      return "체중 유지";
    default:
      return "체중 감량";
  }
}

function getGoalHint(goal: UserGoal) {
  switch (goal) {
    case "bulk":
      return "운동 강도와 섭취량을 함께 올립니다.";
    case "maintenance":
      return "지금 패턴을 안정적으로 유지합니다.";
    default:
      return "총 섭취량을 조절하며 기록합니다.";
  }
}

function getGenderLabel(gender: UserProfile["gender"]) {
  return gender === "female" ? "여학생" : "남학생";
}

function getRoutinePreset(theme: string) {
  return routineAreaPresets.find((preset) => preset.theme === theme) ?? routineAreaPresets[0];
}

function buildRoutineExercises(day: Weekday, theme: string) {
  return getRoutinePreset(theme).exercises.map((exercise, index) => ({
    ...exercise,
    id: `${day}-${index + 1}`,
  }));
}

function cloneRoutineExercises(day: Weekday, exercises: ExercisePlan[]) {
  return exercises.map((exercise, index) => ({
    ...exercise,
    id: `${day}-${index + 1}`,
  }));
}

function isConfiguredRoutineDay(routineDay?: DayRoutine): routineDay is DayRoutine {
  return Boolean(
    routineDay &&
      routineDay.theme.trim().length > 0 &&
      routineDay.exercises.length > 0 &&
      routineDay.exercises.every(
        (exercise) =>
          exercise.machine.trim().length > 0 &&
          Number.isFinite(exercise.weight) &&
          exercise.weight >= 0 &&
          exercise.reps > 0 &&
          exercise.sets > 0,
      ),
  );
}

function getAccountNameFromEmail(email: string) {
  return email.trim().split("@")[0] ?? "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function hasSpecialCharacter(value: string) {
  return /[^A-Za-z0-9]/.test(value);
}

function isValidSignupPassword(password: string) {
  return password.length >= 6 && hasSpecialCharacter(password);
}

function isRoutineConfigured(routines: DayRoutine[]) {
  return routines.every((routineDay) => isConfiguredRoutineDay(routineDay));
}

export function GunyoilShell() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("account");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [activeTab, setActiveTab] = useState<DashboardTab>("home");
  const [selectedDay, setSelectedDay] = useState<Weekday>(getCurrentWeekday());
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [routine, setRoutine] = useState<DayRoutine[]>(initialRoutine);
  const [records, setRecords] = useState<WorkoutRecords>(initialRecords);
  const [extraProteinItems, setExtraProteinItems] = useState<ProteinItem[]>(initialProteinItems);
  const [mealRatio, setMealRatio] = useState(0.85);
  const [isReminderEnabled, setIsReminderEnabled] = useState(true);
  const [newProteinName, setNewProteinName] = useState("");
  const [newProteinAmount, setNewProteinAmount] = useState("22");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [authAccount, setAuthAccount] = useState<AuthAccount | null>(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setHasHydrated(true);
        return;
      }

      const parsed = JSON.parse(stored) as Partial<PersistedShellState>;

      if (isDashboardTab(parsed.activeTab)) {
        setActiveTab(parsed.activeTab);
      }

      if (isWeekday(parsed.selectedDay)) {
        setSelectedDay(parsed.selectedDay);
      }

      if (parsed.profile) {
        setProfile(sanitizeProfile(parsed.profile));
      }

      if (Array.isArray(parsed.routine)) {
        setRoutine(parsed.routine as DayRoutine[]);
      }

      if (parsed.records && typeof parsed.records === "object") {
        setRecords(parsed.records as WorkoutRecords);
      }

      if (Array.isArray(parsed.extraProteinItems)) {
        setExtraProteinItems(parsed.extraProteinItems as ProteinItem[]);
      }

      if (typeof parsed.mealRatio === "number") {
        setMealRatio(parsed.mealRatio);
      }

      if (typeof parsed.isReminderEnabled === "boolean") {
        setIsReminderEnabled(parsed.isReminderEnabled);
      }

      if (typeof parsed.hasCompletedOnboarding === "boolean") {
        setHasCompletedOnboarding(parsed.hasCompletedOnboarding);
      }

      if (
        parsed.authAccount &&
        typeof parsed.authAccount.email === "string" &&
        typeof parsed.authAccount.password === "string"
      ) {
        setAuthAccount(parsed.authAccount);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const snapshot: PersistedShellState = {
      activeTab,
      authAccount,
      extraProteinItems,
      hasCompletedOnboarding,
      isReminderEnabled,
      mealRatio,
      profile,
      records,
      routine,
      selectedDay,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [
    activeTab,
    authAccount,
    extraProteinItems,
    hasCompletedOnboarding,
    hasHydrated,
    isReminderEnabled,
    mealRatio,
    profile,
    records,
    routine,
    selectedDay,
  ]);

  const currentDay = getCurrentWeekday();
  const currentDateLabel = formatHeroDate();
  const todayIsoDate = getTodayIsoDate();
  const focusRoutine = findRoutine(routine, selectedDay);
  const todayRoutine = findRoutine(routine, currentDay);
  const todayRecord = records[currentDay] ?? {};
  const todayCompletion = calculateDayCompletion(todayRoutine, todayRecord);
  const proteinGoal = getProteinGoal(profile.weight, profile.goal);
  const weeklyHistory = completionHistorySeed.map((entry) =>
    entry.date === todayIsoDate ? { ...entry, completion: todayCompletion } : entry,
  );
  const groupedHistory = chunkHistory(weeklyHistory, 7);
  const homeHistory = weeklyHistory.slice(-14);
  const streak = calculateStreak(weeklyHistory);
  const weeklyAverage = getWeeklyAverage(weeklyHistory);
  const mealQuery = useQuery({
    queryKey: ["meal", currentDay],
    queryFn: () => fetchMealForDay(currentDay),
  });
  const schoolProtein = mealQuery.data ? Math.round(mealQuery.data.estimatedProtein * mealRatio) : 0;
  const extraProtein = extraProteinItems.reduce((sum, item) => sum + item.grams, 0);
  const totalProtein = schoolProtein + extraProtein;
  const proteinProgress = proteinGoal > 0 ? Math.min(100, Math.round((totalProtein / proteinGoal) * 100)) : 0;
  const displayName = profile.name.trim() || getAccountNameFromEmail(profile.email) || "사용자";
  const activeTabLabel = tabItems.find((tab) => tab.id === activeTab)?.label ?? "홈";
  const completedMovements =
    todayRoutine?.exercises.filter((exercise) => calculateExerciseCompletion(exercise, todayRecord[exercise.id]) >= 60)
      .length ?? 0;
  const totalMovements = todayRoutine?.exercises.length ?? 0;
  const totalPlannedSets = todayRoutine?.exercises.reduce((sum, exercise) => sum + exercise.sets, 0) ?? 0;
  const canContinueSignup =
    isValidEmail(profile.email) &&
    isValidSignupPassword(signupPassword) &&
    signupPasswordConfirm.length >= 6 &&
    signupPassword === signupPasswordConfirm;
  const canLogin = isValidEmail(profile.email) && signupPassword.length >= 6;
  const canCompleteOnboarding = canContinueSignup && isRoutineConfigured(routine);
  const bottomNavItems = tabItems.filter(
    (tab) => tab.id === "routine" || tab.id === "grass" || tab.id === "protein" || tab.id === "profile",
  );

  const switchTab = (tab: DashboardTab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  const switchDay = (day: Weekday) => {
    startTransition(() => {
      setSelectedDay(day);
    });
  };

  const updateProfileField: ProfileFieldUpdater = (field, value) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateRoutineExercise = (
    day: Weekday,
    exerciseId: string,
    field: keyof ExercisePlan,
    value: string | number,
  ) => {
    setRoutine((previous) =>
      previous.map((routineDay) => {
        if (routineDay.day !== day) {
          return routineDay;
        }

        return {
          ...routineDay,
          exercises: routineDay.exercises.map((exercise) =>
            exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise,
          ),
        };
      }),
    );
  };

  const applyRoutinePreset = (day: Weekday, theme: string) => {
    const preset = getRoutinePreset(theme);

    setRoutine((previous) =>
      previous.map((routineDay) =>
        routineDay.day === day
          ? {
              ...routineDay,
              theme: preset.theme,
              focus: preset.focus,
              exercises: buildRoutineExercises(day, preset.theme),
            }
          : routineDay,
      ),
    );
  };

  const copyPreviousRoutineDay = (day: Weekday) => {
    const dayIndex = weekdayOrder.indexOf(day);

    if (dayIndex <= 0) {
      return;
    }

    const previousDay = weekdayOrder[dayIndex - 1];
    const previousRoutine = findRoutine(routine, previousDay);

    if (!isConfiguredRoutineDay(previousRoutine)) {
      return;
    }

    setRoutine((previous) =>
      previous.map((routineDay) =>
        routineDay.day === day
          ? {
              ...routineDay,
              theme: previousRoutine.theme,
              focus: previousRoutine.focus,
              exercises: cloneRoutineExercises(day, previousRoutine.exercises),
            }
          : routineDay,
      ),
    );
  };

  const resetRoutineSetup = () => {
    setRoutine((previous) =>
      previous.map((routineDay) => ({
        ...routineDay,
        theme: "",
        focus: "",
        exercises: [],
      })),
    );
    setSelectedDay("mon");
  };

  const addExerciseToDay = (day: Weekday) => {
    setRoutine((previous) =>
      previous.map((routineDay) => {
        if (routineDay.day !== day) {
          return routineDay;
        }

        const newId = `${day}-${routineDay.exercises.length + 1}`;

        return {
          ...routineDay,
          exercises: [
            ...routineDay.exercises,
            {
              id: newId,
              machine: machineLibrary[0],
              focus: "보완 운동",
              weight: 20,
              reps: 12,
              sets: 3,
            },
          ],
        };
      }),
    );
  };

  const removeExerciseFromDay = (day: Weekday, exerciseId: string) => {
    setRoutine((previous) =>
      previous.map((routineDay) => {
        if (routineDay.day !== day || routineDay.exercises.length <= 1) {
          return routineDay;
        }

        return {
          ...routineDay,
          exercises: routineDay.exercises.filter((exercise) => exercise.id !== exerciseId),
        };
      }),
    );
  };

  const updateWorkoutRecord = (day: Weekday, exerciseId: string, field: RecordField, value: number) => {
    setRecords((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        [exerciseId]: {
          completedSets: previous[day]?.[exerciseId]?.completedSets ?? 0,
          completedReps: previous[day]?.[exerciseId]?.completedReps ?? 0,
          completedWeight: previous[day]?.[exerciseId]?.completedWeight ?? 0,
          [field]: value,
        },
      },
    }));
  };

  const fillExerciseTarget = (exercise: ExercisePlan) => {
    setRecords((previous) => ({
      ...previous,
      [currentDay]: {
        ...previous[currentDay],
        [exercise.id]: {
          completedSets: exercise.sets,
          completedReps: exercise.reps,
          completedWeight: exercise.weight,
        },
      },
    }));
  };

  const addProteinItem = () => {
    const trimmedName = newProteinName.trim();
    const parsedAmount = Number(newProteinAmount);

    if (!trimmedName || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    setExtraProteinItems((previous) => [
      ...previous,
      {
        id: `${trimmedName}-${Date.now()}`,
        name: trimmedName,
        grams: parsedAmount,
      },
    ]);
    setNewProteinName("");
    setNewProteinAmount("22");
  };

  const removeProteinItem = (itemId: string) => {
    setExtraProteinItems((previous) => previous.filter((item) => item.id !== itemId));
  };

  const openRoutineForToday = () => {
    startTransition(() => {
      setSelectedDay(currentDay);
      setActiveTab("routine");
    });
  };

  const continueOnboarding = () => {
    if (!canContinueSignup) {
      return;
    }

    startTransition(() => {
      setAuthError("");
      setSelectedDay("mon");
      setOnboardingStep("routine");
    });
  };

  const returnToAccountOnboarding = () => {
    startTransition(() => {
      setOnboardingStep("account");
    });
  };

  const openLogin = () => {
    startTransition(() => {
      setAuthMode("login");
      setAuthError("");
      setSignupPassword("");
      setSignupPasswordConfirm("");
      setOnboardingStep("account");
    });
  };

  const openSignup = () => {
    startTransition(() => {
      setAuthMode("signup");
      setAuthError("");
      setSignupPassword("");
      setSignupPasswordConfirm("");
      setSelectedDay("mon");
      setOnboardingStep("account");
    });
  };

  const loginWithAccount = () => {
    if (!canLogin) {
      return;
    }

    if (!authAccount || authAccount.email !== profile.email.trim() || authAccount.password !== signupPassword) {
      setAuthError("이메일 또는 비밀번호를 확인해 주세요.");
      return;
    }

    const accountName = getAccountNameFromEmail(profile.email);

    startTransition(() => {
      setAuthError("");
      setProfile((previous) => ({
        ...previous,
        email: profile.email.trim(),
        name: previous.name.trim() || accountName || "사용자",
      }));
      setHasCompletedOnboarding(true);
      setSelectedDay(currentDay);
      setActiveTab("home");
    });
  };

  const completeOnboarding = () => {
    if (!canCompleteOnboarding) {
      return;
    }

    const accountName = getAccountNameFromEmail(profile.email);

    startTransition(() => {
      setAuthAccount({
        email: profile.email.trim(),
        password: signupPassword,
      });
      setAuthError("");
      setProfile((previous) => ({
        ...previous,
        email: profile.email.trim(),
        name: previous.name.trim() || accountName || "사용자",
      }));
      setHasCompletedOnboarding(true);
      setSelectedDay(currentDay);
      setActiveTab("home");
    });
  };

  const reopenOnboarding = () => {
    startTransition(() => {
      setAuthMode("signup");
      setOnboardingStep("account");
      setSelectedDay("mon");
      setSignupPassword("");
      setSignupPasswordConfirm("");
      setAuthError("");
      setHasCompletedOnboarding(false);
      setActiveTab("home");
    });
  };

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  if (!hasCompletedOnboarding) {
    return (
      <OnboardingScreen
        canComplete={canCompleteOnboarding}
        canGoNext={canContinueSignup}
        canLogin={canLogin}
        email={profile.email}
        machineOptions={machineLibrary}
        authError={authError}
        authMode={authMode}
        confirmPassword={signupPasswordConfirm}
        onAddExercise={addExerciseToDay}
        onApplyPreset={applyRoutinePreset}
        onBack={returnToAccountOnboarding}
        onComplete={completeOnboarding}
        onConfirmPasswordChange={setSignupPasswordConfirm}
        onCopyPreviousDay={copyPreviousRoutineDay}
        onEmailChange={(value) => updateProfileField("email", value)}
        onLogin={loginWithAccount}
        onNext={continueOnboarding}
        onPasswordChange={setSignupPassword}
        onRemoveExercise={removeExerciseFromDay}
        onResetRoutine={resetRoutineSetup}
        onSelectDay={switchDay}
        onShowLogin={openLogin}
        onShowSignup={openSignup}
        onUpdateExercise={updateRoutineExercise}
        password={signupPassword}
        routine={routine}
        selectedDay={selectedDay}
        step={onboardingStep}
      />
    );
  }

  return (
    <main className="min-h-screen pb-28 text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <header className="animate-rise flex flex-wrap items-start justify-between gap-4 px-1 pt-1">
          <div>
            <p className="text-sm font-semibold text-ember">{currentDateLabel}</p>
            <h1 className="mt-2 text-[2.1rem] leading-none text-ink">
              {activeTab === "home" ? "오늘 운동" : activeTabLabel}
            </h1>
            <p className="mt-2 text-sm text-ink/58">
              {activeTab === "home"
                ? `${displayName} · ${todayRoutine?.theme ?? "루틴 미설정"}`
                : `${displayName} 기준 화면`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTab !== "home" ? (
              <button className="secondary-button" onClick={() => switchTab("home")} type="button">
                홈
              </button>
            ) : null}
            <button className="secondary-button" onClick={reopenOnboarding} type="button">
              다시 입력
            </button>
          </div>
        </header>

        {activeTab === "home" && (
          <HomePanel
            completedMovements={completedMovements}
            currentDay={currentDay}
            homeHistory={homeHistory}
            isMealLoading={mealQuery.isLoading}
            mealItems={mealQuery.data?.items ?? []}
            mealTitle={mealQuery.data?.title ?? ""}
            onOpenGrass={() => switchTab("grass")}
            onOpenProtein={() => switchTab("protein")}
            onOpenRoutine={openRoutineForToday}
            onOpenToday={() => switchTab("today")}
            onOpenProfile={() => switchTab("profile")}
            proteinGoal={proteinGoal}
            proteinProgress={proteinProgress}
            schoolProtein={schoolProtein}
            streak={streak}
            todayCompletion={todayCompletion}
            todayRoutine={todayRoutine}
            totalProtein={totalProtein}
            totalMovements={totalMovements}
            totalPlannedSets={totalPlannedSets}
            weeklyAverage={weeklyAverage}
            isReminderEnabled={isReminderEnabled}
          />
        )}

        {activeTab === "today" && (
          <TodayPanel
            completedMovements={completedMovements}
            currentDay={currentDay}
            records={records}
            routine={todayRoutine}
            todayCompletion={todayCompletion}
            totalMovements={totalMovements}
            onFillTarget={fillExerciseTarget}
            onUpdateRecord={updateWorkoutRecord}
          />
        )}

        {activeTab === "routine" && (
          <RoutinePanel
            machineOptions={machineLibrary}
            onApplyPreset={applyRoutinePreset}
            routine={focusRoutine}
            selectedDay={selectedDay}
            onAddExercise={addExerciseToDay}
            onRemoveExercise={removeExerciseFromDay}
            onSelectDay={switchDay}
            onUpdateExercise={updateRoutineExercise}
          />
        )}

        {activeTab === "protein" && (
          <ProteinPanel
            currentDay={currentDay}
            extraProteinItems={extraProteinItems}
            isLoading={mealQuery.isLoading}
            mealItems={mealQuery.data?.items ?? []}
            mealNote={mealQuery.data?.note ?? ""}
            mealRatio={mealRatio}
            mealTitle={mealQuery.data?.title ?? ""}
            newProteinAmount={newProteinAmount}
            newProteinName={newProteinName}
            proteinGoal={proteinGoal}
            proteinProgress={proteinProgress}
            schoolProtein={schoolProtein}
            totalProtein={totalProtein}
            onAddProteinItem={addProteinItem}
            onMealRatioChange={setMealRatio}
            onNewProteinAmountChange={setNewProteinAmount}
            onNewProteinNameChange={setNewProteinName}
            onRemoveProteinItem={removeProteinItem}
          />
        )}

        {activeTab === "grass" && (
          <GrassPanel
            groupedHistory={groupedHistory}
            streak={streak}
            todayCompletion={todayCompletion}
            weeklyAverage={weeklyAverage}
          />
        )}

        {activeTab === "profile" && (
          <ProfilePanel
            isReminderEnabled={isReminderEnabled}
            profile={profile}
            proteinGoal={proteinGoal}
            totalProtein={totalProtein}
            todayCompletion={todayCompletion}
            weeklyAverage={weeklyAverage}
            onGoalChange={(goal) => updateProfileField("goal", goal)}
            onProfileChange={updateProfileField}
            onReminderToggle={() => setIsReminderEnabled((previous) => !previous)}
            onReopenOnboarding={reopenOnboarding}
          />
        )}
      </div>

      <BottomNavigation activeTab={activeTab} items={bottomNavItems} onSelect={switchTab} />
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-ink">
      <div className="panel max-w-md px-8 py-10 text-center animate-rise">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-moss/72">Gunyoil</p>
        <h1 className="mt-4 text-4xl font-display">기록을 불러오는 중</h1>
        <p className="mt-3 text-sm leading-6 text-ink/58">
          저장된 유저 정보와 운동 기록을 확인하고 있습니다.
        </p>
      </div>
    </main>
  );
}

type OnboardingScreenProps = {
  authError: string;
  authMode: AuthMode;
  canComplete: boolean;
  canGoNext: boolean;
  canLogin: boolean;
  confirmPassword: string;
  email: string;
  machineOptions: string[];
  onAddExercise: (day: Weekday) => void;
  onApplyPreset: (day: Weekday, theme: string) => void;
  onBack: () => void;
  onComplete: () => void;
  onConfirmPasswordChange: (value: string) => void;
  onCopyPreviousDay: (day: Weekday) => void;
  onEmailChange: (value: string) => void;
  onLogin: () => void;
  onNext: () => void;
  onPasswordChange: (value: string) => void;
  onRemoveExercise: (day: Weekday, exerciseId: string) => void;
  onResetRoutine: () => void;
  onSelectDay: (day: Weekday) => void;
  onShowLogin: () => void;
  onShowSignup: () => void;
  onUpdateExercise: (
    day: Weekday,
    exerciseId: string,
    field: keyof ExercisePlan,
    value: string | number,
  ) => void;
  password: string;
  routine: DayRoutine[];
  selectedDay: Weekday;
  step: OnboardingStep;
};

function OnboardingScreen({
  authError,
  authMode,
  canComplete,
  canGoNext,
  canLogin,
  confirmPassword,
  email,
  machineOptions,
  onAddExercise,
  onApplyPreset,
  onBack,
  onComplete,
  onConfirmPasswordChange,
  onCopyPreviousDay,
  onEmailChange,
  onLogin,
  onNext,
  onPasswordChange,
  onRemoveExercise,
  onResetRoutine,
  onSelectDay,
  onShowLogin,
  onShowSignup,
  onUpdateExercise,
  password,
  routine,
  selectedDay,
  step,
}: OnboardingScreenProps) {
  const emailError =
    authMode === "signup" && email.trim().length > 0 && !isValidEmail(email)
      ? "이메일 형식으로 입력해 주세요."
      : "";
  const passwordError =
    authMode === "signup" && password.length > 0 && !isValidSignupPassword(password)
      ? "비밀번호는 6자 이상, 특수문자를 포함해야 합니다."
      : "";
  const confirmPasswordError =
    authMode === "signup" &&
    confirmPassword.length > 0 &&
    password.length > 0 &&
    password !== confirmPassword
      ? "비밀번호가 일치하지 않습니다."
      : "";
  const selectedRoutine = findRoutine(routine, selectedDay);
  const configuredRoutines = routine.filter((routineDay) => isConfiguredRoutineDay(routineDay));
  const selectedDayIndex = weekdayOrder.indexOf(selectedDay);
  const previousDay = selectedDayIndex > 0 ? weekdayOrder[selectedDayIndex - 1] : null;
  const canCopyPreviousDay = previousDay ? isConfiguredRoutineDay(findRoutine(routine, previousDay)) : false;

  return (
    <main className="min-h-screen text-ink">
      <div
        className={`mx-auto flex min-h-screen w-full px-4 py-4 sm:px-6 ${
          step === "account" ? "max-w-xl items-center" : "max-w-[29rem] items-stretch"
        }`}
      >
        {step === "account" ? (
          <section className="panel animate-rise w-full">
            <div className="panel-body px-6 py-8 sm:px-8 sm:py-10">
              <div className="mx-auto max-w-md space-y-4">
                <h1 className="pb-2 text-center text-[2rem] font-display text-ink">
                  {authMode === "signup" ? "회원가입" : "로그인"}
                </h1>
                <div>
                  <input
                    aria-label="이메일"
                    aria-invalid={Boolean(emailError)}
                    autoComplete="email"
                    className="field"
                    onChange={(event) => onEmailChange(event.target.value)}
                    placeholder="이메일"
                    type="email"
                    value={email}
                  />
                  {emailError ? <p className="mt-2 text-sm font-medium text-clay">{emailError}</p> : null}
                </div>
                <div>
                  <input
                    aria-label="비밀번호"
                    aria-invalid={Boolean(passwordError)}
                    autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                    className="field"
                    minLength={6}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    placeholder="비밀번호"
                    type="password"
                    value={password}
                  />
                  {passwordError ? <p className="mt-2 text-sm font-medium text-clay">{passwordError}</p> : null}
                </div>
                {authMode === "signup" ? (
                  <div>
                    <input
                      aria-label="비밀번호 확인"
                      aria-invalid={Boolean(confirmPasswordError)}
                      autoComplete="new-password"
                      className="field"
                      minLength={6}
                      onChange={(event) => onConfirmPasswordChange(event.target.value)}
                      placeholder="비밀번호 확인"
                      type="password"
                      value={confirmPassword}
                    />
                    {confirmPasswordError ? (
                      <p className="mt-2 text-sm font-medium text-clay">{confirmPasswordError}</p>
                    ) : null}
                  </div>
                ) : null}

                <button
                  className={`inline-flex h-12 w-full items-center justify-center rounded-[18px] text-sm font-semibold transition ${
                    (authMode === "signup" ? canGoNext : canLogin)
                      ? "bg-moss text-white hover:bg-leaf"
                      : "bg-[#eef1f4] text-ember/50"
                  }`}
                  disabled={authMode === "signup" ? !canGoNext : !canLogin}
                  onClick={authMode === "signup" ? onNext : onLogin}
                  type="button"
                >
                  {authMode === "signup" ? "다음" : "로그인"}
                </button>
                {authError ? <p className="text-center text-sm font-medium text-clay">{authError}</p> : null}

                <p className="pt-2 text-center text-sm text-ink/58">
                  {authMode === "signup" ? "계정이 있다면? " : "계정이 없다면? "}
                  <button
                    className="font-semibold text-moss"
                    onClick={authMode === "signup" ? onShowLogin : onShowSignup}
                    type="button"
                  >
                    {authMode === "signup" ? "로그인" : "회원가입"}
                  </button>
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="animate-rise flex min-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-[32px] border border-line bg-white shadow-panel">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-ink">근요일</p>
                <span className="rounded-full bg-[#f2f4f6] px-3 py-1 text-sm font-semibold text-ember">2/2</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-6">
              <div>
                <h1 className="text-[2rem] font-display leading-[1.12] text-ink">주간 부위를 설정해요</h1>
                <p className="mt-3 text-sm leading-6 text-ink/48">
                  각 요일의 운동 부위를 선택하면 아래에서 머신을 정합니다
                </p>
              </div>

              <div className="mt-6 overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2">
                  {routine.map((routineDay) => {
                    const isActive = selectedDay === routineDay.day;
                    const isConfigured = isConfiguredRoutineDay(routineDay);

                    return (
                      <button
                        key={routineDay.day}
                        className={`flex min-w-[4.25rem] flex-col items-center rounded-[20px] border px-3 py-3 text-center transition ${
                          isActive
                            ? "border-moss bg-[#eef5ff] text-moss shadow-[0_10px_20px_-18px_rgba(49,130,246,0.9)]"
                            : "border-line bg-[#fbfcfd] text-ink/72 hover:border-moss/28"
                        }`}
                        onClick={() => onSelectDay(routineDay.day)}
                        type="button"
                      >
                        <span className="text-sm font-semibold">{routineDay.shortLabel}</span>
                        <span className={`mt-1 text-[0.72rem] font-medium ${isActive ? "text-moss/82" : "text-ink/38"}`}>
                          {isConfigured ? routineDay.theme : "미설정"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">운동 부위 선택</p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {routineAreaPresets.map((preset) => (
                    <button
                      key={preset.theme}
                      className={`rounded-[18px] border px-3 py-4 text-sm font-semibold transition ${
                        selectedRoutine?.theme === preset.theme
                          ? "border-moss bg-[#eef5ff] text-moss"
                          : "border-line bg-white text-ink/82 hover:border-moss/28 hover:bg-[#fafcff]"
                      }`}
                      onClick={() => onApplyPreset(selectedDay, preset.theme)}
                      type="button"
                    >
                      {preset.theme}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  className={`inline-flex h-12 items-center justify-center rounded-[18px] border text-sm font-semibold transition ${
                    canCopyPreviousDay
                      ? "border-line bg-[#f8fafc] text-ink hover:border-moss/28"
                      : "border-line bg-[#f4f6f8] text-ink/34"
                  }`}
                  disabled={!canCopyPreviousDay}
                  onClick={() => onCopyPreviousDay(selectedDay)}
                  type="button"
                >
                  이전 요일 복사
                </button>
                <button
                  className="inline-flex h-12 items-center justify-center rounded-[18px] border border-line bg-[#f8fafc] text-sm font-semibold text-ink transition hover:border-clay/35 hover:text-clay"
                  onClick={onResetRoutine}
                  type="button"
                >
                  전체 초기화
                </button>
              </div>

              <div className="mt-4 rounded-[24px] border border-line bg-[#fbfcfd] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">설정된 주간 루틴</p>
                  <span className="text-sm font-semibold text-ink/48">{configuredRoutines.length}/7</span>
                </div>
                {configuredRoutines.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {configuredRoutines.map((routineDay) => (
                      <div
                        key={routineDay.day}
                        className="flex items-center justify-between rounded-[16px] bg-white px-4 py-3"
                      >
                        <span className="text-sm font-semibold text-ink">{routineDay.label}</span>
                        <span className="text-sm text-ink/56">{routineDay.theme}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-ink/44">운동 요일을 선택해주세요</p>
                )}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ember">{weekdayLabels[selectedDay]}</p>
                    <h2 className="mt-1 text-[1.45rem] font-display text-ink">
                      {selectedRoutine?.theme || "운동 설정"}
                    </h2>
                  </div>
                  <button
                    className={`inline-flex h-11 items-center justify-center rounded-[16px] px-4 text-sm font-semibold transition ${
                      selectedRoutine?.theme
                        ? "bg-moss text-white hover:bg-leaf"
                        : "bg-[#eef1f4] text-ember/50"
                    }`}
                    disabled={!selectedRoutine?.theme}
                    onClick={() => onAddExercise(selectedDay)}
                    type="button"
                  >
                    운동 추가
                  </button>
                </div>

                {selectedRoutine && isConfiguredRoutineDay(selectedRoutine) ? (
                  <div className="mt-4 space-y-3">
                    {selectedRoutine.exercises.map((exercise) => (
                      <div key={exercise.id} className="rounded-[24px] border border-line bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">{exercise.focus}</p>
                            <p className="mt-1 text-xs text-ink/44">{weekdayLabels[selectedDay]} 운동 설정</p>
                          </div>
                          <button
                            className="text-sm font-semibold text-clay"
                            onClick={() => onRemoveExercise(selectedDay, exercise.id)}
                            type="button"
                          >
                            삭제
                          </button>
                        </div>

                        <div className="mt-3 grid gap-3">
                          <FieldWrapper label="머신 / 덤벨">
                            <select
                              className="field"
                              onChange={(event) => onUpdateExercise(selectedDay, exercise.id, "machine", event.target.value)}
                              value={exercise.machine}
                            >
                              {machineOptions.map((machine) => (
                                <option key={machine} value={machine}>
                                  {machine}
                                </option>
                              ))}
                            </select>
                          </FieldWrapper>

                          <div className="grid grid-cols-3 gap-3">
                            <FieldWrapper label="kg">
                              <input
                                className="field"
                                min={0}
                                onChange={(event) =>
                                  onUpdateExercise(selectedDay, exercise.id, "weight", Number(event.target.value))
                                }
                                type="number"
                                value={exercise.weight}
                              />
                            </FieldWrapper>
                            <FieldWrapper label="횟수">
                              <input
                                className="field"
                                min={1}
                                onChange={(event) =>
                                  onUpdateExercise(selectedDay, exercise.id, "reps", Number(event.target.value))
                                }
                                type="number"
                                value={exercise.reps}
                              />
                            </FieldWrapper>
                            <FieldWrapper label="세트">
                              <input
                                className="field"
                                min={1}
                                onChange={(event) =>
                                  onUpdateExercise(selectedDay, exercise.id, "sets", Number(event.target.value))
                                }
                                type="number"
                                value={exercise.sets}
                              />
                            </FieldWrapper>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[24px] border border-dashed border-line bg-[#fbfcfd] px-4 py-8 text-center">
                    <p className="text-sm font-medium text-ink/44">운동 부위를 먼저 선택해주세요</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-line bg-white/96 px-5 py-4">
              <p className="mb-3 text-center text-sm font-semibold text-ink/40">
                {configuredRoutines.length}일 운동 설정됨
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button className="secondary-button w-full" onClick={onBack} type="button">
                  이전
                </button>
                <button
                  className={`inline-flex h-12 w-full items-center justify-center rounded-[18px] text-sm font-semibold transition ${
                    canComplete ? "bg-moss text-white hover:bg-leaf" : "bg-[#eef1f4] text-ember/50"
                  }`}
                  disabled={!canComplete}
                  onClick={onComplete}
                  type="button"
                >
                  홈으로 이동
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

type HomePanelProps = {
  completedMovements: number;
  currentDay: Weekday;
  homeHistory: Array<{ date: string; completion: number }>;
  isMealLoading: boolean;
  isReminderEnabled: boolean;
  mealItems: string[];
  mealTitle: string;
  onOpenGrass: () => void;
  onOpenProfile: () => void;
  onOpenProtein: () => void;
  onOpenRoutine: () => void;
  onOpenToday: () => void;
  proteinGoal: number;
  proteinProgress: number;
  schoolProtein: number;
  streak: number;
  todayCompletion: number;
  todayRoutine?: DayRoutine;
  totalProtein: number;
  totalMovements: number;
  totalPlannedSets: number;
  weeklyAverage: number;
};

function HomePanel({
  completedMovements,
  currentDay,
  homeHistory,
  isMealLoading,
  isReminderEnabled,
  mealItems,
  mealTitle,
  onOpenGrass,
  onOpenProfile,
  onOpenProtein,
  onOpenRoutine,
  onOpenToday,
  proteinGoal,
  proteinProgress,
  schoolProtein,
  streak,
  todayCompletion,
  todayRoutine,
  totalProtein,
  totalMovements,
  totalPlannedSets,
  weeklyAverage,
}: HomePanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <section className="panel animate-rise">
          <div className="panel-body">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">오늘 루틴</p>
                <h2 className="mt-3 text-[2.2rem] leading-tight text-ink">
                  {todayRoutine?.theme ?? "오늘 루틴 없음"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink/58">
                  {todayRoutine?.focus ?? "루틴을 먼저 설정하세요."}
                </p>
              </div>
              <span className="rounded-full bg-moss/10 px-4 py-3 text-sm font-semibold text-moss">
                {formatPercent(todayCompletion)}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MetricCard helper="완료 동작" label="동작" value={`${completedMovements}/${totalMovements || 0}`} />
              <MetricCard helper="오늘 계획" label="세트 수" value={`${totalPlannedSets}세트`} />
              <MetricCard helper={`목표 ${proteinGoal}g`} label="단백질" value={`${totalProtein}g`} />
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${todayCompletion}%` }} />
            </div>

            <div className="mt-6 space-y-3">
              {(todayRoutine?.exercises ?? []).slice(0, 3).map((exercise) => (
                <ExerciseListRow
                  key={exercise.id}
                  description={`${exercise.sets}세트 · ${exercise.reps}회 · ${exercise.weight}kg`}
                  label={exercise.machine}
                  meta={exercise.focus}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="primary-button" onClick={onOpenToday} type="button">
                오늘 기록 이어서
              </button>
              <button className="secondary-button" onClick={onOpenRoutine} type="button">
                루틴 상세 보기
              </button>
            </div>
          </div>
        </section>

        <section className="panel animate-rise">
          <div className="panel-body">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">최근 기록</p>
                <h3 className="mt-3 text-2xl text-ink">최근 2주 기록</h3>
              </div>
              <Badge>{streak}일</Badge>
            </div>
            <div className="mt-6 grid max-w-[22rem] grid-cols-7 gap-2">
              {homeHistory.map((entry) => (
                <div key={entry.date} className="flex flex-col items-center gap-2">
                  <div
                    className="h-9 w-9 rounded-[10px] border border-black/5"
                    style={{ backgroundColor: getGrassColor(entry.completion) }}
                    title={`${formatMiniDate(entry.date)} · ${entry.completion}%`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <MetricCard helper="최근 7일 평균" label="주간 이행률" value={formatPercent(weeklyAverage)} />
              <MetricCard helper="상세 화면으로 이동" label="상세 탭" value="기록 · 루틴" />
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <section className="animate-rise overflow-hidden rounded-[28px] border border-moss/10 bg-[linear-gradient(180deg,#3182f6,#1b64da)] p-5 text-white shadow-panel">
          <p className="text-xs uppercase tracking-[0.24em] text-white/68">Protein</p>
          <p className="mt-3 text-4xl font-display">{totalProtein}g</p>
          <p className="mt-2 text-sm text-white/70">
            {isMealLoading ? "급식 불러오는 중" : mealTitle || `목표 ${proteinGoal}g`}
          </p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-white/90 transition-all" style={{ width: `${proteinProgress}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-white/72">
            <span>급식 반영 {schoolProtein}g</span>
            <span>{proteinProgress}%</span>
          </div>
          <button className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[18px] bg-white text-sm font-semibold text-moss transition hover:bg-[#eef5ff]" onClick={onOpenProtein} type="button">
            단백질 상세 보기
          </button>
        </section>

        <section className="panel animate-rise">
          <div className="panel-body">
            <p className="eyebrow">바로 가기</p>
            <div className="mt-4 space-y-3">
              <QuickMoveButton
                description={`${todayRoutine?.theme ?? "오늘 루틴"} 입력`}
                label="오늘 기록"
                onClick={onOpenToday}
              />
              <QuickMoveButton
                description={`${weekdayLabels[currentDay]} 편집`}
                label="루틴 편집"
                onClick={onOpenRoutine}
              />
              <QuickMoveButton
                description={`연속 ${streak}일`}
                label="잔디 보기"
                onClick={onOpenGrass}
              />
              <QuickMoveButton
                description={`알림 ${isReminderEnabled ? "켜짐" : "꺼짐"}`}
                label="내 정보"
                onClick={onOpenProfile}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

type TodayPanelProps = {
  completedMovements: number;
  currentDay: Weekday;
  records: WorkoutRecords;
  routine?: DayRoutine;
  todayCompletion: number;
  totalMovements: number;
  onFillTarget: (exercise: ExercisePlan) => void;
  onUpdateRecord: (day: Weekday, exerciseId: string, field: RecordField, value: number) => void;
};

function TodayPanel({
  completedMovements,
  currentDay,
  records,
  routine,
  todayCompletion,
  totalMovements,
  onFillTarget,
  onUpdateRecord,
}: TodayPanelProps) {
  const dayRecords = records[currentDay] ?? {};

  return (
    <section className="panel animate-rise">
      <div className="panel-body">
        <SectionHeader eyebrow="기록" title={`${weekdayLabels[currentDay]} 루틴 기록`} />

        <div className="mt-6 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-moss/12 bg-[linear-gradient(180deg,#3182f6,#1b64da)] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-white/55">오늘 달성률</p>
              <p className="mt-4 text-5xl font-display">{formatPercent(todayCompletion)}</p>
              <p className="mt-3 text-sm leading-6 text-white/68">
                {completedMovements}/{totalMovements || 0} 동작이 목표의 60% 이상 수행되었습니다.
              </p>
            </div>

            <div className="rounded-[24px] border border-line bg-white p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-ink/46">오늘 루틴</p>
              <p className="mt-3 text-2xl font-display text-ink">{routine?.theme ?? "오늘 루틴 없음"}</p>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                {routine?.focus ?? "루틴을 설정하면 오늘 기록 화면이 자동으로 채워집니다."}
              </p>
            </div>

            <div className="rounded-[24px] border border-line bg-white p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-ink/46">빠른 입력</p>
              <p className="mt-3 text-sm leading-6 text-ink/64">각 카드에서 목표만큼 입력으로 계획값을 바로 채울 수 있습니다.</p>
            </div>
          </div>

          <div className="space-y-4">
            {(routine?.exercises ?? []).map((exercise) => {
              const currentRecord = dayRecords[exercise.id];
              const completion = calculateExerciseCompletion(exercise, currentRecord);

              return (
                <div key={exercise.id} className="rounded-[24px] border border-line bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-ink">{exercise.machine}</p>
                      <p className="text-sm text-ink/58">
                        목표 {exercise.sets}세트 / {exercise.reps}회 / {exercise.weight}kg
                      </p>
                    </div>
                    <button className="secondary-button" onClick={() => onFillTarget(exercise)} type="button">
                      목표만큼 입력
                    </button>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-mist">
                    <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${completion}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-ink/58">
                    <span>{exercise.focus}</span>
                    <span className="font-semibold text-moss">{formatPercent(completion)}</span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <FieldWrapper label="실제 세트">
                      <input
                        className="field"
                        min={0}
                        onChange={(event) =>
                          onUpdateRecord(currentDay, exercise.id, "completedSets", Number(event.target.value))
                        }
                        type="number"
                        value={currentRecord?.completedSets ?? 0}
                      />
                    </FieldWrapper>
                    <FieldWrapper label="실제 횟수">
                      <input
                        className="field"
                        min={0}
                        onChange={(event) =>
                          onUpdateRecord(currentDay, exercise.id, "completedReps", Number(event.target.value))
                        }
                        type="number"
                        value={currentRecord?.completedReps ?? 0}
                      />
                    </FieldWrapper>
                    <FieldWrapper label="실제 무게">
                      <input
                        className="field"
                        min={0}
                        onChange={(event) =>
                          onUpdateRecord(currentDay, exercise.id, "completedWeight", Number(event.target.value))
                        }
                        type="number"
                        value={currentRecord?.completedWeight ?? 0}
                      />
                    </FieldWrapper>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

type RoutinePanelProps = {
  machineOptions: string[];
  onApplyPreset: (day: Weekday, theme: string) => void;
  routine?: DayRoutine;
  selectedDay: Weekday;
  onAddExercise: (day: Weekday) => void;
  onRemoveExercise: (day: Weekday, exerciseId: string) => void;
  onSelectDay: (day: Weekday) => void;
  onUpdateExercise: (
    day: Weekday,
    exerciseId: string,
    field: keyof ExercisePlan,
    value: string | number,
  ) => void;
};

function RoutinePanel({
  machineOptions,
  onApplyPreset,
  routine,
  selectedDay,
  onAddExercise,
  onRemoveExercise,
  onSelectDay,
  onUpdateExercise,
}: RoutinePanelProps) {
  const routineExerciseCount = routine?.exercises.length ?? 0;
  const routineTotalSets = routine?.exercises.reduce((sum, exercise) => sum + exercise.sets, 0) ?? 0;

  return (
    <section className="panel animate-rise">
      <div className="panel-body">
        <SectionHeader eyebrow="루틴" title={`${weekdayLabels[selectedDay]} 루틴 편집`} />

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {weekdayOrder.map((day) => (
            <DayShortcut
              key={day}
              active={selectedDay === day}
              label={weekdayShortLabels[day]}
              onClick={() => onSelectDay(day)}
            />
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-moss/70">선택 요일</p>
                  <h3 className="mt-3 text-3xl font-display text-ink">{routine?.theme ?? "루틴 미설정"}</h3>
                </div>
                <button className="primary-button" onClick={() => onAddExercise(selectedDay)} type="button">
                  운동 추가
                </button>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/62">
                {routine?.focus ?? "요일별 목적을 정하고 머신 루틴을 추가해 주세요."}
              </p>

              <div className="mt-4">
                <FieldWrapper label="부위 프리셋">
                  <select
                    className="field"
                    onChange={(event) => onApplyPreset(selectedDay, event.target.value)}
                    value={routine?.theme ?? routineAreaPresets[0].theme}
                  >
                    {routineAreaPresets.map((preset) => (
                      <option key={preset.theme} value={preset.theme}>
                        {preset.theme}
                      </option>
                    ))}
                  </select>
                </FieldWrapper>
              </div>
            </div>

            {(routine?.exercises ?? []).map((exercise) => (
              <div key={exercise.id} className="rounded-[24px] border border-line bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-ink">{exercise.machine}</p>
                    <p className="text-sm text-ink/56">{exercise.focus}</p>
                  </div>
                  <button
                    className="rounded-[16px] border border-line bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-ink transition hover:border-clay hover:text-clay"
                    onClick={() => onRemoveExercise(selectedDay, exercise.id)}
                    type="button"
                  >
                    삭제
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <FieldWrapper label="머신">
                    <select
                      className="field"
                      onChange={(event) => onUpdateExercise(selectedDay, exercise.id, "machine", event.target.value)}
                      value={exercise.machine}
                    >
                      {machineOptions.map((machine) => (
                        <option key={machine} value={machine}>
                          {machine}
                        </option>
                      ))}
                    </select>
                  </FieldWrapper>
                  <FieldWrapper label="무게 (kg)">
                    <input
                      className="field"
                      min={0}
                      onChange={(event) =>
                        onUpdateExercise(selectedDay, exercise.id, "weight", Number(event.target.value))
                      }
                      type="number"
                      value={exercise.weight}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="횟수">
                    <input
                      className="field"
                      min={1}
                      onChange={(event) => onUpdateExercise(selectedDay, exercise.id, "reps", Number(event.target.value))}
                      type="number"
                      value={exercise.reps}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="세트">
                    <input
                      className="field"
                      min={1}
                      onChange={(event) => onUpdateExercise(selectedDay, exercise.id, "sets", Number(event.target.value))}
                      type="number"
                      value={exercise.sets}
                    />
                  </FieldWrapper>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-line bg-white p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-moss/70">머신 목록</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {machineOptions.map((machine) => (
                  <Badge key={machine}>{machine}</Badge>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-white p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-moss/70">현재 구성</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-[18px] bg-[#f8fafc] px-4 py-3">
                  <span className="text-sm text-ink/60">운동 수</span>
                  <span className="text-sm font-semibold text-ink">{routineExerciseCount}개</span>
                </div>
                <div className="flex items-center justify-between rounded-[18px] bg-[#f8fafc] px-4 py-3">
                  <span className="text-sm text-ink/60">총 세트</span>
                  <span className="text-sm font-semibold text-ink">{routineTotalSets}세트</span>
                </div>
                <div className="rounded-[18px] bg-[#f8fafc] px-4 py-3">
                  <p className="text-sm text-ink/60">집중 부위</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{routine?.focus ?? "설정 필요"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type ProteinPanelProps = {
  currentDay: Weekday;
  extraProteinItems: ProteinItem[];
  isLoading: boolean;
  mealItems: string[];
  mealNote: string;
  mealRatio: number;
  mealTitle: string;
  newProteinAmount: string;
  newProteinName: string;
  proteinGoal: number;
  proteinProgress: number;
  schoolProtein: number;
  totalProtein: number;
  onAddProteinItem: () => void;
  onMealRatioChange: (ratio: number) => void;
  onNewProteinAmountChange: (value: string) => void;
  onNewProteinNameChange: (value: string) => void;
  onRemoveProteinItem: (itemId: string) => void;
};

function ProteinPanel({
  currentDay,
  extraProteinItems,
  isLoading,
  mealItems,
  mealNote,
  mealRatio,
  mealTitle,
  newProteinAmount,
  newProteinName,
  proteinGoal,
  proteinProgress,
  schoolProtein,
  totalProtein,
  onAddProteinItem,
  onMealRatioChange,
  onNewProteinAmountChange,
  onNewProteinNameChange,
  onRemoveProteinItem,
}: ProteinPanelProps) {
  return (
    <section className="panel animate-rise">
      <div className="panel-body">
        <SectionHeader eyebrow="단백질" title={`${weekdayLabels[currentDay]} 단백질 관리`} />

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-moss/12 bg-[linear-gradient(180deg,#3182f6,#1b64da)] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-white/55">오늘 단백질</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-5xl font-display">{totalProtein}g</p>
                  <p className="mt-2 text-sm text-white/68">목표 {proteinGoal}g</p>
                </div>
                <p className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold">{proteinProgress}%</p>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#dbeafe] transition-all"
                  style={{ width: `${proteinProgress}%` }}
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-moss/70">학교 급식</p>
                  <h3 className="mt-3 text-2xl font-display text-ink">
                    {isLoading ? "급식 불러오는 중..." : mealTitle}
                  </h3>
                </div>
                <span className="rounded-full bg-moss/10 px-4 py-2 text-sm font-semibold text-moss">
                  급식 단백질 {schoolProtein}g
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[0.6, 0.85, 1, 1.2].map((ratio) => (
                  <button
                    key={ratio}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      mealRatio === ratio ? "bg-moss text-white" : "border border-line bg-[#f8fafc] text-ink"
                    }`}
                    onClick={() => onMealRatioChange(ratio)}
                    type="button"
                  >
                    {Math.round(ratio * 100)}%
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {mealItems.map((item) => (
                  <ExerciseListRow key={item} description="급식 구성" label={item} meta="급식" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-ink/62">{mealNote}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-line bg-white p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-moss/70">추가 섭취</p>
              <div className="mt-4 space-y-3">
                <FieldWrapper label="식품 이름">
                  <input
                    className="field"
                    onChange={(event) => onNewProteinNameChange(event.target.value)}
                    placeholder="예: 닭가슴살"
                    type="text"
                    value={newProteinName}
                  />
                </FieldWrapper>
                <FieldWrapper label="단백질 (g)">
                  <input
                    className="field"
                    min={1}
                    onChange={(event) => onNewProteinAmountChange(event.target.value)}
                    type="number"
                    value={newProteinAmount}
                  />
                </FieldWrapper>
                <button className="primary-button w-full" onClick={onAddProteinItem} type="button">
                  기록 추가
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-white p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-moss/70">추가 기록</p>
              <div className="mt-4 space-y-3">
                {extraProteinItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-[18px] border border-line bg-[#f8fafc] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{item.name}</p>
                      <p className="text-xs text-ink/56">{item.grams}g</p>
                    </div>
                    <button
                      className="text-sm font-semibold text-clay"
                      onClick={() => onRemoveProteinItem(item.id)}
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type GrassPanelProps = {
  groupedHistory: Array<Array<{ date: string; completion: number }>>;
  streak: number;
  todayCompletion: number;
  weeklyAverage: number;
};

function GrassPanel({ groupedHistory, streak, todayCompletion, weeklyAverage }: GrassPanelProps) {
  return (
    <section className="panel animate-rise">
      <div className="panel-body">
        <SectionHeader eyebrow="기록" title="운동 강도 흐름" />

        <div className="mt-6 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="space-y-4">
            <MetricCard helper="오늘 수행 강도" label="오늘 잔디" value={formatPercent(todayCompletion)} />
            <MetricCard helper="운동 습관 유지" label="연속 기록" value={`${streak}일`} />
            <MetricCard helper="최근 7일 평균" label="주간 이행률" value={formatPercent(weeklyAverage)} />
            <div className="rounded-[24px] border border-line bg-white p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-moss/70">색상 기준</p>
              <div className="mt-4 flex items-center gap-2">
                {[0, 20, 45, 70, 90].map((level) => (
                  <span
                    key={level}
                    className="h-5 w-5 rounded-md border border-black/5"
                    style={{ backgroundColor: getGrassColor(level) }}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/62">0%는 휴식, 50% 이상은 수행일로 더 진하게 표시합니다.</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-moss/70">최근 12주</p>
                <h3 className="mt-3 text-3xl font-display text-ink">운동 잔디</h3>
              </div>
              <p className="text-sm text-ink/56">셀에 마우스를 올리면 날짜와 달성률을 볼 수 있습니다.</p>
            </div>

            <div className="mt-6 overflow-x-auto pb-2">
              <div className="flex min-w-max gap-2">
                {groupedHistory.map((week, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-2">
                    {week.map((entry) => (
                      <div key={entry.date} className="flex flex-col items-center gap-1">
                        <div
                          className="h-4 w-4 rounded-[5px] border border-black/5 transition-transform hover:scale-110"
                          style={{ backgroundColor: getGrassColor(entry.completion) }}
                          title={`${formatMiniDate(entry.date)} · ${entry.completion}%`}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MetricCard helper="학교 루틴 중심" label="패턴" value="주중 집중" />
              <MetricCard helper="단순 출석 아님" label="기준" value="달성률 반영" />
              <MetricCard helper="확장 가능" label="다음 단계" value="월간 통계" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type ProfilePanelProps = {
  isReminderEnabled: boolean;
  profile: UserProfile;
  proteinGoal: number;
  totalProtein: number;
  todayCompletion: number;
  weeklyAverage: number;
  onGoalChange: (goal: UserGoal) => void;
  onProfileChange: ProfileFieldUpdater;
  onReminderToggle: () => void;
  onReopenOnboarding: () => void;
};

function ProfilePanel({
  isReminderEnabled,
  profile,
  proteinGoal,
  totalProtein,
  todayCompletion,
  weeklyAverage,
  onGoalChange,
  onProfileChange,
  onReminderToggle,
  onReopenOnboarding,
}: ProfilePanelProps) {
  return (
    <section className="panel animate-rise">
      <div className="panel-body">
        <SectionHeader eyebrow="내 정보" title="내 정보와 설정" />

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrapper label="이름">
              <input
                className="field"
                onChange={(event) => onProfileChange("name", event.target.value)}
                type="text"
                value={profile.name}
              />
            </FieldWrapper>
            <FieldWrapper label="이메일">
              <input
                className="field"
                onChange={(event) => onProfileChange("email", event.target.value)}
                type="email"
                value={profile.email}
              />
            </FieldWrapper>
            <FieldWrapper label="성별">
              <select
                className="field"
                onChange={(event) => onProfileChange("gender", event.target.value as UserProfile["gender"])}
                value={profile.gender}
              >
                <option value="male">남학생</option>
                <option value="female">여학생</option>
              </select>
            </FieldWrapper>
            <FieldWrapper label="키 (cm)">
              <input
                className="field"
                min={100}
                onChange={(event) => onProfileChange("height", Number(event.target.value))}
                type="number"
                value={profile.height}
              />
            </FieldWrapper>
            <FieldWrapper label="몸무게 (kg)">
              <input
                className="field"
                min={30}
                onChange={(event) => onProfileChange("weight", Number(event.target.value))}
                type="number"
                value={profile.weight}
              />
            </FieldWrapper>

            <div className="sm:col-span-2">
              <span className="label">운동 목표</span>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["bulk", "maintenance", "cut"] as UserGoal[]).map((goal) => (
                  <GoalButton
                    key={goal}
                    current={profile.goal}
                    hint={getGoalHint(goal)}
                    label={getGoalLabel(goal)}
                    value={goal}
                    onClick={onGoalChange}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <MetricCard helper="계획 대비 수행률" label="오늘 운동" value={formatPercent(todayCompletion)} />
            <MetricCard helper={`목표 ${proteinGoal}g`} label="오늘 단백질" value={`${totalProtein}g`} />
            <MetricCard helper="최근 7일 기준" label="주간 평균" value={formatPercent(weeklyAverage)} />

            <div className="rounded-[24px] border border-line bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-moss/70">알림</p>
                  <p className="mt-3 text-lg font-semibold text-ink">{isReminderEnabled ? "켜짐" : "꺼짐"}</p>
                </div>
                <button className="primary-button" onClick={onReminderToggle} type="button">
                  {isReminderEnabled ? "알림 끄기" : "알림 켜기"}
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-white p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-moss/70">입력 흐름</p>
              <p className="mt-3 text-sm leading-6 text-ink/62">처음 입력 화면으로 돌아갑니다.</p>
              <button className="secondary-button mt-4 w-full" onClick={onReopenOnboarding} type="button">
                정보 입력 화면 다시 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type SectionHeaderProps = {
  description?: string;
  eyebrow: string;
  title: string;
};

function SectionHeader({ description, eyebrow, title }: SectionHeaderProps) {
  return (
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-[2.2rem] leading-tight text-ink">{title}</h2>
      {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/62">{description}</p> : null}
    </div>
  );
}

type FieldWrapperProps = {
  label: string;
  children: ReactNode;
};

function FieldWrapper({ label, children }: FieldWrapperProps) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

type GoalButtonProps = {
  current: UserGoal;
  hint: string;
  label: string;
  value: UserGoal;
  onClick: (value: UserGoal) => void;
};

function GoalButton({ current, hint, label, value, onClick }: GoalButtonProps) {
  const isActive = current === value;

  return (
    <button
      className={`rounded-[20px] border px-4 py-4 text-left transition ${
        isActive ? "border-moss bg-moss/10 text-ink" : "border-line bg-white text-ink/82"
      }`}
      onClick={() => onClick(value)}
      type="button"
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className={`mt-2 text-xs leading-5 ${isActive ? "text-ink/70" : "text-ink/52"}`}>{hint}</p>
    </button>
  );
}

type GenderButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function GenderButton({ active, label, onClick }: GenderButtonProps) {
  return (
    <button
      className={`rounded-[18px] border px-4 py-4 text-sm font-semibold transition ${
        active ? "border-moss bg-moss text-white" : "border-line bg-white text-ink"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

type MetricCardProps = {
  helper: string;
  label: string;
  value: string;
};

function MetricCard({ helper, label, value }: MetricCardProps) {
  return (
    <div className="stat-card">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-ink/44">{label}</p>
      <p className="mt-4 text-3xl font-display text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-ink/58">{helper}</p>
    </div>
  );
}

type BottomNavigationBarProps = {
  activeTab: DashboardTab;
  items: Array<{ id: DashboardTab; label: string }>;
  onSelect: (tab: DashboardTab) => void;
};

function BottomNavigation({ activeTab, items, onSelect }: BottomNavigationBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-line/80 bg-white/95 p-2 shadow-[0_-12px_30px_-24px_rgba(15,23,42,0.32)] backdrop-blur">
        <div className="grid grid-cols-4 gap-2">
          {items.map((item) => (
            <BottomNavItem
              key={item.id}
              active={activeTab === item.id}
              label={item.label}
              onClick={() => onSelect(item.id)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

type BottomNavItemProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function BottomNavItem({ active, label, onClick }: BottomNavItemProps) {
  return (
    <button
      className={`rounded-[20px] px-3 py-3 text-center transition ${
        active
          ? "bg-[#eef5ff] text-moss"
          : "text-ink/54 hover:bg-[#f8fafc] hover:text-ink"
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`mx-auto block h-1.5 w-8 rounded-full transition ${
          active ? "bg-moss" : "bg-[#d7dde4]"
        }`}
      />
      <span className="mt-2 block text-sm font-semibold">{label}</span>
    </button>
  );
}

type DayShortcutProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function DayShortcut({ active, label, onClick }: DayShortcutProps) {
  return (
    <button
      className={`min-w-[3rem] rounded-[16px] border px-3 py-3 text-sm font-semibold transition ${
        active ? "border-moss bg-moss text-white" : "border-line bg-white text-ink/72 hover:border-moss/35"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

type ExerciseListRowProps = {
  description: string;
  label: string;
  meta: string;
};

function ExerciseListRow({ description, label, meta }: ExerciseListRowProps) {
  return (
    <div className="rounded-[18px] border border-line bg-[#f8fafc] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-moss">{meta}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink/58">{description}</p>
    </div>
  );
}

type QuickMoveButtonProps = {
  description: string;
  label: string;
  onClick: () => void;
};

function QuickMoveButton({ description, label, onClick }: QuickMoveButtonProps) {
  return (
    <button
      className="w-full rounded-[18px] border border-line bg-[#f8fafc] px-4 py-4 text-left transition hover:border-moss/35 hover:bg-[#eef5ff]"
      onClick={onClick}
      type="button"
    >
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="mt-2 text-sm leading-6 text-ink/56">{description}</p>
    </button>
  );
}

type BadgeProps = {
  children: ReactNode;
};

function Badge({ children }: BadgeProps) {
  return (
    <span className="rounded-full border border-line bg-[#f2f4f6] px-3 py-2 text-xs font-semibold text-ember">
      {children}
    </span>
  );
}
