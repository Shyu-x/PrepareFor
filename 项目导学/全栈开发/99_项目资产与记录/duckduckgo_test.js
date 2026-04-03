// duckduckgo.js - DuckDuckGo API 封装

export class DuckDuckGoAPI {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "https://api.duckduckgo.com/";
    this.defaultParams = {
      format: "json",
      no_redirect: "1",
      no_html: "1",
      skip_disambig: "1",
      ...options.defaultParams,
    };
  }

  buildUrl(query, extraParams = {}) {
    if (!query || typeof query !== "string") {
      throw new Error("query must be a non-empty string");
    }

    const url = new URL(this.baseUrl);
    const params = {
      ...this.defaultParams,
      ...extraParams,
      q: query,
    };

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  async search(query, extraParams = {}) {
    const url = this.buildUrl(query, extraParams);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    return {
      query,
      heading: data.Heading || "",
      abstract: data.AbstractText || "",
      abstractUrl: data.AbstractURL || "",
      answer: data.Answer || "",
      definition: data.Definition || "",
      definitionUrl: data.DefinitionURL || "",
      redirect: data.Redirect || "",
      image: data.Image || "",
      relatedTopics: this.flattenRelatedTopics(data.RelatedTopics || []),
      raw: data,
    };
  }

  flattenRelatedTopics(topics) {
    const results = [];

    for (const item of topics) {
      if (item.Text || item.FirstURL) {
        results.push({
          text: item.Text || "",
          url: item.FirstURL || "",
          icon: item.Icon?.URL || "",
          result: item.Result || "",
        });
      }

      if (Array.isArray(item.Topics)) {
        for (const sub of item.Topics) {
          results.push({
            text: sub.Text || "",
            url: sub.FirstURL || "",
            icon: sub.Icon?.URL || "",
            result: sub.Result || "",
          });
        }
      }
    }

    return results;
  }

  async summary(query, extraParams = {}) {
    const result = await this.search(query, extraParams);

    return {
      title: result.heading,
      description: result.abstract || result.answer || result.definition,
      link: result.abstractUrl || result.definitionUrl || result.redirect,
      related: result.relatedTopics.slice(0, 5),
    };
  }
}

// 超轻量函数版
export async function duckSearch(query, options = {}) {
  if (!query) throw new Error("query is required");

  const url = new URL("https://api.duckduckgo.com/");
  const params = {
    q: query,
    format: "json",
    no_redirect: "1",
    no_html: "1",
    skip_disambig: "1",
    ...options,
  };

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
}

// 测试函数
async function test() {
  const ddg = new DuckDuckGoAPI();

  try {
    console.log("=== 测试 DuckDuckGo API ===\n");

    // 测试1: 基本搜索
    console.log("测试1: 搜索 'JavaScript'");
    const result1 = await ddg.search("JavaScript");
    console.log("标题:", result1.heading);
    console.log("摘要:", result1.abstract?.substring(0, 200) + "...");
    console.log("链接:", result1.abstractUrl);
    console.log("");

    // 测试2: 简洁摘要
    console.log("测试2: 获取 'React' 摘要");
    const summary = await ddg.summary("React");
    console.log("标题:", summary.title);
    console.log("描述:", summary.description?.substring(0, 200) + "...");
    console.log("链接:", summary.link);
    console.log("");

    // 测试3: 超轻量函数版
    console.log("测试3: 使用 duckSearch 函数搜索 'Vue.js'");
    const data = await duckSearch("Vue.js");
    console.log("Heading:", data.Heading);
    console.log("Abstract:", data.AbstractText?.substring(0, 200) + "...");
    console.log("");

    console.log("=== 所有测试完成 ===");

  } catch (error) {
    console.error("测试失败:", error.message);
  }
}

// 如果直接运行此文件，则执行测试
// 如果作为模块导入，则不执行测试
if (typeof require !== 'undefined' && require.main === module) {
  test();
} else if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('duckduckgo_test.js')) {
  test();
}
