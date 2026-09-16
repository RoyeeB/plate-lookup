/**
 * Config plugin for @react-native-ml-kit/text-recognition.
 *
 * ML Kit is a native module — it is autolinked into the native project during
 * `expo prebuild`, but its CocoaPods (GoogleMLKit/TextRecognition) require a
 * minimum iOS deployment target of 15.5. This plugin guarantees the project's
 * iOS deployment target is AT LEAST that floor, and is the hook point for any
 * future ML Kit native tweaks.
 *
 * IMPORTANT: it only ever RAISES the target — it never lowers it below the
 * value the Expo prebuild template already sets (Expo SDK 57's own pods require
 * iOS 16.4). The floor here is the max of ML Kit's minimum and Expo's minimum.
 *
 * Referenced from app.json under `plugins`. No JS-side config is needed;
 * on-device text recognition needs no API key and makes no network calls.
 */
const { withDangerousMod, withPodfileProperties } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Floor = max(ML Kit minimum 15.5, Expo SDK 57 minimum 16.4).
const MIN_IOS_DEPLOYMENT_TARGET = '16.4';

function atLeast(current, floor) {
  const c = parseFloat(current);
  const f = parseFloat(floor);
  if (!Number.isFinite(c)) return floor;
  return c >= f ? current : floor;
}

function withMlKitIosDeploymentTarget(config) {
  // Raise (never lower) the deployment target recorded in Podfile.properties.json,
  // which Expo's autolinking reads.
  config = withPodfileProperties(config, (cfg) => {
    const existing = cfg.modResults['ios.deploymentTarget'];
    cfg.modResults['ios.deploymentTarget'] = atLeast(existing, MIN_IOS_DEPLOYMENT_TARGET);
    return cfg;
  });

  // Belt-and-suspenders: ensure the Podfile's `platform :ios` fallback default is
  // never below the floor, in case Podfile.properties.json is absent.
  config = withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfile)) {
        let contents = fs.readFileSync(podfile, 'utf8');
        contents = contents.replace(
          /platform :ios, podfile_properties\['ios\.deploymentTarget'\] \|\| '[\d.]+'/,
          `platform :ios, podfile_properties['ios.deploymentTarget'] || '${MIN_IOS_DEPLOYMENT_TARGET}'`
        );
        fs.writeFileSync(podfile, contents);
      }
      return cfg;
    },
  ]);

  return config;
}

module.exports = function withMlKitTextRecognition(config) {
  return withMlKitIosDeploymentTarget(config);
};
