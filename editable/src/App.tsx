import { useEffect, useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
import {
  Cat,
  Users,
  MessageSquare,
  SlidersHorizontal,
  Download,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ImagePlus,
  Check,
  Pencil,
  X,
} from 'lucide-react';
import ChatPreview, { Avatar } from './ChatPreview';
import { loadDraft, readImage, uid, STORAGE_KEY } from './model';
import type { Message } from './model';
export default function App() {
  const [draft, setDraft] = useState(loadDraft);
  const [tab, setTab] = useState('messages');
  const [roleId, setRoleId] = useState(draft.roles[0].id);
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [type, setType] = useState<'text' | 'image'>('text');
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const [exporting, setExporting] = useState(false);
  const preview = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setSaveError('');
    } catch {
      setSaveError('浏览器存储空间不足，当前修改尚未保存；请减少图片数量。');
    }
  }, [draft]);
  const updateRole = (id: string, patch: object) =>
    setDraft((d) => ({
      ...d,
      roles: d.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  const cancelEdit = () => {
    setEditing(null);
    setText('');
    setImage('');
  };
  const deleteRole = (id: string) => {
    if (draft.roles.length === 1) return;
    const count = draft.messages.filter((m) => m.roleId === id).length;
    if (count && !window.confirm(`删除此角色及其 ${count} 条消息？`)) return;
    setDraft((d) => ({
      ...d,
      roles: d.roles
        .filter((r) => r.id !== id)
        .map((r, index, remaining) => ({
          ...r,
          self: remaining.some((role) => role.self) ? r.self : index === 0,
        })),
      messages: d.messages.filter((m) => m.roleId !== id),
    }));
    if (roleId === id) {
      setRoleId(draft.roles.find((r) => r.id !== id)!.id);
      cancelEdit();
    }
  };
  const upload = async (
    file: File | undefined,
    done: (url: string) => void,
  ) => {
    if (!file) return;
    try {
      done(await readImage(file));
      setNotice('');
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  const submit = () => {
    const content = type === 'text' ? text.trim() : image;
    if (!content) return;
    const message: Message = { id: editing || uid(), roleId, type, content };
    setDraft((d) => ({
      ...d,
      messages: editing
        ? d.messages.map((m) => (m.id === editing ? message : m))
        : [...d.messages, message],
    }));
    cancelEdit();
  };
  const move = (index: number, delta: number) =>
    setDraft((d) => {
      const messages = [...d.messages];
      const target = index + delta;
      if (target < 0 || target >= messages.length) return d;
      [messages[index], messages[target]] = [messages[target], messages[index]];
      return { ...d, messages };
    });
  const exportImage = async () => {
    if (!preview.current) return;
    setExporting(true);
    setNotice('');
    try {
      await document.fonts.ready;
      await Promise.all(
        Array.from(preview.current.querySelectorAll('img')).map((img) =>
          img.decode(),
        ),
      );
      const blob = await toBlob(preview.current, {
        pixelRatio: 3,
        backgroundColor: '#f7f8fb',
        cacheBust: false,
      });
      if (!blob) throw new Error('图片生成失败');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `四喵对话-${Date.now()}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setNotice('图片已导出（3 倍清晰度）');
    } catch (e) {
      setNotice(`导出失败：${(e as Error).message}`);
    } finally {
      setExporting(false);
    }
  };
  const tabs = [
    { id: 'messages', label: '对话', icon: MessageSquare },
    { id: 'roles', label: '角色', icon: Users },
    { id: 'settings', label: '显示设置', icon: SlidersHorizontal },
  ];
  return (
    <>
      <header className="topbar">
        <a className="brand" href="./">
          <span>
            <Cat size={25} />
          </span>
          四喵
          <span className="brand-divider" />
          对话生成器
        </a>
        <div className="version">
          可编辑版 <span>V1.0</span>
        </div>
      </header>
      <main className="workspace">
        <section className="editor">
          <div className="editor-heading">
            <span className="eyebrow">CHAT STUDIO</span>
            <h1>让对话，生动起来。</h1>
            <p>编辑角色与消息，实时生成你的专属聊天画面。</p>
          </div>
          <nav className="tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={tab === t.id ? 'active' : ''}
                onClick={() => setTab(t.id)}
              >
                <t.icon size={17} />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="panel">
            {tab === 'roles' && (
              <>
                <div className="section-title">
                  <h2>角色管理</h2>
                  <button
                    className="text-button"
                    onClick={() => {
                      const id = uid();
                      setDraft((d) => ({
                        ...d,
                        roles: [
                          ...d.roles,
                          { id, name: '新角色', avatar: '', self: false },
                        ],
                      }));
                    }}
                  >
                    <Plus size={16} />
                    添加角色
                  </button>
                </div>
                <p className="hint">
                  点击头像更换图片；“自己”的消息显示在右侧。
                </p>
                {draft.roles.map((r) => (
                  <div className="role-card" key={r.id}>
                    <label className="avatar-upload">
                      <Avatar role={r} />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        aria-label={`上传${r.name}头像`}
                        onChange={(e) => {
                          upload(e.target.files?.[0], (url) =>
                            updateRole(r.id, { avatar: url }),
                          );
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <div className="role-info">
                      <input
                        aria-label="角色名称"
                        value={r.name}
                        maxLength={30}
                        onChange={(e) =>
                          updateRole(r.id, { name: e.target.value })
                        }
                      />
                      <label className="checkbox">
                        <input
                          type="radio"
                          name="self"
                          checked={r.self}
                          onChange={() =>
                            setDraft((d) => ({
                              ...d,
                              roles: d.roles.map((role) => ({
                                ...role,
                                self: role.id === r.id,
                              })),
                            }))
                          }
                        />
                        设为自己
                      </label>
                    </div>
                    <button
                      className="icon-button danger"
                      aria-label={`删除角色${r.name}`}
                      disabled={draft.roles.length === 1}
                      onClick={() => deleteRole(r.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </>
            )}
            {tab === 'messages' && (
              <>
                <div className="section-title">
                  <h2>{editing ? '编辑消息' : '添加消息'}</h2>
                  <span className="subtle">{draft.roles.length} 位角色</span>
                </div>
                <label className="field">
                  发送角色
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                  >
                    {draft.roles.map((r) => (
                      <option value={r.id} key={r.id}>
                        {r.name}
                        {r.self ? '（自己）' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="type-switch">
                  <button
                    className={type === 'text' ? 'selected' : ''}
                    onClick={() => setType('text')}
                  >
                    <MessageSquare size={15} />
                    文字消息
                  </button>
                  <button
                    className={type === 'image' ? 'selected' : ''}
                    onClick={() => setType('image')}
                  >
                    <ImagePlus size={15} />
                    图片消息
                  </button>
                </div>
                {type === 'text' ? (
                  <textarea
                    placeholder="写点什么，让故事开始…"
                    aria-label="消息内容"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                  />
                ) : (
                  <label className="image-upload">
                    {image ? (
                      <img src={image} alt="待发送图片" />
                    ) : (
                      <>
                        <ImagePlus size={27} />
                        <strong>点击上传图片</strong>
                        <span>PNG / JPG / WebP / GIF · 最大 8 MB</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      aria-label="上传消息图片"
                      onChange={(e) => {
                        upload(e.target.files?.[0], setImage);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
                <div className="compose-actions">
                  {editing && (
                    <button className="secondary" onClick={cancelEdit}>
                      <X size={16} />
                      取消
                    </button>
                  )}
                  <button
                    className="primary"
                    disabled={!(type === 'text' ? text.trim() : image)}
                    onClick={submit}
                  >
                    {editing ? <Check size={17} /> : <Plus size={17} />}{' '}
                    {editing ? '保存修改' : '添加到对话'}
                  </button>
                </div>
                <div className="message-list-heading">
                  <h2>消息列表</h2>
                  <span>{draft.messages.length} 条消息</span>
                </div>
                <div className="message-list">
                  {draft.messages.length === 0 && (
                    <p className="empty">还没有消息，添加第一条对话吧。</p>
                  )}
                  {draft.messages.map((m, index) => (
                    <div
                      className={`message-card ${editing === m.id ? 'editing' : ''}`}
                      key={m.id}
                    >
                      <div className="message-number">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="message-summary">
                        <strong>
                          {draft.roles.find((r) => r.id === m.roleId)?.name}
                        </strong>
                        {m.type === 'text' ? (
                          <p>{m.content}</p>
                        ) : (
                          <img src={m.content} alt="消息缩略图" />
                        )}
                      </div>
                      <div className="message-actions">
                        <button
                          aria-label="上移消息"
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          aria-label="下移消息"
                          disabled={index === draft.messages.length - 1}
                          onClick={() => move(index, 1)}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          aria-label="编辑消息"
                          onClick={() => {
                            setEditing(m.id);
                            setRoleId(m.roleId);
                            setType(m.type);
                            setText(m.type === 'text' ? m.content : '');
                            setImage(m.type === 'image' ? m.content : '');
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          aria-label="删除消息"
                          onClick={() => {
                            setDraft((d) => ({
                              ...d,
                              messages: d.messages.filter((x) => x.id !== m.id),
                            }));
                            if (editing === m.id) cancelEdit();
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {tab === 'settings' && (
              <>
                <div className="section-title">
                  <h2>画面设置</h2>
                  <SlidersHorizontal size={18} />
                </div>
                <label className="field">
                  对话标题
                  <input
                    value={draft.settings.title}
                    maxLength={40}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        settings: { ...d.settings, title: e.target.value },
                      }))
                    }
                  />
                </label>
                <div className="field-grid">
                  <label className="field">
                    手机时间
                    <input
                      type="time"
                      value={draft.settings.time}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          settings: { ...d.settings, time: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    电量 {draft.settings.battery}%
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={draft.settings.battery}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          settings: {
                            ...d.settings,
                            battery: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </label>
                </div>
                <label className="field">
                  画面宽度
                  <select
                    value={draft.settings.width}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        settings: {
                          ...d.settings,
                          width: Number(e.target.value),
                        },
                      }))
                    }
                  >
                    <option value="375">375 px · iPhone X</option>
                    <option value="390">390 px · 标准</option>
                    <option value="414">414 px · 大屏</option>
                  </select>
                </label>
                <label className="field">
                  最小画面高度 · {draft.settings.height} px
                  <input
                    type="range"
                    min="500"
                    max="1600"
                    step="4"
                    value={draft.settings.height}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        settings: {
                          ...d.settings,
                          height: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={draft.settings.online}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        settings: { ...d.settings, online: e.target.checked },
                      }))
                    }
                  />
                  显示在线状态
                </label>
                <div className="info-box">
                  消息较多时，画面会自动延长，导出包含完整对话。
                </div>
              </>
            )}
          </div>
          <div className="save-status">
            {saveError || (
              <>
                <span />
                修改自动保存在此浏览器
              </>
            )}
          </div>
        </section>
        <section className="preview-section">
          <div className="preview-toolbar">
            <div>
              <span className="live-dot" />
              实时预览
              <span className="preview-size">
                {draft.settings.width} px · 3× 导出
              </span>
            </div>
            <button
              className="primary export"
              disabled={exporting}
              onClick={exportImage}
            >
              <Download size={16} />
              {exporting ? '正在生成…' : '导出图片'}
            </button>
          </div>
          <div className="preview-canvas">
            <div className="phone-frame">
              <ChatPreview draft={draft} ref={preview} />
            </div>
            <p className="preview-caption">每一句话，都有自己的故事。</p>
          </div>
        </section>
      </main>
      <footer>
        四喵对话生成器 <span>·</span> 自由编辑，即刻成图
      </footer>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="关闭提示" onClick={() => setNotice('')}>
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}
