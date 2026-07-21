import { getMyProfile, updateProfile } from '@/api/user';
import { PdfImg } from '@/assets/images/login';
import { Back } from '@/assets/images/tool';
import { getUnivByEmail } from '@/utils/univ';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const TRACKS = ['인문과학계열', '사회과학계열', '자연과학계열', '공학계열', '예체능계열', '사범·교육학계열', '의약학계열'];
const MAX_PORTFOLIO_SIZE = 20 * 1024 * 1024;

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
    <View className="rounded-xl border border-[#D8E1FD] overflow-hidden">
      {options.map((option, index) => {
        const isSelected = value === option;

        return (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            className={`h-12 px-4 justify-center ${isSelected ? 'bg-[#3E6AF4]' : 'bg-white'} ${
              index !== options.length - 1 ? 'border-b border-[#D8E1FD]' : ''
            }`}
          >
            <Text className={`font-pretendard-semibold ${isSelected ? 'text-white' : 'text-black'}`}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [univ, setUniv] = useState('');
  const [track, setTrack] = useState<string | null>(null);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [major, setMajor] = useState('');
  const [job1, setJob1] = useState('');
  const [job2, setJob2] = useState('');
  const [job3, setJob3] = useState('');
  const [portfolio, setPortfolio] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

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

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        setName(profile.name ?? '');
        setUniv(getUnivByEmail(profile.email) ?? '');
        setTrack(profile.college ?? null);
        setMajor(profile.major ?? '');
        setJob1(profile.interestJobPrimary ?? '');
        setJob2(profile.interestJobSecondary ?? '');
        setJob3(profile.interestJobTertiary ?? '');
      })
      .catch((error) => {
        Alert.alert('알림', error instanceof Error ? error.message : '내 정보를 불러오지 못했습니다.', [
          { text: '확인', onPress: () => router.back() },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const isComplete = !!(name && track && major && job1 && job2 && job3);

  const handleSubmit = async () => {
    if (!isComplete || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateProfile({
        name,
        college: track!,
        major,
        interestJobPrimary: job1,
        interestJobSecondary: job2,
        interestJobTertiary: job3,
      });
      Alert.alert('회원정보 수정 완료', '회원정보가 수정되었습니다.', [{ text: '확인', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('회원정보 수정 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.', [
        { text: '확인' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <View className="flex-1 bg-white" />;
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 pt-20 pb-10">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-black text-2xl font-pretendard-bold">회원정보 수정</Text>
        <View style={{ width: 26, height: 26 }} />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-8 pb-10">
        <Text className="text-black font-pretendard-semibold mb-2 text-xl">이름</Text>
        <TextInput
          value={name}
          editable={false}
          style={{ verticalAlign: 'middle' }}
          className="h-12 px-1 mb-6 bg-white text-gray-400 border-b border-gray-300 font-pretendard text-lg"
        />

        <Text className="text-black font-pretendard-semibold mb-2 text-xl">학교</Text>
        <TextInput
          value={univ}
          editable={false}
          style={{ verticalAlign: 'middle' }}
          className="h-12 px-1 mb-6 bg-white text-gray-400 border-b border-gray-300 font-pretendard text-lg"
        />

        <View className={`relative mb-6 ${isTrackOpen ? 'z-20' : ''}`}>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-black font-pretendard-semibold mb-2 text-xl">계열</Text>
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
              <Text className="text-black font-pretendard-semibold mb-2 text-xl">학과</Text>
              <TextInput
                value={major}
                onChangeText={setMajor}
                placeholder="학과 입력"
                placeholderTextColor="#9CA3AF"
                style={{ verticalAlign: 'middle' }}
                className="h-14 px-4 bg-white text-black rounded-xl border border-[#D8E1FD] font-pretendard"
              />
            </View>
          </View>

          {isTrackOpen && (
            <View className="absolute top-24 left-0 w-1/2 pr-1">
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
        </View>

        <Text className="text-black font-pretendard-semibold mt-2 mb-2 text-xl">희망 직무 1순위</Text>
        <TextInput
          value={job1}
          onChangeText={setJob1}
          placeholder="1순위 희망직무를 입력해주세요"
          placeholderTextColor="#9CA3AF"
          style={{ verticalAlign: 'middle' }}
          className="h-12 px-1 mb-4 bg-white text-black border-b border-black font-pretendard text-lg"
        />

        <Text className="text-black font-pretendard-semibold mt-2 mb-2 text-xl">희망 직무 2순위</Text>
        <TextInput
          value={job2}
          onChangeText={setJob2}
          placeholder="2순위 희망직무를 입력해주세요"
          placeholderTextColor="#9CA3AF"
          style={{ verticalAlign: 'middle' }}
          className="h-12 px-1 mb-4 bg-white text-black border-b border-black font-pretendard text-lg"
        />

        <Text className="text-black font-pretendard-semibold mt-2 mb-2 text-xl">희망 직무 3순위</Text>
        <TextInput
          value={job3}
          onChangeText={setJob3}
          placeholder="3순위 희망직무를 입력해주세요"
          placeholderTextColor="#9CA3AF"
          style={{ verticalAlign: 'middle' }}
          className="h-12 px-1 mb-8 bg-white text-black border-b border-black font-pretendard text-lg"
        />

        <Text className="text-black font-pretendard-semibold mb-2 text-xl">포트폴리오</Text>
        <TouchableOpacity
          onPress={handlePickPortfolio}
          className="h-40 mb-8 px-4 bg-gray-100 rounded-xl border border-gray-300 justify-center items-center gap-1"
        >
          <Image source={PdfImg} style={{ width: 28, height: 28 }} />
          {portfolio ? (
            <Text className="text-gray-500 font-pretendard text-base text-center">{portfolio.name}</Text>
          ) : (
            <>
              <Text className="text-gray-500 font-pretendard-semibold text-xl text-center">
                PDF 파일을 선택해주세요
              </Text>
              <Text className="text-gray-400 font-pretendard text-s text-center">최대 20MB</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isComplete || isSubmitting}
          className={`h-14 rounded-xl justify-center items-center ${isComplete ? 'bg-[#3E6AF4]' : 'bg-[#3E6AF4]/40'}`}
        >
          <Text className="text-white text-lg font-pretendard-semibold">{isSubmitting ? '저장 중...' : '저장하기'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
