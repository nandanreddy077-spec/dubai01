/**
 * Expo Config Plugin to ensure TARGETED_DEVICE_FAMILY is set correctly
 * This ensures both iPhone and iPad are supported
 */
const { withXcodeProject } = require('@expo/config-plugins');

module.exports = function withTargetedDeviceFamily(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    
    // Set TARGETED_DEVICE_FAMILY to "1,2" (iPhone and iPad) for all configurations
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    
    Object.keys(configurations).forEach((configUuid) => {
      const configuration = configurations[configUuid];
      if (configuration.buildSettings) {
        // Set to "1,2" to support both iPhone (1) and iPad (2)
        configuration.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
      }
    });
    
    return config;
  });
};

