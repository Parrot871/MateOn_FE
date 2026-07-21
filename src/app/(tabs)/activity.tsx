import { SearchLineBasic } from '@/assets/icons';
import { EventCard, type ActivityItem } from '@/components/ui/EventCard';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOP_TABS = ['공모전', '대외활동', '스터디'] as const;
type TopTab = (typeof TOP_TABS)[number];

const FILTERS = ['전체', '브랜드/네이밍', '기획/아이디어', '예체능', '기타'];

const MOCK_ITEMS: ActivityItem[] = [
  {
    id: '1',
    dDay: 'D-5',
    title: '단국대 X 데이터 분석 캠프',
    type: '공모전',
    field: 'IT',
    synergy: 80,
    organizer: '한국데이터산업진흥원',
    prize: '총 1000만원',
  },
  {
    id: '2',
    dDay: 'D-5',
    title: '단국대 X 데이터 분석 캠프',
    type: '공모전',
    field: 'IT/소프트웨어/게임',
    synergy: 80,
    organizer: '한국데이터산업진흥원',
    prize: '총 1000만원',
  },
];

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [topTab, setTopTab] = useState<TopTab>('공모전');
  const [filter, setFilter] = useState('전체');

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pt-20 pb-6">
        <View className="flex-row gap-6">
          {TOP_TABS.map((tab) => {
            const isActive = topTab === tab;
            return (
              <TouchableOpacity key={tab} onPress={() => setTopTab(tab)}>
                <Text
                  className={`text-xl ${
                    isActive ? 'text-black font-pretendard-bold' : 'text-gray-300 font-pretendard-semibold'
                  }`}
                >
                  {tab}
                </Text>
                {isActive && <View className="h-0.5 bg-black mt-2 rounded-full" />}
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity>
          <Image source={SearchLineBasic} style={{ width: 30, height: 30 }} contentFit="contain" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-12 px-5 mb-4"
        contentContainerClassName="gap-2"
      >
        {FILTERS.map((item) => {
          const isSelected = filter === item;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => setFilter(item)}
              className={`h-9 px-4 rounded-full justify-center items-center border ${
                isSelected ? 'bg-[#3E6AF4] border-[#3E6AF4]' : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`font-pretendard-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4"
        contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
      >
        {MOCK_ITEMS.map((item) => (
          <EventCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}
