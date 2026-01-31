export interface Preset {
  icon: string;
  title: string;
  desc: string;
  prompt: string;
}

export interface AttachmentPreview {
  title: string;
  content: string;
}

export interface MessageAttachment {
  type: 'pdf' | 'doc' | 'sheet' | 'link';
  icon: string;
  name: string;
  meta: string;
  preview?: AttachmentPreview;
  linkPreview?: {
    img: string;
    domain: string;
    title: string;
    desc: string;
  };
}

export interface MessageTable {
  headers: string[];
  rows: string[][];
}

export interface Message {
  role: 'user' | 'agent';
  text: string;
  time: string;
  attachments?: MessageAttachment[];
  table?: MessageTable;
}

export interface Thread {
  id: number;
  title: string;
  avatarColor: string;
  avatarLetter: string;
  time: string;
  unread: boolean;
  messages: Message[];
}

export type TopicType = 'strategy' | 'research' | 'project' | 'personal';

export interface Memory {
  id: number;
  topic: TopicType;
  topicLabel: string;
  title: string;
  body: string;
  date: string;
  source: string;
  sourceCount: number;
}
