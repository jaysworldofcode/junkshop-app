import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BUTTON_MIN_HEIGHT, FONT_SIZE_BODY, FONT_SIZE_TITLE, SPACE_MD, SPACE_LG } from '@/constants/layout';
import { LIGHT_COLORS } from '@/theme/colors';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AppErrorBoundary', error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>The app hit an unexpected error. You can try again without losing saved products.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={() => this.setState({ error: null })}
          style={styles.button}
        >
          <Text style={styles.buttonLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACE_LG,
    backgroundColor: LIGHT_COLORS.background,
    gap: SPACE_MD,
  },
  title: {
    fontSize: FONT_SIZE_TITLE,
    fontWeight: '700',
    color: LIGHT_COLORS.text,
  },
  body: {
    fontSize: FONT_SIZE_BODY,
    color: LIGHT_COLORS.muted,
  },
  button: {
    minHeight: BUTTON_MIN_HEIGHT,
    borderRadius: SPACE_MD,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LIGHT_COLORS.primary,
  },
  buttonLabel: {
    color: LIGHT_COLORS.primaryContrast,
    fontSize: FONT_SIZE_BODY,
    fontWeight: '600',
  },
});
