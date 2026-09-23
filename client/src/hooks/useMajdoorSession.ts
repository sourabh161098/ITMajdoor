import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  SERVER_URL,
  ICE_SERVERS,
  fetchIceServers,
  getMediaConstraints,
  MAX_VIDEO_BITRATE,
} from "../constants/config";
import {
  QUALITY_POLL_MS,
  QUALITY_THRESHOLDS,
  REACTION_LIFETIME_MS,
} from "../constants/session";
import type {
  Status,
  ConnectionQuality,
  ChatMessage,
  SignalPayload,
  FloatingReaction,
} from "../constants/session";

// Re-export the session types so existing imports from this hook keep working.
export type {
  Status,
  ConnectionQuality,
  ChatMessage,
  SignalPayload,
  FloatingReaction,
};

/**
 * Encapsulates the full ITMajdoor session lifecycle:
 *  - Socket.IO connection to the signaling server
 *  - Matchmaking (join / next / partner left)
 *  - WebRTC peer connection setup and teardown
 *  - Local + remote media streams
 *  - Text chat
 *
 * The UI just calls join()/next()/stop()/sendMessage() and reads the returned state.
 */
export function useMajdoorSession() {
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // True while the partner is actively typing (driven by "typing" events).
  const [partnerTyping, setPartnerTyping] = useState(false);
  // Whether the partner's camera is on (driven by "cam" events). Assume on until
  // told otherwise, so we show video by default.
  const [partnerCamOn, setPartnerCamOn] = useState(true);
  // Live connection quality, sampled from WebRTC stats.
  const [quality, setQuality] = useState<ConnectionQuality>("unknown");
  // Set when camera/mic access fails, so the UI can show a helpful message
  // instead of a dead spinner. Null while everything is fine.
  const [mediaError, setMediaError] = useState<string | null>(null);
  // Short-lived emoji reactions floating over the video (mine + partner's).
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  // Camera and mic start ON; the user can mute/disable from the controls.
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  // Mirror of camOn for use inside stable callbacks (handleMatched/toggleCam).
  const camOnRef = useRef(true);
  // Tracked in state so a useEffect can (re)attach it to the <video> element
  // once that element is actually mounted (it isn't while on the Landing page).
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // Cached ICE servers fetched from the backend (may include TURN creds).
  const iceServersRef = useRef<RTCIceServer[]>(ICE_SERVERS);
  // True once the user has asked to join; used to (re)emit "join" as soon as
  // the socket is actually connected, and to guard against double-joining.
  const wantJoinRef = useRef(false);
  const hasJoinedRef = useRef(false);
  // ICE candidates can arrive before the remote description is set; buffer them.
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // --- Media -------------------------------------------------------------

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    // Guard: getUserMedia is only available on secure origins (HTTPS or
    // localhost). On plain HTTP (some LAN/mobile setups) it's undefined.
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg =
        "Camera/mic unavailable. Open the site over HTTPS (secure) — most browsers block media on insecure pages.";
      setMediaError(msg);
      throw new Error(msg);
    }

    try {
      // Orientation-aware: portrait capture on phones so the video fills the
      // tall area instead of being cropped to a tiny slice by object-cover.
      const stream = await navigator.mediaDevices.getUserMedia(
        getMediaConstraints()
      );
      setMediaError(null);
      localStreamRef.current = stream;
      // Trigger the attach effect; the <video> may not be mounted yet.
      setLocalStream(stream);
      return stream;
    } catch (err) {
      // Map the common getUserMedia errors to a friendly, actionable message.
      const name = (err as DOMException)?.name;
      let msg: string;
      if (name === "NotAllowedError" || name === "SecurityError") {
        msg =
          "Camera & mic permission was denied. Allow access in your browser settings and try again.";
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        msg =
          "No compatible camera/mic found. Check that a camera is connected and not in use by another app.";
      } else if (name === "NotReadableError") {
        msg =
          "Your camera/mic is busy — another app or browser tab may be using it. Close it and try again.";
      } else {
        msg = "Couldn't access your camera and mic. Please try again.";
      }
      setMediaError(msg);
      throw err;
    }
  }, []);

  // Attach a stream to a <video> and explicitly call play(). iOS Safari /
  // iPadOS block autoplay for media that isn't muted, and even muted autoplay
  // can need a nudge — so we always call play() and swallow the (harmless)
  // rejection that fires if the browser defers playback.
  const attachStream = useCallback(
    (el: HTMLVideoElement | null, stream: MediaStream | null) => {
      if (!el || !stream) return;
      if (el.srcObject !== stream) el.srcObject = stream;
      const p = el.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          /* Autoplay deferred; will play on the next user interaction. */
        });
      }
    },
    []
  );

  // Attach (or re-attach) the local stream to the local <video> whenever either
  // the stream or the mounted element changes. This handles the case where the
  // stream is acquired on the Landing page before the video element exists.
  useEffect(() => {
    attachStream(localVideoRef.current, localStream);
  }, [localStream, status, attachStream]);

  // --- WebRTC peer connection -------------------------------------------

  const teardownPeer = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  const createPeer = useCallback(async () => {
    const stream = await ensureLocalStream();
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Raise the encoder's max bitrate for the video sender so 720p looks sharp.
    // Browsers otherwise cap video quite low, which makes the picture blurry.
    const videoSender = pc
      .getSenders()
      .find((s) => s.track?.kind === "video");
    if (videoSender) {
      const params = videoSender.getParameters();
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }
      params.encodings[0].maxBitrate = MAX_VIDEO_BITRATE;
      params.encodings[0].maxFramerate = 30;
      try {
        await videoSender.setParameters(params);
      } catch (err) {
        console.warn("Could not raise video bitrate", err);
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("signal", { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      // Explicitly attach + play so the partner's video isn't left frozen on
      // iOS/iPadOS (which block autoplay of unmuted media).
      attachStream(remoteVideoRef.current, event.streams[0]);
    };

    // Drive the UI status from the ACTUAL peer connection state, not the
    // socket match. This is the fix for "shows Connected but isn't".
    pc.onconnectionstatechange = () => {
      // Ignore events from a peer connection we've already replaced/torn down,
      // otherwise a stale "closed" event can re-queue us and desync the
      // server-side partner mapping (which breaks chat routing).
      if (pcRef.current !== pc) return;

      switch (pc.connectionState) {
        case "connected":
          setStatus("connected");
          break;
        case "connecting":
          setStatus("connecting");
          break;
        case "failed":
          // Only a genuine terminal failure re-queues us. We do NOT act on
          // "closed" (that's usually our own teardown during next/stop) to
          // avoid emitting a stray "next" that re-pairs us on the server.
          teardownPeer();
          setStatus("waiting");
          setMessages([]);
          socketRef.current?.emit("next");
          break;
        // "disconnected" can be transient; wait for it to recover or fail.
        default:
          break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        // Try an ICE restart before giving up (initiator side re-offers).
        try {
          pc.restartIce?.();
        } catch {
          /* not supported everywhere; connectionstatechange will handle it */
        }
      }
    };

    pcRef.current = pc;
    return pc;
  }, [ensureLocalStream, teardownPeer, attachStream]);

  const flushPendingCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Failed to add buffered ICE candidate", err);
      }
    }
    pendingCandidatesRef.current = [];
  }, []);

  // --- Signaling handlers ------------------------------------------------

  const handleMatched = useCallback(
    async ({ initiator }: { initiator: boolean }) => {
      // Matched on the server, but the WebRTC media path isn't up yet.
      // Real "connected" is set by pc.onconnectionstatechange.
      setStatus("connecting");
      setMessages([]);
      setPartnerTyping(false);
      setPartnerCamOn(true);
      setReactions([]);
      teardownPeer();
      const pc = await createPeer();

      // Tell the new partner our current camera state so they render correctly
      // even if we joined with the camera already off.
      socketRef.current?.emit("cam", { on: camOnRef.current });

      if (initiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit("signal", { description: offer });
      }
    },
    [createPeer, teardownPeer]
  );

  const handleSignal = useCallback(
    async ({ description, candidate }: SignalPayload) => {
      const pc = pcRef.current;
      if (!pc) return;

      if (description) {
        await pc.setRemoteDescription(new RTCSessionDescription(description));
        await flushPendingCandidates();
        if (description.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current?.emit("signal", { description: answer });
        }
      } else if (candidate) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Failed to add ICE candidate", err);
          }
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      }
    },
    [flushPendingCandidates]
  );

  // --- Socket lifecycle --------------------------------------------------

  // Keep the latest handlers in refs so the socket effect can mount ONCE and
  // never tear down / recreate the socket when these callbacks change identity.
  // Re-registering listeners (or reconnecting) mid-negotiation was dropping the
  // WebRTC connection, leaving the UI stuck on a fake "connected" state.
  const handleMatchedRef = useRef(handleMatched);
  const handleSignalRef = useRef(handleSignal);
  const teardownPeerRef = useRef(teardownPeer);
  useEffect(() => {
    handleMatchedRef.current = handleMatched;
    handleSignalRef.current = handleSignal;
    teardownPeerRef.current = teardownPeer;
  }, [handleMatched, handleSignal, teardownPeer]);

  useEffect(() => {
    // Reuse an existing socket across React StrictMode's dev double-mount.
    // Creating/destroying sockets (each with its own server-side pairing) was
    // the cause of tabs getting tangled with their own throwaway sockets
    // instead of pairing with each other.
    if (socketRef.current) return;

    const socket = io(SERVER_URL, { autoConnect: true });
    socketRef.current = socket;

    // Emit "join" only once the socket is truly connected, and only if the
    // user asked to. Guarded so we never join twice on one connection.
    socket.on("connect", () => {
      if (wantJoinRef.current && !hasJoinedRef.current) {
        hasJoinedRef.current = true;
        socket.emit("join");
      }
    });

    socket.on("waiting", () => setStatus("waiting"));
    socket.on("matched", (payload) => handleMatchedRef.current(payload));
    socket.on("signal", (payload) => handleSignalRef.current(payload));
    socket.on("chat:message", ({ text }: { text: string }) => {
      // A received message means they've stopped typing and sent it.
      setPartnerTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), from: "them", text, ts: Date.now() },
      ]);
    });
    socket.on("typing", ({ typing }: { typing: boolean }) => {
      setPartnerTyping(!!typing);
    });
    socket.on("reaction", ({ emoji }: { emoji: string }) => {
      spawnReaction(emoji);
    });
    socket.on("cam", ({ on }: { on: boolean }) => {
      setPartnerCamOn(!!on);
    });
    socket.on("partner:left", () => {
      teardownPeerRef.current();
      setPartnerTyping(false);
      setPartnerCamOn(true);
      setStatus("waiting");
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          from: "them",
          text: "— IT Majdoor left. Finding another IT Majdoor… —",
          ts: Date.now(),
        },
      ]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      hasJoinedRef.current = false;
      teardownPeerRef.current();
    };
  }, []);

  // --- Connection quality (WebRTC getStats) ------------------------------

  // While connected, sample the peer connection every 3s and derive a simple
  // good / ok / poor rating from inbound packet loss and round-trip time.
  useEffect(() => {
    if (status !== "connected") {
      setQuality("unknown");
      return;
    }

    let prevLost = 0;
    let prevReceived = 0;

    const sample = async () => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        const stats = await pc.getStats();
        let lost = 0;
        let received = 0;
        let rtt = 0;

        stats.forEach((report) => {
          if (report.type === "inbound-rtp" && !report.isRemote) {
            lost += report.packetsLost ?? 0;
            received += report.packetsReceived ?? 0;
          }
          if (
            report.type === "candidate-pair" &&
            report.state === "succeeded" &&
            typeof report.currentRoundTripTime === "number"
          ) {
            rtt = report.currentRoundTripTime; // seconds
          }
        });

        // Packet loss over the last interval only (delta), as a fraction.
        const dLost = lost - prevLost;
        const dReceived = received - prevReceived;
        prevLost = lost;
        prevReceived = received;
        const lossRate =
          dReceived + dLost > 0 ? dLost / (dReceived + dLost) : 0;
        const rttMs = rtt * 1000;

        // Thresholds: poor if lossy or laggy; good if clean and snappy.
        let next: ConnectionQuality;
        if (
          lossRate > QUALITY_THRESHOLDS.poor.loss ||
          rttMs > QUALITY_THRESHOLDS.poor.rttMs
        ) {
          next = "poor";
        } else if (
          lossRate > QUALITY_THRESHOLDS.ok.loss ||
          rttMs > QUALITY_THRESHOLDS.ok.rttMs
        ) {
          next = "ok";
        } else {
          next = "good";
        }
        setQuality(next);
      } catch {
        /* getStats can throw during teardown; ignore */
      }
    };

    // Sample immediately, then on an interval.
    sample();
    const id = setInterval(sample, QUALITY_POLL_MS);
    return () => clearInterval(id);
  }, [status]);

  // --- Public actions ----------------------------------------------------

  const join = useCallback(async () => {
    try {
      await ensureLocalStream();
    } catch {
      // Media failed (permission denied, no device, insecure origin, etc.).
      // mediaError is already set; return to idle so the user sees it and can
      // retry, instead of hanging on the "Finding…" spinner forever.
      setStatus("idle");
      return;
    }
    // Fetch ICE servers (with any TURN credentials) from the backend before
    // matchmaking, so they're ready when the peer connection is created.
    iceServersRef.current = await fetchIceServers();
    setStatus("waiting");
    wantJoinRef.current = true;
    const socket = socketRef.current;
    // If the socket is already connected, join now; otherwise the socket's
    // "connect" handler will emit "join" as soon as it connects.
    if (socket?.connected && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      socket.emit("join");
    }
  }, [ensureLocalStream]);

  const next = useCallback(() => {
    teardownPeer();
    setMessages([]);
    setStatus("waiting");
    socketRef.current?.emit("next");
  }, [teardownPeer]);

  const stop = useCallback(() => {
    // Leave entirely: tell the server to drop us (without requeueing),
    // release camera/mic, reset state, and return to the landing page.
    wantJoinRef.current = false;
    hasJoinedRef.current = false;
    socketRef.current?.emit("leave");
    teardownPeer();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setMessages([]);
    setMicOn(true);
    setCamOn(true);
    camOnRef.current = true;
    setPartnerCamOn(true);
    setStatus("idle");
  }, [teardownPeer]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    socketRef.current?.emit("chat:message", { text: trimmed });
    // Sending implies we're no longer typing.
    socketRef.current?.emit("typing", { typing: false });
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from: "me", text: trimmed, ts: Date.now() },
    ]);
  }, []);

  // Emit our own typing state to the partner. Called by the chat input.
  const setTyping = useCallback((typing: boolean) => {
    socketRef.current?.emit("typing", { typing });
  }, []);

  // Add a floating reaction that auto-removes itself after its lifetime.
  const spawnReaction = useCallback((emoji: string) => {
    const id = crypto.randomUUID();
    setReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, REACTION_LIFETIME_MS);
  }, []);

  // Send an emoji reaction to the partner. We do NOT show it on our own screen;
  // only the partner sees the reaction float over their video.
  const sendReaction = useCallback((emoji: string) => {
    socketRef.current?.emit("reaction", { emoji });
  }, []);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMicOn((prev) => !prev);
  }, []);

  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCamOn((prev) => {
      const next = !prev;
      camOnRef.current = next;
      // Tell the partner so they can show a camera-off placeholder.
      socketRef.current?.emit("cam", { on: next });
      return next;
    });
  }, []);

  return {
    status,
    messages,
    partnerTyping,
    partnerCamOn,
    quality,
    mediaError,
    reactions,
    micOn,
    camOn,
    localVideoRef,
    remoteVideoRef,
    join,
    next,
    stop,
    sendMessage,
    setTyping,
    sendReaction,
    toggleMic,
    toggleCam,
  };
}
