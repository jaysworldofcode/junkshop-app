import { useLocalSearchParams } from 'expo-router';

import { ErrorBanner } from '@/components/ErrorBanner';
import { PersonForm } from '@/components/PersonForm';
import { Screen } from '@/components/Screen';

export default function EditPersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return (
      <Screen>
        <ErrorBanner message="This person could not be opened." />
      </Screen>
    );
  }

  return <PersonForm personId={id} />;
}
