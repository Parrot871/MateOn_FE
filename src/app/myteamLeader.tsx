// src/app/myteamLeader.tsx
import { getMyTeams, type TeamPost } from "@/api/team";
import { Back, UserIcon } from "@/assets/images/tool";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function isRecruitmentOpen(team: TeamPost): boolean {
  return (
    team.recruiting &&
    team.currentMemberCount < team.capacity &&
    new Date(`${team.recruitmentEndDate}T23:59:59`) >= new Date()
  );
}

export default function MyTeamLeaderScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [teams, setTeams] = useState<TeamPost[]>([]);

  useFocusEffect(
    useCallback(() => {
      getMyTeams()
        .then((data) => {
          setTeams(data);
          setStatus("ready");
        })
        .catch(() => setStatus("error"));
    }, []),
  );

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 pt-20 pb-10">
        <TouchableOpacity onPress={() => router.back()}>
          <Image
            source={Back}
            style={{ width: 26, height: 26 }}
            contentFit="contain"
          />
        </TouchableOpacity>
        <Text className="text-black text-2xl font-pretendard-bold">
          모집한 팀
        </Text>
        <View style={{ width: 26, height: 26 }} />
      </View>

      {status === "loading" ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3E6AF4" />
        </View>
      ) : status === "error" ? (
        <View className="flex-1 items-center justify-center px-8 pb-20">
          <Text className="text-gray-400 font-pretendard text-base">
            목록을 불러오지 못했어요.
          </Text>
        </View>
      ) : teams.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 pb-20">
          <Text className="text-gray-400 font-pretendard text-base">
            아직 모집한 팀이 없어요.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="gap-3 pb-10"
        >
          {teams.map((team) => {
            const recruiting = isRecruitmentOpen(team);
            return (
              <TouchableOpacity
                key={team.id}
                onPress={() =>
                  router.push({
                    pathname: "/teamDetail",
                    params: { teamId: team.id },
                  })
                }
                className="px-4 py-4 rounded-xl border border-gray-200"
              >
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text
                    className="text-black font-pretendard-bold text-xl flex-1 pr-3"
                    numberOfLines={1}
                  >
                    {team.title}
                  </Text>
                  <View
                    className={
                      recruiting
                        ? "bg-emerald-50 rounded-full px-2.5 py-1"
                        : "bg-red-100 rounded-full px-2.5 py-1"
                    }
                  >
                    <Text
                      className={
                        recruiting
                          ? "text-emerald-600 text-sm font-pretendard-bold"
                          : "text-red-500 text-sm font-pretendard-bold"
                      }
                    >
                      {recruiting ? "모집 중" : "모집 마감"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1">
                  <Image
                    source={UserIcon}
                    style={{ width: 16, height: 16 }}
                    contentFit="contain"
                  />
                  <Text className="text-gray-400 text-base font-pretendard">
                    {team.currentMemberCount} / {team.capacity}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
