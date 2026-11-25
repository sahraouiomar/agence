plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "tn.fitcoach"
    compileSdk = 34

    defaultConfig {
        applicationId = "tn.fitcoach.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 3
        versionName = "3.0"
    }

    // One APK per processor type keeps each download small (the native AI libraries are big).
    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a", "armeabi-v7a")
            isUniversalApk = false
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // Signed with the debug key so the APK installs directly on a phone.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    androidResources { noCompress += listOf("tflite") }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    // On-device body pose detection (33 points) for exercise form correction — works offline
    implementation("com.google.mlkit:pose-detection:18.0.0-beta5")
    // On-device image labelling to recognise food in photos — works offline
    implementation("com.google.mlkit:image-labeling:17.0.9")
    // On-device barcode reading (packaged products -> Open Food Facts lookup)
    implementation("com.google.mlkit:barcode-scanning:17.3.0")
    // On-device object detection: finds the separate items on a plate
    implementation("com.google.mlkit:object-detection:17.0.2")
    // Custom on-device classifier: Google AIY Food V1 (2,023 dishes, Apache-2.0) in assets/ml/
    implementation("com.google.mlkit:image-labeling-custom:17.0.3")
    // Fingerprint / face / PIN unlock
    implementation("androidx.biometric:biometric:1.1.0")
}
