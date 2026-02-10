// サウンドマネージャー
// public/sounds/ に音声ファイルを配置して使用

class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.35;
    
    // 音声ファイルのマッピング
    // public/sounds/ に以下のファイル名で配置してください
    this.soundFiles = {
      // 保留系
      holdIn: 'hold_in.mp3',                  // 牙狼剣保留音 / ガロ保留音（赤）
      holdChange: 'hold_change.mp3',          // 変動開始時エンブレム完成音（チャンス）
      holdRainbow: 'hold_rainbow.mp3',        // 変動開始時エンブレム完成音（激アツ）

      // 予告系
      gekiatsu: 'gekiatsu.mp3',               // ガロフラッシュ音（赤）/ ガロロゴフラッシュ音（赤）
      impact: 'impact.mp3',                   // インパクト予告（牙狼斬馬剣）/ 牙狼剣エンブレム先読み音

      // リーチ系
      reach: 'reach.mp3',                     // 牙狼SPリーチ/タイトル（赤）
      spTransition: 'sp_transition.mp3',      // F.O.G.完成音 / G.F.O.G.完成音

      // 役物系
      yakumono: 'yakumono.mp3',               // 牙狼剣飛び出し音 / 牙狼斬馬剣飛び出し音
      swordPush: 'sword_push.mp3',            // 牙狼剣押下成功音

      // 大当たり系
      toukaku: 'toukaku.mp3',                 // F.O.G.完成音（大当り時）/ 限界即破逆エンブレム/ブラックアウト音
      ooatari: 'ooatari.mp3',                 // BATTLE BONUS 3000獲得音 / 極限7500バトル勝利音
      vEntry: 'v_entry.mp3',                  // 連続予告後タイトル（VICTORY）/ Victory7図柄獲得音

      // 確変系
      kakuhenStart: 'kakuhen_start.mp3',      // THROUGHOUT BONUS継続音 / 月虹SPECIAL BONUS 3000突入音

      // ラウンド系
      roundStart: 'round_start.mp3',          // 昇格演出中/図柄昇格成功音
      getTama: 'get_tama.mp3',                // GOD OF GARO 7500獲得音（短くカットして使用）

      // BGM
      spReachBgm: 'sp_reach_bgm.mp4',         // CLIMAX BATTLE BGM
      feverBgm: 'fever_bgm.mp4',              // 鋼コレクションBGM
    };
  }

  // 音声をプリロード
  async preload() {
    const loadPromises = Object.entries(this.soundFiles).map(async ([key, filename]) => {
      try {
        const audio = new Audio(`/sounds/${filename}`);
        audio.preload = 'auto';
        audio.volume = this.volume;
        
        await new Promise((resolve, reject) => {
          audio.addEventListener('canplaythrough', resolve, { once: true });
          audio.addEventListener('error', () => {
            console.warn(`Sound not found: ${filename} - using fallback`);
            resolve(); // エラーでも続行
          }, { once: true });
          
          // タイムアウト
          setTimeout(resolve, 3000);
        });
        
        this.sounds[key] = audio;
      } catch (e) {
        console.warn(`Failed to load sound: ${filename}`);
      }
    });

    await Promise.all(loadPromises);
    console.log('Sounds loaded:', Object.keys(this.sounds));
  }

  // 音声再生
  play(soundKey, options = {}) {
    if (!this.enabled) return;

    const sound = this.sounds[soundKey];
    if (!sound) {
      // フォールバック: Web Audio APIで代替音を生成
      this.playFallback(soundKey);
      return;
    }

    try {
      // 同じ音を重ねて再生するためにclone
      const clone = sound.cloneNode();
      clone.volume = options.volume ?? this.volume;
      clone.playbackRate = options.rate ?? 1;
      clone.play().catch(e => console.warn('Playback failed:', e));
      
      return clone;
    } catch (e) {
      console.warn('Sound play error:', e);
    }
  }

  // BGM再生（ループ対応）
  playBgm(soundKey) {
    if (!this.enabled) return null;
    
    const sound = this.sounds[soundKey];
    if (!sound) return null;

    try {
      const bgm = sound.cloneNode();
      bgm.volume = this.volume * 0.6;
      bgm.loop = true;
      bgm.play().catch(e => console.warn('BGM playback failed:', e));
      return bgm;
    } catch (e) {
      return null;
    }
  }

  // BGM停止
  stopBgm(bgmInstance) {
    if (bgmInstance) {
      bgmInstance.pause();
      bgmInstance.currentTime = 0;
    }
  }

  // フォールバック音声（Web Audio API）
  playFallback(soundKey) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 音の種類によって周波数を変える
    const tones = {
      holdIn: { freq: 1400, duration: 0.15, type: 'sine' },
      holdChange: { freq: 1800, duration: 0.2, type: 'square' },
      holdRainbow: { freq: 2200, duration: 0.3, type: 'sawtooth' },
      gekiatsu: { freq: 150, duration: 0.4, type: 'sawtooth' },
      reach: { freq: 800, duration: 0.3, type: 'square' },
      toukaku: { freq: 100, duration: 0.5, type: 'sawtooth' },
      ooatari: { freq: 523, duration: 0.4, type: 'square' },
      default: { freq: 600, duration: 0.15, type: 'sine' },
    };

    const tone = tones[soundKey] || tones.default;
    
    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.freq, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + tone.duration);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + tone.duration);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

export const soundManager = new SoundManager();
export default soundManager;
