# SlideBox mobile app

## Test quickly with Expo Go
```
cd mobile-app
npm install
npx expo install --fix
npx expo start
```
Run the server on the same Wi-Fi (`node server.js` in the parent folder). Or open the app's **Server address** on the login screen and enter your online URL.

## Build an installable APK (real app)
1. Edit `eas.json`: replace `https://YOUR-APP-NAME.onrender.com` with your hosted server URL.
2. Install and log in (free Expo account): 
```
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
3. When the build finishes, EAS gives a download link/QR for the `.apk`. Install it on an Android phone (allow "install unknown apps").

The server address can also be changed inside the app (login screen → Server address).

Note: the slide viewer shows generated preview slides; it does not render the real contents of the PPT file. Use **Save** to download and open the real file.
