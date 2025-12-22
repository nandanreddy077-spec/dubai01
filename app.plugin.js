/**
 * Expo Config Plugin to ensure TARGETED_DEVICE_FAMILY and iPad orientations are set correctly
 * This ensures both iPhone and iPad are supported with all required orientations
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
    
    return config;
  });
  
  return config;
};

