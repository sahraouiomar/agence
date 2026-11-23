plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "tn.englishapp"
    compileSdk = 34

    defaultConfig {
        applicationId = "tn.englishapp.arabi"
        minSdk = 26
        targetSdk = 34
        versionCode = 3
        versionName = "3.0"
        ndk { abiFilters += listOf("arm64-v8a", "armeabi-v7a") }
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
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    // On-device English <-> Arabic translation (model downloaded once, then works offline)
    implementation("com.google.mlkit:translate:17.0.3")
}
