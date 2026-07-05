/**
 * RSS Crawler Base
 * Fetches and parses RSS/Atom feeds to discover organization content.
 */
class RSSCrawler extends BaseCrawler {
  constructor() {
    super('RSSCrawler');
  }

  _getDefaultState() {
    return {
      feedIndex: 0,
      processedUrls: [],
      timestamp: Date.now()
    };
  }

  /**
   * Overridable config key for getting feeds so child classes can use different lists.
   */
  _getFeedsConfigKey() {
    return 'CRAWLER.DEFAULT_RSS_FEEDS';
  }

  crawl() {
    const feeds = this.config.get(this._getFeedsConfigKey(), []);
    if (feeds.length === 0 || this.state.feedIndex >= feeds.length) {
       return null; // Signals exhausted
    }

    const feedUrl = feeds[this.state.feedIndex];
    this.logger.debug(this.name, 'Crawl', `Fetching RSS feed: ${feedUrl}`);

    const response = this.fetch(feedUrl);
    if (!response.isSuccess) {
      this.logger.error(this.name, 'Crawl', `Failed to fetch RSS: ${feedUrl}`, response.statusCode);
      this.state.feedIndex++; // skip on fail
      return []; // Return empty but not exhausted since there might be more feeds
    }

    try {
      const document = XmlService.parse(response.text);
      const root = document.getRootElement();
      let entries = [];

      const atomNs = XmlService.getNamespace('http://www.w3.org/2005/Atom');

      // Determine if ATOM or RSS
      if (root.getName() === 'feed') {
        entries = root.getChildren('entry', atomNs);
      } else {
        const channel = root.getChild('channel');
        if (channel) entries = channel.getChildren('item');
      }

      const rawItems = [];
      for (const entry of entries) {
        let link = '';
        if (root.getName() === 'feed') {
           const linkEl = entry.getChild('link', atomNs);
           if (linkEl) link = linkEl.getAttribute('href').getValue();
        } else {
           const linkEl = entry.getChild('link');
           if (linkEl) link = linkEl.getText();
        }

        if (!link || this.state.processedUrls.includes(link)) continue;

        rawItems.push({
          xmlEntry: entry,
          link: link,
          feedType: root.getName()
        });

        this.state.processedUrls.push(link);
      }

      // keep array manageable
      if (this.state.processedUrls.length > 500) {
          this.state.processedUrls = this.state.processedUrls.slice(-200);
      }

      this.state.feedIndex++;
      return rawItems;
    } catch (e) {
      this.logger.error(this.name, 'Crawl', `Failed to parse XML for feed: ${feedUrl}`, e);
      this.state.feedIndex++;
      return [];
    }
  }

  normalize(rawItem) {
    const entry = rawItem.xmlEntry;
    const atomNs = XmlService.getNamespace('http://www.w3.org/2005/Atom');
    const isAtom = rawItem.feedType === 'feed';

    let title = '', description = '', pubDate = '', author = '';

    if (isAtom) {
      title = entry.getChild('title', atomNs) ? entry.getChild('title', atomNs).getText() : '';
      description = entry.getChild('content', atomNs) ? entry.getChild('content', atomNs).getText() : '';
      if (!description) {
         description = entry.getChild('summary', atomNs) ? entry.getChild('summary', atomNs).getText() : '';
      }
      pubDate = entry.getChild('published', atomNs) ? entry.getChild('published', atomNs).getText() : '';
      const authNode = entry.getChild('author', atomNs);
      if (authNode) author = authNode.getChild('name', atomNs) ? authNode.getChild('name', atomNs).getText() : '';
    } else {
      title = entry.getChild('title') ? entry.getChild('title').getText() : '';
      description = entry.getChild('description') ? entry.getChild('description').getText() : '';
      const encodedNs = XmlService.getNamespace('content', 'http://purl.org/rss/1.0/modules/content/');
      if (entry.getChild('encoded', encodedNs)) {
         description = entry.getChild('encoded', encodedNs).getText();
      }
      pubDate = entry.getChild('pubDate') ? entry.getChild('pubDate').getText() : '';
      author = entry.getChild('creator', XmlService.getNamespace('dc', 'http://purl.org/dc/elements/1.1/'))
               ? entry.getChild('creator', XmlService.getNamespace('dc', 'http://purl.org/dc/elements/1.1/')).getText()
               : '';
    }

    return this._createNormalizedRecord({
      source: this.name,
      sourceType: 'News/Blog',
      title: title,
      description: description,
      content: description, // RSS usually has summary or full text
      url: rawItem.link,
      author: author,
      publishedAt: pubDate || new Date().toISOString()
    });
  }
}

class GenericRSSCrawler extends RSSCrawler {
  constructor() {
    super();
    this.name = 'GenericRSSCrawler';
  }
  _getFeedsConfigKey() {
    return 'CRAWLER.GENERIC_RSS_FEEDS';
  }
}

class EngineeringBlogCrawler extends RSSCrawler {
  constructor() {
    super();
    this.name = 'EngineeringBlogCrawler';
  }
  _getFeedsConfigKey() {
    return 'CRAWLER.ENGINEERING_RSS_FEEDS';
  }
}

class AIBlogCrawler extends RSSCrawler {
  constructor() {
    super();
    this.name = 'AIBlogCrawler';
  }
  _getFeedsConfigKey() {
    return 'CRAWLER.AI_RSS_FEEDS';
  }
}


/**
 * Reddit Crawler
 * Fetches JSON payload from Reddit
 */
class RedditCrawler extends BaseCrawler {
  constructor() {
    super('RedditCrawler');
  }

  _getDefaultState() {
    return {
      subredditIndex: 0,
      after: null,
      timestamp: Date.now()
    };
  }

  crawl() {
    const subs = this.config.get('CRAWLER.DEFAULT_SUBREDDITS', []);
    if (subs.length === 0 || this.state.subredditIndex >= subs.length) {
      return null;
    }

    const sub = subs[this.state.subredditIndex];
    let url = `https://www.reddit.com/r/${sub}/new.json?limit=25`;
    if (this.state.after) {
       url += `&after=${this.state.after}`;
    }

    // Rate Limit Pause
    const delay = this.config.get('CRAWLER.REDDIT_RATE_LIMIT_MS', 2000);
    Utilities.sleep(delay);

    const response = this.fetch(url);
    if (!response.isSuccess || !response.json) {
       this.logger.error(this.name, 'Crawl', `Reddit API failed for r/${sub}`, response.statusCode);
       this.state.subredditIndex++;
       this.state.after = null;
       return [];
    }

    const data = response.json.data;
    if (!data || !data.children || data.children.length === 0) {
       this.state.subredditIndex++;
       this.state.after = null;
       return [];
    }

    this.state.after = data.after;
    if (!this.state.after) {
       this.state.subredditIndex++;
    }

    return data.children;
  }

  normalize(rawItem) {
    const data = rawItem.data;
    return this._createNormalizedRecord({
      source: 'Reddit',
      sourceType: 'Community',
      title: data.title,
      description: data.selftext.substring(0, 500),
      content: data.selftext,
      url: `https://reddit.com${data.permalink}`,
      author: data.author,
      publishedAt: new Date(data.created_utc * 1000).toISOString(),
      rawJson: { score: data.score, num_comments: data.num_comments, subreddit: data.subreddit }
    });
  }
}


/**
 * GitHub Crawler
 * Searches public repositories for issues.
 */
class GitHubCrawler extends BaseCrawler {
  constructor() {
    super('GitHubCrawler');
  }

  _getDefaultState() {
    return {
      queryIndex: 0,
      searchTypeIndex: 0, // 0 = issues, 1 = repositories
      page: 1,
      timestamp: Date.now()
    };
  }

  crawl() {
    const queries = this.config.get('CRAWLER.GITHUB_QUERIES', []);
    const searchTypes = ['issues', 'repositories'];

    if (queries.length === 0 || this.state.queryIndex >= queries.length) {
        return null;
    }

    const query = queries[this.state.queryIndex];
    const searchType = searchTypes[this.state.searchTypeIndex];

    const url = `https://api.github.com/search/${searchType}?q=${encodeURIComponent(query)}&page=${this.state.page}&per_page=30`;

    Utilities.sleep(this.config.get('CRAWLER.GITHUB_RATE_LIMIT_MS', 1000));

    const response = this.fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
    if (!response.isSuccess || !response.json) {
       this._advanceState(searchTypes);
       return [];
    }

    const items = response.json.items || [];

    // Attach type for normalizer
    const rawItems = items.map(item => ({ ...item, githubSearchType: searchType }));

    if (items.length < 30) {
       this._advanceState(searchTypes);
    } else {
       this.state.page++;
    }

    return rawItems;
  }

  _advanceState(searchTypes) {
    this.state.page = 1;
    this.state.searchTypeIndex++;
    if (this.state.searchTypeIndex >= searchTypes.length) {
       this.state.searchTypeIndex = 0;
       this.state.queryIndex++;
    }
  }

  normalize(rawItem) {
    if (rawItem.githubSearchType === 'repositories') {
       return this._createNormalizedRecord({
         source: 'GitHub',
         sourceType: 'CodeRepository',
         organization: rawItem.owner ? rawItem.owner.login : null,
         title: rawItem.full_name || rawItem.name,
         description: rawItem.description ? rawItem.description.substring(0, 500) : '',
         content: rawItem.description,
         url: rawItem.html_url,
         author: rawItem.owner ? rawItem.owner.login : null,
         publishedAt: rawItem.created_at,
         rawJson: { language: rawItem.language, topics: rawItem.topics, forks: rawItem.forks, stars: rawItem.stargazers_count }
       });
    }

    return this._createNormalizedRecord({
      source: 'GitHub',
      sourceType: 'CodeRepository',
      organization: rawItem.repository_url ? rawItem.repository_url.split('/').slice(-2, -1)[0] : null,
      title: rawItem.title,
      description: rawItem.body ? rawItem.body.substring(0, 500) : '',
      content: rawItem.body,
      url: rawItem.html_url,
      author: rawItem.user ? rawItem.user.login : null,
      publishedAt: rawItem.created_at,
      rawJson: { state: rawItem.state, labels: rawItem.labels }
    });
  }
}


/**
 * HackerNews Crawler
 */
class HackerNewsCrawler extends BaseCrawler {
  constructor() {
    super('HackerNewsCrawler');
  }

  _getDefaultState() {
    return {
      categoryIndex: 0,
      itemIds: [],
      processedIndex: 0
    };
  }

  crawl() {
    const categories = ['topstories', 'newstories', 'beststories', 'askstories', 'showstories'];
    if (this.state.categoryIndex >= categories.length) return null;

    const category = categories[this.state.categoryIndex];

    if (!this.state.itemIds || this.state.itemIds.length === 0) {
      const url = `https://hacker-news.firebaseio.com/v0/${category}.json`;
      const response = this.fetch(url);
      if (response.isSuccess && response.json) {
         this.state.itemIds = response.json;
         this.state.processedIndex = 0;
      } else {
         this.state.categoryIndex++;
         return [];
      }
    }

    const batch = this.state.itemIds.slice(this.state.processedIndex, this.state.processedIndex + 10);
    this.state.processedIndex += batch.length;

    if (this.state.processedIndex >= this.state.itemIds.length) {
      this.state.categoryIndex++;
      this.state.itemIds = [];
    }

    const items = [];
    for (const id of batch) {
       const url = `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
       const res = this.fetch(url);
       if (res.isSuccess && res.json) {
          items.push(res.json);
       }
    }

    return items;
  }

  normalize(rawItem) {
    return this._createNormalizedRecord({
      source: 'HackerNews',
      sourceType: 'Community',
      title: rawItem.title,
      description: rawItem.text || '',
      content: rawItem.text || '',
      url: rawItem.url || `https://news.ycombinator.com/item?id=${rawItem.id}`,
      author: rawItem.by,
      publishedAt: new Date(rawItem.time * 1000).toISOString(),
      rawJson: { score: rawItem.score, descendants: rawItem.descendants }
    });
  }
}


/**
 * Greenhouse ATS Crawler
 * Scrapes Greenhouse board API
 */
class GreenhouseCrawler extends BaseCrawler {
  constructor() {
    super('GreenhouseCrawler');
  }

  _getDefaultState() {
    return {
      companyIndex: 0,
      timestamp: Date.now()
    };
  }

  crawl() {
    const companies = this.config.get('CRAWLER.GREENHOUSE_COMPANIES', []);
    if (companies.length === 0 || this.state.companyIndex >= companies.length) {
       return null;
    }

    const companyToken = companies[this.state.companyIndex];
    const url = `https://boards-api.greenhouse.io/v1/boards/${companyToken}/jobs?content=true`;

    const response = this.fetch(url);
    this.state.companyIndex++;

    if (!response.isSuccess || !response.json || !response.json.jobs) {
       return [];
    }

    return response.json.jobs.map(job => ({ ...job, companyToken }));
  }

  normalize(rawItem) {
    // Greenhouse returns full html in content. We do a naive strip or just pass it to AI later.
    let cleanDescription = rawItem.content ? rawItem.content.replace(/<[^>]*>?/gm, ' ') : '';
    cleanDescription = cleanDescription.substring(0, 1000);

    return this._createNormalizedRecord({
      source: 'Greenhouse',
      sourceType: 'JobBoard',
      company: rawItem.companyToken, // approximate
      title: rawItem.title,
      description: cleanDescription,
      content: rawItem.content,
      url: rawItem.absolute_url,
      publishedAt: rawItem.updated_at || new Date().toISOString(),
      rawJson: { location: rawItem.location, department: rawItem.departments }
    });
  }
}

/**
 * Lever ATS Crawler
 */
class LeverCrawler extends BaseCrawler {
  constructor() {
    super('LeverCrawler');
  }

  _getDefaultState() {
    return {
      companyIndex: 0,
      timestamp: Date.now()
    };
  }

  crawl() {
    const companies = this.config.get('CRAWLER.LEVER_COMPANIES', []);
    if (companies.length === 0 || this.state.companyIndex >= companies.length) {
       return null;
    }

    const companyToken = companies[this.state.companyIndex];
    const url = `https://api.lever.co/v0/postings/${companyToken}?mode=json`;

    const response = this.fetch(url);
    this.state.companyIndex++;

    if (!response.isSuccess || !response.json) {
       return [];
    }

    // Response is an array of jobs
    return Array.isArray(response.json) ? response.json.map(job => ({ ...job, companyToken })) : [];
  }

  normalize(rawItem) {
    return this._createNormalizedRecord({
      source: 'Lever',
      sourceType: 'JobBoard',
      company: rawItem.companyToken,
      title: rawItem.text,
      description: rawItem.descriptionPlain || '',
      content: rawItem.description || '',
      url: rawItem.hostedUrl,
      publishedAt: new Date(rawItem.createdAt).toISOString(),
      rawJson: { location: rawItem.categories }
    });
  }
}


/**
 * Ashby ATS Crawler
 */
class AshbyCrawler extends BaseCrawler {
  constructor() {
    super('AshbyCrawler');
  }

  _getDefaultState() {
    return {
      companyIndex: 0,
      timestamp: Date.now()
    };
  }

  crawl() {
    const companies = this.config.get('CRAWLER.ASHBY_COMPANIES', []);
    if (companies.length === 0 || this.state.companyIndex >= companies.length) {
       return null;
    }

    const companyToken = companies[this.state.companyIndex];
    const url = `https://api.ashbyhq.com/posting-api/job-board/${companyToken}`;

    const response = this.fetch(url);
    this.state.companyIndex++;

    if (!response.isSuccess || !response.json || !response.json.jobs) {
       return [];
    }

    return response.json.jobs.map(job => ({ ...job, companyToken }));
  }

  normalize(rawItem) {
    return this._createNormalizedRecord({
      source: 'Ashby',
      sourceType: 'JobBoard',
      company: rawItem.companyToken,
      title: rawItem.title,
      description: rawItem.descriptionHtml ? rawItem.descriptionHtml.replace(/<[^>]*>?/gm, ' ').substring(0, 500) : '',
      content: rawItem.descriptionHtml || '',
      url: rawItem.jobUrl,
      publishedAt: rawItem.publishedAt || new Date().toISOString(),
      rawJson: { location: rawItem.location, department: rawItem.department }
    });
  }
}


/**
 * Workable ATS Crawler
 */
class WorkableCrawler extends BaseCrawler {
  constructor() {
    super('WorkableCrawler');
  }

  _getDefaultState() {
    return {
      companyIndex: 0,
      timestamp: Date.now()
    };
  }

  crawl() {
    const companies = this.config.get('CRAWLER.WORKABLE_COMPANIES', []);
    if (companies.length === 0 || this.state.companyIndex >= companies.length) {
       return null;
    }

    const companyToken = companies[this.state.companyIndex];
    // Workable uses an old JSONP endpoint but occasionally exposes RSS, let's use the known RSS/JSON schema
    const url = `https://apply.workable.com/api/v3/accounts/${companyToken}/jobs`;

    const response = this.fetch(url, { method: 'POST', payload: { limit: 50 } });
    this.state.companyIndex++;

    if (!response.isSuccess || !response.json || !response.json.results) {
       return [];
    }

    return response.json.results.map(job => ({ ...job, companyToken }));
  }

  normalize(rawItem) {
    return this._createNormalizedRecord({
      source: 'Workable',
      sourceType: 'JobBoard',
      company: rawItem.companyToken,
      title: rawItem.title,
      description: rawItem.description || '',
      content: rawItem.description || '',
      url: `https://apply.workable.com/${rawItem.companyToken}/j/${rawItem.shortcode}/`,
      publishedAt: rawItem.published_on || new Date().toISOString(),
      rawJson: { location: rawItem.location, department: rawItem.department }
    });
  }
}


// Global Factory
function getCrawlerPlugins() {
  return {
    RSSCrawler: new RSSCrawler(),
    GenericRSSCrawler: new GenericRSSCrawler(),
    EngineeringBlogCrawler: new EngineeringBlogCrawler(),
    AIBlogCrawler: new AIBlogCrawler(),
    RedditCrawler: new RedditCrawler(),
    GitHubCrawler: new GitHubCrawler(),
    HackerNewsCrawler: new HackerNewsCrawler(),
    GreenhouseCrawler: new GreenhouseCrawler(),
    LeverCrawler: new LeverCrawler(),
    AshbyCrawler: new AshbyCrawler(),
    WorkableCrawler: new WorkableCrawler()
  };
}
