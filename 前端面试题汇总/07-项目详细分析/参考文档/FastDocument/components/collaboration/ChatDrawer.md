# ChatDrawer 组件

## 概述

ChatDrawer(聊天抽屉)组件是文档内嵌的实时聊天功能,允许协作者在文档编辑页面的侧边栏进行即时沟通。该组件支持实时消息同步、引用文档内容、@提及、消息表情等功能。

## 核心特性

- **实时消息**: 基于 Socket.io 的毫秒级消息同步
- **文档引用**: 支持引用文档中的特定块/内容
- **@提及**: 支持@团队成员
- **消息类型**: 文本、图片、文件、引用
- **已读未读**: 消息状态跟踪

## Props 接口

```typescript
interface ChatDrawerProps {
  // 抽屉配置
  open: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  width?: number;

  // 文档上下文
  documentId: string;
  documentTitle?: string;

  // 用户信息
  currentUser: User;
  onUserClick?: (userId: string) => void;

  // 消息配置
  messages?: ChatMessage[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;

  // 回调
  onSendMessage?: (message: ChatMessageInput) => void;
  onMessageReaction?: (messageId: string, emoji: string) => void;
  onMessageDelete?: (messageId: string) => void;

  // 样式
  className?: string;
}
```

## 内部状态

```typescript
interface ChatDrawerState {
  messages: ChatMessage[];
  inputValue: string;
  replyingTo: ChatMessage | null;
  showEmojiPicker: boolean;
  uploadingFiles: File[];
  isLoading: boolean;
  unreadCount: number;
  typingUsers: string[];
}
```

## 核心逻辑实现

### 1. 消息渲染与同步

```typescript
const ChatDrawer: React.FC<ChatDrawerProps> = ({
  open,
  documentId,
  currentUser,
  onSendMessage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 加载历史消息
  useEffect(() => {
    if (!open || !documentId) return;

    const fetchMessages = async () => {
      const result = await fetch(`/api/documents/${documentId}/chat/messages`)
        .then(res => res.json());
      setMessages(result.messages);
    };

    fetchMessages();
  }, [open, documentId]);

  // Socket 实时监听
  useEffect(() => {
    if (!open || !documentId) return;

    const socket = socketClient.getInstance();

    socket.on('chat:message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socket.on('chat:typing', (data: { userId: string; isTyping: boolean }) => {
      // 处理用户输入状态
    });

    return () => {
      socket.off('chat:message');
      socket.off('chat:typing');
    };
  }, [open, documentId]);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 发送消息
  const handleSend = () => {
    if (!inputValue.trim()) return;

    const message: ChatMessageInput = {
      content: inputValue,
      documentId,
      replyToId: replyingTo?.id,
      mentions: extractMentions(inputValue),
    };

    onSendMessage?.(message);
    setInputValue('');
    setReplyingTo(null);
  };

  // 提取 @提及
  const extractMentions = (content: string): string[] => {
    const regex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  // 处理输入
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // 发送输入状态
    socketClient.getInstance().emit('chat:typing', {
      documentId,
      userId: currentUser.id,
      isTyping: true,
    });

    // 防抖关闭输入状态
    debounce(() => {
      socketClient.getInstance().emit('chat:typing', {
        documentId,
        userId: currentUser.id,
        isTyping: false,
      });
    }, 2000)();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width={380}
      title={
        <div className="chat-header">
          <MessageSquare size={18} />
          <span>文档讨论</span>
        </div>
      }
    >
      {/* 消息列表 */}
      <div className="chat-messages">
        {messages.map(message => (
          <ChatMessageItem
            key={message.id}
            message={message}
            isOwn={message.senderId === currentUser.id}
            onReply={() => setReplyingTo(message)}
            onReact={(emoji) => handleReaction(message.id, emoji)}
            onDelete={() => handleDelete(message.id)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 回复预览 */}
      {replyingTo && (
        <div className="reply-preview">
          <div className="reply-content">
            <span className="reply-label">回复 {replyingTo.senderName}:</span>
            <p>{replyingTo.content}</p>
          </div>
          <button onClick={() => setReplyingTo(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* 输入框 */}
      <div className="chat-input">
        <TextArea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          placeholder="输入消息... (使用 @ 提及成员)"
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="input-actions">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Smile size={18} />
          </button>
          <button onClick={handleSend} disabled={!inputValue.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </Drawer>
  );
};
```

### 2. 消息组件

```typescript
const ChatMessageItem: React.FC<{
  message: ChatMessage;
  isOwn: boolean;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onDelete: () => void;
}> = ({ message, isOwn, onReply, onReact, onDelete }) => {
  return (
    <div className={`chat-message ${isOwn ? 'own' : ''}`}>
      {/* 头像 */}
      <Avatar src={message.senderAvatar} size={36}>
        {message.senderName?.charAt(0)}
      </Avatar>

      {/* 消息内容 */}
      <div className="message-content">
        <div className="message-header">
          <span className="sender-name">{message.senderName}</span>
          <span className="message-time">
            {formatTime(message.createdAt)}
          </span>
        </div>

        {/* 回复内容 */}
        {message.replyTo && (
          <div className="reply-reference">
            <span>回复 {message.replyTo.senderName}:</span>
            <p>{message.replyTo.content}</p>
          </div>
        )}

        <div className="message-text">{message.content}</div>

        {/* 表情反应 */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="message-reactions">
            {message.reactions.map(reaction => (
              <button
                key={reaction.emoji}
                onClick={() => onReact(reaction.emoji)}
                className={reaction.users.includes(currentUser.id) ? 'active' : ''}
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="message-actions">
          <button onClick={onReply}>
            <Reply size={14} /> 回复
          </button>
          <button>
            <Smile size={14} /> 反应
          </button>
          {isOwn && (
            <button onClick={onDelete} className="delete">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

## 使用示例

```tsx
import { ChatDrawer } from '@/components/ChatDrawer';

function DocumentPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const currentUser = { id: '1', name: '张三', avatar: '/avatar.jpg' };

  return (
    <>
      <button onClick={() => setChatOpen(true)}>
        <MessageSquare size={18} />
        讨论
      </button>

      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        documentId="doc-123"
        documentTitle="项目设计文档"
        currentUser={currentUser}
        onSendMessage={async (message) => {
          await fetch('/api/chat/messages', {
            method: 'POST',
            body: JSON.stringify(message),
          });
        }}
      />
    </>
  );
}
```

---

# CommentPanel 组件

## 概述

CommentPanel(评论面板)组件提供文档级和块级评论功能,支持评论、回复、表情反应、解决/重新打开等操作。

## 核心特性

- **文档级评论**: 对整个文档的评论
- **块级评论**: 对特定块的评论
- **评论回复**: 支持嵌套回复形成对话线程
- **表情反应**: 支持点赞、爱心等反应
- **评论解决**: 标记评论为已解决

## Props 接口

```typescript
interface CommentPanelProps {
  // 面板配置
  open: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  width?: number;

  // 文档上下文
  documentId: string;
  selectedBlockId?: string;

  // 用户信息
  currentUser: User;

  // 评论数据
  comments: Comment[];
  loading?: boolean;

  // 回调
  onAddComment?: (content: string, blockId?: string) => void;
  onReplyComment?: (parentId: string, content: string) => void;
  onResolveComment?: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onReactComment?: (commentId: string, emoji: string) => void;
}
```

## 核心实现

```typescript
const CommentPanel: React.FC<CommentPanelProps> = ({
  open,
  documentId,
  selectedBlockId,
  currentUser,
  comments,
  onAddComment,
  onReplyComment,
  onResolveComment,
}) => {
  const [activeTab, setActiveTab] = useState<'document' | 'block'>('document');
  const [newComment, setNewComment] = useState('');

  // 过滤评论
  const filteredComments = useMemo(() => {
    if (activeTab === 'block' && selectedBlockId) {
      return comments.filter(c => c.blockId === selectedBlockId);
    }
    return comments.filter(c => !c.blockId);
  }, [comments, activeTab, selectedBlockId]);

  // 渲染评论线程
  const renderCommentThread = (comment: Comment) => {
    const replies = comments.filter(c => c.parentId === comment.id);

    return (
      <div key={comment.id} className="comment-thread">
        {/* 主评论 */}
        <CommentItem
          comment={comment}
          isResolved={comment.status === 'resolved'}
          onReply={() => setReplyingTo(comment.id)}
          onResolve={() => onResolveComment?.(comment.id)}
          onReact={(emoji) => handleReact(comment.id, emoji)}
        />

        {/* 回复列表 */}
        {replies.map(reply => (
          <CommentItem
            key={reply.id}
            comment={reply}
            isReply={true}
            onReact={(emoji) => handleReact(reply.id, emoji)}
          />
        ))}

        {/* 回复输入框 */}
        {replyingTo === comment.id && (
          <div className="reply-input">
            <TextArea
              placeholder={`回复 ${comment.senderName}...`}
              autoFocus
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleReply(comment.id);
                }
              }}
            />
            <div className="reply-actions">
              <Button size="small" onClick={() => setReplyingTo(null)}>
                取消
              </Button>
              <Button size="small" type="primary" onClick={() => handleReply(comment.id)}>
                回复
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Panel open={open} onClose={onClose}>
      {/* Tab 切换 */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'document' | 'block')}
        items={[
          { key: 'document', label: '文档评论' },
          { key: 'block', label: selectedBlockId ? '块评论' : '选择块' },
        ]}
      />

      {/* 评论列表 */}
      <div className="comments-list">
        {filteredComments.map(renderCommentThread)}
      </div>

      {/* 添加评论 */}
      <div className="add-comment">
        <TextArea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={activeTab === 'block' ? '添加块评论...' : '添加文档评论...'}
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
        <Button
          type="primary"
          disabled={!newComment.trim()}
          onClick={() => {
            onAddComment?.(newComment, activeTab === 'block' ? selectedBlockId : undefined);
            setNewComment('');
          }}
        >
          发送
        </Button>
      </div>
    </Panel>
  );
};
```

---

# Annotation 组件

## 概述

Annotation(批注)组件提供文档内容的精细标注功能,支持高亮、下划线、删除线、建议等标注类型。

## 核心特性

- **多种标注类型**: 高亮、下划线、删除线、建议
- **颜色选择**: 多种颜色可选
- **批注评论**: 可添加文字说明
- **状态管理**: open, resolved, archived

## 使用示例

```tsx
<Annotation
  type="highlight"
  color="yellow"
  content="这是被高亮的文本"
  comment="这是批注说明"
  status="open"
  onResolve={() => handleResolve()}
  onDelete={() => handleDelete()}
/>
```

---

# ParticipantPanel 组件

## 概述

ParticipantPanel(参与者面板)组件显示当前文档的协作者列表,包括在线状态、正在编辑的块、权限等信息。

## 使用示例

```tsx
<ParticipantPanel
  participants={[
    { id: '1', name: '张三', avatar: '/avatar1.jpg', status: 'online', editingBlockId: 'block-1' },
    { id: '2', name: '李四', avatar: '/avatar2.jpg', status: 'away' },
  ]}
  currentUserId="1"
  onUserClick={(userId) => navigateToUserProfile(userId)}
/>
```

---

# VersionHistoryPanel 组件

## 概述

VersionHistoryPanel(版本历史面板)组件展示文档的版本历史,支持版本预览、对比、恢复等功能。

## 使用示例

```tsx
<VersionHistoryPanel
  documentId="doc-123"
  versions={[
    { id: 'v3', createdAt: Date.now(), createdBy: '张三', summary: '更新第三章节' },
    { id: 'v2', createdAt: Date.now() - 86400000, createdBy: '李四', summary: '添加图表' },
    { id: 'v1', createdAt: Date.now() - 172800000, createdBy: '张三', summary: '初始版本' },
  ]}
  onVersionRestore={(versionId) => handleRestore(versionId)}
  onVersionCompare={(v1, v2) => handleCompare(v1, v2)}
/>
```
