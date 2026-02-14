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

export const enUS: Translations = {
  // Locale meta
  locale: {
    localName: "English",
  },

  // Common
  common: {
    home: "Home",
    settings: "Settings",
    delete: "Delete",
    rename: "Rename",
    share: "Share",
    openInNewWindow: "Open in new window",
    close: "Close",
    more: "More",
    search: "Search",
    download: "Download",
    thinking: "Thinking",
    artifacts: "Artifacts",
    public: "Public",
    custom: "Custom",
    notAvailableInDemoMode: "Not available in demo mode",
    loading: "Loading...",
    version: "Version",
    lastUpdated: "Last updated",
    code: "Code",
    preview: "Preview",
    cancel: "Cancel",
    save: "Save",
    install: "Install",
    create: "Create",
  },

  // Welcome
  welcome: {
    greeting: "Hello, again!",
    description:
      "Welcome to 🦌 DeerFlow, an open source super agent. With built-in and custom skills, DeerFlow helps you search on the web, analyze data, and generate artifacts like slides, web pages and do almost anything.",

    createYourOwnSkill: "Create Your Own Skill",
    createYourOwnSkillDescription:
      "Create your own skill to release the power of DeerFlow. With customized skills,\nDeerFlow can help you search on the web, analyze data, and generate\n artifacts like slides, web pages and do almost anything.",
  },

  // Clipboard
  clipboard: {
    copyToClipboard: "Copy to clipboard",
    copiedToClipboard: "Copied to clipboard",
    failedToCopyToClipboard: "Failed to copy to clipboard",
    linkCopied: "Link copied to clipboard",
  },

  // Input Box
  inputBox: {
    placeholder: "How can I assist you today?",
    createSkillPrompt:
      "We're going to build a new skill step by step with `skill-creator`. To start, what do you want this skill to do?",
    addAttachments: "Add attachments",
    mode: "Mode",
    flashMode: "Flash",
    flashModeDescription: "Fast and efficient, but may not be accurate",
    reasoningMode: "Reasoning",
    reasoningModeDescription:
      "Reasoning before action, balance between time and accuracy",
    proMode: "Pro",
    proModeDescription:
      "Reasoning, planning and executing, get more accurate results, may take more time",
    ultraMode: "Ultra",
    ultraModeDescription:
      "Pro mode with subagents to divide work; best for complex multi-step tasks",
    searchModels: "Search models...",
    surpriseMe: "Surprise",
    surpriseMePrompt: "Surprise me",
    suggestions: [
      {
        suggestion: "Write",
        prompt: "Write a blog post about the latest trends on [topic]",
        icon: PenLineIcon,
      },
      {
        suggestion: "Research",
        prompt:
          "Conduct a deep dive research on [topic], and summarize the findings.",
        icon: MicroscopeIcon,
      },
      {
        suggestion: "Collect",
        prompt: "Collect data from [source] and create a report.",
        icon: ShapesIcon,
      },
      {
        suggestion: "Learn",
        prompt: "Learn about [topic] and create a tutorial.",
        icon: GraduationCapIcon,
      },
    ],
    suggestionsCreate: [
      {
        suggestion: "Webpage",
        prompt: "Create a webpage about [topic]",
        icon: CompassIcon,
      },
      {
        suggestion: "Image",
        prompt: "Create an image about [topic]",
        icon: ImageIcon,
      },
      {
        suggestion: "Video",
        prompt: "Create a video about [topic]",
        icon: VideoIcon,
      },
      {
        type: "separator",
      },
      {
        suggestion: "Skill",
        prompt:
          "We're going to build a new skill step by step with `skill-creator`. To start, what do you want this skill to do?",
        icon: SparklesIcon,
      },
    ],
  },

  // Sidebar
  sidebar: {
    newChat: "New chat",
    chats: "Chats",
    recentChats: "Recent chats",
    demoChats: "Demo chats",
  },

  // Breadcrumb
  breadcrumb: {
    workspace: "Workspace",
    chats: "Chats",
  },

  // Workspace
  workspace: {
    officialWebsite: "DeerFlow's official website",
    githubTooltip: "DeerFlow on Github",
    settingsAndMore: "Settings and more",
    visitGithub: "DeerFlow on GitHub",
    reportIssue: "Report a issue",
    contactUs: "Contact us",
    about: "About DeerFlow",
  },

  // Conversation
  conversation: {
    noMessages: "No messages yet",
    startConversation: "Start a conversation to see messages here",
  },

  // Chats
  chats: {
    searchChats: "Search chats",
  },

  // Page titles (document title)
  pages: {
    appName: "DeerFlow",
    chats: "Chats",
    newChat: "New chat",
    untitled: "Untitled",
  },

  // Landing
  landing: {
    header: {
      starOnGithub: "Star on GitHub",
    },
    hero: {
      words: [
        "Deep Research",
        "Collect Data",
        "Analyze Data",
        "Generate Webpages",
        "Vibe Coding",
        "Generate Slides",
        "Generate Images",
        "Generate Podcasts",
        "Generate Videos",
        "Generate Songs",
        "Organize Emails",
        "Do Anything",
        "Learn Anything",
      ],
      withDeerFlow: "with DeerFlow",
      descriptionLine1:
        "An open-source SuperAgent harness that researches, codes, and creates.",
      descriptionLine2:
        "With the help of sandboxes, memories, tools, skills and subagents, it handles",
      descriptionLine3:
        "different levels of tasks that could take minutes to hours.",
      getStarted: "Get Started with 2.0",
    },
    footer: {
      quote: "\"Originated from Open Source, give back to Open Source.\"",
      license: "Licensed under MIT License",
    },
    sections: {
      caseStudies: {
        title: "Case Studies",
        subtitle: "See how DeerFlow is used in the wild",
        items: [
          {
            threadId: "7cfa5f8f-a2f8-47ad-acbd-da7137baf990",
            title: "Forecast 2026 Agent Trends and Opportunities",
            description:
              "Create a webpage with a Deep Research report forecasting the agent technology trends and opportunities in 2026.",
          },
          {
            threadId: "4f3e55ee-f853-43db-bfb3-7d1a411f03cb",
            title: "Generate a Video Based On the Novel \"Pride and Prejudice\"",
            description:
              "Search the specific scene from the novel \"Pride and Prejudice\", then generate a video as well as a reference image based on the scenes.",
          },
          {
            threadId: "21cfea46-34bd-4aa6-9e1f-3009452fbeb9",
            title: "Doraemon Explains the MOE Architecture",
            description:
              "Generate a Doraemon comic strip explaining the MOE architecture to the teenagers who are interested in AI.",
          },
          {
            threadId: "ad76c455-5bf9-4335-8517-fc03834ab828",
            title: "An Exploratory Data Analysis of the Titanic Dataset",
            description:
              "Explore the Titanic dataset and identify the key factors that influenced survival rates with visualizations and insights.",
          },
          {
            threadId: "d3e5adaf-084c-4dd5-9d29-94f1d6bccd98",
            title: "Watch Y Combinator's Video then Conduct a Deep Research",
            description:
              "Watch the given Y Combinator's YouTube video and conduct a deep research on the YC's tips for technical startup founders.",
          },
          {
            threadId: "3823e443-4e2b-4679-b496-a9506eae462b",
            title: "Collect and Summarize Dr. Fei Fei Li's Podcasts",
            description:
              "Collect all the podcast appearances of Dr. Fei Fei Li in the last 6 months, then summarize them into a comprehensive report.",
          },
        ],
      },
      skills: {
        title: "Agent Skills",
        subtitleLine1:
          "Agent Skills are loaded progressively — only what's needed, when it's needed.",
        subtitleLine2:
          "Extend DeerFlow with your own skill files, or use our built-in library.",
      },
      sandbox: {
        title: "Agent Runtime Environment",
        subtitle:
          'We give DeerFlow a "computer", which can execute commands, manage files, and run long tasks — all in a secure Docker-based sandbox',
        openSource: "Open-source",
        name: "AIO Sandbox",
        description:
          "We recommend using All-in-One Sandbox that combines Browser, Shell, File, MCP and VSCode Server in a single Docker container.",
        tags: ["Isolated", "Safe", "Persistent", "Mountable FS", "Long-running"],
      },
      whatsNew: {
        title: "Whats New in DeerFlow 2.0",
        subtitle:
          "DeerFlow is now evolving from a Deep Research agent into a full-stack Super Agent",
        features: [
          {
            label: "Context Engineering",
            title: "Long/Short-term Memory",
            description: "Now the agent can better understand you",
          },
          {
            label: "Long Task Running",
            title: "Planning and Sub-tasking",
            description:
              "Plans ahead, reasons through complexity, then executes sequentially or in parallel",
          },
          {
            label: "Extensible",
            title: "Skills and Tools",
            description:
              "Plug, play, or even swap built-in tools. Build the agent you want.",
          },
          {
            label: "Persistent",
            title: "Sandbox with File System",
            description: "Read, write, run — like a real computer",
          },
          {
            label: "Flexible",
            title: "Multi-Model Support",
            description: "Doubao, DeepSeek, OpenAI, Gemini, etc.",
          },
          {
            label: "Free",
            title: "Open Source",
            description: "MIT License, self-hosted, full control",
          },
        ],
      },
      community: {
        title: "Join the Community",
        subtitle:
          "Contribute brilliant ideas to shape the future of DeerFlow. Collaborate, innovate, and make impacts.",
        button: "Contribute Now",
      },
    },
  },

  // Tool calls
  toolCalls: {
    moreSteps: (count: number) => `${count} more step${count === 1 ? "" : "s"}`,
    lessSteps: "Less steps",
    executeCommand: "Execute command",
    presentFiles: "Present files",
    needYourHelp: "Need your help",
    useTool: (toolName: string) => `Use "${toolName}" tool`,
    searchFor: (query: string) => `Search for "${query}"`,
    searchForRelatedInfo: "Search for related information",
    searchForRelatedImages: "Search for related images",
    searchForRelatedImagesFor: (query: string) =>
      `Search for related images for "${query}"`,
    searchOnWebFor: (query: string) => `Search on the web for "${query}"`,
    viewWebPage: "View web page",
    listFolder: "List folder",
    readFile: "Read file",
    writeFile: "Write file",
    clickToViewContent: "Click to view file content",
    writeTodos: "Update to-do list",
    skillInstallTooltip: "Install skill and make it available to DeerFlow",
  },

  // Subtasks
  subtasks: {
    subtask: "Subtask",
    executing: (count: number) =>
      `Executing ${count === 1 ? "" : count + " "}subtask${count === 1 ? "" : "s in parallel"}`,
    in_progress: "Running subtask",
    completed: "Subtask completed",
    failed: "Subtask failed",
  },

  // Settings
  settings: {
    title: "Settings",
    description: "Adjust how DeerFlow looks and behaves for you.",
    sections: {
      appearance: "Appearance",
      memory: "Memory",
      tools: "Tools",
      skills: "Skills",
      notification: "Notification",
      about: "About",
    },
    memory: {
      title: "Memory",
      description:
        "DeerFlow automatically learns from your conversations in the background. These memories help DeerFlow understand you better and deliver a more personalized experience.",
      empty: "No memory data to display.",
      rawJson: "Raw JSON",
      markdown: {
        overview: "Overview",
        userContext: "User context",
        work: "Work",
        personal: "Personal",
        topOfMind: "Top of mind",
        historyBackground: "History",
        recentMonths: "Recent months",
        earlierContext: "Earlier context",
        longTermBackground: "Long-term background",
        updatedAt: "Updated at",
        facts: "Facts",
        empty: "(empty)",
        table: {
          category: "Category",
          confidence: "Confidence",
          confidenceLevel: {
            veryHigh: "Very high",
            high: "High",
            normal: "Normal",
            unknown: "Unknown",
          },
          content: "Content",
          source: "Source",
          createdAt: "CreatedAt",
          view: "View",
        },
      },
    },
    appearance: {
      themeTitle: "Theme",
      themeDescription:
        "Choose how the interface follows your device or stays fixed.",
      system: "System",
      light: "Light",
      dark: "Dark",
      systemDescription: "Match the operating system preference automatically.",
      lightDescription: "Bright palette with higher contrast for daytime.",
      darkDescription: "Dim palette that reduces glare for focus.",
      languageTitle: "Language",
      languageDescription: "Switch between languages.",
    },
    tools: {
      title: "Tools",
      description: "Manage the configuration and enabled status of MCP tools.",
    },
    skills: {
      title: "Agent Skills",
      description:
        "Manage the configuration and enabled status of the agent skills.",
      createSkill: "Create skill",
      emptyTitle: "No agent skill yet",
      emptyDescription:
        "Put your agent skill folders under the `/skills/custom` folder under the root folder of DeerFlow.",
      emptyButton: "Create Your First Skill",
    },
    notification: {
      title: "Notification",
      description:
        "DeerFlow only sends a completion notification when the window is not active. This is especially useful for long-running tasks so you can switch to other work and get notified when done.",
      requestPermission: "Request notification permission",
      deniedHint:
        "Notification permission was denied. You can enable it in your browser's site settings to receive completion alerts.",
      testButton: "Send test notification",
      testTitle: "DeerFlow",
      testBody: "This is a test notification.",
      notSupported: "Your browser does not support notifications.",
      disableNotification: "Disable notification",
    },
    acknowledge: {
      emptyTitle: "Acknowledgements",
      emptyDescription: "Credits and acknowledgements will show here.",
    },
  },
};
