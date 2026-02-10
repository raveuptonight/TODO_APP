import React, { useState, useEffect, useRef, useCallback } from 'react';
import soundManager from './SoundManager';

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'サンプルタスク1', completed: false },
    { id: 2, text: 'サンプルタスク2', completed: false },
    { id: 3, text: 'サンプルタスク3', completed: false },
  ]);
  const [newTodo, setNewTodo] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState(['？', '？', '？']);
  const [result, setResult] = useState(null);

  // パチンコ要素
  const [holds, setHolds] = useState([]);
  const [currentStage, setCurrentStage] = useState('normal');
  const [isKakuhen, setIsKakuhen] = useState(false);
  const [kakuhenCount, setKakuhenCount] = useState(0);
  const [continuationRate, setContinuationRate] = useState(0);

  // 演出状態
  const [showFlash, setShowFlash] = useState(false);
  const [flashColor, setFlashColor] = useState('white');
  const [shake, setShake] = useState(false);
  const [showRainbow, setShowRainbow] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [buttonType, setButtonType] = useState('normal');
  const [reachType, setReachType] = useState(null);
  const [showYakumono, setShowYakumono] = useState(false);

  // ポイント
  const [totalPoints, setTotalPoints] = useState(0);
  const [showPointGain, setShowPointGain] = useState(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundLoaded, setSoundLoaded] = useState(false);

  const symbols = ['7', '3', 'V', '⭐', '🔔', '👑', '💎'];
  const processingRef = useRef(false);
  const bgmRef = useRef(null);

  // 初期化
  useEffect(() => {
    soundManager.preload().then(() => {
      setSoundLoaded(true);
    });
  }, []);

  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const playSound = useCallback((soundKey, options) => {
    soundManager.play(soundKey, options);
  }, []);

  const triggerFlash = (color = 'white', times = 1, interval = 100) => {
    let count = 0;
    const flash = () => {
      setFlashColor(color);
      setShowFlash(true);
      setTimeout(() => {
        setShowFlash(false);
        count++;
        if (count < times) {
          setTimeout(flash, interval);
        }
      }, 80);
    };
    flash();
  };

  const triggerShake = (duration = 500) => {
    setShake(true);
    setTimeout(() => setShake(false), duration);
  };

  const showAnnouncementText = (text, type = 'normal', duration = 2000) => {
    setAnnouncement({ text, type });
    setTimeout(() => setAnnouncement(null), duration);
  };

  // 保留追加
  const addHold = (todoId) => {
    if (holds.length >= 4) return false;

    let color = 'blue';
    const rand = Math.random();
    if (isKakuhen) {
      if (rand < 0.15) color = 'rainbow';
      else if (rand < 0.35) color = 'gold';
      else if (rand < 0.55) color = 'red';
      else if (rand < 0.75) color = 'green';
    } else {
      if (rand < 0.02) color = 'rainbow';
      else if (rand < 0.08) color = 'gold';
      else if (rand < 0.18) color = 'red';
      else if (rand < 0.35) color = 'green';
    }

    playSound('holdIn');

    if (color === 'red' || color === 'gold' || color === 'rainbow') {
      setTimeout(() => {
        if (color === 'rainbow') {
          playSound('holdRainbow');
          showAnnouncementText('🌈 虹保留!? 🌈', 'rainbow');
        } else {
          playSound('holdChange');
        }
        triggerFlash(color === 'rainbow' ? 'cyan' : color === 'gold' ? 'yellow' : 'red', 2);
      }, 300);
    }

    setHolds(prev => [...prev, { id: Date.now(), todoId, color }]);
    return true;
  };

  // 保留消化
  useEffect(() => {
    if (isSpinning || holds.length === 0 || processingRef.current) return;

    processingRef.current = true;
    const currentHold = holds[0];

    const processHold = async () => {
      setIsSpinning(true);
      setHolds(prev => prev.slice(1));
      setResult(null);
      setReachType(null);

      const holdColor = currentHold.color;

      // 先読み予告
      if (holdColor === 'gold' || holdColor === 'rainbow') {
        if (Math.random() > 0.5) {
          playSound('impact');
          setCurrentStage('chance');
          showAnnouncementText('⚡ CHANCE ZONE ⚡', 'stageChange');
          await new Promise(r => setTimeout(r, 1500));
        }
      }

      // 激アツ予告
      const gekiatsuChance = holdColor === 'rainbow' ? 0.8 :
                             holdColor === 'gold' ? 0.5 :
                             holdColor === 'red' ? 0.3 : 0.1;
      if (Math.random() < gekiatsuChance) {
        triggerFlash('red', 4, 80);
        triggerShake(800);
        playSound('gekiatsu');
        showAnnouncementText('🔥 激アツ!! 🔥', 'atsui');
        await new Promise(r => setTimeout(r, 1500));
      }

      // デジタル回転
      const spinDuration = 1800;
      const spinInterval = 70;
      let elapsed = 0;

      await new Promise(resolve => {
        const timer = setInterval(() => {
          setReels([
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
          ]);
          elapsed += spinInterval;
          if (elapsed >= spinDuration) {
            clearInterval(timer);
            resolve();
          }
        }, spinInterval);
      });

      // 当たり判定
      const hitRate = isKakuhen ? 0.65 :
                      holdColor === 'rainbow' ? 0.85 :
                      holdColor === 'gold' ? 0.5 :
                      holdColor === 'red' ? 0.25 : 0.12;
      const isHit = Math.random() < hitRate;

      let finalReels;
      let points = 100;

      if (isHit) {
        const sym = Math.random() < 0.3 ? '7' :
                    Math.random() < 0.5 ? 'V' :
                    symbols[Math.floor(Math.random() * symbols.length)];
        finalReels = [sym, sym, sym];
        points = sym === '7' ? 7777 : sym === 'V' ? 5000 : 3000;
      } else {
        const reachRate = holdColor === 'rainbow' ? 0.9 :
                          holdColor === 'gold' ? 0.7 :
                          holdColor === 'red' ? 0.5 : 0.3;
        if (Math.random() < reachRate) {
          const sym = symbols[Math.floor(Math.random() * symbols.length)];
          const other = symbols.filter(s => s !== sym)[Math.floor(Math.random() * (symbols.length - 1))];
          finalReels = [sym, sym, other];
          points = 200;
        } else {
          finalReels = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
          ];
          points = 100;
        }
      }

      // 図柄停止
      setReels([finalReels[0], '？', '？']);
      await new Promise(r => setTimeout(r, 400));

      setReels([finalReels[0], finalReels[1], '？']);

      // リーチ判定
      if (finalReels[0] === finalReels[1]) {
        triggerFlash('yellow', 3);
        playSound('reach');
        setReachType('normal');
        showAnnouncementText('リーチ!!', 'reach');
        await new Promise(r => setTimeout(r, 1500));

        // SPリーチ発展
        const spRate = holdColor === 'rainbow' ? 0.9 :
                       holdColor === 'gold' ? 0.6 :
                       holdColor === 'red' ? 0.4 : 0.2;

        if (Math.random() < spRate) {
          triggerShake(1000);
          playSound('spTransition');
          setReachType('sp');
          showAnnouncementText('SP REACH!!', 'spReach');
          triggerFlash('purple', 5, 80);
          await new Promise(r => setTimeout(r, 2000));

          // 役物演出
          if (Math.random() > 0.4) {
            setShowYakumono(true);
            playSound('yakumono');
            triggerShake(600);
            showAnnouncementText('役物落下!!', 'yakumono');
            await new Promise(r => setTimeout(r, 1500));
            setShowYakumono(false);
          }

          // SPリーチBGM
          bgmRef.current = soundManager.playBgm('spReachBgm');
          await new Promise(r => setTimeout(r, 2500));
          soundManager.stopBgm(bgmRef.current);

          // ボタン演出
          const buttonRand = Math.random();
          if (buttonRand < 0.3) {
            setButtonType('deka');
            setShowButton(true);
            showAnnouncementText('でかボタン!!', 'dekaButton');
          } else if (buttonRand < 0.6) {
            setButtonType('renda');
            setShowButton(true);
            showAnnouncementText('連打!!', 'renda');
          } else {
            setButtonType('normal');
            setShowButton(true);
          }

          await new Promise(r => setTimeout(r, 2000));
          playSound('swordPush');
          setShowButton(false);
          await new Promise(r => setTimeout(r, 500));
        }

        // キセル演出
        if (isHit && Math.random() > 0.5) {
          const fakeSymbol = symbols.filter(s => s !== finalReels[0])[0];
          setReels([finalReels[0], finalReels[1], fakeSymbol]);
          await new Promise(r => setTimeout(r, 800));

          triggerFlash('cyan', 2);
          showAnnouncementText('滑り!!', 'kiseru');
          await new Promise(r => setTimeout(r, 600));
        }
      } else {
        await new Promise(r => setTimeout(r, 400));
      }

      // 最終停止
      setReels(finalReels);
      setReachType(null);

      // 結果判定
      if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
        const isConfirm = finalReels[0] === '7' || finalReels[0] === 'V';

        triggerShake(1500);
        setShowRainbow(true);
        playSound('toukaku');
        triggerFlash('gold', 8, 60);

        await new Promise(r => setTimeout(r, 1500));

        playSound('ooatari');
        showAnnouncementText(
          isConfirm ? '🎊 確変大当たり!! 🎊' : '🎉 大当たり!! 🎉',
          'ooatari',
          4000
        );

        await new Promise(r => setTimeout(r, 3500));
        setShowRainbow(false);

        // V入賞
        playSound('vEntry');
        showAnnouncementText('V入賞!!', 'v');
        triggerFlash('cyan', 3);
        await new Promise(r => setTimeout(r, 1500));

        // ラウンド消化
        let roundPoints = 0;
        for (let round = 1; round <= 10; round++) {
          playSound('roundStart');
          showAnnouncementText(`ROUND ${round}`, 'round', 1000);

          for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 60));
            playSound('getTama', { volume: 0.3 });
            roundPoints += 10;
            setTotalPoints(prev => prev + 10);
          }
          await new Promise(r => setTimeout(r, 300));
        }

        setShowPointGain(roundPoints + points);
        setTimeout(() => setShowPointGain(null), 2000);

        // 確変突入判定
        if (isConfirm || Math.random() > 0.35) {
          setIsKakuhen(true);
          setKakuhenCount(prev => prev + 1);
          setContinuationRate(isConfirm ? 82 : 65);
          playSound('kakuhenStart');
          triggerFlash('cyan', 6, 80);
          setCurrentStage('fever');
          showAnnouncementText('⚡ 確変突入!! ⚡', 'kakuhen', 3000);
          await new Promise(r => setTimeout(r, 2500));
          showAnnouncementText(`継続率 ${isConfirm ? 82 : 65}%`, 'rate');
        } else {
          setIsKakuhen(false);
          setContinuationRate(0);
          setCurrentStage('normal');
          showAnnouncementText('通常モードへ', 'normal');
        }

        setResult('OOATARI');

        setTodos(prev => prev.map(t =>
          t.id === currentHold.todoId ? { ...t, completed: true } : t
        ));
      } else {
        setResult('HAZURE');
        setTotalPoints(prev => prev + points);
        setShowPointGain(points);
        setTimeout(() => setShowPointGain(null), 1500);

        if (isKakuhen && Math.random() > (continuationRate / 100)) {
          setIsKakuhen(false);
          setCurrentStage('normal');
          showAnnouncementText('確変終了...', 'end');
        }
      }

      setIsSpinning(false);
      processingRef.current = false;
    };

    setTimeout(processHold, 600);
  }, [holds, isSpinning, isKakuhen, continuationRate, playSound, todos]);

  const handleTodoClick = (todo) => {
    if (todo.completed || holds.length >= 4) return;
    addHold(todo.id);
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
    setNewTodo('');
  };

  const resetGame = () => {
    setTodos(todos.map(t => ({ ...t, completed: false })));
    setHolds([]);
    setIsKakuhen(false);
    setKakuhenCount(0);
    setContinuationRate(0);
    setCurrentStage('normal');
    setTotalPoints(0);
  };

  const getHoldBallStyle = (color) => {
    const baseStyle = "w-10 h-10 rounded-full hold-ball transition-all duration-300";
    switch(color) {
      case 'green':
        return `${baseStyle} bg-gradient-to-br from-green-300 via-green-500 to-green-700`;
      case 'red':
        return `${baseStyle} bg-gradient-to-br from-red-300 via-red-500 to-red-700`;
      case 'gold':
        return `${baseStyle} bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 animate-glow-gold`;
      case 'rainbow':
        return `${baseStyle} animate-rainbow`;
      default:
        return `${baseStyle} bg-gradient-to-br from-blue-300 via-blue-500 to-blue-700`;
    }
  };

  const incompleteTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div className={`min-h-screen p-4 md:p-6 relative overflow-hidden transition-all duration-700 ${
      currentStage === 'fever' ? 'fever-bg' :
      currentStage === 'chance' ? 'chance-bg' : 'normal-bg'
    } ${shake ? 'animate-shake' : ''}`}>

      {/* Ambient particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Flash overlay */}
      {showFlash && (
        <div
          className="fixed inset-0 z-50 pointer-events-none transition-opacity"
          style={{ backgroundColor: flashColor, opacity: 0.85 }}
        />
      )}

      {/* Rainbow overlay */}
      {showRainbow && (
        <div className="fixed inset-0 z-40 pointer-events-none opacity-40 animate-rainbow" />
      )}

      {/* Announcement */}
      {announcement && (
        <div className={`fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
          text-3xl md:text-5xl font-black text-center px-8 py-5 rounded-2xl whitespace-nowrap
          backdrop-blur-md border-2
          ${announcement.type === 'ooatari' ? 'text-yellow-300 bg-gradient-to-r from-red-600/90 to-orange-500/90 border-yellow-400 animate-bounce scale-110' : ''}
          ${announcement.type === 'kakuhen' ? 'text-cyan-300 bg-gradient-to-r from-purple-700/90 to-blue-600/90 border-cyan-400 animate-pulse' : ''}
          ${announcement.type === 'reach' ? 'text-yellow-400 bg-black/80 border-yellow-500 animate-pulse' : ''}
          ${announcement.type === 'spReach' ? 'text-purple-300 bg-gradient-to-r from-purple-900/90 to-pink-800/90 border-purple-400 animate-pulse scale-105' : ''}
          ${announcement.type === 'atsui' ? 'text-red-400 bg-black/80 border-red-500 animate-pulse' : ''}
          ${announcement.type === 'rainbow' ? 'text-white bg-gradient-to-r from-red-500/90 via-yellow-500/90 to-blue-500/90 border-white animate-pulse' : ''}
          ${announcement.type === 'stageChange' ? 'text-cyan-300 bg-blue-900/80 border-cyan-500' : ''}
          ${announcement.type === 'yakumono' ? 'text-orange-400 bg-black/80 border-orange-500' : ''}
          ${announcement.type === 'dekaButton' || announcement.type === 'renda' ? 'text-yellow-300 bg-red-700/90 border-yellow-400' : ''}
          ${announcement.type === 'kiseru' ? 'text-cyan-400 bg-black/80 border-cyan-500' : ''}
          ${announcement.type === 'v' ? 'text-cyan-300 bg-indigo-900/80 border-cyan-400' : ''}
          ${announcement.type === 'round' ? 'text-white bg-orange-600/90 border-orange-400 text-2xl' : ''}
          ${announcement.type === 'rate' ? 'text-yellow-300 bg-purple-800/90 border-yellow-400 text-2xl' : ''}
          ${announcement.type === 'normal' || announcement.type === 'end' ? 'text-gray-300 bg-gray-800/80 border-gray-500 text-2xl' : ''}`}
          style={{
            textShadow: '0 0 30px currentColor, 0 0 60px currentColor',
            boxShadow: '0 0 40px rgba(0, 212, 255, 0.3), inset 0 0 60px rgba(255, 255, 255, 0.1)'
          }}
        >
          {announcement.text}
        </div>
      )}

      {/* ボタン演出 */}
      {showButton && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-45">
          <div className={`rounded-full flex items-center justify-center font-black text-white cursor-pointer
            border-4 border-white/50 transition-transform active:scale-95
            ${buttonType === 'deka' ? 'w-44 h-44 text-3xl bg-gradient-to-br from-red-400 via-red-600 to-red-800 animate-pulse' :
              buttonType === 'renda' ? 'w-36 h-36 text-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 animate-bounce' :
              'w-28 h-28 text-lg bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800'}`}
            style={{
              boxShadow: '0 0 60px rgba(255,255,255,0.5), inset 0 -8px 20px rgba(0,0,0,0.4), inset 0 8px 20px rgba(255,255,255,0.3)',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
            onClick={() => playSound('swordPush')}
          >
            {buttonType === 'renda' ? '連打!!' : 'PUSH'}
          </div>
        </div>
      )}

      {/* 役物 */}
      {showYakumono && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-30 animate-bounce">
          <div className="text-8xl" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 200, 0, 0.8))' }}>⚔️</div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6 relative z-10">
        <h1 className={`text-2xl md:text-4xl font-black mb-3 tracking-wider ${
          currentStage === 'fever' ? 'text-pink-300' :
          currentStage === 'chance' ? 'text-cyan-300' : 'text-blue-300'
        } ${currentStage === 'fever' ? 'animate-neon' : ''}`}
          style={{
            textShadow: currentStage === 'fever'
              ? '0 0 20px #ff00ff, 0 0 40px #ff00ff, 0 0 60px #ff00ff'
              : '0 0 20px currentColor, 0 0 40px currentColor'
          }}
        >
          {currentStage === 'fever' ? `🔥 確変 ${kakuhenCount}連継続中 🔥` :
           currentStage === 'chance' ? '⚡ CHANCE ZONE ⚡' :
           '🎰 PACHINKO TODO 🎰'}
        </h1>

        {isKakuhen && (
          <div className="text-xl text-yellow-400 font-bold mb-3 animate-pulse"
            style={{ textShadow: '0 0 20px #ffd700' }}>
            継続率: {continuationRate}%
          </div>
        )}

        <div className="flex justify-center gap-3 text-sm flex-wrap">
          <div className="glass-dark px-5 py-2.5 rounded-xl relative neon-border">
            <span className="text-gray-400 text-xs tracking-widest">POINTS</span>
            <div className="font-bold text-green-400 text-lg" style={{ textShadow: '0 0 10px #00ff88' }}>
              {totalPoints.toLocaleString()}
            </div>
            {showPointGain && (
              <span className="absolute -top-8 right-0 text-yellow-300 font-bold animate-bounce text-xl"
                style={{ textShadow: '0 0 15px #ffd700' }}>
                +{showPointGain.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-5 py-2.5 rounded-xl transition-all duration-300 font-bold tracking-wider ${
              soundEnabled
                ? 'glass-dark neon-border text-cyan-300'
                : 'bg-gray-800/50 text-gray-500 border border-gray-700'
            }`}
          >
            {soundEnabled ? '🔊 ON' : '🔇 OFF'}
          </button>
          {!soundLoaded && (
            <div className="px-5 py-2.5 rounded-xl glass-dark text-yellow-300 animate-pulse">
              Loading...
            </div>
          )}
        </div>
      </div>

      {/* 保留表示 */}
      <div className="flex justify-center items-center gap-4 mb-6">
        <span className="text-gray-500 text-sm tracking-widest font-bold">HOLD</span>
        <div className="flex gap-3 glass-dark px-4 py-3 rounded-2xl">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={holds[i]
                ? `${getHoldBallStyle(holds[i].color)} active`
                : 'w-10 h-10 rounded-full bg-gray-800/80 border-2 border-gray-700'
              }
            />
          ))}
        </div>
      </div>

      {/* スロットマシン */}
      <div className={`max-w-lg mx-auto mb-8 transition-all duration-500 ${reachType === 'sp' ? 'scale-105' : ''}`}>
        {/* 筐体外枠 */}
        <div className="relative p-1 rounded-3xl"
          style={{
            background: 'linear-gradient(180deg, #ffd700 0%, #b8860b 50%, #8b6914 100%)',
            boxShadow: currentStage === 'fever'
              ? '0 0 60px rgba(255, 0, 255, 0.6), 0 0 100px rgba(255, 0, 255, 0.3)'
              : reachType
              ? '0 0 50px rgba(255, 215, 0, 0.5), 0 0 100px rgba(255, 215, 0, 0.2)'
              : '0 0 30px rgba(0, 212, 255, 0.3), 0 0 60px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* 筐体内側 */}
          <div className="bg-gradient-to-b from-gray-900 via-gray-950 to-black p-5 rounded-[22px] relative overflow-hidden">
            {/* スキャンライン効果 */}
            <div className="absolute inset-0 scanlines pointer-events-none opacity-30" />

            {/* ステージ表示 */}
            <div className={`text-center text-xs tracking-[0.3em] font-bold mb-4 py-1 rounded-full ${
              currentStage === 'fever' ? 'bg-pink-900/50 text-pink-400' :
              currentStage === 'chance' ? 'bg-cyan-900/50 text-cyan-400' :
              'bg-gray-800/50 text-gray-500'
            }`}>
              {currentStage === 'fever' ? 'FEVER MODE' : currentStage === 'chance' ? 'CHANCE ZONE' : 'NORMAL'}
            </div>

            {/* リール */}
            <div className="flex justify-center gap-3 mb-4">
              {reels.map((symbol, index) => (
                <div
                  key={index}
                  className="relative"
                >
                  {/* リール枠 */}
                  <div className={`w-24 h-28 rounded-xl flex items-center justify-center
                    text-5xl font-black transition-all duration-200 slot-reel
                    ${reachType && index < 2 && reels[0] === reels[1] ? 'neon-border-gold' : ''}`}
                  >
                    <span className={`relative z-10 ${
                      symbol === '7' ? 'text-red-500' :
                      symbol === 'V' ? 'text-purple-400' :
                      symbol === '👑' ? '' :
                      'text-yellow-400'
                    }`}
                      style={{
                        textShadow: symbol === '7'
                          ? '0 0 20px #ff0000, 0 0 40px #ff0000'
                          : symbol === 'V'
                          ? '0 0 20px #a855f7, 0 0 40px #a855f7'
                          : '0 0 15px currentColor',
                        filter: isSpinning ? 'blur(2px)' : 'none'
                      }}
                    >
                      {symbol}
                    </span>
                  </div>
                  {/* リール番号 */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 font-bold">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* リーチ表示 */}
            {reachType && (
              <div className={`text-center font-black mb-3 py-2 rounded-lg ${
                reachType === 'sp'
                  ? 'text-purple-400 bg-purple-900/50 text-xl tracking-widest animate-pulse'
                  : 'text-yellow-400 bg-yellow-900/30 tracking-wider'
              }`}
                style={{ textShadow: '0 0 20px currentColor' }}
              >
                {reachType === 'sp' ? '★ SP REACH ★' : '- REACH -'}
              </div>
            )}

            {/* 大当たり表示 */}
            {result === 'OOATARI' && !isSpinning && (
              <div className="text-center text-2xl font-black text-yellow-400 animate-pulse py-2"
                style={{ textShadow: '0 0 30px #ffd700, 0 0 60px #ffd700' }}>
                🎊 大当たり!! 🎊
              </div>
            )}
          </div>
        </div>
      </div>

      {/* タスク追加 */}
      <div className="max-w-lg mx-auto mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="新しいタスクを入力..."
            className="flex-1 px-5 py-3.5 rounded-xl glass-dark text-white
              border border-cyan-500/30 focus:border-cyan-400
              focus:outline-none focus:ring-2 focus:ring-cyan-500/30
              placeholder-gray-500 transition-all duration-300"
          />
          <button
            onClick={addTodo}
            className="px-7 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold
              rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-all duration-300
              active:scale-95 tracking-wider neon-border"
          >
            追加
          </button>
        </div>
      </div>

      {/* タスクリスト */}
      <div className="max-w-lg mx-auto space-y-3">
        {incompleteTodos.map((todo) => {
          const inHold = holds.some(h => h.todoId === todo.id);
          return (
            <div
              key={todo.id}
              onClick={() => handleTodoClick(todo)}
              className={`task-card p-4 rounded-xl cursor-pointer glass-dark
                ${inHold ? 'opacity-60 scale-[0.98] border-yellow-500/50' : 'border-cyan-500/20'}
                ${holds.length >= 4 && !inHold ? 'opacity-50' : ''}
                border hover:border-cyan-400/50`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
                  ${inHold
                    ? 'border-yellow-400 bg-yellow-400/20 shadow-lg shadow-yellow-500/30'
                    : 'border-cyan-500/50 hover:border-cyan-400'}`}
                >
                  {inHold
                    ? <span className="text-yellow-400 text-xs font-bold">待</span>
                    : <span className="text-cyan-500/50 text-sm">○</span>
                  }
                </div>
                <span className="text-white font-medium flex-1">{todo.text}</span>
                <div className={`text-xs px-3 py-1 rounded-full ${
                  inHold
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : holds.length >= 4
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-cyan-500/10 text-cyan-500/70'
                }`}>
                  {inHold ? '保留中' : holds.length >= 4 ? 'MAX' : 'TAP'}
                </div>
              </div>
            </div>
          );
        })}

        {completedTodos.length > 0 && (
          <div className="pt-6 mt-6 border-t border-gray-700/50">
            <div className="text-gray-500 text-sm mb-3 tracking-widest font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              COMPLETED ({completedTodos.length})
            </div>
            {completedTodos.map((todo) => (
              <div
                key={todo.id}
                className="p-3 rounded-xl bg-gray-900/30 border border-gray-800/50 mb-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 line-through">{todo.text}</span>
                </div>
              </div>
            ))}
            <button
              onClick={resetGame}
              className="w-full mt-4 py-3 text-gray-500 text-sm hover:text-white
                transition-all duration-300 rounded-xl border border-gray-700/50
                hover:border-gray-600 hover:bg-gray-800/30 tracking-widest font-bold"
            >
              RESET
            </button>
          </div>
        )}

        {incompleteTodos.length === 0 && completedTodos.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <div className="text-4xl mb-3">🎯</div>
            <div className="tracking-wider">タスクを追加してください</div>
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="text-center mt-10 text-gray-700 text-xs tracking-widest">
        PACHINKO TODO v1.0
      </div>
    </div>
  );
}
