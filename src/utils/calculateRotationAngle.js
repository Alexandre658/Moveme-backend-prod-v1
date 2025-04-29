export const calculateRotationAngle = (lastPosition, currentPosition) => {
    const { latitude: lat1, longitude: lon1 } = lastPosition;
    const { latitude: lat2, longitude: lon2 } = currentPosition;
  
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  };
  