import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import clsx from 'clsx';

export default function MusicPlayer() {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(() => parseInt(localStorage.getItem('trackIndex')) || 0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('volume')) || 0.7);
  const [isDark, setIsDark] = useState(() => JSON.parse(localStorage.getItem('themeDark')) ?? window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [repeatMode, setRepeatMode] = useState(localStorage.getItem('repeatMode') || 'none');
  const [shuffle, setShuffle] = useState(JSON.parse(localStorage.getItem('shuffle')) || false);

  const tracks = [
    { title: 'Sunset Vibes', artist: 'Ocean Beats', src: '/music/sunset.wav', cover: '/covers/sunset.png' },
    { title: 'City Lights', artist: 'Midnight Run', src: '/music/city.wav', cover: '/covers/city.png' },
    { title: 'Dreamscape', artist: 'Skyline', src: '/music/dream.wav', cover: '/covers/dream.png' }
  ];

  useEffect(() => {
    localStorage.setItem('volume', String(volume));
    localStorage.setItem('themeDark', JSON.stringify(isDark));
    localStorage.setItem('repeatMode', repeatMode);
    localStorage.setItem('shuffle', JSON.stringify(shuffle));
  }, [volume, isDark, repeatMode, shuffle]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const savedTime = parseFloat(localStorage.getItem('trackTime')) || 0;
    audio.currentTime = savedTime;
    audio.volume = volume;

    const updateProgress = () => {
      if (!audio.duration) return;
      setProgress((audio.currentTime / audio.duration) * 100);
      localStorage.setItem('trackTime', String(audio.currentTime));
    };

    const onPlay = () => localStorage.setItem('trackIndex', String(currentTrack));

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play', onPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('play', onPlay);
    };
  }, [currentTrack, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    src.connect(analyser);
    analyser.connect(ctx.destination);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const cxt = canvas.getContext('2d');

    function draw() {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      cxt.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];
        cxt.fillStyle = isDark ? '#60a5fa' : '#3b82f6';
        cxt.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
      }
    }
    draw();
  }, [isDark]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) audio.pause(); else audio.play();
    setIsPlaying(!isPlaying);
  };

  const nextTrack = useCallback(() => {
    setCurrentTrack((prev) => {
      const next = shuffle ? Math.floor(Math.random() * tracks.length) : (prev + 1) % tracks.length;
      localStorage.setItem('trackIndex', String(next));
      localStorage.setItem('trackTime', '0');
      return next;
    });
  }, [shuffle, tracks.length]);

  const prevTrack = useCallback(() => {
    setCurrentTrack((prev) => {
      const next = prev === 0 ? tracks.length - 1 : prev - 1;
      localStorage.setItem('trackIndex', String(next));
      localStorage.setItem('trackTime', '0');
      return next;
    });
  }, [tracks.length]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight') nextTrack();
      if (e.code === 'ArrowLeft') prevTrack();
      if (e.code === 'ArrowUp') setVolume((v) => Math.min(1, v + 0.1));
      if (e.code === 'ArrowDown') setVolume((v) => Math.max(0, v - 0.1));
      if (e.key.toLowerCase() === 'r') setRepeatMode((m) => (m === 'none' ? 'all' : m === 'all' ? 'one' : 'none'));
      if (e.key.toLowerCase() === 's') setShuffle((s) => !s);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextTrack, prevTrack]);

  useGesture({
    onSwipeLeft: nextTrack,
    onSwipeRight: prevTrack,
    onTap: togglePlay
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const autoPlay = true; // automatic resume
      const savedTime = parseFloat(localStorage.getItem('trackTime')) || 0;
      if (autoPlay && savedTime) {
        audio.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('volume', String(volume));
  }, [volume]);

  return (
    <div className={clsx('flex flex-col items-center justify-center min-h-screen transition-colors duration-500', isDark ? 'bg-zinc-900 text-white' : 'bg-white text-black')}>
      <Card className="w-80 shadow-2xl rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <img src={tracks[currentTrack].cover} alt={tracks[currentTrack].title} className="w-full h-56 object-cover rounded-xl mb-4" />

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <h2 className="text-xl font-bold">{tracks[currentTrack].title}</h2>
            <p className="text-sm text-gray-400">{tracks[currentTrack].artist}</p>
          </motion.div>

          <canvas ref={canvasRef} width="300" height="80" className="my-4 w-full"></canvas>

          <div className="flex justify-around items-center gap-4">
            <Button variant="ghost" onClick={prevTrack}><SkipBack /></Button>
            <Button onClick={togglePlay} className="p-4 rounded-full bg-blue-500 hover:bg-blue-600">
              {isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button variant="ghost" onClick={nextTrack}><SkipForward /></Button>
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="ghost" onClick={() => setShuffle(!shuffle)} className={shuffle ? 'text-blue-500' : ''}><Shuffle /></Button>
            <Button variant="ghost" onClick={() => setRepeatMode((m) => (m === 'none' ? 'all' : m === 'all' ? 'one' : 'none'))}>
              <Repeat className={repeatMode !== 'none' ? 'text-blue-500' : ''} />
            </Button>
            <div className="flex items-center">
              <Volume2 className="mr-2" />
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }} />
            </div>
          </div>

          <div className="flex justify-between mt-4 items-center">
            <span className="text-sm">Светлая</span>
            <Switch checked={isDark} onCheckedChange={setIsDark} />
            <span className="text-sm">Тёмная</span>
          </div>

          <audio
            ref={audioRef}
            src={tracks[currentTrack].src}
            onEnded={nextTrack}
            preload="auto"
          />
        </CardContent>
      </Card>
    </div>
  );
}
