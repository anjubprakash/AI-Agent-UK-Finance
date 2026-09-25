/**
 * UK Financial Rules AI Compliance Widget Loader (widget.js)
 * Drop this single <script> onto any external website to mount the isolated
 * React Compliance Widget iframe + floating launcher button + dimmed page backdrop.
 */
(function () {
  if (window.__UK_FINANCE_WIDGET_LOADED__) return;
  window.__UK_FINANCE_WIDGET_LOADED__ = true;

  var scriptEl = document.currentScript;
  var widgetUrl =
    (scriptEl && scriptEl.getAttribute('data-widget-url')) ||
    'http://localhost:8080/widget?embed=true';
  var buttonLabel =
    (scriptEl && scriptEl.getAttribute('data-label')) ||
    'Ask UK Compliance AI';

  var isOpen = false;

  // Dimmed Backdrop Overlay over the host page when open
  var backdrop = document.createElement('div');
  backdrop.id = 'uk-finance-ai-widget-backdrop';
  backdrop.style.cssText =
    'position:fixed;inset:0;z-index:2147483646;background:rgba(12,22,20,0.58);backdrop-filter:blur(3.5px);display:none;opacity:0;transition:opacity 0.2s ease;';

  var container = document.createElement('div');
  container.id = 'uk-finance-ai-widget-root';
  container.style.cssText =
    'position:fixed;bottom:24px;right:24px;z-index:2147483647;display:flex;flex-direction:column;align-items:flex-end;font-family:Inter,system-ui,-apple-system,sans-serif;';

  var iframeWrapper = document.createElement('div');
  iframeWrapper.style.cssText =
    'width:400px;max-width:calc(100vw - 32px);height:590px;max-height:calc(100vh - 110px);margin-bottom:12px;border-radius:20px;overflow:hidden;box-shadow:0 28px 70px rgba(0,0,0,0.45),0 0 0 1px rgba(167,243,208,0.35);background:#ffffff;display:none;transition:opacity 0.2s ease,transform 0.2s ease;opacity:0;transform:translateY(10px);';

  var iframe = document.createElement('iframe');
  iframe.src = widgetUrl;
  iframe.title = 'UK Financial Rules AI Compliance Widget';
  iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
  iframe.setAttribute('allow', 'clipboard-write');
  iframeWrapper.appendChild(iframe);

  var launcherBtn = document.createElement('button');
  launcherBtn.type = 'button';
  launcherBtn.setAttribute('aria-label', buttonLabel);
  launcherBtn.style.cssText =
    'height:54px;padding:0 20px;border-radius:9999px;border:none;cursor:pointer;background:linear-gradient(135deg,#1B3B33 0%,#2F5D50 100%);color:#ffffff;font-size:14px;font-weight:700;display:flex;align-items:center;gap:10px;box-shadow:0 12px 32px rgba(27,59,51,0.45);transition:transform 0.15s ease,box-shadow 0.15s ease;';

  var renderButtonContent = function () {
    if (isOpen) {
      launcherBtn.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        '<span>Close Assistant</span>';
    } else {
      launcherBtn.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A7F3D0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>' +
        '<span>' +
        buttonLabel +
        '</span>';
    }
  };

  var toggleWidget = function (forceState) {
    isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      backdrop.style.display = 'block';
      iframeWrapper.style.display = 'block';
      requestAnimationFrame(function () {
        backdrop.style.opacity = '1';
        iframeWrapper.style.opacity = '1';
        iframeWrapper.style.transform = 'translateY(0)';
      });
    } else {
      document.body.style.overflow = '';
      backdrop.style.opacity = '0';
      iframeWrapper.style.opacity = '0';
      iframeWrapper.style.transform = 'translateY(10px)';
      setTimeout(function () {
        if (!isOpen) {
          backdrop.style.display = 'none';
          iframeWrapper.style.display = 'none';
        }
      }, 180);
    }
    renderButtonContent();
  };

  launcherBtn.addEventListener('click', function () {
    toggleWidget();
  });

  backdrop.addEventListener('click', function () {
    toggleWidget(false);
  });

  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'UK_FINANCE_WIDGET_CLOSE') {
      toggleWidget(false);
    }
  });

  renderButtonContent();
  container.appendChild(iframeWrapper);
  container.appendChild(launcherBtn);

  if (document.body) {
    document.body.appendChild(backdrop);
    document.body.appendChild(container);
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(backdrop);
      document.body.appendChild(container);
    });
  }
})();
