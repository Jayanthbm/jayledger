# Android APK Size Reduction Guide

This document details the configuration changes made to reduce the release APK size from **114.8 MB** down to **40.2 MB** (~65% reduction).

## Applied Optimizations

### 1. Enable R8 Minification and Obfuscation

R8 strips out unused Java/Kotlin code, classes, and methods, and shrinks the codebase.

- **File modified:** [gradle.properties](file:///Users/jayanthbharadwajm/development/jayledger/android/gradle.properties)
- **Change:**
  ```properties
  android.enableMinifyInReleaseBuilds=true
  ```

### 2. Enable Resource Shrinking

Strips out unused resources (images, layouts, etc.) from the application.

- **File modified:** [gradle.properties](file:///Users/jayanthbharadwajm/development/jayledger/android/gradle.properties)
- **Change:**
  ```properties
  android.enableShrinkResourcesInReleaseBuilds=true
  ```

### 3. Configure Single ABI Target (arm64-v8a)

To avoid packaging native libraries for unused architectures (e.g. 32-bit arm, x86/x86_64 emulators), the build is configured to compile only `arm64-v8a` native code and output a single APK targeting modern 64-bit devices.

- **File modified:** [gradle.properties](file:///Users/jayanthbharadwajm/development/jayledger/android/gradle.properties)
  ```properties
  reactNativeArchitectures=arm64-v8a
  ```
- **File modified:** [build.gradle](file:///Users/jayanthbharadwajm/development/jayledger/android/app/build.gradle)
  ```groovy
  android {
      ...
      splits {
          abi {
              enable true
              reset()
              include "arm64-v8a"
              universalApk false
          }
      }
      ...
  }
  ```

---

## Size Comparison Results

| APK Variant       | Size Before                  | Size After  | Targets                       |
| :---------------- | :--------------------------- | :---------- | :---------------------------- |
| **arm64-v8a APK** | 114.8 MB (all architectures) | **40.2 MB** | Modern 64-bit Android devices |

---

## Recommendations for Play Store Deployment

For Google Play Store distribution, generate an **Android App Bundle (.aab)** instead of a single APK:

1. Run `./gradlew bundleRelease` in the `android/` directory.
2. The Play Store automatically serves optimized, split APKs to devices, reducing download sizes even further.
