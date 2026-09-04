import type { SimilarityMap, SimilarityMapPoint } from '@/api/events';
import { useMemo, useState } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

const GRAPH_SIZE = 280;
const CENTER = GRAPH_SIZE / 2;
const MAX_PLOT_RADIUS = CENTER - 20;

const COLOR_LOW = { r: 199, g: 210, b: 254 }; // indigo-200: 유사도 낮음
const COLOR_HIGH = { r: 55, g: 48, b: 163 }; // indigo-800: 유사도 높음

function colorForSimilarity(similarity: number) {
  const t = Math.min(Math.max(similarity, 0), 1);
  const r = Math.round(COLOR_LOW.r + (COLOR_HIGH.r - COLOR_LOW.r) * t);
  const g = Math.round(COLOR_LOW.g + (COLOR_HIGH.g - COLOR_LOW.g) * t);
  const b = Math.round(COLOR_LOW.b + (COLOR_HIGH.b - COLOR_LOW.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function SimilarEventsPanel({ map }: { map: SimilarityMap }) {
  const points = useMemo(() => map.points.filter((p) => Math.round(p.similarity * 100) < 100), [map.points]);
  const scale = useMemo(() => (map.maxRadius > 0 ? MAX_PLOT_RADIUS / map.maxRadius : 1), [map.maxRadius]);
  const [selected, setSelected] = useState<SimilarityMapPoint | null>(null);

  return (
    <View className="mt-4 p-5 rounded-2xl bg-gray-200">
      <Text className="text-black text-lg font-pretendard-bold mb-4">비슷한 공모전 둘러보기 (상위 {points.length}개)</Text>

      <View className="items-center">
        <Svg width={GRAPH_SIZE} height={GRAPH_SIZE}>
          {map.referenceRings.map((ring) => {
            const r = Math.min(ring.radius * scale, MAX_PLOT_RADIUS);
            return (
              <Circle
                key={`ring-${ring.percentile}`}
                cx={CENTER}
                cy={CENTER}
                r={r}
                stroke="#9CA3AF"
                strokeDasharray="3,4"
                strokeWidth={1}
                fill="none"
              />
            );
          })}

          {points.map((p) => {
            const isSelected = selected?.id === p.id;
            const cx = CENTER + p.x * scale;
            const cy = CENTER + p.y * scale;
            return (
              <Line
                key={`line-${p.id}`}
                x1={CENTER}
                y1={CENTER}
                x2={cx}
                y2={cy}
                stroke={isSelected ? '#818CF8' : '#D1D5DB'}
                strokeWidth={isSelected ? 1.5 : 1}
              />
            );
          })}

          {points.map((p) => {
            const isSelected = selected?.id === p.id;
            return (
              <Circle
                key={p.id}
                cx={CENTER + p.x * scale}
                cy={CENTER + p.y * scale}
                r={isSelected ? 12 : 8}
                fill={colorForSimilarity(p.similarity)}
                stroke={isSelected ? '#111827' : 'white'}
                strokeWidth={isSelected ? 2 : 1.5}
                onPress={() => setSelected(p)}
              />
            );
          })}

          <Circle cx={CENTER} cy={CENTER} r={9} fill="#111827" />
          <SvgText x={CENTER + 12} y={CENTER + 4} fontSize={10} fontWeight="bold" fill="#111827">
            100%
          </SvgText>
        </Svg>
      </View>

      {selected && (
        <View className="mt-3 p-3 rounded-xl border border-gray-200 bg-white">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-gray-900 font-pretendard-bold text-lg" numberOfLines={1}>
              {selected.title}
            </Text>
            <Text className="text-indigo-600 font-pretendard-bold text-lg">
              {Math.round(selected.similarity * 100)}%
            </Text>
          </View>
          <Text className="text-gray-400 text-xs font-pretendard-medium mt-1" numberOfLines={1}>
            {selected.organizer} · {selected.fieldLabel ?? '기타'}
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(selected.detailUrl)} className="mt-2 self-start">
            <Text className="text-indigo-600 text-xs font-pretendard-bold">자세히 보기 →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
