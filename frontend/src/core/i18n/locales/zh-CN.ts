import {
  CompassIcon,
  GraduationCapIcon,
  ImageIcon,
  MicroscopeIcon,
  PenLineIcon,
  ShapesIcon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";

import type { Translations } from "./types";

export const zhCN: Translations = {
  // Locale meta
  locale: {
    localName: "中文",
  },

  // Common
  common: {
    home: "首页",
    settings: "设置",
    delete: "删除",
    rename: "重命名",
    share: "分享",
    openInNewWindow: "在新窗口打开",
    close: "关闭",
    more: "更多",
    search: "搜索",
    download: "下载",
    thinking: "思考",
    artifacts: "文件",
    public: "公共",
    custom: "自定义",
    notAvailableInDemoMode: "在演示模式下不可用",
    loading: "加载中...",
    version: "版本",
    lastUpdated: "最后更新",
    code: "代码",
    preview: "预览",
    cancel: "取消",
    save: "保存",
    install: "安装",
    create: "创建",
  },

  // Welcome
  welcome: {
    greeting: "你好，欢迎回来！",
    description:
      "欢迎使用 🦌 DeerFlow，一个完全开源的超级智能体。通过内置和自定义的 Skills，\nDeerFlow 可以帮你搜索网络、分析数据，还能为你生成幻灯片、\n图片、视频、播客及网页等，几乎可以做任何事情。",

    createYourOwnSkill: "创建你自己的 Agent Skill",
    createYourOwnSkillDescription:
      "创建你的 Agent Skill 来释放 DeerFlow 的潜力。通过自定义技能，DeerFlow\n可以帮你搜索网络、分析数据，还能为你生成幻灯片、\n网页等作品，几乎可以做任何事情。",
  },

  // Clipboard
  clipboard: {
    copyToClipboard: "复制到剪贴板",
    copiedToClipboard: "已复制到剪贴板",
    failedToCopyToClipboard: "复制到剪贴板失败",
    linkCopied: "链接已复制到剪贴板",
  },

  // Input Box
  inputBox: {
    placeholder: "今天我能为你做些什么？",
    createSkillPrompt:
      "我们一起用 skill-creator 技能来创建一个技能吧。先问问我希望这个技能能做什么。",
    addAttachments: "添加附件",
    mode: "模式",
    flashMode: "闪速",
    flashModeDescription: "快速且高效的完成任务，但可能不够精准",
    reasoningMode: "思考",
    reasoningModeDescription: "思考后再行动，在时间与准确性之间取得平衡",
    proMode: "Pro",
    proModeDescription: "思考、计划再执行，获得更精准的结果，可能需要更多时间",
    ultraMode: "Ultra",
    ultraModeDescription:
      "继承自 Pro 模式，可调用子代理分工协作，适合复杂多步骤任务，能力最强",
    searchModels: "搜索模型...",
    surpriseMe: "小惊喜",
    surpriseMePrompt: "给我一个小惊喜吧",
    suggestions: [
      {
        suggestion: "写作",
        prompt: "撰写一篇关于[主题]的博客文章",
        icon: PenLineIcon,
      },
      {
        suggestion: "研究",
        prompt: "深入浅出的研究一下[主题]，并总结发现。",
        icon: MicroscopeIcon,
      },
      {
        suggestion: "收集",
        prompt: "从[来源]收集数据并创建报告。",
        icon: ShapesIcon,
      },
      {
        suggestion: "学习",
        prompt: "学习关于[主题]并创建教程。",
        icon: GraduationCapIcon,
      },
    ],
    suggestionsCreate: [
      {
        suggestion: "网页",
        prompt: "生成一个关于[主题]的网页",
        icon: CompassIcon,
      },
      {
        suggestion: "图片",
        prompt: "生成一个关于[主题]的图片",
        icon: ImageIcon,
      },
      {
        suggestion: "视频",
        prompt: "生成一个关于[主题]的视频",
        icon: VideoIcon,
      },
      {
        type: "separator",
      },
      {
        suggestion: "技能",
        prompt:
          "我们一起用 skill-creator 技能来创建一个技能吧。先问问我希望这个技能能做什么。",
        icon: SparklesIcon,
      },
    ],
  },

  // Sidebar
  sidebar: {
    newChat: "新对话",
    chats: "对话",
    recentChats: "最近的对话",
    demoChats: "演示对话",
  },

  // Breadcrumb
  breadcrumb: {
    workspace: "工作区",
    chats: "对话",
  },

  // Workspace
  workspace: {
    officialWebsite: "访问 DeerFlow 官方网站",
    githubTooltip: "访问 DeerFlow 的 Github 仓库",
    settingsAndMore: "设置和更多",
    visitGithub: "在 Github 上查看 DeerFlow",
    reportIssue: "报告问题",
    contactUs: "联系我们",
    about: "关于 DeerFlow",
  },

  // Conversation
  conversation: {
    noMessages: "还没有消息",
    startConversation: "开始新的对话以查看消息",
  },

  // Chats
  chats: {
    searchChats: "搜索对话",
  },

  // Page titles (document title)
  pages: {
    appName: "DeerFlow",
    chats: "对话",
    newChat: "新对话",
    untitled: "未命名",
  },

  // Landing
  landing: {
    header: {
      starOnGithub: "在 GitHub 上 Star",
    },
    hero: {
      words: [
        "深度研究",
        "收集数据",
        "分析数据",
        "生成网页",
        "氛围编程",
        "生成幻灯片",
        "生成图片",
        "生成播客",
        "生成视频",
        "生成歌曲",
        "整理邮件",
        "无所不能",
        "学习一切",
      ],
      withDeerFlow: "使用 DeerFlow",
      descriptionLine1: "一个开源的超级智能体框架，能研究、编码与创作。",
      descriptionLine2:
        "借助沙箱、记忆、工具、技能与子代理，它可以处理",
      descriptionLine3: "从几分钟到数小时不等的不同复杂度任务。",
      getStarted: "开始体验 2.0",
    },
    footer: {
      quote: "\"源于开源，回馈开源。\"",
      license: "基于 MIT 协议授权",
    },
    sections: {
      caseStudies: {
        title: "案例展示",
        subtitle: "看看 DeerFlow 在真实场景中的应用",
        items: [
          {
            threadId: "7cfa5f8f-a2f8-47ad-acbd-da7137baf990",
            title: "预测 2026 年智能体趋势与机会",
            description:
              "生成一份深度研究网页报告，预测 2026 年智能体技术的发展趋势与机会。",
          },
          {
            threadId: "4f3e55ee-f853-43db-bfb3-7d1a411f03cb",
            title: "基于《傲慢与偏见》生成视频",
            description:
              "检索小说《傲慢与偏见》中的特定场景，并基于这些场景生成视频和参考图片。",
          },
          {
            threadId: "21cfea46-34bd-4aa6-9e1f-3009452fbeb9",
            title: "哆啦 A 梦讲解 MOE 架构",
            description:
              "生成哆啦 A 梦漫画，用青少年易懂的方式解释 MOE 架构。",
          },
          {
            threadId: "ad76c455-5bf9-4335-8517-fc03834ab828",
            title: "泰坦尼克号数据集探索分析",
            description:
              "探索泰坦尼克号数据集，并结合可视化与洞察识别影响生存率的关键因素。",
          },
          {
            threadId: "d3e5adaf-084c-4dd5-9d29-94f1d6bccd98",
            title: "观看 Y Combinator 视频并做深度研究",
            description:
              "观看给定的 Y Combinator YouTube 视频，并深入研究其面向技术创业者的建议。",
          },
          {
            threadId: "3823e443-4e2b-4679-b496-a9506eae462b",
            title: "收集并总结李飞飞博士播客",
            description:
              "收集李飞飞博士近 6 个月的播客出镜内容，并汇总为综合报告。",
          },
        ],
      },
      skills: {
        title: "智能体技能",
        subtitleLine1: "技能按需渐进加载 —— 在需要时才加载所需能力。",
        subtitleLine2: "你可添加自定义技能文件，也可使用内置技能库。",
      },
      sandbox: {
        title: "智能体运行环境",
        subtitle:
          "我们为 DeerFlow 提供了一台“电脑”，可执行命令、管理文件并运行长任务——全程在安全的 Docker 沙箱中进行。",
        openSource: "开源",
        name: "AIO 沙箱",
        description:
          "推荐使用 All-in-One Sandbox，它在一个 Docker 容器中整合 Browser、Shell、File、MCP 与 VSCode Server。",
        tags: ["隔离", "安全", "持久化", "可挂载文件系统", "长时运行"],
      },
      whatsNew: {
        title: "DeerFlow 2.0 有哪些新特性",
        subtitle: "DeerFlow 正从深度研究智能体进化为全栈超级智能体",
        features: [
          {
            label: "上下文工程",
            title: "长/短期记忆",
            description: "智能体现在能更好地理解你",
          },
          {
            label: "长任务运行",
            title: "规划与子任务拆分",
            description: "先规划、再推理，可串行或并行执行复杂任务",
          },
          {
            label: "可扩展",
            title: "技能与工具",
            description: "即插即用，甚至可替换内置工具，打造你想要的智能体",
          },
          {
            label: "持久化",
            title: "带文件系统的沙箱",
            description: "可读、可写、可执行，如同真实电脑",
          },
          {
            label: "灵活",
            title: "多模型支持",
            description: "支持豆包、DeepSeek、OpenAI、Gemini 等",
          },
          {
            label: "免费",
            title: "开源",
            description: "MIT 协议、自托管、完全可控",
          },
        ],
      },
      community: {
        title: "加入社区",
        subtitle: "贡献你的创意，一起塑造 DeerFlow 的未来。协作、创新、共同成长。",
        button: "立即贡献",
      },
    },
  },

  // Tool calls
  toolCalls: {
    moreSteps: (count: number) => `查看其他 ${count} 个步骤`,
    lessSteps: "隐藏步骤",
    executeCommand: "执行命令",
    presentFiles: "展示文件",
    needYourHelp: "需要你的协助",
    useTool: (toolName: string) => `使用 “${toolName}” 工具`,
    searchFor: (query: string) => `搜索 “${query}”`,
    searchForRelatedInfo: "搜索相关信息",
    searchForRelatedImages: "搜索相关图片",
    searchForRelatedImagesFor: (query: string) => `搜索相关图片 “${query}”`,
    searchOnWebFor: (query: string) => `在网络上搜索 “${query}”`,
    viewWebPage: "查看网页",
    listFolder: "列出文件夹",
    readFile: "读取文件",
    writeFile: "写入文件",
    clickToViewContent: "点击查看文件内容",
    writeTodos: "更新 To-do 列表",
    skillInstallTooltip: "安装技能并使其可在 DeerFlow 中使用",
  },

  subtasks: {
    subtask: "子任务",
    executing: (count: number) =>
      `${count > 1 ? "并行" : ""}执行 ${count} 个子任务`,
    in_progress: "子任务运行中",
    completed: "子任务已完成",
    failed: "子任务失败",
  },

  // Settings
  settings: {
    title: "设置",
    description: "根据你的偏好调整 DeerFlow 的界面和行为。",
    sections: {
      appearance: "外观",
      memory: "记忆",
      tools: "工具",
      skills: "技能",
      notification: "通知",
      about: "关于",
    },
    memory: {
      title: "记忆",
      description:
        "DeerFlow 会在后台不断从你的对话中自动学习。这些记忆能帮助 DeerFlow 更好地理解你，并提供更个性化的体验。",
      empty: "暂无可展示的记忆数据。",
      rawJson: "原始 JSON",
      markdown: {
        overview: "概览",
        userContext: "用户上下文",
        work: "工作",
        personal: "个人",
        topOfMind: "近期关注（Top of mind）",
        historyBackground: "历史背景",
        recentMonths: "近几个月",
        earlierContext: "更早上下文",
        longTermBackground: "长期背景",
        updatedAt: "更新于",
        facts: "事实",
        empty: "（空）",
        table: {
          category: "类别",
          confidence: "置信度",
          confidenceLevel: {
            veryHigh: "极高",
            high: "较高",
            normal: "一般",
            unknown: "未知",
          },
          content: "内容",
          source: "来源",
          createdAt: "创建时间",
          view: "查看",
        },
      },
    },
    appearance: {
      themeTitle: "主题",
      themeDescription: "跟随系统或选择固定的界面模式。",
      system: "系统",
      light: "浅色",
      dark: "深色",
      systemDescription: "自动跟随系统主题。",
      lightDescription: "更明亮的配色，适合日间使用。",
      darkDescription: "更暗的配色，减少眩光方便专注。",
      languageTitle: "语言",
      languageDescription: "在不同语言之间切换。",
    },
    tools: {
      title: "工具",
      description: "管理 MCP 工具的配置和启用状态。",
    },
    skills: {
      title: "技能",
      description: "管理 Agent Skill 配置和启用状态。",
      createSkill: "新建技能",
      emptyTitle: "还没有技能",
      emptyDescription:
        "将你的 Agent Skill 文件夹放在 DeerFlow 根目录下的 `/skills/custom` 文件夹中。",
      emptyButton: "创建你的第一个技能",
    },
    notification: {
      title: "通知",
      description:
        "DeerFlow 只会在窗口不活跃时发送完成通知，特别适合长时间任务：你可以先去做别的事，完成后会收到提醒。",
      requestPermission: "请求通知权限",
      deniedHint:
        "通知权限已被拒绝。可在浏览器的网站设置中重新开启，以接收完成提醒。",
      testButton: "发送测试通知",
      testTitle: "DeerFlow",
      testBody: "这是一条测试通知。",
      notSupported: "当前浏览器不支持通知功能。",
      disableNotification: "关闭通知",
    },
    acknowledge: {
      emptyTitle: "致谢",
      emptyDescription: "相关的致谢信息会展示在这里。",
    },
  },
};
