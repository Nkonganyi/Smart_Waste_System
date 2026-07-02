const { geocode } = require('./geocodingService')

/**
 * Validates GPS coordinates
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCoordinates(latitude, longitude) {
  // Check if latitude/longitude are numbers
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { valid: false, error: 'Latitude and longitude must be numbers' }
  }

  // Check if latitude is between -90 and 90
  if (latitude < -90 || latitude > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90 degrees' }
  }

  // Check if longitude is between -180 and 180
  if (longitude < -180 || longitude > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180 degrees' }
  }

  return { valid: true }
}

/**
 * Validates a location string and returns coordinates (if valid)
 * @param {string} locationStr
 * @returns {Promise<{ valid: boolean, latitude?: number, longitude?: number, error?: string }>}
 */
async function validateAndGeocodeLocation(locationStr) {
  if (!locationStr || typeof locationStr !== 'string' || locationStr.trim().length < 2) {
    return { valid: false, error: 'Location string must be at least 2 characters long' }
  }

  try {
    const coords = await geocode(locationStr)
    if (!coords) {
      return { valid: false, error: 'Could not validate location. Please check your address.' }
    }

    // Validate the coordinates we got back
    const coordValidation = validateCoordinates(coords.latitude, coords.longitude)
    if (!coordValidation.valid) {
      return { valid: false, error: coordValidation.error }
    }

    return {
      valid: true,
      latitude: coords.latitude,
      longitude: coords.longitude
    }
  } catch (error) {
    console.error('Location validation error:', error)
    return { valid: false, error: 'An error occurred while validating location' }
  }
}

module.exports = {
  validateCoordinates,
  validateAndGeocodeLocation
}
