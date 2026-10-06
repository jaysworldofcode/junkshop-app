import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { DetailRow } from '@/components/DetailRow';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { SuccessNotice } from '@/components/SuccessNotice';
import { WarningNotice } from '@/components/WarningNotice';
import { FONT_SIZE_BODY, FONT_SIZE_CAPTION, RADIUS_MD, SPACE_XS, SPACE_MD, SPACE_LG } from '@/constants/layout';
import {
  DEFAULT_SHOP_NAME,
  SHOP_ADDRESS_MAX_LENGTH,
  SHOP_NAME_MAX_LENGTH,
  SHOP_PHONE_MAX_LENGTH,
} from '@/constants/printing';
import { usePrinterSetup } from '@/printing/usePrinterSetup';
import { useAppTheme } from '@/theme/useAppTheme';

export default function PrinterScreen() {
  const { colors, colorScheme } = useAppTheme();
  const setup = usePrinterSetup();
  const { settings, devices, busy } = setup;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
      >
        {setup.error ? <ErrorBanner message={setup.error} /> : null}
        {setup.notice ? <SuccessNotice title="Printer" body={setup.notice} onDismiss={setup.dismissNotice} /> : null}

        {setup.isSupported ? (
        <SectionCard
          title="Printer"
          description="Pair the printer first in the phone's Bluetooth settings. A GOOJPRT PT-210 usually shows as PT-210, and its PIN is 0000 or 1234. Close other printer apps first — it only talks to one app at a time."
        >
          {settings.printer ? (
            <DetailRow label={settings.printer.name} value={settings.printer.address} />
          ) : (
            <Text style={[styles.body, { color: colors.muted }]}>No printer chosen yet.</Text>
          )}
          <PrimaryButton
            label={settings.printer ? 'Choose another printer' : 'Choose printer'}
            variant={settings.printer ? 'outline' : 'solid'}
            icon={{ ios: 'printer.fill', android: 'bluetooth_searching', web: 'print' }}
            isLoading={busy === 'devices'}
            disabled={busy !== null}
            onPress={() => void setup.findPrinters()}
          />
          {devices ? (
            devices.length === 0 ? (
              <EmptyState
                icon={{ ios: 'printer', android: 'bluetooth_disabled', web: 'print' }}
                title="No paired devices"
                body="Turn on the printer, pair it in Bluetooth settings, then try again."
              />
            ) : (
              <View style={styles.devices}>
                {devices.map((device) => (
                  <Pressable
                    key={device.address}
                    accessibilityRole="button"
                    onPress={() => setup.choosePrinter(device)}
                    style={({ pressed }) => [
                      styles.device,
                      { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={[styles.deviceName, { color: colors.text }]}>{device.name}</Text>
                    <Text style={[styles.caption, { color: colors.muted }]}>{device.address}</Text>
                  </Pressable>
                ))}
              </View>
            )
          ) : null}
          {settings.printer ? (
            <PrimaryButton
              label="Print test page"
              variant="outline"
              icon={{ ios: 'doc.text', android: 'receipt_long', web: 'receipt_long' }}
              isLoading={busy === 'test'}
              disabled={busy !== null}
              onPress={() => void setup.testPrint()}
            />
          ) : null}
        </SectionCard>
        ) : (
          <WarningNotice
            title="Printing needs the installed app"
            body="Bluetooth printing is not part of Expo Go. Install the Junkshop Android build to print. You can still fill in the shop details below."
          />
        )}

        {setup.isSupported ? (
          <SectionCard title="Receipts">
            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Print when a ticket is saved</Text>
                <Text style={[styles.caption, { color: colors.muted }]}>
                  {settings.autoPrint
                    ? 'Buy and sell tickets print right after saving.'
                    : 'Tap Print receipt after saving, or from the ticket in History.'}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Print when a ticket is saved"
                value={settings.autoPrint}
                onValueChange={setup.setAutoPrint}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          </SectionCard>
        ) : null}

        <SectionCard title="Shop details" description="Printed at the top of every receipt. Saved as you type.">
          <FormField
            label="Junkshop name"
            placeholder={DEFAULT_SHOP_NAME}
            hint="Printed large. Short names fit best."
            value={settings.shopName}
            onChangeText={setup.setShopName}
            maxLength={SHOP_NAME_MAX_LENGTH}
            autoCapitalize="words"
          />
          <FormField
            label="Phone number"
            placeholder="e.g. 0917 123 4567"
            value={settings.shopPhone}
            onChangeText={setup.setShopPhone}
            maxLength={SHOP_PHONE_MAX_LENGTH}
            keyboardType="phone-pad"
            inputMode="tel"
          />
          <FormField
            label="Address"
            placeholder="e.g. 123 Rizal St., Brgy. San Jose, Quezon City"
            value={settings.shopAddress}
            onChangeText={setup.setShopAddress}
            maxLength={SHOP_ADDRESS_MAX_LENGTH}
            autoCapitalize="words"
            multiline
          />
        </SectionCard>

        {setup.isSupported && settings.printer ? (
          <PrimaryButton label="Forget this printer" variant="outline" disabled={busy !== null} onPress={setup.forgetPrinter} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACE_MD,
    gap: SPACE_LG,
    paddingBottom: SPACE_LG * 2,
  },
  body: {
    fontSize: FONT_SIZE_BODY - 1,
  },
  caption: {
    fontSize: FONT_SIZE_CAPTION,
    lineHeight: 18,
  },
  devices: {
    gap: SPACE_XS * 2,
  },
  device: {
    borderWidth: 1,
    borderRadius: RADIUS_MD,
    padding: SPACE_MD,
    gap: SPACE_XS,
  },
  deviceName: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_MD,
  },
  switchCopy: {
    flex: 1,
    gap: SPACE_XS,
  },
  switchLabel: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '700',
  },
});
