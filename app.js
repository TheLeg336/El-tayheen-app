document.addEventListener("DOMContentLoaded", () => {
    const permissionStatus = document.getElementById("permission-status");
    const compassNeedle = document.getElementById("compass-needle");
    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");
    const getCoordinatesButton = document.getElementById("get-coordinates");
    const startCompassButton = document.getElementById("start-compass");
    const statusMessage = document.getElementById("status");
    const arrivalMessage = document.getElementById("arrival-message");
  
    let currentLatitude = null;
    let currentLongitude = null;
    let targetLatitude = null;
    let targetLongitude = null;
  
    // Function to calculate bearing
    function calculateBearing(lat1, lon1, lat2, lon2) {
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x =
        Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      let θ = Math.atan2(y, x);
  
      let bearing = (θ * 180) / Math.PI;
      return (bearing + 360) % 360;
    }
  
    // Function to calculate distance in meters using Haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371e3; // Earth radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  
      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
      return R * c; // Distance in meters
    }
  
    // Gyroscope and Geolocation Setup
    function setupCompass() {
      if (!navigator.geolocation || !window.DeviceOrientationEvent) {
        statusMessage.textContent =
          "Geolocation or Device Orientation is not supported on this device.";
        return;
      }
  
      // Start listening to device orientation events
      window.addEventListener("deviceorientation", handleOrientation);
  
      // Watch the user's position for updates
      navigator.geolocation.watchPosition(
        (position) => {
          currentLatitude = position.coords.latitude;
          currentLongitude = position.coords.longitude;
  
          // Check if the user has arrived
          if (targetLatitude && targetLongitude) {
            const distance = calculateDistance(
              currentLatitude,
              currentLongitude,
              targetLatitude,
              targetLongitude
            );
  
            if (distance <= 6.1) {
              arrivalMessage.style.display = "block";
            } else {
              arrivalMessage.style.display = "none";
            }
          }
        },
        (error) => {
          statusMessage.textContent = "Error getting location: " + error.message;
        }
      );
    }
  
    // Handle device orientation events
    function handleOrientation(event) {
      const heading = event.webkitCompassHeading || 360 - event.alpha;
  
      if (targetLatitude && targetLongitude) {
        const bearing = calculateBearing(
          currentLatitude,
          currentLongitude,
          targetLatitude,
          targetLongitude
        );
  
        const needleRotation = heading - bearing;
        compassNeedle.style.transform = `translate(-50%, -50%) rotate(${needleRotation}deg)`;
      }
    }
  
    // Get Current Coordinates Button
    getCoordinatesButton.addEventListener("click", () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          currentLatitude = position.coords.latitude;
          currentLongitude = position.coords.longitude;
  
          latitudeInput.value = currentLatitude.toFixed(6);
          longitudeInput.value = currentLongitude.toFixed(6);
  
          permissionStatus.textContent = "Location permission granted.";
          startCompassButton.disabled = false;
          statusMessage.textContent = "Coordinates retrieved successfully!";
        },
        (error) => {
          permissionStatus.textContent =
            "Location permission denied. Please enable location services in your browser settings.";
        }
      );
  
      // Request device orientation permission (iOS-specific)
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission()
          .then((response) => {
            if (response === "granted") {
              permissionStatus.textContent += " Device orientation permission granted.";
            } else {
              permissionStatus.textContent +=
                " Device orientation permission denied. Please enable it in your settings.";
            }
          })
          .catch((error) => {
            permissionStatus.textContent += " Error requesting device orientation permission.";
          });
      }
    });
  
    // Start Compass Button
    startCompassButton.addEventListener("click", () => {
      targetLatitude = parseFloat(latitudeInput.value);
      targetLongitude = parseFloat(longitudeInput.value);
  
      if (isNaN(targetLatitude) || isNaN(targetLongitude)) {
        statusMessage.textContent = "Please enter valid latitude and longitude values.";
        return;
      }
  
      statusMessage.textContent = "Starting compass...";
      setupCompass();
    });
  });