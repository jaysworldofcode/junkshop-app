import { useLocalSearchParams } from 'expo-router';

import { ErrorBanner } from '@/components/ErrorBanner';
import { ExpenseForm } from '@/components/ExpenseForm';
import { Screen } from '@/components/Screen';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return (
      <Screen>
        <ErrorBanner message="This expense could not be opened." />
      </Screen>
    );
  }

  return <ExpenseForm expenseId={id} />;
}
