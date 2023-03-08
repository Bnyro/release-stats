let $ = document.querySelector.bind(document);
let $$ = document.querySelectorAll.bind(document);

const baseUrl = "https://api.github.com";

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
  const response = await fetch(`${baseUrl}/repos/${repo}/releases`);
  if (response.status != 200) throw new Error("Repository not found!");
  const releases = await response.json();
  if (releases.length === 0) throw new Error("No release found!");
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
