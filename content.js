(function() {
  'use strict';

  // State tracking
  let videoElement = null;
  let wasPlayingBeforePause = false;
  let isAutoPaused = false;
  let observerInstance = null;
  let checkInterval = null;

  // Find YouTube video element
  function findVideoElement() {
    // Primary YouTube video player
    const primary = document.querySelector('video.html5-main-video');
    if (primary) return primary;

    // Fallback: any video element on YouTube
    const videos = document.querySelectorAll('video');
    return videos.length > 0 ? videos[0] : null;
  }

  // Initialize video monitoring
  function initializeVideoMonitoring() {
    videoElement = findVideoElement();
    
    if (!videoElement) {
      // Retry after DOM updates
      if (!checkInterval) {
        checkInterval = setInterval(() => {
          videoElement = findVideoElement();
          if (videoElement) {
            clearInterval(checkInterval);
            checkInterval = null;
            attachVideoListeners();
          }
        }, 500);
        
        // Stop checking after 10 seconds
        setTimeout(() => {
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }
        }, 10000);
      }
      return;
    }

    attachVideoListeners();
  }

  // Attach event listeners to video element
  function attachVideoListeners() {
    if (!videoElement) return;

    // Track manual play/pause by user
    videoElement.addEventListener('play', () => {
      if (!isAutoPaused) {
        wasPlayingBeforePause = true;
        notifyBackgroundState(true, false);
      }
    });

    videoElement.addEventListener('pause', () => {
      if (!isAutoPaused) {
        wasPlayingBeforePause = false;
        notifyBackgroundState(false, false);
      }
    });

    // Use MutationObserver for dynamic video element changes
    setupMutationObserver();
  }

  // Setup observer for DOM changes (YouTube's SPA navigation)
  function setupMutationObserver() {
    if (observerInstance) {
      observerInstance.disconnect();
    }

    observerInstance = new MutationObserver((mutations) => {
      const currentVideo = findVideoElement();
      if (currentVideo && currentVideo !== videoElement) {
        videoElement = currentVideo;
        attachVideoListeners();
      }
    });

    observerInstance.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Pause video (auto-pause)
  function autoPauseVideo() {
    if (!videoElement) return;
    
    if (!videoElement.paused) {
      wasPlayingBeforePause = true;
      isAutoPaused = true;
      videoElement.pause();
      notifyBackgroundState(false, true);
    }
  }

  // Resume video (auto-resume)
  function autoResumeVideo() {
    if (!videoElement) return;
    
    if (wasPlayingBeforePause && isAutoPaused) {
      isAutoPaused = false;
      videoElement.play().catch(() => {
        // Auto-play blocked - respect browser policy
        wasPlayingBeforePause = false;
      });
      notifyBackgroundState(true, false);
    }
  }

  // Handle visibility changes using Page Visibility API
  function handleVisibilityChange() {
    if (document.hidden) {
      autoPauseVideo();
    } else {
      autoResumeVideo();
    }
  }

  // Notify background script of video state
  function notifyBackgroundState(isPlaying, wasAutoPaused) {
    chrome.runtime.sendMessage({
      action: "VIDEO_STATE_CHANGED",
      isPlaying,
      wasAutoPaused
    }).catch(() => {});
  }

  // Message handler from background script
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.action) {
      case "TAB_FOCUSED":
      case "WINDOW_FOCUSED":
        autoResumeVideo();
        break;
      
      case "TAB_UNFOCUSED":
      case "WINDOW_UNFOCUSED":
        autoPauseVideo();
        break;
      
      case "INIT":
        initializeVideoMonitoring();
        break;
    }
  });

  // Page Visibility API listener
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Window focus/blur listeners (additional layer)
  window.addEventListener('blur', autoPauseVideo);
  window.addEventListener('focus', autoResumeVideo);

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVideoMonitoring);
  } else {
    initializeVideoMonitoring();
  }

  // YouTube SPA navigation detection
  let lastUrl = location.href;
  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      // Reset state on navigation
      wasPlayingBeforePause = false;
      isAutoPaused = false;
      initializeVideoMonitoring();
    }
  }).observe(document, { subtree: true, childList: true });

})();