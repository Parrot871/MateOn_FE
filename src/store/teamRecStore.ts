
import { getRecommendedTeams, type TeamRecommendation } from '@/api/team';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type TeamRecState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'ready'; teams: TeamRecommendation[] };

interface TeamRecStore {
  teamRec: TeamRecState;
  fetchedAt: number | null;
  fetchTeamRec: (opts?: { force?: boolean }) => Promise<void>;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  reset: () => void;
}

const STALE_TIME = 1000 * 60 * 10; // 10분

export const useTeamRecStore = create<TeamRecStore>()(
  persist(
    (set, get) => ({
      teamRec: { status: 'idle' },
      fetchedAt: null,
      hasHydrated: false, 
      setHasHydrated: (v) => set({ hasHydrated: v }),

      fetchTeamRec: async (opts) => {
        const { fetchedAt, teamRec } = get();
        const isFresh = fetchedAt !== null && Date.now() - fetchedAt < STALE_TIME;

        if (isFresh && teamRec.status === 'ready' && !opts?.force) return;

        // 디스크에서 복원된 캐시가 이미 있으면 로딩 스피너를 띄우지 않음
        if (teamRec.status !== 'ready') {
          set({ teamRec: { status: 'loading' } });
        }

        try {
          const teams = await getRecommendedTeams({ limit: 10 });
          set({
            teamRec: teams.length ? { status: 'ready', teams } : { status: 'empty' },
            fetchedAt: Date.now(),
          });
        } catch (err) {
          set((state) =>
            state.teamRec.status === 'ready'
              ? {}
              : {
                  teamRec: {
                    status: 'error',
                    message:
                      err instanceof Error ? err.message : '팀 추천을 불러오지 못했어요.',
                  },
                }
          );
        }
      },

      reset: () => set({ teamRec: { status: 'idle' }, fetchedAt: null }),
    }),
    {
      name: 'team-rec-storage', // AsyncStorage 키 이름
      storage: createJSONStorage(() => AsyncStorage),
      // fetchTeamRec, reset 같은 함수는 저장할 필요 없음 — 데이터만 저장
      partialize: (state) => ({ teamRec: state.teamRec, fetchedAt: state.fetchedAt }),
    }
  )
);