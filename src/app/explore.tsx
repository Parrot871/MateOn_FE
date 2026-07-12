import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function TabTwoScreen() {
  const theme = useTheme();

  return <ThemedView style={{ flex: 1, backgroundColor: theme.background }} />;
}
