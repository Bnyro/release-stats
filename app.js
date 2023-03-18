let $ = document.querySelector.bind(document);
let $$ = document.querySelectorAll.bind(document);

const baseUrl = "https://api.github.com";
const itemsPerReleasePage = 30;

const filterWords = [
  "Translation",
  "dependency",
  "Bump version",
  "Merge",
  "ktlint",
  "Changelog",
];

const generateChangelog = async (repo) => {
  const latestReleaseUrl = `${baseUrl}/repos/${repo}/releases/latest`;
  const releaseInfoResponse = await fetch(latestReleaseUrl);
  const releaseInfo = await releaseInfoResponse.json();

  const targetUrl = `${baseUrl}/repos/${repo}/compare/${releaseInfo.tag_name}...${releaseInfo.target_commitish}?per_page=100`;

  const response = await fetch(targetUrl);
  const json = await response.json();

  if (json.message) {
    alert(json.message);
    return;
  }

  const commits = json.commits;
  const pages = json.total_commits / 100;
  let current_page = 1;

  while (current_page < pages) {
    current_page += 1;
    const response = await fetch(targetUrl + "&page=" + current_page);
    const jsonResp = await response.json();
    commits.push(...jsonResp.commits);
  }

  const relevantCommits = commits.filter(
    (commit) =>
      !filterWords.some((word) =>
        commit.commit.message.toLowerCase().includes(word.toLowerCase())
      )
  );

  const changelog = relevantCommits
    .map((commit) => `* ${commit.commit.message}`)
    .map((message) => message.replace("closes ", ""))
    .join("<br />");

  $("#results").innerHTML = `<div>${changelog}</div>`;
};

const showReleases = (releases) => {
  releases.forEach((release) => {
    const downloadCount = getDownloadCount(release);
    const publishedStr = release.published_at;
    const published = publishedStr.substring(0, publishedStr.indexOf("T"));

    const inner = `
            <a href="${release.html_url}">${release.tag_name}</a>
            <span>Downloads: ${downloadCount}</span>
            <span>Author: <a href="${release.author.html_url}">${
      release.author.login
    }</a></span>
            <span>Published on: ${published}</span>
            <span>Total reactions: ${
              release.reactions?.total_count || "0"
            }</span>
        `;
    const newEl = document.createElement("div");
    newEl.innerHTML = inner;
    $("#results").appendChild(newEl);
  });
};

const getTotalDownloadCount = (releases) => {
  const downloads = releases.map((r) =>
    r.assets.map((a) => a.download_count).reduce((a, b) => a + b, 0)
  );
  return downloads.reduce((a, b) => a + b, 0);
};

const getDownloadCount = (release) => {
  return release.assets.map((a) => a.download_count).reduce((a, b) => a + b, 0);
};

const fetchReleases = async (repo) => {
  const releasesUrl = `${baseUrl}/repos/${repo}/releases`;
  const response = await fetch(releasesUrl);
  if (response.status != 200) throw new Error("Repository not found!");
  const releases = await response.json();
  if (releases.length === 0) throw new Error("No release found!");

  while (releases.length % itemsPerReleasePage == 0) {
    let page = releases.length / itemsPerReleasePage + 1;
    const response = await fetch(`${releasesUrl}?page=${page}`);
    releases.push(...await response.json());
  }

  $("#results").innerHTML = "";
  $("#total").innerHTML = `${getTotalDownloadCount(releases)} total downloads`;
  showReleases(releases);
};

$("#submit").addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    await fetchReleases($("#repo").value);
  } catch (e) {
    alert(e);
  }
});

$("#changelog").addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    await generateChangelog($("#repo").value);
  } catch (e) {
    alert(e);
  }
});
