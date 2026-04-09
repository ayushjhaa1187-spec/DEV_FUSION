export function generateJitsiRoomName(bookingId: string): string {
  // Deterministic: same bookingId always gives same room
  return `skillbridge-session-${bookingId.replace(/-/g, '').slice(0, 16)}`;
}

export function getJitsiMeetUrl(roomName: string): string {
  return `https://meet.jit.si/${roomName}`;
}

export interface JitsiSessionConfig {
  roomName: string;
  displayName: string;
  avatarUrl?: string;
  startWithVideoMuted?: boolean;
  startWithAudioMuted?: boolean;
}
