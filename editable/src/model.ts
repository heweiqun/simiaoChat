export interface Role {
  id: string;
  name: string;
  avatar: string;
  self: boolean;
}
export interface Message {
  id: string;
  roleId: string;
  type: 'text' | 'image';
  content: string;
}
export interface Settings {
  title: string;
  time: string;
  battery: number;
  online: boolean;
  width: number;
  height: number;
}
export interface Draft {
  roles: Role[];
  messages: Message[];
  settings: Settings;
}
export const uid = () => crypto.randomUUID();
export const defaultDraft: Draft = {
  roles: [
    {
      id: 'friend',
      name: '喵喵',
      avatar: `${import.meta.env.BASE_URL}media/role1.5a2a8193.jpeg`,
      self: false,
    },
    { id: 'me', name: '自己', avatar: '', self: true },
  ],
  messages: [
    { id: 'one', roleId: 'friend', type: 'text', content: '今天也要开心呀 ☀️' },
    {
      id: 'two',
      roleId: 'me',
      type: 'text',
      content: '收到！一起去喝杯咖啡吧 ☕',
    },
  ],
  settings: {
    title: '喵喵',
    time: '12:22',
    battery: 60,
    online: true,
    width: 375,
    height: 812,
  },
};
export const STORAGE_KEY = 'simiao-editable-v1';
export function loadDraft(): Draft {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (
      d &&
      Array.isArray(d.roles) &&
      d.roles.length &&
      d.roles.every(
        (r: Role) =>
          typeof r.id === 'string' &&
          typeof r.name === 'string' &&
          typeof r.avatar === 'string' &&
          typeof r.self === 'boolean',
      ) &&
      Array.isArray(d.messages) &&
      d.messages.every(
        (m: Message) =>
          typeof m.id === 'string' &&
          ['text', 'image'].includes(m.type) &&
          typeof m.content === 'string' &&
          d.roles.some((r: Role) => r.id === m.roleId),
      ) &&
      d.settings &&
      typeof d.settings.title === 'string' &&
      typeof d.settings.time === 'string' &&
      [375, 390, 414].includes(d.settings.width) &&
      Number.isFinite(d.settings.height) &&
      d.settings.height >= 500 &&
      d.settings.height <= 1600 &&
      Number.isFinite(d.settings.battery)
    )
      return d;
  } catch {
    /* A damaged draft falls back to a usable example. */
  }
  return structuredClone(defaultDraft);
}
export async function readImage(file: File): Promise<string> {
  if (
    !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)
  )
    throw new Error('请选择 PNG、JPG、WebP 或 GIF 图片');
  if (file.size > 8 * 1024 * 1024) throw new Error('图片不能超过 8 MB');
  const url = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('图片读取失败'));
    r.readAsDataURL(file);
  });
  const img = new Image();
  img.src = url;
  await img.decode();
  return url;
}
