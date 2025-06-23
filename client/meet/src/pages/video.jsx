import React, { useEffect, useRef, useState } from 'react';
import styles from './video.module.css';
import io from 'socket.io-client';

const socket = io('http://localhost:5001');
const roomId = 'focus-room';

const Video = () => {
  const localVideo = useRef();
  const remoteVideo = useRef();
  const pcRef = useRef();

  const [joined, setJoined] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [status, setStatus] = useState('Not in call');

  useEffect(() => {
    socket.on('user-joined', async () => {
      console.log('👤 Peer joined');
      setStatus('Peer joined, creating offer...');
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit('offer', { sdp: offer, roomId });
    });

    socket.on('offer', async ({ sdp }) => {
      console.log('📨 Received offer');
      setStatus('Received offer, sending answer...');
      await pcRef.current.setRemoteDescription(new window.RTCSessionDescription(sdp));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('answer', { sdp: answer, roomId });
    });

    socket.on('answer', async ({ sdp }) => {
      console.log('📨 Received answer');
      setStatus('Connected');
      await pcRef.current.setRemoteDescription(new window.RTCSessionDescription(sdp));
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      console.log('❄️ Received ICE candidate');
      try {
        await pcRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected');
      setStatus('Peer disconnected');
      setInCall(false);
    });
  }, []);

  const joinCall = async () => {
    console.log('🔔 joinCall triggered');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideo.current) localVideo.current.srcObject = stream;

      pcRef.current = new window.RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));

      pcRef.current.ontrack = event => {
        setRemoteStream(event.streams[0]);
        if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
      };

      pcRef.current.onicecandidate = event => {
        if (event.candidate) {
          socket.emit('ice-candidate', { candidate: event.candidate, roomId });
        }
      };

      socket.emit('join', roomId);
      setStatus('Waiting for peer to join...');
      setJoined(true);
      setInCall(true);
    } catch (err) {
      console.error('🚨 getUserMedia failed:', err);
      setStatus('Could not access camera/mic');
    }
  };

  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    });
  };

  const toggleCam = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    });
  };

  const leaveCall = () => {
    if (pcRef.current) pcRef.current.close();
    setInCall(false);
    setJoined(false);
    setStatus('Call ended');
  };

  useEffect(() => {
    if (localVideo.current && localStream) {
      localVideo.current.srcObject = localStream;
    }
    if (remoteVideo.current && remoteStream) {
      remoteVideo.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  return (
    <div className={styles.container}>
      <h1>Anwar's Video Room</h1>
      <div className={styles.status}>{status}</div>

      {!joined && (
        <button onClick={joinCall} className={styles.joinBtn}>Join Room</button>
      )}

      {inCall && (
        <>
          <div className={styles.videoGrid}>
            <div className={styles.videoCard}>
              <video ref={localVideo} autoPlay muted playsInline className={styles.video} />
              <div className={styles.label}>You</div>
            </div>
            <div className={styles.videoCard}>
              <video ref={remoteVideo} autoPlay playsInline className={styles.video} />
              <div className={styles.label}>Guest</div>
            </div>
          </div>

          <div className={styles.controls}>
            <button onClick={toggleMic} className={micOn ? styles.on : styles.off}>{micOn ? 'Mute' : 'Unmute'}</button>
            <button onClick={toggleCam} className={camOn ? styles.on : styles.off}>{camOn ? 'Hide Video' : 'Show Video'}</button>
            <button onClick={leaveCall} className={styles.leave}>Leave Call</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Video;
