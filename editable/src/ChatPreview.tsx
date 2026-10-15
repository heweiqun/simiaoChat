import { forwardRef } from 'react';
import {
  ChevronLeft,
  Ellipsis,
  AudioLines,
  Smile,
  PlusCircle,
  Wifi,
  Signal,
} from 'lucide-react';
import type { Draft, Role } from './model';
export function Avatar({ role }: { role: Role }) {
  return role.avatar ? (
    <img className="avatar" src={role.avatar} alt={role.name} />
  ) : (
    <div className={`avatar initials ${role.self ? 'self' : ''}`}>
      {role.name.slice(0, 1) || '喵'}
    </div>
  );
}
const ChatPreview = forwardRef<HTMLDivElement, { draft: Draft }>(
  ({ draft }, ref) => {
    const { settings: s, roles, messages } = draft;
    return (
      <div
        className="phone"
        ref={ref}
        style={{ width: s.width, minHeight: s.height }}
      >
        <div className="status-bar">
          <strong>{s.time}</strong>
          <span className="status-icons">
            <Signal size={17} fill="currentColor" />
            <Wifi size={17} />
            <span className="battery">
              <i
                style={{ width: `${Math.max(0, Math.min(100, s.battery))}%` }}
              />
            </span>
          </span>
        </div>
        <div className="chat-header">
          <ChevronLeft size={26} />
          <div>
            <strong>{s.title || '未命名对话'}</strong>
            {s.online && (
              <small>
                <i />
                在线
              </small>
            )}
          </div>
          <Ellipsis size={26} />
        </div>
        <div className="chat-messages">
          <div className="time-notice">今天 {s.time}</div>
          {messages.map((m) => {
            const role = roles.find((r) => r.id === m.roleId);
            if (!role) return null;
            return (
              <div key={m.id} className={`chat-row ${role.self ? 'mine' : ''}`}>
                <Avatar role={role} />
                <div className="message-body">
                  {!role.self && (
                    <span className="sender-name">{role.name}</span>
                  )}
                  <div
                    className={`bubble ${m.type === 'image' ? 'image-bubble' : ''}`}
                  >
                    {m.type === 'text' ? (
                      m.content
                    ) : (
                      <img src={m.content} alt="图片消息" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="chat-input">
          <AudioLines size={25} />
          <div>发送信息</div>
          <Smile size={25} />
          <PlusCircle size={25} />
        </div>
        <div className="home-bar">
          <i />
        </div>
      </div>
    );
  },
);
export default ChatPreview;
