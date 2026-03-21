const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio');

const FlexSearch = require('flexsearch');

const SITE_DIR = path.join(__dirname, '..', '_site');
const OUTPUT_DIR = path.join(__dirname, '..', '_site', 'assets');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'search-index.json');

const STOP_WORDS = new Set([
  '的', '了', '和', '是', '在', '有', '我', '你', '他', '她', '它', '们',
  '这', '那', '就', '也', '要', '会', '能', '可以', '到', '说', '去',
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't',
  'can', 'just', 'don', 'now', 'i', 'me', 'my', 'myself', 'we',
  'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
  'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
  'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
  'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'am', 'if', 'because', 'until', 'while'
]);

function tokenizeText(text) {
  const tokens = new Set();
  
  const chinesePattern = /[\u4e00-\u9fff]+/g;
  const englishPattern = /[a-zA-Z0-9]+/g;
  
  let match;
  
  while ((match = chinesePattern.exec(text)) !== null) {
    const chineseText = match[0];
    
    if (chineseText.length >= 2) {
      tokens.add(chineseText.substring(0, 2));
    }
    if (chineseText.length >= 3) {
      tokens.add(chineseText.substring(0, 3));
    }
    if (chineseText.length >= 4) {
      tokens.add(chineseText.substring(0, 4));
    }
    
    for (let i = 0; i < chineseText.length - 1; i++) {
      const bigram = chineseText.substring(i, i + 2);
      if (!STOP_WORDS.has(bigram)) {
        tokens.add(bigram);
      }
    }
    
    for (let i = 0; i < chineseText.length - 2; i++) {
      const trigram = chineseText.substring(i, i + 3);
      if (!STOP_WORDS.has(trigram)) {
        tokens.add(trigram);
      }
    }
  }
  
  while ((match = englishPattern.exec(text)) !== null) {
    const word = match[0].toLowerCase();
    if (word.length > 1 && !STOP_WORDS.has(word)) {
      tokens.add(word);
    }
  }
  
  return Array.from(tokens);
}

function extractMetadata(html) {
  const $ = cheerio.load(html);
  
  const title = $('title').text() || $('h1').first().text() || '';
  
  const date = $('meta[name="date"], meta[name="published"]').attr('content') || 
               $('time').attr('datetime') || 
               $('p.post-meta').text().match(/\w+ \d+, \d{4}/)?.[0] || '';
  
  let excerpt = '';
  $('d-article p, #markdown-content p, article p, .post-content p').each((i, el) => {
    const text = $(el).text().trim();
    if (text.length > 30 && !text.startsWith('Enjoy Reading') && 
        !text.startsWith('Here are some more') && !text.startsWith('Related')) {
      excerpt = text.substring(0, 200);
      if (text.length > 200) excerpt += '...';
      return false;
    }
  });
  
  const tags = [];
  $('.post-tags a, .tag-link').each((i, el) => {
    const tag = $(el).text().trim();
    if (tag) tags.push(tag);
  });
  
  let content = '';
  $('d-article, #markdown-content, article, .post-content').each((i, el) => {
    const $el = $(el);
    $el.find('.related-posts, .giscus, .disqus-comments, nav, footer').remove();
    const text = $el.text();
    const idx = text.indexOf('Enjoy Reading This Article');
    if (idx > 0) {
      content += text.substring(0, idx) + ' ';
    } else {
      content += text + ' ';
    }
  });
  
  return { title, date, excerpt, tags, content: content.trim() };
}

function buildIndex() {
  console.log('Building search index...');
  
  if (!fs.existsSync(SITE_DIR)) {
    console.error('Error: _site directory not found. Run Jekyll build first.');
    process.exit(1);
  }
  
  const allFiles = glob.sync(`${SITE_DIR}/blog/**/*.html`);
  
  const blogFiles = allFiles.filter(file => {
    const relativePath = path.relative(SITE_DIR, file);
    const url = '/' + relativePath;
    return /\/blog\/\d{4}\/[^/]+\/index\.html$/.test(url);
  });
  
  if (blogFiles.length === 0) {
    console.log('No blog posts found. Creating empty index.');
    const emptyIndex = { docs: [], index: {} };
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(emptyIndex, null, 2));
    return;
  }
  
  console.log(`Found ${blogFiles.length} blog posts.`);
  
  const docs = [];
  const tokenToDocIds = {};
  
  blogFiles.forEach((file, index) => {
    console.log(`Processing: ${file}`);
    
    const html = fs.readFileSync(file, 'utf8');
    const { title, date, excerpt, tags, content } = extractMetadata(html);
    
    const relativePath = path.relative(SITE_DIR, file);
    const url = '/' + relativePath.replace(/index\.html$/, '').replace(/\.html$/, '/');
    
    const doc = {
      id: index,
      title: title.trim(),
      url,
      excerpt: excerpt.trim(),
      date: date.trim(),
      tags,
      content: content.substring(0, 5000)
    };
    
    docs.push(doc);
    
    const allText = `${title} ${content} ${tags.join(' ')}`;
    const tokens = tokenizeText(allText);
    
    tokens.forEach(token => {
      if (!tokenToDocIds[token]) {
        tokenToDocIds[token] = [];
      }
      if (!tokenToDocIds[token].includes(index)) {
        tokenToDocIds[token].push(index);
      }
    });
  });
  
  const indexData = {
    docs,
    index: tokenToDocIds
  };
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(indexData, null, 2));
  
  console.log(`Search index built successfully: ${OUTPUT_FILE}`);
  console.log(`Indexed ${docs.length} documents with ${Object.keys(tokenToDocIds).length} tokens.`);
}

buildIndex();