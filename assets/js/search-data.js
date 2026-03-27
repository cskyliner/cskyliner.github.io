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
  },{id: "nav-blog",
          title: "Blog",
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
        },{id: "dropdown-bookshelf",
              title: "bookshelf",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/books/";
              },
            },{id: "dropdown-blog",
              title: "blog",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/blog/";
              },
            },{id: "post-计算机视觉-图像生成模型",
        
          title: "计算机视觉-图像生成模型",
        
        description: "生成模型全景图：自回归模型，VAE，GAN与扩散模型原理解析",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/Image-Generation/";
          
        },
      },{id: "post-计算机视觉-multi-view-stereo-mvs",
        
          title: "计算机视觉-Multi-View Stereo (MVS)",
        
        description: "多视角立体视觉技术，从校准图片构建稠密 3D 模型",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/Multi-View-Stereo/";
          
        },
      },{id: "post-计算机视觉-structure-from-motion-sfm",
        
          title: "计算机视觉-Structure from Motion (SFM)",
        
        description: "深入解析运动恢复结构 (SFM) 算法，探讨相机标定与三维点云重建原理",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/Structure-from-Motion/";
          
        },
      },{id: "post-知识图谱",
        
          title: "知识图谱",
        
        description: "知识图谱的概念、构建方法与应用，包括知识抽取、表示学习与 GNN",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/%E7%9F%A5%E8%AF%86%E5%9B%BE%E8%B0%B1/";
          
        },
      },{id: "post-自然语言处理-统计语言模型与词表示",
        
          title: "自然语言处理-统计语言模型与词表示",
        
        description: "统计语言模型与词表示方法，包括朴素贝叶斯、tf-idf、word2vec 等",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/%E8%87%AA%E7%84%B6%E8%AF%AD%E8%A8%80%E5%A4%84%E7%90%86-%E7%BB%9F%E8%AE%A1%E8%AF%AD%E8%A8%80%E6%A8%A1%E5%9E%8B%E4%B8%8E%E8%AF%8D%E8%A1%A8%E7%A4%BA/";
          
        },
      },{id: "post-自然语言处理-rnn-amp-transformer",
        
          title: "自然语言处理-RNN&amp;Transformer",
        
        description: "基于神经网络的自然语言处理方法，包括 RNN 与 Transformer 架构详解",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/%E8%87%AA%E7%84%B6%E8%AF%AD%E8%A8%80%E5%A4%84%E7%90%86-RNN&Transformer/";
          
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
