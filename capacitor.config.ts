import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    // Unique Android/iOS app identifier (reverse-domain format)
    appId: 'com.landslidewatch.app',

    // Display name shown on the phone home screen
    appName: 'LandslideWatch',

    // Where Vite outputs the production build
    webDir: 'dist',

    server: {
        androidScheme: 'https',
    },
};

export default config;
