# WebRTC实时通信完全指南

## 目录

1. [WebRTC基础概述](#1-webrtc基础概述)
2. [媒体获取详解](#2-媒体获取详解)
3. [RTCPeerConnection深度解析](#3-rtcpeerconnection深度解析)
4. [数据通道DataChannel](#4-数据通道datachannel)
5. [媒体处理技术](#5-媒体处理技术)
6. [实战项目：完整视频通话系统](#6-实战项目完整视频通话系统)
7. [高级话题：SFU与MCU架构](#7-高级话题sfu与mcu架构)
8. [性能与优化](#8-性能与优化)

---

## 1. WebRTC基础概述

### 1.1 WebRTC是什么

WebRTC（Web Real-Time Communication）是一项让浏览器和移动应用通过直接点对点连接进行实时通信的开源技术。它于2010年由Google收购Global IP Solutions（GIPS）后开源，并在2017年成为W3C和IETF的标准。

```
WebRTC技术演进时间线

2010年 - Google收购GIPS，WebRTC项目启动
2011年 - Google开源WebRTC代码
2013年 - Chrome 25成为首个支持WebRTC的稳定版浏览器
2014年 - Firefox 28开始支持WebRTC
2017年 - W3C发布WebRTC 1.0候选推荐标准
2019年 - WebRTC成为W3C和IETF正式标准
2021年 - WebRTC 1.1和1.2版本陆续发布
2024年 - WebRTC NV（最新版本）持续演进
```

WebRTC的核心理念是"让实时通信变得像发起HTTP请求一样简单"。在WebRTC出现之前，实现实时音视频通信需要安装复杂的插件（如Flash），而WebRTC使得这一切只需要几行JavaScript代码就能完成。

### 1.2 WebRTC协议栈

WebRTC并不是一个独立的协议，而是一整套实时通信技术的集合。它的协议栈结构如下：

```
WebRTC协议栈层级结构

+------------------------------------------+
|              应用层                       |
|         (JavaScript API)                  |
+------------------------------------------+
|                                          |
|   +--------+  +--------+  +------------+  |
|   |getUser|  |RTCPeer|  |DataChannel |  |
|   |Media  |  |Connect|  |            |  |
|   +--------+  +--------+  +------------+  |
|                                          |
+------------------------------------------+
|                                          |
|   +--------+  +--------+  +------------+  |
|   |  SRTP  |  |  ICE   |  |   SCTP    |  |
|   |(媒体)  |  |(连接)  |  | (数据通道) |  |
|   +--------+  +--------+  +------------+  |
|                                          |
+------------------------------------------+
|                                          |
|   +--------+  +--------+  +------------+  |
|   |  DTLS  |  |  STUN  |  |   TURN    |  |
|   |(加密)  |  |(穿透)  |  | (中继)     |  |
|   +--------+  +--------+  +------------+  |
|                                          |
+------------------------------------------+
|                                          |
|   +----------------------------------+    |
|   |         UDP / TCP                |    |
|   +----------------------------------+    |
|                                          |
+------------------------------------------+
```

### 1.3 WebRTC三大部分详解

WebRTC架构可以划分为三个核心部分，每个部分都有其独特的功能和用途。

**第一部分：媒体获取（Media Capture）**

这部分负责从用户的设备获取音频和视频。主要API包括：

- `getUserMedia`：获取摄像头和麦克风数据
- `getDisplayMedia`：获取屏幕共享内容
- `enumerateDevices`：枚举可用的输入输出设备

```javascript
// 媒体获取API示例
// 获取用户摄像头和麦克风
const mediaStream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: 'user'  // 前置摄像头
  },
  audio: {
    echoCancellation: true,      // 回声消除
    noiseSuppression: true,      // 降噪
    autoGainControl: true,       // 自动增益控制
    sampleRate: 44100            // 采样率
  }
});
```

**第二部分：端对端连接（Peer-to-Peer Connection）**

这部分负责建立和管理两个端点之间的直接连接。核心API是`RTCPeerConnection`，它处理：

- NAT穿透（通过ICE框架）
- 媒体协商（通过SDP）
- 加密传输（通过DTLS/SRTP）

```javascript
// 创建点对点连接
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:turn.example.com:3478',
      username: 'user',
      credential: 'password'
    }
  ]
});

// 添加本地媒体轨道
mediaStream.getTracks().forEach(track => {
  peerConnection.addTrack(track, mediaStream);
});

// 监听远程轨道
peerConnection.ontrack = (event) => {
  const [remoteStream] = event.streams;
  remoteVideo.srcObject = remoteStream;
};
```

**第三部分：数据通道（DataChannel）**

DataChannel允许在两个端点之间直接传输任意数据，类似于WebSocket但支持P2P直接通信。它可以传输：

- 文本消息
- 二进制文件
- 游戏操作数据
- 任意序列化数据

```javascript
// 创建数据通道
const dataChannel = peerConnection.createDataChannel('chat', {
  ordered: true,           // 保证消息顺序
  maxRetransmits: 3         // 最大重传次数
});

dataChannel.onmessage = (event) => {
  console.log('收到消息:', event.data);
};

dataChannel.send('你好，这是一个WebRTC数据通道消息！');
```

### 1.4 WebRTC与Socket.io的区别

很多开发者容易将WebRTC和Socket.io混淆，因为它们都可以用于实时通信。但实际上，它们解决的是不同层次的问题，有着本质的区别。

```
WebRTC与Socket.io核心区别对比

                    WebRTC                          Socket.io
                  +-----------+                    +-----------+
                  |   P2P    |                    | C/S架构   |
                  +-----------+                    +-----------+
                        |                              |
                        v                              v
              irect connection               Server relay connection
              between browsers               (所有数据经过服务器)
                  +-----------+                    +-----------+
                  |   SRTP    |                    |  WebSocket|
                  | (媒体流)  |                    |  (HTTP)   |
                  +-----------+                    +-----------+
                        |                              |
                        v                              v
              内网穿透技术                          需要公网服务器
              (ICE/STUN/TURN)                       (任何服务器)
                  +-----------+                    +-----------+
                  |   DTLS    |                    |   TLS     |
                  | (端到端加密)                   | (传输加密) |
                  +-----------+                    +-----------+
```

**架构模式差异：**

| 特性 | WebRTC | Socket.io |
|------|--------|-----------|
| **架构类型** | P2P（端到端直连） | C/S（客户端-服务器） |
| **数据路径** | 浏览器直连 | 经过服务器中转 |
| **延迟** | 极低（无需经过服务器） | 较低（取决于服务器距离） |
| **服务器负载** | 极低（仅用于信令） | 高（所有数据经过） |
| **带宽成本** | 低（P2P分担） | 高（集中式） |
| **适用场景** | 音视频通话、文件传输 | 聊天、实时协作、游戏 |

**工作层次差异：**

Socket.io工作在应用层，它解决的是"如何在浏览器和服务器之间进行实时双向通信"的问题。而WebRTC工作在更底层，它不仅包含数据传输，还包括媒体处理、连接建立、加密等整套解决方案。

**信令服务器的特殊性：**

WebRTC本身不包含信令服务器，这是因为SDP（会话描述协议）和ICE候选的交换需要某种外部机制来完成。Socket.io可以作为这个信令服务器使用，但Socket.io在这个场景中只是"搬运工"，不参与实际的媒体传输。

```javascript
// WebRTC的信令交换可以借助Socket.io完成
// 但Socket.io服务器只负责传递SDP和ICE候选
// 实际媒体流是通过WebRTC直连的

// Socket.io服务器（信令）
io.on('connection', (socket) => {
  // 仅仅转发offer，不处理内容
  socket.on('offer', (data) => {
    socket.to(data.targetUserId).emit('offer', data);
  });

  // 仅仅转发answer
  socket.on('answer', (data) => {
    socket.to(data.targetUserId).emit('answer', data);
  });

  // 仅仅转发ICE候选
  socket.on('ice-candidate', (data) => {
    socket.to(data.targetUserId).emit('ice-candidate', data);
  });
});

// 实际媒体流走的是WebRTC直连通道
// 不会经过Socket.io服务器
```

### 1.5 WebRTC适用场景

WebRTC的P2P特性使其在以下场景中具有明显优势：

**视频通话与会议：**

一对一视频通话、多人视频会议、在线教育、远程医疗、心理咨询等场景。WebRTC的低延迟特性使得通话体验更流畅，而P2P直连可以大幅减少服务器带宽成本。

**直播推流：**

虽然传统直播使用RTMP协议，但WebRTC因其极低延迟正在成为互动直播的新选择。特别是在需要观众与主播互动的场景（如电商直播、在线拍卖），WebRTC的双向通信能力是理想选择。

**屏幕共享与远程控制：**

getDisplayMedia API使得屏幕共享变得简单，可以应用于在线协作、远程支持、技术演示等场景。结合DataChannel，还可以实现远程桌面控制。

**P2P文件传输：**

不需要上传到服务器，两个浏览器之间可以直接传输文件，速度取决于双方的网络带宽，而不是服务器的带宽限制。

**游戏开发：**

低延迟的DataChannel可以用于开发实时多人游戏，如棋牌类、射击类游戏。结合WebGL或Canvas，可以实现纯浏览器端的多人游戏。

**去中心化应用：**

WebRTC的P2P特性使其成为构建去中心化应用（DApp）的理想选择，如去中心化聊天、社交网络、分布式存储等。

---

## 2. 媒体获取详解

### 2.1 getUserMedia API基础

`navigator.mediaDevices.getUserMedia()`是WebRTC中用于获取用户媒体设备的核心API。它返回一个Promise，解析为一个`MediaStream`对象，包含音频和视频轨道。

```javascript
// getUserMedia基础用法
async function requestMedia() {
  try {
    // 请求默认的摄像头和麦克风
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,    // 启用视频
      audio: true     // 启用音频
    });

    console.log('获取媒体流成功！');
    console.log('视频轨道数:', stream.getVideoTracks().length);
    console.log('音频轨道数:', stream.getAudioTracks().length);

    // 将流绑定到video元素
    const videoElement = document.querySelector('video');
    videoElement.srcObject = stream;

    return stream;
  } catch (error) {
    console.error('获取媒体失败:', error.name);
    // 常见错误：
    // NotAllowedError - 用户拒绝授权
    // NotFoundError - 没有找到设备
    // NotReadableError - 设备被其他应用占用
  }
}
```

### 2.2 视频约束条件详解

getUserMedia支持丰富的约束条件（Constraints），可以精确控制获取的媒体参数。这些约束分为三大类：

**分辨率控制：**

```javascript
// 固定分辨率
const stream1 = await navigator.mediaDevices.getUserMedia({
  video: { width: 1920, height: 1080 }
});

// 分辨率范围
const stream2 = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { min: 640, max: 1920 },      // 宽度范围
    height: { min: 480, max: 1080 },     // 高度范围
    ideal: { min: 1280, max: 720 }       // 理想值
  }
});

// 纵横比控制
const stream3 = await navigator.mediaDevices.getUserMedia({
  video: {
    aspectRatio: 16 / 9,                  // 16:9比例
    width: { ideal: 1280 },
    height: { ideal: 720 }
  }
});
```

**帧率控制：**

```javascript
// 帧率控制
const stream4 = await navigator.mediaDevices.getUserMedia({
  video: {
    frameRate: {
      ideal: 30,        // 理想帧率30fps
      min: 15,          // 最低15fps
      max: 60           // 最高60fps
    }
  }
});
```

**摄像头选择：**

```javascript
// 选择特定摄像头（通过deviceId）
async function selectCamera() {
  // 先获取所有设备列表
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter(device => device.kind === 'videoinput');

  console.log('可用摄像头:');
  cameras.forEach((camera, index) => {
    console.log(`${index}: ${camera.label} (${camera.deviceId})`);
  });

  // 选择特定的摄像头
  if (cameras.length > 1) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: cameras[1].deviceId }  // 选择第二个摄像头
      }
    });
    return stream;
  }
}

// 使用facingMode选择摄像头方向
const stream5 = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: 'user'       // 前置摄像头（自拍模式）
    // facingMode: 'environment'  // 后置摄像头
    // facingMode: 'left'         // 左侧摄像头
    // facingMode: 'right'        // 右侧摄像头
  }
});
```

### 2.3 音频约束条件详解

音频约束对于提升通话质量至关重要。以下是主要的音频约束选项：

```javascript
// 完整的音频约束配置
const audioConstraints = {
  echoCancellation: {       // 回声消除
    ideal: true,             // 强烈建议开启
    min: 0,                  // 最小回声消除级别
    max: 1                   // 最大回声消除级别
  },
  noiseSuppression: {        // 噪声抑制
    ideal: true,             // 强烈建议开启
    min: 0,
    max: 1
  },
  autoGainControl: {         // 自动增益控制
    ideal: true,             // 强烈建议开启
    min: 0,
    max: 1
  },
  latency: {                 // 延迟偏好
    ideal: 0.05,             // 理想延迟50ms
    min: 0,
    max: 0.5
  },
  sampleRate: {              // 采样率
    ideal: 48000,             // 48kHz
    min: 44100,               // 最低44.1kHz
    max: 48000
  },
  sampleSize: {              // 采样位深
    ideal: 16,                // 16位
    min: 8,
    max: 32
  },
  channelCount: {             // 声道数
    ideal: 1,                 // 单声道（语音最佳）
    min: 1,
    max: 2
  },
  volume: {                   // 音量范围
    min: 0,
    max: 1,
    ideal: 1
  }
};

// 应用音频约束
const stream = await navigator.mediaDevices.getUserMedia({
  audio: audioConstraints
});

// 获取音频轨道信息
const audioTrack = stream.getAudioTracks()[0];
console.log('音频轨道设置:', audioTrack.getSettings());
console.log('音频约束:', audioTrack.getConstraints());
```

### 2.4 屏幕共享getDisplayMedia

`getDisplayMedia` API允许用户选择屏幕、窗口或标签页进行共享，是实现屏幕共享功能的核心API。

```javascript
// 基础的屏幕共享
async function shareScreen() {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',     // 鼠标光标显示策略
        // cursor: 'never'   - 不显示光标
        // cursor: 'motion'   - 移动时显示光标
        displaySurface: 'monitor'  // 优先选择整个屏幕
        // displaySurface: 'window'  - 优先选择窗口
        // displaySurface: 'browser' - 优先选择标签页
      },
      audio: true            // 是否捕获系统音频（仅Chrome支持）
    });

    console.log('屏幕共享开始！');
    console.log('共享类型:', screenStream.getVideoTracks()[0].label);

    // 将屏幕共享流绑定到视频元素
    const videoElement = document.querySelector('#screen-video');
    videoElement.srcObject = screenStream;

    // 监听用户停止共享（通过浏览器UI）
    screenStream.getVideoTracks()[0].onended = () => {
      console.log('用户停止了屏幕共享');
    };

    return screenStream;
  } catch (error) {
    console.error('屏幕共享失败:', error);
  }
}

// 限制屏幕共享的分辨率
async function shareScreenWithLimit() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      width: { max: 1920 },     // 最大宽度
      height: { max: 1080 },    // 最大高度
      frameRate: { max: 30 }    // 最大帧率
    }
  });
  return stream;
}

// 组合使用：同时共享摄像头和屏幕
async function shareCameraAndScreen() {
  // 分别获取摄像头和屏幕
  const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
  const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

  // 合并轨道
  const combinedStream = new MediaStream();
  cameraStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
  screenStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

  return combinedStream;
}
```

### 2.5 设备枚举enumerateDevices

`enumerateDevices` API允许列出所有可用的媒体输入输出设备，让用户可以选择使用哪个设备。

```javascript
// 枚举所有媒体设备
async function listDevices() {
  // 注意：首次调用getUserMedia后才能获取到设备标签
  // 出于隐私考虑，在获取用户权限之前，标签会是空字符串

  const devices = await navigator.mediaDevices.enumerateDevices();

  console.log('=== 媒体设备列表 ===');

  // 按类型分类
  const videoDevices = devices.filter(d => d.kind === 'videoinput');
  const audioDevices = devices.filter(d => d.kind === 'audioinput');
  const audioOutputDevices = devices.filter(d => d.kind === 'audiooutput');

  console.log(`\n摄像头 (${videoDevices.length}):`);
  videoDevices.forEach((device, index) => {
    console.log(`  ${index + 1}. ${device.label || '未命名摄像头'}`);
    console.log(`     DeviceID: ${device.deviceId}`);
    console.log(`     GroupID: ${device.groupId}`);
  });

  console.log(`\n麦克风 (${audioDevices.length}):`);
  audioDevices.forEach((device, index) => {
    console.log(`  ${index + 1}. ${device.label || '未命名麦克风'}`);
    console.log(`     DeviceID: ${device.deviceId}`);
  });

  console.log(`\n扬声器 (${audioOutputDevices.length}):`);
  audioOutputDevices.forEach((device, index) => {
    console.log(`  ${index + 1}. ${device.label || '未命名扬声器'}`);
    console.log(`     DeviceID: ${device.deviceId}`);
  });

  return devices;
}

// 设备选择器UI实现
function createDeviceSelector() {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="device-selector">
      <h3>摄像头选择</h3>
      <select id="camera-select"></select>

      <h3>麦克风选择</h3>
      <select id="microphone-select"></select>

      <h3>扬声器选择</h3>
      <select id="speaker-select"></select>
    </div>
  `;

  return container;
}

// 监听设备变化（热插拔）
navigator.mediaDevices.ondevicechange = () => {
  console.log('设备发生变化，重新枚举...');
  listDevices();
};
```

### 2.6 媒体流处理详解

获取到MediaStream后，通常需要对其进行处理，包括播放、停止、截图等操作。

```javascript
// 媒体流基础操作
class MediaStreamHandler {
  constructor(stream) {
    this.stream = stream;
    this.videoElement = null;
    this.audioContext = null;
    this.analyser = null;
  }

  // 绑定到视频元素播放
  attachToVideo(videoElement) {
    this.videoElement = videoElement;
    videoElement.srcObject = this.stream;
    videoElement.autoplay = true;
    videoElement.playsInline = true;  // iOS兼容
    return this;
  }

  // 播放
  async play() {
    if (this.videoElement) {
      try {
        await this.videoElement.play();
        console.log('视频开始播放');
      } catch (error) {
        console.error('播放失败:', error);
      }
    }
  }

  // 暂停
  pause() {
    if (this.videoElement) {
      this.videoElement.pause();
    }
    return this;
  }

  // 停止（释放所有轨道）
  stop() {
    this.stream.getTracks().forEach(track => track.stop());
    console.log('媒体流已停止');
  }

  // 获取视频轨道
  getVideoTrack() {
    return this.stream.getVideoTracks()[0];
  }

  // 获取音频轨道
  getAudioTrack() {
    return this.stream.getAudioTracks()[0];
  }

  // 静音/取消静音视频
  muteVideo() {
    this.stream.getVideoTracks().forEach(track => {
      track.enabled = false;
    });
    console.log('视频已静音');
    return this;
  }

  unmuteVideo() {
    this.stream.getVideoTracks().forEach(track => {
      track.enabled = true;
    });
    console.log('视频已取消静音');
    return this;
  }

  // 静音/取消静音音频
  muteAudio() {
    this.stream.getAudioTracks().forEach(track => {
      track.enabled = false;
    });
    console.log('音频已静音');
    return this;
  }

  unmuteAudio() {
    this.stream.getAudioTracks().forEach(track => {
      track.enabled = true;
    });
    console.log('音频已取消静音');
    return this;
  }
}

// 截图功能
function captureFrame(videoElement, format = 'image/png') {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0);

  // 返回DataURL或Blob
  if (format === 'dataurl') {
    return canvas.toDataURL('image/png');
  } else {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
  }
}

// 音频分析器（用于音量检测等）
class AudioAnalyzer {
  constructor(stream) {
    this.stream = stream;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.source.connect(this.analyser);

    // 配置分析器
    this.analyser.fftSize = 256;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  // 获取音量（0-255）
  getVolume() {
    this.analyser.getByteFrequencyData(this.dataArray);
    let sum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }
    return sum / this.bufferLength;
  }

  // 获取频率数据
  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  // 清理资源
  destroy() {
    this.source.disconnect();
    this.audioContext.close();
  }
}
```

---

## 3. RTCPeerConnection深度解析

### 3.1 ICE候选与NAT穿透原理

ICE（Interactive Connectivity Establishment）是WebRTC建立连接的核心框架，它通过一系列技术手段解决"如何在两个位于不同网络的设备之间建立直接连接"这个难题。

**NAT穿透问题：**

在现实网络中，大多数设备都位于NAT（网络地址转换）后面。NAT会将私有IP转换为公网IP，从而允许多个设备共享一个公网IP。但这也为P2P连接带来了挑战：外部设备无法直接向内网设备发送数据。

```
NAT类型与穿透难度

对称型NAT (Symmetric NAT)
├── 每个"源IP:源端口 -> 目标IP:目标端口"映射使用不同的公网端口
├── 最难穿透，通常需要TURN服务器
└── 图示：
    内部 192.168.1.10:5000 -> NAT:220.220.1.1:45000 -> 外部
    内部 192.168.1.10:5000 -> NAT:220.220.1.1:45001 -> 另一个外部地址

圆锥型NAT (Full Cone NAT)
├── 任何外部主机都可以通过NAT公网端口向内部主机发送数据
├── 最容易穿透
└── 图示：
    内部 192.168.1.10:5000 -> NAT:220.220.1.1:45000
    任何外部都可以通过45000访问192.168.1.10:5000

限制型NAT (Restricted Cone NAT)
├── 只有内部主机之前通信过的外部主机才能发送数据
├── 较难穿透
└── 图示：
    内部先向外部A发送数据后，外部A才能向内部发送

端口限制型NAT (Port Restricted Cone NAT)
├── 限制更严格，需要外部IP和端口都匹配
├── 较难穿透
└── 图示：
    内部先向外部A:8000发送数据后，外部A:8000才能向内部发送
```

**STUN服务器工作原理：**

STUN（Session Traversal Utilities for NAT）是一种让位于NAT后面的设备发现自己公网地址和NAT类型的协议。

```
STUN工作流程

客户端                                    STUN服务器              外部主机
  │                                         │                       │
  │ ---- UDP包 (源:192.168.1.10:5000) ----> │                       │
  │                                         │                       │
  │              NAT转换                    │                       │
  │ ---- UDP包 (源:220.220.1.1:45000) ----> │                       │
  │                                         │                       │
  │ <---- 响应:你的公网地址是220.220.1.1:45000 ----                 │
  │                                         │                       │
  这样客户端就知道了自己的公网地址，可以把这个地址告诉外部主机
```

**TURN服务器工作原理：**

当P2P直连无法建立时，TURN（Traversal Using Relays around NAT）服务器充当中继节点，所有数据都经过TURN服务器转发。

```
TURN中继工作流程

客户端A                                    TURN服务器                客户端B
  │                                              │                       │
  │ ---- 建立中继分配请求 ----------------------> │                       │
  │                                              │                       │
  │ <---- 分配公网地址220.220.1.1:50000 ------- │                       │
  │                                              │                       │
  │  Client A知道B的地址，开始通过TURN中继通信     │                       │
  │ ---- 数据通过220.220.1.1:50000 ------------> │ ---- 数据转发 -------> │
  │                                              │                       │
  │ <---- B的响应数据 <------------------------- │ <----- B的响应数据 ---- │
```

**ICE候选收集过程：**

```javascript
// ICE候选类型

/*
 * ICE候选类型优先级（从高到低）：
 * 1. 主机候选（host）- 同一网络上的本地地址
 * 2. 反射候选（srflx）- 通过STUN发现的公网地址
 * 3. 中继候选（relay）- 通过TURN服务器分配的中继地址
 * 4. 对等候选（prflx）- 通过对方收到的反射候选
 */

// ICE候选属性
const candidateInfo = {
  candidate: 'candidate:1 1 UDP 2130706431 192.168.1.10 5000 typ host',  // 完整候选字符串
  sdpMid: '0',                    // 候选关联的媒体ID
  sdpMLineIndex: 0,               // 候选关联的媒体行索引
  foundation: '1',                // 候选基础标识
  componentId: 'rtp',             // 组件ID（rtp或rtcp）
  priority: 2130706431,           // 优先级
  ip: '192.168.1.10',             // IP地址
  port: 5000,                     // 端口
  type: 'host',                   // 类型：host/srflx/relay
  tcpType: null                   // TCP类型（如使用TCP穿透）
};

// 创建PeerConnection并监听ICE候选
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.google.com:19302' },
    {
      urls: 'turn:turn.example.com:3478',
      username: 'user',
      credential: 'password'
    }
  ],
  // ICE候选策略
  iceCandidatePoolSize: 10  // 预候选池大小
});

// 监听本地ICE候选
pc.onicecandidate = (event) => {
  if (event.candidate) {
    // 发送候选到对方（通过信令服务器）
    sendToPeer({
      type: 'ice-candidate',
      candidate: event.candidate
    });
    console.log('ICE候选:', event.candidate.candidate);
  }
};

// 监听ICE候选收集完成
pc.onicecandidatepoolempty = () => {
  console.log('ICE候选池已空，所有候选已收集完成');
};

// 监听ICE连接状态变化
pc.oniceconnectionstatechange = () => {
  console.log('ICE连接状态:', pc.iceConnectionState);

  switch (pc.iceConnectionState) {
    case 'new':
      console.log('ICE代理正在收集候选或等待提供');
      break;
    case 'checking':
      console.log('ICE代理正在检查候选对');
      break;
    case 'connected':
      console.log('ICE代理已找到可用连接');
      break;
    case 'completed':
      console.log('ICE代理已完成候选检查并确认连接');
      break;
    case 'failed':
      console.log('ICE代理未能找到有效连接');
      break;
    case 'disconnected':
      console.log('ICE代理检测到连接断开');
      break;
    case 'closed':
      console.log('ICE代理已关闭');
      break;
  }
};

// 监听ICE收集状态
pc.onicegatheringstatechange = () => {
  console.log('ICE收集状态:', pc.iceGatheringState);

  switch (pc.iceGatheringState) {
    case 'new':
      console.log('开始收集ICE候选');
      break;
    case 'gathering':
      console.log('正在收集ICE候选...');
      break;
    case 'complete':
      console.log('ICE候选收集完成');
      break;
  }
};
```

### 3.2 SDP会话描述协议详解

SDP（Session Description Protocol）是WebRTC用于描述会话属性的协议。在WebRTC中，SDP以文本形式表示，包含媒体类型、编码格式、传输协议、IP地址和端口等连接信息。

```javascript
// SDP结构解析

/*
 *典型的WebRTC SDP包含以下部分：
 *
 * v=0                    - 协议版本
 * o=- 761421535668442187 2 IN IP4 127.0.0.1  - 会话标识
 * s=-                    - 会话名称
 * t=0 0                  - 会话时间
 *
 * m=video 5000 RTP/SAVPF  - 媒体描述
 *   5000                 - 端口号
 *   RTP/SAVPF            - 传输协议（RTP安全配置文件）
 *
 * a=rtpmap:100 VP8/90000  - 编码格式映射
 *   100                  - payload type
 *   VP8                  - 编码名称
 *   90000                - 时钟频率
 *
 * a=ice-ufrag:xxx        - ICE用户片段
 * a=ice-pwd:xxx          - ICE密码
 * a=ice-options:trickle   - 支持增量候选
 *
 * a=fingerprint:sha-256   - DTLS指纹
 * a=setup:actpass         - DTLS角色
 *
 * a=rtcp-fb:100 nack      - RTCP反馈
 * a=rtcp-fb:100 goog-remb - RTCP REMB带宽估计
 */

// 创建Offer并查看SDP
async function createAndInspectOffer() {
  const pc = new RTCPeerConnection();

  // 添加本地流
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
  });

  // 创建Offer
  const offer = await pc.createOffer();

  // 设置本地描述
  await pc.setLocalDescription(offer);

  // 查看SDP内容
  console.log('=== SDP内容 ===');
  console.log(offer.sdp);

  // 分析SDP各部分
  const sdpLines = offer.sdp.split('\r\n');

  sdpLines.forEach(line => {
    if (line.startsWith('m=')) {
      console.log('媒体行:', line);  // 如 m=video 5000 RTP/SAVPF 100
    } else if (line.startsWith('a=rtpmap:')) {
      console.log('编码映射:', line);  // 如 a=rtpmap:100 VP8/90000
    } else if (line.startsWith('a=ice-ufrag')) {
      console.log('ICE用户片段:', line);
    } else if (line.startsWith('a=ice-pwd')) {
      console.log('ICE密码:', line);
    } else if (line.startsWith('a=fingerprint')) {
      console.log('DTLS指纹:', line);
    }
  });

  return { pc, offer };
}

// 处理收到的SDP
async function handleRemoteSdp(remoteSdp) {
  const pc = new RTCPeerConnection();

  // 将远程SDP设置为远程描述
  await pc.setRemoteDescription(new RTCSessionDescription({
    type: 'answer',  // 或 'offer'
    sdp: remoteSdp
  }));

  // 创建Answer
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  return { pc, answer };
}

// 常见SDP属性说明
const sdpAttributes = {
  // 媒体级别属性
  'a=rtpmap': '编码映射，指定payload type对应的编码格式',
  'a=fmtp': '编码参数，指定编码的具体参数',
  'a=ptime': '媒体打包时长（毫秒）',
  'a=maxptime': '最大媒体打包时长',

  // 连接相关属性
  'a=candidate': 'ICE候选',
  'a=ice-ufrag': 'ICE用户片段（用于身份验证）',
  'a=ice-pwd': 'ICE密码',
  'a=ice-options': 'ICE选项（如trickle支持增量候选）',

  // 安全相关属性
  'a=fingerprint': 'DTLS证书指纹',
  'a=setup': 'DTLS角色（actpass/active/passive）',

  // 传输相关属性
  'a=rtcp-mux': 'RTCP复用',
  'a=rtcp-rsize': 'RTCP压缩',

  // 反馈相关属性
  'a=rtcp-fb': 'RTCP反馈机制（如nack、goog-remb）',
  'a=goog-remb': 'Google REMB带宽估计（已被rtcp-fb取代）'
};
```

### 3.3 信令服务器设计

WebRTC需要一种机制来交换SDP和ICE候选，这就是"信令"。信令服务器本身不处理媒体数据，只负责传递控制信息。

```javascript
// 信令服务器设计 - 使用Socket.io

// server.js - 信令服务器
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true
  }
});

// 在线用户映射
const onlineUsers = new Map();

// 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 用户注册
  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`用户 ${userId} 注册成功`);
  });

  // 加入房间
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`用户 ${socket.userId} 加入房间 ${roomId}`);

    // 通知房间内其他用户
    socket.to(roomId).emit('user-joined', {
      userId: socket.userId,
      timestamp: Date.now()
    });
  });

  // 离开房间
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', {
      userId: socket.userId,
      timestamp: Date.now()
    });
  });

  // 发起呼叫（发送Offer）
  socket.on('offer', (data) => {
    const { targetUserId, offer, roomId } = data;

    console.log(`转发Offer: ${socket.userId} -> ${targetUserId}`);

    // 查找目标用户
    const targetSocketId = onlineUsers.get(targetUserId);

    if (targetSocketId) {
      io.to(targetSocketId).emit('offer', {
        fromUserId: socket.userId,
        offer: offer,
        roomId: roomId
      });
    } else {
      socket.emit('offer-error', {
        message: '用户不在线',
        targetUserId: targetUserId
      });
    }
  });

  // 响应呼叫（发送Answer）
  socket.on('answer', (data) => {
    const { targetUserId, answer } = data;

    console.log(`转发Answer: ${socket.userId} -> ${targetUserId}`);

    const targetSocketId = onlineUsers.get(targetUserId);

    if (targetSocketId) {
      io.to(targetSocketId).emit('answer', {
        fromUserId: socket.userId,
        answer: answer
      });
    }
  });

  // ICE候选
  socket.on('ice-candidate', (data) => {
    const { targetUserId, candidate } = data;

    const targetSocketId = onlineUsers.get(targetUserId);

    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', {
        fromUserId: socket.userId,
        candidate: candidate
      });
    }
  });

  // 通话结束
  socket.on('hang-up', (data) => {
    const { targetUserId } = data;
    const targetSocketId = onlineUsers.get(targetUserId);

    if (targetSocketId) {
      io.to(targetSocketId).emit('hang-up', {
        fromUserId: socket.userId
      });
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`用户 ${socket.userId} 断开连接`);
    }
  });
});

httpServer.listen(3001, () => {
  console.log('信令服务器启动在端口3001');
});
```

### 3.4 完整通话流程offer/answer

WebRTC建立连接的完整流程涉及多个步骤，从媒体获取到连接建立再到通话结束。

```
WebRTC完整通话流程图

用户A（呼叫方）                         用户B（被呼叫方）
      │                                        │
      │  1. 获取本地媒体流                       │  1. 获取本地媒体流
      │     getUserMedia()                        │     getUserMedia()
      │         │                                   │         │
      │         v                                   │         v
      │  2. 创建RTCPeerConnection                   │  2. 创建RTCPeerConnection
      │         │                                   │         │
      │         v                                   │         │
      │  3. addTrack() 添加本地轨道                  │         │
      │         │                                   │         │
      │         v                                   │         │
      │  4. createOffer() 生成SDP                  │         │
      │         │                                   │         │
      │         v                                   │         │
      │  5. setLocalDescription() 设置本地描述       │         │
      │         │                                   │         │
      │         v                                   │         │
      │  6. 发送Offer到信令服务器  ----------------->│ 接收Offer
      │         │                                   │         │
      │         │                                   │         v
      │         │                           7. setRemoteDescription()
      │         │                                   │         │
      │         │                                   │         v
      │         │                           8. addTrack() 添加本地轨道
      │         │                                   │         │
      │         │                                   │         v
      │         │                           9. createAnswer()
      │         │                                   │         │
      │         │                                   │         v
      │         │                          10. setLocalDescription()
      │         │                                   │         │
      │         v                                   │         │
      │ 11. ICE候选收集开始                         │         │
      │         │                                   │ 11. ICE候选收集开始
      │         v                                   │         v
      │ 12. 发送ICE候选  -------------------------->>│ 接收ICE候选
      │         │                                   │         │
      │         │                                   │         v
      │         │                          13. addIceCandidate()
      │         │                                   │         │
      │ 14. 发送Answer  -------------------------->>│
      │         │                                   │
      │         v                                   │         v
      │ 接收Answer                          15. setRemoteDescription()
      │         │                                   │
      │         v                                   │
      │ 16. addIceCandidate()                      │
      │         │                                   │
      │         v                                   │
      │ 17. P2P连接建立！                           │
      │         │                                   │
      │         v                                   │
      │ 18. ontrack 收到远程轨道                     │
      │         │                                   │
      <<>>>> 双向媒体传输  <<>>>>>
      │         │                                   │
      │         v                                   │
      │ 19. 通话结束，关闭连接                       │
```

**完整客户端实现：**

```javascript
// webrtc-client.js - WebRTC客户端封装

class WebRTCClient {
  constructor(options = {}) {
    this.socket = options.socket;           // Socket.io连接
    this.localStream = null;                // 本地媒体流
    this.peerConnections = new Map();      // 对方用户的PeerConnection
    this.onLocalStream = options.onLocalStream || (() => {});
    this.onRemoteStream = options.onRemoteStream || (() => {});
    this.onPeerConnected = options.onPeerConnected || (() => {});
    this.onPeerDisconnected = options.onPeerDisconnected || (() => {});
    this.onError = options.onError || console.error;

    this.setupSocketHandlers();
  }

  // 设置Socket.io事件处理
  setupSocketHandlers() {
    // 收到呼叫
    this.socket.on('offer', async (data) => {
      console.log('收到呼叫:', data.fromUserId);
      try {
        await this.handleOffer(data);
      } catch (error) {
        this.onError('处理呼叫失败:', error);
      }
    });

    // 收到应答
    this.socket.on('answer', async (data) => {
      console.log('收到应答:', data.fromUserId);
      try {
        await this.handleAnswer(data);
      } catch (error) {
        this.onError('处理应答失败:', error);
      }
    });

    // 收到ICE候选
    this.socket.on('ice-candidate', async (data) => {
      try {
        await this.handleIceCandidate(data);
      } catch (error) {
        this.onError('处理ICE候选失败:', error);
      }
    });

    // 对方挂断
    this.socket.on('hang-up', (data) => {
      console.log('对方挂断:', data.fromUserId);
      this.handleHangUp(data.fromUserId);
    });

    // 用户加入
    this.socket.on('user-joined', (data) => {
      console.log('用户加入:', data.userId);
      // 可以选择自动呼叫新加入的用户
    });

    // 用户离开
    this.socket.on('user-left', (data) => {
      console.log('用户离开:', data.userId);
      this.handlePeerDisconnect(data.userId);
    });
  }

  // 获取本地媒体流
  async getLocalStream(constraints = {}) {
    const defaultConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };

    const mergedConstraints = {
      video: Object.keys(constraints.video || {}).length > 0
        ? constraints.video
        : defaultConstraints.video,
      audio: Object.keys(constraints.audio || {}).length > 0
        ? constraints.audio
        : defaultConstraints.audio
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(mergedConstraints);
      this.onLocalStream(this.localStream);
      console.log('本地媒体流获取成功');
      return this.localStream;
    } catch (error) {
      this.onError('获取本地媒体流失败:', error);
      throw error;
    }
  }

  // 创建PeerConnection
  createPeerConnection(remoteUserId) {
    // 如果已存在，先关闭
    if (this.peerConnections.has(remoteUserId)) {
      this.peerConnections.get(remoteUserId).close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.google.com:19302' },
        {
          urls: 'turn:turn.example.com:3478',
          username: 'user',
          credential: 'password'
        }
      ],
      iceCandidatePoolSize: 10
    });

    // 添加本地轨道
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // 监听远程轨道
    pc.ontrack = (event) => {
      console.log('收到远程轨道:', remoteUserId);
      const [remoteStream] = event.streams;
      this.onRemoteStream(remoteUserId, remoteStream);
    };

    // 监听ICE候选
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('发送ICE候选到:', remoteUserId);
        this.socket.emit('ice-candidate', {
          targetUserId: remoteUserId,
          candidate: event.candidate
        });
      }
    };

    // 监听连接状态
    pc.onconnectionstatechange = () => {
      console.log('与', remoteUserId, '的连接状态:', pc.connectionState);

      if (pc.connectionState === 'connected') {
        this.onPeerConnected(remoteUserId);
      } else if (pc.connectionState === 'disconnected' ||
                 pc.connectionState === 'failed') {
        this.onPeerDisconnected(remoteUserId);
      }
    };

    // 监听ICE连接状态
    pc.oniceconnectionstatechange = () => {
      console.log('ICE状态:', remoteUserId, pc.iceConnectionState);
    };

    // 监听数据通道（如果对方创建了）
    pc.ondatachannel = (event) => {
      console.log('收到数据通道:', remoteUserId);
      this.handleDataChannel(remoteUserId, event.channel);
    };

    this.peerConnections.set(remoteUserId, pc);
    return pc;
  }

  // 发起呼叫
  async call(remoteUserId) {
    console.log('发起呼叫:', remoteUserId);

    // 创建PeerConnection
    const pc = this.createPeerConnection(remoteUserId);

    // 创建数据通道（可选，用于传输额外数据）
    const dataChannel = pc.createDataChannel('data', {
      ordered: true
    });
    this.setupDataChannel(remoteUserId, dataChannel);

    // 创建Offer
    const offer = await pc.createOffer();

    // 设置本地描述
    await pc.setLocalDescription(offer);

    // 发送Offer
    this.socket.emit('offer', {
      targetUserId: remoteUserId,
      offer: {
        type: 'offer',
        sdp: pc.localDescription.sdp
      }
    });

    console.log('Offer已发送');
  }

  // 处理收到的呼叫
  async handleOffer(data) {
    const { fromUserId, offer } = data;

    console.log('处理来自', fromUserId, '的呼叫');

    // 创建PeerConnection
    const pc = this.createPeerConnection(fromUserId);

    // 设置远程描述（Offer）
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // 创建Answer
    const answer = await pc.createAnswer();

    // 设置本地描述
    await pc.setLocalDescription(answer);

    // 发送Answer
    this.socket.emit('answer', {
      targetUserId: fromUserId,
      answer: {
        type: 'answer',
        sdp: pc.localDescription.sdp
      }
    });

    console.log('Answer已发送');
  }

  // 处理收到的应答
  async handleAnswer(data) {
    const { fromUserId, answer } = data;

    console.log('处理来自', fromUserId, '的应答');

    const pc = this.peerConnections.get(fromUserId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('远程描述设置完成');
    }
  }

  // 处理收到的ICE候选
  async handleIceCandidate(data) {
    const { fromUserId, candidate } = data;

    const pc = this.peerConnections.get(fromUserId);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('ICE候选添加成功');
      } catch (error) {
        console.error('添加ICE候选失败:', error);
      }
    }
  }

  // 挂断
  hangUp(remoteUserId) {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remoteUserId);
    }

    this.socket.emit('hang-up', {
      targetUserId: remoteUserId
    });

    console.log('已挂断与', remoteUserId, '的通话');
  }

  // 处理对方挂断
  handleHangUp(fromUserId) {
    const pc = this.peerConnections.get(fromUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(fromUserId);
    }
    this.onPeerDisconnected(fromUserId);
  }

  // 处理对端断开
  handlePeerDisconnect(remoteUserId) {
    this.handleHangUp(remoteUserId);
  }

  // 设置数据通道
  setupDataChannel(remoteUserId, channel) {
    channel.onopen = () => {
      console.log('数据通道打开:', remoteUserId);
    };

    channel.onclose = () => {
      console.log('数据通道关闭:', remoteUserId);
    };

    channel.onmessage = (event) => {
      console.log('收到数据通道消息:', remoteUserId, event.data);
    };
  }

  // 通过数据通道发送消息
  sendDataMessage(remoteUserId, message) {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      const dataChannel = pc.createDataChannel('data', { ordered: true });
      dataChannel.onopen = () => {
        dataChannel.send(message);
      };
    }
  }

  // 关闭所有连接
  close() {
    // 停止本地流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // 关闭所有PeerConnection
    this.peerConnections.forEach((pc) => {
      pc.close();
    });
    this.peerConnections.clear();

    console.log('WebRTC客户端已关闭');
  }
}
```

---

## 4. 数据通道DataChannel

### 4.1 RTCDataChannel基础

DataChannel是WebRTC中用于传输任意数据的API，它建立在SCTP（Stream Control Transmission Protocol）协议之上，提供了一种比WebSocket更底层的P2P数据传输方式。

```javascript
// DataChannel基础使用

// 在创建PeerConnection后创建数据通道
const pc = new RTCPeerConnection();

// 创建数据通道（调用方）
const dataChannel = pc.createDataChannel('chat', {
  ordered: true,              // 是否保证消息顺序
  maxRetransmits: 3,           // 最大重传次数（0表示禁用重传，类似UDP）
  protocol: 'json',            // 子协议（可选）
  negotiated: false           // 是否协商建立
});

// 接收数据通道（被调用方）
pc.ondatachannel = (event) => {
  const receiveChannel = event.channel;
  console.log('收到数据通道:', receiveChannel.label);

  receiveChannel.onmessage = (e) => {
    console.log('收到消息:', e.data);
  };

  receiveChannel.onopen = () => {
    console.log('数据通道已打开');
  };

  receiveChannel.onclose = () => {
    console.log('数据通道已关闭');
  };
};

// 配置数据通道
dataChannel.onopen = () => {
  console.log('数据通道已就绪');

  // 发送文本消息
  dataChannel.send('你好！');

  // 发送二进制数据
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, 3.14159);
  dataChannel.send(buffer);

  // 发送JSON对象（需要序列化）
  dataChannel.send(JSON.stringify({ type: 'message', content: '测试' }));
};

// 接收消息
dataChannel.onmessage = (event) => {
  const data = event.data;

  // 判断数据类型
  if (typeof data === 'string') {
    // 文本消息
    console.log('文本消息:', data);
  } else if (data instanceof ArrayBuffer) {
    // 二进制数据
    console.log('二进制数据:', new DataView(data));
  } else if (data instanceof Blob) {
    // Blob数据
    console.log('Blob数据:', data.size, 'bytes');
  }
};

// 监听状态变化
dataChannel.onerror = (error) => {
  console.error('数据通道错误:', error);
};

dataChannel.onclose = () => {
  console.log('数据通道已关闭');
};

// 获取数据通道状态
console.log('数据通道状态:', dataChannel.readyState);
// readyState: 'connecting' | 'open' | 'closing' | 'closed'

// 关闭数据通道
dataChannel.close();
```

### 4.2 DataChannel与WebSocket对比

| 特性 | RTCDataChannel | WebSocket |
|------|----------------|-----------|
| **架构** | P2P直连 | 客户端-服务器 |
| **延迟** | 极低（直连） | 较低（经过服务器） |
| **服务器负载** | 极低（仅信令） | 高（所有数据经过） |
| **数据类型** | 文本、二进制、Blob | 文本、二进制 |
| **可靠性** | 可配置（可靠/不可靠） | 总是可靠 |
| **顺序保证** | 可配置（有序/无序） | 总是有序 |
| **流量控制** | 内置SCTP | 依赖TCP |
| **多路复用** | 支持（通过SCTP） | 单连接 |
| **适用场景** | 游戏、文件传输、实时控制 | 聊天、推送、实时协作 |

### 4.3 可靠传输与UDP类型配置

DataChannel支持两种传输模式：可靠传输（类似TCP）和不可靠传输（类似UDP）。

```javascript
// 可靠传输配置（默认）
const reliableChannel = peerConnection.createDataChannel('reliable', {
  ordered: true,              // 保证消息顺序
  maxRetransmits: 0,           // 不重传
  // 等同于 TCP 的可靠传输
});

// 不可靠传输配置（类似UDP）
const unreliableChannel = peerConnection.createDataChannel('unreliable', {
  ordered: false,             // 不保证顺序
  maxRetransmits: 0,          // 不重传
  maxPacketLifeTime: 500     // 数据包最大生存时间（毫秒）
  // 这是一种"发射后不管"的模式
});

// 混合配置：可靠但无序
const reliableUnorderedChannel = peerConnection.createDataChannel('mixed', {
  ordered: false,             // 不保证顺序
  maxRetransmits: 10          // 最多重传10次
});

// SCTP层配置（在RTCPeerConnection中）
const pc = new RTCPeerConnection({
  // ...
});

// 获取SCTP信息（用于判断是否支持DataChannel）
const sctpCapabilities = pc.sctp ? {
  maxMessageSize: pc.sctp.maxMessageSize,
  numChannels: pc.sctp.numChannels
} : null;

console.log('SCTP能力:', sctpCapabilities);
```

### 4.4 消息顺序与丢包处理

DataChannel的消息顺序和丢包处理是通过SCTP协议控制的。理解这些机制对于设计可靠的应用至关重要。

```javascript
// 消息顺序与丢包处理机制

/*
 * SCTP协议特性：
 *
 * 1. 消息分帧
 *    - 应用层的大消息会被分割成多个SCTP数据块
 *    - 每个数据块都有序列号
 *
 * 2. 选择性确认（SACK）
 *    - 接收方可以告知发送方哪些数据块已接收
 *    - 发送方可以只重传丢失的数据块
 *
 * 3. 流内顺序
 *    - ordered: true - 保证同一流内的消息顺序
 *    - ordered: false - 消息可能乱序到达
 *
 * 4. 多流复用
 *    - 一个DataChannel可以有多个流（stream）
 *    - 不同流之间相互独立，不保证顺序
 */

// 实现自定义消息确认机制
class ReliableDataChannel {
  constructor(dataChannel) {
    this.channel = dataChannel;
    this.pendingMessages = new Map();  // 待确认消息
    this.messageId = 0;
    this.onMessage = () => {};

    this.setupHandlers();
  }

  setupHandlers() {
    this.channel.onopen = () => {
      console.log('可靠数据通道已打开');
    };

    this.channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // 如果是确认消息
        if (message.type === 'ack') {
          const pending = this.pendingMessages.get(message.messageId);
          if (pending) {
            pending.resolve();
            this.pendingMessages.delete(message.messageId);
          }
          return;
        }

        // 如果是普通消息，发送确认
        this.sendAck(message.id);

        // 调用消息处理
        this.onMessage(message);
      } catch (error) {
        console.error('消息解析失败:', error);
      }
    };

    this.channel.onerror = (error) => {
      console.error('数据通道错误:', error);
    };

    this.channel.onclose = () => {
      console.log('数据通道已关闭');
    };
  }

  // 发送消息并等待确认
  sendWithAck(message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (this.channel.readyState !== 'open') {
        reject(new Error('数据通道未打开'));
        return;
      }

      const id = ++this.messageId;
      const packet = {
        id: id,
        type: 'message',
        content: message,
        timestamp: Date.now()
      };

      // 添加到待确认队列
      const timeoutId = setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error('消息确认超时'));
        }
      }, timeout);

      this.pendingMessages.set(id, {
        resolve,
        reject,
        timeoutId
      });

      // 发送消息
      this.channel.send(JSON.stringify(packet));
    });
  }

  // 发送确认
  sendAck(messageId) {
    if (this.channel.readyState === 'open') {
      this.channel.send(JSON.stringify({
        type: 'ack',
        messageId: messageId
      }));
    }
  }

  // 发送消息（不需要确认）
  send(message) {
    if (this.channel.readyState === 'open') {
      this.channel.send(JSON.stringify({
        id: ++this.messageId,
        type: 'message',
        content: message,
        timestamp: Date.now()
      }));
    }
  }

  // 关闭数据通道
  close() {
    this.channel.close();
  }
}

// 使用示例
const reliableChannel = new ReliableDataChannel(dataChannel);

reliableChannel.onMessage = (message) => {
  console.log('收到消息:', message.content);
};

// 发送需要确认的消息
async function sendReliable(message) {
  try {
    await reliableChannel.sendWithAck(message);
    console.log('消息已确认');
  } catch (error) {
    console.error('消息发送失败:', error);
  }
}
```

### 4.5 实战：P2P文件传输

利用DataChannel可以实现浏览器之间的P2P文件传输，速度快且不消耗服务器带宽。

```javascript
// P2P文件传输器
class P2PFileTransfer {
  constructor(dataChannel) {
    this.channel = dataChannel;
    this.chunkSize = 64 * 1024;  // 64KB分片
    this.receiveBuffer = [];
    this.onProgress = () => {};
    this.onComplete = () => {};
    this.onError = () => {};

    this.setupHandlers();
  }

  setupHandlers() {
    this.channel.onopen = () => {
      console.log('文件传输通道已就绪');
    };

    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.channel.onerror = (error) => {
      this.onError(error);
    };
  }

  // 处理接收到的消息
  handleMessage(data) {
    // 文件描述符消息
    if (typeof data === 'string') {
      const meta = JSON.parse(data);

      if (meta.type === 'file-start') {
        // 开始接收新文件
        console.log('开始接收文件:', meta.fileName, meta.fileSize, 'bytes');
        this.receiveBuffer = [];
        this.currentFileMeta = meta;
        this.receivedSize = 0;
      } else if (meta.type === 'file-end') {
        // 文件接收完成
        console.log('文件接收完成');
        this.onComplete(this.currentFileMeta, this.receiveBuffer);
      } else if (meta.type === 'file-abort') {
        // 传输中止
        console.log('传输被中止:', meta.reason);
        this.receiveBuffer = [];
      }
      return;
    }

    // 数据块
    this.receiveBuffer.push(data);
    this.receivedSize += data.byteLength;

    // 报告进度
    if (this.currentFileMeta) {
      const progress = (this.receivedSize / this.currentFileMeta.fileSize) * 100;
      this.onProgress(progress, this.receivedSize, this.currentFileMeta.fileSize);
    }
  }

  // 发送文件
  async sendFile(file) {
    if (this.channel.readyState !== 'open') {
      throw new Error('数据通道未打开');
    }

    console.log('开始发送文件:', file.name, file.size, 'bytes');

    // 发送文件开始信息
    this.channel.send(JSON.stringify({
      type: 'file-start',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: file.lastModified
    }));

    // 分片发送文件内容
    const arrayBuffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(arrayBuffer.byteLength / this.chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, arrayBuffer.byteLength);
      const chunk = arrayBuffer.slice(start, end);

      // 发送分片
      this.channel.send(chunk);

      // 报告进度
      const progress = ((i + 1) / totalChunks) * 100;
      this.onProgress(progress, end, arrayBuffer.byteLength);

      // 添加小延迟，避免阻塞UI
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    // 发送文件结束消息
    this.channel.send(JSON.stringify({
      type: 'file-end',
      fileName: file.name
    }));

    console.log('文件发送完成');
  }

  // 中止传输
  abort(reason = '用户中止') {
    this.channel.send(JSON.stringify({
      type: 'file-abort',
      reason: reason
    }));
  }

  // 将接收的Buffer转换为Blob
  bufferToBlob(buffer, mimeType = 'application/octet-stream') {
    return new Blob(buffer, { type: mimeType });
  }

  // 下载文件
  downloadFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// 使用示例
function setupFileTransfer(dataChannel) {
  const transfer = new P2PFileTransfer(dataChannel);

  // 监听进度
  transfer.onProgress = (progress, received, total) => {
    console.log(`传输进度: ${progress.toFixed(1)}% (${received}/${total})`);
    updateProgressBar(progress);
  };

  // 监听完成
  transfer.onComplete = (meta, buffer) => {
    console.log('文件接收完成:', meta.fileName);
    const blob = transfer.bufferToBlob(buffer, meta.fileType);
    transfer.downloadFile(blob, meta.fileName);
  };

  // 监听错误
  transfer.onError = (error) => {
    console.error('传输错误:', error);
  };

  return transfer;
}

// 发送文件
async function sendFile(file, transfer) {
  try {
    await transfer.sendFile(file);
    console.log('文件发送成功');
  } catch (error) {
    console.error('文件发送失败:', error);
  }
}
```

---

## 5. 媒体处理技术

### 5.1 视频轨道控制mute/unmute

在实际应用中，经常需要临时关闭或开启视频/音频轨道，比如"静音"按钮或"关闭摄像头"按钮。

```javascript
// 视频轨道控制

class MediaControls {
  constructor(stream) {
    this.stream = stream;
    this.videoTrack = stream.getVideoTracks()[0];
    this.audioTrack = stream.getAudioTracks()[0];
  }

  // 视频mute/unmute
  muteVideo() {
    if (this.videoTrack) {
      this.videoTrack.enabled = false;
      console.log('视频已静音');
    }
  }

  unmuteVideo() {
    if (this.videoTrack) {
      this.videoTrack.enabled = true;
      console.log('视频已开启');
    }
  }

  toggleVideo() {
    if (this.videoTrack) {
      this.videoTrack.enabled = !this.videoTrack.enabled;
      console.log('视频切换:', this.videoTrack.enabled ? '开启' : '静音');
      return this.videoTrack.enabled;
    }
    return false;
  }

  // 音频mute/unmute
  muteAudio() {
    if (this.audioTrack) {
      this.audioTrack.enabled = false;
      console.log('音频已静音');
    }
  }

  unmuteAudio() {
    if (this.audioTrack) {
      this.audioTrack.enabled = true;
      console.log('音频已开启');
    }
  }

  toggleAudio() {
    if (this.audioTrack) {
      this.audioTrack.enabled = !this.audioTrack.enabled;
      console.log('音频切换:', this.audioTrack.enabled ? '开启' : '静音');
      return this.audioTrack.enabled;
    }
    return false;
  }

  // 获取当前状态
  getStatus() {
    return {
      videoEnabled: this.videoTrack?.enabled ?? false,
      audioEnabled: this.audioTrack?.enabled ?? false,
      videoLabel: this.videoTrack?.label ?? null,
      audioLabel: this.audioTrack?.label ?? null
    };
  }
}

// 获取轨道设置
function getTrackSettings() {
  const stream = localVideo.srcObject;
  if (!stream) return null;

  const videoTrack = stream.getVideoTracks()[0];
  const audioTrack = stream.getAudioTracks()[0];

  return {
    video: {
      enabled: videoTrack.enabled,
      muted: videoTrack.muted,
      label: videoTrack.label,
      settings: videoTrack.getSettings(),
      constraints: videoTrack.getConstraints()
    },
    audio: {
      enabled: audioTrack.enabled,
      muted: audioTrack.muted,
      label: audioTrack.label,
      settings: audioTrack.getSettings(),
      constraints: audioTrack.getConstraints()
    }
  };
}
```

### 5.2 媒体轨道替换replaceTrack

在通话过程中，可能需要切换摄像头（如从后置切换到前置）或共享屏幕。WebRTC支持在不重新建立连接的情况下替换轨道。

```javascript
// 替换轨道实现

class TrackReplacer {
  constructor(peerConnection) {
    this.pc = peerConnection;
    this.senders = new Map();
  }

  // 初始化发送者
  initializeSenders(stream) {
    stream.getTracks().forEach(track => {
      const sender = this.pc.addTrack(track, stream);
      this.senders.set(track.kind, { sender, track, stream });
    });
  }

  // 替换视频轨道（摄像头切换或屏幕共享）
  async replaceVideoTrack(newStream) {
    const newVideoTrack = newStream.getVideoTracks()[0];
    const senderInfo = this.senders.get('video');

    if (!senderInfo) {
      throw new Error('未找到视频发送者');
    }

    // 使用replaceTrack替换轨道
    await senderInfo.sender.replaceTrack(newVideoTrack);

    // 更新缓存
    senderInfo.track = newVideoTrack;
    senderInfo.stream = newStream;

    console.log('视频轨道已替换');
    return newVideoTrack;
  }

  // 切换到屏幕共享
  async switchToScreenShare(screenStream) {
    console.log('切换到屏幕共享');

    // 保存当前摄像头轨道（如果需要稍后恢复）
    const cameraTrack = this.senders.get('video')?.track;

    await this.replaceVideoTrack(screenStream);

    // 返回一个恢复函数
    return async () => {
      if (cameraTrack) {
        const cameraStream = new MediaStream([cameraTrack]);
        await this.replaceVideoTrack(cameraStream);
        console.log('已恢复到摄像头');
      }
    };
  }

  // 从屏幕共享切换回摄像头
  async switchFromScreenShare(cameraStream) {
    await this.replaceVideoTrack(cameraStream);
    console.log('已切换到摄像头');
  }

  // 替换音频轨道
  async replaceAudioTrack(newStream) {
    const newAudioTrack = newStream.getAudioTracks()[0];
    const senderInfo = this.senders.get('audio');

    if (!senderInfo) {
      throw new Error('未找到音频发送者');
    }

    await senderInfo.sender.replaceTrack(newAudioTrack);

    senderInfo.track = newAudioTrack;
    senderInfo.stream = newStream;

    console.log('音频轨道已替换');
    return newAudioTrack;
  }
}

// 实际使用示例
async function switchCamera(webrtcClient, peerConnection) {
  // 获取新的摄像头流
  const newStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }  // 切换到后置摄像头
  });

  // 获取当前的发送者
  const senders = peerConnection.getSenders();
  const videoSender = senders.find(s => s.track?.kind === 'video');

  if (videoSender) {
    const newVideoTrack = newStream.getVideoTracks()[0];
    await videoSender.replaceTrack(newVideoTrack);
    console.log('摄像头已切换');

    // 停止旧的视频轨道
    const oldStream = webrtcClient.localStream;
    oldStream.getVideoTracks().forEach(t => t.stop());

    // 更新本地流
    const combinedStream = new MediaStream([
      ...oldStream.getAudioTracks(),
      ...newStream.getVideoTracks()
    ]);
    webrtcClient.localStream = combinedStream;
  }
}

// 屏幕共享切换
async function toggleScreenShare(webrtcClient, peerConnection) {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false
  });

  const senders = peerConnection.getSenders();
  const videoSender = senders.find(s => s.track?.kind === 'video');

  if (videoSender) {
    const screenTrack = screenStream.getVideoTracks()[0];
    await videoSender.replaceTrack(screenTrack);

    // 监听用户停止屏幕共享
    screenTrack.onended = async () => {
      console.log('用户停止了屏幕共享');

      // 恢复到摄像头
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      const cameraTrack = cameraStream.getVideoTracks()[0];
      await videoSender.replaceTrack(cameraTrack);

      // 更新本地视频显示
      localVideo.srcObject = cameraStream;
    };
  }
}
```

### 5.3 媒体录制MediaRecorder

MediaRecorder API允许将MediaStream录制为各种格式的媒体文件。

```javascript
// 媒体录制器

class MediaRecorder {
  constructor(stream, options = {}) {
    this.stream = stream;
    this.recorder = null;
    this.chunks = [];
    this.options = {
      mimeType: options.mimeType || 'video/webm;codecs=vp9',
      videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
      audioBitsPerSecond: options.audioBitsPerSecond || 128000
    };
    this.onDataAvailable = () => {};
    this.onStop = () => {};
    this.onError = () => {};
  }

  // 开始录制
  start(timeSlice = 1000) {
    if (MediaRecorder.isTypeSupported(this.options.mimeType)) {
      this.recorder = new window.MediaRecorder(
        this.stream,
        this.options
      );
    } else {
      console.warn('不支持的MIME类型，使用默认');
      this.recorder = new window.MediaRecorder(this.stream);
    }

    this.chunks = [];

    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
        this.onDataAvailable(event.data);
      }
    };

    this.recorder.onstop = () => {
      const blob = new Blob(this.chunks, {
        type: this.options.mimeType.split(';')[0]
      });
      this.onStop(blob);
    };

    this.recorder.onerror = (event) => {
      this.onError(event.error);
    };

    this.recorder.start(timeSlice);
    console.log('录制开始');
  }

  // 暂停录制
  pause() {
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.pause();
      console.log('录制暂停');
    }
  }

  // 恢复录制
  resume() {
    if (this.recorder && this.recorder.state === 'paused') {
      this.recorder.resume();
      console.log('录制恢复');
    }
  }

  // 停止录制
  stop() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
      console.log('录制停止');
    }
  }

  // 获取录制状态
  getState() {
    return this.recorder?.state || 'inactive';
  }

  // 获取支持的MIME类型
  static getSupportedTypes() {
    return {
      video: [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ].filter(type => MediaRecorder.isTypeSupported(type)),

      audio: [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg'
      ].filter(type => MediaRecorder.isTypeSupported(type))
    };
  }
}

// 使用示例
class RecordingManager {
  constructor() {
    this.recorder = null;
    this.localStream = null;
  }

  // 设置本地流
  setStream(stream) {
    this.localStream = stream;
  }

  // 开始录制
  startRecording() {
    if (!this.localStream) {
      console.error('没有可录制的流');
      return;
    }

    this.recorder = new MediaRecorder(this.localStream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000
    });

    const chunks = [];

    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    this.recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      this.downloadBlob(blob, `recording_${Date.now()}.webm`);
    };

    this.recorder.start(1000);  // 每秒一个数据块
    console.log('录制开始');
  }

  // 停止录制
  stopRecording() {
    if (this.recorder) {
      this.recorder.stop();
    }
  }

  // 下载Blob文件
  downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
```

### 5.4 截图与滤镜处理

可以对视频轨道进行截图和应用各种滤镜效果。

```javascript
// 截图功能

class ScreenshotCapturer {
  constructor(videoElement) {
    this.video = videoElement;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  // 截取当前帧
  capture(format = 'image/png', quality = 0.92) {
    // 设置画布尺寸为视频尺寸
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    // 绘制当前帧
    this.ctx.drawImage(this.video, 0, 0);

    // 返回DataURL
    if (format === 'dataurl') {
      return this.canvas.toDataURL(format, quality);
    }

    // 返回Blob
    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, format, quality);
    });
  }

  // 下载截图
  download(fileName = 'screenshot.png') {
    const dataUrl = this.capture('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// 滤镜处理

class VideoFilter {
  constructor(videoElement) {
    this.video = videoElement;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.filters = {
      none: '',
      grayscale: 'grayscale(100%)',
      sepia: 'sepia(100%)',
      blur: 'blur(3px)',
      brightness: 'brightness(150%)',
      contrast: 'contrast(200%)',
      hueRotate: 'hue-rotate(90deg)',
      saturate: 'saturate(200%)',
      invert: 'invert(100%)'
    };
    this.currentFilter = 'none';
    this.isProcessing = false;
    this.outputElement = null;
  }

  // 设置输出元素
  setOutput(element) {
    this.outputElement = element;
  }

  // 应用滤镜
  apply(filterName) {
    if (this.filters[filterName] !== undefined) {
      this.currentFilter = filterName;
      if (this.outputElement) {
        this.outputElement.style.filter = this.filters[filterName];
      }
      console.log('滤镜已应用:', filterName);
    }
  }

  // 移除滤镜
  remove() {
    this.currentFilter = 'none';
    if (this.outputElement) {
      this.outputElement.style.filter = '';
    }
  }

  // 开始实时滤镜处理
  startProcessing(outputElement) {
    this.outputElement = outputElement;
    this.isProcessing = true;
    this.processFrame();
  }

  // 停止处理
  stopProcessing() {
    this.isProcessing = false;
  }

  // 处理每一帧
  processFrame() {
    if (!this.isProcessing) return;

    // 如果有滤镜需要应用
    if (this.currentFilter !== 'none') {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;

      // 应用CSS滤镜到画布上下文
      this.ctx.filter = this.filters[this.currentFilter];
      this.ctx.drawImage(this.video, 0, 0);

      // 将处理后的帧显示到输出元素
      if (this.outputElement) {
        this.outputElement.srcObject = null;
        this.outputElement.src = this.canvas.toDataURL();
      }
    }

    requestAnimationFrame(() => this.processFrame());
  }

  // 添加自定义滤镜
  addCustomFilter(name, filterValue) {
    this.filters[name] = filterValue;
  }

  // 获取可用滤镜列表
  getAvailableFilters() {
    return Object.keys(this.filters);
  }
}

// WebGL滤镜（更高效的实时处理）
class WebGLFilter {
  constructor(videoElement) {
    this.video = videoElement;
    this.gl = null;
    this.program = null;
    this.texture = null;
  }

  // 初始化WebGL
  init(canvas) {
    this.gl = canvas.getContext('webgl');
    if (!this.gl) {
      console.error('WebGL不可用');
      return false;
    }

    // 设置画布尺寸
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    this.gl.viewport(0, 0, canvas.width, canvas.height);

    return true;
  }

  // 应用灰度滤镜
  applyGrayscale(gl, program) {
    // 设置着色器代码
    const vertexShader = `
      attribute vec2 position;
      varying vec2 vTexCoord;
      void main() {
        vTexCoord = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D uTexture;
      varying vec2 vTexCoord;
      void main() {
        vec4 color = texture2D(uTexture, vTexCoord);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 114));
        gl_FragColor = vec4(vec3(gray), color.a);
      }
    `;

    // 编译着色器并创建程序
    // ... (省略着色器编译代码)

    return program;
  }
}
```

---

## 6. 实战项目：完整视频通话系统

### 6.1 项目概述与架构设计

本节将实现一个完整的一对一视频通话系统，包含以下核心功能：

```
视频通话系统架构

+------------------------------------------------------------------+
|                          前端                                     |
|                                                                  |
|  +-------------+    +-------------+    +-------------+            |
|  |  本地视频    |    |  远程视频    |    |  控制面板    |            |
|  |  localVideo |    | remoteVideo |    |   controls  |            |
|  +-------------+    +-------------+    +-------------+            |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                    WebRTC Manager                           |  |
|  |  +----------+  +----------+  +----------+  +------------+    |  |
|  |  | getUser  |  | RTCPeer |  | Data     |  | Media      |    |  |
|  |  | Media    |  | Connect |  | Channel  |  | Controls   |    |  |
|  |  +----------+  +----------+  +----------+  +------------+    |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
                              |
                              | Socket.io 信令
                              v
+------------------------------------------------------------------+
|                        信令服务器                                 |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |  用户管理  |  房间管理  |  消息转发  |  状态同步            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### 6.2 HTML结构与CSS样式

```html
<!-- index.html - 视频通话界面 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebRTC视频通话</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    /* 通话界面 */
    .call-interface {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .video-container {
      position: relative;
      background: #0f0f23;
      border-radius: 16px;
      overflow: hidden;
      aspect-ratio: 16/9;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .video-container.remote {
      border: 2px solid #4a90d9;
    }

    .video-container.local {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 200px;
      height: 150px;
      border: 2px solid #4ade80;
      z-index: 10;
    }

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .video-label {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.6);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
    }

    /* 控制面板 */
    .controls {
      display: flex;
      justify-content: center;
      gap: 16px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }

    .control-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 20px;
    }

    .control-btn.primary {
      background: #4ade80;
      color: #000;
    }

    .control-btn.primary:hover {
      background: #22c55e;
      transform: scale(1.1);
    }

    .control-btn.danger {
      background: #ef4444;
      color: #fff;
    }

    .control-btn.danger:hover {
      background: #dc2626;
    }

    .control-btn.secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .control-btn.secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .control-btn.active {
      background: #ef4444;
    }

    .control-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* 通话状态 */
    .call-status {
      text-align: center;
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      margin-bottom: 20px;
    }

    .call-status h2 {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .call-status p {
      color: rgba(255, 255, 255, 0.7);
    }

    /* 等待连接界面 */
    .waiting-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .waiting-card {
      background: #1a1a2e;
      padding: 40px;
      border-radius: 24px;
      text-align: center;
      box-shadow: 0 16px 64px rgba(0, 0, 0, 0.4);
    }

    .waiting-card h2 {
      margin-bottom: 20px;
    }

    .user-input {
      width: 100%;
      padding: 12px 16px;
      margin-bottom: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      font-size: 16px;
    }

    .user-input:focus {
      outline: none;
      border-color: #4ade80;
    }

    .btn {
      width: 100%;
      padding: 14px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #4ade80;
      color: #000;
    }

    .btn-primary:hover {
      background: #22c55e;
    }

    .btn-primary:disabled {
      background: #666;
      cursor: not-allowed;
    }

    /* 隐藏类 */
    .hidden {
      display: none !important;
    }

    /* 连接质量指示器 */
    .connection-quality {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 4px;
      align-items: flex-end;
    }

    .quality-bar {
      width: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }

    .quality-bar:nth-child(1) { height: 6px; }
    .quality-bar:nth-child(2) { height: 10px; }
    .quality-bar:nth-child(3) { height: 14px; }
    .quality-bar:nth-child(4) { height: 18px; }

    .quality-bar.active {
      background: #4ade80;
    }

    .quality-bar.warning {
      background: #fbbf24;
    }

    .quality-bar.danger {
      background: #ef4444;
    }
  </style>
</head>
<body>
  <!-- 等待界面 -->
  <div id="waiting-overlay" class="waiting-overlay">
    <div class="waiting-card">
      <h2>WebRTC视频通话</h2>
      <p style="margin-bottom: 20px; color: rgba(255,255,255,0.7);">
        输入您的用户名和对方用户名开始通话
      </p>
      <input type="text" id="username-input" class="user-input" placeholder="您的用户名">
      <input type="text" id="target-input" class="user-input" placeholder="对方用户名">
      <button id="call-btn" class="btn btn-primary">发起呼叫</button>
    </div>
  </div>

  <!-- 通话界面 -->
  <div id="call-interface" class="container hidden">
    <div class="call-status">
      <h2 id="status-title">等待连接...</h2>
      <p id="status-detail">正在等待对方加入</p>
    </div>

    <div class="call-interface">
      <!-- 远程视频 -->
      <div class="video-container remote">
        <video id="remote-video" autoplay playsinline></video>
        <div class="video-label" id="remote-label">对方</div>
        <div class="connection-quality" id="connection-quality">
          <div class="quality-bar"></div>
          <div class="quality-bar"></div>
          <div class="quality-bar"></div>
          <div class="quality-bar"></div>
        </div>
      </div>
    </div>

    <!-- 本地视频（小窗口） -->
    <div class="video-container local">
      <video id="local-video" autoplay playsinline muted></video>
      <div class="video-label">您</div>
    </div>

    <!-- 控制面板 -->
    <div class="controls">
      <button id="mute-btn" class="control-btn secondary" title="静音">
        <span id="mute-icon">🔇</span>
      </button>
      <button id="video-btn" class="control-btn secondary" title="关闭摄像头">
        <span id="video-icon">📹</span>
      </button>
      <button id="screen-btn" class="control-btn secondary" title="屏幕共享">
        <span>🖥️</span>
      </button>
      <button id="hangup-btn" class="control-btn danger" title="挂断">
        <span>📞</span>
      </button>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script src="webrtc-client.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

### 6.3 WebRTC客户端封装

```javascript
// webrtc-client.js - WebRTC客户端完整封装

/**
 * WebRTC客户端类
 * 负责管理本地媒体流、PeerConnection、信令交换
 */
class WebRTCClient {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {string} options.socketUrl - Socket.io服务器地址
   * @param {Function} options.onLocalStream - 本地流就绪回调
   * @param {Function} options.onRemoteStream - 远程流就绪回调
   * @param {Function} options.onConnectionStateChange - 连接状态变化回调
   * @param {Function} options.onError - 错误处理回调
   */
  constructor(options) {
    // Socket.io连接
    this.socket = io(options.socketUrl || 'http://localhost:3001');

    // 本地媒体流
    this.localStream = null;

    // PeerConnection映射（支持多方通话）
    this.peerConnections = new Map();

    // 当前用户名
    this.currentUser = null;

    // 目标用户名（用于一对一通话）
    this.targetUser = null;

    // 通话状态
    this.callState = 'idle';  // idle, calling, called, connected, ended

    // ICE服务器配置
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.google.com:19302' },
      { urls: 'stun:stun2.google.com:19302' },
      {
        urls: 'turn:turn.example.com:3478',
        username: 'user',
        credential: 'password'
      }
    ];

    // 回调函数
    this.onLocalStream = options.onLocalStream || (() => {});
    this.onRemoteStream = options.onRemoteStream || (() => {});
    this.onConnectionStateChange = options.onConnectionStateChange || (() => {});
    this.onCallStateChange = options.onCallStateChange || (() => {});
    this.onError = options.onError || console.error;
    this.onPeerJoined = options.onPeerJoined || (() => {});
    this.onPeerLeft = options.onPeerLeft || (() => {});
    this.on ICEStats = options.onICEStats || (() => {});

    // 初始化
    this.initializeSocketHandlers();
  }

  /**
   * 初始化Socket.io事件处理
   */
  initializeSocketHandlers() {
    // 连接成功
    this.socket.on('connect', () => {
      console.log('Socket.io连接成功');
    });

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('Socket.io连接错误:', error);
      this.onError('连接服务器失败', error);
    });

    // 用户列表更新
    this.socket.on('users', (users) => {
      console.log('在线用户列表:', users);
    });

    // 用户加入
    this.socket.on('user-joined', (data) => {
      console.log('用户加入:', data.userId);
      this.onPeerJoined(data.userId);
    });

    // 用户离开
    this.socket.on('user-left', (data) => {
      console.log('用户离开:', data.userId);
      this.handlePeerDisconnect(data.userId);
      this.onPeerLeft(data.userId);
    });

    // 收到呼叫（Offer）
    this.socket.on('offer', async (data) => {
      console.log('收到呼叫:', data.fromUserId);
      this.targetUser = data.fromUserId;
      await this.handleOffer(data);
    });

    // 收到应答（Answer）
    this.socket.on('answer', async (data) => {
      console.log('收到应答:', data.fromUserId);
      await this.handleAnswer(data);
    });

    // 收到ICE候选
    this.socket.on('ice-candidate', async (data) => {
      await this.handleIceCandidate(data);
    });

    // 对方挂断
    this.socket.on('hang-up', (data) => {
      console.log('对方挂断:', data.fromUserId);
      this.handleHangUp(data.fromUserId);
    });

    // 呼叫错误
    this.socket.on('call-error', (data) => {
      console.error('呼叫错误:', data.message);
      this.onError(data.message);
      this.setCallState('ended');
    });

    // 被呼叫
    this.socket.on('calling', (data) => {
      console.log('正在呼叫...', data.targetUserId);
      this.setCallState('calling');
    });
  }

  /**
   * 注册用户
   * @param {string} userId - 用户名
   */
  async register(userId) {
    return new Promise((resolve, reject) => {
      this.currentUser = userId;

      this.socket.emit('register', userId, (response) => {
        if (response.success) {
          console.log('注册成功:', userId);
          resolve();
        } else {
          console.error('注册失败:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * 获取本地媒体流
   * @param {Object} constraints - 媒体约束
   */
  async getLocalStream(constraints = {}) {
    const defaultConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 60 },
        facingMode: 'user'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    };

    const mergedConstraints = {
      video: Object.keys(constraints.video || {}).length > 0
        ? constraints.video
        : defaultConstraints.video,
      audio: Object.keys(constraints.audio || {}).length > 0
        ? constraints.audio
        : defaultConstraints.audio
    };

    try {
      console.log('请求媒体设备...');
      this.localStream = await navigator.mediaDevices.getUserMedia(mergedConstraints);
      console.log('本地媒体流获取成功');

      // 监听设备变化
      this.localStream.getTracks().forEach(track => {
        track.onended = () => {
          console.log('本地轨道结束:', track.kind);
        };
      });

      this.onLocalStream(this.localStream);
      return this.localStream;
    } catch (error) {
      console.error('获取本地媒体流失败:', error);
      this.onError('无法访问摄像头或麦克风', error);
      throw error;
    }
  }

  /**
   * 创建PeerConnection
   * @param {string} remoteUserId - 远程用户ID
   */
  createPeerConnection(remoteUserId) {
    // 如果已存在，先关闭
    if (this.peerConnections.has(remoteUserId)) {
      this.peerConnections.get(remoteUserId).close();
    }

    console.log('创建PeerConnection:', remoteUserId);

    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10
    });

    // 添加本地轨道
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
        console.log('添加本地轨道:', track.kind);
      });
    }

    // 监听远程轨道
    pc.ontrack = (event) => {
      console.log('收到远程轨道:', remoteUserId, event.track.kind);
      const [remoteStream] = event.streams;
      if (remoteStream) {
        this.onRemoteStream(remoteUserId, remoteStream);
      }
    };

    // 监听ICE候选
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE候选:', event.candidate.type, event.candidate.protocol);
        this.socket.emit('ice-candidate', {
          targetUserId: remoteUserId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    // 监听连接状态变化
    pc.onconnectionstatechange = () => {
      console.log('连接状态 [' + remoteUserId + ']:', pc.connectionState);
      this.onConnectionStateChange(remoteUserId, pc.connectionState);

      if (pc.connectionState === 'connected') {
        this.setCallState('connected');
      } else if (pc.connectionState === 'disconnected') {
        this.onConnectionStateChange(remoteUserId, 'disconnected');
      } else if (pc.connectionState === 'failed') {
        this.onConnectionStateChange(remoteUserId, 'failed');
        this.onError('连接失败，请检查网络');
      }
    };

    // 监听ICE连接状态
    pc.oniceconnectionstatechange = () => {
      console.log('ICE状态 [' + remoteUserId + ']:', pc.iceconnectionstate);
    };

    // 监听ICE收集状态
    pc.onicegatheringstatechange = () => {
      console.log('ICE收集状态 [' + remoteUserId + ']:', pc.iceGatheringState);
    };

    // 监听数据通道
    pc.ondatachannel = (event) => {
      console.log('收到数据通道:', event.channel.label);
      this.handleDataChannel(remoteUserId, event.channel);
    };

    this.peerConnections.set(remoteUserId, pc);
    return pc;
  }

  /**
   * 发起呼叫
   * @param {string} targetUserId - 目标用户ID
   */
  async call(targetUserId) {
    console.log('发起呼叫到:', targetUserId);

    if (this.callState !== 'idle') {
      console.warn('当前通话状态不允许呼叫:', this.callState);
      return;
    }

    this.targetUser = targetUserId;
    this.setCallState('calling');

    // 创建PeerConnection
    const pc = this.createPeerConnection(targetUserId);

    // 创建数据通道（用于传输额外数据）
    const dataChannel = pc.createDataChannel('main', {
      ordered: true,
      maxRetransmits: 3
    });
    this.setupDataChannel(targetUserId, dataChannel);

    // 创建Offer
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      console.log('Offer创建成功');

      // 设置本地描述
      await pc.setLocalDescription(offer);
      console.log('本地描述已设置');

      // 发送Offer
      this.socket.emit('offer', {
        targetUserId: targetUserId,
        offer: {
          type: 'offer',
          sdp: pc.localDescription.sdp
        }
      });

      console.log('Offer已发送');
    } catch (error) {
      console.error('创建Offer失败:', error);
      this.onError('创建呼叫失败', error);
      this.setCallState('ended');
    }
  }

  /**
   * 处理收到的呼叫
   * @param {Object} data - 呼叫数据
   */
  async handleOffer(data) {
    const { fromUserId, offer } = data;

    console.log('处理来自', fromUserId, '的呼叫');

    this.setCallState('called');

    // 创建PeerConnection
    const pc = this.createPeerConnection(fromUserId);

    try {
      // 设置远程描述（Offer）
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('远程描述已设置');

      // 创建Answer
      const answer = await pc.createAnswer();
      console.log('Answer创建成功');

      // 设置本地描述
      await pc.setLocalDescription(answer);
      console.log('本地描述已设置');

      // 发送Answer
      this.socket.emit('answer', {
        targetUserId: fromUserId,
        answer: {
          type: 'answer',
          sdp: pc.localDescription.sdp
        }
      });

      console.log('Answer已发送');
    } catch (error) {
      console.error('处理呼叫失败:', error);
      this.onError('接听失败', error);
      this.setCallState('ended');
    }
  }

  /**
   * 处理收到的应答
   * @param {Object} data - 应答数据
   */
  async handleAnswer(data) {
    const { fromUserId, answer } = data;

    console.log('处理来自', fromUserId, '的应答');

    const pc = this.peerConnections.get(fromUserId);
    if (!pc) {
      console.error('未找到PeerConnection:', fromUserId);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('远程描述（Answer）已设置');
      this.setCallState('connected');
    } catch (error) {
      console.error('处理应答失败:', error);
      this.onError('连接建立失败', error);
    }
  }

  /**
   * 处理收到的ICE候选
   * @param {Object} data - ICE候选数据
   */
  async handleIceCandidate(data) {
    const { fromUserId, candidate } = data;

    const pc = this.peerConnections.get(fromUserId);
    if (!pc) {
      console.error('未找到PeerConnection:', fromUserId);
      return;
    }

    try {
      if (candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('ICE候选添加成功');
      }
    } catch (error) {
      console.error('添加ICE候选失败:', error);
    }
  }

  /**
   * 处理数据通道
   * @param {string} userId - 用户ID
   * @param {RTCDataChannel} channel - 数据通道
   */
  setupDataChannel(userId, channel) {
    channel.onopen = () => {
      console.log('数据通道已打开:', channel.label);
    };

    channel.onclose = () => {
      console.log('数据通道已关闭:', channel.label);
    };

    channel.onmessage = (event) => {
      console.log('收到数据通道消息:', event.data);
      try {
        const message = JSON.parse(event.data);
        this.handleDataMessage(userId, message);
      } catch (e) {
        // 非JSON消息
        console.log('收到原始消息:', event.data);
      }
    };

    channel.onerror = (error) => {
      console.error('数据通道错误:', error);
    };
  }

  /**
   * 处理数据消息
   * @param {string} userId - 用户ID
   * @param {Object} message - 消息内容
   */
  handleDataMessage(userId, message) {
    // 可以在这里处理各种自定义消息类型
    switch (message.type) {
      case 'chat':
        console.log('收到聊天消息:', message.content);
        break;
      case 'typing':
        console.log('对方正在输入...');
        break;
      default:
        console.log('未知消息类型:', message.type);
    }
  }

  /**
   * 通过数据通道发送消息
   * @param {string} userId - 目标用户ID
   * @param {Object} message - 消息内容
   */
  sendDataMessage(userId, message) {
    const pc = this.peerConnections.get(userId);
    if (!pc) {
      console.error('未找到PeerConnection');
      return;
    }

    // 获取或创建数据通道
    let dataChannel = pc.getDataChannels().find(ch => ch.label === 'main');

    if (!dataChannel) {
      dataChannel = pc.createDataChannel('main', { ordered: true });
      this.setupDataChannel(userId, dataChannel);
    }

    if (dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify(message));
    } else {
      dataChannel.onopen = () => {
        dataChannel.send(JSON.stringify(message));
      };
    }
  }

  /**
   * 挂断
   * @param {string} targetUserId - 目标用户ID（可选）
   */
  hangUp(targetUserId) {
    const target = targetUserId || this.targetUser;

    if (target) {
      const pc = this.peerConnections.get(target);
      if (pc) {
        pc.close();
        this.peerConnections.delete(target);
      }

      this.socket.emit('hang-up', { targetUserId: target });
    }

    console.log('通话已挂断');
    this.setCallState('ended');

    // 停止本地流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.targetUser = null;
  }

  /**
   * 处理对方挂断
   * @param {string} fromUserId - 对方用户ID
   */
  handleHangUp(fromUserId) {
    const pc = this.peerConnections.get(fromUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(fromUserId);
    }

    this.setCallState('ended');
    this.targetUser = null;
  }

  /**
   * 处理对端断开
   * @param {string} userId - 用户ID
   */
  handlePeerDisconnect(userId) {
    this.handleHangUp(userId);
  }

  /**
   * 静音/取消静音
   * @param {boolean} mute - 是否静音
   */
  setAudioMute(mute) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !mute;
      });
      console.log('音频:', mute ? '已静音' : '已取消静音');
      return mute;
    }
    return false;
  }

  /**
   * 视频开关
   * @param {boolean} disable - 是否关闭视频
   */
  setVideoDisable(disable) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !disable;
      });
      console.log('视频:', disable ? '已关闭' : '已开启');
      return disable;
    }
    return false;
  }

  /**
   * 切换摄像头
   */
  async switchCamera() {
    if (!this.localStream) return;

    // 获取所有视频设备
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');

    if (videoDevices.length < 2) {
      console.warn('没有可切换的摄像头');
      return;
    }

    // 获取当前使用的摄像头
    const currentTrack = this.localStream.getVideoTracks()[0];
    const currentDeviceId = currentTrack.getSettings().deviceId;

    // 找到下一个摄像头
    const currentIndex = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    const nextDevice = videoDevices[nextIndex];

    console.log('切换到:', nextDevice.label);

    // 停止当前轨道
    currentTrack.stop();

    // 获取新的视频流
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: nextDevice.deviceId } }
    });

    const newVideoTrack = newStream.getVideoTracks()[0];

    // 替换所有PeerConnection中的轨道
    for (const [userId, pc] of this.peerConnections) {
      const senders = pc.getSenders();
      const videoSender = senders.find(s => s.track?.kind === 'video');

      if (videoSender) {
        await videoSender.replaceTrack(newVideoTrack);
      }
    }

    // 更新本地流
    this.localStream.removeTrack(currentTrack);
    this.localStream.addTrack(newVideoTrack);

    // 触发回调
    this.onLocalStream(this.localStream);

    console.log('摄像头切换成功');
    return newStream;
  }

  /**
   * 切换到屏幕共享
   */
  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: false
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      console.log('屏幕共享开始:', screenTrack.label);

      // 替换所有PeerConnection中的轨道
      for (const [userId, pc] of this.peerConnections) {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');

        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }
      }

      // 监听屏幕共享结束
      screenTrack.onended = async () => {
        console.log('屏幕共享结束');
        await this.stopScreenShare();
      };

      // 临时保存摄像头轨道信息
      this.screenShareTrack = screenTrack;

      return screenStream;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('屏幕共享失败:', error);
        this.onError('屏幕共享失败', error);
      }
      return null;
    }
  }

  /**
   * 停止屏幕共享
   */
  async stopScreenShare() {
    if (!this.screenShareTrack) return;

    // 停止屏幕共享轨道
    this.screenShareTrack.stop();

    // 恢复摄像头轨道
    if (this.localStream) {
      const cameraTrack = this.localStream.getVideoTracks()[0];

      if (cameraTrack) {
        for (const [userId, pc] of this.peerConnections) {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');

          if (videoSender) {
            await videoSender.replaceTrack(cameraTrack);
          }
        }
      }
    }

    this.screenShareTrack = null;
    console.log('已恢复正常摄像头');
  }

  /**
   * 设置通话状态
   * @param {string} state - 通话状态
   */
  setCallState(state) {
    this.callState = state;
    this.onCallStateChange(state);
  }

  /**
   * 获取通话统计信息
   * @param {string} userId - 用户ID
   */
  async getStats(userId) {
    const pc = this.peerConnections.get(userId);
    if (!pc) return null;

    const stats = await pc.getStats();
    const result = {
      timestamp: Date.now(),
      streams: []
    };

    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        result.streams.push({
          type: 'inbound',
          kind: report.kind,
          packetsLost: report.packetsLost,
          fractionLost: report.fractionLost,
          bytesReceived: report.bytesReceived,
          packetsReceived: report.packetsReceived,
          frameWidth: report.frameWidth,
          frameHeight: report.frameHeight,
          framesPerSecond: report.framesPerSecond,
          roundTripTime: report.roundTripTime,
          jitter: report.jitter
        });
      } else if (report.type === 'outbound-rtp' && report.kind === 'video') {
        result.streams.push({
          type: 'outbound',
          kind: report.kind,
          bytesSent: report.bytesSent,
          packetsSent: report.packetsSent,
          frameWidth: report.frameWidth,
          frameHeight: report.frameHeight,
          framesPerSecond: report.framesPerSecond
        });
      }
    });

    return result;
  }

  /**
   * 关闭客户端
   */
  close() {
    console.log('关闭WebRTC客户端');

    // 挂断所有通话
    for (const [userId] of this.peerConnections) {
      this.hangUp(userId);
    }

    // 停止本地流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // 断开Socket连接
    this.socket.disconnect();

    this.setCallState('ended');
  }
}
```

### 6.4 应用主逻辑

```javascript
// app.js - 视频通话应用主逻辑

/**
 * 视频通话应用类
 * 负责UI交互和业务逻辑
 */
class VideoCallApp {
  constructor() {
    // DOM元素
    this.waitingOverlay = document.getElementById('waiting-overlay');
    this.callInterface = document.getElementById('call-interface');
    this.usernameInput = document.getElementById('username-input');
    this.targetInput = document.getElementById('target-input');
    this.callBtn = document.getElementById('call-btn');
    this.statusTitle = document.getElementById('status-title');
    this.statusDetail = document.getElementById('status-detail');
    this.localVideo = document.getElementById('local-video');
    this.remoteVideo = document.getElementById('remote-video');
    this.remoteLabel = document.getElementById('remote-label');
    this.muteBtn = document.getElementById('mute-btn');
    this.muteIcon = document.getElementById('mute-icon');
    this.videoBtn = document.getElementById('video-btn');
    this.videoIcon = document.getElementById('video-icon');
    this.screenBtn = document.getElementById('screen-btn');
    this.hangupBtn = document.getElementById('hangup-btn');
    this.connectionQuality = document.getElementById('connection-quality');

    // 状态
    this.isMuted = false;
    this.isVideoOff = false;
    this.isScreenSharing = false;
    this.webrtcClient = null;
    this.currentUser = null;

    // 初始化
    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 呼叫按钮
    this.callBtn.addEventListener('click', () => this.startCall());

    // 静音按钮
    this.muteBtn.addEventListener('click', () => this.toggleMute());

    // 视频按钮
    this.videoBtn.addEventListener('click', () => this.toggleVideo());

    // 屏幕共享按钮
    this.screenBtn.addEventListener('click', () => this.toggleScreenShare());

    // 挂断按钮
    this.hangupBtn.addEventListener('click', () => this.endCall());

    // 回车键触发呼叫
    this.targetInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.startCall();
      }
    });
  }

  /**
   * 开始呼叫
   */
  async startCall() {
    const username = this.usernameInput.value.trim();
    const targetUser = this.targetInput.value.trim();

    if (!username || !targetUser) {
      alert('请输入用户名和目标用户');
      return;
    }

    if (username === targetUser) {
      alert('不能呼叫自己');
      return;
    }

    this.currentUser = username;
    this.callBtn.disabled = true;
    this.callBtn.textContent = '连接中...';

    try {
      // 创建WebRTC客户端
      this.webrtcClient = new WebRTCClient({
        socketUrl: 'http://localhost:3001',
        onLocalStream: (stream) => this.handleLocalStream(stream),
        onRemoteStream: (userId, stream) => this.handleRemoteStream(userId, stream),
        onConnectionStateChange: (userId, state) => this.handleConnectionStateChange(userId, state),
        onCallStateChange: (state) => this.handleCallStateChange(state),
        onError: (message, error) => this.showError(message)
      });

      // 注册用户
      await this.webrtcClient.register(username);

      // 获取本地媒体流
      await this.webrtcClient.getLocalStream();

      // 发起呼叫
      await this.webrtcClient.call(targetUser);

      // 显示通话界面
      this.showCallInterface();

    } catch (error) {
      console.error('启动呼叫失败:', error);
      this.showError('启动呼叫失败: ' + error.message);
      this.callBtn.disabled = false;
      this.callBtn.textContent = '发起呼叫';
    }
  }

  /**
   * 显示本地视频流
   */
  handleLocalStream(stream) {
    this.localVideo.srcObject = stream;
    console.log('本地视频已绑定');
  }

  /**
   * 显示远程视频流
   */
  handleRemoteStream(userId, stream) {
    console.log('收到远程视频流:', userId);
    this.remoteVideo.srcObject = stream;
    this.remoteLabel.textContent = userId;
  }

  /**
   * 处理连接状态变化
   */
  handleConnectionStateChange(userId, state) {
    console.log('连接状态变化:', userId, state);

    // 更新连接质量指示器
    this.updateConnectionQuality(state);

    switch (state) {
      case 'connected':
        this.statusTitle.textContent = '已连接';
        this.statusDetail.textContent = '与 ' + userId + ' 通话中';
        break;
      case 'disconnected':
        this.statusTitle.textContent = '连接断开';
        this.statusDetail.textContent = '正在重新连接...';
        break;
      case 'failed':
        this.statusTitle.textContent = '连接失败';
        this.statusDetail.textContent = '请检查网络后重试';
        break;
      case 'closed':
        this.statusTitle.textContent = '通话结束';
        break;
    }
  }

  /**
   * 处理通话状态变化
   */
  handleCallStateChange(state) {
    console.log('通话状态:', state);

    switch (state) {
      case 'calling':
        this.statusTitle.textContent = '正在呼叫...';
        this.statusDetail.textContent = '等待对方接听';
        break;
      case 'called':
        this.statusTitle.textContent = '收到呼叫';
        this.statusDetail.textContent = '正在连接...';
        break;
      case 'connected':
        this.statusTitle.textContent = '已连接';
        this.statusDetail.textContent = '通话中';
        break;
      case 'ended':
        this.statusTitle.textContent = '通话结束';
        this.statusDetail.textContent = '感谢使用';
        break;
    }
  }

  /**
   * 显示通话界面
   */
  showCallInterface() {
    this.waitingOverlay.classList.add('hidden');
    this.callInterface.classList.remove('hidden');
  }

  /**
   * 显示等待界面
   */
  showWaitingInterface() {
    this.waitingOverlay.classList.remove('hidden');
    this.callInterface.classList.add('hidden');
  }

  /**
   * 切换静音
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.webrtcClient?.setAudioMute(this.isMuted);

    this.muteIcon.textContent = this.isMuted ? '🔇' : '🔊';
    this.muteBtn.classList.toggle('active', this.isMuted);
  }

  /**
   * 切换视频
   */
  toggleVideo() {
    this.isVideoOff = !this.isVideoOff;
    this.webrtcClient?.setVideoDisable(this.isVideoOff);

    this.videoIcon.textContent = this.isVideoOff ? '📷' : '📹';
    this.videoBtn.classList.toggle('active', this.isVideoOff);
  }

  /**
   * 切换屏幕共享
   */
  async toggleScreenShare() {
    if (this.isScreenSharing) {
      await this.webrtcClient?.stopScreenShare();
      this.isScreenSharing = false;
      this.screenBtn.classList.remove('active');
    } else {
      const stream = await this.webrtcClient?.startScreenShare();
      if (stream) {
        this.isScreenSharing = true;
        this.screenBtn.classList.add('active');
      }
    }
  }

  /**
   * 结束通话
   */
  endCall() {
    if (this.webrtcClient) {
      this.webrtcClient.hangUp();
      this.webrtcClient.close();
      this.webrtcClient = null;
    }

    // 清理视频流
    this.localVideo.srcObject = null;
    this.remoteVideo.srcObject = null;

    // 重置状态
    this.isMuted = false;
    this.isVideoOff = false;
    this.isScreenSharing = false;
    this.muteIcon.textContent = '🔇';
    this.videoIcon.textContent = '📹';
    this.muteBtn.classList.remove('active');
    this.videoBtn.classList.remove('active');
    this.screenBtn.classList.remove('active');

    // 重置按钮状态
    this.callBtn.disabled = false;
    this.callBtn.textContent = '发起呼叫';

    // 显示等待界面
    setTimeout(() => {
      this.showWaitingInterface();
    }, 1000);
  }

  /**
   * 更新连接质量指示器
   */
  updateConnectionQuality(state) {
    const bars = this.connectionQuality.querySelectorAll('.quality-bar');
    let qualityLevel = 0;

    switch (state) {
      case 'connected':
        qualityLevel = 4;
        break;
      case 'connecting':
        qualityLevel = 2;
        break;
      case 'disconnected':
      case 'failed':
        qualityLevel = 0;
        break;
    }

    bars.forEach((bar, index) => {
      bar.classList.remove('active', 'warning', 'danger');
      if (index < qualityLevel) {
        if (qualityLevel >= 3) {
          bar.classList.add('active');
        } else if (qualityLevel >= 2) {
          bar.classList.add('warning');
        } else {
          bar.classList.add('danger');
        }
      }
    });
  }

  /**
   * 显示错误
   */
  showError(message) {
    console.error('错误:', message);
    alert(message);
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new VideoCallApp();
});
```

---

## 7. 高级话题：SFU与MCU架构

### 7.1 架构概述

在多人视频会议场景中，有两种主要的媒体路由架构：SFU（Selective Forwarding Unit）和MCU（Multipoint Control Unit）。

```
SFU与MCU架构对比

SFU（选择性转发单元）
+----------------+     +----------------+     +----------------+
|    参与者A     |     |    参与者B     |     |    参与者C     |
|  (发布自己的)  |     |  (发布自己的)  |     |  (发布自己的)  |
+--------+-------+     +--------+-------+     +--------+-------+
         |                     |                     |
         | 发送自己的媒体       | 发送自己的媒体       | 发送自己的媒体
         v                     v                     v
    +------------------------------------------------------------+
    |                         SFU服务器                            |
    |  +-------------------------------------------------------+  |
    |  |                                                       |  |
    |  |   转发策略：                                          |  |
    |  |   - 转发A的给B和C                                      |  |
    |  |   - 转发B的给A和C                                      |  |
    |  |   - 转发C的给A和B                                      |  |
    |  |                                                       |  |
    |  |   特点：                                               |  |
    |  |   - 服务器只转发，不编解码                             |  |
    |  |   - 延迟低                                             |  |
    |  |   - 带宽占用随参与者数量线性增长                       |  |
    |  |                                                       |  |
    +-------------------------------------------------------+  |
    +------------------------------------------------------------+

MCU（多点控制单元）
+----------------+     +----------------+     +----------------+
|    参与者A     |     |    参与者B     |     |    参与者C     |
+--------+-------+     +--------+-------+     +--------+-------+
         |                     |                     |
         | 发送自己的媒体       | 发送自己的媒体       | 发送自己的媒体
         v                     v                     v
    +------------------------------------------------------------+
    |                         MCU服务器                            |
    |  +-------------------------------------------------------+  |
    |  |                                                       |  |
    |  |   处理策略：                                          |  |
    |  |   - 接收所有参与者的媒体                              |  |
    |  |   - 解码所有媒体                                      |  |
    |  |   - 混合/合成为单一流                                 |  |
    |  |   - 重新编码发送                                      |  |
    |  |                                                       |  |
    |  |   特点：                                              |  |
    |  |   - 服务器需要强大算力                                |  |
    |  |   - 延迟较高                                          |  |
    |  |   - 带宽占用恒定（客户端只接收一路）                  |  |
    |  |   - 支持转码、截图、录制等复杂功能                    |  |
    |  |                                                       |  |
    +-------------------------------------------------------+  |
    +------------------------------------------------------------+
         |                     |                     |
         | 接收混合后的流       | 接收混合后的流       | 接收混合后的流
         v                     v                     v
    (所有人看到相同的混合画面)
```

### 7.2 SFU vs MCU对比分析

| 特性 | SFU | MCU |
|------|-----|-----|
| **工作原理** | 接收并转发媒体流 | 接收、解码、混合、重新编码 |
| **服务器算力** | 低 | 高 |
| **延迟** | 低（毫秒级） | 较高（秒级，因为需要混合） |
| **客户端带宽** | O(n)，每增加一个参与者，带宽增加一份 | O(1)，只接收一路流 |
| **视频质量** | 多个独立的高质量流 | 单一混合流，质量受限 |
| **功能支持** | 受限（不支持转码） | 丰富（转码、截图、录制、字幕） |
| **扩展性** | 好（可水平扩展） | 差（需要强大硬件） |
| **适用场景** | 少人视频会议、直播 | 大型会议、广播场景 |
| **成本** | 带宽成本高 | 算力成本高 |

### 7.3 mediasoup服务器简介

mediasoup是一个流行的开源SFU实现，使用C++编写核心模块，通过Node.js绑定提供服务。它支持WebRTC媒体路由。

```javascript
// mediasoup服务器示例

// 安装：npm install mediasoup

const express = require('express');
const https = require('https');
const { Server } = require('socket.io');
const { createWorker } = require('mediasoup');

const app = express();
const httpServer = https.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
});

// 创建mediasoup worker
async function createMediasoupWorker() {
  const worker = await createWorker({
    logLevel: 'debug',
    rtcMinPort: 2000,
    rtcMaxPort: 2020
  });

  console.log('mediasoup worker创建成功, pid:', worker.pid);

  worker.on('died', () => {
    console.error('mediasoup worker异常退出');
    process.exit(1);
  });

  return worker;
}

// 路由配置
const config = {
  // WebRTC配置
  webRtcTransport: {
    listenIps: [
      { ip: '0.0.0.0', announcedIp: 'your-public-ip' }
    ],
    maxIncomingBitrate: 1500000,
    initialAvailableOutgoingBitrate: 1000000
  }
};

// 信令服务器
io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);

  let worker = null;
  let router = null;
  let transport = null;
  let producer = null;
  let consumers = new Map();

  // 创建WebRTC传输
  socket.on('create-transport', async () => {
    worker = await createMediasoupWorker();
    router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000
          }
        },
        {
          kind: 'video',
          mimeType: 'video/VP9',
          clockRate: 90000,
          parameters: {
            'profile-id': 2,
            'x-google-start-bitrate': 1000
          }
        }
      ]
    });

    transport = await router.createWebRtcTransport(config.webRtcTransport);

    console.log('WebRTC transport创建成功');

    socket.emit('transport-created', {
      id: transport.id,
      iceParameters: router.iceServers,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters
    });
  });

  // 连接传输
  socket.on('connect-transport', async ({ dtlsParameters }) => {
    await transport.connect({ dtlsParameters });
    socket.emit('transport-connected');
  });

  // 创建生产者（发布自己的媒体）
  socket.on('produce', async ({ kind, rtpParameters }, callback) => {
    producer = await transport.produce({
      kind,
      rtpParameters
    });

    console.log('生产者创建成功, kind:', kind);

    callback({ id: producer.id });

    // 监听生产者关闭
    producer.on('transportclose', () => {
      console.log('生产者transport关闭');
      producer.close();
    });
  });

  // 创建消费者（订阅他人的媒体）
  socket.on('consume', async ({ producerId, rtpCapabilities }, callback) => {
    if (!router.canConsume({ producerId, rtpCapabilities })) {
      return callback({ error: '无法消费此生产者' });
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false
    });

    consumers.set(consumer.id, consumer);

    console.log('消费者创建成功, id:', consumer.id);

    callback({
      id: consumer.id,
      producerId: producer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters
    });
  });

  // 加入房间
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit('room-joined', { roomId });

    // 广播给房间内其他人
    socket.to(roomId).emit('new-peer', { peerId: socket.id });
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('客户端断开:', socket.id);

    if (producer) {
      producer.close();
    }

    consumers.forEach(consumer => consumer.close());
    consumers.clear();

    if (transport) {
      transport.close();
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log('SFU信令服务器启动在端口', PORT);
});
```

### 7.4 带宽自适应策略

带宽自适应是保证通话质量的关键技术。WebRTC支持多种带宽估计和控制机制。

```javascript
// 带宽自适应控制器

class BandwidthAdaptation {
  constructor(peerConnection) {
    this.pc = peerConnection;
    this.sender = null;
    this.lastBandwidthEstimate = 0;
    this.targetBitrate = 1000000;  // 1Mbps默认
    this.minBitrate = 100000;       // 最小100kbps
    this.maxBitrate = 5000000;       // 最大5Mbps

    // 统计数据
    this.stats = {
      packetsLost: 0,
      packetsSent: 0,
      bytesSent: 0,
      roundTripTime: 0,
      jitter: 0
    };
  }

  /**
   * 设置视频发送器
   */
  setSender(sender) {
    this.sender = sender;
  }

  /**
   * 更新统计数据
   */
  async updateStats() {
    const stats = await this.pc.getStats();
    let bandwidth = 0;

    stats.forEach(report => {
      if (report.type === 'outbound-rtp' && report.kind === 'video') {
        this.stats.packetsSent = report.packetsSent || 0;
        this.stats.bytesSent = report.bytesSent || 0;

        // 计算带宽（字节/秒 -> 比特/秒）
        if (report.lastPacketTimestamp && report.timestamp) {
          const timeDiff = (report.timestamp - report.lastPacketTimestamp) / 1000;
          if (timeDiff > 0) {
            bandwidth = ((report.bytesSent - (report.lastBytesSent || 0)) * 8) / timeDiff;
          }
        }
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        this.stats.roundTripTime = report.currentRoundTripTime * 1000;  // 毫秒
      }

      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        this.stats.packetsLost = report.packetsLost || 0;
        this.stats.jitter = report.jitter || 0;
      }
    });

    return this.stats;
  }

  /**
   * 根据丢包率调整带宽
   */
  adjustBitrateForPacketLoss() {
    if (this.stats.packetsSent === 0) return this.targetBitrate;

    const lossRate = this.stats.packetsLost / this.stats.packetsSent;

    if (lossRate > 0.1) {
      // 丢包率超过10%，降低带宽
      this.targetBitrate = Math.max(
        this.minBitrate,
        this.targetBitrate * 0.7
      );
      console.log('高丢包率，降低带宽到', this.targetBitrate / 1000, 'kbps');
    } else if (lossRate < 0.02) {
      // 丢包率低于2%，可以尝试增加带宽
      this.targetBitrate = Math.min(
        this.maxBitrate,
        this.targetBitrate * 1.1
      );
      console.log('低丢包率，增加带宽到', this.targetBitrate / 1000, 'kbps');
    }

    this.applyBitrate();

    return this.targetBitrate;
  }

  /**
   * 根据RTT调整带宽
   */
  adjustBitrateForRTT() {
    if (this.stats.roundTripTime > 300) {
      // RTT超过300ms，降低带宽以减少延迟
      this.targetBitrate = Math.max(
        this.minBitrate,
        this.targetBitrate * 0.8
      );
      console.log('高延迟，降低带宽到', this.targetBitrate / 1000, 'kbps');
    }

    this.applyBitrate();

    return this.targetBitrate;
  }

  /**
   * 应用带宽设置
   */
  applyBitrate() {
    if (this.sender) {
      const parameters = this.sender.getParameters();

      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }

      parameters.encodings[0].maxBitrate = this.targetBitrate;

      this.sender.setParameters(parameters)
        .then(() => {
          console.log('带宽设置成功:', this.targetBitrate / 1000, 'kbps');
        })
        .catch(error => {
          console.error('带宽设置失败:', error);
        });
    }
  }

  /**
   * 设置目标码率
   */
  setTargetBitrate(bitrate) {
    this.targetBitrate = Math.max(
      this.minBitrate,
      Math.min(this.maxBitrate, bitrate)
    );
    this.applyBitrate();
  }

  /**
   * 获取当前码率
   */
  getCurrentBitrate() {
    return this.targetBitrate;
  }

  /**
   * 获取网络质量评估
   */
  getNetworkQuality() {
    // 基于丢包率、RTT和抖动计算网络质量（0-5）
    let quality = 5;

    const lossRate = this.stats.packetsLost / Math.max(1, this.stats.packetsSent);
    if (lossRate > 0.1) quality = 1;
    else if (lossRate > 0.05) quality = 2;
    else if (lossRate > 0.02) quality = 3;
    else if (lossRate > 0.01) quality = 4;

    if (this.stats.roundTripTime > 500) quality = Math.min(quality, 2);
    else if (this.stats.roundTripTime > 300) quality = Math.min(quality, 3);
    else if (this.stats.roundTripTime > 150) quality = Math.min(quality, 4);

    if (this.stats.jitter > 0.05) quality = Math.min(quality, 2);
    else if (this.stats.jitter > 0.02) quality = Math.min(quality, 3);

    return quality;
  }
}
```

---

## 8. 性能与优化

### 8.1 码率控制

码率控制是视频通话质量的关键因素。WebRTC支持多种码率控制策略。

```javascript
// 码率控制器

class BitrateController {
  constructor(peerConnection) {
    this.pc = peerConnection;
    this.senders = new Map();
    this.targetBitrate = 1000000;  // 默认1Mbps
    this.isAdjusting = false;
  }

  /**
   * 添加发送者
   */
  addSender(trackKind, sender) {
    this.senders.set(trackKind, sender);
    this.configureSender(sender, trackKind);
  }

  /**
   * 配置发送者参数
   */
  configureSender(sender, kind) {
    const parameters = sender.getParameters();

    // 初始化编码参数
    if (!parameters.encodings) {
      parameters.encodings = [{}];
    }

    if (kind === 'video') {
      // 视频编码配置
      parameters.encodings[0] = {
        ...parameters.encodings[0],
        maxBitrate: this.targetBitrate,
        minBitrate: 100000,  // 最小100kbps
        scalabilityMode: 'L1T2',  // 可扩展模式
        networkPriority: 'high'
      };
    } else if (kind === 'audio') {
      // 音频编码配置（通常不需要高码率）
      parameters.encodings[0] = {
        ...parameters.encodings[0],
        maxBitrate: 64000,  // 64kbps
        priority: 'high'
      };
    }

    sender.setParameters(parameters);
  }

  /**
   * 设置视频码率
   */
  setVideoBitrate(bitrate) {
    this.targetBitrate = bitrate;

    const videoSender = this.senders.get('video');
    if (videoSender) {
      const parameters = videoSender.getParameters();
      if (parameters.encodings && parameters.encodings[0]) {
        parameters.encodings[0].maxBitrate = bitrate;
        videoSender.setParameters(parameters);
      }
    }
  }

  /**
   * 基于网络状况自适应码率
   */
  async adaptBitrate() {
    if (this.isAdjusting) return;
    this.isAdjusting = true;

    try {
      const stats = await this.pc.getStats();
      let packetsLost = 0;
      let packetsSent = 0;
      let roundTripTime = 0;
      let jitter = 0;

      stats.forEach(report => {
        if (report.type === 'outbound-rtp' && report.kind === 'video') {
          packetsSent = report.packetsSent || 0;
        }
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          roundTripTime = report.currentRoundTripTime * 1000;
        }
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          packetsLost = report.packetsLost || 0;
          jitter = report.jitter || 0;
        }
      });

      // 计算丢包率
      const lossRate = packetsSent > 0 ? packetsLost / packetsSent : 0;

      // 自适应算法
      if (lossRate > 0.1) {
        // 高丢包率 - 降低码率
        this.targetBitrate = Math.max(200000, this.targetBitrate * 0.7);
        console.log('高丢包率，降低码率到', this.targetBitrate / 1000, 'kbps');
      } else if (lossRate < 0.01 && roundTripTime < 100) {
        // 低丢包率和低延迟 - 可以提高码率
        this.targetBitrate = Math.min(4000000, this.targetBitrate * 1.2);
        console.log('网络良好，提高码率到', this.targetBitrate / 1000, 'kbps');
      }

      this.setVideoBitrate(this.targetBitrate);

    } finally {
      this.isAdjusting = false;
    }
  }
}

// 码率预设
const BITRATE_PRESETS = {
  'low': {
    video: 300000,   // 300kbps
    audio: 32000,    // 32kbps
    description: '低带宽'
  },
  'medium': {
    video: 1000000,  // 1Mbps
    audio: 64000,    // 64kbps
    description: '中等带宽'
  },
  'high': {
    video: 2500000,  // 2.5Mbps
    audio: 128000,   // 128kbps
    description: '高带宽'
  },
  'ultra': {
    video: 5000000,  // 5Mbps
    audio: 128000,   // 128kbps
    description: '超高清'
  }
};
```

### 8.2 分辨率自适应

根据网络状况动态调整视频分辨率。

```javascript
// 分辨率自适应控制器

class ResolutionAdapter {
  constructor(peerConnection) {
    this.pc = peerConnection;
    this.currentStream = null;
    this.senders = new Map();
    this.currentPreset = 'medium';
  }

  // 分辨率预设
  static PRESETS = {
    'qvga': { width: 320, height: 240, label: 'QVGA (320x240)' },
    'vga': { width: 640, height: 480, label: 'VGA (640x480)' },
    'svga': { width: 800, height: 600, label: 'SVGA (800x600)' },
    'hd': { width: 1280, height: 720, label: 'HD (1280x720)' },
    'fhd': { width: 1920, height: 1080, label: 'FHD (1920x1080)' }
  };

  /**
   * 根据带宽选择分辨率
   */
  selectResolution(bandwidthKbps) {
    if (bandwidthKbps < 300) return 'qvga';
    if (bandwidthKbps < 800) return 'vga';
    if (bandwidthKbps < 1500) return 'svga';
    if (bandwidthKbps < 2500) return 'hd';
    return 'fhd';
  }

  /**
   * 更新分辨率
   */
  async updateResolution(preset) {
    const resolution = ResolutionAdapter.PRESETS[preset];
    if (!resolution) {
      console.error('未知的分辨率预设:', preset);
      return;
    }

    console.log('更新分辨率到:', resolution.label);

    // 创建新的视频轨道
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: resolution.width },
        height: { ideal: resolution.height },
        frameRate: { ideal: 30, max: 30 }
      }
    });

    const newVideoTrack = newStream.getVideoTracks()[0];

    // 替换所有发送者的轨道
    for (const [kind, sender] of this.senders) {
      if (kind === 'video') {
        await sender.replaceTrack(newVideoTrack);
      }
    }

    // 关闭旧轨道
    if (this.currentStream) {
      this.currentStream.getVideoTracks().forEach(track => track.stop());
    }

    this.currentStream = newStream;
    this.currentPreset = preset;

    return newStream;
  }

  /**
   * 获取推荐分辨率
   */
  getRecommendedResolution() {
    return this.selectResolution(
      Math.floor(this.estimateBandwidth() / 1000)
    );
  }

  /**
   * 估算带宽（从PeerConnection统计）
   */
  async estimateBandwidth() {
    const stats = await this.pc.getStats();
    let availableBandwidth = 1000000;  // 默认1Mbps

    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        if (report.availableOutgoingBitrate) {
          availableBandwidth = report.availableOutgoingBitrate;
        }
      }
    });

    return availableBandwidth;
  }
}
```

### 8.3 回声消除与降噪

音频处理对于通话质量至关重要。

```javascript
// 音频处理控制器

class AudioProcessor {
  constructor(localStream) {
    this.stream = localStream;
    this.audioTrack = localStream.getAudioTracks()[0];
    this.audioContext = null;
    this.analyser = null;
    this.gainNode = null;
  }

  /**
   * 获取音频设置
   */
  getAudioSettings() {
    if (!this.audioTrack) return null;

    return {
      label: this.audioTrack.label,
      enabled: this.audioTrack.enabled,
      muted: this.audioTrack.muted,
      settings: this.audioTrack.getSettings(),
      constraints: this.audioTrack.getConstraints()
    };
  }

  /**
   * 应用音频约束
   */
  async applyAudioConstraints(constraints) {
    await this.audioTrack.applyConstraints(constraints);
    console.log('音频约束已应用:', constraints);
  }

  /**
   * 获取音量级别（0-1）
   */
  getVolumeLevel() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
    }

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // 计算平均音量
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;

    return average / 255;
  }

  /**
   * 启用降噪（通过约束）
   */
  enableNoiseSuppression(enabled = true) {
    this.audioTrack.applyConstraints({
      noiseSuppression: enabled
    });
    console.log('降噪:', enabled ? '已启用' : '已禁用');
  }

  /**
   * 启用回声消除（通过约束）
   */
  enableEchoCancellation(enabled = true) {
    this.audioTrack.applyConstraints({
      echoCancellation: enabled
    });
    console.log('回声消除:', enabled ? '已启用' : '已禁用');
  }

  /**
   * 启用自动增益控制
   */
  enableAutoGainControl(enabled = true) {
    this.audioTrack.applyConstraints({
      autoGainControl: enabled
    });
    console.log('自动增益控制:', enabled ? '已启用' : '已禁用');
  }

  /**
   * 关闭所有音频处理
   */
  disableAllProcessing() {
    this.audioTrack.applyConstraints({
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
    });
  }
}

// 音频质量检测
class AudioQualityDetector {
  constructor(peerConnection) {
    this.pc = peerConnection;
  }

  /**
   * 检测音频质量
   */
  async detectQuality() {
    const stats = await this.pc.getStats();
    const quality = {
      echoReturnLoss: 0,
      echoReturnLossEnhancement: 0,
      noiseLevel: 0,
      clippingRate: 0,
      roundTripTime: 0,
      jitter: 0
    };

    stats.forEach(report => {
      if (report.type === 'media-track') {
        // 音频质量指标
        quality.echoReturnLoss = report.echoReturnLoss || 0;
        quality.echoReturnLossEnhancement = report.echoReturnLossEnhancement || 0;
        quality.noiseLevel = report.noiseLevel || 0;
        quality.clippingRate = report.clippingRate || 0;
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        quality.roundTripTime = (report.currentRoundTripTime || 0) * 1000;
      }

      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        quality.jitter = report.jitter || 0;
      }
    });

    return quality;
  }

  /**
   * 获取音频质量评分（0-100）
   */
  async getQualityScore() {
    const q = await this.detectQuality();
    let score = 100;

    // 基于回声损失评分
    if (q.echoReturnLoss < 10) score -= 30;
    else if (q.echoReturnLoss < 20) score -= 15;

    // 基于噪声等级评分
    if (q.noiseLevel > -50) score -= 20;
    else if (q.noiseLevel > -60) score -= 10;

    // 基于抖动评分
    if (q.jitter > 0.03) score -= 20;
    else if (q.jitter > 0.01) score -= 10;

    // 基于RTT评分
    if (q.roundTripTime > 200) score -= 20;
    else if (q.roundTripTime > 100) score -= 10;

    return Math.max(0, Math.min(100, score));
  }
}
```

### 8.4 网络切换处理

移动设备经常面临网络切换的场景，需要平滑处理。

```javascript
// 网络切换处理器

class NetworkTransitionHandler {
  constructor(peerConnection, localStream) {
    this.pc = peerConnection;
    this.localStream = localStream;
    this.isHandling = false;
    this.onNetworkChange = () => {};
  }

  /**
   * 监听网络变化
   */
  startMonitoring() {
    // 监听连接状态变化
    this.pc.addEventListener('iceconnectionstatechange', () => {
      console.log('ICE连接状态:', this.pc.iceConnectionState);

      if (this.pc.iceConnectionState === 'disconnected') {
        console.log('网络连接断开，尝试恢复...');
        this.handleNetworkLoss();
      } else if (this.pc.iceConnectionState === 'failed') {
        console.log('ICE连接失败，需要重新建立...');
        this.handleConnectionFailure();
      }
    });

    // 监听ICE候选项变化
    this.pc.addEventListener('icecandidate', (event) => {
      if (!event.candidate) {
        console.log('ICE候选收集完成');
      }
    });

    // 监听数据传输
    this.pc.addEventListener('connectionstatechange', () => {
      console.log('连接状态:', this.pc.connectionState);
    });
  }

  /**
   * 处理网络断开
   */
  async handleNetworkLoss() {
    if (this.isHandling) return;
    this.isHandling = true;

    try {
      // 尝试重新连接
      console.log('尝试重新建立连接...');

      // 等待网络恢复
      await this.waitForNetwork();

      // 重新创建ICE候选
      this.pc.createOffer()
        .then(offer => this.pc.setLocalDescription(offer))
        .then(() => {
          console.log('重新Offer已创建');
          // 发送新的offer给对端
          this.sendOfferToPeer(offer);
        });

    } catch (error) {
      console.error('网络恢复失败:', error);
      this.onNetworkChange('failed');
    } finally {
      this.isHandling = false;
    }
  }

  /**
   * 处理连接失败
   */
  async handleConnectionFailure() {
    if (this.isHandling) return;
    this.isHandling = true;

    console.log('需要完全重新建立连接...');

    try {
      // 关闭旧的ICE连接
      await this.pc.close();

      // 创建新的PeerConnection
      const newPc = new RTCPeerConnection({
        iceServers: this.pc.getConfiguration().iceServers
      });

      // 重新添加本地轨道
      this.localStream.getTracks().forEach(track => {
        newPc.addTrack(track, this.localStream);
      });

      // 监听新连接的事件
      newPc.ontrack = this.pc.ontrack;
      newPc.onicecandidate = this.pc.onicecandidate;

      // 替换旧的PeerConnection
      this.pc = newPc;

      // 重新开始连接
      const offer = await newPc.createOffer();
      await newPc.setLocalDescription(offer);

      this.sendOfferToPeer(offer);

      console.log('新连接已建立');

    } catch (error) {
      console.error('重新连接失败:', error);
      this.onNetworkChange('failed');
    } finally {
      this.isHandling = false;
    }
  }

  /**
   * 等待网络恢复
   */
  waitForNetwork() {
    return new Promise((resolve) => {
      const checkNetwork = () => {
        if (navigator.onLine) {
          // 等待一小段时间确保网络稳定
          setTimeout(resolve, 1000);
        } else {
          setTimeout(checkNetwork, 1000);
        }
      };
      checkNetwork();
    });
  }

  /**
   * 发送Offer给对端（需要通过信令服务器）
   */
  sendOfferToPeer(offer) {
    // 这个方法需要通过Socket.io等信令服务器发送
    if (this.onSendOffer) {
      this.onSendOffer(offer);
    }
  }

  /**
   * 设置信令发送回调
   */
  setOnSendOffer(callback) {
    this.onSendOffer = callback;
  }

  /**
   * 重新绑定PeerConnection
   */
  rebindPeerConnection(newPc) {
    this.pc = newPc;
    this.startMonitoring();
  }
}

// 网络质量监控
class NetworkQualityMonitor {
  constructor(peerConnection) {
    this.pc = peerConnection;
    this.qualityHistory = [];
    this.maxHistoryLength = 20;
    this.onQualityChange = () => {};
  }

  /**
   * 开始监控
   */
  startMonitoring(intervalMs = 2000) {
    this.interval = setInterval(() => {
      this.checkQuality();
    }, intervalMs);
  }

  /**
   * 停止监控
   */
  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  /**
   * 检查网络质量
   */
  async checkQuality() {
    const stats = await this.pc.getStats();
    let rtt = 0;
    let packetsLost = 0;
    let packetsReceived = 0;
    let jitter = 0;

    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = (report.currentRoundTripTime || 0) * 1000;
      }
      if (report.type === 'inbound-rtp') {
        packetsLost = report.packetsLost || 0;
        packetsReceived = report.packetsReceived || 0;
        jitter = report.jitter || 0;
      }
    });

    const quality = this.calculateQuality(rtt, packetsLost, packetsReceived, jitter);

    this.qualityHistory.push(quality);
    if (this.qualityHistory.length > this.maxHistoryLength) {
      this.qualityHistory.shift();
    }

    return quality;
  }

  /**
   * 计算网络质量（0-5）
   */
  calculateQuality(rtt, packetsLost, packetsReceived, jitter) {
    let quality = 5;

    // 基于RTT评分
    if (rtt > 300) quality = Math.min(quality, 1);
    else if (rtt > 200) quality = Math.min(quality, 2);
    else if (rtt > 100) quality = Math.min(quality, 3);
    else if (rtt > 50) quality = Math.min(quality, 4);

    // 基于丢包率评分
    const lossRate = packetsReceived > 0 ? packetsLost / packetsReceived : 0;
    if (lossRate > 0.1) quality = Math.min(quality, 1);
    else if (lossRate > 0.05) quality = Math.min(quality, 2);
    else if (lossRate > 0.02) quality = Math.min(quality, 3);

    // 基于抖动评分
    if (jitter > 0.03) quality = Math.min(quality, 2);
    else if (jitter > 0.01) quality = Math.min(quality, 3);

    return quality;
  }

  /**
   * 获取平均质量
   */
  getAverageQuality() {
    if (this.qualityHistory.length === 0) return 5;

    const sum = this.qualityHistory.reduce((a, b) => a + b, 0);
    return sum / this.qualityHistory.length;
  }

  /**
   * 获取质量趋势
   */
  getQualityTrend() {
    if (this.qualityHistory.length < 5) return 'unknown';

    const recent = this.qualityHistory.slice(-5);
    const older = this.qualityHistory.slice(-10, -5);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0
      ? older.reduce((a, b) => a + b, 0) / older.length
      : recentAvg;

    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'degrading';
    return 'stable';
  }
}
```

---

## 总结

本文档详细介绍了WebRTC实时通信技术的各个方面：

1. **WebRTC基础**：包括协议栈、三大部分、与Socket.io的区别，以及适用场景
2. **媒体获取**：getUserMedia API、约束条件、屏幕共享、设备枚举等
3. **RTCPeerConnection**：ICE/NAT穿透原理、SDP协议、信令服务器设计、完整通话流程
4. **数据通道**：DataChannel基础、与WebSocket对比、消息顺序控制、P2P文件传输
5. **媒体处理**：视频/音频控制、轨道替换、录制、截图与滤镜
6. **实战项目**：完整的一对一视频通话系统实现
7. **高级话题**：SFU与MCU架构对比、mediasoup服务器、带宽自适应
8. **性能优化**：码率控制、分辨率自适应、回声消除与降噪、网络切换处理

WebRTC是一项复杂的综合技术，涉及媒体处理、网络传输、加密通信等多个领域。掌握这些核心概念和实践经验，将帮助开发者构建高质量的实时通信应用。

---

**参考资源：**

- [WebRTC官方文档](https://webrtc.org/)
- [MDN WebRTC指南](https://developer.mozilla.org/zh-CN/docs/Web/API/WebRTC_API)
- [mediasoup官方文档](https://mediasoup.org/)
- [IETF WebRTC标准](https://datatracker.ietf.org/wg/rtcweb/)

---

*本文档最后更新于2026年4月*
