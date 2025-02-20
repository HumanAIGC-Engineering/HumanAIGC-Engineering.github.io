const fs = require("fs");
const axios = require("axios");
const marked = require("marked");

// 定义需要获取的用户和仓库
const users = ["HumanAIGC-Engineering"]; // 替换为实际的 GitHub 用户名
const token = process.env.GITHUB_TOKEN; // 使用 GitHub Token 进行身份验证

async function fetchReadme(owner, repo) {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/readme`, // 确保使用正确的反引号
      { headers: { Authorization: `token ${token}` } }
    );
    const content = Buffer.from(response.data.content, "base64").toString();
    return marked.parse(content); // 将 Markdown 转换为 HTML
  } catch (error) {
    console.warn(
      `Failed to fetch README for ${owner}/${repo}: ${error.message}`
    );
    return null;
  }
}

async function fetchRepositories(user) {
  try {
    const response = await axios.get(
      `https://api.github.com/users/${user}/repos?per_page=100`, // 确保使用正确的反引号
      { headers: { Authorization: `token ${token}` } }
    );
    const repos = response.data.filter(
      (repo) => !repo.fork && !repo.private && !repo.name.endsWith("github.io")
    );
    return repos;
  } catch (error) {
    console.error(`Failed to fetch repositories for ${user}: ${error.message}`);
    return [];
  }
}

async function main() {
  const allReadmes = [];
  const allRepos = [];
  for (const user of users) {
    const repos = await fetchRepositories(user);
    allRepos.push(...repos);
    for (const repo of repos) {
      const readme = await fetchReadme(user, repo.name);
      if (readme) {
        allReadmes.push({ user, name: repo.name, readme });
      }
    }
  }
  console.log(allReadmes);

  // 保存数据到文件
  fs.writeFileSync("./data/readmes.json", JSON.stringify(allReadmes, null, 2));
  fs.writeFileSync("./data/repos.json", JSON.stringify(allRepos, null, 2));
}

main();
