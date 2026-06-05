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
