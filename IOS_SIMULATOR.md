# iOS simulator development

Run `npm run ios` from this directory with the simulator available in Xcode. Expo builds and installs the native app and serves JavaScript through Metro. The QR/development-build URL printed by Expo is normal output; it does not mean the app loaded successfully.

## Native launch crash fixed on 6 November 2026

The simulator crash report recorded `DYLD: Symbol missing` before React Native or JavaScript started. `ExpoFileSystem.framework` required the `ExpoModulesCore.AnyModule._classTypes` symbol, which the bundled `ExpoModulesCore.framework` did not export. Reloading Metro cannot repair that native binary mismatch.

The project's `package.json` now configures `expo.autolinking.ios.buildFromSource: [".*"]` so the iOS modules compile against the same installed native source instead of combining incompatible precompiled artifacts. This is the documented [Expo Autolinking option](https://docs.expo.dev/guides/prebuilt-expo-modules/#disabling-specific-modules-via-expo-autolinking). React Native itself still uses its standard prebuilt core. The first source build takes longer; subsequent builds reuse Xcode's cache.

Dependencies also pin `react-dom` to the same `19.3.0` as React to resolve an npm peer conflict and use the SDK 58-compatible gesture-handler `~3.3.0`.

After pulling these changes, install packages with `npm install`, then run `pod install` from `ios/` to refresh the native integration if needed. Run `npm run ios` from the app directory. No simulator reset or user-data deletion is required.

If an old native binary persists, a single `npm run ios -- --no-build-cache` rebuilds this app's derived data. Keep Metro running and allow the build to finish before opening the app. A signed cloud build is not required for local simulator testing.

For backend access, use a URL reachable from the iOS simulator, such as `http://localhost:4003/api` on this Mac. Android's `10.0.2.2` host alias is specific to the Android emulator. Set `EXPO_PUBLIC_API_URL` in local configuration accordingly and restart Metro after changing it.
