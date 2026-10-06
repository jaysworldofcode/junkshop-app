import { useLocalSearchParams } from 'expo-router';

import { ErrorBanner } from '@/components/ErrorBanner';
import { ProductForm } from '@/components/ProductForm';
import { Screen } from '@/components/Screen';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return (
      <Screen>
        <ErrorBanner message="This product could not be opened." />
      </Screen>
    );
  }

  return <ProductForm productId={id} />;
}
