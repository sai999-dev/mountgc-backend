class ZoomService {
  // Generate Zoom link (you can integrate with Zoom API later)
  generateZoomLink(bookingData) {
    const { booking_id, booking_date, booking_time } = bookingData;
    
    // Option 1: Use your personal Zoom meeting room (simplest)
    const personalMeetingRoom = process.env.ZOOM_PERSONAL_MEETING_LINK || 'https://zoom.us/j/1234567890';
    
    // Option 2: Generate unique meeting ID format (for display purposes)
    // In production, integrate with Zoom API to create actual meetings
    const meetingId = `${Date.now()}${booking_id}`.slice(-10);
    const password = this.generatePassword();
    
    return {
      meetingLink: `${personalMeetingRoom}?pwd=${password}`,
      meetingId: meetingId,
      password: password,
      displayLink: personalMeetingRoom
    };
  }

  // Generate random password for Zoom meeting
  generatePassword(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Format meeting details for email
  formatMeetingDetails(zoomData) {
    return {
      link: zoomData.meetingLink,
      meetingId: zoomData.meetingId,
      password: zoomData.password
    };
  }
}

module.exports = new ZoomService();
