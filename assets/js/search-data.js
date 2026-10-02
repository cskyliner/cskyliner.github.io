// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "About",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-notes",
          title: "Notes",
          description: "Blog posts on AI, machine learning, and technology.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "Curriculum Vitae of Ruolin Zuo, AI student at Peking University.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "nav-search",
          title: "Search",
          description: "Full-text search across all content",
          section: "Navigation",
          handler: () => {
            window.location.href = "/search/";
          },
        },{id: "post-computer-vision-image-generation",
        
          title: "Computer Vision: Image Generation",
        
        description: "生成模型全景图：自回归模型，VAE，GAN 与扩散模型原理解析",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/Computer-Vision-Image-Generation/";
          
        },
      },{id: "post-computer-vision-multi-view-stereo-mvs",
        
          title: "Computer Vision: Multi-View Stereo (MVS)",
        
        description: "多视角立体视觉技术，从校准图片构建稠密 3D 模型",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/Computer-Vision-Multi-View-Stereo/";
          
        },
      },{id: "post-computer-vision-structure-from-motion-sfm",
        
          title: "Computer Vision: Structure from Motion (SFM)",
        
        description: "深入解析运动恢复结构 (SFM) 算法，探讨相机标定与三维点云重建原理",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/Computer-Vision-Structure-from-Motion/";
          
        },
      },{id: "post-introduction-to-ai-knowledge-graphs",
        
          title: "Introduction to AI: Knowledge Graphs",
        
        description: "知识图谱的概念、构建方法与应用，包括知识抽取、表示学习与 GNN",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/Introduction-to-AI-Knowledge-Graphs/";
          
        },
      },{id: "post-introduction-to-ai-statistical-language-models-and-word-representation",
        
          title: "Introduction to AI: Statistical Language Models and Word Representation",
        
        description: "统计语言模型与词表示方法，包括朴素贝叶斯、tf-idf、word2vec 等",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/Introduction-to-AI-Statistical-Language-Models-and-Word-Representation/";
          
        },
      },{id: "post-introduction-to-ai-rnn-and-transformer",
        
          title: "Introduction to AI: RNN and Transformer",
        
        description: "基于神经网络的自然语言处理方法，包括 RNN 与 Transformer 架构详解",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/Introduction-to-AI-RNN-and-Transformer/";
          
        },
      },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_godfather/";
            },},{id: "news-a-simple-inline-announcement",
          title: 'A simple inline announcement.',
          description: "",
          section: "News",},{id: "news-a-long-announcement-with-details",
          title: 'A long announcement with details',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/news/announcement_2/";
            },},{id: "news-a-simple-inline-announcement-with-markdown-emoji-sparkles-smile",
          title: 'A simple inline announcement with Markdown emoji! :sparkles: :smile:',
          description: "",
          section: "News",},{id: "projects-chronosflow",
          title: 'ChronosFlow',
          description: "基于 PySide6 的跨平台时间管理应用,支持AI日程规划助手",
          section: "Projects",handler: () => {
              window.location.href = "/projects/chronosflow/";
            },},{id: "projects-gobang",
          title: 'GoBang',
          description: "A Qt-based GoBang game project, PKU Introduction to Computing 24fall project",
          section: "Projects",handler: () => {
              window.location.href = "/projects/gobang/";
            },},{id: "projects-neural-physics-subspaces",
          title: 'Neural Physics Subspaces',
          description: "基于 XMAKE + Imgui + OpenGL + pybind11 的神经物理子空间研究项目，复现论文 neural-physics-subspaces",
          section: "Projects",handler: () => {
              window.location.href = "/projects/neural-physics-subspaces/";
            },},{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/cskyliner", "_blank");
        },
      },{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%7A%6B%79%6C%69%6E.%63%73@%67%6D%61%69%6C.%63%6F%6D", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
