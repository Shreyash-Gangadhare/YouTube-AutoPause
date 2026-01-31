(function() {
  'use strict';

  const DEBUG = true; // Set to false to disable logs

  let video = null;
  let wasPlaying = false;
  let autoPaused = false;

  // Get video element
  function getVideo() {
    if (video && document.contains(video)) return video;
    
    video = document.querySelector('video.html5-main-video') || 
            document.querySelector('video.video-stream') ||
            document.querySelector('video');
    
    return video;
  }

  // Check if YouTube settings/menu is open
  function isSettingsOpen() {
    const settings = document.querySelector('.ytp-settings-menu');
    if (settings) {
      const style = window.getComputedStyle(settings);
      return style.display !== 'none';
    }
    return false;
  }

  // Pause video
  function pauseVideo() {
    const v = getVideo();
    if (!v || v.paused) return;
    
    // Don't pause if settings menu is open
    if (isSettingsOpen()) {
      if (DEBUG) console.log('⏭️ Skipped pause - settings open');
      return;
    }
    
    wasPlaying = true;
    autoPaused = true;
    v.pause();
    
    if (DEBUG) console.log('⏸️ Paused');
  }

  // Resume video
  function resumeVideo() {
    const v = getVideo();
    if (!v || !wasPlaying || !autoPaused) return;
    
    // Don't resume if settings menu is open
    if (isSettingsOpen()) {
      if (DEBUG) console.log('⏭️ Skipped resume - settings open');
      return;
    }
    
    autoPaused = false;
    
    // Wait a moment before playing to avoid blank screen
    setTimeout(() => {
      if (v && v.paused) {
        v.play()
          .then(() => {
            if (DEBUG) console.log('▶️ Resumed');
          })
          .catch(() => {
            wasPlaying = false;
            if (DEBUG) console.log('⚠️ Play blocked');
          });
      }
    }, 100);
  }

  // Track user play/pause
  function attachListeners() {
    const v = getVideo();
    if (!v) return;
    
    v.addEventListener('play', () => {
      if (!autoPaused) {
        wasPlaying = true;
        if (DEBUG) console.log('User played');
      }
    }, { passive: true });
    
    v.addEventListener('pause', () => {
      if (!autoPaused) {
        wasPlaying = false;
        if (DEBUG) console.log('User paused');
      }
    }, { passive: true });
    
    if (DEBUG) console.log('✅ Listeners attached');
  }

  // Handle visibility change
  function onVisibilityChange() {
    if (document.hidden) {
      pauseVideo();
    } else {
      resumeVideo();
    }
  }

  // Initialize
  function init() {
    const v = getVideo();
    if (v) {
      attachListeners();
      if (!v.paused) wasPlaying = true;
    }
  }

  // Find video with retry
  let attempts = 0;
  const findVideo = setInterval(() => {
    if (getVideo()) {
      clearInterval(findVideo);
      init();
      if (DEBUG) console.log('✅ Video found');
    }
    if (++attempts > 20) clearInterval(findVideo);
  }, 200);

  // Visibility API - main trigger
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Window focus/blur - backup
  window.addEventListener('blur', pauseVideo, { passive: true });
  window.addEventListener('focus', resumeVideo, { passive: true });

  // Handle YouTube navigation
  let currentUrl = location.href;
  setInterval(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      wasPlaying = false;
      autoPaused = false;
      video = null;
      
      setTimeout(() => {
        if (getVideo()) init();
      }, 500);
      
      if (DEBUG) console.log('🔄 Page changed');
    }
  }, 1000);

  if (DEBUG) console.log('🚀 Extension loaded');

})();