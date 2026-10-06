# Build the Android app locally

This app cannot print receipts from Expo Go. Bluetooth printing lives in a native module, so you need an APK (or a development build) installed on the phone.

These steps are for **Windows**. They produce an APK you can copy to a phone. You do not need a USB cable, an emulator, or EAS.

Expo docs: [Build locally](https://docs.expo.dev/guides/local-app-development/) and [Release build locally](https://docs.expo.dev/guides/local-app-production/).

## One-time setup

### 1. Android Studio and the Android SDK

1. Install [Android Studio](https://developer.android.com/studio).
2. Open it once and finish the setup wizard so it downloads the Android SDK.
3. In **Settings → Languages & Frameworks → Android SDK**:
   - **SDK Platforms:** Android SDK Platform 36
   - **SDK Tools:** Android SDK Build-Tools, NDK, CMake, Android SDK Platform-Tools

The SDK is usually at:

```
C:\Users\<you>\AppData\Local\Android\Sdk
```

### 2. Java 17

Use **JDK 17**. Do not point `JAVA_HOME` at Android Studio’s bundled Java (that is currently Java 25 and the native build fails with it).

Install Temurin 17:

```powershell
winget install --id EclipseAdoptium.Temurin.17.JDK -e --accept-package-agreements --accept-source-agreements
```

The install folder looks like:

```
C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot
```

If the version number differs, use the folder that is actually there.

### 3. Environment variables

In PowerShell (replace the JDK folder if yours is different):

```powershell
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
```

Then add these two folders to your user **Path**:

```
%JAVA_HOME%\bin
%LOCALAPPDATA%\Android\Sdk\platform-tools
```

Close every terminal and Cursor window, then open a new one. Check:

```powershell
java -version
# openjdk version "17...."
adb --version
echo $env:ANDROID_HOME
echo $env:JAVA_HOME
```

If `java -version` still shows 25, this shell was opened before the change. Close it and open a new one.

### 4. Project dependencies

```powershell
cd C:\Projects\junkshop-app
npm install
```

If `npx expo` is not recognized, run Expo CLI as:

```powershell
node node_modules/expo/bin/cli <command>
```

## Build an APK you can install

This does not need a phone plugged in.

```powershell
cd C:\Projects\junkshop-app
node node_modules/expo/bin/cli prebuild --platform android
cd android
.\gradlew.bat assembleRelease
```

The APK is:

```
android\app\build\outputs\apk\release\app-release.apk
```

Copy that file to the phone (USB, Drive, Messenger) and open it. Allow **Install unknown apps** if Android asks.

The first build downloads Gradle and native toolchains and can take 15–20 minutes. Later builds are much faster.

### When to run `prebuild` again

Run `prebuild` again after you:

- add or remove a library with native code
- change `app.json` or a config plugin
- change native files under `modules/`

Then run `.\gradlew.bat assembleRelease` again.

The `android/` folder is generated and gitignored. Do not edit it by hand.

## Install over USB instead

If the phone is plugged in with USB debugging on:

```powershell
cd C:\Projects\junkshop-app
node node_modules/expo/bin/cli run:android --variant release
```

That command fails with “No Android connected device found” if no phone or emulator is available. Use `assembleRelease` when you only want the APK file.

## Faster day-to-day work (development build)

JavaScript changes (shop name, receipts, screens) do not need a new APK if you install a **development build** once:

```powershell
cd C:\Projects\junkshop-app
node node_modules/expo/bin/cli run:android
```

That installs a debug app with the Bluetooth printer module, then starts Metro. After that:

```powershell
npm start
```

Open the installed Junkshop app on the phone (not Expo Go). It loads the latest JS from your PC over Wi-Fi.

Rebuild the native app only when native code or plugins change.

## Signing keys

Local `assembleRelease` signs the APK with the **Android debug keystore**. Cloud EAS builds use a **different** key.

Android will not install one over the other. If you switch from EAS to local (or the other way):

1. Back up data: **Home → Backup & transfer**
2. Uninstall the old app
3. Install the new APK
4. Restore the backup

Pick one way to build and stay with it so shop data is not wiped.

## Common errors

| Message | Cause | Fix |
| --- | --- | --- |
| Failed to resolve the Android SDK path | SDK missing or `ANDROID_HOME` not set in this terminal | Finish Android Studio SDK install, set `ANDROID_HOME`, open a new terminal |
| `'adb' is not recognized` | `platform-tools` not on Path | Add `%LOCALAPPDATA%\Android\Sdk\platform-tools` to Path |
| No Android connected device found | `run:android` needs a phone or emulator | Plug in a phone, or use `gradlew assembleRelease` |
| WARNING: A restricted method in java.lang.System | Java 25 from Android Studio | Set `JAVA_HOME` to JDK 17, then `cd android; .\gradlew.bat --stop` |
| Unresolved reference 'Coroutine' | Missing Kotlin import in the printer module | Already fixed in `BluetoothPrinterModule.kt`. Rebuild. |
| Could not reach the printer | Another printer app is still connected, or this APK is older than the connection fix | Force-close the other app, keep the printer on, rebuild this app, then print a test page |

## Cloud builds (optional)

EAS is slower on the free plan because of the queue. On Windows, `eas build --local` is not supported.

```powershell
npx eas-cli@latest build --profile preview --platform android
```

Download the APK from the Expo dashboard when it finishes. That APK is signed with the EAS key, not the local debug key.
