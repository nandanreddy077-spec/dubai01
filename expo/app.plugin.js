/**
 * Expo Config Plugin to ensure TARGETED_DEVICE_FAMILY, iPad orientations, and usage descriptions are set correctly
 * This ensures both iPhone and iPad are supported with all required configurations
 */
const { withXcodeProject, withInfoPlist } = require('@expo/config-plugins');

module.exports = function withTargetedDeviceFamily(config) {
  // First, ensure TARGETED_DEVICE_FAMILY is set
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    
    // Set TARGETED_DEVICE_FAMILY to "1,2" (iPhone and iPad) for all configurations
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    
    Object.keys(configurations).forEach((configUuid) => {
      const configuration = configurations[configUuid];
      if (configuration && configuration.buildSettings) {
        // Set to "1,2" to support both iPhone (1) and iPad (2)
        configuration.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
      }
    });
    
    return config;
  });

  // Then, ensure Info.plist has all required orientations for iPad multitasking
  config = withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;
    
    // Ensure UISupportedInterfaceOrientations includes all 4 orientations for iPad multitasking
    if (!infoPlist.UISupportedInterfaceOrientations) {
      infoPlist.UISupportedInterfaceOrientations = [];
    }
    
    const orientations = infoPlist.UISupportedInterfaceOrientations;
    const requiredOrientations = [
      'UIInterfaceOrientationPortrait',
      'UIInterfaceOrientationPortraitUpsideDown',
      'UIInterfaceOrientationLandscapeLeft',
      'UIInterfaceOrientationLandscapeRight'
    ];
    
    // Add any missing orientations
    requiredOrientations.forEach((orientation) => {
      if (!orientations.includes(orientation)) {
        orientations.push(orientation);
      }
    });
    
    // Ensure all required usage descriptions are present
    if (!infoPlist.NSCameraUsageDescription) {
      infoPlist.NSCameraUsageDescription = 'Allow Glow Check to access your camera for beauty analysis';
    }
    if (!infoPlist.NSPhotoLibraryUsageDescription) {
      infoPlist.NSPhotoLibraryUsageDescription = 'Allow Glow Check to access your photos for beauty analysis';
    }
    if (!infoPlist.NSMicrophoneUsageDescription) {
      infoPlist.NSMicrophoneUsageDescription = 'Allow Glow Check to access your microphone';
    }
    if (!infoPlist.NSLocationWhenInUseUsageDescription) {
      infoPlist.NSLocationWhenInUseUsageDescription = 'Allow Glow Check to use your location to provide localized product recommendations and affiliate links.';
    }
    // Removed background location permissions - app only uses location when in use
    
    return config;
  });
  
  return config;
};

