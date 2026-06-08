// 修正子路径部署下的绝对路径资源引用（表情、图片等）
(function() {
  // 检测是否运行在子路径下（如 GitHub Pages 的 /simiaoChat/）
  // 如果页面 URL 的 pathname 不是 / 开头且长度>1，说明是子路径部署
  var basePath = (function() {
    var path = window.location.pathname;
    // 移除 /index.html 等后缀，获取基础路径
    var idx = path.lastIndexOf('/');
    return path.substring(0, idx) || '';
  })();

  // 如果 basePath 为空（根目录部署），不需要修正
  if (!basePath) return;

  function fixAbsoluteUrls() {
    // 修正所有 style 中的 background-image 绝对路径
    var links = document.querySelectorAll('[style*="background-image"]');
    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      if (el.dataset._pathFixed) continue; // 已修正过，跳过
      var bg = el.style.backgroundImage;
      if (!bg) continue;
      // 匹配 url("/...") 或 url(/...)
      if (bg.indexOf('url("/') !== -1) {
        // url("/assets/emoji/...") → url("/simiaoChat/assets/emoji/...")
        el.style.backgroundImage = bg.replace(/url\("\//g, 'url("' + basePath + '/');
        el.dataset._pathFixed = '1';
      } else if (bg.indexOf('url(/') !== -1) {
        // url(/assets/emoji/...) → url(/simiaoChat/assets/emoji/...)
        el.style.backgroundImage = bg.replace(/url\(\//g, 'url(' + basePath + '/');
        el.dataset._pathFixed = '1';
      }
    }

    // 修正所有 img src 绝对路径
    var imgs = document.querySelectorAll('img[src^="/"]');
    for (var j = 0; j < imgs.length; j++) {
      if (imgs[j].dataset._pathFixed) continue;
      imgs[j].src = basePath + imgs[j].getAttribute('src');
      imgs[j].dataset._pathFixed = '1';
    }

    // 修正所有 a[href^="/"] 绝对路径（排除表情元素，它们用 background-image）
    var anchors = document.querySelectorAll('a[href^="/"]');
    for (var k = 0; k < anchors.length; k++) {
      if (anchors[k].dataset._pathFixed) continue;
      anchors[k].href = basePath + anchors[k].getAttribute('href');
      anchors[k].dataset._pathFixed = '1';
    }
  }

  window.addEventListener('load', function() {
    fixAbsoluteUrls();
    // 延迟再执行一次，处理 React 动态渲染的内容
    setTimeout(fixAbsoluteUrls, 1000);
    setTimeout(fixAbsoluteUrls, 3000);
  });

  // MutationObserver 持续监听 DOM 变化，修正动态添加的绝对路径
  var observer = new MutationObserver(function() {
    fixAbsoluteUrls();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();

// 输入框占位文字改为"发送信息"
(function() {
  function fixInputText() {
    var input = document.querySelector('.bottom_input__lRJK3');
    if (input) {
      input.textContent = '发送信息';
    }
  }
  window.addEventListener('load', function() {
    fixInputText();
    setTimeout(fixInputText, 2000);
  });
})();

// 导航栏"在线"标识 - 确保React重新渲染后不丢失
(function() {
  function ensureOnlineStatus() {
    var navCenter = document.querySelector('.navbar_center__8V1lD');
    if (!navCenter) return;
    var existing = navCenter.querySelector('.online-status');
    if (existing) return;
    var statusDiv = document.createElement('div');
    statusDiv.className = 'online-status';
    statusDiv.innerHTML = '<span class="online-dot"></span><span class="online-text">在线</span>';
    navCenter.appendChild(statusDiv);
  }
  window.addEventListener('load', function() {
    ensureOnlineStatus();
    setTimeout(ensureOnlineStatus, 2000);
  });
})();

// 系统消息时间格式化
(function() {
  /**
   * 将时间戳或已有时间字符串格式化为目标格式：
   * - 今天："上午 08:30" / "下午 14:34"
   * - 昨天："昨天 12:33"
   * - 其他："4月27日"
   */
  function formatNoticeTime(ts) {
    var d;
    // 支持纯数字时间戳（毫秒或秒）
    if (/^\d+$/.test(String(ts))) {
      var n = Number(ts);
      // 秒级时间戳（10位）转毫秒
      if (n < 1e12) n *= 1000;
      d = new Date(n);
    } else {
      d = new Date(ts);
    }
    if (isNaN(d.getTime())) return null;

    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var yesterdayStart = new Date(todayStart.getTime() - 86400000);
    var msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    var hh = d.getHours();
    var mm = d.getMinutes();
    var mmStr = mm < 10 ? '0' + mm : String(mm);

    if (msgDay.getTime() === todayStart.getTime()) {
      // 今天
      var period = hh < 12 ? '上午' : '下午';
      return period + ' ' + hh + ':' + mmStr;
    } else if (msgDay.getTime() === yesterdayStart.getTime()) {
      // 昨天
      return '昨天 ' + hh + ':' + mmStr;
    } else {
      // 其他日期
      return (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }
  }

  // 判断文本是否为需要格式化的时间（纯数字时间戳 or 已有时间格式）
  function shouldFormat(text) {
    text = text.trim();
    // 纯数字时间戳
    if (/^\d{10,13}$/.test(text)) return true;
    // ISO格式 或 常见日期格式
    if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(text)) return true;
    return false;
  }

  function processNoticeSpan(span) {
    if (span.dataset.timeFmt === '1') return; // 已处理过
    var text = span.textContent.trim();
    if (!shouldFormat(text)) return;
    var result = formatNoticeTime(text);
    if (result) {
      span.textContent = result;
      span.dataset.timeFmt = '1';
    }
  }

  function processAllNotices() {
    // .item_notice__PooWZ 下的 span 标签包含时间文本
    var notices = document.querySelectorAll('.item_notice__PooWZ span');
    for (var i = 0; i < notices.length; i++) {
      processNoticeSpan(notices[i]);
    }
  }

  // MutationObserver 监听聊天列表区域
  var observer = null;
  var processing = false;

  function startObserver() {
    var chatList = document.querySelector('.dialog_list__znkBo');
    if (!chatList) return;
    if (observer) return; // 已启动

    observer = new MutationObserver(function() {
      if (processing) return;
      processing = true;
      // 用 setTimeout 异步处理，避免在回调内修改DOM导致循环
      setTimeout(function() {
        processAllNotices();
        processing = false;
      }, 0);
    });
    observer.observe(chatList, { childList: true, subtree: true, characterData: true });
    processAllNotices(); // 立即处理已有内容
  }

  window.addEventListener('load', function() {
    processAllNotices();
    setTimeout(startObserver, 1000);
    setTimeout(processAllNotices, 2000);
  });
})();
