// src/app/(auth)/myInfo.tsx
import { PdfImg } from '@/assets/images/login';
import { Back } from '@/assets/images/tool';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const MAX_PORTFOLIO_SIZE = 20 * 1024 * 1024;

const TRACKS = ['인문·사회', '자연·공학', '예체능', '교육', '의약', '기타'];

function ChipGroup({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string | null;
  onSelect: (option: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value === option;

        return (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            className={`px-4 h-10 rounded-full justify-center items-center border ${
              isSelected ? 'bg-[#3E6AF4] border-[#3E6AF4]' : 'bg-white border-gray-300'
            }`}
          >
            <Text className={`font-pretendard-semibold ${isSelected ? 'text-white' : 'text-black'}`}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function MyInfoScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [track, setTrack] = useState<string | null>(null);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [department, setDepartment] = useState('');
  const [job1, setJob1] = useState('');
  const [job2, setJob2] = useState('');
  const [job3, setJob3] = useState('');
  const [portfolio, setPortfolio] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const isComplete = !!(name && track && department && job1 && job2 && job3);

  const handleSubmit = () => {
    if (!isComplete) return;
    router.replace('/');
  };

  const handlePickPortfolio = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.canceled) return;

    const file = result.assets[0];
    if (file.size && file.size > MAX_PORTFOLIO_SIZE) {
      Alert.alert('파일 용량 초과', 'PDF 파일은 최대 20MB까지 업로드할 수 있어요.');
      return;
    }

    setPortfolio(file);
  };

  return (
    <View className="flex-1 bg-white">
      <TouchableOpacity onPress={() => router.back()} className="px-6 pt-20 pb-6">
        <Image source={Back} style={{ width: 24, height: 24 }} contentFit="contain" />
      </TouchableOpacity>

      <ScrollView className="flex-1" contentContainerClassName="px-8 pb-10">
        <Text className="text-black text-2xl font-pretendard-bold mb-8">추가 정보를 입력해주세요</Text>

        <Text className="text-black font-pretendard-semibold mb-2">이름</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="이름을 입력해주세요"
          placeholderTextColor="#9CA3AF"
          className="h-14 px-4 mb-6 bg-white text-black rounded-xl border border-gray-300 font-pretendard"
        />

        <View className="flex-row gap-2 mb-6">
          <View className="flex-1">
            <Text className="text-black font-pretendard-semibold mb-2">계열</Text>
            <TouchableOpacity
              onPress={() => setIsTrackOpen((open) => !open)}
              className="h-14 px-4 flex-row justify-between items-center bg-white rounded-xl border border-[#D8E1FD]"
            >
              <Text className={`font-pretendard ${track ? 'text-black' : 'text-gray-400'}`}>{track ?? '계열 선택'}</Text>
              <Image
                source={Back}
                style={{ width: 14, height: 14, transform: [{ rotate: isTrackOpen ? '90deg' : '-90deg' }] }}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>

          <View className="flex-1">
            <Text className="text-black font-pretendard-semibold mb-2">학과</Text>
            <TextInput
              value={department}
              onChangeText={setDepartment}
              placeholder="학과 입력"
              placeholderTextColor="#9CA3AF"
              className="h-14 px-4 bg-white text-black rounded-xl border border-[#D8E1FD] font-pretendard"
            />
          </View>
        </View>

        {isTrackOpen && (
          <View className="-mt-4 mb-6">
            <ChipGroup
              options={TRACKS}
              value={track}
              onSelect={(option) => {
                setTrack(option);
                setIsTrackOpen(false);
              }}
            />
          </View>
        )}

        <Text className="text-black font-pretendard-semibold mb-2">희망직무 1순위</Text>
        <TextInput
          value={job1}
          onChangeText={setJob1}
          placeholder="1순위 희망직무를 입력해주세요"
          placeholderTextColor="#9CA3AF"
          className="h-14 px-4 mb-4 bg-white text-black rounded-xl border border-gray-300 font-pretendard"
        />

        <Text className="text-black font-pretendard-semibold mb-2">희망직무 2순위</Text>
        <TextInput
          value={job2}
          onChangeText={setJob2}
          placeholder="2순위 희망직무를 입력해주세요"
          placeholderTextColor="#9CA3AF"
          className="h-14 px-4 mb-4 bg-white text-black rounded-xl border border-gray-300 font-pretendard"
        />

        <Text className="text-black font-pretendard-semibold mb-2">희망직무 3순위</Text>
        <TextInput
          value={job3}
          onChangeText={setJob3}
          placeholder="3순위 희망직무를 입력해주세요"
          placeholderTextColor="#9CA3AF"
          className="h-14 px-4 mb-8 bg-white text-black rounded-xl border border-gray-300 font-pretendard"
        />

        <Text className="text-black font-pretendard-semibold mb-2">포트폴리오</Text>
        <TouchableOpacity
          onPress={handlePickPortfolio}
          className="h-24 mb-8 px-4 bg-gray-100 rounded-xl border border-gray-300 flex-row justify-center items-center gap-2"
        >
          <Image source={PdfImg} style={{ width: 28, height: 28 }} contentFit="contain" />
          <Text className="text-gray-500 font-pretendard text-center">
            {portfolio ? portfolio.name : 'PDF 파일을 선택해주세요\n최대 20MB'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isComplete}
          className={`h-14 rounded-xl justify-center items-center ${isComplete ? 'bg-[#3E6AF4]' : 'bg-[#3E6AF4]/40'}`}
        >
          <Text className="text-white text-lg font-pretendard-semibold">완료</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
